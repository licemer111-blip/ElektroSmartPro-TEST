"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { bulkRecalculateLaborPrices } from "@/app/dashboard/catalog/bulk-recalculate-labor";
import { DEMO_PROJECT } from "@/lib/config/demo-project";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * v2.0 P0.3: Seed a ready-to-explore sample project for a brand-new user.
 * Runs once — only if the user has zero projects. Silent failure is OK
 * (onboarding must not block on this).
 */
async function seedDemoProjectIfEmpty(
  supabase: SupabaseClient,
  userId: string,
  hourlyRate: number,
  regionId: string | null,
): Promise<void> {
  try {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (count !== null && count > 0) return; // user already has projects, skip

    // Pick default object_type (mieszkanie / dom jednorodzinny) if available.
    // Fallback: first object_type in DB.
    const { data: objectTypeRow } = await supabase
      .from("object_types")
      .select("id")
      .in("slug", ["mieszkanie", "dom-jednorodzinny", "dom"])
      .limit(1)
      .maybeSingle();
    const { data: fallbackObjectType } = objectTypeRow
      ? { data: objectTypeRow }
      : await supabase.from("object_types").select("id").limit(1).maybeSingle();
    const objectTypeId = (objectTypeRow?.id ?? fallbackObjectType?.id) as string | undefined;
    if (!objectTypeId) {
      logger.error("[seedDemoProject] No object_types available — skip", { userId });
      return;
    }

    // Create the project with is_demo_project=true so PDF paywall is bypassed.
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: DEMO_PROJECT.name,
        status: "draft",
        region_id: regionId,
        object_type_id: objectTypeId,
        vat_rate: DEMO_PROJECT.vat_rate,
        client_name: DEMO_PROJECT.client_name,
        client_address: DEMO_PROJECT.client_address,
        client_nip: DEMO_PROJECT.client_nip,
        pdf_notes: DEMO_PROJECT.pdf_notes,
        default_hourly_rate: hourlyRate,
        is_demo_project: true,
      })
      .select("id")
      .single();

    if (projectError || !project) {
      logger.error("[seedDemoProject] Failed to create demo project", { userId }, projectError);
      return;
    }

    // Bulk insert items. Pre-group by section to preserve ordering.
    const projectItems = DEMO_PROJECT.items.map((item, index) => ({
      project_id: (project as { id: string }).id,
      section: item.section,
      name: item.name,
      description: item.description ?? null,
      unit: item.unit,
      quantity: item.quantity,
      material_price: item.material_price,
      labor_price: item.labor_price,
      final_material_price: item.material_price,
      final_labor_price: item.labor_price,
      knr_code: item.knr_code,
      knr_source: item.knr_code ? "system_knr" : null,
      labor_norm: item.labor_norm,
      labor_hours_total: item.labor_norm != null
        ? Math.round(item.labor_norm * item.quantity * 1000) / 1000
        : null,
      confidence_level: "verified" as const,
      confidence_note: "Demo — zweryfikowana norma KNR",
      sort_order: index + 1,
      is_custom: false,
      is_ai_generated: false,
    }));

    const { error: itemsError } = await supabase.from("project_items").insert(projectItems);
    if (itemsError) {
      logger.error("[seedDemoProject] Failed to insert demo items", { userId }, itemsError);
      // Keep the project even if items failed — better than nothing
    }
  } catch (err) {
    logger.error("[seedDemoProject] Unexpected error (non-fatal)", { userId }, err);
  }
}

/**
 * Complete the initial onboarding setup.
 * Saves hourly rate + region + marks profile as onboarding_completed.
 * Also propagates rate to all user projects and recalculates catalog/assembly prices.
 */
export async function completeOnboardingSetup(params: {
  hourlyRate: number;
  regionId: string | null;
  companyName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const { hourlyRate, regionId, companyName } = params;

    if (hourlyRate < 1 || hourlyRate > 9999) {
      return { success: false, error: "Stawka musi być między 1 a 9999 PLN/h" };
    }

    // Build profile update payload
    const profileUpdate: Record<string, unknown> = {
      hourly_rate: hourlyRate,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (regionId) {
      profileUpdate.default_region_id = regionId;
    }

    if (companyName && companyName.trim().length > 0) {
      profileUpdate.company_name = companyName.trim();
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (profileError) {
      logger.error("[completeOnboardingSetup] Profile update failed", {}, profileError);
      return { success: false, error: "Błąd zapisu profilu" };
    }

    // Propagate rate to all user projects
    await supabase
      .from("projects")
      .update({ default_hourly_rate: hourlyRate })
      .eq("user_id", user.id);

    // Propagate region to all user projects
    if (regionId) {
      await supabase
        .from("projects")
        .update({ region_id: regionId })
        .eq("user_id", user.id);
    }

    // Recalculate catalog & assembly labor prices with new rate
    await bulkRecalculateLaborPrices(hourlyRate).catch((err) => {
      logger.error("[completeOnboardingSetup] Recalc failed (non-fatal)", {}, err);
    });

    // v2.0 P0.3: Seed a showcase demo project (only if user has no projects yet).
    // This gives the new user an immediate aha-moment — they land on a fully
    // populated kosztorys with real KNR prices, not an empty dashboard.
    await seedDemoProjectIfEmpty(
      supabase as unknown as SupabaseClient,
      user.id,
      hourlyRate,
      regionId,
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/projects", "layout");

    return { success: true };
  } catch (err) {
    logger.error("[completeOnboardingSetup] Unexpected error", {}, err);
    return { success: false, error: "Nieoczekiwany błąd systemu" };
  }
}
