"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/utils/admin";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  is_pro: boolean;
  is_admin: boolean;
  role: string;
  max_projects: number;
  projects_count: number;
  created_at: string;
  last_sign_in_at: string | null;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  current_period_end: string | null;
}

export interface AdminKpiData {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  conversionRate: number;
  totalProjects: number;
  totalRevenuePln: number;
  blurViews: number;
  upgradeClicks: number;
  blurConversionRate: number;
  newUsersLast30d: number;
  newProLast30d: number;
}

export interface VoivodeshipStat {
  voivodeship: string;
  project_count: number;
  blur_views: number;
  upgrade_clicks: number;
}

export interface PopularAssemblyStat {
  assembly_name: string;
  usage_count: number;
}

// ─── KPI Overview ─────────────────────────────────────────────────────────────

export async function getAdminKpi(): Promise<{ data: AdminKpiData | null; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { data: null, error: "Unauthorized" };

    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: proUsers },
      { count: totalProjects },
      { data: revenue },
      { count: blurViews },
      { count: upgradeClicks },
      { count: newUsers },
      { count: newPro },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_pro", true),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount_total").eq("status", "succeeded"),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "blur_view"),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "upgrade_click"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_pro", true).gte("created_at", thirtyDaysAgo),
    ]);

    const total = totalUsers ?? 0;
    const pro = proUsers ?? 0;
    const free = total - pro;
    const conversionRate = total > 0 ? Math.round((pro / total) * 100 * 10) / 10 : 0;

    const totalRevenuePln = (revenue ?? []).reduce((sum, p) => sum + (p.amount_total ?? 0), 0) / 100;

    const bv = blurViews ?? 0;
    const uc = upgradeClicks ?? 0;
    const blurConversionRate = bv > 0 ? Math.round((uc / bv) * 100 * 10) / 10 : 0;

    return {
      data: {
        totalUsers: total,
        proUsers: pro,
        freeUsers: free,
        conversionRate,
        totalProjects: totalProjects ?? 0,
        totalRevenuePln,
        blurViews: bv,
        upgradeClicks: uc,
        blurConversionRate,
        newUsersLast30d: newUsers ?? 0,
        newProLast30d: newPro ?? 0,
      },
    };
  } catch (error: unknown) {
    logger.error("getAdminKpi failed", {}, error);
    return { data: null, error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Geography ────────────────────────────────────────────────────────────────

export async function getVoivodeshipStats(): Promise<{ data: VoivodeshipStat[]; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { data: [], error: "Unauthorized" };

    const supabase = await createClient();

    const { data: projects, error } = await supabase
      .from("projects")
      .select("region_id, regions(name)")
      .not("region_id", "is", null);

    if (error) return { data: [], error: error.message };

    const { data: blurEvents } = await supabase
      .from("analytics_events")
      .select("voivodeship, event_type")
      .in("event_type", ["blur_view", "upgrade_click"]);

    const countMap: Record<string, VoivodeshipStat> = {};

    for (const p of projects ?? []) {
      const name = (p.regions as { name?: string } | null)?.name ?? "Nieznany";
      if (!countMap[name]) countMap[name] = { voivodeship: name, project_count: 0, blur_views: 0, upgrade_clicks: 0 };
      countMap[name].project_count++;
    }

    for (const e of blurEvents ?? []) {
      const name = e.voivodeship ?? "Nieznany";
      if (!countMap[name]) countMap[name] = { voivodeship: name, project_count: 0, blur_views: 0, upgrade_clicks: 0 };
      if (e.event_type === "blur_view") countMap[name].blur_views++;
      if (e.event_type === "upgrade_click") countMap[name].upgrade_clicks++;
    }

    const sorted = Object.values(countMap).sort((a, b) => b.project_count - a.project_count);
    return { data: sorted };
  } catch (error: unknown) {
    logger.error("getVoivodeshipStats failed", {}, error);
    return { data: [], error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Popular Assemblies ───────────────────────────────────────────────────────

export async function getPopularAssemblies(): Promise<{ data: PopularAssemblyStat[]; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { data: [], error: "Unauthorized" };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("analytics_events")
      .select("metadata")
      .eq("event_type", "assembly_used");

    if (error) return { data: [], error: error.message };

    const countMap: Record<string, number> = {};
    for (const e of data ?? []) {
      const name = (e.metadata as { assembly_name?: string })?.assembly_name;
      if (name) countMap[name] = (countMap[name] ?? 0) + 1;
    }

    const sorted = Object.entries(countMap)
      .map(([assembly_name, usage_count]) => ({ assembly_name, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 20);

    return { data: sorted };
  } catch (error: unknown) {
    logger.error("getPopularAssemblies failed", {}, error);
    return { data: [], error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function getAdminUsers(page = 0, pageSize = 50): Promise<{
  users: AdminUser[];
  total: number;
  error?: string;
}> {
  try {
    const admin = await isAdmin();
    if (!admin) return { users: [], total: 0, error: "Unauthorized" };

    const supabase = await createClient();

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data: profiles, count, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, company_name, is_pro, role, max_projects, created_at, stripe_customer_id, subscription_id, current_period_end",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return { users: [], total: 0, error: error.message };

    // Get project counts in bulk
    const userIds = (profiles ?? []).map((p) => p.id);
    const { data: projectCounts } = await supabase
      .from("projects")
      .select("user_id")
      .in("user_id", userIds);

    const countMap: Record<string, number> = {};
    for (const p of projectCounts ?? []) {
      countMap[p.user_id] = (countMap[p.user_id] ?? 0) + 1;
    }

    // Get last_sign_in_at from auth.users via admin client
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const signInMap: Record<string, string | null> = {};
    const authEmailMap: Record<string, string> = {};
    for (const u of authUsers?.users ?? []) {
      signInMap[u.id] = u.last_sign_in_at ?? null;
      if (u.email) authEmailMap[u.id] = u.email;
    }

    const users: AdminUser[] = (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email || authEmailMap[p.id] || "",
      full_name: p.full_name ?? "",
      company_name: p.company_name ?? "",
      is_pro: p.is_pro ?? false,
      is_admin: (p.role ?? "user") === "admin",
      role: p.role ?? "user",
      max_projects: p.max_projects ?? 1,
      projects_count: countMap[p.id] ?? 0,
      created_at: p.created_at ?? "",
      last_sign_in_at: signInMap[p.id] ?? null,
      stripe_customer_id: p.stripe_customer_id ?? null,
      subscription_id: p.subscription_id ?? null,
      current_period_end: p.current_period_end ?? null,
    }));

    return { users, total: count ?? 0 };
  } catch (error: unknown) {
    logger.error("getAdminUsers failed", {}, error);
    return { users: [], total: 0, error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Manual Override ──────────────────────────────────────────────────────────

export async function adminUpdateUser(
  targetUserId: string,
  updates: { is_pro?: boolean; max_projects?: number; role?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: "Unauthorized" };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    logger.error("adminUpdateUser failed", { targetUserId }, error);
    return { success: false, error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Reset AI Usage Counters for a User ──────────────────────────────────────

export async function adminResetAiUsage(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: "Unauthorized" };

    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .update({ ai_usage_count: 0, ai_usage_reset_at: new Date().toISOString() })
        .eq("id", targetUserId),
      supabaseAdmin
        .from("ai_usage_stats")
        .delete()
        .eq("user_id", targetUserId),
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    logger.error("adminResetAiUsage failed", { targetUserId }, error);
    return { success: false, error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Delete User (auth + all data via cascade) ───────────────────────────────

export async function adminDeleteUser(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: "Unauthorized" };

    // Prevent self-deletion
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === targetUserId) {
      return { success: false, error: "Nie możesz usunąć własnego konta" };
    }

    // Use service role to delete auth user — cascades to all public schema tables
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (error) {
      logger.error("adminDeleteUser failed", { targetUserId }, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    logger.error("adminDeleteUser exception", { targetUserId }, error);
    return { success: false, error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Reset Statistics ─────────────────────────────────────────────────────────

export async function resetStats(): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: "Unauthorized" };

    await Promise.all([
      supabaseAdmin.from("analytics_events").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("subscription_invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    ]);

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: unknown) {
    logger.error("resetStats failed", {}, error);
    return { success: false, error: error instanceof Error ? error.message : "Błąd" };
  }
}

// ─── Event Logging (called from client via server action) ─────────────────────

export async function logAnalyticsEvent(
  eventType: "blur_view" | "upgrade_click" | "pdf_blocked" | "assembly_used",
  payload?: { voivodeship?: string; projectId?: string; assemblyId?: string; assemblyName?: string }
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      voivodeship: payload?.voivodeship ?? null,
      project_id: payload?.projectId ?? null,
      assembly_id: payload?.assemblyId ?? null,
      metadata: payload?.assemblyName ? { assembly_name: payload.assemblyName } : {},
    });
  } catch {
    // Silent fail — analytics must never break the UI
  }
}
