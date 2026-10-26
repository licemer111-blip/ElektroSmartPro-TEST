"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { getAiFunctionUsage } from "@/lib/ai-usage";
import { generateEstimateItems, type EstimateItem, type ObjectTypeKey, type QualityStandard, type ZakresPrac, type ConditionalFields } from "@/lib/quick-estimate-config";
import { computeComplexityFromContext } from "@/lib/pricing-complexity";
import { logger } from "@/lib/logger";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";
import { lookupKnrByName } from "@/lib/knr-local-context";

function stampEsLabor(items: EstimateItem[], hourlyRate: number): EstimateItem[] {
  const rate = hourlyRate >= 1 ? hourlyRate : 0;
  return items.map((item) => {
    if (rate < 1) return { ...item, base_labor_price: 0, labor_norm: null };
    const match = lookupKnrByName(item.name);
    if (!match || match.laborNorm <= 0) return item;
    return {
      ...item,
      knr_code: match.code,
      labor_norm: match.laborNorm,
      base_labor_price: Math.round(match.laborNorm * rate * 100) / 100,
    };
  });
}

/**
 * Build the quick-estimate lines from the local room rules.
 * Material zł comes from those rules. Labor zł is rbh × the electrician's rate,
 * with no voivodeship — the project screen multiplies region once.
 */
export async function generateQuickEstimateWithAI(params: {
  objectType: ObjectTypeKey;
  areaM2: number;
  roomCount: number;
  standard: QualityStandard;
  zakres?: ZakresPrac[];
  conditionalFields?: ConditionalFields;
}): Promise<{ success: boolean; items?: EstimateItem[]; remaining?: number; error?: string; fallback?: boolean }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz byc zalogowany" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("hourly_rate")
      .eq("id", user.id)
      .maybeSingle();
    const rate = Number((profile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0);
    const items = stampEsLabor(generateEstimateItems(params), rate);
    return { success: true, items, fallback: true };
  } catch (err) {
    logger.error("Quick estimate build failed", {}, err);
    return { success: false, error: "Nie udalo sie policzyc pozycji" };
  }
}

export async function createQuickEstimateProject(params: {
  name: string;
  regionId: string;
  objectTypeId: string;
  vatRate: number;
  items: EstimateItem[];
  /** v4.1 (Phase 7): wizard's conditional fields. Used to derive
   *  project.complexity_factor (single labor multiplier) and persisted as-is
   *  to project.quick_estimate_context for transparent UI breakdown. */
  conditionalFields?: ConditionalFields;
}): Promise<{ success?: boolean; error?: string; projectId?: string }> {
  const { user, supabase } = await tryAuth();

  if (!user || !supabase) {
    return { error: "Musisz byc zalogowany" };
  }

  if (!params.name.trim()) {
    return { error: "Nazwa projektu jest wymagana" };
  }

  if (params.items.length === 0) {
    return { error: "Brak pozycji do dodania" };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, hourly_rate, is_pro, max_projects")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email || "",
    });
  }

  // v2.0: free tier — limit tylko jeśli admin jawnie ustawił niski limit (<100).
  {
    const maxAllowed = getEffectiveMaxProjects(existingProfile as { is_pro?: boolean; max_projects?: number } | null);
    if (existingProfile && !existingProfile.is_pro && maxAllowed < 100) {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "archived")
        .or("is_demo_project.is.null,is_demo_project.eq.false");
      if (count !== null && count >= maxAllowed) {
        return {
          error: `Dla Twojego konta obowiązuje limit ${maxAllowed} projektów. Przejdź na PRO, aby tworzyć nielimitowane projekty.`,
        };
      }
    }
  }

  const defaultHourlyRate = (existingProfile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

  const { data: region } = await supabase
    .from("regions")
    .select("price_modifier")
    .eq("id", params.regionId)
    .single();

  // Keep priceModifier for reference (Iron Rule: only used on labor, and only to store BASE here)
  void (region?.price_modifier); // regionModifier applied by calcRowPrices at display time

  // v4.1 (Phase 7): derive complexity_factor from wizard's conditional fields.
  // Single labor multiplier that ProjectSummary + EstimateRow apply at display time.
  // Raw fields persisted to quick_estimate_context for transparent UI breakdown.
  const complexity = computeComplexityFromContext(params.conditionalFields);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: params.name.trim(),
      region_id: params.regionId,
      object_type_id: params.objectTypeId,
      vat_rate: params.vatRate,
      status: "draft",
      default_hourly_rate: defaultHourlyRate,
      complexity_factor: complexity.factor,
      quick_estimate_context: params.conditionalFields ?? null,
    })
    .select()
    .single();

  if (projectError || !project) {
    logger.error("Error creating quick estimate project", { name: params.name }, projectError);
    return { error: "Blad podczas tworzenia projektu" };
  }

  // Same zł as the wizard. Region and complexity are applied again on the project screen.
  // is_quick_estimate keeps the zestaw engine from wrapping these lines a second time.
  const projectItems = params.items.map((item, index) => ({
    project_id: project.id,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    material_price: item.base_material_price,
    labor_price: item.base_labor_price,
    final_material_price: item.base_material_price,
    final_labor_price: item.base_labor_price,
    labor_norm: item.labor_norm ?? null,
    labor_hours_total: item.labor_norm ? Math.round(item.labor_norm * item.quantity * 100) / 100 : null,
    is_custom: true,
    is_quick_estimate: true,
    knr_code: item.knr_code || null,
    knr_source: item.labor_norm ? "system_knr" : null,
    confidence_level: item.labor_norm ? "verified" : "uncertain",
    sort_order: index + 1,
  }));

  const { error: itemsError } = await supabase
    .from("project_items")
    .insert(projectItems);

  if (itemsError) {
    logger.error("Error inserting quick estimate items", { projectId: project.id, itemCount: params.items.length }, itemsError);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${project.id}`);
    return { success: true, projectId: project.id };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${project.id}`);

  return { success: true, projectId: project.id };
}

/**
 * Get current AI usage for quick estimate (read-only, no increment).
 */
export async function getQuickEstimateUsage(): Promise<{ used: number; limit: number; remaining: number } | null> {
  try {
    const { user } = await tryAuth();
    if (!user) return null;
    return await getAiFunctionUsage(user.id, "quickEstimate");
  } catch {
    return null;
  }
}
