-- ============================================================
-- Migration: Fix duplicate categories in es_dictionary
-- 1. demontaz (40) → demontaze
-- 2. uziemienie_odgromowa (14) + uziem_odgrom (7) → uziemienie
-- 3. fotowoltaika (21) → pv_ev (204 — canonical)
-- ============================================================

-- 1. Merge demontaz → demontaze
UPDATE es_dictionary
SET category = 'demontaze'
WHERE category = 'demontaz'
  AND user_id IS NULL;

-- 2a. Merge uziemienie_odgromowa → uziemienie
UPDATE es_dictionary
SET category = 'uziemienie'
WHERE category = 'uziemienie_odgromowa'
  AND user_id IS NULL;

-- 2b. Merge uziem_odgrom → uziemienie
UPDATE es_dictionary
SET category = 'uziemienie'
WHERE category = 'uziem_odgrom'
  AND user_id IS NULL;

-- 3. Merge fotowoltaika → pv_ev (pv_ev is canonical with 204 entries)
UPDATE es_dictionary
SET category = 'pv_ev'
WHERE category = 'fotowoltaika'
  AND user_id IS NULL;

-- Verify results
SELECT category, COUNT(*) AS n
FROM es_dictionary
WHERE user_id IS NULL
  AND category IN ('demontaz', 'demontaze', 'uziemienie', 'uziemienie_odgromowa',
                   'uziem_odgrom', 'fotowoltaika', 'pv_ev')
GROUP BY category
ORDER BY category;
