"use server";

// ═══════════════════════════════════════════════════════════════════
// zestaw-actions.ts
// ES-Engine Composer — Server actions for dynamic Zestaw unpacking.
// Adds a parent assembly row + auto-generated children based on recipe.
// ═══════════════════════════════════════════════════════════════════

import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { unpackCompositeItem, recalcChildrenQty } from "@/lib/services/composer-engine";
import { findRecipeByKeyword } from "@/lib/config/zestawy-recipes";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/actions";
import type { EngineCalibration } from "@/app/dashboard/settings/knr-calculator/_parts/KnrEngineCalibration";
import type { UnitType } from "@/lib/types/database";

// ─── addZestawToProject ───────────────────────────────────────────────────────

interface AddZestawParams {
  projectId: string;
  zestawName: string;
  quantity: number;
  section?: string | null;
  calibration: EngineCalibration;
}

export async function addZestawToProject({
  projectId,
  zestawName,
  quantity,
  section,
  calibration,
}: AddZestawParams): Promise<{ success: boolean; error: string | null; parentId?: string; addedCount?: number }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Nie jesteś zalogowany" };

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    if (projectError || !project) return { success: false, error: "Projekt nie znaleziony lub brak dostępu" };

    // Find recipe
    const recipe = findRecipeByKeyword(zestawName);
    if (!recipe) return { success: false, error: `Nie znaleziono receptury dla: "${zestawName}"` };

    // Unpack
    const result = unpackCompositeItem({ name: zestawName, quantity }, calibration);
    if (!result) return { success: false, error: "Nie można rozwinąć zestawu" };

    // Get current max sort_order
    const { data: maxSortData } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();
    let sortOrder = (maxSortData?.sort_order ?? 0) + 1;

    // Insert parent row
    const { data: parentRow, error: parentError } = await supabase
      .from("project_items")
      .insert({
        project_id:       projectId,
        catalog_item_id:  null,
        name:             result.recipe.label,
        description:      `Zestaw ES-Engine: ${result.recipe.label}`,
        metadata:         { recipe_key: result.recipe.key },
        unit:             "szt" as UnitType,
        quantity,
        material_price:   0,
        labor_price:      0,
        is_custom:        false,
        is_assembly_child: false,
        parent_assembly_id: null,
        section:          section ?? null,
        sort_order:       sortOrder++,
        knr_source:       "es_synthetic",
        confidence_level: "verified",
      })
      .select("id")
      .single();

    if (parentError || !parentRow) {
      logger.error("Error inserting zestaw parent:", {}, parentError);
      return { success: false, error: "Błąd podczas tworzenia nagłówka zestawu" };
    }

    const parentId = parentRow.id as string;

    // Insert children
    const children = result.children.map((child) => ({
      project_id:        projectId,
      catalog_item_id:   null,
      name:              child.label,
      description:       `Składnik zestawu: ${result.recipe.label}`,
      metadata:          child.metadata,
      unit:              child.unit,
      quantity:          child.quantity,
      material_price:    child.type === "material" ? 0 : 0,
      labor_price:       child.type === "robocizna" ? 0 : 0,
      is_custom:         false,
      is_assembly_child: true,
      parent_assembly_id: parentId,
      section:           section ?? null,
      sort_order:        sortOrder++,
      knr_code:          child.knrRef ?? null,
      labor_norm:        child.laborNormRbh ?? null,
      labor_hours_total: child.laborNormRbh != null ? child.laborNormRbh * child.quantity : null,
      knr_source:        child.knrRef ? "es_synthetic" : null,
      confidence_level:  child.knrRef ? "verified" : ("estimated" as const),
    }));

    const { error: childError } = await supabase
      .from("project_items")
      .insert(children);

    if (childError) {
      logger.error("Error inserting zestaw children:", {}, childError);
      await supabase.from("project_items").delete().eq("id", parentId);
      return { success: false, error: "Błąd podczas dodawania składników zestawu" };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, error: null, parentId, addedCount: 1 + children.length };

  } catch (err) {
    logger.error("Exception in addZestawToProject:", {}, err);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// ─── syncZestawChildren — linked-edit qty recalculation ────────────────────────

export async function syncZestawChildren(
  projectId: string,
  parentId: string,
  newParentQty: number
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, updatedCount: 0 };

    // Fetch current children
    const { data: children, error } = await supabase
      .from("project_items")
      .select("id, metadata, notes, quantity, labor_norm")
      .eq("parent_assembly_id", parentId)
      .eq("project_id", projectId);

    if (error || !children || children.length === 0) return { success: true, updatedCount: 0 };

    const updates = recalcChildrenQty(newParentQty, children);
    if (updates.length === 0) return { success: true, updatedCount: 0 };

    // Batch update each child
    await Promise.all(
      updates.map(({ id, newQty }) => {
        const child = children.find((c) => c.id === id);
        const laborNorm = child?.labor_norm ?? null;
        return updateProjectItem(projectId, id, {
          quantity: newQty,
          ...(laborNorm != null ? { labor_hours_total: Math.round(laborNorm * newQty * 100) / 100 } : {}),
        });
      })
    );

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedCount: updates.length };

  } catch (err) {
    logger.error("Exception in syncZestawChildren:", {}, err);
    return { success: false, updatedCount: 0 };
  }
}
