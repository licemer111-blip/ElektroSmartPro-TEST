-- Fix: units '10mb' and '100mb' in uziemienie_odgromowa → 'mb', labor_norm_rbh recalculated
-- 10mb: divide labor_norm by 10 | 100mb: divide labor_norm by 100

UPDATE es_dictionary
SET unit = 'mb',
    labor_norm_rbh = ROUND(labor_norm_rbh / 10, 4)
WHERE category = 'uziemienie_odgromowa'
  AND unit = '10mb'
  AND user_id IS NULL;

UPDATE es_dictionary
SET unit = 'mb',
    labor_norm_rbh = ROUND(labor_norm_rbh / 100, 4)
WHERE category = 'uziemienie_odgromowa'
  AND unit = '100mb'
  AND user_id IS NULL;
