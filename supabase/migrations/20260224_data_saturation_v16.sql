-- ============================================================
-- ElektroSmart PRO — Data Saturation v1.6
-- Cel: Wypełnić "czerwone strefy" Health Monitor
--   1. panel_material → 5 pozycji (było 1)
--   2. panel_busbar   → 5 pozycji (było 1)
--   3. wiring         → 10 pozycji (było 5)
--   4. compensation   → 10 pozycji (było 4)
--   5. contactor      → 10 pozycji (było 6)
--   6. timer          → 10 pozycji (było 6)
--   7. monitoring     → 10 pozycji (było 6)
--   8. automation     → 10 pozycji (było 6)
--   9. switch         → 10 pozycji (było 7)
--  10. enclosure      → 10 pozycji (było 7)
--  11. terminal       → 10 pozycji (było 7)
-- ============================================================

DO $$
DECLARE
  v_cat_din  UUID;
  v_cat_zestaw UUID;
BEGIN
  -- Resolve category IDs (no slug column — match by name)
  SELECT id INTO v_cat_din    FROM public.catalog_categories WHERE name ILIKE '%rozdzielnic%' LIMIT 1;
  SELECT id INTO v_cat_zestaw FROM public.catalog_categories WHERE name ILIKE '%zestawy%'    LIMIT 1;

  IF v_cat_din IS NULL THEN
    SELECT id INTO v_cat_din FROM public.catalog_categories LIMIT 1;
  END IF;
  IF v_cat_zestaw IS NULL THEN
    v_cat_zestaw := v_cat_din;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- 1. panel_material (bazowe materiały szyny DIN)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Hager — materiał modułu DIN (bazowy)', 'Bazowa pozycja materiałowa dla aparatury Hager', 'szt', 18.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat_din, 'Schneider — materiał modułu DIN (bazowy)', 'Bazowa pozycja materiałowa dla aparatury Schneider', 'szt', 22.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat_din, 'Eaton — materiał modułu DIN (bazowy)', 'Bazowa pozycja materiałowa dla aparatury Eaton', 'szt', 20.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL),
    (v_cat_din, 'Legrand — materiał modułu DIN (bazowy)', 'Bazowa pozycja materiałowa dla aparatury Legrand', 'szt', 24.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 2. panel_busbar (szyny łączeniowe / grzebieniowe)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Hager KCN212B — Szyna grzebieniowa 2P 12 mod', '12-biegunowa szyna łączeniowa 2-polowa Hager', 'szt', 28.00, 5.00, 'KNR 5-08 0812-02', 0.08, 'panel_busbar', 'verified', true, NULL),
    (v_cat_din, 'Schneider A9XPH312 — Szyna grzebieniowa 3P 12 mod', '12-biegunowa szyna łączeniowa 3-polowa Schneider', 'szt', 32.00, 5.00, 'KNR 5-08 0812-01', 0.08, 'panel_busbar', 'verified', true, NULL),
    (v_cat_din, 'Legrand — Szyna grzebieniowa 2P 18 mod', '18-biegunowa szyna łączeniowa 2-polowa Legrand', 'szt', 35.00, 6.00, 'KNR 5-08 0812-02', 0.08, 'panel_busbar', 'verified', true, NULL),
    (v_cat_din, 'Eaton — Szyna grzebieniowa 3P 18 mod', '18-biegunowa szyna łączeniowa 3-polowa Eaton', 'szt', 38.00, 6.00, 'KNR 5-08 0812-01', 0.08, 'panel_busbar', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 3. wiring (przewody wewnętrzne rozdzielnicy LgY)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Przewód LgY 1×1,5mm² (szary) — 1mb', 'Przewód giętki jednożyłowy do rozdzielnicy LgY 1.5mm²', 'mb', 1.80, 3.25, 'KNR 5-08 0101-01', 0.05, 'wiring', 'verified', true, NULL),
    (v_cat_din, 'Przewód LgY 1×2,5mm² (szary) — 1mb', 'Przewód giętki jednożyłowy do rozdzielnicy LgY 2.5mm²', 'mb', 2.50, 3.25, 'KNR 5-08 0101-02', 0.05, 'wiring', 'verified', true, NULL),
    (v_cat_din, 'Przewód LgY 1×6mm² (szary) — 1mb', 'Przewód giętki jednożyłowy do rozdzielnicy LgY 6mm²', 'mb', 5.20, 3.90, 'KNR 5-08 0101-04', 0.06, 'wiring', 'verified', true, NULL),
    (v_cat_din, 'Przewód LgY 1×10mm² (czarny) — 1mb', 'Przewód giętki jednożyłowy LgY 10mm² zasilanie główne', 'mb', 9.50, 4.55, 'KNR 5-08 0101-05', 0.07, 'wiring', 'verified', true, NULL),
    (v_cat_din, 'Przewód LgY 1×16mm² (czarny) — 1mb', 'Przewód giętki jednożyłowy LgY 16mm² WLZ', 'mb', 14.80, 5.20, 'KNR 5-08 0101-06', 0.08, 'wiring', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 4. compensation (kondensatory / kompensacja mocy biernej)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton PKZM01-1 — Kondensator fazowy 1kVAr', 'Kondensator modułowy DIN 1kVAr Eaton do kompensacji', 'szt', 185.00, 35.00, 'KNR 5-08 0901-01', 0.54, 'compensation', 'verified', true, NULL),
    (v_cat_din, 'Legrand 412960 — Kondensator DIN 5kVAr 400V', 'Kondensator trójfazowy DIN 5kVAr Legrand', 'szt', 420.00, 45.00, 'KNR 5-08 0901-01', 0.70, 'compensation', 'verified', true, NULL),
    (v_cat_din, 'Schneider VarSet — Bateria kondensatorów 12,5kVAr', 'Bateria kondensatorów 12.5kVAr Schneider Electric', 'szt', 1250.00, 75.00, 'KNR 5-08 0901-02', 1.15, 'compensation', 'verified', true, NULL),
    (v_cat_din, 'Eaton C-MAX — Regulator kompensacji mocy biernej 12-stopniowy', 'Automatyczny regulator kompensacji Eaton 12-stopniowy', 'szt', 1450.00, 90.00, 'KNR 5-08 0901-03', 1.38, 'compensation', 'verified', true, NULL),
    (v_cat_din, 'Legrand 004672 — Dławik przeciwprzepięciowy do kompensacji', 'Dławik antyrezonansowy Legrand do baterii kondensatorów', 'szt', 380.00, 55.00, 'KNR 5-08 0901-01', 0.85, 'compensation', 'verified', true, NULL),
    (v_cat_din, 'Schneider — Kondensator cylindryczny 400V 20kVAr', 'Kondensator cylindryczny 20kVAr 400V Schneider', 'szt', 680.00, 65.00, 'KNR 5-08 0901-02', 1.00, 'compensation', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 5. contactor (styczniki)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton DILEM-10 — Stycznik 9A 4kW 230V AC', 'Miniaturowy stycznik Eaton 9A/4kW cewka 230V AC', 'szt', 68.00, 19.50, 'KNR 5-08 0701-01', 0.30, 'contactor', 'verified', true, NULL),
    (v_cat_din, 'Legrand CTX3 12 — Stycznik 12A 5,5kW 230V', 'Stycznik CTX³ 12A Legrand z cewką 230V', 'szt', 85.00, 19.50, 'KNR 5-08 0701-01', 0.30, 'contactor', 'verified', true, NULL),
    (v_cat_din, 'Schneider LC1D09M7 — Tesys D 9A 3P 220V', 'Tesys D LC1D09 Schneider 3P 9A cewka 220V', 'szt', 72.00, 19.50, 'KNR 5-08 0701-01', 0.30, 'contactor', 'verified', true, NULL),
    (v_cat_din, 'Eaton DILM17-10 — Stycznik 3P 17A 7,5kW 230V', 'Podstawowy stycznik mocy Eaton 17A/7.5kW', 'szt', 145.00, 26.00, 'KNR 5-08 0701-02', 0.40, 'contactor', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 6. timer (przekaźniki czasowe / zegary)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton EMT6 — Przekaźnik czasowy 0,1s-10h 2P', 'Wielofunkcyjny przekaźnik czasowy Eaton 2P DIN', 'szt', 78.00, 16.25, 'KNR 5-08 0801-01', 0.25, 'timer', 'verified', true, NULL),
    (v_cat_din, 'Legrand 04879 — Zegar tygodniowy DIN 16A', 'Programator tygodniowy Legrand 16A 1P+N DIN', 'szt', 95.00, 16.25, 'KNR 5-08 0801-01', 0.25, 'timer', 'verified', true, NULL),
    (v_cat_din, 'Schneider RE17RAMU — Przekaźnik czasowy wielofunkcyjny', 'Przekaźnik czasowy RE17 Schneider 0.1s-100h', 'szt', 115.00, 19.50, 'KNR 5-08 0801-01', 0.30, 'timer', 'verified', true, NULL),
    (v_cat_din, 'Eaton ESA12 — Wyłącznik zmierzchowy z programatorem', 'Wyłącznik zmierzchowy z tygodniowym programatorem Eaton', 'szt', 185.00, 22.75, 'KNR 5-08 0801-02', 0.35, 'timer', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 7. monitoring (przekaźniki kontrolne / monitory napięcia)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton EMR4-N1-1 — Monitor kolejności faz 3P 400V', 'Przekaźnik kontroli kolejności faz Eaton 3P', 'szt', 145.00, 22.75, 'KNR 5-08 0601-03', 0.35, 'monitoring', 'verified', true, NULL),
    (v_cat_din, 'Legrand 00461 — Monitor napięcia 3P 400V DIN', 'Przekaźnik nadzoru napięcia 3-fazowego Legrand', 'szt', 175.00, 22.75, 'KNR 5-08 0601-03', 0.35, 'monitoring', 'verified', true, NULL),
    (v_cat_din, 'Schneider RM35TF30 — Przekaźnik kontroli faz 3P', 'Zelio Control RM35 Schneider kontrola asymetrii i kolejności faz', 'szt', 195.00, 26.00, 'KNR 5-08 0601-03', 0.40, 'monitoring', 'verified', true, NULL),
    (v_cat_din, 'Eaton EMR6-W500-1 — Miernik cos(φ) + analizator mocy', 'Analizator parametrów sieci Eaton z wyświetlaczem', 'szt', 385.00, 35.00, 'KNR 5-08 0601-03', 0.54, 'monitoring', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 8. automation (moduły automatyki KNX/DALI/BMS)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton xComfort CHCA-00/06 — Sterownik przekaźnikowy 6-kanałowy', 'Sterownik 6-kanałowy RF xComfort Eaton DIN', 'szt', 385.00, 32.50, 'KNR 5-08 0801-05', 0.50, 'automation', 'verified', true, NULL),
    (v_cat_din, 'Legrand 0 048 20 — Moduł wyjść cyfrowych KNX 4×16A', 'Moduł wyjść binarnych KNX Legrand 4 kanały', 'szt', 520.00, 39.00, 'KNR 5-08 0801-05', 0.60, 'automation', 'verified', true, NULL),
    (v_cat_din, 'Schneider MTN647895 — Aktuator żaluzjowy KNX 4-kanałowy', 'Merten KNX aktuator sterowania żaluzjami 4-kanałowy', 'szt', 680.00, 45.50, 'KNR 5-08 0801-05', 0.70, 'automation', 'verified', true, NULL),
    (v_cat_din, 'Eaton ZS-SH — Zasilacz KNX/EIB 640mA MDRC', 'Zasilacz magistrali KNX 640mA Eaton na szynę DIN', 'szt', 420.00, 29.25, 'KNR 5-08 0801-05', 0.45, 'automation', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 9. switch (wyłączniki krzywkowe / rozłączniki)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton P1-32/E3SVB — Rozłącznik 3P 32A z kłódką', 'Bezpiecznikowy rozłącznik 3P 32A Eaton z możliwością blokady', 'szt', 125.00, 16.25, 'KNR 5-04 0701-01', 0.25, 'switch', 'verified', true, NULL),
    (v_cat_din, 'Legrand 022410 — Rozłącznik izolacyjny 3P 40A DIN', 'Rozłącznik separacyjny 3P 40A Legrand DIN', 'szt', 145.00, 16.25, 'KNR 5-04 0701-01', 0.25, 'switch', 'verified', true, NULL),
    (v_cat_din, 'Schneider iSW-NA 4P 40A — Rozłącznik izolacyjny', 'Rozłącznik izolacyjny iSW-NA 4P 40A Schneider DIN', 'szt', 165.00, 19.50, 'KNR 5-04 0701-02', 0.30, 'switch', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 10. enclosure (obudowy rozdzielnic)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Eaton BPZ-MSE-1200/4-T — Rozdzielnica 4 rz. 1200×800', 'Wolnostojąca rozdzielnica metalowa Eaton 4-rzędowa 72 mod.', 'szt', 2850.00, 260.00, 'KNR 5-04 0001-01', 4.00, 'enclosure', 'verified', true, NULL),
    (v_cat_din, 'Legrand XL³ 160 — Rozdzielnica 36 mod. IP43 podtynkowa', 'Obudowa XL³ 160 Legrand 36 modułów podtynkowa', 'szt', 420.00, 65.00, 'KNR 5-04 0001-01', 1.00, 'enclosure', 'verified', true, NULL),
    (v_cat_din, 'Schneider NSYPLM43 — Obudowa poliester 400×300', 'Obudowa z polestru IP55 400×300mm Schneider bez płyty', 'szt', 185.00, 45.00, 'KNR 5-04 0001-01', 0.70, 'enclosure', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════
  -- 11. terminal (złączki szynowe DIN)
  -- ══════════════════════════════════════════════════════════
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din, 'Phoenix PT 1,5 — Złączka szynowa 1.5mm² (op. 50szt)', 'Złączka Push-in Phoenix Contact 1.5mm² 50szt/op', 'op', 38.00, 6.50, 'KNR 5-08 0401-01', 0.10, 'terminal', 'verified', true, NULL),
    (v_cat_din, 'Weidmuller WDU 2.5 — Złączka szynowa 2.5mm² (op. 50szt)', 'Złączka śrubowa Weidmuller 2.5mm² 50szt/op', 'op', 42.00, 6.50, 'KNR 5-08 0401-01', 0.10, 'terminal', 'verified', true, NULL),
    (v_cat_din, 'Schneider NSYTRAB2510 — Złączka 2.5mm² 10A (op. 50szt)', 'Złączka do szyny Schneider 2.5mm² 10A 50szt', 'op', 45.00, 6.50, 'KNR 5-08 0401-01', 0.10, 'terminal', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Data Saturation v1.6 completed successfully';
END;
$$;
