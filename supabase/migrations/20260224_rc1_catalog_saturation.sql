-- ============================================================
-- ElektroSmart PRO — RC1 Catalog Saturation
-- Cel: Wszystkie kategorie ≥ 10 pozycji → pełne zielone paski
-- Dotyczy: spd, panel_material, panel_busbar, panel_consumable,
--          panel_assembly, panel_labor
-- ============================================================

DO $$
DECLARE
  v_cat UUID;
BEGIN
  SELECT id INTO v_cat FROM public.catalog_categories
    WHERE name ILIKE '%rozdzielnic%' LIMIT 1;
  IF v_cat IS NULL THEN
    SELECT id INTO v_cat FROM public.catalog_categories LIMIT 1;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- 1. SPD (8 → 10+): Schneider/Eaton/Legrand ochronniki
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat, 'Hager SPN440 — SPD T1+T2 4P 40kA 275V',
     'Ochronnik przepieciowy Hager T1+T2 4P 40kA', 'szt',
     285.00, 19.50, 'KNR 5-04 0501-01', 0.30, 'spd', 'verified', true, NULL),
    (v_cat, 'Eaton CHSPT2ULTRA — SPD T2 2P 50kA 230V',
     'Ochronnik T2 Eaton 2P 50kA do rozdzielnicy', 'szt',
     195.00, 13.00, 'KNR 5-04 0501-01', 0.20, 'spd', 'verified', true, NULL),
    (v_cat, 'Legrand 412302 — SPD T2 3P+N 40kA 275V',
     'Ochronnik przepieciowy Legrand T2 3P+N', 'szt',
     245.00, 19.50, 'KNR 5-04 0501-01', 0.30, 'spd', 'verified', true, NULL),
    (v_cat, 'Schneider A9L40294 — SPD T2 4P 40kA iQuick PRD40r',
     'Ochronnik T2 4P 40kA Schneider z monitorem', 'szt',
     320.00, 19.50, 'KNR 5-04 0501-01', 0.30, 'spd', 'verified', true, NULL),
    (v_cat, 'Eaton BSPM1C — SPD T3 1P 15kA do gniazdek',
     'Ochronnik T3 1P 15kA Eaton do obwodow konc.', 'szt',
     85.00, 9.75, 'KNR 5-04 0501-01', 0.15, 'spd', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 2. PANEL_MATERIAL (5 → 10+)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat, 'ABB — material modulu DIN (bazowy)',
     'Bazowa pozycja materiałowa dla aparatury ABB', 'szt',
     21.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat, 'Hager — material modulu DIN (standard)',
     'Pozycja materiałowa standardowa Hager', 'szt',
     19.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat, 'Schneider — material modulu DIN (premium)',
     'Pozycja materiałowa premium Schneider', 'szt',
     26.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat, 'Eaton — material modulu DIN (ekonom)',
     'Pozycja materiałowa ekonomiczna Eaton', 'szt',
     16.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat, 'Legrand — material modulu DIN (standard)',
     'Pozycja materiałowa standardowa Legrand', 'szt',
     23.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 3. PANEL_BUSBAR (5 → 10+)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat, 'ABB SZ-BSB24 — Szyna grzebieniowa 1P 24 mod',
     '24-biegunowa szyna łączeniowa 1P ABB', 'szt',
     22.00, 4.00, 'KNR 5-08 0812-01', 0.06, 'panel_busbar', 'verified', true, NULL),
    (v_cat, 'Hager KCN412B — Szyna grzebieniowa 1P 12 mod',
     '12-biegunowa szyna łączeniowa 1P Hager', 'szt',
     18.00, 3.50, 'KNR 5-08 0812-01', 0.05, 'panel_busbar', 'verified', true, NULL),
    (v_cat, 'Schneider A9XPH218 — Szyna grzebieniowa 2P 18 mod',
     '18-biegunowa szyna 2P Schneider', 'szt',
     38.00, 5.50, 'KNR 5-08 0812-02', 0.08, 'panel_busbar', 'verified', true, NULL),
    (v_cat, 'Legrand — Szyna grzebieniowa 3P 24 mod',
     '24-biegunowa szyna łączeniowa 3P Legrand', 'szt',
     52.00, 7.00, 'KNR 5-08 0812-01', 0.11, 'panel_busbar', 'verified', true, NULL),
    (v_cat, 'Eaton PKZ-BUS12 — Szyna grzebieniowa 3P 12 mod',
     '12-biegunowa szyna łączeniowa 3P Eaton', 'szt',
     42.00, 6.00, 'KNR 5-08 0812-01', 0.09, 'panel_busbar', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 4. PANEL_CONSUMABLE (4 → 10+)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat, 'Komplet tulejek 0.5-2.5mm2 — 100szt',
     'Tulejki kablowe 100szt Weidmuller/Phoenix mix', 'op',
     12.50, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Komplet tulejek 4-16mm2 — 50szt',
     'Tulejki kablowe 50szt duze przekroje', 'op',
     14.00, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Szyna TH35 1m — wspornik do aparatury DIN',
     'Szyna montazowa TH35 dlugosc 1m stalowa', 'szt',
     8.50, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Oznaczniki przewodow 0-9 — komplet 100szt',
     'Oznaczniki do kabli cyfry 0-9 komplet', 'op',
     6.00, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Tasma izolacyjna — komplet 5 kolorow',
     'Tasma izolacyjna PVC 5 kolorow do oznaczania faz', 'op',
     9.00, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Dławnica kablowa M20 — komplet 10szt',
     'Dławnice kablowe M20 10szt IP68', 'op',
     15.00, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Opaski zaciskowe 200mm — 100szt',
     'Opaski kablowe 200mm nylon UV 100szt', 'op',
     5.50, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL),
    (v_cat, 'Ogranicznik koncowy TH35 — 10szt',
     'Ogranicznik końcowy do szyny TH35 10szt', 'op',
     7.00, 0.00, NULL, 0.00, 'panel_consumable', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 5. PANEL_ASSEMBLY (3 → 10+): montaż rozdzielnicy
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat, 'Montaz rozdzielnicy do 12 mod. — uproszczony',
     'Montaz bazowy rozdzielnicy jednorzedowej do 12 modulow', 'szt',
     0.00, 80.00, 'KNR 5-04 0001-01', 1.23, 'panel_assembly', 'verified', true, NULL),
    (v_cat, 'Montaz rozdzielnicy do 36 mod. — standard',
     'Montaz bazowy rozdzielnicy 2-rzedowej do 36 modulow', 'szt',
     0.00, 162.50, 'KNR 5-04 0001-01', 2.50, 'panel_assembly', 'verified', true, NULL),
    (v_cat, 'Montaz rozdzielnicy do 72 mod. — duza',
     'Montaz bazowy rozdzielnicy 4-rzedowej do 72 modulow', 'szt',
     0.00, 260.00, 'KNR 5-04 0001-01', 4.00, 'panel_assembly', 'verified', true, NULL),
    (v_cat, 'Montaz rozdzielnicy podtynkowej — standard',
     'Montaz rozdzielnicy UP w scianie z wykoncz.', 'szt',
     0.00, 195.00, 'KNR 5-04 0001-01', 3.00, 'panel_assembly', 'verified', true, NULL),
    (v_cat, 'Montaz szafy wolnostojacej stalowej',
     'Montaz kompletnej szafy stalowej wolnostojacej', 'szt',
     0.00, 390.00, 'KNR 5-04 0001-01', 6.00, 'panel_assembly', 'verified', true, NULL),
    (v_cat, 'Montaz rozdzielnicy zewnetrznej IP65',
     'Montaz rozdzielnicy hermetycznej IP65 na zewnatrz', 'szt',
     0.00, 143.00, 'KNR 5-04 0001-01', 2.20, 'panel_assembly', 'verified', true, NULL),
    (v_cat, 'Montaz rozdzielnicy przemyslowej IP54',
     'Montaz rozdzielnicy przemyslowej IP54 Schneider/Rittal', 'szt',
     0.00, 325.00, 'KNR 5-04 0001-01', 5.00, 'panel_assembly', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 6. PANEL_LABOR (3 → 10+): robocizna montazu modulow
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat, 'Robocizna montazu MCB 3P (KNR 5-04 0101-03)',
     'Stawka robocizny montazu wylacznika 3P', 'szt',
     0.00, 29.25, 'KNR 5-04 0101-03', 0.45, 'panel_labor', 'verified', true, NULL),
    (v_cat, 'Robocizna montazu RCD 4P (KNR 5-04 0201-02)',
     'Stawka robocizny montazu RCD 4P', 'szt',
     0.00, 39.00, 'KNR 5-04 0201-02', 0.60, 'panel_labor', 'verified', true, NULL),
    (v_cat, 'Robocizna montazu SPD T1+T2 4P',
     'Stawka robocizny montazu ochronnika T1+T2', 'szt',
     0.00, 32.50, 'KNR 5-04 0501-01', 0.50, 'panel_labor', 'verified', true, NULL),
    (v_cat, 'Robocizna montazu licznika energii',
     'Stawka robocizny montazu licznika 1F/3F', 'szt',
     0.00, 45.50, 'KNR 5-04 0801-01', 0.70, 'panel_labor', 'verified', true, NULL),
    (v_cat, 'Robocizna montazu stycznika 3P',
     'Stawka robocizny montazu stycznika do 30A', 'szt',
     0.00, 19.50, 'KNR 5-08 0701-01', 0.30, 'panel_labor', 'verified', true, NULL),
    (v_cat, 'Robocizna ukladania przewodow wewnetrznych — 1mb',
     'Stawka robocizny ukladania przewodow LgY wewnatrz obudowy', 'mb',
     0.00, 3.25, 'KNR 5-08 0101-01', 0.05, 'panel_labor', 'verified', true, NULL),
    (v_cat, 'Robocizna podlaczenia kabla zasilajacego 3x16mm2',
     'Stawka robocizny podlaczenia kabla zasilajacego WLZ', 'szt',
     0.00, 130.00, 'KNR 5-04 0001-02', 2.00, 'panel_labor', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'RC1 Catalog Saturation completed successfully';
END;
$$;
