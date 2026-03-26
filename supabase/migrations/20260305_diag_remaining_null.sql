-- What really has null labor_norm_rbh in catalog_items?
SELECT
  CASE
    WHEN LOWER(name) LIKE '%bruzd%' THEN 'bruzda/bruzdowanie'
    WHEN LOWER(name) LIKE '%bednarka%' THEN 'bednarka'
    WHEN LOWER(name) LIKE '%drabinka%' THEN 'drabinka kablowa'
    WHEN LOWER(name) LIKE '%korytko%' OR LOWER(name) LIKE '%koryt%' THEN 'korytko kablowe'
    WHEN LOWER(name) LIKE '%demontaz%' THEN 'demontaz'
    WHEN LOWER(name) LIKE '%rura%' OR LOWER(name) LIKE '%rurka%' THEN 'rura/rurka'
    WHEN LOWER(name) LIKE '%drut%' THEN 'drut odgromowy'
    WHEN LOWER(name) LIKE '%kanal%' OR LOWER(name) LIKE '%kanał%' THEN 'kanal/taśma'
    WHEN LOWER(name) LIKE '%tasma%' OR LOWER(name) LIKE '%taśma%' THEN 'tasma LED'
    WHEN unit IN ('mb','m') THEN 'inne (mb/m)'
    ELSE 'inne'
  END AS item_type,
  COUNT(*) AS n
FROM catalog_items
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
GROUP BY 1
ORDER BY n DESC
LIMIT 30;
