"use server";

import { revalidatePath } from "next/cache";
import { catalogItemSchema, validate } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import type { CatalogItem } from "./catalog-search-actions";

export async function createCatalogItem(formData: {
  name: string;
  unit: string;
  base_labor_price: number;
  base_material_price: number;
  category_id?: string;
  visibility?: "personal" | "team";
  team_id?: string;
}) {
  const { error: validationError } = validate(catalogItemSchema, formData);
  if (validationError) throw new Error(validationError);

  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const insertData: Record<string, string | number | null> = {
    user_id: user.id,
    name: formData.name,
    unit: formData.unit,
    base_labor_price: formData.base_labor_price,
    base_material_price: formData.base_material_price,
    category_id: formData.category_id || null,
    visibility: formData.visibility || "personal",
  };

  if (formData.visibility === "team" && formData.team_id) {
    insertData.team_id = formData.team_id;
  }

  const { error } = await supabase.from("catalog_items").insert(insertData);
  if (error) {
    logger.error("Error creating catalog item", {}, error);
    throw new Error("Failed to create catalog item");
  }

  revalidatePath("/dashboard/catalog");
  return { success: true };
}

export async function updateCatalogItem(
  id: string,
  formData: {
    name: string;
    unit: string;
    base_labor_price: number;
    base_material_price: number;
    category_id?: string;
  }
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { data: existingItem, error: fetchError } = await supabase
    .from("catalog_items")
    .select("id, user_id, name, unit, base_labor_price, base_material_price, category_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingItem) {
    logger.error("Error fetching catalog item", { itemId: id }, fetchError);
    throw new Error("Catalog item not found");
  }

  // 🔒 COPY-ON-EDIT PROTECTION for GLOBAL items
  if (existingItem.user_id === null) {
    const copyName = formData.name.includes("(Moja)") ? formData.name : `${formData.name} (Moja)`;
    const { error: createError } = await supabase.from("catalog_items").insert({
      user_id: user.id,
      name: copyName,
      unit: formData.unit,
      base_labor_price: formData.base_labor_price,
      base_material_price: formData.base_material_price,
      category_id: formData.category_id || null,
    });
    if (createError) {
      logger.error("Error creating user copy of global item", { itemId: id }, createError);
      throw new Error("Failed to create personal copy");
    }
    revalidatePath("/dashboard/catalog");
    return { success: true, message: "Utworzono osobistą kopię globalnej pozycji" };
  }

  const { error } = await supabase
    .from("catalog_items")
    .update({
      name: formData.name,
      unit: formData.unit,
      base_labor_price: formData.base_labor_price,
      base_material_price: formData.base_material_price,
      category_id: formData.category_id || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating catalog item", { itemId: id }, error);
    throw new Error("Failed to update catalog item");
  }

  revalidatePath("/dashboard/catalog");
  return { success: true };
}

export async function deleteCatalogItem(id: string): Promise<{ success: boolean; error?: string; usedInProjects?: string[] }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { success: false, error: "Unauthorized" };

  const { data: existingItem, error: fetchError } = await supabase
    .from("catalog_items")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingItem) {
    logger.error("Error fetching catalog item for deletion", { itemId: id }, fetchError);
    return { success: false, error: "Pozycja nie została znaleziona" };
  }

  if (existingItem.user_id === null) {
    return { success: false, error: "GLOBAL_ITEM" };
  }

  // Check if used in any project_items — get project names for a friendly error
  const { data: usedIn } = await supabase
    .from("project_items")
    .select("project_id, projects(name)")
    .eq("catalog_item_id", id)
    .limit(5);

  if (usedIn && usedIn.length > 0) {
    const projectNames = usedIn
      .map((row) => (row.projects as { name?: string } | null)?.name ?? "Nieznany projekt")
      .filter((v, i, a) => a.indexOf(v) === i);
    return { success: false, usedInProjects: projectNames };
  }

  // Pre-delete: remove FK refs to avoid 23503
  await supabase.from("catalog_assemblies").delete().eq("parent_item_id", id);
  await supabase.from("catalog_assemblies").delete().eq("child_item_id", id);
  await supabase.from("hidden_catalog_items").delete().eq("catalog_item_id", id);
  await supabase.from("favorite_catalog_items").delete().eq("catalog_item_id", id);

  const { error } = await supabase
    .from("catalog_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting catalog item", { itemId: id, code: error.code, details: error.details }, error);
    if (error.code === "23503") {
      return { success: false, usedInProjects: ["inny projekt"] };
    }
    return { success: false, error: "Nie udało się usunąć pozycji" };
  }

  revalidatePath("/dashboard/catalog");
  return { success: true };
}

