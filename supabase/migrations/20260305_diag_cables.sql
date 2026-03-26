SELECT name, unit, labor_norm_rbh
FROM catalog_items
WHERE unit IN ('mb', 'm')
  AND (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
ORDER BY name
LIMIT 40;
