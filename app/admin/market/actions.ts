"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/utils/admin";
import type { MarketSentiment, ConfidenceLevel, MarketCommentType } from "@/lib/types/database";
import { logger } from "@/lib/logger";

export interface AdminMarketItem {
  id: string;
  name: string;
  category_name: string;
  base_labor_price: number;
  base_material_price: number;
  price_min: number | null;
  price_max: number | null;
  price_trend: MarketSentiment;
  confidence_level: ConfidenceLevel;
  confidence_reason: string | null;
  market_comment: string | null;
  market_comment_type: MarketCommentType | null;
  last_verified_at: string;
}

/**
 * Fetch all global catalog items for admin management
 * Only accessible by admins
 */
export async function getAdminMarketItems(): Promise<{
  items: AdminMarketItem[];
  total: number;
}> {
  // Check admin access
  await requireAdmin();

  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("catalog_items")
    .select(
      `
      id,
      name,
      base_labor_price,
      base_material_price,
      price_min,
      price_max,
      price_trend,
      confidence_level,
      confidence_reason,
      market_comment,
      market_comment_type,
      last_verified_at,
      catalog_categories (
        name
      )
    `,
      { count: "exact" }
    )
    .is("user_id", null) // Only global items
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error fetching admin market items", {}, error);
    throw new Error("Failed to fetch market items");
  }

  const items: AdminMarketItem[] = (data || []).map((item) => {
    const cat = (item as Record<string, unknown>).catalog_categories as { name: string }[] | { name: string } | null;
    const categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
    return {
      id: item.id,
      name: item.name,
      category_name: categoryName || "Bez kategorii",
      base_labor_price: item.base_labor_price,
      base_material_price: item.base_material_price,
      price_min: item.price_min,
      price_max: item.price_max,
      price_trend: item.price_trend,
      confidence_level: item.confidence_level,
      confidence_reason: item.confidence_reason,
      market_comment: item.market_comment,
      market_comment_type: item.market_comment_type,
      last_verified_at: item.last_verified_at,
    } as AdminMarketItem;
  });

  return {
    items,
    total: count || 0,
  };
}

/**
 * Update market intelligence data for a catalog item
 * Only accessible by admins
 */
