"use server";

import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  getUserCatalogForMatching,
  findBestCatalogMatch,
  type ExtractedMaterial,
} from "./ai-excel-actions";

// ─── Read helpers ─────────────────────────────────────────────────────────────

export async function getRegionsForQuickEstimate(): Promise<
  { id: string; name: string; price_modifier: number }[]
> {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("regions")
      .select("id, name, price_modifier")
      .order("name");
    return data || [];
  } catch {
    return [];
  }
}

export async function getObjectTypesForQuickEstimate(): Promise<
  { id: string; name: string; default_vat_rate: number }[]
> {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("object_types")
      .select("id, name, default_vat_rate")
      .order("name");
    return data || [];
  } catch {
    return [];
  }
}

// ─── Add materials to existing project ───────────────────────────────────────

export async function addMaterialsToProject(
  projectId: string,
  materials: ExtractedMaterial[]
): Promise<{
  success: boolean;
  error?: string;
  addedCount?: number;
  matchedCount?: number;
}> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({
      user: null,
      supabase: null,
    }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    const { data: project } = await supabase
      .from("projects")
      .select("user_id, region_id, regions(price_modifier)")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return { success: false, error: "Nie masz uprawnień do tego projektu" };
    }

    const catalogItems = await getUserCatalogForMatching();

    const { data: maxSortData } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextSortOrder = (maxSortData?.sort_order || 0) + 1;
    let matchedCount = 0;

    const projectItems = materials.map((material) => {
      const catalogMatch = findBestCatalogMatch(material.name, catalogItems);

      if (catalogMatch) {
        matchedCount++;
        return {
          project_id: projectId,
          catalog_item_id: catalogMatch.id,
          name: catalogMatch.name,
          unit: catalogMatch.unit || material.unit,
          quantity: material.quantity,
          material_price: catalogMatch.base_material_price || 0,
          labor_price: catalogMatch.base_labor_price || 0,
          final_material_price: catalogMatch.base_material_price || 0,
          final_labor_price: catalogMatch.base_labor_price || 0, // BASE — calcRowPrices applies regionModifier at display
          is_custom: false,
          sort_order: nextSortOrder++,
          description: "Dodano przez ES Import (dopasowano z katalogu)",
        };
      }

      const aiMaterialPrice =
        material.material_price && material.material_price > 0
          ? material.material_price
          : 0;
      const aiLaborPrice =
        material.labor_price && material.labor_price > 0
          ? material.labor_price
          : 0;

      return {
        project_id: projectId,
        catalog_item_id: null,
        name: material.name,
        unit: material.unit,
        quantity: material.quantity,
        material_price: aiMaterialPrice,
        labor_price: aiLaborPrice,
        final_material_price: aiMaterialPrice,
        final_labor_price: aiLaborPrice, // BASE — calcRowPrices applies regionModifier at display time
        is_custom: true,
        sort_order: nextSortOrder++,
        description:
          aiMaterialPrice > 0 || aiLaborPrice > 0
            ? "Dodano przez ES Import (ES-KNR 2026)"
            : "Dodano przez ES Import",
      };
    });

    const { error: insertError } = await supabase
      .from("project_items")
      .insert(projectItems);

    if (insertError) {
      logger.error("Error inserting materials to project", {}, insertError);
      return { success: false, error: "Błąd podczas dodawania materiałów" };
    }

    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/dashboard/projects/${projectId}`);

    return { success: true, addedCount: materials.length, matchedCount };
  } catch (error) {
    logger.error("Exception in addMaterialsToProject", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// ─── Create quick estimate project from materials ─────────────────────────────

export async function createQuickEstimateFromMaterials(input: {
  materials: ExtractedMaterial[];
  projectName: string;
  regionId: string;
  objectTypeId: string;
  vatRate: number;
}): Promise<{
  success: boolean;
  projectId?: string;
  error?: string;
  matchedCount?: number;
}> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({
      user: null,
      supabase: null,
    }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Check free-tier project limit (same as createProject)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, max_projects, hourly_rate")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_pro) {
      const maxAllowed = (profile as { is_pro: boolean; max_projects?: number }).max_projects ?? 3;
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count !== null && count >= maxAllowed) {
        return {
          success: false,
          error: `Plan darmowy pozwala na ${maxAllowed} aktywne projekty. Przejdź na PRO, aby tworzyć nielimitowane projekty.`,
        };
      }
    }

    const aiLabLaborRate = (profile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: input.projectName,
        region_id: input.regionId,
        object_type_id: input.objectTypeId,
        vat_rate: input.vatRate,
        status: "draft",
        default_hourly_rate: aiLabLaborRate,
      })
      .select("id")
      .single();

    if (projectError || !project) {
      logger.error("Error creating project", {}, projectError);
      return { success: false, error: "Błąd podczas tworzenia projektu" };
    }

    const catalogItems = await getUserCatalogForMatching();
    let sortOrder = 1;
    let matchedCount = 0;

    const projectItems = input.materials.map((material) => {
      const catalogMatch = findBestCatalogMatch(material.name, catalogItems);

      if (catalogMatch) {
        matchedCount++;
        return {
          project_id: project.id,
          catalog_item_id: catalogMatch.id,
          name: catalogMatch.name,
          unit: catalogMatch.unit || material.unit,
          quantity: material.quantity,
          material_price: catalogMatch.base_material_price || 0,
          labor_price: catalogMatch.base_labor_price || 0,
          final_material_price: catalogMatch.base_material_price || 0,
          final_labor_price: catalogMatch.base_labor_price || 0, // BASE — calcRowPrices applies regionModifier at display
          is_custom: false,
          sort_order: sortOrder++,
          description: "Szybka wycena z ES Import",
        };
      }

      const aiMaterialPrice =
        material.material_price && material.material_price > 0
          ? material.material_price
          : 0;
      const aiLaborPrice =
        material.labor_price && material.labor_price > 0
          ? material.labor_price
          : 0;

      return {
        project_id: project.id,
        catalog_item_id: null,
        name: material.name,
        unit: material.unit,
        quantity: material.quantity,
        material_price: aiMaterialPrice,
        labor_price: aiLaborPrice,
        final_material_price: aiMaterialPrice,
        final_labor_price: aiLaborPrice, // BASE — calcRowPrices applies regionModifier at display time
        is_custom: true,
        sort_order: sortOrder++,
        description:
          aiMaterialPrice > 0 || aiLaborPrice > 0
            ? "Szybka wycena z ES Import (ES-KNR 2026)"
            : "Szybka wycena z ES Import (brak dopasowania w katalogu)",
      };
    });

    const { error: insertError } = await supabase
      .from("project_items")
      .insert(projectItems);

    if (insertError) {
      logger.error("Error inserting project items", {}, insertError);
      await supabase.from("projects").delete().eq("id", project.id);
      return {
        success: false,
        error: "Błąd podczas dodawania pozycji do projektu",
      };
    }

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${project.id}`);

    return { success: true, projectId: project.id, matchedCount };
  } catch (error) {
    logger.error("Exception in createQuickEstimateFromMaterials", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}
