-- ============================================================
-- ElektroSmart PRO — Fill missing panel_category entries
-- Fills: consumable, labor (ogólna), fixes panel_material KNR
-- Also adds wiring entries with realistic prices
-- ============================================================

DO $$
DECLARE
  v_obj_type_id UUID;
  v_cat_zestaw  UUID;
  v_cat_din     UUID;
BEGIN

  SELECT id INTO v_obj_type_id FROM public.object_types LIMIT 1;

  SELECT id INTO v_cat_zestaw FROM public.catalog_categories
  WHERE name = 'Akcesoria Rozdzielnicy (Zestaw)' LIMIT 1;

  SELECT id INTO v_cat_din FROM public.catalog_categories
  WHERE name = 'Aparatura Modularna DIN' LIMIT 1;

  IF v_cat_zestaw IS NULL THEN
    INSERT INTO public.catalog_categories (object_type_id, name, icon_name, sort_order)
    VALUES (v_obj_type_id, 'Akcesoria Rozdzielnicy (Zestaw)', 'box', 51)
    RETURNING id INTO v_cat_zestaw;
  END IF;

  IF v_cat_din IS NULL THEN
    INSERT INTO public.catalog_categories (object_type_id, name, icon_name, sort_order)
    VALUES (v_obj_type_id, 'Aparatura Modularna DIN', 'zap', 50)
    RETURNING id INTO v_cat_din;
  END IF;

  -- ── FIX: panel_material — dodaj knr_code (było NULL, teraz ES-INTERNAL) ───
  UPDATE public.catalog_items
  SET knr_code = 'ES-INTERNAL', catalog_confidence = 'verified'
  WHERE panel_category = 'panel_material'
    AND user_id IS NULL
    AND (knr_code IS NULL OR knr_code = '');

  -- ── NEW: consumable — Materiały pomocnicze (kpl.) ──────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_zestaw,
     'Tulejki końcowe + taśma (kpl.)',
     'Komplet tulejek końcowych, taśmy izolacyjnej i materiałów pomocniczych — 1 projekt',
     'kpl', 18.00, 0.00, 'KNR 5-04 0001-02', 0.02, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Oznaczniki obwodów (kpl.)',
     'Oznaczniki przewodów i szyn L1/L2/L3/N/PE — komplet do rozdzielnicy',
     'kpl', 12.50, 0.00, 'KNR 5-04 0001-02', 0.01, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Opaski kablowe + uchwyty (kpl.)',
     'Opaski zaciskowe 200mm i 300mm + uchwyty samoprzylepne — komplet montażowy',
     'kpl', 8.50, 0.00, 'KNR 5-04 0001-02', 0.01, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Szyna TH35 + ograniczniki końcowe',
     'Szyna TH35 1m + ograniczniki końcowe szyny (komplet)',
     'kpl', 14.00, 3.00, 'KNR 5-04 0001-02', 0.05, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Dławnice kablowe M20/M25 (kpl.)',
     'Komplet dławnic kablowych M20 i M25 do przepustu kabli w szafie',
     'kpl', 22.00, 4.50, 'KNR 5-04 0001-02', 0.07, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Śruby + nakrętki montażowe M6 (kpl.)',
     'Komplet śrub M6 i nakrętek do montażu aparatury w szafie rack',
     'kpl', 6.50, 0.00, 'KNR 5-04 0001-02', 0.01, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Korytko kablowe 40×60mm (mb)',
     'Korytko kablowe PVC 40×60mm z pokrywą — wewnątrz szafy',
     'mb', 9.80, 5.00, 'KNR 5-04 0001-02', 0.08, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Przegroda fazowa + izolator (kpl.)',
     'Przegroda między fazami + izolator szyny PE — komplet bezpieczeństwa',
     'kpl', 16.00, 2.50, 'KNR 5-04 0001-02', 0.04, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Koszulki termokurczliwe (zestaw)',
     'Zestaw koszulek termokurczliwych różnych rozmiarów do opisów przewodów',
     'kpl', 11.00, 0.00, 'KNR 5-04 0001-02', 0.01, 'consumable', 'verified', true, NULL),
    (v_cat_zestaw,
     'Taśma samoprzylepna etykiet (rol.)',
     'Taśma do drukarki etykiet 12mm — oznakowanie rozdzielnicy',
     'szt', 24.00, 0.00, 'KNR 5-04 0001-02', 0.00, 'consumable', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── NEW: labor — Robocizna montażu ogólna ─────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_zestaw,
     'Robocizna montażu ogólna (r-g)',
     'Ogólna robocizna montażu elementów rozdzielnicy — stawka bazowa',
     'rbh', 0.00, 65.00, 'KNR 5-04 0101-01', 0.25, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Montaż aparatu DIN ogólny (r-g)',
     'Montaż dowolnego aparatu modułowego DIN — czas standardowy',
     'rbh', 0.00, 65.00, 'KNR 5-04 0101-01', 0.20, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Podłączenie przewodów do zacisku (r-g)',
     'Podłączenie i zaciskanie przewodów do zacisku aparatury — na przewód',
     'rbh', 0.00, 65.00, 'KNR 5-04 0101-01', 0.05, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Układanie przewodów w korytku (r-g)',
     'Układanie i porządkowanie przewodów w korytkach wewnątrz szafy',
     'rbh', 0.00, 65.00, 'KNR 5-04 0101-01', 0.10, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Transport i rozładunek rozdzielnicy (r-g)',
     'Transport na miejsce montażu i rozładunek szafy rozdzielczej',
     'rbh', 0.00, 65.00, 'KNR 5-04 0001-01', 0.30, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Montaż szyn prądowych Cu (r-g)',
     'Montaż i mocowanie szyn zbiorczych Cu w rozdzielnicy',
     'rbh', 0.00, 65.00, 'KNR 5-04 0801-01', 0.40, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Uruchomienie i regulacja rozdzielnicy (r-g)',
     'Próby funkcjonalne, pomiary, regulacja i uruchomienie gotowej rozdzielnicy',
     'rbh', 0.00, 65.00, 'KNR 5-04 0001-01', 0.50, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Demontaż starej rozdzielnicy (r-g)',
     'Demontaż istniejącej rozdzielnicy i utylizacja aparatury',
     'rbh', 0.00, 65.00, 'KNR 5-04 0001-01', 1.00, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Programowanie modułu KNX/Shelly (r-g)',
     'Programowanie i konfiguracja modułów automatyki KNX / Shelly Pro',
     'rbh', 0.00, 65.00, 'KNR 5-08 0295-02', 1.00, 'labor', 'verified', true, NULL),
    (v_cat_zestaw,
     'Pomiary i protokół odbioru (r-g)',
     'Pomiary odbiorcze: izolacja, ciągłość, zwarcia + protokół ITB',
     'rbh', 0.00, 65.00, 'KNR 5-04 0001-01', 0.75, 'labor', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── FIX: wiring — dodaj pozycje z realistycznymi cenami ──────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'Przewód LgYżo 1×6mm² czarny (mb)',
     'Przewód jednożyłowy 6mm² do szafy rozdzielczej — cena za metr',
     'mb', 4.80, 3.25, 'KNR 5-04 0801-01', 0.05, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Przewód LgYżo 1×10mm² czarny (mb)',
     'Przewód jednożyłowy 10mm² do szafy rozdzielczej',
     'mb', 7.50, 3.25, 'KNR 5-04 0801-01', 0.05, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Przewód LgYżo 1×16mm² czarny (mb)',
     'Przewód jednożyłowy 16mm² do szafy rozdzielczej — szynowy',
     'mb', 11.50, 3.90, 'KNR 5-04 0801-01', 0.06, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Przewód LgYżo 1×25mm² czarny (mb)',
     'Przewód jednożyłowy 25mm² do szafy rozdzielczej — główne zasilanie',
     'mb', 17.80, 5.20, 'KNR 5-04 0801-01', 0.07, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Przewód LgYżo 1×35mm² czarny (mb)',
     'Przewód jednożyłowy 35mm² — zasilanie główne rozdzielnicy',
     'mb', 23.50, 6.50, 'KNR 5-04 0801-01', 0.08, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Przewód LgYżo 1×50mm² czarny (mb)',
     'Przewód jednożyłowy 50mm² — WLZ/zasilanie główne',
     'mb', 33.00, 7.80, 'KNR 5-04 0801-01', 0.09, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Szyna miedziana Cu 30×5mm (mb)',
     'Szyna zbiorcza Cu 30×5mm do rozdzielnicy — 250A',
     'mb', 42.00, 9.75, 'KNR 5-04 0801-01', 0.15, 'wiring', 'verified', true, NULL),
    (v_cat_din,
     'Szyna miedziana Cu 30×10mm (mb)',
     'Szyna zbiorcza Cu 30×10mm do rozdzielnicy — 500A',
     'mb', 82.00, 13.00, 'KNR 5-04 0801-01', 0.20, 'wiring', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── FIX: panel_busbar — upewnij się że ma ceny ────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_zestaw,
     'Szyna łączeniowa 12-mod. (udział)',
     'Udział w szynie łączeniowej do rozdzielnicy 12-modułowej — cena za biegun',
     'szt', 1.80, 1.30, 'KNR 5-04 0001-02', 0.02, 'panel_busbar', 'verified', true, NULL),
    (v_cat_zestaw,
     'Grzebień fazowy 4P/12 mod. (kpl.)',
     'Grzebień fazowy 4-biegunowy do aparatów DIN — 12 modułów',
     'kpl', 28.00, 6.50, 'KNR 5-04 0001-02', 0.10, 'panel_busbar', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

END $$;

-- ─── Weryfikacja ───────────────────────────────────────────────────────────────
-- SELECT panel_category, COUNT(*) AS cnt,
--        ROUND(AVG(NULLIF(base_material_price,0)),0) AS avg_mat,
--        COUNT(knr_code) AS with_knr
-- FROM catalog_items
-- WHERE is_active = true AND panel_category IS NOT NULL AND user_id IS NULL
-- GROUP BY panel_category ORDER BY panel_category;
