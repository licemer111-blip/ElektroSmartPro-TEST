-- Add KNR 2026 labor norm multiplier to global_benchmarks in admin_settings
-- This multiplier adjusts KNR labor norms to 2026 market reality (default: 1.4)

UPDATE admin_settings
SET value = jsonb_set(
  value,
  '{knr_2026_multiplier}',
  '1.4'::jsonb,
  true
)
WHERE key = 'global_benchmarks';

-- If the row doesn't exist or value is null, insert with default
INSERT INTO admin_settings (key, value, updated_at)
VALUES (
  'global_benchmarks',
  jsonb_build_object(
    'market_rbh_rate', 85,
    'material_inflation_multiplier', 1.08,
    'knr_2026_multiplier', 1.4
  ),
  now()
)
ON CONFLICT (key) DO UPDATE SET
  value = CASE
    WHEN admin_settings.value->'knr_2026_multiplier' IS NULL THEN
      jsonb_set(admin_settings.value, '{knr_2026_multiplier}', '1.4'::jsonb, true)
    ELSE
      admin_settings.value
  END,
  updated_at = now();

COMMENT ON COLUMN admin_settings.value IS 'JSONB payload: global_benchmarks (market_rbh_rate, material_inflation_multiplier, knr_2026_multiplier) | expert_directives';
