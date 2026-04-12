-- Add KNR 2026 labor norm multiplier to global_benchmarks in admin_settings
-- This multiplier adjusts KNR labor norms to 2026 market reality (default: 1.4)

-- Remove redundant fields from existing global_benchmarks (market_rbh_rate, material_inflation_multiplier are project-specific)
UPDATE admin_settings
SET value = jsonb_build_object(
  'knr_2026_multiplier',
  COALESCE(value->>'knr_2026_multiplier', '1.4')::numeric
)
WHERE key = 'global_benchmarks';

-- If the row doesn't exist, insert with only knr_2026_multiplier
INSERT INTO admin_settings (key, value, updated_at)
VALUES (
  'global_benchmarks',
  jsonb_build_object(
    'knr_2026_multiplier', 1.4
  ),
  now()
)
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN admin_settings.value IS 'JSONB payload: global_benchmarks (knr_2026_multiplier) | expert_directives';
