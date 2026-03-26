-- ============================================================
-- ElektroSmart PRO — Aparatura Modularna DIN v1.5
-- Ekspertowy katalog: Hager + Schneider, MCB/RCD/RCBO/SPD
-- KNR 5-04
-- ============================================================
-- TABELA DOCELOWA: public.catalog_items
-- (user_id = NULL → pozycja globalna, widoczna dla wszystkich)
--
-- UWAGA: confidence_level na catalog_items jest typem ENUM
--        confidence_level_enum ('low','medium','high') — Market Intelligence.
--        NIE jest to samo co confidence na project_items ('verified' itd).
--        Dlatego używamy osobnej kolumny: catalog_confidence TEXT.
-- ============================================================

-- ─── KROK 1: Nowe kolumny KNR na catalog_items ─────────────

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS knr_code          TEXT NULL,
  ADD COLUMN IF NOT EXISTS labor_norm_rbh    NUMERIC(6,3) NULL,
  ADD COLUMN IF NOT EXISTS panel_category    TEXT NULL,
  ADD COLUMN IF NOT EXISTS catalog_confidence TEXT NULL;

ALTER TABLE public.catalog_items
  DROP CONSTRAINT IF EXISTS chk_catalog_catalog_confidence;
ALTER TABLE public.catalog_items
  ADD CONSTRAINT chk_catalog_catalog_confidence
  CHECK (catalog_confidence IS NULL OR catalog_confidence IN
    ('verified','analog','estimated','uncertain','manual'));

-- ─── KROK 2-4: Kategorie + Seed ────────────────────────────

DO $$
DECLARE
  v_obj_type_id UUID;
  v_cat_din     UUID;
  v_cat_zestaw  UUID;
