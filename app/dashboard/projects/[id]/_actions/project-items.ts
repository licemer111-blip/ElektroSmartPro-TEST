"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { tryAuth } from "@/lib/auth";
import { projectItemUpdateSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";
import type { ProjectItem } from "@/lib/types/database";
import { canUserEditProject, revalidateProject } from "./utils";
// NOTE: KNR multiplier is applied at DISPLAY-TIME only (pricing-calculations.ts)
// Database stores BASE prices to allow instant recalculation when admin changes multiplier

// Fetch project items
export async function getProjectItems(projectId: string): Promise<ProjectItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_items")
    .select("*, catalog_items(category_id, catalog_categories(id, name))")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("Error fetching project items", { projectId }, error);
    return [];
  }

  type ItemWithCatalog = ProjectItem & {
    catalog_items?: { category_id?: string; catalog_categories?: { id: string; name: string } | null } | null;
  };
  return ((data || []) as ItemWithCatalog[]).map(item => {
    const catInfo = item.catalog_items?.catalog_categories;
    return {
      ...item,
      catalog_items: undefined,
      catalog_categories: catInfo || null,
    } as ProjectItem;
  });
}

// Add catalog item to project with pricing calculation
export async function addCatalogItemToProject(
  projectId: string,
  catalogItemId: string,
  quantity: number = 1.0
): Promise<{ error: string } | { success: boolean; isAssembly?: boolean }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do edycji tego projektu" };

  const { data: project } = await supabase
    .from("projects")
    .select(`*, regions ( price_modifier )`)
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Projekt nie został znaleziony" };
  if (project.status === "final") return { error: "Projekt jest zablokowany. Odblokuj go, aby dodawać pozycje." };

  const { data: catalogItem } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("id", catalogItemId)
    .single();

  if (!catalogItem) return { error: "Nie znaleziono pozycji katalogowej" };

  const priceModifier = (project.regions as { price_modifier: number } | null)?.price_modifier || 1.0;
  // Iron Rule: labor stored as BASE — calcRowPrices applies regionModifier and knrMultiplier at display time
  const finalLaborPrice = catalogItem.base_labor_price;
  const finalMaterialPrice = catalogItem.base_material_price;
  const priceMin = catalogItem.price_min ? catalogItem.price_min * priceModifier : null;
  const priceMax = catalogItem.price_max ? catalogItem.price_max * priceModifier : null;

  if (catalogItem.is_assembly_parent) {
    return await expandAssembly(projectId, catalogItemId, priceModifier, catalogItem.name);
  }

  const { data: maxSortData } = await supabase
    .from("project_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxSortData?.sort_order || 0) + 1;

  const catalogKnrCode = (catalogItem as Record<string, unknown>).knr_code as string | null | undefined;

  const { error } = await supabase.from("project_items").insert({
    project_id: projectId,
    catalog_item_id: catalogItemId,
    name: catalogItem.name,
    unit: catalogItem.unit,
    quantity,
    final_material_price: finalMaterialPrice,
    final_labor_price: finalLaborPrice,
    price_min: priceMin,
    price_max: priceMax,
    sort_order: nextSortOrder,
    knr_code: catalogKnrCode ?? null,
    knr_source: catalogKnrCode ? "catalog" : null,
  });

  if (error) {
    logger.error("Error adding item to project", { projectId, catalogItemId, errorCode: error.code }, error);
    return { error: "Błąd podczas dodawania pozycji" };
  }

  revalidateProject(projectId);
  return { success: true, isAssembly: false };
}

