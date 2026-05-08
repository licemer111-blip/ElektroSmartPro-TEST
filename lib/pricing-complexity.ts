// ============================================================
// pricing-complexity.ts — Quick Estimate context → labor multiplier
// ============================================================
// Pure helper. Maps the conditional fields captured by the Quick Estimate
// Wizard (ceiling height, expert systems, etc.) to a single labor
// multiplier (`complexity_factor`) that flows through:
//
//   project.complexity_factor   (DB column, numeric, default 1.0)
//        │
//        ▼
//   ProjectTabContainer  → reads project.complexity_factor
//        │
//        ▼
//   EstimateRow.calcRowPrices(complexityFactor) → display-time multiplier
//        │
//        ▼
//   ProjectSummary.calculateTotals(complexityFactor) → must MIRROR row formula
//
// Why a single derived factor instead of separate fields?
//   - calcRowPrices already accepts ONE complexity factor. Adding more would
//     require reshaping the entire pricing flow + parity tests.
//   - The raw inputs are kept in `project.quick_estimate_context` (jsonb) so
//     the UI can show a transparent breakdown ("+25% wysokość, +35% SSP").
//
// Source of multipliers:
//   - Ceiling height: KNR 5-08 admin coefficients for praca na wysokości:
//       <3m  → 1.00 (standard)
//       3-6m → 1.25 (KNR 'praca na wysokości' I stopnia)
//       >6m  → 1.50 (KNR 'praca na wysokości' II stopnia)
//   - Expert systems: 1.35 if ANY of (SSP addressable, KNX/RCU, PA, RACS)
//     is enabled — these require specialist technicians (instead of standard
//     electricians) and the labor rate uplift reflects the specialist day-rate.
// ============================================================

import type { ConditionalFields } from "./quick-estimate-config";

/** Public type — what we store in projects.quick_estimate_context */
export type QuickEstimateContext = ConditionalFields;

export interface ComplexityBreakdown {
  /** The single multiplier passed to calcRowPrices and ProjectSummary. */
  factor: number;
  /** Subset multiplier — KNR praca na wysokości. */
  ceilingMult: number;
  /** Subset multiplier — specialist day-rate uplift. */
  expertMult: number;
  /** Human-readable Polish lines for UI tooltip. */
  breakdown: string[];
}

/**
 * Compute the complexity factor from Quick Estimate conditional fields.
 *
 * Returns 1.0 (no-op) for null/undefined/empty contexts so it is safe to
 * call on every project regardless of how it was created.
 *
 * IMPORTANT: rounds the final factor to 3 decimal places to keep
 * Σ(rows) === SUMA NETTO parity reproducible across DB roundtrips
 * (numeric column rounds to 6 places by default).
 */
export function computeComplexityFromContext(
  ctx: QuickEstimateContext | null | undefined,
): ComplexityBreakdown {
  if (!ctx || typeof ctx !== "object") {
    return { factor: 1.0, ceilingMult: 1.0, expertMult: 1.0, breakdown: [] };
  }

  const ceilingMult =
    ctx.ceilingHeight === "high"   ? 1.50 :
    ctx.ceilingHeight === "medium" ? 1.25 :
    1.0;

  const hasExpert =
    ctx.sspComplexity === "addressable" ||
    ctx.roomManagement === true ||
    ctx.paSystem === true ||
    ctx.accessControl === true;
  const expertMult = hasExpert ? 1.35 : 1.0;

  const breakdown: string[] = [];
  if (ctx.ceilingHeight === "high") {
    breakdown.push("Wysokość >6m: ×1.50 (KNR praca na wysokości II st.)");
  } else if (ctx.ceilingHeight === "medium") {
    breakdown.push("Wysokość 3–6m: ×1.25 (KNR praca na wysokości I st.)");
  }
  if (hasExpert) {
    const tags: string[] = [];
    if (ctx.sspComplexity === "addressable") tags.push("SSP adresowalny");
    if (ctx.roomManagement) tags.push("KNX/RCU");
    if (ctx.paSystem) tags.push("PA / nagłośnienie");
    if (ctx.accessControl) tags.push("Kontrola dostępu (RACS)");
    breakdown.push(`Systemy specjalistyczne: ×1.35 (${tags.join(", ")})`);
  }

  return {
    factor: Math.round(ceilingMult * expertMult * 1000) / 1000,
    ceilingMult,
    expertMult,
    breakdown,
  };
}
