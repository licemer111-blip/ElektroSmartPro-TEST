-- ════════════════════════════════════════════════════════════════════════════
-- 20260306_seed_knr_to_materials_zestawy.sql
-- ElektroSmart PRO — Seed: powiązania KNR → Materiały (Zestawy)
--
-- Implementuje Iron Rule "Zestawy":
--   Wybranie "Punktu" (np. gniazdo) automatycznie generuje:
--     1. Urządzenie (Gniazdo)
--     2. Puszka (Puszka podtynkowa)
--     3. Kabel (Przewód — liczony w mb)
--     4. Bruzdowanie (Kucie bruzd)
--
-- Dane zsynchronizowane z lib/config/zestawy-recipes.ts
-- Iron Rule: component_type 'robocizna' i 'material' ZAWSZE oddzielone
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Zestaw 1: Punkt gniazda 230V (KNR 5-08 0301-01) ─────────────────────────
-- Synchronizacja z ZESTAWY_RECIPES[key='gniazdo_230v']

WITH norm AS (
  SELECT id FROM knr_norms
  WHERE catalog_code = 'KNR 5-08'
    AND table_number = '0301'
    AND column_number = '01'
  LIMIT 1
)
INSERT INTO knr_to_materials
  (knr_norm_id, material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
SELECT
  norm.id,
  v.material_name, v.material_unit, v.material_category, v.quantity_factor, v.component_type, v.recipe_component_id, v.is_optional, v.only_for_surface
FROM norm, (VALUES
  ('Gniazdo podtynkowe 230V 16A',  'szt', 'gniazda_wylaczniki', 1.0,   'device',     'gnz_mat_gnz', false, NULL::text[]),
  ('Puszka podtynkowa Ø60',         'szt', 'gniazda_wylaczniki', 1.0,   'box',        'gnz_mat_pus', false, NULL::text[]),
  ('Przewód YDYp 3×2.5mm²',        'mb',  'kable_silnopradowe', 3.5,   'cable',      'gnz_mat_kab', false, NULL::text[]),
  ('Montaż gniazda 230V',           'szt', 'gniazda_wylaczniki', 1.0,   'robocizna',  'gnz_rob_gnz', false, NULL::text[]),
  ('Montaż puszki podtynkowej',     'szt', 'gniazda_wylaczniki', 1.0,   'robocizna',  'gnz_rob_pus', false, NULL::text[]),
  ('Okablowanie YDYp 3×2.5mm²',    'mb',  'kable_silnopradowe', 3.5,   'robocizna',  'gnz_rob_kab', false, NULL::text[]),
  ('Kucie bruzd',                   'mb',  'rury_trasy',         3.5,   'chase',      'gnz_rob_brz', true,  ARRAY['w_tynku','pod_tynkiem'])
) AS v(material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
ON CONFLICT DO NOTHING;

-- ─── Zestaw 2: Punkt oświetleniowy (KNR 5-08 0401-01) ─────────────────────────
-- Synchronizacja z ZESTAWY_RECIPES[key='punkt_oswietleniowy']

WITH norm AS (
  SELECT id FROM knr_norms
  WHERE catalog_code = 'KNR 5-08'
    AND table_number = '0401'
    AND column_number = '01'
  LIMIT 1
)
INSERT INTO knr_to_materials
  (knr_norm_id, material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
SELECT
  norm.id,
  v.material_name, v.material_unit, v.material_category, v.quantity_factor, v.component_type, v.recipe_component_id, v.is_optional, v.only_for_surface
FROM norm, (VALUES
  ('Oprawa LED',                    'szt', 'oswietlenie',        1.0,   'device',    'ow_mat_opr',  false, NULL::text[]),
  ('Łącznik podtynkowy 1P',         'szt', 'gniazda_wylaczniki', 1.0,   'device',    'ow_mat_lac',  false, NULL::text[]),
  ('Puszka podtynkowa Ø60',         'szt', 'gniazda_wylaczniki', 1.0,   'box',       'ow_mat_pus',  false, NULL::text[]),
  ('Przewód YDYp 3×1.5mm²',        'mb',  'kable_silnopradowe', 3.5,   'cable',     'ow_mat_kab',  false, NULL::text[]),
  ('Montaż oprawy LED',             'szt', 'oswietlenie',        1.0,   'robocizna', 'ow_rob_opr',  false, NULL::text[]),
  ('Montaż łącznika',               'szt', 'gniazda_wylaczniki', 1.0,   'robocizna', 'ow_rob_lac',  false, NULL::text[]),
  ('Montaż puszki podtynkowej',     'szt', 'gniazda_wylaczniki', 1.0,   'robocizna', 'ow_rob_pus',  false, NULL::text[]),
  ('Okablowanie YDYp 3×1.5mm²',    'mb',  'kable_silnopradowe', 3.5,   'robocizna', 'ow_rob_kab',  false, NULL::text[]),
  ('Kucie bruzd',                   'mb',  'rury_trasy',         3.5,   'chase',     'ow_rob_brz',  true,  ARRAY['w_tynku','pod_tynkiem'])
) AS v(material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
ON CONFLICT DO NOTHING;

-- ─── Zestaw 3: Punkt LAN RJ45 (KNR 4-03 0201-01) ────────────────────────────
-- Synchronizacja z ZESTAWY_RECIPES[key='punkt_lan']

WITH norm AS (
  SELECT id FROM knr_norms
  WHERE catalog_code = 'KNR 4-03'
    AND table_number = '0201'
    AND column_number = '01'
  LIMIT 1
)
INSERT INTO knr_to_materials
  (knr_norm_id, material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
SELECT
  norm.id,
  v.material_name, v.material_unit, v.material_category, v.quantity_factor, v.component_type, v.recipe_component_id, v.is_optional, v.only_for_surface
FROM norm, (VALUES
  ('Gniazdo RJ45 kat.6',            'szt', 'it_siec',            1.0,   'device',    'lan_mat_gnz', false, NULL::text[]),
  ('Puszka podtynkowa Ø60',         'szt', 'gniazda_wylaczniki', 1.0,   'box',       'lan_mat_pus', false, NULL::text[]),
  ('Kabel UTP kat.6',               'mb',  'kable_slabopradowe', 5.0,   'cable',     'lan_mat_kab', false, NULL::text[]),
  ('Montaż gniazda RJ45 kat.6',     'szt', 'it_siec',            1.0,   'robocizna', 'lan_rob_gnz', false, NULL::text[]),
  ('Montaż puszki podtynkowej',     'szt', 'gniazda_wylaczniki', 1.0,   'robocizna', 'lan_rob_pus', false, NULL::text[]),
  ('Układanie kabla UTP kat.6',     'mb',  'kable_slabopradowe', 5.0,   'robocizna', 'lan_rob_kab', false, NULL::text[])
) AS v(material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
ON CONFLICT DO NOTHING;

-- ─── Zestaw 4: Punkt TV-SAT (KNR 5-06 0601-01) ──────────────────────────────
-- Synchronizacja z ZESTAWY_RECIPES[key='punkt_tv']

WITH norm AS (
  SELECT id FROM knr_norms
  WHERE catalog_code = 'KNR 5-06'
    AND table_number = '0601'
    AND column_number = '01'
  LIMIT 1
)
INSERT INTO knr_to_materials
  (knr_norm_id, material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
SELECT
  norm.id,
  v.material_name, v.material_unit, v.material_category, v.quantity_factor, v.component_type, v.recipe_component_id, v.is_optional, v.only_for_surface
FROM norm, (VALUES
  ('Gniazdo antenowe TV-SAT',       'szt', 'kable_slabopradowe', 1.0,   'device',    'tv_mat_gnz',  false, NULL::text[]),
  ('Puszka podtynkowa Ø60',         'szt', 'gniazda_wylaczniki', 1.0,   'box',       'tv_mat_pus',  false, NULL::text[]),
  ('Kabel RG-6 75Ω',               'mb',  'kable_slabopradowe', 5.0,   'cable',     'tv_mat_kab',  false, NULL::text[]),
  ('Montaż gniazda antenowego',     'szt', 'kable_slabopradowe', 1.0,   'robocizna', 'tv_rob_gnz',  false, NULL::text[]),
  ('Montaż puszki podtynkowej',     'szt', 'gniazda_wylaczniki', 1.0,   'robocizna', 'tv_rob_pus',  false, NULL::text[]),
  ('Układanie kabla RG-6',          'mb',  'kable_slabopradowe', 5.0,   'robocizna', 'tv_rob_kab',  false, NULL::text[])
) AS v(material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
ON CONFLICT DO NOTHING;

-- ─── Zestaw 5: Rozdzielnica 12-modułowa (KNR 5-08 0501-04) ──────────────────

WITH norm AS (
  SELECT id FROM knr_norms
  WHERE catalog_code = 'KNR 5-08'
    AND table_number = '0501'
    AND column_number = '04'
  LIMIT 1
)
INSERT INTO knr_to_materials
  (knr_norm_id, material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
SELECT
  norm.id,
  v.material_name, v.material_unit, v.material_category, v.quantity_factor, v.component_type, v.recipe_component_id, v.is_optional, v.only_for_surface
FROM norm, (VALUES
  ('Rozdzielnica podtynkowa 12-modułowa', 'szt', 'rozdzielnice', 1.0, 'device',    'roz12_mat_roz', false, NULL::text[]),
  ('Szyna TH35 500mm',                    'szt', 'rozdzielnice', 1.0, 'material',  'roz12_mat_szn', false, NULL::text[]),
  ('Szyna PE+N komplet',                  'kpl', 'rozdzielnice', 1.0, 'material',  'roz12_mat_pen', false, NULL::text[]),
  ('Montaż rozdzielnicy 12-mod.',         'kpl', 'rozdzielnice', 1.0, 'robocizna', 'roz12_rob_mnt', false, NULL::text[])
) AS v(material_name, material_unit, material_category, quantity_factor, component_type, recipe_component_id, is_optional, only_for_surface)
ON CONFLICT DO NOTHING;

-- ─── Verification query (diagnostyka po imporcie) ─────────────────────────────
-- Sprawdź liczbę powiązań per norma KNR:
-- SELECT n.full_code, n.description, COUNT(m.id) as materials_count
-- FROM knr_norms n
-- LEFT JOIN knr_to_materials m ON m.knr_norm_id = n.id
-- GROUP BY n.id, n.full_code, n.description
-- ORDER BY materials_count DESC;
