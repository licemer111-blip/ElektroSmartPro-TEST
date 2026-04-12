-- Add KNR 2026 labor norm multiplier to global_benchmarks in admin_settings
-- This multiplier adjusts KNR labor norms to 2026 market reality (default: 1.4)

-- Update existing row to add knr_2026_multiplier if missing
UPDATE admin_settings
SET value = jsonb_set(
  value,
  '{knr_2026_multiplier}',
  '1.4'::jsonb,
  true
)
WHERE key = 'global_benchmarks'
AND value->'knr_2026_multiplier' IS NULL;

-- If the row doesn't exist, insert with default values
-- Note: market_rbh_rate and material_inflation_multiplier use seed values from 20260224_admin_settings.sql
INSERT INTO admin_settings (key, value, updated_at)
VALUES (
  'global_benchmarks',
  jsonb_build_object(
    'market_rbh_rate', 75,
    'material_inflation_multiplier', 1.05,
    'knr_2026_multiplier', 1.4
  ),
  now()
)
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN admin_settings.value IS 'JSONB payload: global_benchmarks (market_rbh_rate, material_inflation_multiplier, knr_2026_multiplier) | expert_directives';
