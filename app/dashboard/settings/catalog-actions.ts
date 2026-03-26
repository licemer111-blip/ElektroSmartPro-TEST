"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
// ============================================================================
// REGION MANAGEMENT
// ============================================================================

/**
 * Update user's region (voivodeship)
 * This affects regional price modifiers in projects
 */
export async function updateUserRegion(regionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }


    // Update user's region in profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ user_region: regionId, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      logger.error("[updateUserRegion] Error", { regionId }, updateError);
      return { success: false, error: `Błąd aktualizacji: ${updateError.message}` };
    }


    // Revalidate paths that might display region-dependent data
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/market");

    return { success: true };
  } catch (error) {
    logger.error("[updateUserRegion] Unexpected error", { regionId }, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// ============================================================================
// CATALOG STATISTICS
// ============================================================================

/**
 * Get catalog statistics (global + user items count)
 * Global items are shared across all users (user_id IS NULL)
 * User items belong to specific user (user_id = current user)
 * NOTE: Returns TOTAL count, not filtered by hidden items
 * Hidden items count is shown separately in HiddenItemsPanel
 */
export async function getCatalogStats(): Promise<{
  globalCount: number;
  userCount: number;
  totalCount: number;
  hiddenCount: number;
  error?: string;
}> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { 
        globalCount: 0, 
        userCount: 0, 
        totalCount: 0, 
        hiddenCount: 0, 
        error: "Not authenticated" 
      };
    }

    // Count GLOBAL items (user_id IS NULL) — always shown, catalog is always enabled
    const { count: globalCountRaw, error: globalError } = await supabase
      .from("catalog_items")
      .select("*", { count: "exact", head: true })
      .is("user_id", null)
      .eq("is_active", true);

    if (globalError) {
      logger.error("Error counting global items", {}, globalError);
    }
    const globalCount = globalCountRaw || 0;

    // Count USER items (user_id = current user)
    const { count: userCount, error: userError } = await supabase
      .from("catalog_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Count hidden items for current user
    const { count: hiddenCount, error: hiddenError } = await supabase
      .from("hidden_catalog_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (userError || hiddenError) {
      logger.error("Error counting items", {}, userError || hiddenError);
      return { 
        globalCount: 0,
        userCount: 0, 
        totalCount: 0, 
        hiddenCount: 0, 
        error: "Database error" 
      };
    }

    return {
      globalCount,
      userCount: userCount || 0,
      totalCount: globalCount + (userCount || 0),
      hiddenCount: hiddenCount || 0,
    };
  } catch (error) {
    logger.error("getCatalogStats error", {}, error);
    return { 
      globalCount: 0, 
      userCount: 0, 
      totalCount: 0, 
      hiddenCount: 0, 
      error: "Unknown error" 
    };
  }
}

/**
 * Toggle Global Catalog visibility (simplified single toggle)
 * When true: shows all global catalog items
 * When false: hides all global catalog items
 */
