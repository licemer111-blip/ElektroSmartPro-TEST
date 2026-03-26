/**
 * lib/services/materials-catalog.ts
 * ─────────────────────────────────────────────────────────────────
 * Server-side functions for materials_catalog table.
 * Used by pricing pipeline to resolve base prices from search_slug.
 *
 * Exports:
 *   lookupMaterialBySlug(slug, supabase)  → MaterialCatalogRow | null
 *   batchLookupMaterials(slugs, supabase) → Map<slug, MaterialCatalogRow>
 *   resolveMaterialBillPrices(bill, qty, context, supabase) → ResolvedMaterialBill
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateMaterialTotal,
  type MaterialPriceContext,
  type MaterialTotal,
  CABLE_WASTE_FACTOR,
  CONSUMABLE_WASTE_FACTOR,
  DEFAULT_WASTE_FACTOR,
  type MaterialCategory,
} from "@/lib/services/material-classifier";
import {
  getMaterialBill,
  type MaterialBillItem,
} from "@/lib/config/material-bill-bridge";
import type { SemanticIntent } from "@/lib/services/semantic-classifier";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface MaterialCatalogRow {
  id:             string;
  name:           string;
  search_slug:    string;
  category:       "CABLE" | "PROTECTION" | "INSTALLATION" | "CONSUMABLE";
  base_unit:      "mb" | "szt" | "kg" | "op";
  price_netto:    number;
  package_size:   number;
  waste_override: number | null;
  brand:          string | null;
}

export interface ResolvedBillItem {
  item:          MaterialBillItem;
  scaledQty:     number;                  // raw decimal qty (= qtyFactor × parentQty)
  discreteQty:   number;                  // ceil'd for BREAKER/BOX, same as scaledQty for bulk
  displayHint?:  string;                  // "11.0 mb (~0.11 × 100mb)" for cables
  catalogPrice:  number;                  // resolved from DB (or refPricePLN fallback)
  packageSize:   number;                  // from materials_catalog.package_size
  priceSource:   "catalog" | "fallback";
  total:         MaterialTotal;
}

export interface ResolvedMaterialBill {
  intent:      SemanticIntent;
  parentQty:   number;
  items:       ResolvedBillItem[];
  /** Sum of totalNet across all items. */
  totalNet:    number;
  /** Sum of totalGross across all items. */
  totalGross:  number;
}

// ─────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Fetches a single material by search_slug.
 * Returns null if not found or inactive.
 */
