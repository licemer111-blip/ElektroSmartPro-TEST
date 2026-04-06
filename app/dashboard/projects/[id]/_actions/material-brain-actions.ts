"use server";
/**
 * app/dashboard/projects/[id]/_actions/material-brain-actions.ts
 * ─────────────────────────────────────────────────────────────────
 * Server action: resolves Material Brain bills for all labor items
 * in a project. Called when "Klient + Materiały" mode is active
 * (!materials_owned_by_customer).
 */

import { tryAuth } from "@/lib/auth";
import { classifyIntent } from "@/lib/services/semantic-classifier";
import { getMaterialBill } from "@/lib/config/material-bill-bridge";
import { getForbiddenCategories } from "@/lib/services/material-constraints";
import { getExpertHints } from "@/lib/config/expert-hints";
import {
  resolveMaterialBillPrices,
  type ResolvedMaterialBill,
} from "@/lib/services/materials-catalog";
import type { SemanticIntent, SemanticProfile } from "@/lib/services/semantic-classifier";
import { revalidatePath } from "next/cache";

export interface ItemMaterialBill {
  itemId:    string;
  itemName:  string;
  itemQty:   number;
  intent:    SemanticIntent;
  profile:   SemanticProfile;
  bill:      ResolvedMaterialBill;
}

export interface MaterialBrainResult {
  bills:       ItemMaterialBill[];
  totalNet:    number;
  totalGross:  number;
  error?:      string;
}

/**
 * Resolves Material Brain suggestions for all applicable labor items.
 *
 * Logic:
 *   1. Fetch project (vat_rate) + profile (material_margin)
 *   2. For each item with labor_price > 0: classifyIntent → getMaterialBill
 *   3. If bill exists: resolveMaterialBillPrices (catalog prices + fallback)
 *   4. Return aggregated results
 */
