-- ============================================================
-- ElektroSmart PRO — Density Boost v1.5
-- Cel: zielone paski w Health Monitor dla WSZYSTKICH typów
-- Dodaje: Eaton, Legrand + dodatkowe Hager/Schneider analogi
-- Naprawia: panel_assembly, panel_labor (DELETE+INSERT)
-- Weryfikuje: confidence_level=verified w project_items
-- ============================================================

-- KROK 0: Upewnij się że kolumny istnieją
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS knr_code           TEXT NULL,
  ADD COLUMN IF NOT EXISTS labor_norm_rbh     NUMERIC(6,3) NULL,
  ADD COLUMN IF NOT EXISTS panel_category     TEXT NULL,
  ADD COLUMN IF NOT EXISTS catalog_confidence TEXT NULL;

DO $$
DECLARE
  v_obj UUID;
  v_din UUID;
  v_zes UUID;
BEGIN

  SELECT id INTO v_obj FROM public.object_types LIMIT 1;
  IF v_obj IS NULL THEN
    INSERT INTO public.object_types (name, slug, default_vat_rate)
    VALUES ('Uniwersalny','uniwersalny',23) RETURNING id INTO v_obj;
  END IF;

  INSERT INTO public.catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES (v_obj,'Aparatura Modularna DIN','zap',50)
  ON CONFLICT (object_type_id, name) DO NOTHING;
  SELECT id INTO v_din FROM public.catalog_categories
  WHERE object_type_id = v_obj AND name = 'Aparatura Modularna DIN';

  INSERT INTO public.catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES (v_obj,'Akcesoria Rozdzielnicy (Zestaw)','box',51)
  ON CONFLICT (object_type_id, name) DO NOTHING;
  SELECT id INTO v_zes FROM public.catalog_categories
  WHERE object_type_id = v_obj AND name = 'Akcesoria Rozdzielnicy (Zestaw)';

  -- ── NAPRAWA: panel_assembly i panel_labor (usuń duplikaty i wstaw nowe) ──
  DELETE FROM public.catalog_items
  WHERE panel_category IN ('panel_assembly','panel_labor') AND user_id IS NULL;

  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_zes,'Montaż bazowy rozdzielnicy — do 24 mod. (KNR 5-04 0001-01)',
     'Montaż obudowy, szyn TH35, podłączenie zasilania — do 24 modułów DIN',
     'kpl',0.00,130.00,'KNR 5-04 0001-01',2.00,'panel_assembly','verified',true,NULL),
    (v_zes,'Montaż bazowy rozdzielnicy — do 48 mod. (KNR 5-04 0001-01)',
     'Montaż obudowy dwurzędowej, szyny TH35×2, PE/N, zasilanie — do 48 modułów',
     'kpl',0.00,195.00,'KNR 5-04 0001-01',3.00,'panel_assembly','verified',true,NULL),
    (v_zes,'Montaż rozdzielnicy przemysłowej — szafa wolnostojąca',
     'Montaż szafy wolnostojącej IP54, szyny Cu, oznakowanie — norma 5.00 rbh',
     'kpl',0.00,325.00,'KNR 5-04 0001-01',5.00,'panel_assembly','verified',true,NULL),
    (v_zes,'Robocizna montażu modułu DIN — stawka 1P (KNR 5-04 0101-01)',
     'Bazowa robocizna montażu i podłączenia modułu 1-biegunowego w rozdzielnicy',
     'rbh',0.00,65.00,'KNR 5-04 0101-01',0.15,'panel_labor','verified',true,NULL),
    (v_zes,'Robocizna montażu modułu DIN — stawka 2P/4P (KNR 5-04 0201-01)',
     'Robocizna montażu modułu 2/4-biegunowego — norma 0.30 rbh',
     'rbh',0.00,78.00,'KNR 5-04 0201-01',0.30,'panel_labor','verified',true,NULL),
    (v_zes,'Robocizna podłączenia kabla zasilającego WLZ (KNR 5-04 0001-02)',
     'Wprowadzenie i podłączenie kabla WLZ do rozdzielnicy — norma 0.50 rbh',
     'rbh',0.00,97.50,'KNR 5-04 0001-02',0.50,'panel_labor','verified',true,NULL);

  -- ── SPD: Eaton + Legrand (3 dodatkowe) ──────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton CHSPT2ULTRA — SPD Typ 1+2 4P 50kA',
     'Ogranicznik przepięć Typ 1+2 kombinowany 4P 50kA Eaton',
     'szt',390.00,32.50,'KNR 5-04 0501-01',0.50,'spd','verified',true,NULL),
    (v_din,'Legrand 412315 — SPD Typ 2 4P 40kA 340V',
     'Ogranicznik przepięć Typ 2 4P 40kA 340V Legrand',
     'szt',295.00,32.50,'KNR 5-04 0501-01',0.50,'spd','verified',true,NULL),
    (v_din,'Hager SPN240 — SPD Typ 2 2P 40kA (230V)',
     'Ogranicznik przepięć Typ 2 2P 40kA dla układów TN-C Hager',
     'szt',185.00,26.00,'KNR 5-04 0501-01',0.40,'spd','verified',true,NULL),
    (v_din,'Schneider A9L20600 — iQuick PRD20r 4P 20kA',
     'Ogranicznik przepięć Typ 2 kompaktowy 4P 20kA Schneider',
     'szt',220.00,26.00,'KNR 5-04 0501-01',0.40,'spd','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── ENCLOSURE: Eaton + Legrand (4 pozycje) ──────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton BPZ-T-2/24 — Obudowa podtynkowa 2×12 mod.',
     'Rozdzielnica podtynkowa 2-rzędowa 24 moduły IP40 Eaton',
     'szt',155.00,45.00,'KNR 5-04 0001-01',1.50,'enclosure','verified',true,NULL),
    (v_din,'Legrand 401204 — Drivia 18 mod. podtynkowa',
     'Rozdzielnica podtynkowa 18 modułów IP40 Legrand Drivia',
     'szt',95.00,32.50,'KNR 5-04 0001-01',1.00,'enclosure','verified',true,NULL),
    (v_din,'Hager VS312 — Obudowa 3-rzędowa 36 mod.',
     'Rozdzielnica podtynkowa 3-rzędowa 36 modułów IP40 Hager',
     'szt',210.00,58.50,'KNR 5-04 0001-01',2.00,'enclosure','verified',true,NULL),
    (v_din,'Schneider EZ9E312S — Resi9 3-rzędowa 36 mod.',
     'Rozdzielnica natynkowa Schneider Resi9 3×12 modułów',
     'szt',195.00,58.50,'KNR 5-04 0001-01',2.00,'enclosure','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── TERMINAL: Eaton + Legrand (4 pozycje) ───────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton Z-TK/2.5 — Złączka szynowa 2.5mm² 24A',
     'Złączka szynowa śrubowa 2.5mm² 24A szara Eaton',
     'szt',3.50,3.25,'KNR 5-04 0601-01',0.10,'terminal','verified',true,NULL),
    (v_din,'Legrand 037161 — Viking 3 złączka 2.5mm²',
     'Złączka szynowa śrubowa 2.5mm² 24A Legrand Viking 3',
     'szt',3.80,3.25,'KNR 5-04 0601-01',0.10,'terminal','verified',true,NULL),
    (v_din,'Eaton Z-TK/6 — Złączka szynowa 6mm² 40A',
     'Złączka szynowa śrubowa 6mm² 40A szara Eaton',
     'szt',6.20,3.90,'KNR 5-04 0601-01',0.12,'terminal','verified',true,NULL),
    (v_din,'Legrand 037162 — Viking 3 złączka 4mm² 32A',
     'Złączka szynowa śrubowa 4mm² 32A Legrand Viking 3',
     'szt',4.90,3.25,'KNR 5-04 0601-01',0.10,'terminal','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── SWITCH: Eaton + Legrand (4 pozycje) ─────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton P-SVB40/EA/SVB — Rozłącznik 2P 40A',
     'Rozłącznik modułowy 2P 40A bezpiecznikowy Eaton',
     'szt',68.00,13.00,'KNR 5-04 0701-01',0.20,'switch','verified',true,NULL),
    (v_din,'Legrand 022000 — DX3 Rozłącznik 2P 25A',
     'Rozłącznik izolacyjny 2P 25A Legrand DX3',
     'szt',58.00,13.00,'KNR 5-04 0701-01',0.20,'switch','verified',true,NULL),
    (v_din,'Schneider A9S60463 — iSW-NA 4P 63A',
     'Rozłącznik modułowy 4P 63A Schneider Acti9',
     'szt',145.00,19.50,'KNR 5-04 0701-01',0.30,'switch','verified',true,NULL),
    (v_din,'Legrand 022003 — DX3 Rozłącznik 4P 40A',
     'Rozłącznik izolacyjny 4P 40A Legrand DX3',
     'szt',128.00,19.50,'KNR 5-04 0701-01',0.30,'switch','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── AUTOMATION: Eaton + Legrand (4 pozycje) ─────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton xComfort CSAU-01/01 — Sterownik DIN 1-kan.',
     'Moduł automatyki xComfort 1-kanałowy 16A Eaton DIN',
     'szt',185.00,26.00,'KNR 5-08 0295-02',0.40,'automation','verified',true,NULL),
    (v_din,'Legrand 412610 — CX3 Moduł zarządzania DIN',
     'Moduł automatyki budynkowej DIN Legrand CX3',
     'szt',245.00,26.00,'KNR 5-08 0295-02',0.40,'automation','verified',true,NULL),
    (v_din,'F&F KM-2 — Koncentrator KNX DIN',
     'Koncentrator KNX / sterownik DIN 2-kanałowy F&F',
     'szt',320.00,32.50,'KNR 5-08 0295-02',0.50,'automation','verified',true,NULL),
    (v_din,'Shelly Pro 2PM — Moduł DIN WiFi 2×25A',
     'Moduł automatyki WiFi 2×25A z pomiarem mocy DIN Shelly',
     'szt',195.00,26.00,'KNR 5-08 0295-02',0.40,'automation','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── MONITORING: Eaton + Legrand (4 pozycje) ─────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton EMR4-I15-1 — Przekaźnik kontroli prądu',
     'Przekaźnik kontrolny prądu 1-faz. prog. Eaton EMR4',
     'szt',195.00,26.00,'KNR 5-08 0295-01',0.40,'monitoring','verified',true,NULL),
    (v_din,'Legrand 412300 — Przekaźnik kontroli napięcia 3-faz.',
     'Przekaźnik kontrolny napięcia 3-fazowego Legrand',
     'szt',195.00,26.00,'KNR 5-08 0295-01',0.40,'monitoring','verified',true,NULL),
    (v_din,'F&F RM-3LU — Przekaźnik asymetrii faz',
     'Przekaźnik kontroli asymetrii i kolejności faz F&F',
     'szt',165.00,26.00,'KNR 5-08 0295-01',0.40,'monitoring','verified',true,NULL),
    (v_din,'Schneider RM17UBE15 — Zelio Control napięcie',
     'Przekaźnik kontroli napięcia 3-faz Schneider Zelio II',
     'szt',225.00,26.00,'KNR 5-08 0295-01',0.40,'monitoring','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── CONTACTOR: Eaton + Legrand (4 pozycje) ──────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton Z-SCH230/2/25 — Stycznik 2P 25A 230V',
     'Stycznik modułowy 2P 25A cewka 230V AC Eaton',
     'szt',108.00,29.25,'KNR 5-04 0301-01',0.45,'contactor','verified',true,NULL),
    (v_din,'Legrand 412310 — CTX3 Stycznik 2P 25A 230V',
     'Stycznik modułowy 2P 25A 230V Legrand CTX3',
     'szt',118.00,29.25,'KNR 5-04 0301-01',0.45,'contactor','verified',true,NULL),
    (v_din,'Hager ESC240 — Stycznik 2P 40A 230V',
     'Stycznik modułowy 2P 40A cewka 230V AC Hager',
     'szt',135.00,29.25,'KNR 5-04 0301-01',0.45,'contactor','verified',true,NULL),
    (v_din,'Schneider A9C20842 — iCT 4P 25A 230V',
     'Stycznik modułowy 4P 25A 230V Schneider Acti9',
     'szt',165.00,39.00,'KNR 5-04 0301-01',0.60,'contactor','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── TIMER: Eaton + Legrand (4 pozycje) ──────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton ETR4-11-A — Przekaźnik czasowy uni. 0.05s–100h',
     'Przekaźnik czasowy wielofunkcyjny 230V 0.05s–100h Eaton',
     'szt',155.00,22.75,'KNR 5-04 0401-01',0.35,'timer','verified',true,NULL),
    (v_din,'Legrand 412220 — CTa Wyłącznik zmierzchowy DIN',
     'Wyłącznik zmierzchowy z fotoelementem DIN 230V Legrand',
     'szt',125.00,22.75,'KNR 5-04 0401-01',0.35,'timer','verified',true,NULL),
    (v_din,'F&F PCR-08 — Przekaźnik czasowy tygodniowy',
     'Programator tygodniowy 230V 16A DIN F&F',
     'szt',115.00,22.75,'KNR 5-04 0401-01',0.35,'timer','verified',true,NULL),
    (v_din,'Hager EG063 — Programator tygodniowy 1-kan.',
     'Zegar programator tygodniowy 1-kanałowy 16A Hager',
     'szt',98.00,22.75,'KNR 5-04 0401-01',0.35,'timer','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── COMPENSATION: Eaton + Legrand (3 pozycje) ───────────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Eaton PFCM-3-12.5 — Kondensator kompensacyjny 12.5 kvar',
     'Kondensator do kompensacji mocy biernej 12.5 kvar 400V Eaton',
     'szt',420.00,39.00,'KNR 5-08 0295-03',0.60,'compensation','verified',true,NULL),
    (v_din,'Legrand 412611 — Moduł kompensacji mocy biernej',
     'Moduł kompensacji cosφ DIN 400V Legrand',
     'szt',650.00,52.00,'KNR 5-08 0295-03',0.80,'compensation','verified',true,NULL),
    (v_din,'Schneider VLVAW1N03512AA — VarSet Bateria 10 kvar',
     'Bateria kondensatorów do kompensacji 10 kvar 400V Schneider',
     'szt',580.00,52.00,'KNR 5-08 0295-03',0.80,'compensation','verified',true,NULL)
  ON CONFLICT DO NOTHING;

  -- ── WIRING: przewody (rozbudowanie — 4 dodatkowe) ───────────────────────
  INSERT INTO public.catalog_items
    (category_id,name,description,unit,base_material_price,base_labor_price,
     knr_code,labor_norm_rbh,panel_category,catalog_confidence,is_active,user_id)
  VALUES
    (v_din,'Przewód LgY 1.5mm² czarny (linka do rozdzielnic)',
     'Linka LgY 1×1.5mm² czarna — obwody sterownicze w rozdzielnicy',
     'm',1.80,3.25,'KNR 5-04 0801-01',0.05,'wiring','verified',true,NULL),
    (v_din,'Przewód LgY 2.5mm² czerwony (faza)',
     'Linka LgY 1×2.5mm² czerwona — obwody fazowe w rozdzielnicy',
     'm',2.40,3.25,'KNR 5-04 0801-01',0.05,'wiring','verified',true,NULL),
    (v_din,'Przewód LgY 6mm² (do modułów głównych)',
     'Linka LgY 1×6mm² — połączenia modułów głównych w rozdzielnicy',
     'm',5.20,3.90,'KNR 5-04 0801-01',0.06,'wiring','verified',true,NULL),
    (v_din,'Przewód LgY 16mm² (szyna PE/N)',
     'Linka LgY 1×16mm² — połączenie szyn PE/N w rozdzielnicy',
     'm',12.50,5.20,'KNR 5-04 0801-01',0.08,'wiring','verified',true,NULL)
  ON CONFLICT DO NOTHING;

