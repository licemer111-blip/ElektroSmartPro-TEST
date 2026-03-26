"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { createClient } from '@/utils/supabase/server';
import type { CatalogItem } from "./catalog-data/catalog-item";
import { getCableItems } from "./catalog-data/cables";
import { getApparatusItems } from "./catalog-data/apparatus";
import { getConduitItems } from "./catalog-data/conduits";
import { getAccessoryItems } from "./catalog-data/accessories";
import { getLightingItems } from "./catalog-data/lighting";
import { getMeasurementItems } from "./catalog-data/measurements";

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
    logger.error(`Failed to create category "${categoryName}"`, {}, error);
    return null;
  }
  
  return newCat.id;
}

/**
 * Generate a massive catalog of 1400+ electrical items based on Polish standards
 * FIXED: Inserts directly to database instead of writing to file
 */
export async function generateMasterCatalog(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

    if (!user || !supabase) {
      return { success: false, count: 0, message: "Unauthorized" };
    }

    const items: CatalogItem[] = [
      ...getCableItems(),
      ...getApparatusItems(),
      ...getConduitItems(),
      ...getAccessoryItems(),
      ...getLightingItems(),
      ...getMeasurementItems(),
    ];

    // ============================================================================
    // INSERT INTO DATABASE
    // ============================================================================

    // Group items by category to get category IDs
    const categoryMap = new Map<string, string>();
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    
    // Get or create all categories
    for (const catName of uniqueCategories) {
      const catId = await getOrCreateCategory(supabase, catName);
      if (catId) {
        categoryMap.set(catName, catId);
      }
    }
    
    // Transform items to DB format
    const dbItems = items
      .map(item => {
        const categoryId = categoryMap.get(item.category);
        if (!categoryId) {
          logger.error(`[GenerateCatalog] Skipping item ", {}, ${item.name}" - category "${item.category}" not found`);
          return null;
        }
        
        return {
          user_id: null, // GLOBAL CATALOG: All items are now global
          category_id: categoryId,
          name: item.name,
          unit: item.unit,
          base_material_price: item.material_price,
          base_labor_price: item.labor_price,
          is_assembly_parent: false,
          is_active: true,
        };
      })
      .filter(Boolean); // Remove nulls
    
    // Upsert in batches (Supabase has limits) - Handle duplicates gracefully
    const batchSize = 500;
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < dbItems.length; i += batchSize) {
      const batch = dbItems.slice(i, i + batchSize);
      
      // Use UPSERT to handle duplicates gracefully
      const { data: insertedData, error: upsertError } = await supabase
        .from('catalog_items')
        .upsert(batch, {
          onConflict: 'user_id,name',
          ignoreDuplicates: true  // Skip existing items
        })
        .select('id');
      
      if (upsertError) {
        logger.error(`❌ [Master Catalog] Batch upsert error (batch ${Math.floor(i/batchSize) + 1}):`, {}, upsertError);
        throw new Error(`Database upsert failed: ${upsertError.message}`);
      }
      
      const batchInserted = insertedData?.length || 0;
      const batchSkipped = batch.length - batchInserted;
      
      insertedCount += batchInserted;
      skippedCount += batchSkipped;
      processedCount += batch.length;
      
    }

    return {
      success: true,
      count: insertedCount,  // Return only newly inserted items
      message: `Dodano ${insertedCount} nowych pozycji (${skippedCount} duplikatów pominięto)`,
    };
    
  } catch (error) {
    logger.error("Error generating catalog:", {}, error);
    return {
      success: false,
      count: 0,
      message: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}