export async function moveItemToCategory(itemId: string, categoryId: string | null) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("catalog_items")
    .update({ category_id: categoryId })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error moving item to category", { itemId, categoryId }, error);
    throw new Error("Failed to move item to category");
  }

  revalidatePath("/dashboard/catalog");
  return { success: true };
}

export async function hideGlobalCatalogItem(itemId: string): Promise<{ success: boolean }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { data: item, error: fetchError } = await supabase
    .from("catalog_items")
    .select("user_id, name")
    .eq("id", itemId)
    .single();

  if (fetchError) {
    logger.error("[hideGlobalCatalogItem] Error fetching item", { itemId }, fetchError);
    throw new Error(`Failed to fetch item: ${fetchError.message}`);
  }
  if (!item) throw new Error("Item not found");
  if (item.user_id !== null) throw new Error("Only global items can be hidden.");

  const { error } = await supabase.from("hidden_catalog_items").insert({
    user_id: user.id,
    catalog_item_id: itemId,
  });

  if (error) {
    logger.error("[hideGlobalCatalogItem] Error inserting hidden item", { itemId, code: error.code }, error);
    throw new Error(`Failed to hide item: ${error.message} (Code: ${error.code})`);
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/market");
  return { success: true };
}

export async function unhideGlobalCatalogItem(itemId: string): Promise<{ success: boolean }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("hidden_catalog_items")
    .delete()
    .eq("user_id", user.id)
    .eq("catalog_item_id", itemId);

  if (error) {
    logger.error("Error unhiding item", { itemId }, error);
    throw new Error("Failed to unhide item");
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/market");
  return { success: true };
}

