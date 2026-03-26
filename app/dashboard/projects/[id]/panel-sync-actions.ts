"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  computeZestawAggregates,
  SKIP_CONSUMABLE_CATEGORIES,
} from "@/lib/zestawy-logic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PanelSyncModule {
  uid: string;               // RailModule.uid — becomes origin_id
  namePl: string;            // DinModule.namePl
  customName?: string;       // Override name if set
  category: string;          // DinModule.category
  poles: number;             // DIN module width in poles (for busbar share calc)
  rating?: number;           // A rating e.g. 16A
  quantity: number;          // Number of identical modules
  materialPrice: number;     // Final material price (already × manufacturerCoeff)
  laborPrice: number;        // Final labor price
  laborNorm?: number;        // rbh/szt from KNR
  section?: string;          // Section label e.g. "Rozdzielnica główna"
}

export interface PanelSyncInput {
  projectId: string;
  modules: PanelSyncModule[];
  regionModifier: number;
  sectionName?: string;      // Default section name for all synced items
}

export interface PanelSyncResult {
  success: boolean;
  error?: string;
  inserted: number;
  updated: number;
  orphaned: number;          // Rows whose origin_id no longer exists in panel
  zestawInserted: number;    // Aggregate consumable/busbar/assembly rows added
}

// ─── Main sync action ─────────────────────────────────────────────────────────