export async function lookupMaterialBySlug(
  slug: string,
  supabase: SupabaseClient
): Promise<MaterialCatalogRow | null> {
  const { data, error } = await supabase
    .from("materials_catalog")
    .select("id, name, search_slug, category, base_unit, price_netto, package_size, waste_override, brand")
    .eq("search_slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as MaterialCatalogRow;
}

/**
 * Batch fetches multiple materials by search_slug in a single query.
 * Returns a Map for O(1) lookups by slug.
 */
export async function batchLookupMaterials(
  slugs: string[],
  supabase: SupabaseClient
): Promise<Map<string, MaterialCatalogRow>> {
  if (slugs.length === 0) return new Map();

  const { data, error } = await supabase
    .from("materials_catalog")
    .select("id, name, search_slug, category, base_unit, price_netto, package_size, waste_override, brand")
    .in("search_slug", slugs)
    .eq("is_active", true);

  const map = new Map<string, MaterialCatalogRow>();
  if (error || !data) return map;
  for (const row of data) map.set(row.search_slug, row as MaterialCatalogRow);
  return map;
}

// ─────────────────────────────────────────────────────────────────
// Waste factor resolution
// ─────────────────────────────────────────────────────────────────

/**
 * Maps MaterialCatalogRow category to MaterialCategory for waste factor lookup.
 * materials_catalog uses broader categories than material-classifier.
 */
function catalogCategoryToMaterialCategory(cat: string): MaterialCategory {
  switch (cat) {
    case "CABLE":       return "CABLE";
    case "PROTECTION":  return "BREAKER";
    case "INSTALLATION": return "BOX";
    case "CONSUMABLE":  return "PLASTER";
    default:            return "GENERAL";
  }
}

function getWasteFactor(row: MaterialCatalogRow): number {
  if (row.waste_override != null) return row.waste_override;
  const cat = catalogCategoryToMaterialCategory(row.category);
  switch (cat) {
    case "CABLE":   return CABLE_WASTE_FACTOR;
    case "PLASTER": return CONSUMABLE_WASTE_FACTOR;
    default:        return DEFAULT_WASTE_FACTOR;
  }
}

// ─────────────────────────────────────────────────────────────────
// Main resolution function
// ─────────────────────────────────────────────────────────────────

/**
 * Resolves full MaterialBill for a given intent, fetching real catalog prices.
 *
 * @param intent      — SemanticIntent from classifyIntent(itemName)
 * @param parentQty   — quantity of the parent labor item
 * @param vatRate     — from project.vat_rate (8 or 23)
 * @param marginPct   — from profiles.material_margin (default 15)
 * @param supabase    — authenticated Supabase client
 */
export async function resolveMaterialBillPrices(
  intent: SemanticIntent,
  parentQty: number,
  vatRate: 8 | 23,
  marginPct: number,
  supabase: SupabaseClient,
  options?: { excludeCategories?: MaterialCategory[]; extraItems?: MaterialBillItem[] }
): Promise<ResolvedMaterialBill | null> {
  const rawBill = getMaterialBill(intent);
  if (!rawBill) return null;

  // Apply exclusion filter
  const filteredItems = options?.excludeCategories?.length
    ? rawBill.items.filter((i) => !options.excludeCategories!.includes(i.category))
    : rawBill.items;

  // Merge expert hint items (deduplicated by slug)
  const existingSlugs = new Set(filteredItems.map((i) => i.slug));
  const extra = (options?.extraItems ?? []).filter((i) => !existingSlugs.has(i.slug));
  const allItems = [...filteredItems, ...extra];

  if (!allItems.length) return null;

  const bill = { ...rawBill, items: allItems };
  const slugs = bill.items.map((i) => i.slug);
  const catalogMap = await batchLookupMaterials(slugs, supabase);

  let totalNet   = 0;
  let totalGross = 0;

  const resolvedItems: ResolvedBillItem[] = bill.items.map((item) => {
    const scaledQty  = Math.round(item.qtyFactor * parentQty * 100) / 100;
    const catalogRow = catalogMap.get(item.slug);
    const basePrice  = catalogRow ? catalogRow.price_netto : item.refPricePLN;
    const pkgSize    = catalogRow?.package_size ?? 1;
    const wasteFactor = catalogRow
      ? getWasteFactor(catalogRow)
      : (item.category === "CABLE" ? CABLE_WASTE_FACTOR
        : item.category === "PLASTER" ? CONSUMABLE_WASTE_FACTOR
        : DEFAULT_WASTE_FACTOR);

    const matCat = catalogRow
      ? catalogCategoryToMaterialCategory(catalogRow.category)
      : undefined;

    const ctx: MaterialPriceContext = {
      qty:         scaledQty,
      basePrice,
      wasteFactor,
      vatRate,
      marginPct,
      category:    matCat,
      packageSize: pkgSize > 1 ? pkgSize : undefined,
      unit:        item.unit,
    };

    const total = calculateMaterialTotal(ctx);
    totalNet   += total.totalNet;
    totalGross += total.totalGross;

    return {
      item,
      scaledQty,
      discreteQty:  total.discreteQty,
      displayHint:  total.displayHint,
      catalogPrice: basePrice,
      packageSize:  pkgSize,
      priceSource:  catalogRow ? "catalog" : "fallback",
      total,
    };
  });

  return {
    intent,
    parentQty,
    items:      resolvedItems,
    totalNet:   Math.round(totalNet   * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
  };
}
