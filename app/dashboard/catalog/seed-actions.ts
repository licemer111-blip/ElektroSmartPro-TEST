"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import masterCatalogItems from "@/lib/data/master-catalog-items.json";
import seedLegacyData from "@/lib/data/json/seed-legacy.json";

interface SeedItem {
  name: string;
  category: string;
  unit: string;
  material_price: number;
  labor_price: number;
}

// Legacy data loaded from JSON (kept as fallback)
const LEGACY_SEED_DATA: SeedItem[] = seedLegacyData.catalog_items as SeedItem[];

// ============================================================================
// ASSEMBLIES SEED DATA
// ============================================================================

interface SeedAssembly {
  name: string;
  description: string;
  category: string; // For organizational purposes (not stored in DB)
}

const SEED_ASSEMBLIES: SeedAssembly[] = seedLegacyData.assemblies as SeedAssembly[];

// Use master catalog if available, otherwise fall back to legacy data
const SEED_DATA: SeedItem[] = masterCatalogItems.length > 1 
  ? (masterCatalogItems as SeedItem[])
  : LEGACY_SEED_DATA;

// ============================================================================
// CATALOG ITEMS SEED FUNCTION
// ============================================================================

export async function seedDatabaseSmart() {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return { error: "Unauthorized" };
  }

  const results = {
    added: [] as string[],
    skipped: [] as string[],
    errors: [] as string[],
  };

  // Category name mapping (generated catalog -> database categories)
  const categoryMapping: Record<string, string> = {
    "Trasy kablowe": "Trasy Kablowe",  // Fix capitalization
    "Osprzęt": "Przygotowanie",  // Map switches/sockets to Przygotowanie
    "Akcesoria": "Okablowanie",  // Map accessories to Okablowanie
    "Smart Home": "Teletechnika",  // Map smart home to Teletechnika
    "Aparatura": "Rozdzielnice",  // Map apparatus to Rozdzielnice
    "PPOŻ": "Teletechnika",  // Map fire protection to Teletechnika
    "Security": "Teletechnika",  // Map security to Teletechnika
    "Pomiary": "Teletechnika",  // Map measurements to Teletechnika
  };

  // ============================================================================
  // STEP 1: Fetch all categories (ONE query)
  // ============================================================================
  const { data: categories, error: catFetchError } = await supabase
    .from("catalog_categories")
    .select("id, name");

  if (catFetchError) {
    logger.error(`[Smart Seed] Error fetching categories:`, {}, catFetchError);
    return { error: "Failed to fetch categories" };
  }

  const categoryMap = new Map(categories?.map(cat => [cat.name, cat.id]) || []);

  // ============================================================================
  // STEP 2: Prepare items for bulk upsert
  // ============================================================================
  const itemsToUpsert: Array<{
    user_id: string;
    category_id: string;
    name: string;
    unit: string;
    base_material_price: number;
    base_labor_price: number;
  }> = [];

  for (const item of SEED_DATA) {
    // Get category ID
    const mappedCategoryName = categoryMapping[item.category] || item.category;
    const categoryId = categoryMap.get(mappedCategoryName);

    if (!categoryId) {
      logger.error(`[SmartSeed] Category ", {}, ${mappedCategoryName}" (original: "${item.category}") not found. Skipping item "${item.name}".`);
      results.skipped.push(`${item.name} (category not found)`);
      continue;
    }

    // Add to bulk upsert array
    itemsToUpsert.push({
      user_id: user.id,
      category_id: categoryId,
      name: item.name,
      unit: item.unit,
      base_material_price: item.material_price,
      base_labor_price: item.labor_price,
    });
  }

  // ============================================================================
  // STEP 3: Bulk upsert (in batches of 500 for safety)
  // ============================================================================
  if (itemsToUpsert.length > 0) {
    const batchSize = 500;
    const totalBatches = Math.ceil(itemsToUpsert.length / batchSize);
    
    for (let i = 0; i < itemsToUpsert.length; i += batchSize) {
      const batch = itemsToUpsert.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      const { error: upsertError } = await supabase
        .from("catalog_items")
        .upsert(batch, {
          onConflict: 'user_id,name',
          ignoreDuplicates: true
        });

      if (upsertError) {
        logger.error(`[Smart Seed] Error upserting batch ${batchNum}:`, {}, upsertError);
        // Mark all items in this batch as errors
        batch.forEach(item => results.errors.push(`${item.name} (batch upsert failed)`));
      } else {
        // Mark all items in this batch as processed
        batch.forEach(item => results.added.push(item.name));
      }
    }
  }

  revalidatePath("/dashboard/catalog");

  return {
    success: true,
    results,
    summary: {
      added: results.added.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
      total: SEED_DATA.length,
    },
  };
}

// ============================================================================
// ASSEMBLIES SEED FUNCTION
// ============================================================================

export async function seedAssembliesSmart() {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return { error: "Unauthorized" };
  }

  const results = {
    added: [] as string[],
    skipped: [] as string[],
    errors: [] as string[],
  };

  // ============================================================================
  // STEP 1: Fetch all existing assemblies for this user (ONE query)
  // ============================================================================
  const { data: existingAssemblies, error: fetchError } = await supabase
    .from("user_assemblies")
    .select("name")
    .eq("user_id", user.id);

  if (fetchError) {
    logger.error(`[Smart Seed Assemblies] Error fetching existing assemblies:`, {}, fetchError);
    return { error: "Failed to fetch existing assemblies" };
  }

  const existingNames = new Set(existingAssemblies?.map(a => a.name) || []);
  // ============================================================================
  // STEP 2: Prepare items for bulk insert
  // ============================================================================
  const assembliesToInsert = SEED_ASSEMBLIES
    .filter(assembly => {
      if (existingNames.has(assembly.name)) {
        results.skipped.push(assembly.name);
        return false;
      }
      return true;
    })
    .map(assembly => ({
      user_id: user.id,
      name: assembly.name,
      description: assembly.description,
    }));

  // ============================================================================
  // STEP 3: Bulk insert
  // ============================================================================
  if (assembliesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("user_assemblies")
      .insert(assembliesToInsert);

    if (insertError) {
      logger.error(`[Smart Seed Assemblies] Bulk insert error:`, {}, insertError);
      assembliesToInsert.forEach(a => results.errors.push(`${a.name} (bulk insert failed)`));
    } else {
      assembliesToInsert.forEach(a => results.added.push(a.name));
    }
  }

  revalidatePath("/dashboard/assemblies");

  return {
    success: true,
    results,
    summary: {
      added: results.added.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
      total: SEED_ASSEMBLIES.length,
    },
  };
}