export async function syncPanelToEstimate(
  input: PanelSyncInput
): Promise<PanelSyncResult> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany", inserted: 0, updated: 0, orphaned: 0, zestawInserted: 0 };
    }

    const { projectId, modules, regionModifier, sectionName } = input;

    // Verify project access (owner or editor)
    const { data: canEdit } = await supabase.rpc("user_can_edit_project", { p_project_id: projectId });
    if (!canEdit) {
      return { success: false, error: "Brak dostępu do projektu", inserted: 0, updated: 0, orphaned: 0, zestawInserted: 0 };
    }

    // Fetch existing panel-linked rows in this project
    const { data: existingRows, error: fetchErr } = await supabase
      .from("project_items")
      .select("id, origin_id, origin_type, name, material_price, labor_price, quantity")
      .eq("project_id", projectId)
      .not("origin_id", "is", null);

    if (fetchErr) {
      logger.error("panel-sync: fetch existing", { projectId }, fetchErr);
      return { success: false, error: "Błąd pobierania istniejących pozycji", inserted: 0, updated: 0, orphaned: 0, zestawInserted: 0 };
    }

    // Build lookup maps: origin_id → row (material), labor, and aggregate (consumable/busbar/assembly)
    type ExistingRow = { id: string; origin_id: string; origin_type: string; name: string; material_price: number; labor_price: number; quantity: number };
    const materialMap = new Map<string, ExistingRow>();
    const laborMap = new Map<string, ExistingRow>();
    const aggregateMap = new Map<string, ExistingRow>(); // key = aggregateKey
    for (const row of (existingRows ?? []) as ExistingRow[]) {
      if (row.origin_type === "panel_material") materialMap.set(row.origin_id, row);
      else if (row.origin_type === "panel_labor") laborMap.set(row.origin_id, row);
      else if (["panel_consumable", "panel_busbar", "panel_assembly"].includes(row.origin_type)) {
        aggregateMap.set(row.origin_id, row); // origin_id = aggregateKey for these
      }
    }

    // Current UIDs from panel
    const currentUids = new Set(modules.map(m => m.uid));

    // Detect orphaned rows (origin_id gone from panel) — only module rows, not aggregates
    const orphanedIds: string[] = [];
    for (const [uid, row] of materialMap) {
      if (!currentUids.has(uid)) orphanedIds.push(row.id);
    }
    for (const [uid, row] of laborMap) {
      if (!currentUids.has(uid)) orphanedIds.push(row.id);
    }

    // Detect if this is the first sync (no existing panel rows at all)
    const isFirstSync = materialMap.size === 0 && laborMap.size === 0 && aggregateMap.size === 0;

    // Get max sort_order
    const { data: maxSort } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let sortOrder = (maxSort?.sort_order ?? 0) + 1;

    // Build upsert payload
    const toInsertMaterial: object[] = [];
    const toInsertLabor: object[] = [];
    const toUpdateMaterial: { id: string; patch: object }[] = [];
    const toUpdateLabor: { id: string; patch: object }[] = [];

    for (const mod of modules) {
      const itemName = mod.customName || mod.namePl;
      const ratingStr = mod.rating ? ` ${mod.rating}A` : "";
      const materialName = `${itemName}${ratingStr}`;
      const laborName = `Montaż: ${itemName}${ratingStr}`;

      const qty = mod.quantity ?? 1;
      const matPrice = mod.materialPrice; // Iron Rule: no regionModifier on material
      const labPrice = mod.laborPrice; // BASE price — calcRowPrices applies regionModifier at display time

      const existingMat = materialMap.get(mod.uid);
      const existingLab = laborMap.get(mod.uid);

      if (existingMat) {
        // Update — only name, price, quantity; never touch user discounts/notes
        toUpdateMaterial.push({
          id: existingMat.id,
          patch: {
            name: materialName,
            material_price: matPrice,
            final_material_price: matPrice,
            labor_price: 0,
            final_labor_price: 0,
            quantity: qty,
            section: sectionName ?? "Rozdzielnica",
          },
        });
      } else {
        toInsertMaterial.push({
          project_id: projectId,
          catalog_item_id: null,
          name: materialName,
          description: `Rozdzielnica • ${mod.category}`,
          unit: "szt" as const,
          quantity: qty,
          material_price: matPrice,
          labor_price: 0,
          final_material_price: matPrice,
          final_labor_price: 0,
          is_custom: true,
          origin_id: mod.uid,
          origin_type: "panel_material",
          confidence_level: "verified",
          confidence_note: `ES-KNR 2026 · ${mod.category}`,
          section: sectionName ?? "Rozdzielnica",
          sort_order: sortOrder++,
        });
      }

      // Labor row (only if laborPrice > 0)
      if (labPrice > 0 || (mod.laborNorm ?? 0) > 0) {
        const laborNorm = mod.laborNorm ?? null;
        const laborHours = laborNorm != null ? laborNorm * qty : null;

        if (existingLab) {
          toUpdateLabor.push({
            id: existingLab.id,
            patch: {
              name: laborName,
              material_price: 0,
              final_material_price: 0,
              labor_price: labPrice,
              final_labor_price: labPrice,
              quantity: qty,
              labor_norm: laborNorm,
              labor_hours_total: laborHours,
              section: sectionName ?? "Rozdzielnica",
            },
          });
        } else {
          toInsertLabor.push({
            project_id: projectId,
            catalog_item_id: null,
            name: laborName,
            description: `Robocizna • ${mod.category}`,
            unit: "szt" as const,
            quantity: qty,
            material_price: 0,
            labor_price: labPrice,
            final_material_price: 0,
            final_labor_price: labPrice,
            labor_norm: laborNorm,
            labor_hours_total: laborHours,
            is_custom: true,
            origin_id: mod.uid,
            origin_type: "panel_labor",
            confidence_level: "verified",
            confidence_note: `ES-KNR 2026 · robocizna`,
            section: sectionName ?? "Rozdzielnica",
            sort_order: sortOrder++,
          });
        }
      }
    }

    // Execute all DB operations
    let inserted = 0;
    let updated = 0;

    // Bulk insert material rows
    if (toInsertMaterial.length > 0) {
      const { error } = await supabase.from("project_items").insert(toInsertMaterial);
      if (error) {
        logger.error("panel-sync: insert material", { projectId }, error);
        return { success: false, error: "Błąd wstawiania pozycji materiałowych", inserted: 0, updated: 0, orphaned: 0, zestawInserted: 0 };
      }
      inserted += toInsertMaterial.length;
    }

    // Bulk insert labor rows
    if (toInsertLabor.length > 0) {
      const { error } = await supabase.from("project_items").insert(toInsertLabor);
      if (error) {
        logger.error("panel-sync: insert labor", { projectId }, error);
        return { success: false, error: "Błąd wstawiania pozycji robocizny", inserted: 0, updated: 0, orphaned: 0, zestawInserted: 0 };
      }
      inserted += toInsertLabor.length;
    }

    // Update changed rows one-by-one (or batch via RPC if available)
    for (const { id, patch } of [...toUpdateMaterial, ...toUpdateLabor]) {
      const { error } = await supabase.from("project_items").update(patch).eq("id", id);
      if (error) {
        logger.error("panel-sync: update row", { id }, error);
      } else {
        updated++;
      }
    }

    // Mark orphaned rows — soft-delete by updating description
    if (orphanedIds.length > 0) {
      await supabase
        .from("project_items")
        .update({ description: "[⚠️ Moduł usunięty z rozdzielnicy]" })
        .in("id", orphanedIds);
    }

    // ══ ZESTAW AGGREGATE ROWS (consumables, busbar share, panel assembly) ══
    // Compute aggregated positions for the whole panel
    const zestawModules = modules
      .filter(m => !SKIP_CONSUMABLE_CATEGORIES.has(m.category))
      .map(m => ({ uid: m.uid, category: m.category, poles: m.poles, quantity: m.quantity }));

    const aggregates = computeZestawAggregates(zestawModules, isFirstSync);
    let zestawInserted = 0;

    for (const agg of aggregates) {
      const existing = aggregateMap.get(agg.aggregateKey);

      if (existing) {
        // Update quantity + price
        await supabase.from("project_items").update({
          name: agg.name,
          quantity: agg.totalQty,
          material_price: agg.originType === "panel_assembly" ? 0 : agg.totalPrice,
          labor_price: agg.originType === "panel_assembly" ? agg.totalPrice : 0,
          final_material_price: agg.originType === "panel_assembly" ? 0 : agg.totalPrice,
          final_labor_price: agg.originType === "panel_assembly" ? agg.totalPrice : 0,
        }).eq("id", existing.id);
      } else {
        const isLabor = agg.originType === "panel_assembly";
        await supabase.from("project_items").insert({
          project_id: projectId,
          catalog_item_id: null,
          name: agg.name,
          description: `Zestaw rozdzielnica • ${agg.originType}`,
          unit: agg.unit,
          quantity: agg.totalQty,
          material_price: isLabor ? 0 : agg.totalPrice,
          labor_price: isLabor ? agg.totalPrice : 0,
          final_material_price: isLabor ? 0 : agg.totalPrice,
          final_labor_price: isLabor ? agg.totalPrice : 0,
          is_custom: true,
          origin_id: agg.aggregateKey,
          origin_type: agg.originType,
          confidence_level: "verified",
          confidence_note: "ES-KNR 2026 · Zestaw rozdzielnica",
          section: sectionName ?? "Rozdzielnica",
          sort_order: sortOrder++,
        });
        zestawInserted++;
      }
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      inserted,
      updated,
      orphaned: orphanedIds.length,
      zestawInserted,
    };
  } catch (err) {
    logger.error("panel-sync: unexpected", {}, err);
    return { success: false, error: "Nieoczekiwany błąd synchronizacji", inserted: 0, updated: 0, orphaned: 0, zestawInserted: 0 };
  }
}

// ─── Get panel-linked items for a project ─────────────────────────────────────

export async function getPanelLinkedItemIds(projectId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_items")
    .select("origin_id")
    .eq("project_id", projectId)
    .not("origin_id", "is", null);
  return (data ?? []).map((r: { origin_id: string }) => r.origin_id).filter(Boolean);
}
