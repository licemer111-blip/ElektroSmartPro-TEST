/**
 * ES-Engine — Hybrid KNR Lookup + Labor Rate Resolution
 *
 * Implements the canonical 3-level priority cascade:
 *
 * KNR Lookup:
 *   L1 (User KNR):   User's private KNR table (user_knr_norms)
 *   L2 (System KNR): Global ES-Engine system KNR base (via getKnrMetadata)
 *   L3 (AI Est.):    AI estimation fallback (isEstimate=true)
 *
 * Labor Rate (One Rate v3.0):
 *   project.default_hourly_rate is the single source of truth per project.
 *   Set from profiles.hourly_rate at project creation, editable per-project.
 *   No rate set (= 0): laborRate = 0 — caller must prompt user to set rate in Settings
 *
 * Iron Rules enforced:
 *   ✓ Robocizna and Materiał NEVER merged prematurely
 *   ✓ VAT Guard applied externally (8% residential / 23% commercial)
 *   ✓ Region modifier always applied to labor only
 */

import { getKnrMetadata, type KnrMetadata } from "@/lib/ai-master-brain";
import { getEffectiveRate, getKnrMultiplier } from "@/lib/global-benchmarks";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserKnrNorm {
  knr_code: string;
  description: string;
  labor_norm_rbh: number; // hours per unit
  unit: string;
}

export interface KnrLookupResult {
  knrCode: string;
  laborNorm: number;        // r-g per unit (from KNR norm)
  description: string;
  unit: string;
  source: "user_knr" | "system_knr" | "ai_estimation";
  isEstimate: boolean;
}

export interface LaborRateResult {
  laborRate: number;        // PLN/rbh (final, after region modifier)
  baseRbhRate: number;      // raw admin base rate
  regionModifier: number;
  source: "project_rate" | "default_rate";
  usedDefaultRate: boolean;
}

export interface EsEngineCalcResult {
  laborNorm: number;        // r-g per unit
  laborPrice: number;       // PLN per unit = laborNorm × laborRate
  laborHoursTotal: number;  // laborNorm × quantity
  laborTotal: number;       // laborPrice × quantity
  knrCode: string;
  knrSource: KnrLookupResult["source"];
  rateSource: LaborRateResult["source"];
  isEstimate: boolean;
}

// ─── KNR Hybrid Lookup ─────────────────────────────────────────────────────────

/**
 * 3-level KNR lookup:
 *   L1 → User's private KNR norms (ONLY when useExpertMode=true)
 *   L2 → System ES-Engine KNR base (getKnrMetadata)
 *   L3 → AI estimation fallback (generic rate 0.20 r-g, isEstimate=true)
 *
 * Iron Rule — "Tryb Ekspercki" is the master switch:
 *   useExpertMode=false → L1 is SKIPPED entirely, system goes straight to L2.
 *   This mirrors the toggle in Settings → Baza Kalkulacji.
 *
 * @param knrCodeOrName  KNR code string OR item name for fuzzy matching
 * @param category       Optional category for L2 system lookup
 * @param userNorms      User's private KNR table (from DB, can be empty)
 * @param moduleName     Optional module display name for keyword scoring
 * @param modules        Optional pole count for pole-count fallback
 * @param useExpertMode  Master switch: false = skip L1 entirely (default: true if userNorms provided)
 */
