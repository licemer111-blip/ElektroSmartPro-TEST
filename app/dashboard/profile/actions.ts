"use server";

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { DEMO_AI_LIMIT, PRO_AI_LIMIT } from "@/lib/ai-quota-config";

export interface ProfileStats {
  profile: {
    email: string;
    fullName: string | null;
    companyName: string | null;
    phone: string | null;
    city: string | null;
    isPro: boolean;
    createdAt: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hourlyRate: number | null;
    regionName: string | null;
    logoUrl: string | null;
  };
  stats: {
    projectsTotal: number;
    projectsDraft: number;
    projectsFinal: number;
    projectsArchived: number;
    totalItems: number;
    aiUsageCount: number;
    aiLimit: number;
    clientsCount: number;
    assembliesCount: number;
    catalogItemsCount: number;
  };
}

export async function getProfileStats(userEmail: string): Promise<ProfileStats | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Step 1: Fetch profile (simple query, no joins)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      logger.error("[getProfileStats] Profile fetch failed", {}, profileError);
      return null;
    }

    // Step 2: Fetch region name + projects in parallel
    const [regionResult, projectsResult] = await Promise.all([
      profile.default_region_id
        ? supabase.from("regions").select("name").eq("id", profile.default_region_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("projects").select("id, status").eq("user_id", user.id),
    ]);

    const projects = projectsResult.data || [];
    const projectIds = projects.map((p: { id: string }) => p.id);
    const regionName = regionResult.data?.name ?? null;

    // Step 3: Parallel counts
    const [itemsResult, clientsResult, assembliesResult, catalogResult] = await Promise.all([
      projectIds.length > 0
        ? supabase
            .from("project_items")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
        : Promise.resolve({ count: 0 }),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_assemblies")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("catalog_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    return {
      profile: {
        email: user.email || "",
        fullName: profile.full_name,
        companyName: profile.company_name,
        phone: profile.phone,
        city: profile.city,
        isPro: profile.is_pro ?? false,
        createdAt: profile.created_at,
        currentPeriodEnd: profile.current_period_end,
        cancelAtPeriodEnd: profile.cancel_at_period_end ?? false,
        hourlyRate: profile.hourly_rate ?? null,
        regionName,
        logoUrl: profile.logo_url ?? null,
      },
      stats: {
        projectsTotal: projects.length,
        projectsDraft: projects.filter((p: { id: string; status: string }) => p.status === "draft").length,
        projectsFinal: projects.filter((p: { id: string; status: string }) => p.status === "final").length,
        projectsArchived: projects.filter((p: { id: string; status: string }) => p.status === "archived").length,
        totalItems: itemsResult.count || 0,
        aiUsageCount: profile.ai_usage_count ?? 0,
        aiLimit: profile.is_pro ? PRO_AI_LIMIT : DEMO_AI_LIMIT,
        clientsCount: clientsResult.count || 0,
        assembliesCount: assembliesResult.count || 0,
        catalogItemsCount: catalogResult.count || 0,
      },
    };
  } catch (error) {
    logger.error("[getProfileStats] Unexpected error", {}, error);
    return null;
  }
}
