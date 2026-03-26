-- ============================================================
-- Migration: Add labor_norm_rbh to installation work items
-- in catalog_items (KNR 5-04/5-09/5-10 norms)
-- ============================================================

-- 1. Bruzdowanie (chasing) ─────────────────────────────────
UPDATE catalog_items SET labor_norm_rbh =
  CASE
    WHEN LOWER(name) LIKE '%beton%'              THEN 0.150
    WHEN LOWER(name) LIKE '%cegla%'
      OR LOWER(name) LIKE '%cegle%'
      OR LOWER(name) LIKE '%silikat%'            THEN 0.080
    WHEN LOWER(name) LIKE '%tynk%'
      OR LOWER(name) LIKE '%g-k%'
      OR LOWER(name) LIKE '%gips%'               THEN 0.060
    ELSE 0.070
  END
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (LOWER(name) LIKE '%bruzd%')
  AND unit IN ('m', 'mb');

-- 2. Bednarka + Drut odgromowy ─────────────────────────────
UPDATE catalog_items SET labor_norm_rbh =
  CASE
    WHEN LOWER(name) LIKE '%bednarka%'           THEN 0.040
    WHEN LOWER(name) LIKE '%drut stalowy%'
      OR LOWER(name) LIKE '%drut odgrom%'
      OR LOWER(name) LIKE '%zwod%'
      OR LOWER(name) LIKE '%zwód%'               THEN 0.050
    ELSE 0.040
  END
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (
    LOWER(name) LIKE '%bednarka%'
    OR LOWER(name) LIKE '%drut stalowy%'
    OR LOWER(name) LIKE '%drut odgrom%'
    OR LOWER(name) LIKE '%zwod%'
    OR LOWER(name) LIKE '%zwód%'
  )
  AND unit IN ('m', 'mb');

-- 3. Korytko kablowe (cable tray) ─────────────────────────
UPDATE catalog_items SET labor_norm_rbh =
  CASE
    WHEN LOWER(name) LIKE '%stalowe%'
      OR LOWER(name) LIKE '%ocynk%'              THEN 0.100
    WHEN LOWER(name) LIKE '%pcv%'
      OR LOWER(name) LIKE '%pvc%'                THEN 0.070
    ELSE 0.080
  END
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (LOWER(name) LIKE '%korytko%' OR LOWER(name) LIKE '%koryt kab%')
  AND unit IN ('m', 'mb');

-- 4. Drabinka kablowa (cable ladder) ──────────────────────
UPDATE catalog_items SET labor_norm_rbh = 0.120
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND LOWER(name) LIKE '%drabinka%'
  AND unit IN ('m', 'mb');

-- 5. Rura / rurka instalacyjna (conduit) ──────────────────
UPDATE catalog_items SET labor_norm_rbh =
  CASE
    WHEN LOWER(name) LIKE '%karbowana%'          THEN 0.040
    WHEN LOWER(name) LIKE '%sztywna%'
      OR LOWER(name) LIKE '%pcv%'
      OR LOWER(name) LIKE '%pvc%'                THEN 0.050
    WHEN LOWER(name) LIKE '%stalowa%'
      OR LOWER(name) LIKE '%gi%'                 THEN 0.070
    ELSE 0.045
  END
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (LOWER(name) LIKE '%rura%' OR LOWER(name) LIKE '%rurka%')
  AND unit IN ('m', 'mb')
  AND LOWER(name) NOT LIKE '%kanał%'
  AND LOWER(name) NOT LIKE '%kanal%';

-- 6. Taśma LED (LED strip) ────────────────────────────────
UPDATE catalog_items SET labor_norm_rbh = 0.030
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (LOWER(name) LIKE '%tasma led%' OR LOWER(name) LIKE '%taśma led%')
  AND unit IN ('m', 'mb');

-- 7. Kanał instalacyjny / listwa (cable channel) ──────────
UPDATE catalog_items SET labor_norm_rbh =
  CASE
    WHEN LOWER(name) LIKE '%dado%'               THEN 0.080
    WHEN LOWER(name) LIKE '%parapet%'            THEN 0.070
    ELSE 0.060
  END
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (
    LOWER(name) LIKE '%kanal inst%'
    OR LOWER(name) LIKE '%kanał inst%'
    OR LOWER(name) LIKE '%listwa nakabel%'
    OR LOWER(name) LIKE '%dado%'
    OR LOWER(name) LIKE '%parapet%'
  )
  AND unit IN ('m', 'mb');

-- Verify
SELECT
  CASE
    WHEN LOWER(name) LIKE '%bruzd%'       THEN 'bruzda'
    WHEN LOWER(name) LIKE '%bednarka%'    THEN 'bednarka'
    WHEN LOWER(name) LIKE '%drut%'        THEN 'drut'
    WHEN LOWER(name) LIKE '%korytko%'     THEN 'korytko'
    WHEN LOWER(name) LIKE '%drabinka%'    THEN 'drabinka'
    WHEN LOWER(name) LIKE '%rura%'        THEN 'rura'
    WHEN LOWER(name) LIKE '%tasma%' OR LOWER(name) LIKE '%taśma%' THEN 'tasma_led'
    ELSE 'inne'
  END AS typ,
  COUNT(*) AS cnt,
  ROUND(AVG(labor_norm_rbh)::numeric, 3) AS avg_norm
FROM catalog_items
WHERE labor_norm_rbh > 0
  AND unit IN ('m', 'mb')
GROUP BY 1
ORDER BY cnt DESC;
