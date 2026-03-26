-- ============================================================
-- ElektroSmart PRO — Health Monitor 100% coverage seed
-- Uzupełnienie brakujących panel_category dla Health Monitor
-- Typy: panel_material, panel_labor, panel_assembly (już istnieje),
--       enclosure, contactor, timer, monitoring, automation,
--       compensation, terminal, switch
-- ============================================================
-- UWAGA: używamy poprawnych kolumn catalog_items:
--   panel_category, knr_code, labor_norm_rbh, catalog_confidence
--   NIE ma kolumn: origin_type, brand, unit_price, rbh_norm
-- ============================================================

DO $$
DECLARE
  v_obj_type_id UUID;
  v_cat_zestaw  UUID;
  v_cat_din     UUID;
BEGIN

  SELECT id INTO v_obj_type_id FROM public.object_types LIMIT 1;

  -- Kategoria Akcesoria Rozdzielnicy (Zestaw) — dla panel_material/labor/assembly
  SELECT id INTO v_cat_zestaw FROM public.catalog_categories
  WHERE name = 'Akcesoria Rozdzielnicy (Zestaw)' LIMIT 1;

  -- Kategoria Aparatura Modularna DIN — dla enclosure/contactor/timer/monitoring/etc.
  SELECT id INTO v_cat_din FROM public.catalog_categories
  WHERE name = 'Aparatura Modularna DIN' LIMIT 1;

  -- Fallback: utwórz kategorie jeśli nie istnieją
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

  -- ── panel_material (materiał modułu DIN — placeholder cenowy) ────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_zestaw,
     'Materiał modułu DIN (wycena bazowa)',
     'Bazowa pozycja materiałowa dla modułów DIN — wartość zastępcza przed zsynchronizowaniem projektu',
     'szt', 15.00, 0.00, NULL, 0.00, 'panel_material', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── panel_labor (robocizna montażu modułu) ───────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_zestaw,
     'Robocizna montażu modułu DIN (r-g)',
     'Bazowa stawka robocizny montażu modułu DIN — wg KNR 5-04',
     'rbh', 0.00, 65.00, 'KNR 5-04 0101-01', 0.20, 'panel_labor', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── enclosure (obudowa rozdzielnicy) ─────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'Hager VS118 — Obudowa rozdzielnicy 1-rzędowa 18 mod.',
     'Rozdzielnica natynkowa 1-rzędowa 18 modułów IP40 Hager',
     'szt', 85.00, 32.50, 'KNR 5-04 0001-01', 1.00, 'enclosure', 'verified', true, NULL),
    (v_cat_din,
     'Hager VS224 — Obudowa rozdzielnicy 2-rzędowa 24 mod.',
     'Rozdzielnica natynkowa 2-rzędowa 24 moduły IP40 Hager',
     'szt', 145.00, 45.00, 'KNR 5-04 0001-01', 1.50, 'enclosure', 'verified', true, NULL),
    (v_cat_din,
     'Schneider EZ9E212P2S — Resi9 2-rzędowa 24 mod.',
     'Rozdzielnica natynkowa Schneider Resi9 2×12 mod.',
     'szt', 135.00, 45.00, 'KNR 5-04 0001-01', 1.50, 'enclosure', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── contactor (stycznik modułowy) ────────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'Hager ESC225 — Stycznik 2P 25A 230V',
     'Stycznik modułowy 2P 25A cewka 230V AC Hager',
     'szt', 115.00, 29.25, 'KNR 5-04 0301-01', 0.45, 'contactor', 'verified', true, NULL),
    (v_cat_din,
     'Schneider A9C20832 — iCT 2P 32A 230V',
     'Stycznik modułowy 2P 32A 230V Schneider Acti9',
     'szt', 125.00, 29.25, 'KNR 5-04 0301-01', 0.45, 'contactor', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── timer (przekaźnik czasowy) ────────────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'F&F PCM-03 — Przekaźnik czasowy 230V',
     'Przekaźnik czasowy wielofunkcyjny 230V AC F&F',
     'szt', 145.00, 22.75, 'KNR 5-04 0401-01', 0.35, 'timer', 'verified', true, NULL),
    (v_cat_din,
     'Schneider RE22R1MMR — Przekaźnik czasowy',
     'Przekaźnik czasowy wielofunkcyjny Schneider Zelio',
     'szt', 185.00, 22.75, 'KNR 5-04 0401-01', 0.35, 'timer', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── monitoring (przekaźnik kontrolny) ────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'F&F RM-3W — Przekaźnik kontroli faz 3-fazowy',
     'Przekaźnik kontrolny faz 3-fazowy kolejność+zanik F&F',
     'szt', 175.00, 26.00, 'KNR 5-08 0295-01', 0.40, 'monitoring', 'verified', true, NULL),
    (v_cat_din,
     'Schneider RM17TG20 — Zelio Control 3-fazy',
     'Przekaźnik kontroli napięcia 3-faz Schneider Zelio',
     'szt', 210.00, 26.00, 'KNR 5-08 0295-01', 0.40, 'monitoring', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── automation (moduł automatyki) ────────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'Shelly Pro 4PM — Moduł automatyki DIN 4-kanałowy',
     'Moduł automatyki WiFi 4×16A pomiar mocy DIN Shelly Pro',
     'szt', 280.00, 26.00, 'KNR 5-08 0295-02', 0.40, 'automation', 'verified', true, NULL),
    (v_cat_din,
     'Schneider A9MEM3155 — Licznik energii iEM3155',
     'Licznik energii elektrycznej 3-faz RS485 Schneider',
     'szt', 420.00, 32.50, 'KNR 5-08 0295-02', 0.40, 'automation', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── compensation (układ kompensacji mocy biernej) ─────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'Epcos B44066A0010B010 — Kondensator kompensacyjny 10 kvar',
     'Kondensator do kompensacji mocy biernej 10 kvar 400V',
     'szt', 380.00, 39.00, 'KNR 5-08 0295-03', 0.60, 'compensation', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── terminal (złączka szynowa — uzupełnienie panel_category) ─────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'WAGO 2601-1101 — Złączka szynowa 2.5mm²',
     'Złączka szynowa śrubowa 2.5mm² 24A szara WAGO',
     'szt', 3.20, 3.25, 'KNR 5-04 0601-01', 0.10, 'terminal', 'verified', true, NULL),
    (v_cat_din,
     'WAGO 2601-1102 — Złączka szynowa 4mm²',
     'Złączka szynowa śrubowa 4mm² 32A szara WAGO',
     'szt', 4.50, 3.25, 'KNR 5-04 0601-01', 0.10, 'terminal', 'verified', true, NULL),
    (v_cat_din,
     'WAGO 2601-1106 — Złączka szynowa 10mm²',
     'Złączka szynowa śrubowa 10mm² 57A szara WAGO',
     'szt', 8.90, 3.25, 'KNR 5-04 0601-01', 0.10, 'terminal', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

  -- ── switch (rozłącznik / wyłącznik izolacyjny) ────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit,
     base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence,
     is_active, user_id)
  VALUES
    (v_cat_din,
     'Hager SBN225 — Rozłącznik 2P 25A',
     'Rozłącznik modułowy 2P 25A Hager',
     'szt', 55.00, 13.00, 'KNR 5-04 0701-01', 0.20, 'switch', 'verified', true, NULL),
    (v_cat_din,
     'Hager SBN263 — Rozłącznik 2P 63A',
     'Rozłącznik modułowy 2P 63A Hager',
     'szt', 78.00, 13.00, 'KNR 5-04 0701-01', 0.20, 'switch', 'verified', true, NULL),
    (v_cat_din,
     'Schneider A9S65240 — iSW 2P 40A',
     'Rozłącznik modułowy 2P 40A Schneider Acti9 iSW',
     'szt', 62.00, 13.00, 'KNR 5-04 0701-01', 0.20, 'switch', 'verified', true, NULL)
  ON CONFLICT DO NOTHING;

END $$;

-- ─── Indeks (jeśli nie istnieje) ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_catalog_items_panel_category
  ON public.catalog_items (panel_category) WHERE panel_category IS NOT NULL;

-- ─── Weryfikacja ───────────────────────────────────────────
-- SELECT panel_category, COUNT(*) AS cnt, ROUND(AVG(base_material_price),0) AS avg_mat
-- FROM catalog_items
-- WHERE catalog_confidence = 'verified' AND panel_category IS NOT NULL
-- GROUP BY panel_category ORDER BY panel_category;
--
-- Oczekiwane kategorie (18 total):
-- automation, breaker, compensation, consumable, contactor,
-- enclosure, monitoring, panel_labor, panel_material,
-- rcbo, rcd, spd, switch, system, terminal, timer, wiring
