"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/utils/admin";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceStatus {
  name: string;
  status: "ok" | "warn" | "error";
  latencyMs?: number;
  detail: string;
}

export interface BillingError {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: string;
  error_message: string | null;
  user_email: string | null;
  created_at: string;
}

export interface RecentUser {
  id: string;
  email: string | null;
  company_name: string | null;
  is_pro: boolean;
  created_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

export interface AiUsageStat {
  user_id: string;
  user_email: string | null;
  function_name: string;
  usage_count: number;
  reset_at: string | null;
}

export interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  contact_email: string | null;
  status: string;
  created_at: string;
  user_email: string | null;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  user_email: string | null;
  action_type: string;
  description: string | null;
  created_at: string;
}

export interface MonitoringStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalProjects: number;
  stripeErrors: number;
  pendingFeedback: number;
  aiCallsToday: number;
  activeSubscriptions: number;
}

export interface MonitoringData {
  services: ServiceStatus[];
  stats: MonitoringStats;
  billingErrors: BillingError[];
  recentUsers: RecentUser[];
  aiUsage: AiUsageStat[];
  feedback: FeedbackItem[];
  activity: ActivityItem[];
  generatedAt: string;
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function getMonitoringData(): Promise<{ data: MonitoringData | null; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { data: null, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    // ── Run all queries in parallel ──────────────────────────────────────────
    const [
      // Service: Supabase ping
      supabasePing,
      // Stats
      totalUsersRes,
      proUsersRes,
      totalProjectsRes,
      activeSubsRes,
      // Billing errors
      billingErrorsRes,
      // Recent users
      recentUsersRes,
      // AI usage
      aiUsageRes,
      // Feedback
      feedbackRes,
      // Activity log
      activityRes,
      // Pending feedback count
      pendingFeedbackRes,
      // AI calls today
      aiTodayRes,
    ] = await Promise.all([
      // Supabase ping — count rows in a lightweight table
      (async () => {
        const start = Date.now();
        const { error } = await supabase.from("regions").select("id", { count: "exact", head: true });
        return { latency: Date.now() - start, error };
      })(),

      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_pro", true),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .eq("is_pro", true)
        .eq("cancel_at_period_end", false)
        .not("subscription_id", "is", null),

      // Billing errors — last 50 failed events
      supabase.from("billing_events")
        .select("id, stripe_event_id, event_type, status, error_message, user_id, created_at")
        .or("status.eq.failed,error_message.not.is.null")
        .order("created_at", { ascending: false })
        .limit(50),

      // Recent users — last 30
      supabase.from("profiles")
        .select("id, email, company_name, is_pro, created_at, current_period_end, cancel_at_period_end")
        .order("created_at", { ascending: false })
        .limit(30),

      // AI usage — all stats with user emails
      supabase.from("ai_usage_stats")
        .select("user_id, function_name, usage_count, reset_at")
        .order("usage_count", { ascending: false })
        .limit(100),

      // Feedback — last 30
      supabase.from("feedback")
        .select("id, type, message, contact_email, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(30),

      // Activity log — last 50
      supabase.from("activity_logs")
        .select("id, user_id, action_type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(50),

      // Pending feedback count
      supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "new"),

      // AI calls today
      supabase.from("ai_usage_stats")
        .select("usage_count")
        .gte("reset_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    // ── Build service statuses ────────────────────────────────────────────────
    const services: ServiceStatus[] = [
      {
        name: "Supabase DB",
        status: supabasePing.error ? "error" : supabasePing.latency > 1000 ? "warn" : "ok",
        latencyMs: supabasePing.latency,
        detail: supabasePing.error
          ? `Błąd: ${supabasePing.error.message}`
          : `Odpowiedź: ${supabasePing.latency}ms`,
      },
      {
        name: "Stripe",
        status: process.env.STRIPE_SECRET_KEY ? "ok" : "error",
        detail: process.env.STRIPE_SECRET_KEY ? "Klucze skonfigurowane" : "STRIPE_SECRET_KEY brakuje",
      },
      {
        name: "Resend Email",
        status: process.env.RESEND_API_KEY ? "ok" : "error",
        detail: process.env.RESEND_API_KEY ? "Klucze skonfigurowane" : "RESEND_API_KEY brakuje",
      },
      {
        name: "Google Gemini AI",
        status: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "ok" : "error",
        detail: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Klucze skonfigurowane" : "GOOGLE_GENERATIVE_AI_API_KEY brakuje",
      },
      {
        name: "LiveKit",
        status: process.env.LIVEKIT_API_KEY ? "ok" : "warn",
        detail: process.env.LIVEKIT_API_KEY ? "Klucze skonfigurowane" : "LIVEKIT_API_KEY brakuje (opcjonalny)",
      },
      {
        name: "Push (VAPID)",
        status: process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "ok" : "warn",
        detail: process.env.VAPID_PRIVATE_KEY ? "Klucze skonfigurowane" : "VAPID_PRIVATE_KEY brakuje",
      },
      {
        name: "Sentry",
        status: process.env.NEXT_PUBLIC_SENTRY_DSN ? "ok" : "warn",
        detail: process.env.NEXT_PUBLIC_SENTRY_DSN ? "Monitoring błędów aktywny" : "SENTRY_DSN brakuje",
      },
    ];

    // ── Get user emails for billing errors ───────────────────────────────────
    const billingUserIds = (billingErrorsRes.data ?? [])
      .map(e => e.user_id)
      .filter(Boolean) as string[];

    const emailMap = new Map<string, string>();

    if (billingUserIds.length > 0) {
      const { data: emailProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", [...new Set(billingUserIds)]);
      for (const p of emailProfiles ?? []) {
        if (p.email) emailMap.set(p.id, p.email);
      }
    }

    // ── Get user emails for AI usage ─────────────────────────────────────────
    const aiUserIds = [...new Set((aiUsageRes.data ?? []).map(r => r.user_id).filter(Boolean))];
    if (aiUserIds.length > 0) {
      const { data: aiProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", aiUserIds);
      for (const p of aiProfiles ?? []) {
        if (p.email) emailMap.set(p.id, p.email);
      }
    }

    // ── Get user emails for activity log ─────────────────────────────────────
    const activityUserIds = [...new Set((activityRes.data ?? []).map(r => r.user_id).filter(Boolean))];
    if (activityUserIds.length > 0) {
      const { data: actProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", activityUserIds);
      for (const p of actProfiles ?? []) {
        if (p.email) emailMap.set(p.id, p.email);
      }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    const aiTodayTotal = (aiTodayRes.data ?? []).reduce((sum, r) => sum + (r.usage_count ?? 0), 0);

    const stats: MonitoringStats = {
      totalUsers: totalUsersRes.count ?? 0,
      proUsers: proUsersRes.count ?? 0,
      freeUsers: (totalUsersRes.count ?? 0) - (proUsersRes.count ?? 0),
      totalProjects: totalProjectsRes.count ?? 0,
      stripeErrors: (billingErrorsRes.data ?? []).filter(e => e.status === "failed").length,
      pendingFeedback: pendingFeedbackRes.count ?? 0,
      aiCallsToday: aiTodayTotal,
      activeSubscriptions: activeSubsRes.count ?? 0,
    };

    // ── Build final data ──────────────────────────────────────────────────────
    const billingErrors: BillingError[] = (billingErrorsRes.data ?? []).map(e => ({
      id: e.id,
      stripe_event_id: e.stripe_event_id,
      event_type: e.event_type,
      status: e.status,
      error_message: e.error_message,
      user_email: e.user_id ? (emailMap.get(e.user_id) ?? null) : null,
      created_at: e.created_at,
    }));

    const recentUsers: RecentUser[] = (recentUsersRes.data ?? []).map(u => ({
      id: u.id,
      email: u.email,
      company_name: u.company_name,
      is_pro: u.is_pro ?? false,
      created_at: u.created_at,
      current_period_end: u.current_period_end,
      cancel_at_period_end: u.cancel_at_period_end,
    }));

    const aiUsage: AiUsageStat[] = (aiUsageRes.data ?? []).map(r => ({
      user_id: r.user_id,
      user_email: emailMap.get(r.user_id) ?? null,
      function_name: r.function_name,
      usage_count: r.usage_count,
      reset_at: r.reset_at,
    }));

    const feedback: FeedbackItem[] = (feedbackRes.data ?? []).map(f => ({
      id: f.id,
      type: f.type,
      message: f.message,
      contact_email: f.contact_email,
      status: f.status,
      created_at: f.created_at,
      user_email: f.user_id ? (emailMap.get(f.user_id) ?? null) : null,
    }));

    const activity: ActivityItem[] = (activityRes.data ?? []).map(a => ({
      id: a.id,
      user_id: a.user_id,
      user_email: emailMap.get(a.user_id) ?? null,
      action_type: a.action_type,
      description: a.description,
      created_at: a.created_at,
    }));

    return {
      data: {
        services,
        stats,
        billingErrors,
        recentUsers,
        aiUsage,
        feedback,
        activity,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    logger.error("[Monitoring] Unexpected error", {}, err);
    return { data: null, error: "Nieoczekiwany błąd monitoringu" };
  }
}
