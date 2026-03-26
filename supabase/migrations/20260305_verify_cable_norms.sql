-- Verification: cable norms distribution after fix
SELECT
  CASE
    WHEN labor_norm_rbh = 0.020 THEN '0.020 slabopradowe/UTP'
    WHEN labor_norm_rbh = 0.030 THEN '0.030 swiatl/grzejny'
    WHEN labor_norm_rbh = 0.040 THEN '0.040 1.5-2.5mm2'
    WHEN labor_norm_rbh = 0.050 THEN '0.050 4-6mm2'
    WHEN labor_norm_rbh = 0.060 THEN '0.060 10-16mm2'
    WHEN labor_norm_rbh = 0.080 THEN '0.080 25-35mm2'
    WHEN labor_norm_rbh = 0.100 THEN '0.100 50-70mm2'
    WHEN labor_norm_rbh = 0.120 THEN '0.120 95-120mm2'
    WHEN labor_norm_rbh = 0.150 THEN '0.150 150mm2+'
    ELSE CAST(ROUND(labor_norm_rbh::numeric, 3) AS text)
  END AS norm_group,
  COUNT(*) AS cnt
FROM catalog_items
WHERE unit IN ('mb', 'm')
  AND labor_norm_rbh IS NOT NULL
  AND labor_norm_rbh > 0
  AND (
    LOWER(name) LIKE '%kabel%' OR LOWER(name) LIKE '%przewod%'
    OR LOWER(name) LIKE '%ydy%' OR LOWER(name) LIKE '%utp%'
    OR LOWER(name) LIKE '%hdgs%' OR LOWER(name) LIKE '%nyx%'
  )
GROUP BY norm_group
ORDER BY norm_group;