export async function getMaterialBillForProject(
  projectId: string
): Promise<MaterialBrainResult> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { bills: [], totalNet: 0, totalGross: 0, error: "Musisz być zalogowany" };

  const [{ data: project }, { data: profile }, { data: items }] = await Promise.all([
    supabase.from("projects").select("id, vat_rate").eq("id", projectId).single(),
    supabase.from("profiles").select("material_margin").eq("id", user.id).single(),
    supabase.from("project_items")
      .select("id, name, quantity, labor_price, final_labor_price, is_assembly_child, confidence_level")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  if (!project || !items) return { bills: [], totalNet: 0, totalGross: 0, error: "Nie znaleziono projektu" };

  const vatRate: 8 | 23 = (project.vat_rate === 8 ? 8 : 23);
  const marginPct: number = profile?.material_margin ?? 15;

  const bills: ItemMaterialBill[] = [];
  let totalNet   = 0;
  let totalGross = 0;

  for (const item of items) {
    if (item.is_assembly_child) continue;
    const effectiveLabor = item.final_labor_price ?? item.labor_price ?? 0;
    if (effectiveLabor <= 0) continue;

    const profile = classifyIntent(item.name);
    if (!getMaterialBill(profile.intent)) continue;

    // Atomic Guard v1.7 — per-intent material constraints:
    // Zestaw (Punkt/Komplet/Zestaw) → full bill (no filter)
    // STANDARD_ACTION → forbid CABLE, CONDUIT
    // CABLE_LAYING → forbid SOCKET, SWITCH, BOX, BREAKER
    // HARD_CONSTRUCTION / DRILLING_HARD → forbid all device+cable categories
    // DISTRIBUTION_BOARD → forbid CABLE, CONDUIT
    // LIGHTING/AUTOMATION (GENERAL) → forbid CABLE, CONDUIT (name-based)
    const forbiddenCategories = getForbiddenCategories(profile.intent, item.name);

    // Expert Hints v1.8 — mandatory inclusions (positive logic):
    // Wypust/Oprawa → Kostka WAGO; Siła/Indukcja → Złącze CEE;
    // Rozdzielnica → Szyna N/PE + SPD; KNX → Nakoneczniki NSHVI
    // Beton → Kołki rozporowe; GK → Kołki Molly; Drewno → Wkręty
    const rawHints = getExpertHints(item.name);

    // Smart Pack Multiplicity (v1.8): hints with unitsPerPack get exact pack count.
    // finalPacks = ceil(laborQty / unitsPerPack); qtyFactor = finalPacks / laborQty
    // so that resolveMaterialBillPrices(... qty=laborQty) yields exactly finalPacks.
    const expertHints = item.quantity > 0
      ? rawHints.map((hint) => {
          if (hint.unitsPerPack && hint.unitsPerPack > 0) {
            const finalPacks = Math.ceil(item.quantity / hint.unitsPerPack);
            return { ...hint, qtyFactor: finalPacks / item.quantity };
          }
          return hint;
        })
      : rawHints;

    const resolved = await resolveMaterialBillPrices(
      profile.intent,
      item.quantity,
      vatRate,
      marginPct,
      supabase,
      {
        excludeCategories: forbiddenCategories,
        extraItems:        expertHints.length ? expertHints : undefined,
      }
    );
    if (!resolved) continue;

    bills.push({
      itemId:   item.id,
      itemName: item.name,
      itemQty:  item.quantity,
      intent:   profile.intent,
      profile,
      bill:     resolved,
    });

    totalNet   += resolved.totalNet;
    totalGross += resolved.totalGross;
  }

  return {
    bills,
    totalNet:   Math.round(totalNet   * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────

/** Single material item to persist to project_materials. */
export interface SaveMaterialItem {
  name:         string;
  slug:         string;
  unit:         string;
  qtyRaw:       number;
  qtyDiscrete:  number;
  basePrice:    number;
  wasteFactor:  number;
  marginPct:    number;
  vatRate:      number;
  totalNet:     number;
  totalGross:   number;
  calcLog:      string;
  displayHint?: string;
}

export interface SaveMaterialsResult {
  success: boolean;
  saved:   number;
  error?:  string;
}

/**
 * Persists confirmed Material Brain suggestions to project_materials table.
 * Each row inherits margin_pct and vat_rate from the expert pricing context.
 *
 * @param projectId    — project UUID
 * @param laborItemId  — parent project_items.id (labor row that generated this bill)
 * @param items        — selected material items to save
 */
export async function saveProjectMaterials(
  projectId: string,
  laborItemId: string,
  items: SaveMaterialItem[]
): Promise<SaveMaterialsResult> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { success: false, saved: 0, error: "Musisz być zalogowany" };
  if (items.length === 0) return { success: false, saved: 0, error: "Brak wybranych materiałów" };

  // Idempotent: remove any prior saves for this labor item before inserting fresh selection.
  // Prevents duplicate rows if the user opens the Expert Panel and saves a second time.
  await supabase
    .from("project_materials")
    .delete()
    .eq("project_id", projectId)
    .eq("labor_item_id", laborItemId);

  const rows = items.map((item) => ({
    project_id:    projectId,
    labor_item_id: laborItemId,
    name:          item.name,
    slug:          item.slug,
    unit:          item.unit,
    qty_raw:       item.qtyRaw,
    qty_discrete:  item.qtyDiscrete,
    base_price:    item.basePrice,
    waste_factor:  item.wasteFactor,
    margin_pct:    item.marginPct,
    vat_rate:      item.vatRate,
    total_net:     item.totalNet,
    total_gross:   item.totalGross,
    calc_log:      item.calcLog,
    display_hint:  item.displayHint ?? null,
    is_from_brain: true,
  }));

  const { error, count } = await supabase
    .from("project_materials")
    .insert(rows)
    .select("id");

  if (error) return { success: false, saved: 0, error: error.message };

  return { success: true, saved: count ?? rows.length };
}

/**
 * Call ONCE after all saveProjectMaterials calls in a batch complete.
 * Avoids N revalidatePath calls (one per labor item) that each generate
 * a separate Edge Function invocation.
 */
export async function revalidateProjectMaterialsPage(
  projectId: string
): Promise<void> {
  revalidatePath(`/dashboard/projects/${projectId}`);
  // return is intentionally void — fire-and-forget from client
}