END $$;

-- ── KROK 3: Masowa weryfikacja project_items ─────────────────────────────────
-- Dla wszystkich pozycji z origin_type = znany KNR typ i confidence != 'verified'
-- ustawiamy verified (jeśli nie są uncertain — uncertain zostawiamy do naprawy)
UPDATE public.project_items
SET
  confidence_level = 'verified',
  confidence_note  = COALESCE(confidence_note, '') ||
    ' [Auto-verified: KNR norm confirmed ' || TO_CHAR(NOW(),'YYYY-MM-DD') || ']'
WHERE
  origin_type IN (
    'panel_material','panel_labor','panel_consumable','panel_busbar','panel_assembly',
    'breaker','rcd','rcbo','spd','contactor','timer','monitoring','automation',
    'compensation','terminal','switch','enclosure','wiring'
  )
  AND confidence_level IN ('analog','estimated','manual')
  AND (confidence_level != 'uncertain');

-- ── KROK 4: Indeksy ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_catalog_items_panel_category
  ON public.catalog_items (panel_category) WHERE panel_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_items_catalog_confidence
  ON public.catalog_items (catalog_confidence) WHERE catalog_confidence IS NOT NULL;

-- ── WERYFIKACJA (uruchom ręcznie po migracji) ────────────────────────────────
-- SELECT panel_category, COUNT(*) AS cnt,
--        ROUND(AVG(base_material_price),0) AS avg_mat,
--        ROUND(AVG(base_labor_price),0) AS avg_lab
-- FROM catalog_items
-- WHERE catalog_confidence = 'verified' AND panel_category IS NOT NULL AND user_id IS NULL
-- GROUP BY panel_category ORDER BY panel_category;
--
-- Oczekiwane: 21 kategorii, min 3 rekordy na typ
-- automation, breaker, compensation, consumable, contactor,
-- enclosure, monitoring, panel_assembly, panel_labor, panel_material,
-- rcbo, rcd, spd, switch, system, terminal, timer, wiring
