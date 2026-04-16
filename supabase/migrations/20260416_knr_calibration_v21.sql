-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 20260416_knr_calibration_v21.sql
-- Purpose:   v2.1 KNR norm calibration — align labor norms with 2026 Polish
--            market reality and clean up data bugs that accumulated in the
--            global catalog over multiple seeding passes.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Applied to TEST (upwctgdpuckreoquofiu) on 2026-04-16.
-- LIVE replay: run this entire file as a single transaction via psql or the
-- Supabase SQL editor. Idempotent — re-runs produce zero additional updates.
--
-- 3 things happen in this migration:
--
--   1. admin_settings.global_benchmarks.knr_2026_multiplier: 1.4 → 1.5
--      Rationale: DB baseline rate = 65 PLN/h × 1.5 = 97.5 PLN/h.
--      With regions.price_modifier (0.88 Lubelskie … 1.12 Mazowieckie) this
--      yields 86–109 PLN/h — the actual 2026 electrician market band.
--      Previous 1.4 value produced 91 PLN/h which was at the low end.
--
--   2. Backfill NULL labor_norm_rbh for global catalog items.
--      Before: 543 items had base_labor_price > 0 but labor_norm_rbh = NULL,
--      causing empty "Roboczogodziny" columns in PDF exports.
--      After:  labor_norm_rbh = ROUND(base_labor_price / 65, 3) so implied
--              rate stays at exactly 65 PLN/h (the design constant).
--
--   3. Fix broken high-ratio norms (implied PLN/h > 200).
--      Before: 167 items (cables YDYp/YKY/UTP, bednarki, przewody odgromowe,
--              rury gofr, etc.) had labor_norm_rbh set to 0.02-0.05 with
--              base_labor_price = 25 PLN/m → implied 500-1300 PLN/h which
--              obviously under-counts time (a cable "laid" in 2.4 min/m).
--      After:  Re-derived norm from base_labor_price / 65 so rates normalize.
--
-- Post-migration stats (verified on TEST):
--   still_null_norms       = 0
--   still_broken (>200/h)  = 0
--   median implied rate    = 65.00 PLN/h  ✓
--   p95 implied rate       = 66.18 PLN/h
--   max implied rate       = 200.00 PLN/h (boundary — kept)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Bump KNR multiplier 1.4 → 1.5 ───────────────────────────────────────
-- Only updates when current value is exactly 1.4 (idempotent — skip if already 1.5+).
UPDATE public.admin_settings
SET value = jsonb_set(value, '{knr_2026_multiplier}', '1.5'::jsonb),
    updated_at = now()
WHERE key = 'global_benchmarks'
  AND (value->>'knr_2026_multiplier')::numeric = 1.4;

-- ─── 2. Backfill NULL labor_norm_rbh ────────────────────────────────────────
-- Global catalog only (user_id IS NULL). Active items with positive labor price.
-- Rate constant: 65 PLN/h is the Hager/Eaton/MCB/RCD baseline baked into seed data.
UPDATE public.catalog_items
SET labor_norm_rbh = ROUND((base_labor_price / 65.0)::numeric, 3),
    updated_at = now()
WHERE user_id IS NULL
  AND is_active = true
  AND labor_norm_rbh IS NULL
  AND base_labor_price > 0;

-- ─── 3. Fix broken high-ratio norms ─────────────────────────────────────────
-- Anything whose implied PLN/h exceeds 200 has an undercounted norm.
-- Derive new norm from base_labor_price / 65 to bring it back to baseline.
-- Scope: global catalog, active items, norm > 0 (don't re-touch backfilled rows
-- which are already at 65 PLN/h by construction).
UPDATE public.catalog_items
SET labor_norm_rbh = ROUND((base_labor_price / 65.0)::numeric, 3),
    updated_at = now()
WHERE user_id IS NULL
  AND is_active = true
  AND labor_norm_rbh > 0
  AND base_labor_price > 0
  AND (base_labor_price / labor_norm_rbh) > 200;

COMMIT;

-- ─── Verification queries (run manually after COMMIT) ───────────────────────
-- SELECT value FROM admin_settings WHERE key='global_benchmarks';
--   Expected: {"knr_2026_multiplier": 1.5}
--
-- SELECT COUNT(*) FROM catalog_items
--  WHERE user_id IS NULL AND is_active = true AND labor_norm_rbh IS NULL AND base_labor_price > 0;
--   Expected: 0
--
-- SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_labor_price/labor_norm_rbh)::numeric, 2)
--   FROM catalog_items WHERE user_id IS NULL AND is_active=true AND labor_norm_rbh > 0 AND base_labor_price > 0;
--   Expected: 65.00
