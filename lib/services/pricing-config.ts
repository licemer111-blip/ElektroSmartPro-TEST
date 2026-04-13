// ═══════════════════════════════════════════════════════════════════
// lib/services/pricing-config.ts
// KNR multiplier coefficients (coeff_height, coeff_difficulty, coeff_surface)
// have been removed. buildPricingConfig is kept as a no-op stub so that
// existing callers compile without changes while they are cleaned up.
// ═══════════════════════════════════════════════════════════════════

/** @deprecated — coeff_height/difficulty/surface removed. Use stub only. */
export interface PricingOverrides { [key: string]: unknown }

/** @deprecated */
export interface GlobalPricingProfile { [key: string]: unknown }

/** @deprecated — all fields are always 1.0 / false now */
export interface PricingConfig {
  coeff_height:     false;
  coeff_difficulty: false;
  coeff_surface:    false;
  globalLaborMod:   1;
  surfaceExtraMod:  1;
  source: { height: "global"; difficulty: "global"; surface: "global" };
}

/** @deprecated — returns identity config (all multipliers = 1.0) */
export function buildPricingConfig(
  _globalProfile:    GlobalPricingProfile | null | undefined,
  _projectOverrides: PricingOverrides     | null | undefined,
): PricingConfig {
  return {
    coeff_height: false, coeff_difficulty: false, coeff_surface: false,
    globalLaborMod: 1, surfaceExtraMod: 1,
    source: { height: "global", difficulty: "global", surface: "global" },
  };
}

// ─── KNR code normalization ──────────────────────────────────────────────────

/**
 * Normalizes a KNR code string:
 *  1. Trims leading/trailing whitespace
 *  2. Replaces all "/" with "-"  (e.g. "5-08 0401/03" → "5-08 0401-03")
 *
 * Applied at ALL KNR entry points: pricing.ts L0, searchKnrNorm, clean-przedmiar, AI import.
 *
 * @example
 *   normalizeKnrCode("5-08 0401/03")    → "5-08 0401-03"
 *   normalizeKnrCode(" KNR 4-01/0101 ") → "KNR 4-01-0101"
 */
export function normalizeKnrCode(code: string): string {
  return code.trim().replace(/\//g, "-");
}

/**
 * Returns true when the string looks like a bare KNR code pattern
 * (contains digits + "-" or "/" separators typical of KNR references).
 * Used to decide whether to normalize a search query before DB lookup.
 */
export function looksLikeKnrCode(query: string): boolean {
  return /\d[\d-/\s]+\d{4}/.test(query.trim());
}