export async function updateMarketIntelligence(
  itemId: string,
  data: {
    base_labor_price?: number;
    base_material_price?: number;
    price_min?: number | null;
    price_max?: number | null;
    price_trend?: MarketSentiment;
    confidence_level?: ConfidenceLevel;
    confidence_reason?: string | null;
    market_comment?: string | null;
    market_comment_type?: MarketCommentType | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check admin access
    await requireAdmin();

    const supabase = await createClient();

    // Update the item with last_verified_at automatically set to NOW()
    const { error } = await supabase
      .from("catalog_items")
      .update({
        ...data,
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .is("user_id", null); // Safety: only update global items

    if (error) {
      logger.error("Error updating market intelligence", { itemId }, error);
      return {
        success: false,
        error: "Nie udało się zaktualizować danych",
      };
    }

    // Revalidate admin page and market page
    revalidatePath("/admin/market");
    revalidatePath("/dashboard/market");
    revalidatePath("/dashboard/catalog");

    return { success: true };
  } catch (error) {
    logger.error("Error in updateMarketIntelligence", { itemId }, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}

/**
 * Bulk update market intelligence for multiple items
 * Useful for mass price updates
 */
export async function bulkUpdateMarketIntelligence(
  updates: Array<{
    itemId: string;
    data: Partial<AdminMarketItem>;
  }>
): Promise<{ success: boolean; updated: number; errors: string[] }> {
  try {
    // Check admin access
    await requireAdmin();

    const supabase = await createClient();
    const errors: string[] = [];
    let updated = 0;

    for (const { itemId, data } of updates) {
      const { error } = await supabase
        .from("catalog_items")
        .update({
          ...data,
          last_verified_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .is("user_id", null);

      if (error) {
        errors.push(`Failed to update ${itemId}: ${error.message}`);
      } else {
        updated++;
      }
    }

    // Revalidate pages
    revalidatePath("/admin/market");
    revalidatePath("/dashboard/market");
    revalidatePath("/dashboard/catalog");

    return {
      success: errors.length === 0,
      updated,
      errors,
    };
  } catch (error) {
    logger.error("Error in bulkUpdateMarketIntelligence", { updateCount: updates.length }, error);
    return {
      success: false,
      updated: 0,
      errors: [error instanceof Error ? error.message : "Nieznany błąd"],
    };
  }
}

/**
 * Simulate market movement by randomly updating prices and trends
 * Updates ALL global items using a PostgreSQL function for performance
 * Only accessible by admins
 */
export async function simulateMarketMovement(): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  try {
    // Check admin access
    await requireAdmin();

    const supabase = await createClient();

    // Call the PostgreSQL function to simulate market volatility
    // This updates ALL global items in a single database operation
    const { data, error } = await supabase
      .rpc("simulate_market_volatility");

    if (error) {
      logger.error("Error simulating market movement", {}, error);
      return {
        success: false,
        updated: 0,
        error: "Nie udało się zaktualizować rynku",
      };
    }

    // Extract the count from the returned data
    const updated = data?.[0]?.updated_count || 0;

    // Revalidate pages to show updated data
    revalidatePath("/admin/market");
    revalidatePath("/dashboard/market");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/projects/[id]"); // For project estimates

    return {
      success: true,
      updated,
    };
  } catch (error) {
    logger.error("Error in simulateMarketMovement", {}, error);
    return {
      success: false,
      updated: 0,
      error: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}

/**
 * Bulk import catalog items from CSV
 * Accepts array of items and inserts them in batches
 * Only accessible by admins
 */
export async function bulkImportCatalogItems(
  items: Array<{
    name: string;
    category_name: string;
    unit: string;
    base_material_price: number;
    base_labor_price: number;
  }>
): Promise<{
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}> {
  try {
    // Check admin access
    await requireAdmin();

    const supabase = await createClient();
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // First, get all categories to map names to IDs
    const { data: categories } = await supabase
      .from("catalog_categories")
      .select("id, name");

    const categoryMap = new Map(
      categories?.map((cat) => [cat.name.toLowerCase(), cat.id]) || []
    );

    // Process items in chunks of 500 to avoid payload limits
    const CHUNK_SIZE = 500;
    
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      
      // Transform items for database
      const itemsToInsert = chunk
        .map((item) => {
          // Find category ID
          const categoryId = categoryMap.get(item.category_name.toLowerCase());
          
          if (!categoryId) {
            errors.push(`Kategoria "${item.category_name}" nie istnieje dla pozycji "${item.name}"`);
            skipped++;
            return null;
          }

          return {
            name: item.name.trim(),
            category_id: categoryId,
            unit: item.unit.trim() || "szt",
            base_material_price: parseFloat(String(item.base_material_price)) || 0,
            base_labor_price: parseFloat(String(item.base_labor_price)) || 0,
            user_id: null, // Global items
            is_active: true,
            price_trend: "stable" as const,
            confidence_level: "low" as const,
            last_verified_at: new Date().toISOString(),
          };
        })
        .filter((item) => item !== null);

      // Insert chunk
      if (itemsToInsert.length > 0) {
        const { error: insertError, data } = await supabase
          .from("catalog_items")
          .insert(itemsToInsert)
          .select("id");

        if (insertError) {
          errors.push(`Błąd importu chunk ${i / CHUNK_SIZE + 1}: ${insertError.message}`);
          skipped += itemsToInsert.length;
        } else {
          imported += data?.length || itemsToInsert.length;
        }
      }
    }

    // Revalidate pages
    revalidatePath("/admin/market");
    revalidatePath("/dashboard/market");
    revalidatePath("/dashboard/catalog");

    return {
      success: errors.length === 0 || imported > 0,
      imported,
      skipped,
      errors,
    };
  } catch (error) {
    logger.error("Error in bulkImportCatalogItems", { itemCount: items.length }, error);
    return {
      success: false,
      imported: 0,
      skipped: items.length,
      errors: [error instanceof Error ? error.message : "Nieznany błąd"],
    };
  }
}
