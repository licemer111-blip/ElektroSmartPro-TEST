"use server";

import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface RecalculateResult {
  success: boolean;
  catalogUpdated: number;
  assembliesUpdated: number;
  error?: string;
}

/**
 * Recalculates base_labor_price for all user catalog items and user_assembly_items
 * that have a stored labor_norm_rbh. Called automatically after saving a new hourly rate.
 *
 * @param newRate  New hourly rate (PLN/rbh)
 * @param oldRate  Previous hourly rate — when provided, back-calculates norms for items
 *                 that have base_labor_price > 0 but no stored labor_norm_rbh.
 *
 * Formula: new_base_labor_price = labor_norm_rbh × newRate
 * Back-calc: labor_norm_rbh = old_base_labor_price / oldRate → then recalculate
 */
export async function bulkRecalculateLaborPrices(
  newRate: number,
  oldRate?: number
): Promise<RecalculateResult> {
  const { user, supabase } = await tryAuth();

  if (!user || !supabase) {
    return { success: false, catalogUpdated: 0, assembliesUpdated: 0, error: "Brak autoryzacji" };
  }

  if (newRate <= 0 || newRate > 9999) {
    return { success: false, catalogUpdated: 0, assembliesUpdated: 0, error: "Nieprawidłowa stawka" };
  }

  let catalogUpdated = 0;
  let assembliesUpdated = 0;

  try {
    // ── 1a. Catalog items WITH labor_norm_rbh already stored ──────────────────
    const { data: catalogItemsWithNorm, error: fetchErr1 } = await supabase
      .from("catalog_items")
      .select("id, labor_norm_rbh")
      .eq("user_id", user.id)
      .not("labor_norm_rbh", "is", null)
      .gt("labor_norm_rbh", 0);

    if (fetchErr1) {
      logger.error("bulkRecalculate: fetch catalog_items (phase1) error", {}, fetchErr1);
    } else if (catalogItemsWithNorm && catalogItemsWithNorm.length > 0) {
      for (const item of catalogItemsWithNorm) {
        const newPrice = Math.round((item.labor_norm_rbh as number) * newRate * 100) / 100;
        const { error } = await supabase
          .from("catalog_items")
          .update({ base_labor_price: newPrice, updated_at: new Date().toISOString() })
          .eq("id", item.id)
          .eq("user_id", user.id);
        if (!error) catalogUpdated++;
      }
    }

    // ── 1b-BACK. Catalog items WITHOUT labor_norm_rbh but WITH base_labor_price ─
    // When oldRate is known: back-calculate norm from existing price, store it,
    // then apply newRate so items without KNR codes also get updated.
    if (oldRate && oldRate > 0) {
      const { data: catalogItemsNoPriceNorm, error: fetchErrBack } = await supabase
        .from("catalog_items")
        .select("id, base_labor_price")
        .eq("user_id", user.id)
        .is("labor_norm_rbh", null)
        .gt("base_labor_price", 0);

      if (!fetchErrBack && catalogItemsNoPriceNorm && catalogItemsNoPriceNorm.length > 0) {
        for (const item of catalogItemsNoPriceNorm) {
          const oldPrice = item.base_labor_price as number;
          const backCalcNorm = Math.round((oldPrice / oldRate) * 100000) / 100000;
          if (backCalcNorm <= 0) continue;
          const newPrice = Math.round(backCalcNorm * newRate * 100) / 100;
          const { error: updateErr } = await supabase
            .from("catalog_items")
            .update({
              base_labor_price: newPrice,
              labor_norm_rbh: backCalcNorm,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id)
            .eq("user_id", user.id);
          if (!updateErr) catalogUpdated++;
        }
      }
    }

    // ── 1c. Catalog items WITHOUT labor_norm_rbh but WITH knr_code ────────────
    // Backfill: look up norm from es_dictionary, then recalculate + save norm
    const { data: catalogItemsNoNorm, error: fetchErr2 } = await supabase
      .from("catalog_items")
      .select("id, name, knr_code, base_labor_price")
      .eq("user_id", user.id)
      .is("labor_norm_rbh", null)
      .not("knr_code", "is", null)
      .gt("base_labor_price", 0);

    if (!fetchErr2 && catalogItemsNoNorm && catalogItemsNoNorm.length > 0) {
      const uniqueKnrCodes = [...new Set(
        catalogItemsNoNorm.map(i => i.knr_code as string).filter(Boolean)
      )];

      // Phase 1b-A: exact knr_ref match
      const { data: dictEntries } = await supabaseAdmin
        .from("es_dictionary")
        .select("knr_ref, labor_norm_rbh")
        .in("knr_ref", uniqueKnrCodes)
        .not("labor_norm_rbh", "is", null)
        .gt("labor_norm_rbh", 0);

      const normByKnr = new Map<string, number>();
      for (const entry of dictEntries ?? []) {
        if (entry.knr_ref && entry.labor_norm_rbh && !normByKnr.has(entry.knr_ref)) {
          normByKnr.set(entry.knr_ref as string, entry.labor_norm_rbh as number);
        }
      }

      // Phase 1b-B: name-based fallback for items whose knr_code had no match
      const unmatchedItems = catalogItemsNoNorm.filter(i => !normByKnr.has(i.knr_code as string));
      const normByItemId = new Map<string, number>();

      for (const item of unmatchedItems) {
        const itemName = (item.name as string).trim();
        if (!itemName) continue;
        const { data: byLabel } = await supabaseAdmin
          .from("es_dictionary")
          .select("knr_ref, labor_norm_rbh")
          .ilike("label", `%${itemName}%`)
          .not("labor_norm_rbh", "is", null)
          .gt("labor_norm_rbh", 0)
          .order("labor_norm_rbh", { ascending: true })
          .limit(1);
        if (byLabel && byLabel.length > 0) {
          normByItemId.set(item.id as string, byLabel[0].labor_norm_rbh as number);
        }
      }

      for (const item of catalogItemsNoNorm) {
        const norm = normByKnr.get(item.knr_code as string) ?? normByItemId.get(item.id as string);
        if (!norm) continue;
        const newPrice = Math.round(norm * newRate * 100) / 100;
        const { error } = await supabase
          .from("catalog_items")
          .update({
            base_labor_price: newPrice,
            labor_norm_rbh: norm,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .eq("user_id", user.id);
        if (!error) catalogUpdated++;
      }
    }

    // ── 2. User assembly items ────────────────────────────────────────────────
    const { data: userAssemblies } = await supabase
      .from("user_assemblies")
      .select("id")
      .eq("user_id", user.id);

    const assemblyIds = (userAssemblies ?? []).map(a => a.id as string);

    if (assemblyIds.length > 0) {
      // 2a: Items WITH stored labor_norm_rbh — use as-is (authoritative)
      const { data: asmWithNorm, error: asmFetchErr } = await supabase
        .from("user_assembly_items")
        .select("id, labor_norm_rbh")
        .eq("type", "labor")
        .not("labor_norm_rbh", "is", null)
        .gt("labor_norm_rbh", 0)
        .in("assembly_id", assemblyIds);

      if (asmFetchErr) {
        logger.error("bulkRecalculate: fetch assembly_items error", {}, asmFetchErr);
      } else if (asmWithNorm && asmWithNorm.length > 0) {
        for (const item of asmWithNorm) {
          const norm = item.labor_norm_rbh as number;
          const newPrice = Math.round(norm * newRate * 100) / 100;
          const { error } = await supabase
            .from("user_assembly_items")
            .update({ price: newPrice })
            .eq("id", item.id);
          if (!error) assembliesUpdated++;
        }
      }

      // 2b: Items WITHOUT stored labor_norm_rbh but WITH knr_code — dict as fallback
      const { data: asmNoNorm } = await supabase
        .from("user_assembly_items")
        .select("id, knr_code, name")
        .eq("type", "labor")
        .is("labor_norm_rbh", null)
        .not("knr_code", "is", null)
        .in("assembly_id", assemblyIds);

      if (asmNoNorm && asmNoNorm.length > 0) {
        const asmKnrCodes = [...new Set(asmNoNorm.map(i => i.knr_code as string).filter(Boolean))];

        const { data: asmDictEntries } = await supabaseAdmin
          .from("es_dictionary")
          .select("knr_ref, labor_norm_rbh")
          .in("knr_ref", asmKnrCodes)
          .not("labor_norm_rbh", "is", null)
          .gt("labor_norm_rbh", 0);

        const asmNormByKnr = new Map<string, number>();
        for (const entry of asmDictEntries ?? []) {
          if (entry.knr_ref && entry.labor_norm_rbh && !asmNormByKnr.has(entry.knr_ref)) {
            asmNormByKnr.set(entry.knr_ref as string, entry.labor_norm_rbh as number);
          }
        }

        for (const item of asmNoNorm) {
          const norm = asmNormByKnr.get(item.knr_code as string);
          if (!norm) continue;
          const newPrice = Math.round(norm * newRate * 100) / 100;
          const { error } = await supabase
            .from("user_assembly_items")
            .update({ price: newPrice, labor_norm_rbh: norm })
            .eq("id", item.id);
          if (!error) assembliesUpdated++;
        }
      }
    }

    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/assemblies");

    return { success: true, catalogUpdated, assembliesUpdated };
  } catch (err) {
    logger.error("bulkRecalculate: unexpected error", {}, err);
    return { success: false, catalogUpdated, assembliesUpdated, error: "Błąd przeliczania cen" };
  }
}