export async function getHiddenCatalogItems(): Promise<CatalogItem[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("hidden_catalog_items")
    .select(`
      catalog_item_id,
      catalog_items (
        id, name, unit, base_labor_price, base_material_price,
        category_id, user_id,
        catalog_categories ( name )
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error fetching hidden items", {}, error);
    return [];
  }

  return (data || [])
    .map((row) => {
      const r = row as Record<string, unknown>;
      const items = r.catalog_items;
      const item = Array.isArray(items) ? items[0] : items;
      if (!item) return null;
      const cat = (item as Record<string, unknown>).catalog_categories;
      const catName = Array.isArray(cat) ? cat[0]?.name : (cat as { name: string } | null)?.name;
      return {
        id: (item as Record<string, unknown>).id as string,
        name: (item as Record<string, unknown>).name as string,
        unit: (item as Record<string, unknown>).unit as string,
        base_labor_price: (item as Record<string, unknown>).base_labor_price as number,
        base_material_price: (item as Record<string, unknown>).base_material_price as number,
        category_id: (item as Record<string, unknown>).category_id as string | null,
        user_id: (item as Record<string, unknown>).user_id as string | null,
        category_name: catName || "Bez kategorii",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export async function toggleFavoriteCatalogItem(
  itemId: string
): Promise<{ success: boolean; isFavorite: boolean }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) throw new Error("Unauthorized");

  const { data: existing } = await supabase
    .from("favorite_catalog_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("catalog_item_id", itemId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("favorite_catalog_items")
      .delete()
      .eq("user_id", user.id)
      .eq("catalog_item_id", itemId);
    if (error) {
      logger.error("Error removing favorite", { itemId }, error);
      throw new Error("Failed to remove favorite");
    }
    revalidatePath("/dashboard/catalog");
    return { success: true, isFavorite: false };
  } else {
    const { error } = await supabase.from("favorite_catalog_items").insert({
      user_id: user.id,
      catalog_item_id: itemId,
    });
    if (error) {
      logger.error("Error adding favorite", { itemId }, error);
      throw new Error("Failed to add favorite");
    }
    revalidatePath("/dashboard/catalog");
    return { success: true, isFavorite: true };
  }
}

export async function getFavoriteCatalogItemIds(): Promise<string[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("favorite_catalog_items")
    .select("catalog_item_id")
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error fetching favorites", {}, error);
    return [];
  }

  return (data || []).map((row) => row.catalog_item_id);
}

export async function getFavoriteCatalogItems(): Promise<CatalogItem[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data: favRows, error: favError } = await supabase
    .from("favorite_catalog_items")
    .select("catalog_item_id")
    .eq("user_id", user.id);

  if (favError || !favRows || favRows.length === 0) return [];

  const itemIds = favRows.map((row) => row.catalog_item_id);

  const { data: items, error: itemsError } = await supabase
    .from("catalog_items")
    .select("*")
    .in("id", itemIds)
    .eq("is_active", true)
    .order("name");

  if (itemsError) {
    logger.error("Error fetching favorite items", {}, itemsError);
    return [];
  }

  return (items || []) as CatalogItem[];
}

export async function bulkDeleteCatalogItems(ids: string[]): Promise<{ count: number; error?: string }> {
  if (!ids.length) return { count: 0 };

  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { count: 0, error: "Unauthorized" };

  // Pre-delete: remove all FK refs to avoid 23503
  await supabase.from("catalog_assemblies").delete().in("parent_item_id", ids);
  await supabase.from("catalog_assemblies").delete().in("child_item_id", ids);
  await supabase.from("hidden_catalog_items").delete().in("catalog_item_id", ids);
  await supabase.from("favorite_catalog_items").delete().in("catalog_item_id", ids);

  const { error, count } = await supabase
    .from("catalog_items")
    .delete({ count: "exact" })
    .in("id", ids)
    .eq("user_id", user.id); // safety: only own items

  if (error) {
    logger.error("Error bulk deleting catalog items", { ids, code: error.code }, error);
    if (error.code === "23503") {
      return { count: 0, error: "Nie można usunąć — pozycje są używane w projektach" };
    }
    return { count: 0, error: "Nie udało się usunąć wybranych pozycji" };
  }

  revalidatePath("/dashboard/catalog");
  return { count: count ?? ids.length };
}

/**
 * One-time repair: find all user catalog items where prices are broken
 * (both=0, or labor-type item with labor=0) and apply applyPriceGuard.
 */
export async function fixZeroLaborItems(): Promise<{
  fixed: number;
  error?: string;
}> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { fixed: 0, error: "Brak autoryzacji" };

  const { applyPriceGuard } = await import("@/lib/utils/price-validator");

  const LABOR_KEYWORDS = ["montaż", "kucie", "układanie", "bruzdowanie", "podłączenie", "pomiar", "instalacj"];

  // Fetch user's own items that may be broken
  const { data: items, error: fetchError } = await supabase
    .from("catalog_items")
    .select("id, name, unit, base_labor_price, base_material_price, knr_code")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (fetchError || !items) {
    return { fixed: 0, error: "Nie udało się pobrać pozycji" };
  }

  const toFix = items.filter(item => {
    const bothZero = item.base_labor_price === 0 && item.base_material_price === 0;
    const nameLower = (item.name ?? "").toLowerCase();
    const isLaborType = LABOR_KEYWORDS.some(kw => nameLower.includes(kw));
    return bothZero || (isLaborType && item.base_labor_price === 0);
  });

  if (toFix.length === 0) return { fixed: 0 };

  let fixedCount = 0;
  for (const item of toFix) {
    const guarded = applyPriceGuard({
      name: item.name,
      unit: item.unit ?? "szt",
      base_labor_price: item.base_labor_price,
      base_material_price: item.base_material_price,
      knr_code: item.knr_code ?? null,
    });

    const { error: updateError } = await supabase
      .from("catalog_items")
      .update({
        base_labor_price: guarded.base_labor_price,
        base_material_price: guarded.base_material_price,
        knr_code: guarded.knr_code ?? item.knr_code,
      })
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (!updateError) fixedCount++;
    else logger.error("[fixZeroLaborItems] update failed", { id: item.id }, updateError);
  }

  revalidatePath("/dashboard/catalog");
  return { fixed: fixedCount };
}
