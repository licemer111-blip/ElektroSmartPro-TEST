// ═══════════════════════════════════════════════════════════════════
// lib/services/pricing-config.ts — Centralized Pricing Configuration
// Sprint v1.2+: single source of truth for all KNR multipliers.
//
// Architecture:
//   Global defaults  → profiles.coeff_height / coeff_difficulty / coeff_surface
//   Project overrides→ projects.pricing_overrides (JSONB, nullable)
//   Merge rule       → project override wins; null/undefined falls back to global
// ═══════════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────────────────

/** Project-level KNR multiplier overrides stored as JSONB in projects.pricing_overrides */
export interface PricingOverrides {
  coeff_height?:     boolean | null;
  coeff_difficulty?: boolean | null;
  coeff_surface?:    boolean | null;
}

/** Profile shape consumed by buildPricingConfig (subset of profiles table) */
export interface GlobalPricingProfile {
  coeff_height?:     boolean | null;
  coeff_difficulty?: boolean | null;
  coeff_surface?:    boolean | null;
}

/**
 * Effective pricing configuration — result of merging global profile + project overrides.
 * All downstream pricing logic consumes this type instead of reading from DB directly.
 */
export interface PricingConfig {
  // ── Boolean flags (effective values after merge) ──────────────
  coeff_height:     boolean; // Praca na wysokości >3m → ×1.25 robocizna
  coeff_difficulty: boolean; // Utrudnienia / zamieszkały lokal → ×1.22 robocizna
  coeff_surface:    boolean; // Trudne podłoże → +15% surface modifier

  // ── Computed composite multipliers (read-only) ────────────────
  /** (height?1.25:1) × (difficulty?1.22:1) — applied to ALL labor (L0 / L2 / L3) */
  globalLaborMod:  number;
  /** surface ? 1.15 : 1.0 — multiplied into getSurfaceModifier() result */
  surfaceExtraMod: number;

  // ── Provenance tracking ───────────────────────────────────────
  /** Tracks which values came from project override vs global profile */
  source: {
    height:     "global" | "project";
    difficulty: "global" | "project";
    surface:    "global" | "project";
  };
}

// ─── Core function ───────────────────────────────────────────────────────────

/**
 * Merges global profile defaults with project-level overrides.
 * Project overrides (non-null) take precedence over global profile settings.
 *
 * @param globalProfile    — User profile record (or null for anonymous/fallback)
 * @param projectOverrides — projects.pricing_overrides JSONB (null = use global)
 *
 * @example
 *   // Global: height=true, difficulty=false, surface=false
 *   // Project override: { coeff_height: false }
 *   // Result: height=false (project), difficulty=false (global), surface=false (global)
 */
export function buildPricingConfig(
  globalProfile:    GlobalPricingProfile | null | undefined,
  projectOverrides: PricingOverrides     | null | undefined,
): PricingConfig {
  const ov = projectOverrides ?? {};
  const gp = globalProfile    ?? {};

  // Project override wins when explicitly set (non-null/undefined).
  const coeff_height     = ov.coeff_height     ?? gp.coeff_height     ?? false;
  const coeff_difficulty = ov.coeff_difficulty  ?? gp.coeff_difficulty  ?? false;
  const coeff_surface    = ov.coeff_surface     ?? gp.coeff_surface     ?? false;

  return {
    coeff_height:     !!coeff_height,
    coeff_difficulty: !!coeff_difficulty,
    coeff_surface:    !!coeff_surface,

    globalLaborMod:  (coeff_height ? 1.25 : 1.0) * (coeff_difficulty ? 1.22 : 1.0),
    surfaceExtraMod: coeff_surface ? 1.15 : 1.0,

    source: {
      height:     ov.coeff_height     != null ? "project" : "global",
      difficulty: ov.coeff_difficulty  != null ? "project" : "global",
      surface:    ov.coeff_surface     != null ? "project" : "global",
    },
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