BEGIN

  SELECT id INTO v_obj_type_id FROM public.object_types LIMIT 1;
  IF v_obj_type_id IS NULL THEN
    INSERT INTO public.object_types (name, slug, default_vat_rate)
    VALUES ('Uniwersalny', 'uniwersalny', 23)
    RETURNING id INTO v_obj_type_id;
  END IF;

  INSERT INTO public.catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES (v_obj_type_id, 'Aparatura Modularna DIN', 'zap', 50)
  ON CONFLICT (object_type_id, name) DO NOTHING;
  SELECT id INTO v_cat_din FROM public.catalog_categories
  WHERE object_type_id = v_obj_type_id AND name = 'Aparatura Modularna DIN';

  INSERT INTO public.catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES (v_obj_type_id, 'Akcesoria Rozdzielnicy (Zestaw)', 'box', 51)
  ON CONFLICT (object_type_id, name) DO NOTHING;
  SELECT id INTO v_cat_zestaw FROM public.catalog_categories
  WHERE object_type_id = v_obj_type_id AND name = 'Akcesoria Rozdzielnicy (Zestaw)';

  -- ── MCB HAGER 1P ──────────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din,'Hager MBN116 — MCB 1P B16 6kA','Wyłącznik nadprądowy 1P B16 6kA Hager','szt',28.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MBN120 — MCB 1P B20 6kA','Wyłącznik nadprądowy 1P B20 6kA Hager','szt',29.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MBN125 — MCB 1P B25 6kA','Wyłącznik nadprądowy 1P B25 6kA Hager','szt',30.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MBN132 — MCB 1P B32 6kA','Wyłącznik nadprądowy 1P B32 6kA Hager','szt',32.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MCN116 — MCB 1P C16 6kA','Wyłącznik nadprądowy 1P C16 6kA Hager','szt',28.50,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MCN120 — MCB 1P C20 6kA','Wyłącznik nadprądowy 1P C20 6kA Hager','szt',29.50,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MCN132 — MCB 1P C32 6kA','Wyłącznik nadprądowy 1P C32 6kA Hager','szt',33.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    -- MCB HAGER 3P
    (v_cat_din,'Hager MBN316 — MCB 3P B16 6kA','Wyłącznik nadprądowy 3P B16 6kA Hager','szt',89.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MBN320 — MCB 3P B20 6kA','Wyłącznik nadprądowy 3P B20 6kA Hager','szt',92.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MBN325 — MCB 3P B25 6kA','Wyłącznik nadprądowy 3P B25 6kA Hager','szt',95.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MCN332 — MCB 3P C32 6kA','Wyłącznik nadprądowy 3P C32 6kA Hager','szt',98.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    (v_cat_din,'Hager MCN363 — MCB 3P C63 6kA','Wyłącznik nadprądowy 3P C63 6kA Hager','szt',145.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    -- MCB SCHNEIDER 1P
    (v_cat_din,'Schneider A9F74116 — Acti9 iC60N 1P C16 6kA','Wyłącznik 1P C16 6kA Schneider Acti9','szt',32.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider A9F74120 — Acti9 iC60N 1P C20 6kA','Wyłącznik 1P C20 6kA Schneider Acti9','szt',33.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider A9F74132 — Acti9 iC60N 1P C32 6kA','Wyłącznik 1P C32 6kA Schneider Acti9','szt',36.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider R9F12616 — Resi9 1P B16 6kA','Wyłącznik 1P B16 6kA Schneider Resi9','szt',22.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider R9F12620 — Resi9 1P B20 6kA','Wyłącznik 1P B20 6kA Schneider Resi9','szt',23.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider R9F12632 — Resi9 1P B32 6kA','Wyłącznik 1P B32 6kA Schneider Resi9','szt',25.00,9.75,'KNR 5-04 0101-01',0.15,'breaker','verified',true,NULL),
    -- MCB SCHNEIDER 3P
    (v_cat_din,'Schneider A9F74316 — Acti9 iC60N 3P C16 6kA','Wyłącznik 3P C16 6kA Schneider Acti9','szt',95.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider A9F74332 — Acti9 iC60N 3P C32 6kA','Wyłącznik 3P C32 6kA Schneider Acti9','szt',105.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL),
    (v_cat_din,'Schneider A9F74363 — Acti9 iC60N 3P C63 6kA','Wyłącznik 3P C63 6kA Schneider Acti9','szt',155.00,22.75,'KNR 5-04 0103-01',0.35,'breaker','verified',true,NULL);

  -- ── RCD HAGER + SCHNEIDER ─────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din,'Hager CDC225F — RCD 2P 25A 30mA Typ-AC','Wyłącznik różnicowoprądowy 2P 25A 30mA typ AC Hager','szt',68.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Hager CDC240F — RCD 2P 40A 30mA Typ-AC','Wyłącznik różnicowoprądowy 2P 40A 30mA typ AC Hager','szt',72.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Hager CDC225D — RCD 2P 25A 30mA Typ-A','Wyłącznik różnicowoprądowy 2P 25A 30mA typ A Hager','szt',89.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Hager CDC240D — RCD 2P 40A 30mA Typ-A','Wyłącznik różnicowoprądowy 2P 40A 30mA typ A Hager','szt',95.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Hager CFC425F — RCD 4P 25A 30mA Typ-AC','Wyłącznik różnicowoprądowy 4P 25A 30mA Hager','szt',145.00,29.25,'KNR 5-04 0203-01',0.45,'rcd','verified',true,NULL),
    (v_cat_din,'Hager CFC440F — RCD 4P 40A 30mA Typ-AC','Wyłącznik różnicowoprądowy 4P 40A 30mA Hager','szt',155.00,29.25,'KNR 5-04 0203-01',0.45,'rcd','verified',true,NULL),
    (v_cat_din,'Hager CFC440D — RCD 4P 40A 30mA Typ-A','Wyłącznik różnicowoprądowy 4P 40A 30mA typ A Hager','szt',190.00,29.25,'KNR 5-04 0203-01',0.45,'rcd','verified',true,NULL),
    (v_cat_din,'Schneider A9R14225 — iID 2P 25A 30mA Typ-AC','Wyłącznik różnicowoprądowy 2P 25A 30mA Schneider iID','szt',75.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Schneider A9R14240 — iID 2P 40A 30mA Typ-AC','Wyłącznik różnicowoprądowy 2P 40A 30mA Schneider iID','szt',79.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Schneider A9R14440 — iID 4P 40A 30mA Typ-AC','Wyłącznik różnicowoprądowy 4P 40A 30mA Schneider iID','szt',165.00,29.25,'KNR 5-04 0203-01',0.45,'rcd','verified',true,NULL),
    (v_cat_din,'Schneider A9R21225 — Resi9 RCD 2P 25A 30mA Typ-A','Wyłącznik RCD 2P 25A 30mA typ A Schneider Resi9','szt',92.00,19.50,'KNR 5-04 0201-01',0.30,'rcd','verified',true,NULL),
    (v_cat_din,'Schneider A9R21440 — Resi9 RCD 4P 40A 30mA Typ-A','Wyłącznik RCD 4P 40A 30mA typ A Schneider Resi9','szt',198.00,29.25,'KNR 5-04 0203-01',0.45,'rcd','verified',true,NULL);

  -- ── RCBO HAGER + SCHNEIDER ────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din,'Hager ADN116 — RCBO 1P B16 30mA 6kA','Kombiautomat 1P B16 30mA 6kA Hager ADN','szt',72.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Hager ADN120 — RCBO 1P B20 30mA 6kA','Kombiautomat 1P B20 30mA 6kA Hager ADN','szt',74.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Hager ADN125 — RCBO 1P B25 30mA 6kA','Kombiautomat 1P B25 30mA 6kA Hager ADN','szt',76.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Hager ADN132 — RCBO 1P B32 30mA 6kA','Kombiautomat 1P B32 30mA 6kA Hager ADN','szt',79.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Hager ACN116 — RCBO 1P C16 30mA 6kA','Kombiautomat 1P C16 30mA 6kA Hager ACN','szt',73.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Hager ACN120 — RCBO 1P C20 30mA 6kA','Kombiautomat 1P C20 30mA 6kA Hager ACN','szt',75.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Hager ACN132 — RCBO 1P C32 30mA 6kA','Kombiautomat 1P C32 30mA 6kA Hager ACN','szt',80.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Schneider A9D31616 — Acti9 iDPNN 1P+N B16 30mA','Kombiautomat 1P+N B16 30mA Schneider iDPNN','szt',88.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Schneider A9D31620 — Acti9 iDPNN 1P+N B20 30mA','Kombiautomat 1P+N B20 30mA Schneider iDPNN','szt',90.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Schneider A9D31625 — Acti9 iDPNN 1P+N B25 30mA','Kombiautomat 1P+N B25 30mA Schneider iDPNN','szt',93.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Schneider A9D31632 — Acti9 iDPNN 1P+N B32 30mA','Kombiautomat 1P+N B32 30mA Schneider iDPNN','szt',97.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Schneider R9D31616 — Resi9 1P+N B16 30mA','Kombiautomat 1P+N B16 30mA Schneider Resi9','szt',82.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL),
    (v_cat_din,'Schneider R9D31632 — Resi9 1P+N B32 30mA','Kombiautomat 1P+N B32 30mA Schneider Resi9','szt',88.00,13.00,'KNR 5-04 0201-02',0.20,'rcbo','verified',true,NULL);

  -- ── SPD ───────────────────────────────────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_din,'Hager SPN440 — SPD Typ 2 4P 40kA','Ogranicznik przepięć Typ 2 4P 40kA Hager','szt',320.00,32.50,'KNR 5-04 0501-01',0.50,'spd','verified',true,NULL),
    (v_cat_din,'Hager SPM440 — SPD Typ 1+2 4P 75kA','Ogranicznik przepięć Typ 1+2 4P 75kA Hager','szt',580.00,32.50,'KNR 5-04 0501-01',0.50,'spd','verified',true,NULL),
    (v_cat_din,'Schneider A9L40400 — iQuick PRD40r 4P 40kA','Ogranicznik przepięć Typ 2 4P 40kA Schneider','szt',340.00,32.50,'KNR 5-04 0501-01',0.50,'spd','verified',true,NULL),
    (v_cat_din,'Schneider A9L16294 — iPRD-DC 600V PV','Ogranicznik przepięć DC 600V PV Schneider','szt',420.00,32.50,'KNR 5-04 0501-01',0.50,'spd','verified',true,NULL);

  -- ── ZESTAWY — Akcesoria rozdzielnicy ─────────────────────
  INSERT INTO public.catalog_items
    (category_id, name, description, unit, base_material_price, base_labor_price,
     knr_code, labor_norm_rbh, panel_category, catalog_confidence, is_active, user_id)
  VALUES
    (v_cat_zestaw,'Tulejki i materiały pomocnicze (kpl.)','Tulejki kablowe, opaski, drobne materiały montażowe','kpl',2.50,0.00,'KNR 5-04 0901-01',0.00,'consumable','verified',true,NULL),
    (v_cat_zestaw,'Oznakowanie pola w rozdzielnicy','Etykiety, oznaczniki faz, opis obwodów','szt',1.20,0.00,'KNR 5-04 0901-02',0.00,'consumable','verified',true,NULL),
    (v_cat_zestaw,'Szyna łączeniowa 12-mod. (udział)','Szyna grzebieniowa TH35 — udział 1 biegun','szt',3.75,0.00,'KNR 5-04 0902-01',0.00,'consumable','verified',true,NULL),
    (v_cat_zestaw,'Montaż i podłączenie rozdzielnicy (KNR 5-04)','Bazowa praca montażu obudowy i szyn — 2.0 rbh','kpl',0.00,130.00,'KNR 5-04 0001-01',2.00,'system','verified',true,NULL),
    (v_cat_zestaw,'Szyna TH35 aluminiowa 1m','Szyna montażowa dla modułów DIN','m',12.00,5.00,'KNR 5-04 0903-01',0.08,'consumable','verified',true,NULL),
    (v_cat_zestaw,'Przewód PV-3 1.5mm² (obwód sterowniczy)','Przewód do obwodów sterowniczych wewnątrz rozdzielnicy','m',2.80,3.50,'KNR 5-04 0801-01',0.05,'wiring','verified',true,NULL);

END $$;

-- ─── Indeksy ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_catalog_items_knr_code
  ON public.catalog_items (knr_code) WHERE knr_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_items_panel_category
  ON public.catalog_items (panel_category) WHERE panel_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_items_catalog_confidence
  ON public.catalog_items (catalog_confidence) WHERE catalog_confidence IS NOT NULL;

-- ─── Weryfikacja ───────────────────────────────────────────
-- SELECT panel_category, COUNT(*), ROUND(AVG(base_material_price),0) AS avg_mat
-- FROM catalog_items
-- WHERE catalog_confidence = 'verified' AND panel_category IS NOT NULL
-- GROUP BY panel_category ORDER BY panel_category;
