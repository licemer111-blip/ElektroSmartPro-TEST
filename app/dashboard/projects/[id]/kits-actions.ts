"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Kit, KitItem, KitWithItems } from "@/lib/types/database";

/**
 * Get all available kits, optionally filtered by category
 */
export async function getKits(categoryId?: string): Promise<KitWithItems[]> {
  const supabase = await createClient();

  let query = supabase
    .from("kits")
    .select(`
      *,
      kit_items (*)
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Error fetching kits:", {}, error);
    return [];
  }

  return (data as KitWithItems[]) || [];
}

/**
 * Get kit details with all items
 */
export async function getKitDetails(kitId: string): Promise<KitWithItems | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kits")
    .select(`
      *,
      kit_items (*)
    `)
    .eq("id", kitId)
    .single();

  if (error) {
    logger.error("Error fetching kit details:", {}, error);
    return null;
  }

  return data as KitWithItems;
}

/**
 * Add a kit to project - CORE LOGIC
 * This expands the kit into multiple project_items
 * 
 * @param projectId - Target project UUID
 * @param kitId - Kit UUID to add
 * @param quantity - Number of kits to add (multiplies all item quantities)
 * @returns Success status and error message if any
 */
export async function addKitToProject(
  projectId: string,
  kitId: string,
  quantity: number = 1
): Promise<{ success: boolean; error: string | null; addedCount?: number }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, region_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Projekt nie znaleziony lub brak dostępu" };
    }

    // Fetch kit with all items
    const { data: kitData, error: kitError } = await supabase
      .from("kits")
      .select(`
        *,
        kit_items (*)
      `)
      .eq("id", kitId)
      .eq("is_active", true)
      .single();

    if (kitError || !kitData) {
      return { success: false, error: "Zestaw nie znaleziony" };
    }

    const kit = kitData as KitWithItems;

    if (!kit.kit_items || kit.kit_items.length === 0) {
      return { success: false, error: "Zestaw nie zawiera żadnych pozycji" };
    }

    // Get current max sort_order to append items at the end
    const { data: maxSortData } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let currentSortOrder = (maxSortData?.sort_order || 0) + 1;

    // Prepare project items to insert
    const projectItems = kit.kit_items.map((kitItem: KitItem) => {
      // Calculate final quantity: kit quantity * item multiplier
      const finalQuantity = quantity * kitItem.quantity_multiplier;

      // Iron Rule: material sovereign, labor stored as BASE — calcRowPrices applies regionModifier at display
      const finalMaterialPrice = kitItem.material_price;
      const finalLaborPrice = kitItem.labor_price;

      return {
        project_id: projectId,
        catalog_item_id: null, // No catalog reference yet
        name: kitItem.item_name,
        description: `Z zestawu: ${kit.name}`,
        unit: kitItem.item_unit,
        quantity: finalQuantity,
        material_price: finalMaterialPrice,
        labor_price: finalLaborPrice,
        is_custom: false,
        is_assembly_child: true, // Mark as part of kit/assembly
        parent_assembly_id: null, // Could link to a "kit header" row in future
        sort_order: currentSortOrder++,
      };
    });

    // Insert all items in one batch
    const { error: insertError } = await supabase
      .from("project_items")
      .insert(projectItems);

    if (insertError) {
      logger.error("Error inserting kit items:", {}, insertError);
      return { success: false, error: "Błąd dodawania pozycji z zestawu" };
    }

    // Revalidate project page
    revalidatePath(`/dashboard/projects/${projectId}`);

    return { 
      success: true, 
      error: null, 
      addedCount: projectItems.length 
    };

  } catch (error) {
    logger.error("Exception in addKitToProject:", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Get kits grouped by category for UI display
 */
export async function getKitsByCategory(): Promise<{
  categoryId: string | null;
  categoryName: string;
  kits: KitWithItems[];
}[]> {
  const supabase = await createClient();

  // Get all kits with category info
  const { data: kits, error } = await supabase
    .from("kits")
    .select(`
      *,
      kit_items (*),
      catalog_categories (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    logger.error("Error fetching kits by category:", {}, error);
    return [];
  }

  // Group by category
  const grouped = new Map<string, {
    categoryId: string | null;
    categoryName: string;
    kits: KitWithItems[];
  }>();

  for (const kit of kits as Array<KitWithItems & { catalog_categories?: { id: string; name: string } | null }>) {
    const categoryId = kit.category_id || "uncategorized";
    const kitCat = kit.catalog_categories;
    const categoryName = (Array.isArray(kitCat) ? kitCat[0]?.name : (kitCat as { name: string } | null | undefined)?.name) || "Inne";

    if (!grouped.has(categoryId)) {
      grouped.set(categoryId, {
        categoryId: kit.category_id,
        categoryName,
        kits: [],
      });
    }

    grouped.get(categoryId)!.kits.push(kit as KitWithItems);
  }

  return Array.from(grouped.values());
}