// Expand assembly (Zestaw) into child items — private helper
async function expandAssembly(
  projectId: string,
  parentCatalogItemId: string,
  priceModifier: number,
  parentName: string
) {
  const supabase = await createClient();

  const { data: assemblyChildren, error: assemblyError } = await supabase
    .from("catalog_assemblies")
    .select(`
      quantity,
      catalog_items!catalog_assemblies_child_item_id_fkey (
        id, name, description, unit,
        base_material_price, base_labor_price, price_min, price_max
      )
    `)
    .eq("parent_item_id", parentCatalogItemId);

  if (assemblyError || !assemblyChildren || assemblyChildren.length === 0) {
    return { error: "Nie znaleziono elementów zestawu" };
  }

  const { data: maxSortData } = await supabase
    .from("project_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  let nextSortOrder = (maxSortData?.sort_order || 0) + 1;

  const { data: parentItem, error: parentError } = await supabase
    .from("project_items")
    .insert({
      project_id: projectId,
      catalog_item_id: parentCatalogItemId,
      name: `📦 ${parentName}`,
      description: "Zestaw (kliknij aby rozwinąć)",
      unit: "kpl",
      quantity: 1.0,
      final_material_price: 0,
      final_labor_price: 0,
      is_custom: false,
      is_assembly_child: false,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (parentError || !parentItem) return { error: "Błąd podczas tworzenia zestawu" };

  nextSortOrder++;

  interface AssemblyChildItem {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    base_material_price: number;
    base_labor_price: number;
    price_min: number | null;
    price_max: number | null;
  }

  const childItems = assemblyChildren.map((child: { quantity: number; catalog_items: AssemblyChildItem | AssemblyChildItem[] }) => {
    const item = Array.isArray(child.catalog_items) ? child.catalog_items[0] : child.catalog_items;
    return {
      project_id: projectId,
      catalog_item_id: item.id,
      name: `  ↳ ${item.name}`,
      description: item.description,
      unit: item.unit,
      quantity: child.quantity,
      final_material_price: item.base_material_price,
      final_labor_price: item.base_labor_price, // BASE — calcRowPrices applies regionModifier at display time
      price_min: item.price_min ? item.price_min * priceModifier : null,
      price_max: item.price_max ? item.price_max * priceModifier : null,
      is_custom: false,
      is_assembly_child: true,
      parent_assembly_id: parentItem.id,
      sort_order: nextSortOrder++,
    };
  });

  const { error: childrenError } = await supabase.from("project_items").insert(childItems);
  if (childrenError) {
    logger.error("Error inserting assembly children", { projectId, parentCatalogItemId }, childrenError);
    return { error: "Błąd podczas rozwijania zestawu" };
  }

  revalidateProject(projectId);
  return { success: true, isAssembly: true };
}

// Update item quantity (legacy - kept for compatibility)
export async function updateItemQuantity(projectId: string, itemId: string, quantity: number) {
  return updateProjectItem(projectId, itemId, { quantity });
}

// Update project item (full editing support)
export async function updateProjectItem(
  projectId: string,
  itemId: string,
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    final_material_price?: number;
    final_labor_price?: number;
    section?: string | null;
    confidence_level?: "verified" | "analog" | "estimated" | "uncertain" | "manual" | null;
    labor_norm?: number | null;
    knr_code?: string | null;
    is_investor_material?: boolean;
  }
) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error: validationError } = validate(projectItemUpdateSchema, updates);
  if (validationError) return { error: validationError };

  if (updates.quantity !== undefined && updates.quantity < 0.001) return { error: "Ilość musi być większa niż 0" };
  if (updates.name !== undefined && updates.name.trim().length === 0) return { error: "Nazwa nie może być pusta" };
  if (updates.unit !== undefined && updates.unit.trim().length === 0) return { error: "Jednostka nie może być pusta" };
  if (updates.final_material_price !== undefined && updates.final_material_price < 0) return { error: "Cena materiału nie może być ujemna" };
  if (updates.final_labor_price !== undefined && updates.final_labor_price < 0) return { error: "Cena robocizny nie może być ujemna" };

  // Sync material_price/labor_price with final_* so ES-Engine reads correct values
  const syncedUpdates: typeof updates & { material_price?: number; labor_price?: number } = { ...updates };
  if (updates.final_material_price !== undefined) syncedUpdates.material_price = updates.final_material_price;
  if (updates.final_labor_price !== undefined) syncedUpdates.labor_price = updates.final_labor_price;

  // Manual price: wipe AI/KNR metadata so stale codes don't pollute the row
  if (updates.confidence_level === "manual") {
    if (syncedUpdates.knr_code === undefined) syncedUpdates.knr_code = null;
    if (syncedUpdates.labor_norm === undefined) syncedUpdates.labor_norm = null;
  }

  const { error } = await supabase
    .from("project_items")
    .update(syncedUpdates)
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Error updating item", { projectId, itemId }, error);
    return { error: "Błąd podczas aktualizacji pozycji" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Delete project item
export async function deleteProjectItem(projectId: string, itemId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: children } = await supabase
    .from("project_items").select("id").eq("parent_assembly_id", itemId);

  if (children && children.length > 0) {
    await supabase.from("project_items").delete().eq("parent_assembly_id", itemId);
  }

  const { error } = await supabase
    .from("project_items").delete().eq("id", itemId).eq("project_id", projectId);

  if (error) {
    logger.error("Error deleting item", { projectId, itemId }, error);
    return { error: "Błąd podczas usuwania pozycji" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Duplicate a project item
export async function duplicateProjectItem(
  projectId: string,
  itemId: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: itemToDuplicate, error: fetchError } = await supabase
    .from("project_items").select("*").eq("id", itemId).eq("project_id", projectId).single();

  if (fetchError || !itemToDuplicate) {
    logger.error("Error fetching item to duplicate", { projectId, itemId }, fetchError);
    return { error: "Nie znaleziono pozycji" };
  }

  const { data: maxSortData } = await supabase
    .from("project_items").select("sort_order").eq("project_id", projectId)
    .order("sort_order", { ascending: false }).limit(1).single();

  const nextSortOrder = (maxSortData?.sort_order || 0) + 1;

  const { error: insertError } = await supabase.from("project_items").insert({
    project_id: projectId,
    catalog_item_id: itemToDuplicate.catalog_item_id,
    name: `${itemToDuplicate.name} (Kopia)`,
    description: itemToDuplicate.description,
    notes: itemToDuplicate.notes,
    unit: itemToDuplicate.unit,
    quantity: itemToDuplicate.quantity,
    material_price: itemToDuplicate.material_price,
    labor_price: itemToDuplicate.labor_price,
    final_material_price: itemToDuplicate.final_material_price,
    final_labor_price: itemToDuplicate.final_labor_price,
    price_min: itemToDuplicate.price_min,
    price_max: itemToDuplicate.price_max,
    is_custom: itemToDuplicate.is_custom,
    is_assembly_child: itemToDuplicate.is_assembly_child,
    parent_assembly_id: itemToDuplicate.parent_assembly_id,
    section: itemToDuplicate.section || null,
    sort_order: nextSortOrder,
  });

  if (insertError) {
    logger.error("Error duplicating item", { projectId, itemId }, insertError);
    return { error: "Błąd podczas kopiowania pozycji" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Add custom item (not from catalog)
export async function addCustomItem(projectId: string, formData: FormData) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const quantity = parseFloat(formData.get("quantity") as string) || 1;
  const materialPrice = parseFloat(formData.get("material_price") as string) || 0;
  const laborPrice = parseFloat(formData.get("labor_price") as string) || 0;

  if (!name || !unit) return { error: "Nazwa i jednostka są wymagane" };

  const { data: maxSortData } = await supabase
    .from("project_items").select("sort_order").eq("project_id", projectId)
    .order("sort_order", { ascending: false }).limit(1).single();

  const nextSortOrder = (maxSortData?.sort_order || 0) + 1;

  const { error } = await supabase.from("project_items").insert({
    project_id: projectId,
    catalog_item_id: null,
    name, unit, quantity,
    final_material_price: materialPrice,
    final_labor_price: laborPrice,
    sort_order: nextSortOrder,
  });

  if (error) {
    logger.error("Error adding custom item", { projectId }, error);
    return { error: "Błąd podczas dodawania pozycji" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Add a project item directly (programmatic, no FormData)
export async function addProjectItemDirect(
  projectId: string,
  data: {
    name: string;
    unit?: string;
    quantity?: number;
    material_price?: number;
    labor_price?: number;
    description?: string;
    is_assembly_child?: boolean;
    parent_assembly_id?: string;
  }
) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: maxSortData } = await supabase
    .from("project_items").select("sort_order").eq("project_id", projectId)
    .order("sort_order", { ascending: false }).limit(1).single();

  const nextSortOrder = (maxSortData?.sort_order || 0) + 1;

  // Iron Rule: labor stored as BASE — calcRowPrices applies knrMultiplier at display time
  const finalLaborPrice = data.labor_price ?? 0;

  const { data: inserted, error } = await supabase.from("project_items").insert({
    project_id: projectId,
    catalog_item_id: null,
    name: data.name,
    description: data.description || null,
    unit: data.unit || "szt",
    quantity: data.quantity ?? 1,
    final_material_price: data.material_price ?? 0,
    final_labor_price: finalLaborPrice,
    is_custom: true,
    is_assembly_child: data.is_assembly_child || false,
    parent_assembly_id: data.parent_assembly_id || null,
    sort_order: nextSortOrder,
  }).select("id").single();

  if (error) {
    logger.error("Error adding project item direct", { projectId }, error);
    return { error: "Błąd podczas dodawania pozycji" };
  }

  revalidateProject(projectId);
  return { success: true, itemId: inserted?.id as string | undefined };
}

// Save per-row assembly overrides (keyed by item label)
// overrides=null clears all overrides and restores template defaults
export async function saveAssemblyOverrides(
  projectId: string,
  itemId: string,
  overrides: Record<string, { qtyMultiplier?: number; materialPricePerUnit?: number; rbhPerUnit?: number; disabled?: boolean }> | null,
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("project_items")
    .update({ assembly_overrides: overrides })
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Error saving assembly overrides", { projectId, itemId }, error);
    return { error: "Błąd podczas zapisywania modyfikacji zestawu" };
  }

  revalidateProject(projectId);
  return { success: true };
}
