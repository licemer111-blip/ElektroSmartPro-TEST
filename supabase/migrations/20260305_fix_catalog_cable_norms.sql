-- ============================================================
-- Migration: Add labor_norm_rbh to cables in catalog_items
-- Based on KNR 5-08 norms for cable installation (rbh/mb)
-- Only updates items where labor_norm_rbh IS NULL or 0
-- Excludes: bruzdowanie, demontaz, rury, koryta (work items)
-- ============================================================

UPDATE catalog_items
SET labor_norm_rbh = CASE

  -- ── Słaboprądowe: sygnalizacja, domofon, TV, KNX, UTP/FTP ─────
  WHEN LOWER(name) LIKE '%domofonowy%'
    OR LOWER(name) LIKE '%ytksy%'
    OR LOWER(name) LIKE '%htkh%'
    OR LOWER(name) LIKE '%koncentryczny%'
    OR LOWER(name) LIKE '%rg-6%'
    OR LOWER(name) LIKE '%rg6%'
    OR LOWER(name) LIKE '%knx bus%'
    OR LOWER(name) LIKE '%telefoniczny%'
    OR LOWER(name) LIKE '%sygnalizacyjny%'
    THEN 0.020

  -- ── UTP/FTP sieciowe ─────────────────────────────────────────
  WHEN LOWER(name) LIKE '%utp%'
    OR LOWER(name) LIKE '% ftp%'
    OR LOWER(name) LIKE '%cat.5%'
    OR LOWER(name) LIKE '%cat.6%'
    OR LOWER(name) LIKE '%cat6%'
    THEN 0.020

  -- ── Kable grzejne i grzewcze ─────────────────────────────────
  WHEN LOWER(name) LIKE '%grzejny%'
    OR LOWER(name) LIKE '%grzewczy%'
    OR LOWER(name) LIKE '%samoregulowan%'
    THEN 0.030

  -- ── Światłowody ───────────────────────────────────────────────
  WHEN LOWER(name) LIKE '%swiatlow%'
    OR LOWER(name) LIKE '%światłow%'
    OR LOWER(name) LIKE '%fiber%'
    OR LOWER(name) LIKE '%optyczny%'
    THEN 0.030

  -- ── Kable solarne DC ─────────────────────────────────────────
  WHEN LOWER(name) LIKE '%solarny%'
    OR LOWER(name) LIKE '%solar 4mm%'
    OR LOWER(name) LIKE '%pv 4mm%'
    OR (LOWER(name) LIKE '%kabel%' AND LOWER(name) LIKE '%dc%' AND LOWER(name) LIKE '%pv%')
    THEN 0.040

  -- ── Przekroje 1.5 mm² i 2.5 mm² ─────────────────────────────
  WHEN name ~ '1[,\.]5\s*mm'
    OR name ~ '2[,\.]5\s*mm'
    OR name ~ '3x1[,\.]5'
    OR name ~ '3x2[,\.]5'
    OR name ~ '5x1[,\.]5'
    OR name ~ '5x2[,\.]5'
    OR name ~ '2x1[,\.]5'
    OR name ~ '4x1[,\.]5'
    THEN 0.040

  -- ── Przekroje 4 mm² i 6 mm² ──────────────────────────────────
  WHEN name ~ '[^0-9][46][,\.]?0?\s*mm'
    OR name ~ '3x4'
    OR name ~ '3x6'
    OR name ~ '5x4'
    OR name ~ '5x6'
    OR name ~ '4x4'
    OR name ~ '4x6'
    THEN 0.050

  -- ── Przekroje 10 mm² i 16 mm² ────────────────────────────────
  WHEN name ~ '(10|16)\s*mm'
    OR name ~ 'x10[^0-9]'
    OR name ~ 'x16[^0-9]'
    THEN 0.060

  -- ── Przekroje 25 mm² i 35 mm² ────────────────────────────────
  WHEN name ~ '(25|35)\s*mm'
    OR name ~ 'x25[^0-9]'
    OR name ~ 'x35[^0-9]'
    THEN 0.080

  -- ── Przekroje 50 mm² i 70 mm² ────────────────────────────────
  WHEN name ~ '(50|70)\s*mm'
    OR name ~ 'x50[^0-9]'
    OR name ~ 'x70[^0-9]'
    THEN 0.100

  -- ── Przekroje 95 mm² i 120 mm² ───────────────────────────────
  WHEN name ~ '(95|120)\s*mm'
    OR name ~ 'x95[^0-9]'
    OR name ~ 'x120[^0-9]'
    THEN 0.120

  -- ── Przekroje 150 mm², 185 mm², 240 mm² ──────────────────────
  WHEN name ~ '(150|185|240)\s*mm'
    OR name ~ 'x150[^0-9]'
    OR name ~ 'x185[^0-9]'
    OR name ~ 'x240[^0-9]'
    THEN 0.150

  -- ── Fallback: inne kable bez rozpoznanego przekroju ──────────
  ELSE 0.040

