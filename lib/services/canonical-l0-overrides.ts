/**
 * canonical-l0-overrides.ts — runtime override layer for L0 Canonical KNR
 *
 * Loads admin-edited overrides from `canonical_l0_overrides` table and merges
 * them with the hardcoded reference array in canonical-knr-l0.ts. Server-side
 * memory cache (60s TTL) prevents per-request DB hits inside the pricing hot
 * path.
 *
 * Cache invalidation: admin server actions (saveCanonicalL0Override /
 * deleteCanonicalL0Override) call invalidateOverridesCache() after writes,
 * so the UI reflects changes immediately on the admin's next request.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  CANONICAL_L0_REFERENCE,
  findCanonicalL0,
  type CanonicalL0Entry,
  type CanonicalL0Match,
} from "@/lib/services/canonical-knr-l0";

export interface CanonicalL0OverrideRow {
  id: string;
  entry_description: string;
  labor_norm_override: number | null;
  material_price_override: number | null;
  knr_code_override: string | null;
  disabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const CACHE_TTL_MS = 60_000;

interface CacheState {
  byDescription: Map<string, CanonicalL0OverrideRow>;
  loadedAt: number;
}

let cache: CacheState | null = null;

/** Force the next call to refetch from DB. Call after admin writes. */
export function invalidateOverridesCache(): void {
  cache = null;
}

/**
 * Load overrides indexed by entry_description. Returns an empty Map on DB
 * error so the caller silently falls back to hardcoded values.
 */
export async function loadCanonicalL0Overrides(): Promise<
  Map<string, CanonicalL0OverrideRow>
> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.byDescription;
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_l0_overrides")
    .select(
      "id, entry_description, labor_norm_override, material_price_override, knr_code_override, disabled, notes, created_at, updated_at",
    );

  const byDescription = new Map<string, CanonicalL0OverrideRow>();
  if (!error && Array.isArray(data)) {
    for (const row of data as CanonicalL0OverrideRow[]) {
      byDescription.set(row.entry_description, row);
    }
  }

  cache = { byDescription, loadedAt: Date.now() };
  return byDescription;
}

/**
 * Apply an override row to a base entry. Null override fields preserve the
 * hardcoded value. Returns null when the entry is disabled.
 */
export function applyOverride(
  entry: CanonicalL0Entry,
  override: CanonicalL0OverrideRow | undefined,
): CanonicalL0Entry | null {
  if (!override) return entry;
  if (override.disabled) return null;
  return {
    ...entry,
    laborNorm:
      override.labor_norm_override != null
        ? Number(override.labor_norm_override)
        : entry.laborNorm,
    materialPrice:
      override.material_price_override != null
        ? Number(override.material_price_override)
        : entry.materialPrice,
    knrCode:
      override.knr_code_override && override.knr_code_override.trim().length > 0
        ? override.knr_code_override
        : entry.knrCode,
  };
}

/**
 * Async variant of findCanonicalL0 that consults DB overrides first. Use this
 * inside server-side code paths (pricing pipeline, server actions). Falls
 * through to the hardcoded array when no override exists or the override is
 * partial.
 */
export async function findCanonicalL0WithOverrides(
  itemName: string | null | undefined,
  itemUnit: string | null | undefined,
): Promise<CanonicalL0Match | null> {
  if (!itemName || !itemUnit) return null;
  const overrides = await loadCanonicalL0Overrides();
  if (overrides.size === 0) {
    return findCanonicalL0(itemName, itemUnit);
  }

  // Walk the hardcoded reference in declaration order so precedence is
  // preserved. Apply override (or skip when disabled) before testing the
  // pattern — important because a disabled entry must not eclipse later ones.
  const name = itemName.trim();
  const unit = itemUnit.trim();
  if (name.length === 0 || unit.length === 0) return null;

  for (const baseEntry of CANONICAL_L0_REFERENCE) {
    const override = overrides.get(baseEntry.description);
    const effective = applyOverride(baseEntry, override);
    if (!effective) continue; // disabled
    if (!effective.pattern.test(name)) continue;
    const compat = unitsCompatibleLocal(effective.unit, unit);
    if (!compat) continue;
    return { ...effective, unitMatch: compat };
  }
  return null;
}

// Keep this in sync with the unit helper inside canonical-knr-l0.ts. Local
// copy avoids exporting a private symbol from the source-of-truth module.
const POINT_UNITS = new Set(["szt", "kpl", "pkt", "punkt"]);
const LINEAR_UNITS = new Set(["mb", "m", "metr"]);
const AREA_UNITS = new Set(["m2", "m²"]);
const WEIGHT_UNITS = new Set(["kg"]);

function unitsCompatibleLocal(
  canonical: string,
  item: string,
): "exact" | "compatible" | null {
  const c = canonical.toLowerCase().trim();
  const i = item.toLowerCase().trim();
  if (c === i) return "exact";
  if (POINT_UNITS.has(c) && POINT_UNITS.has(i)) return "compatible";
  if (LINEAR_UNITS.has(c) && LINEAR_UNITS.has(i)) return "compatible";
  if (AREA_UNITS.has(c) && AREA_UNITS.has(i)) return "compatible";
  if (WEIGHT_UNITS.has(c) && WEIGHT_UNITS.has(i)) return "compatible";
  return null;
}

/**
 * For the admin UI: return every hardcoded entry merged with its override
 * (if any), so the page can show effective values + flag rows as overridden.
 */
export interface AdminEntryView {
  description: string;
  knrCode: string;
  unit: CanonicalL0Entry["unit"];
  patternSource: string; // toString() of the regex
  // Hardcoded baseline
  baseLaborNorm: number;
  baseMaterialPrice: number | null;
  baseKnrCode: string;
  // Effective (after override)
  effectiveLaborNorm: number;
  effectiveMaterialPrice: number | null;
  effectiveKnrCode: string;
  // Override metadata
  overrideId: string | null;
  laborNormOverride: number | null;
  materialPriceOverride: number | null;
  knrCodeOverride: string | null;
  disabled: boolean;
  notes: string | null;
  updatedAt: string | null;
}

export async function getAdminEntryViews(): Promise<AdminEntryView[]> {
  const overrides = await loadCanonicalL0Overrides();
  return CANONICAL_L0_REFERENCE.map((entry) => {
    const override = overrides.get(entry.description);
    return {
      description: entry.description,
      knrCode: entry.knrCode,
      unit: entry.unit,
      patternSource: entry.pattern.toString(),
      baseLaborNorm: entry.laborNorm,
      baseMaterialPrice: entry.materialPrice ?? null,
      baseKnrCode: entry.knrCode,
      effectiveLaborNorm:
        override?.labor_norm_override != null
          ? Number(override.labor_norm_override)
          : entry.laborNorm,
      effectiveMaterialPrice:
        override?.material_price_override != null
          ? Number(override.material_price_override)
          : (entry.materialPrice ?? null),
      effectiveKnrCode:
        override?.knr_code_override && override.knr_code_override.trim().length > 0
          ? override.knr_code_override
          : entry.knrCode,
      overrideId: override?.id ?? null,
      laborNormOverride:
        override?.labor_norm_override != null
          ? Number(override.labor_norm_override)
          : null,
      materialPriceOverride:
        override?.material_price_override != null
          ? Number(override.material_price_override)
          : null,
      knrCodeOverride: override?.knr_code_override ?? null,
      disabled: override?.disabled ?? false,
      notes: override?.notes ?? null,
      updatedAt: override?.updated_at ?? null,
    };
  });
}