export function lookupKnr(
  knrCodeOrName: string,
  category?: string,
  userNorms: UserKnrNorm[] = [],
  moduleName?: string,
  modules?: number,
  useExpertMode: boolean = true,
): KnrLookupResult {
  const needle = knrCodeOrName.toLowerCase().trim();

  // ── L1: User's private KNR table (Tryb Ekspercki — master switch) ────────
  // If useExpertMode=false, skip L1 entirely → go straight to L2 (System KNR)
  if (useExpertMode && userNorms.length > 0) {
    // Exact KNR code match first
    const exactMatch = userNorms.find(
      (n) => n.knr_code.toLowerCase() === needle,
    );
    if (exactMatch) {
      return {
        knrCode: exactMatch.knr_code,
        laborNorm: exactMatch.labor_norm_rbh,
        description: exactMatch.description,
        unit: exactMatch.unit,
        source: "user_knr",
        isEstimate: false,
      };
    }

    // Partial KNR code match (e.g. "KNR 5-08 0401" matches "KNR 5-08 0401-03")
    const partialMatch = userNorms.find(
      (n) =>
        n.knr_code.toLowerCase().startsWith(needle) ||
        needle.startsWith(n.knr_code.toLowerCase()),
    );
    if (partialMatch) {
      return {
        knrCode: partialMatch.knr_code,
        laborNorm: partialMatch.labor_norm_rbh,
        description: partialMatch.description,
        unit: partialMatch.unit,
        source: "user_knr",
        isEstimate: false,
      };
    }

    // Description keyword match
    const descMatch = userNorms.find((n) =>
      n.description.toLowerCase().includes(needle) ||
      needle.includes(n.description.toLowerCase().substring(0, 15)),
    );
    if (descMatch) {
      return {
        knrCode: descMatch.knr_code,
        laborNorm: descMatch.labor_norm_rbh,
        description: descMatch.description,
        unit: descMatch.unit,
        source: "user_knr",
        isEstimate: false,
      };
    }
  }

  // ── L2: System ES-Engine KNR base ────────────────────────────────────────
  const systemMeta: KnrMetadata = getKnrMetadata(
    knrCodeOrName,
    category,
    moduleName,
    modules,
  );

  // If system lookup returned a non-generic result → use it
  if (systemMeta.source !== "generic") {
    return {
      knrCode: systemMeta.knrCode,
      laborNorm: systemMeta.laborRate,
      description: systemMeta.description,
      unit: systemMeta.unit,
      source: "system_knr",
      isEstimate: false,
    };
  }

  // ── L3: AI Estimation fallback ────────────────────────────────────────────
  // Generic KNR 5-08 with default 0.20 r-g — mark as estimate
  return {
    knrCode: systemMeta.knrCode,
    laborNorm: systemMeta.laborRate,
    description: systemMeta.description,
    unit: systemMeta.unit,
    source: "ai_estimation",
    isEstimate: true,
  };
}

// ─── Labor Rate Resolution ─────────────────────────────────────────────────────

/**
 * Resolve effective labor rate using One Rate v3.0.
 * Server-side only (async — reads admin_settings from Supabase).
 *
 * Formula: FinalRate = laborRate × regionModifier (project.default_hourly_rate is the single source)
 *
 * @param voivodeship  Region name (e.g. "Mazowieckie")
 * @param laborRate    project.default_hourly_rate (PLN/rbh)
 */
export async function resolveEffectiveLaborRate(
  voivodeship?: string | null,
  laborRate?: number | null,
): Promise<LaborRateResult> {
  const rate = await getEffectiveRate(voivodeship, laborRate);
  return {
    laborRate: rate.laborRate,
    baseRbhRate: rate.baseRbhRate,
    regionModifier: rate.regionModifier,
    source: rate.source,
    usedDefaultRate: rate.usedDefaultRate,
  };
}

// ─── Full ES-Engine Calculation ────────────────────────────────────────────────

/**
 * Calculate labor cost for a single item using ES-Engine.
 *
 * Combines KNR hybrid lookup + labor rate resolution into a single result.
 * Iron Rules guaranteed:
 *   - Robocizna and Materiał kept separate (returns laborTotal only)
 *   - VAT applied EXTERNALLY by the caller
 *   - Region modifier always applied to labor
 *
 * @param params.quantity        Number of units
 * @param params.knrCodeOrName   KNR code or item name for lookup
 * @param params.category        Optional category
 * @param params.voivodeship   Region for rate modifier
 * @param params.laborRate     project.default_hourly_rate (PLN/rbh)
 * @param params.userNorms     User's private KNR table
 * @param params.moduleName      Optional display name for better keyword match
 * @param params.modules         Optional pole count
 * @param params.useExpertMode   Master switch for L1 KNR lookup (Tryb Ekspercki)
 */