END
WHERE unit IN ('mb', 'm')
  AND (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (
    LOWER(name) LIKE '%kabel%'
    OR LOWER(name) LIKE '%przewod%'
    OR LOWER(name) LIKE '%przewód%'
    OR LOWER(name) LIKE '%ydy%'
    OR LOWER(name) LIKE '%nyx%'
    OR LOWER(name) LIKE '%yky%'
    OR LOWER(name) LIKE '%lgyz%'
    OR LOWER(name) LIKE '%lgyzo%'
    OR LOWER(name) LIKE '%lgyo%'
    OR LOWER(name) LIKE '%h07%'
    OR LOWER(name) LIKE '%n2xh%'
    OR LOWER(name) LIKE '%nhxmh%'
    OR LOWER(name) LIKE '%hdgs%'
    OR LOWER(name) LIKE '%owy%3x%'
    OR LOWER(name) LIKE '%owy%5x%'
    OR LOWER(name) LIKE '%utp%'
    OR (LOWER(name) LIKE '% ftp%' AND LOWER(name) LIKE '%cat%')
    OR LOWER(name) LIKE '%rg-6%'
    OR LOWER(name) LIKE '%koncentryczny%'
    OR LOWER(name) LIKE '%domofonowy%'
    OR LOWER(name) LIKE '%ytksy%'
    OR LOWER(name) LIKE '%htkh%'
    OR LOWER(name) LIKE '%grzejny%'
    OR LOWER(name) LIKE '%grzewczy%'
    OR LOWER(name) LIKE '%solarny%'
    OR LOWER(name) LIKE '%swiatlow%'
    OR LOWER(name) LIKE '%światłow%'
  )
  -- Wyklucz pozycje robocizny (bruzdowanie, montaz, demontaz, rury)
  AND LOWER(name) NOT LIKE '%bruzd%'
  AND LOWER(name) NOT LIKE '%demontaz%'
  AND LOWER(name) NOT LIKE '%montaz%'
  AND LOWER(name) NOT LIKE '%rura%'
  AND LOWER(name) NOT LIKE '%koryto%'
  AND LOWER(name) NOT LIKE '%drabinka%'
  AND LOWER(name) NOT LIKE '%przepust%';

-- Weryfikacja: ile wierszy zaktualizowano i rozkład norm
SELECT
  CASE
    WHEN labor_norm_rbh = 0.020 THEN '0.020 (słaboprądowe/UTP)'
    WHEN labor_norm_rbh = 0.030 THEN '0.030 (światłowód/grzejny)'
    WHEN labor_norm_rbh = 0.040 THEN '0.040 (1.5-2.5mm²)'
    WHEN labor_norm_rbh = 0.050 THEN '0.050 (4-6mm²)'
    WHEN labor_norm_rbh = 0.060 THEN '0.060 (10-16mm²)'
    WHEN labor_norm_rbh = 0.080 THEN '0.080 (25-35mm²)'
    WHEN labor_norm_rbh = 0.100 THEN '0.100 (50-70mm²)'
    WHEN labor_norm_rbh = 0.120 THEN '0.120 (95-120mm²)'
    WHEN labor_norm_rbh = 0.150 THEN '0.150 (150mm²+)'
    ELSE CAST(labor_norm_rbh AS text)
  END AS norm_group,
  COUNT(*) AS count
FROM catalog_items
WHERE unit IN ('mb', 'm')
  AND labor_norm_rbh IS NOT NULL
  AND labor_norm_rbh > 0
  AND (
    LOWER(name) LIKE '%kabel%' OR LOWER(name) LIKE '%przewod%'
    OR LOWER(name) LIKE '%przewód%' OR LOWER(name) LIKE '%ydy%'
    OR LOWER(name) LIKE '%utp%' OR LOWER(name) LIKE '%hdgs%'
  )
GROUP BY 1
ORDER BY labor_norm_rbh;
