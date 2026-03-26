/**
 * Labor Time Calculation Helpers
 *
 * CASE 1 (AI/KNR): labor_norm provided → calculate hours_total + labor_price
 * CASE 2 (Manual): user types price directly → keep as-is, optionally back-calc hours
 *
 * labor_price remains the single source of truth for PDF and totals.
 */

export interface LaborCalcInput {
  quantity: number;
  laborNorm: number | null | undefined;
  hourlyRate: number;
  manualLaborPrice?: number | null;
}

export interface LaborCalcResult {
  laborHoursTotal: number | null;
  laborPrice: number;
  source: "KNR" | "manual";
}

/**
 * Calculate labor price from norm (CASE 1: AI/KNR path).
 * Returns null hours if norm is not set.
 */
export function calcLaborFromNorm(
  quantity: number,
  laborNorm: number,
  hourlyRate: number
): LaborCalcResult {
  const laborHoursTotal = Math.round(quantity * laborNorm * 100) / 100;
  const laborPrice = Math.round(laborHoursTotal * hourlyRate * 100) / 100;
  return { laborHoursTotal, laborPrice, source: "KNR" };
}

/**
 * Reverse-calculate hours from manual price (CASE 2: optional).
 * Returns null if hourlyRate is 0 to avoid division by zero.
 */
export function backCalcHoursFromPrice(
  quantity: number,
  laborPrice: number,
  hourlyRate: number
): number | null {
  if (!hourlyRate || !quantity) return null;
  const totalHours = laborPrice / hourlyRate;
  const normPerUnit = Math.round((totalHours / quantity) * 1000) / 1000;
  return normPerUnit;
}

/**
 * Format hours for display: "2.50 rbh" or "0.35 rbh/mb"
 */
export function formatLaborHours(
  hoursTotal: number | null | undefined,
  laborNorm: number | null | undefined,
  quantity?: number,
  unit?: string | null
): string {
  if (!hoursTotal && !laborNorm) return "—";
  const parts: string[] = [];
  if (hoursTotal != null) parts.push(`${hoursTotal.toFixed(2)} rbh`);
  if (laborNorm != null && quantity && quantity > 1) {
    parts.push(`(${laborNorm.toFixed(3)} rbh/${unit ?? "szt"})`);
  }
  return parts.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit Scaling Layer (v2.3)
//
// KNR dictionaries store norms in their own units: "100mb", "10mb", "m", "szt".
// Project items use project units: "m", "mb", "km", "szt", "kpl".
//
// Formula: labor_norm_stored = rawNorm × (itemBaseSize / dictBaseSize)
//   → stored labor_norm is ALWAYS in "rbh per 1 item unit"
//   → labor_hours_total = quantity × labor_norm  (no further scaling needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns how many base units are in one unit string.
 * Used for both dictionary units AND project item units.
 *
 * Examples:
 *   "100mb" → 100  (norm is per 100 metres)
 *   "km"    → 1000 (item quantity in km, norm per m)
 *   "mb"    → 1    (base unit — no scaling)
 */
export function getUnitBaseSize(unit: string | null | undefined): number {
  const u = (unit ?? "").toLowerCase().replace(/\s+/g, "").trim();
  if (u === "km")                         return 1000;
  if (u === "100m" || u === "100mb")      return 100;
  if (u === "10m"  || u === "10mb")       return 10;
  if (u === "100szt" || u === "100 szt")  return 100;
  if (u === "10szt"  || u === "10 szt")   return 10;
  return 1;
}

/**
 * Scale a raw KNR dictionary norm to "rbh per 1 item unit".
 *
 * @param rawNorm     - labor_norm_rbh from es_dictionary (per dictUnit)
 * @param dictUnit    - unit column of the matched es_dictionary row
 * @param itemUnit    - unit of the project item
 * @returns scaled norm (rbh / 1 itemUnit), rounded to 6 decimal places
 */
export function scaleLaborNorm(
  rawNorm: number,
  dictUnit: string | null | undefined,
  itemUnit: string | null | undefined
): number {
  const itemBase = getUnitBaseSize(itemUnit);
  const dictBase = getUnitBaseSize(dictUnit);
  const scaled = rawNorm * (itemBase / dictBase);
  return Math.round(scaled * 1_000_000) / 1_000_000;
}

/**
 * Total labor hours across all project items.
 * Priority: labor_hours_total (DB calculated) → labor_norm * quantity (fallback)
 */
export function sumLaborHours(
  items: Array<{ labor_hours_total?: number | null; labor_norm?: number | null; quantity?: number }>
): number {
  return items.reduce((sum, item) => {
    if (item.labor_hours_total != null && item.labor_hours_total > 0) {
      return sum + item.labor_hours_total;
    }
    if (item.labor_norm != null && item.labor_norm > 0 && item.quantity) {
      return sum + Math.round(item.labor_norm * item.quantity * 100) / 100;
    }
    return sum;
  }, 0);
}
