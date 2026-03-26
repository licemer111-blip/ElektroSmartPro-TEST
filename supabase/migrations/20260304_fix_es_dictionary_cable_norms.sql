-- ═══════════════════════════════════════════════════════════════════
-- 20260304_fix_es_dictionary_cable_norms.sql
-- Fix: cable labor_norm_rbh stored as rbh/100mb → convert to rbh/mb (÷100)
-- Also fix: composite_refs JSON inside zestawy entries
-- ═══════════════════════════════════════════════════════════════════

-- 1. Fix all cable entries where unit = '100mb' → divide norm by 100, set unit = 'mb'
UPDATE es_dictionary
SET
  labor_norm_rbh = labor_norm_rbh / 100.0,
  unit = 'mb'
WHERE unit = '100mb';

-- 2. Fix composite_refs JSON inside zestawy — replace "unit":"100mb" entries
--    by dividing their labor_norm_rbh by 100 and changing unit to "mb"
UPDATE es_dictionary
SET composite_refs = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'unit') = '100mb'
      THEN jsonb_set(
             jsonb_set(elem, '{unit}', '"mb"'),
             '{labor_norm_rbh}',
             to_jsonb((elem->>'labor_norm_rbh')::numeric / 100.0)
           )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(composite_refs) AS elem
)
WHERE
  is_composite = true
  AND composite_refs IS NOT NULL
  AND composite_refs::text LIKE '%100mb%';

-- Verify
DO $$
DECLARE
  cnt_100mb integer;
  cnt_composite_bad integer;
BEGIN
  SELECT COUNT(*) INTO cnt_100mb FROM es_dictionary WHERE unit = '100mb';
  SELECT COUNT(*) INTO cnt_composite_bad
    FROM es_dictionary
    WHERE is_composite = true AND composite_refs::text LIKE '%100mb%';

  RAISE NOTICE '✅ Fix complete. Remaining unit=100mb rows: % | composite_refs with 100mb: %',
    cnt_100mb, cnt_composite_bad;
END $$;
