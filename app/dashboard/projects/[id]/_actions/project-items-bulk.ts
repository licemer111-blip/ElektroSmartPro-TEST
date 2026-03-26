"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { canUserEditProject, revalidateProject } from "./utils";

// =====================================================
// BULK OPERATIONS
// =====================================================

export async function bulkDeleteProjectItems(projectId: string, itemIds: string[]) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!itemIds.length) return { error: "Brak pozycji do usunięcia" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Brak uprawnień do edycji tego projektu" };

  const { error: childError } = await supabase
    .from("project_items").delete().eq("project_id", projectId).in("parent_assembly_id", itemIds);
  if (childError) logger.error("Error deleting assembly children", { projectId }, childError);

  const { error } = await supabase
    .from("project_items").delete().eq("project_id", projectId).in("id", itemIds);

  if (error) {
    logger.error("Error bulk deleting items", { projectId }, error);
    return { error: "Błąd podczas usuwania pozycji" };
  }

  revalidateProject(projectId);
  return { success: true, count: itemIds.length };
}

export async function bulkUpdateItemPrices(
  projectId: string,
  itemIds: string[],
  adjustPercent: number
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!itemIds.length) return { error: "Brak pozycji do aktualizacji" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Brak uprawnień do edycji tego projektu" };

  const { data: items, error: fetchError } = await supabase
    .from("project_items")
    .select("id, final_material_price, material_price, final_labor_price, labor_price")
    .eq("project_id", projectId).in("id", itemIds);

  if (fetchError || !items) return { error: "Błąd podczas pobierania pozycji" };

  const multiplier = 1 + adjustPercent / 100;

  await Promise.all(items.map(async (item) => {
    const matPrice = item.final_material_price ?? item.material_price ?? 0;
    const labPrice = item.final_labor_price ?? item.labor_price ?? 0;
    const newMat = Math.round(matPrice * multiplier * 100) / 100;
    const newLab = Math.round(labPrice * multiplier * 100) / 100;
    await supabase.from("project_items").update({
      material_price: newMat,
      labor_price: newLab,
      final_material_price: newMat,
      final_labor_price: newLab,
      confidence_level: null,
    }).eq("id", item.id);
  }));

  revalidateProject(projectId);
  return { success: true, count: items.length };
}

export async function bulkUpdateItemSection(
  projectId: string,
  itemIds: string[],
  section: string | null
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!itemIds.length) return { error: "Brak pozycji do aktualizacji" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Brak uprawnień do edycji tego projektu" };

  const { error } = await supabase
    .from("project_items").update({ section: section || null })
    .eq("project_id", projectId).in("id", itemIds);

  if (error) {
    logger.error("Error bulk updating section", { projectId }, error);
    return { error: "Błąd podczas aktualizacji sekcji" };
  }

  revalidateProject(projectId);
  return { success: true, count: itemIds.length };
}

// =====================================================
// SORT ORDER
// =====================================================

export async function updateItemSortOrder(projectId: string, orderedIds: string[]) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Brak uprawnień do edycji tego projektu" };

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from("project_items")
      .update({ sort_order: i }).eq("id", orderedIds[i]).eq("project_id", projectId);
  }

  revalidateProject(projectId);
  return { success: true };
}

export async function reorderProjectItems(
  projectId: string,
  orderedIds: string[]
): Promise<{ error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Brak autoryzacji" };

  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("project_items").update({ sort_order: idx }).eq("id", id).eq("project_id", projectId)
    )
  );
  return {};
}

// =====================================================
// IMPORT OPERATIONS
// =====================================================