export async function calcLaborWithHybridKnr(params: {
  quantity: number;
  knrCodeOrName: string;
  category?: string;
  voivodeship?: string | null;
  laborRate?: number | null;
  userNorms?: UserKnrNorm[];
  moduleName?: string;
  modules?: number;
  useExpertMode?: boolean;
}): Promise<EsEngineCalcResult> {
  const {
    quantity,
    knrCodeOrName,
    category,
    voivodeship,
    laborRate,
    userNorms = [],
    moduleName,
    modules,
    useExpertMode = true,
  } = params;

  const knr = lookupKnr(knrCodeOrName, category, userNorms, moduleName, modules, useExpertMode);
  const rateResult = await resolveEffectiveLaborRate(voivodeship, laborRate);
  const knrMultiplier = await getKnrMultiplier();

  // Apply KNR 2026 multiplier to adjust labor norms to market reality
  const adjustedLaborNorm = Math.round(knr.laborNorm * knrMultiplier * 1000) / 1000;

  const laborHoursTotal = Math.round(quantity * adjustedLaborNorm * 100) / 100;
  const laborPrice = Math.round(adjustedLaborNorm * rateResult.laborRate * 100) / 100;
  const laborTotal = Math.round(laborHoursTotal * rateResult.laborRate * 100) / 100;

  return {
    laborNorm: adjustedLaborNorm,
    laborPrice,
    laborHoursTotal,
    laborTotal,
    knrCode: knr.knrCode,
    knrSource: knr.source,
    rateSource: rateResult.source,
    isEstimate: knr.isEstimate,
  };
}

// ─── Batch resolution (for project items) ─────────────────────────────────────

/**
 * Resolve labor rate once for a project, then apply to all items synchronously.
 * Use this for batch operations (e.g. PDF generation, project totals) to avoid
 * N async calls to Supabase.
 *
 * @param voivodeship  Region name
 * @param laborRate    project.default_hourly_rate (PLN/rbh)
 * @returns Pre-resolved rate object + a sync `calcItem` helper
 */
export async function createBatchCalculator(
  voivodeship?: string | null,
  laborRate?: number | null,
  userNorms: UserKnrNorm[] = [],
  useExpertMode: boolean = true,
) {
  const rateResult = await resolveEffectiveLaborRate(voivodeship, laborRate);
  const knrMultiplier = await getKnrMultiplier();

  return {
    laborRate: rateResult.laborRate,
    source: rateResult.source,
    regionModifier: rateResult.regionModifier,
    knrMultiplier,

    /** Synchronous labor calculation for a single item — no async needed */
    calcItem(params: {
      quantity: number;
      knrCodeOrName: string;
      category?: string;
      moduleName?: string;
      modules?: number;
    }): EsEngineCalcResult {
      const knr = lookupKnr(
        params.knrCodeOrName,
        params.category,
        userNorms,
        params.moduleName,
        params.modules,
        useExpertMode,
      );
      // Apply KNR 2026 multiplier to adjust labor norms to market reality
      const adjustedLaborNorm = Math.round(knr.laborNorm * knrMultiplier * 1000) / 1000;

      const laborHoursTotal = Math.round(params.quantity * adjustedLaborNorm * 100) / 100;
      const laborPrice = Math.round(adjustedLaborNorm * rateResult.laborRate * 100) / 100;
      const laborTotal = Math.round(laborHoursTotal * rateResult.laborRate * 100) / 100;
      return {
        laborNorm: adjustedLaborNorm,
        laborPrice,
        laborHoursTotal,
        laborTotal,
        knrCode: knr.knrCode,
        knrSource: knr.source,
        rateSource: rateResult.source,
        isEstimate: knr.isEstimate,
      };
    },
  };
}
