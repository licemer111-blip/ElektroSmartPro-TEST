/**
 * global-benchmarks.ts
 *
 * Single Source of Truth for globally-configurable benchmarks.
 * Reads from admin_settings (Supabase) and caches in-process for 10s.
 * Server-side only — do NOT import in client components.
 *
 * KNR 2026 MULTIPLIER:
 *   - Default: 1.5 (50% increase to outdated KNR norms — matches LIVE admin_settings value)
 *   - Stored in admin_settings.value.knr_2026_multiplier
 *   - Applied at DISPLAY-TIME only (see pricing-calculations.ts)
 *   - Client-side: useKnrMultiplier() hook fetches via /api/admin/knr-multiplier
 *
 * Usage:
 *   const knrMult = await getKnrMultiplier();
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getRegionByName } from "@/lib/config/regions";

// ─── In-process cache (Node.js module scope, TTL 60s) ─────────────────────────

interface BenchmarkCache {
  knr_2026_multiplier: number;
  fetchedAt: number;
}

let _cache: BenchmarkCache | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

async function fetchBenchmarks(): Promise<BenchmarkCache> {
  const now = Date.now();
  if (_cache && now - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache;
  }

  try {
    const { data } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "global_benchmarks")
      .single();

    const val = data?.value as { knr_2026_multiplier?: number } | null;
    _cache = {
      knr_2026_multiplier: val?.knr_2026_multiplier ?? 1.5,
      fetchedAt: now,
    };
  } catch {
    // Fallback to defaults — never throw, always return usable values
    _cache = {
      knr_2026_multiplier: 1.5,
      fetchedAt: now,
    };
  }

  return _cache;
}

/** Invalidate cache — call after updateGlobalBenchmarks() to reflect immediately */
export function invalidateBenchmarkCache(): void {
  _cache = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** KNR 2026 labor norm multiplier from admin_settings. Default: 1.5 */
export async function getKnrMultiplier(): Promise<number> {
  return (await fetchBenchmarks()).knr_2026_multiplier;
}

/**
 * getEffectiveRate — THE canonical calculation formula for ES-Engine 3.0 (One Rate).
 *
 * Single source of truth: project.default_hourly_rate (labor_rate).
 * No mode switching, no profile fallback — one rate per project.
 *
 * IRON RULE: If laborRate == 0 → usedDefaultRate=true → BLOCK all labor calculations.
 *
 * @param voivodeship            - optional region name, defaults to national average (×1.0)
 * @param laborRate              - project.default_hourly_rate (PLN/rbh), set per-project
 * @param userMaterialMultiplier - from profiles.material_multiplier (project-specific)
 */
export async function getEffectiveRate(
  voivodeship?: string | null,
  laborRate?: number | null,
  userMaterialMultiplier?: number | null,
): Promise<{
  laborRate: number;        // PLN/rbh after region modifier (final value for calculations)
  matMultiplier: number;    // material inflation multiplier (project-specific)
  baseRbhRate: number;      // hardcoded base rate for reference (75 PLN/rbh)
  regionModifier: number;   // voivodeship coefficient
  source: "project_rate" | "default_rate";
  usedDefaultRate: boolean; // true when project.default_hourly_rate == 0
}> {
  const regionModifier = voivodeship ? (getRegionByName(voivodeship)?.multiplier ?? 1.0) : 1.0;

  const baseForCalc = (laborRate != null && laborRate > 0) ? laborRate : 0;
  const laborRateResult = Math.round(baseForCalc * regionModifier);
  const usedDefaultRate = baseForCalc <= 0;

  // Material multiplier is project-specific (from profiles), with fallback to 1.05
  const matMultiplier = (userMaterialMultiplier != null && userMaterialMultiplier > 0)
    ? userMaterialMultiplier
    : 1.05;

  return {
    laborRate: laborRateResult,
    matMultiplier,
    baseRbhRate: 75, // hardcoded base rate for reference
    regionModifier,
    source: usedDefaultRate ? "default_rate" : "project_rate",
    usedDefaultRate,
  };
}

/**
 * Build dynamic IRON_RULE_REGION text with live rates.
 * Replaces the hardcoded string in ai-master-brain.ts at prompt build time.
 */
export async function buildDynamicRegionRule(): Promise<string> {
  return `<iron_rule_3_region>
ŻELAZNA ZASADA — WOJEWÓDZTWO:
- Nie mnoż stawki przez województwo. Program dolicza współczynnik raz, na ekranie kosztorysu.
- Nie podstawiaj własnej stawki. Stawka należy do elektryka.
- W odpowiedzi zostaw labor_price = 0. Jak znasz godzinę normy ES, podaj samą godzinę.
</iron_rule_3_region>`;
}
