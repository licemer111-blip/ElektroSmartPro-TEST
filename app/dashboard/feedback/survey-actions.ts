"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// =====================================================
// SURVEY SUBMISSION
// =====================================================

interface SubmitSurveyInput {
  overall_rating: number;
  favorite_feature?: string;
  improvement_suggestion?: string;
  would_recommend?: boolean;
}

export async function submitSurvey(input: SubmitSurveyInput) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    if (!input.overall_rating || input.overall_rating < 1 || input.overall_rating > 5) {
      return { success: false, error: "Ocena musi być od 1 do 5" };
    }

    const { error } = await supabase.from("user_surveys").insert({
      user_id: user.id,
      overall_rating: input.overall_rating,
      favorite_feature: input.favorite_feature || null,
      improvement_suggestion: input.improvement_suggestion || null,
      would_recommend: input.would_recommend ?? null,
      metadata: {
        user_agent: "web",
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      logger.error("Survey insert error:", {}, error);
      return { success: false, error: "Nie udało się zapisać ankiety" };
    }

    // Update last_survey_at on profile
    await supabase
      .from("profiles")
      .update({ last_survey_at: new Date().toISOString() })
      .eq("id", user.id);

    return { success: true };
  } catch (err) {
    logger.error("submitSurvey error:", {}, err);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// =====================================================
// SHOULD SHOW SURVEY CHECK
// =====================================================

export async function shouldShowSurvey(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at, last_survey_at")
      .eq("id", user.id)
      .single();

    if (!profile) return false;

    // User must be registered for at least 3 days
    const registeredAt = new Date(profile.created_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (registeredAt > threeDaysAgo) return false;

    // If never surveyed, show
    if (!profile.last_survey_at) return true;

    // If surveyed more than 30 days ago, show again
    const lastSurvey = new Date(profile.last_survey_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastSurvey < thirtyDaysAgo;
  } catch {
    return false;
  }
}

// =====================================================
// ADMIN: SURVEY STATS
// =====================================================

export interface SurveyStats {
  totalSurveys: number;
  avgRating: number;
  npsScore: number; // % recommend - % not recommend
  ratingDistribution: Record<number, number>; // { 1: count, 2: count, ... }
  featurePopularity: Record<string, number>; // { "AI Lab": count, ... }
  totalFeedback: number;
}

export async function getSurveyStats(): Promise<SurveyStats> {
  // Admin check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  // Get all surveys
  const { data: surveys } = await supabaseAdmin
    .from("user_surveys")
    .select("overall_rating, favorite_feature, would_recommend");

  const allSurveys = surveys || [];

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let recommendYes = 0;
  let recommendNo = 0;
  const featurePopularity: Record<string, number> = {};

  for (const s of allSurveys) {
    ratingDistribution[s.overall_rating] = (ratingDistribution[s.overall_rating] || 0) + 1;
    totalRating += s.overall_rating;
    if (s.would_recommend === true) recommendYes++;
    if (s.would_recommend === false) recommendNo++;
    if (s.favorite_feature) {
      featurePopularity[s.favorite_feature] = (featurePopularity[s.favorite_feature] || 0) + 1;
    }
  }

  const total = allSurveys.length;
  const npsScore = total > 0
    ? Math.round(((recommendYes - recommendNo) / total) * 100)
    : 0;

  // Count feedback items
  const { count: feedbackCount } = await supabaseAdmin
    .from("feedback")
    .select("id", { count: "exact", head: true });

  return {
    totalSurveys: total,
    avgRating: total > 0 ? Math.round((totalRating / total) * 10) / 10 : 0,
    npsScore,
    ratingDistribution,
    featurePopularity,
    totalFeedback: feedbackCount || 0,
  };
}

// =====================================================
// ADMIN: GET ALL SURVEYS (paginated)
// =====================================================

export interface SurveyWithUser {
  id: string;
  created_at: string;
  user_id: string;
  overall_rating: number;
  favorite_feature: string | null;
  improvement_suggestion: string | null;
  would_recommend: boolean | null;
  user_email?: string;
  user_name?: string;
}

export async function getAllSurveys(page = 0, pageSize = 50): Promise<SurveyWithUser[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return [];

  const { data: surveys } = await supabaseAdmin
    .from("user_surveys")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (!surveys || surveys.length === 0) return [];

  // Fetch user profiles for these surveys
  const userIds = [...new Set(surveys.map(s => s.user_id))];
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, { name: p.full_name, email: p.email }])
  );

  return surveys.map(s => ({
    id: s.id,
    created_at: s.created_at,
    user_id: s.user_id,
    overall_rating: s.overall_rating,
    favorite_feature: s.favorite_feature,
    improvement_suggestion: s.improvement_suggestion,
    would_recommend: s.would_recommend,
    user_email: profileMap.get(s.user_id)?.email || "",
    user_name: profileMap.get(s.user_id)?.name || "",
  }));
}

// =====================================================
// ADMIN: GET ALL FEEDBACK (paginated)
// =====================================================

export interface FeedbackItem {
  id: string;
  created_at: string;
  user_id: string | null;
  type: string;
  message: string;
  contact_email: string | null;
  status: string;
}

export async function getAllFeedback(page = 0, pageSize = 50): Promise<FeedbackItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return [];

  const { data } = await supabaseAdmin
    .from("feedback")
    .select("id, created_at, user_id, type, message, contact_email, status")
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  return data || [];
}

// =====================================================
// ADMIN: UPDATE FEEDBACK STATUS
// =====================================================

export async function updateFeedbackStatus(feedbackId: string, status: "new" | "read" | "archived") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabaseAdmin
    .from("feedback")
    .update({ status })
    .eq("id", feedbackId);

  if (error) return { error: error.message };
  return { success: true };
}