export async function toggleGlobalCatalog(showGlobalCatalog: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ show_global_catalog: showGlobalCatalog })
      .eq("id", user.id);

    if (error) {
      logger.error("toggleGlobalCatalog error", { showGlobalCatalog }, error);
      return { success: false, error: error.message };
    }

    // Revalidate catalog and settings pages
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/market");

    return { success: true };
  } catch (error) {
    logger.error("toggleGlobalCatalog exception", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Unhide a single global catalog item for current user
 */
export async function unhideGlobalCatalogItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    // Delete the hidden_catalog_items record for this specific item
    const { error } = await supabase
      .from("hidden_catalog_items")
      .delete()
      .eq("user_id", user.id)
      .eq("catalog_item_id", itemId);

    if (error) {
      logger.error("[unhideGlobalCatalogItem] Error", { itemId }, error);
      return { success: false, error: error.message };
    }


    // Revalidate pages
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    logger.error("[unhideGlobalCatalogItem] Exception", { itemId }, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Restore ALL hidden global catalog items for current user
 * Use this to unhide all items at once
 */
export async function restoreAllHiddenItems(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    // Count hidden items before deletion
    const { count: hiddenCount } = await supabase
      .from("hidden_catalog_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);


    // Delete all hidden_catalog_items records for this user
    const { error } = await supabase
      .from("hidden_catalog_items")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      logger.error("[restoreAllHiddenItems] Error", {}, error);
      return { success: false, error: error.message };
    }


    // Revalidate pages
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/settings");

    return { success: true, count: hiddenCount || 0 };
  } catch (error) {
    logger.error("[restoreAllHiddenItems] Exception", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// ============================================================================
// DANGER ZONE ACTIONS
// ============================================================================

/**
 * Delete all catalog items for the current user (only user's personal items)
 */
export async function deleteAllCatalogItems(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }


    // Count items before deletion
    const { count: beforeCount } = await supabase
      .from("catalog_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Delete only USER's items (not global)
    const { error: deleteError } = await supabase
      .from("catalog_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("[deleteAllCatalogItems] Error", {}, deleteError);
      return { success: false, error: `Błąd usuwania: ${deleteError.message}` };
    }


    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/settings");

    return { success: true, count: beforeCount || 0 };
  } catch (error) {
    logger.error("[deleteAllCatalogItems] Exception", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Delete ALL catalog items (including GLOBAL items with user_id = NULL)
 * ⚠️ DANGER: This will delete the entire global catalog!
 * Use only for complete database reset before applying migrations.
 * Uses SECURITY DEFINER function to bypass RLS.
 */
export async function deleteAllCatalogItemsIncludingGlobal(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }


    // Call the SECURITY DEFINER function to bypass RLS and delete ALL items
    const { data, error: deleteError } = await supabase
      .rpc('admin_delete_all_catalog_items');

    if (deleteError) {
      logger.error("[deleteAllCatalogItemsIncludingGlobal] Error", {}, deleteError);
      return { success: false, error: `Błąd usuwania: ${deleteError.message}` };
    }

    const deletedCount = data?.[0]?.deleted_count || 0;


    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/settings");

    return { success: true, count: deletedCount };
  } catch (error) {
    logger.error("[deleteAllCatalogItemsIncludingGlobal] Exception", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Delete all assemblies (zestawy) for the current user
 */
export async function deleteAllAssemblies(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }


    // Count assemblies before deletion
    const { count: beforeCount } = await supabase
      .from("user_assemblies")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Delete all assemblies for this user (cascade will delete assembly_items)
    const { error: deleteError } = await supabase
      .from("user_assemblies")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("[deleteAllAssemblies] Error", {}, deleteError);
      return { success: false, error: `Błąd usuwania: ${deleteError.message}` };
    }


    revalidatePath("/dashboard/assemblies");
    revalidatePath("/dashboard/settings");

    return { success: true, count: beforeCount || 0 };
  } catch (error) {
    logger.error("[deleteAllAssemblies] Exception", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}


/**
 * Export current catalog to JSON format (returns data instead of writing to file)
 * FIXED: Removed fs.writeFileSync to work on Vercel (read-only filesystem)
 */
export async function exportCurrentCatalog(): Promise<{ 
  success: boolean; 
  count?: number;
  message?: string;
  data?: Array<{ name: string; category: string; unit: string; material_price: number; labor_price: number }>;
  error: string | null 
}> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }


    // Fetch ALL catalog items (global catalog, no user_id filter) WITH category names (using LEFT JOIN via !left hint)
    // The !left hint ensures LEFT JOIN behavior, so items without categories are included
    const { data: items, error: fetchError, count } = await supabase
      .from("catalog_items")
      .select("name, unit, base_material_price, base_labor_price, category_id, catalog_categories!left(name)", { count: 'exact' })
      .limit(5000)
      .order("name");

    if (fetchError) {
      logger.error("[exportCurrentCatalog] Error fetching items", { details: fetchError }, fetchError);
      return { 
        success: false, 
        error: `Błąd pobierania pozycji z katalogu: ${fetchError.message || 'Unknown error'}` 
      };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Brak pozycji do eksportu" };
    }


    // Transform items to seed format (strip sensitive data)
    // Note: Supabase returns nested object for relations: { catalog_categories: { name: "..." } }
    // Handle NULL categories safely
    const exportData = items.map(item => {
      const r = item as unknown as Record<string, unknown>;
      const cat = r.catalog_categories;
      const categoryName = (Array.isArray(cat) ? cat[0]?.name : (cat as { name: string } | null)?.name) || "Inne";
      return {
        name: r.name as string,
        category: categoryName as string,
        unit: r.unit as string,
        material_price: r.base_material_price as number,
        labor_price: r.base_labor_price as number,
      };
    });


    return { 
      success: true, 
      count: exportData.length,
      data: exportData, // Return data instead of writing to file
      message: `Wyeksportowano ${exportData.length} pozycji z katalogu`,
      error: null 
    };
  } catch (error) {
    logger.error("Exception in exportCurrentCatalog", {}, error);
    return { 
      success: false, 
      error: error instanceof Error 
        ? `Nieoczekiwany błąd: ${error.message}` 
        : "Nieoczekiwany błąd podczas eksportu" 
    };
  }
}


/**
 * Generate a comprehensive global catalog (~2000 items) for Residential, Office, and Industrial use
 */
/**
 * Helper: Get or create category by name
 */
async function getOrCreateCategory(supabase: Awaited<ReturnType<typeof createClient>>, categoryName: string): Promise<string | null> {
  // Try to find existing category
  const { data: existing } = await supabase
    .from('catalog_categories')
    .select('id')
    .eq('name', categoryName)
    .single();
  
  if (existing) return existing.id;
  
  // Create new category
  const { data: newCat, error } = await supabase
    .from('catalog_categories')
    .insert({ name: categoryName })
    .select('id')
    .single();
  
  if (error) {
    logger.error("Failed to create category", { categoryName }, error);
    return null;
  }
  
  return newCat.id;
}
