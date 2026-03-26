-- ============================================================
-- Migration v2: Add labor_norm_rbh to cables in catalog_items
-- KNR 5-08 norms (rbh/mb). Only NULL or 0 values updated.
-- Excludes work items: bruzdowanie, montaz, demontaz, rury
-- ============================================================

UPDATE catalog_items
SET labor_norm_rbh = CASE

  -- Slabopradowe: domofon, sygnalizacja, TV, KNX, UTP/FTP
  WHEN LOWER(name) LIKE '%domofonowy%'
    OR LOWER(name) LIKE '%ytksy%'
    OR LOWER(name) LIKE '%htkh%'
    OR LOWER(name) LIKE '%koncentryczny%'
    OR LOWER(name) LIKE '%rg-6%'
    OR LOWER(name) LIKE '%rg6%'
    OR LOWER(name) LIKE '%knx bus%'
    OR LOWER(name) LIKE '%telefoniczny%'
    OR LOWER(name) LIKE '%sygnalizacyjny%'
    OR LOWER(name) LIKE '%utp%'
    OR (LOWER(name) LIKE '%ftp%' AND LOWER(name) LIKE '%cat%')
    THEN 0.020

  -- Kable grzejne
  WHEN LOWER(name) LIKE '%grzejny%'
    OR LOWER(name) LIKE '%grzewczy%'
    OR LOWER(name) LIKE '%samoregulowan%'
    THEN 0.030

  -- Swiatłowody
  WHEN LOWER(name) LIKE '%swiatlow%'
    OR LOWER(name) LIKE '%fiber%'
    OR LOWER(name) LIKE '%optyczny%'
    THEN 0.030

  -- Kable solarne DC
  WHEN LOWER(name) LIKE '%solarny%'
    THEN 0.040

  -- Przekroj 1.5 mm2 i 2.5 mm2
  WHEN name ~ '1[,.][5]' OR name ~ '2[,.][5]'
    OR name ~ '[xX]1[,.][5]' OR name ~ '[xX]2[,.][5]'
    OR name ~ '3x1\.' OR name ~ '3x2\.'
    OR name ~ '5x1\.' OR name ~ '5x2\.'
    THEN 0.040

  -- Przekroj 4 mm2 i 6 mm2
  WHEN name ~ '[xX]4[^0-9]' OR name ~ '[xX]6[^0-9]'
    OR name ~ '[xX]4$' OR name ~ '[xX]6$'
    OR name ~ '3x4' OR name ~ '3x6'
    OR name ~ '5x4' OR name ~ '5x6'
    OR name ~ '4x4' OR name ~ '4x6'
    THEN 0.050

  -- Przekroj 10 i 16 mm2
  WHEN name ~ '[xX]10[^0-9]' OR name ~ '[xX]16[^0-9]'
    OR name ~ '[xX]10$' OR name ~ '[xX]16$'
    THEN 0.060

  -- Przekroj 25 i 35 mm2
  WHEN name ~ '[xX]25[^0-9]' OR name ~ '[xX]35[^0-9]'
    OR name ~ '[xX]25$' OR name ~ '[xX]35$'
    THEN 0.080

  -- Przekroj 50 i 70 mm2
  WHEN name ~ '[xX]50[^0-9]' OR name ~ '[xX]70[^0-9]'
    OR name ~ '[xX]50$' OR name ~ '[xX]70$'
    THEN 0.100

  -- Przekroj 95 i 120 mm2
  WHEN name ~ '[xX]95[^0-9]' OR name ~ '[xX]120[^0-9]'
    OR name ~ '[xX]95$' OR name ~ '[xX]120$'
    THEN 0.120

  -- Przekroj 150, 185, 240 mm2
  WHEN name ~ '[xX]150[^0-9]' OR name ~ '[xX]185[^0-9]' OR name ~ '[xX]240[^0-9]'
    OR name ~ '[xX]150$' OR name ~ '[xX]185$' OR name ~ '[xX]240$'
    THEN 0.150

  -- Fallback dla pozostalych kabli
  ELSE 0.040

END
WHERE unit IN ('mb', 'm')
  AND (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND (
    LOWER(name) LIKE '%kabel%'
    OR LOWER(name) LIKE '%przewod%'
    OR LOWER(name) LIKE '%ydy%'
    OR LOWER(name) LIKE '%nyx%'
    OR LOWER(name) LIKE '%yky%'
    OR LOWER(name) LIKE '%lgy%'
    OR LOWER(name) LIKE '%h07%'
    OR LOWER(name) LIKE '%n2xh%'
    OR LOWER(name) LIKE '%nhxmh%'
    OR LOWER(name) LIKE '%hdgs%'
    OR LOWER(name) LIKE '%utp%'
    OR LOWER(name) LIKE '%rg-6%'
    OR LOWER(name) LIKE '%domofonowy%'
    OR LOWER(name) LIKE '%ytksy%'
    OR LOWER(name) LIKE '%htkh%'
    OR LOWER(name) LIKE '%grzejny%'
    OR LOWER(name) LIKE '%grzewczy%'
    OR LOWER(name) LIKE '%solarny%'
    OR LOWER(name) LIKE '%swiatlow%'
    OR LOWER(name) LIKE '%owy 3x%'
    OR LOWER(name) LIKE '%owy 5x%'
    OR LOWER(name) LIKE '%owy 4x%'
    OR LOWER(name) LIKE '%owy 2x%'
  )
  AND LOWER(name) NOT LIKE '%bruzd%'
  AND LOWER(name) NOT LIKE '%demontaz%'
  AND LOWER(name) NOT LIKE '%montaz%'
  AND LOWER(name) NOT LIKE '%rura%'
  AND LOWER(name) NOT LIKE '%koryto%'
  AND LOWER(name) NOT LIKE '%drabinka%'
  AND LOWER(name) NOT LIKE '%przepust%';