export async function copyItemsToProject(
  targetProjectId: string,
  items: { name: string; unit: string; quantity: number; final_material_price: number; final_labor_price: number; catalog_item_id: string | null; section?: string | null }[]
): Promise<{ success?: boolean; error?: string; count?: number }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (items.length === 0) return { error: "Brak pozycji do skopiowania" };

  const canEdit = await canUserEditProject(supabase, targetProjectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do edycji projektu docelowego" };

  const { data: existingItems } = await supabase
    .from("project_items").select("sort_order").eq("project_id", targetProjectId)
    .order("sort_order", { ascending: false }).limit(1);

  const startOrder = (existingItems?.[0]?.sort_order || 0) + 1;

  const projectItems = items.map((item, index) => ({
    project_id: targetProjectId,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    final_material_price: item.final_material_price,
    final_labor_price: item.final_labor_price,
    catalog_item_id: item.catalog_item_id,
    section: item.section || null,
    sort_order: startOrder + index,
  }));

  const { error } = await supabase.from("project_items").insert(projectItems);
  if (error) {
    logger.error("Error copying items", { targetProjectId }, error);
    return { error: "Błąd podczas kopiowania pozycji" };
  }

  revalidateProject(targetProjectId);
  return { success: true, count: items.length };
}

export async function importItemsToProject(
  projectId: string,
  items: {
    name: string;
    unit: string;
    quantity: number;
    material_price: number;
    labor_price: number;
    knr_code?: string | null;
    knr_source?: string | null;
    labor_norm?: number | null;
  }[]
): Promise<{ success?: boolean; error?: string; count?: number }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (items.length === 0) return { error: "Brak pozycji do importu" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do edycji tego projektu" };

  const { data: proj } = await supabase.from("projects").select("status").eq("id", projectId).single();
  if (proj?.status === "final") return { error: "Projekt jest zablokowany. Odblokuj go, aby importować pozycje." };

  const { data: existingItems } = await supabase
    .from("project_items").select("sort_order").eq("project_id", projectId)
    .order("sort_order", { ascending: false }).limit(1);

  const startOrder = (existingItems?.[0]?.sort_order || 0) + 1;

  const projectItems = items.map((item, index) => {
    const laborNorm = item.labor_norm ?? null;
    const qty = item.quantity || 1;
    const laborHoursTotal = laborNorm != null ? parseFloat((laborNorm * qty).toFixed(4)) : null;
    return {
      project_id: projectId,
      name: item.name,
      unit: item.unit || "szt",
      quantity: qty,
      final_material_price: item.material_price || 0,
      final_labor_price: item.labor_price || 0,
      is_custom: true,
      sort_order: startOrder + index,
      knr_code: item.knr_code || null,
      knr_source: item.knr_source || null,
      labor_norm: laborNorm,
      labor_hours_total: laborHoursTotal,
    };
  });

  const { error } = await supabase.from("project_items").insert(projectItems);
  if (error) {
    logger.error("Error importing items", { projectId }, error);
    return { error: "Błąd podczas importu pozycji" };
  }

  revalidateProject(projectId);
  return { success: true, count: items.length };
}

export async function importItemsFromExcel(
  projectId: string,
  items: { name: string; unit: string; quantity: number; materialPrice: number; laborPrice: number; section?: string; knrCode?: string | null }[]
): Promise<{ success?: boolean; error?: string; addedCount?: number }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do edycji tego projektu" };

  const { data: proj } = await supabase.from("projects").select("status").eq("id", projectId).single();
  if (proj?.status === "final") return { error: "Projekt jest zablokowany. Odblokuj go, aby importować pozycje." };

  if (!items || items.length === 0) return { error: "Brak pozycji do importu" };
  if (items.length > 500) return { error: "Maksymalnie 500 pozycji na raz" };

  const { data: existingItems } = await supabase
    .from("project_items").select("sort_order").eq("project_id", projectId)
    .order("sort_order", { ascending: false }).limit(1);

  let nextSortOrder = (existingItems?.[0]?.sort_order || 0) + 1;

  const rows = items.map((item) => ({
    project_id: projectId,
    catalog_item_id: null,
    name: item.name.trim().slice(0, 500),
    unit: item.unit.trim().slice(0, 20) || "szt",
    quantity: Math.max(0.001, item.quantity),
    final_material_price: Math.max(0, item.materialPrice),
    final_labor_price: Math.max(0, item.laborPrice),
    section: item.section || null,
    knr_code: item.knrCode?.trim() || null,
    sort_order: nextSortOrder++,
  }));

  const { error } = await supabase.from("project_items").insert(rows);
  if (error) {
    logger.error("Error importing items from Excel", { projectId, count: rows.length }, error);
    return { error: "Błąd podczas importu pozycji" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, addedCount: rows.length };
}
