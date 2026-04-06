"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getUserAssemblyById } from "@/app/dashboard/assemblies/actions";
import { canUserEditProject, revalidateProject } from "./utils";

// Add custom child item to an existing assembly (zestaw)
export async function addChildToAssembly(
  projectId: string,
  parentAssemblyId: string,
  data: {
    name: string;
    unit: string;
    quantity: number;
    materialPrice: number;
    laborPrice: number;
  }
) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  if (!data.name?.trim() || !data.unit?.trim()) {
    return { error: "Nazwa i jednostka są wymagane" };
  }

  const { data: parent } = await supabase
    .from("project_items")
    .select("id")
    .eq("id", parentAssemblyId)
    .eq("project_id", projectId)
    .single();

  if (!parent) return { error: "Nie znaleziono zestawu" };

  const { data: siblings } = await supabase
    .from("project_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("parent_assembly_id", parentAssemblyId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  let nextSortOrder: number;
  if (siblings?.sort_order) {
    nextSortOrder = siblings.sort_order + 1;
  } else {
    const { data: parentData } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("id", parentAssemblyId)
      .single();
    nextSortOrder = (parentData?.sort_order || 0) + 1;
  }

  try {
    await supabase.rpc("increment_sort_order_after", {
      p_project_id: projectId,
      p_after_sort: nextSortOrder - 1,
    });
  } catch {
    // RPC may not exist — items will still work with non-sequential orders
  }

  const hasNonZeroPrice = data.materialPrice > 0 || data.laborPrice > 0;
  const { error } = await supabase.from("project_items").insert({
    project_id: projectId,
    catalog_item_id: null,
    name: `  ↳ ${data.name.trim()}`,
    unit: data.unit.trim(),
    quantity: data.quantity,
    final_material_price: data.materialPrice,
    final_labor_price: data.laborPrice,
    is_custom: true,
    is_assembly_child: true,
    parent_assembly_id: parentAssemblyId,
    sort_order: nextSortOrder,
    ...(hasNonZeroPrice ? { confidence_level: "manual", labor_norm: null } : {}),
  });

  if (error) {
    logger.error("Error adding child to assembly", { projectId, parentAssemblyId }, error);
    return { error: "Błąd podczas dodawania pozycji do zestawu" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Add user custom assembly to project
// cableLength: optional meters of cable - applied to items with unit='mb'
export async function addUserAssemblyToProject(
  projectId: string,
  assemblyId: string,
  quantity: number = 1,
  cableLength?: number
): Promise<{ success: boolean; error: string | null; addedCount?: number }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const canEdit = await canUserEditProject(supabase, projectId, user.id);
    if (!canEdit) return { success: false, error: "Nie masz uprawnień do edycji tego projektu" };

    const { data: project } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", projectId)
      .single();

    if (!project) return { success: false, error: "Projekt nie został znaleziony" };

    const assembly = await getUserAssemblyById(assemblyId);

    if (!assembly) return { success: false, error: "Nie znaleziono zestawu" };

    if (!assembly.user_assembly_items || assembly.user_assembly_items.length === 0) {
      return { success: false, error: "Zestaw nie zawiera żadnych elementów" };
    }

    const { data: maxSortData } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let currentSortOrder = (maxSortData?.sort_order || 0) + 1;

    const { data: headerItem, error: headerError } = await supabase
      .from("project_items")
      .insert({
        project_id: projectId,
        catalog_item_id: null,
        name: `📦 ${assembly.name}`,
        description: `Zestaw (${quantity}x) - kliknij aby rozwinąć`,
        unit: "kpl",
        quantity: quantity,
        final_material_price: 0,
        final_labor_price: 0,
        is_custom: false,
        is_assembly_child: false,
        parent_assembly_id: null,
        sort_order: currentSortOrder++,
      })
      .select()
      .single();

    if (headerError || !headerItem) {
      logger.error("Error creating assembly header", { projectId, assemblyId }, headerError);
      return { success: false, error: "Błąd tworzenia nagłówka zestawu" };
    }

    const projectItems = assembly.user_assembly_items.map((item) => {
      const isCableItem = item.unit === "mb" || item.unit === "m";
      const baseQuantity = (isCableItem && cableLength && cableLength > 0)
        ? cableLength * item.quantity
        : item.quantity;
      const finalQuantity = quantity * baseQuantity;

      const finalMaterialPrice = item.type === "material" ? item.price : 0;
      // Iron Rule: store labor as BASE — calcRowPrices applies regionModifier at display time
      const finalLaborPrice = item.type === "labor" ? item.price : 0;

      const calculationInfo = quantity > 1
        ? ` (${item.quantity} ${item.unit} × ${quantity} = ${finalQuantity} ${item.unit})`
        : "";

      return {
        project_id: projectId,
        catalog_item_id: null,
        name: `  ↳ ${item.name}`,
        description: `Z zestawu: ${assembly.name}${calculationInfo}`,
        unit: item.unit,
        quantity: finalQuantity,
        final_material_price: finalMaterialPrice,
        final_labor_price: finalLaborPrice,
        is_custom: false,
        is_assembly_child: true,
        parent_assembly_id: headerItem.id,
        sort_order: currentSortOrder++,
      };
    });

    const { error: insertError } = await supabase.from("project_items").insert(projectItems);

    if (insertError) {
      logger.error("Error inserting user assembly items", { projectId, assemblyId }, insertError);
      return { success: false, error: "Błąd dodawania pozycji z zestawu" };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, error: null, addedCount: projectItems.length };
  } catch (error) {
    logger.error("Exception in addUserAssemblyToProject", { projectId, assemblyId }, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// Get user's other projects for "Copy from project" feature
export async function getUserProjectsForCopy(excludeProjectId: string): Promise<
  { id: string; name: string; status: string; item_count: number; created_at: string }[]
> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, created_at")
    .eq("user_id", user.id)
    .neq("id", excludeProjectId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (!projects) return [];

  const result = await Promise.all(
    projects.map(async (p) => {
      const { count } = await supabase
        .from("project_items")
        .select("id", { count: "exact", head: true })
        .eq("project_id", p.id);
      return { ...p, item_count: count || 0 };
    })
  );

  return result;
}

// Get items from a specific project for copying
export async function getProjectItemsForCopy(sourceProjectId: string): Promise<
  { id: string; name: string; unit: string; quantity: number; final_material_price: number; final_labor_price: number; catalog_item_id: string | null; section: string | null }[]
> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", sourceProjectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return [];

  const { data: items } = await supabase
    .from("project_items")
    .select("id, name, unit, quantity, final_material_price, final_labor_price, catalog_item_id, section")
    .eq("project_id", sourceProjectId)
    .order("sort_order", { ascending: true });

  return items || [];
}
