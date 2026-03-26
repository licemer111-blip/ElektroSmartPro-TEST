// ═══════════════════════════════════════════════════════════════════
// lib/services/composer-engine.ts
// ES-Engine Composer — Dynamic unpacking of composite Zestawy.
// Given a recognized composite item + EngineCalibration, returns
// an array of child items (UnpackedChild[]) ready to insert into DB.
// ═══════════════════════════════════════════════════════════════════

import type { EngineCalibration } from "@/app/dashboard/settings/knr-calculator/_parts/KnrEngineCalibration";
import {
  findRecipeByKeyword,
  findRecipeByKey,
  type RecipeComponent,
  type ZestawRecipe,
} from "@/lib/config/zestawy-recipes";
import type { UnitType } from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnpackedChild {
  componentId: string;          // stable recipe component id
  type: "robocizna" | "material";
  label: string;
  unit: UnitType;
  quantity: number;             // computed: qtyFactor × parentQty
  qtyFactor: number;            // stored for linked-edit recalculation
  knrRef: string | null;
  laborNormRbh: number | null;
  metadata: { qty_factor: number; component_id: string }; // JSONB metadata for DB
}

// Metadata shapes stored in project_items.metadata
export interface ParentItemMeta {
  recipe_key: string;
}
export interface ChildItemMeta {
  qty_factor: number;
  component_id: string;
}

export interface UnpackResult {
  recipe: ZestawRecipe;
  children: UnpackedChild[];
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Unpack a composite zestaw item into its child components.
 *
 * @param item    Recognized composite item (is_composite=true)
 * @param calibration  Current ES-Engine calibration (defaultMontage drives conditional components)
 * @returns UnpackResult with recipe and computed children, or null if no recipe matches
 */
export function unpackCompositeItem(
  item: { name: string; quantity: number; knr_code?: string | null },
  calibration: EngineCalibration
): UnpackResult | null {
  const recipe = findRecipeByKeyword(item.name);
  if (!recipe) return null;

  return buildUnpackResult(recipe, item.quantity, calibration);
}

/**
 * Unpack by explicit recipe key (used in linked-edit recalculation).
 */
export function unpackByRecipeKey(
  recipeKey: string,
  parentQty: number,
  calibration: EngineCalibration
): UnpackResult | null {
  const recipe = findRecipeByKey(recipeKey);
  if (!recipe) return null;

  return buildUnpackResult(recipe, parentQty, calibration);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function buildUnpackResult(
  recipe: ZestawRecipe,
  parentQty: number,
  calibration: EngineCalibration
): UnpackResult {
  const children: UnpackedChild[] = recipe.components
    .filter((comp) => isComponentActive(comp, calibration))
    .map((comp) => ({
      componentId:  comp.id,
      type:         comp.type,
      label:        comp.label,
      unit:         normalizeUnit(comp.unit),
      quantity:     roundQty(comp.qtyFactor * parentQty),
      qtyFactor:    comp.qtyFactor,
      knrRef:       comp.knrRef ?? null,
      laborNormRbh: comp.laborNormRbh ?? null,
      metadata:     { qty_factor: comp.qtyFactor, component_id: comp.id },
    }));

  return { recipe, children };
}

function isComponentActive(comp: RecipeComponent, calibration: EngineCalibration): boolean {
  if (!comp.onlyForMontage || comp.onlyForMontage.length === 0) return true;
  return comp.onlyForMontage.includes(calibration.defaultMontage);
}

function roundQty(qty: number): number {
  return Math.round(qty * 100) / 100;
}

const UNIT_MAP: Record<string, UnitType> = {
  szt:  "szt",
  mb:   "mb",
  m:    "m",
  kpl:  "kpl",
  kplt: "kpl",
  h:    "h",
  rbh:  "h",
};

function normalizeUnit(unit: string): UnitType {
  return UNIT_MAP[unit.toLowerCase()] ?? "szt";
}

// ─── Linked-Edit Recalculation ────────────────────────────────────────────────

/**
 * Given a new parent quantity and existing child items (from DB), compute
 * updated quantities for each child that has recipe metadata in `notes`.
 * Children without metadata (manually edited) are left unchanged.
 */
export interface ChildQtyUpdate {
  id: string;
  newQty: number;
}

export function recalcChildrenQty(
  newParentQty: number,
  children: Array<{ id: string; metadata?: Record<string, unknown> | null; notes?: string | null; quantity: number }>
): ChildQtyUpdate[] {
  return children
    .map((child) => {
      // Primary: read from metadata JSONB (post-migration)
      const meta = child.metadata as ChildItemMeta | null | undefined;
      if (meta?.qty_factor != null && !isNaN(meta.qty_factor)) {
        return { id: child.id, newQty: roundQty(meta.qty_factor * newParentQty) };
      }
      // Fallback: legacy notes string (pre-migration)
      const notes = child.notes;
      if (!notes) return null;
      const match = notes.match(/_qf:([\d.]+):/);
      if (!match) return null;
      const qtyFactor = parseFloat(match[1]);
      if (isNaN(qtyFactor)) return null;
      return { id: child.id, newQty: roundQty(qtyFactor * newParentQty) };
    })
    .filter((u): u is ChildQtyUpdate => u !== null);
}
