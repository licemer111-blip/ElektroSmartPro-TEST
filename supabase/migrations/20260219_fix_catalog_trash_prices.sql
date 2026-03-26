-- Fix floating-point garbage prices in global catalog (user_id IS NULL)
-- Values like 0.01, 0.02, 0.009000000000000001 are clearly erroneous — set to 0.00
-- Also round ALL prices to 2 decimal places to prevent future FP drift

UPDATE catalog_items
SET
  base_material_price = CASE
    WHEN base_material_price < 0.05 THEN 0
    ELSE ROUND(base_material_price::numeric, 2)
  END,
  base_labor_price = CASE
    WHEN base_labor_price < 0.05 THEN 0
    ELSE ROUND(base_labor_price::numeric, 2)
  END
WHERE user_id IS NULL
  AND (
    (base_material_price > 0 AND base_material_price < 0.05)
    OR (base_labor_price > 0 AND base_labor_price < 0.05)
    OR base_material_price != ROUND(base_material_price::numeric, 2)
    OR base_labor_price != ROUND(base_labor_price::numeric, 2)
  );
