-- ════════════════════════════════════════════════════════════════════
-- Migration: smart_assembly_templates + smart_assembly_items
-- Smart Mapping Layer — Contextual Assembly Explosion tables
--
-- Purpose: Persistent store for assembly templates so admins can
-- audit and extend definitions without code changes.
-- The TypeScript engine (lib/ai/smart-mapping-engine.ts) is the
-- single source of truth at runtime; these tables mirror it.
-- ════════════════════════════════════════════════════════════════════

-- ─── Enum: project sector ───────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE project_sector AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Table: smart_assembly_templates ────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_assembly_templates (
  id             text PRIMARY KEY,                     -- e.g. "PUNKT_RESIDENTIAL_101"
  trigger_key    text NOT NULL,                        -- "PUNKT" | "PUNKT_3PHASE" | "BIALY_MONTAZ" | "WYPUST" | "TRASY"
  sector         project_sector NOT NULL,
  name           text NOT NULL,
  description    text NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── Table: smart_assembly_items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_assembly_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id           text NOT NULL REFERENCES smart_assembly_templates(id) ON DELETE CASCADE,
  sort_order            smallint NOT NULL DEFAULT 0,
  label                 text NOT NULL,
  knr_code              text NOT NULL,
  unit                  text NOT NULL,                 -- "mb" | "szt" | "kpl" | "m2"
  qty_multiplier        numeric(8,4) NOT NULL,         -- qty per 1 parent unit
  rbh_per_unit          numeric(8,4) NOT NULL,         -- base KNR labor norm r-g/unit
  is_labor              boolean NOT NULL DEFAULT true,
  material_price_per_unit numeric(10,2) NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sat_trigger_sector ON smart_assembly_templates(trigger_key, sector);
CREATE INDEX IF NOT EXISTS idx_sai_template      ON smart_assembly_items(template_id, sort_order);

-- ─── RLS ─────────────────────────────────────────────────────────────
ALTER TABLE smart_assembly_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_assembly_items     ENABLE ROW LEVEL SECURITY;

-- Public read (used by client-side expansion preview)
CREATE POLICY "smart_templates_read_all"
  ON smart_assembly_templates FOR SELECT USING (true);

CREATE POLICY "smart_items_read_all"
  ON smart_assembly_items FOR SELECT USING (true);

-- Admin write
CREATE POLICY "smart_templates_admin_write"
  ON smart_assembly_templates FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "smart_items_admin_write"
  ON smart_assembly_items FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Seed: Templates ─────────────────────────────────────────────────
INSERT INTO smart_assembly_templates (id, trigger_key, sector, name, description) VALUES
  -- PUNKT × 3 sectors
  ('PUNKT_RESIDENTIAL_101', 'PUNKT', 'RESIDENTIAL', 'Punkt instalacyjny — Mieszkanie',      'Bruzda w cegle/betonie + kabel YDYp 3×2.5mm² + puszka p/t + montaż urządzenia'),
  ('PUNKT_COMMERCIAL_102',  'PUNKT', 'COMMERCIAL',  'Punkt instalacyjny — Biuro/Usługi',    'Kabel YDYp 3×2.5mm² w korytku/gofre + puszka pod G-K + montaż urządzenia'),
  ('PUNKT_INDUSTRIAL_103',  'PUNKT', 'INDUSTRIAL',  'Punkt instalacyjny — Hala/Przemysł',   'Kabel YDYp 3×2.5mm² w rurze PVC + puszka natynkowa IP44 + montaż urządzenia'),
  -- PUNKT_3PHASE × 3 sectors
  ('PUNKT_3PHASE_RESIDENTIAL_201', 'PUNKT_3PHASE', 'RESIDENTIAL', 'Punkt 3-fazowy — Mieszkanie', 'Bruzda + kabel YDYp 5×2.5mm² + puszka głęboka p/t + gniazdo CEE 16A'),
  ('PUNKT_3PHASE_COMMERCIAL_202',  'PUNKT_3PHASE', 'COMMERCIAL',  'Punkt 3-fazowy — Biuro',      'Kabel YDYp 5×2.5mm² w korytku + puszka głęboka + gniazdo CEE 16A'),
  ('PUNKT_3PHASE_INDUSTRIAL_203',  'PUNKT_3PHASE', 'INDUSTRIAL',  'Punkt 3-fazowy — Hala',       'Rura stalowa EMT + kabel 5×2.5mm² + puszka IP54 + gniazdo CEE 32A'),
  -- BIALY_MONTAZ × 3 sectors
  ('BIALY_MONTAZ_RESIDENTIAL_301', 'BIALY_MONTAZ', 'RESIDENTIAL', 'Biały montaż — Mieszkanie', 'Tylko czysta robocizna montażu mechanizmu p/t'),
  ('BIALY_MONTAZ_COMMERCIAL_302',  'BIALY_MONTAZ', 'COMMERCIAL',  'Biały montaż — Biuro',      'Tylko czysta robocizna montażu urządzenia w zabudowie biurowej'),
  ('BIALY_MONTAZ_INDUSTRIAL_303',  'BIALY_MONTAZ', 'INDUSTRIAL',  'Biały montaż — Hala',       'Tylko czysta robocizna montażu urządzenia natynkowego IP44+'),
  -- WYPUST × 3 sectors
  ('WYPUST_RESIDENTIAL_401', 'WYPUST', 'RESIDENTIAL', 'Wypust kablowy — Mieszkanie', 'Bruzda + kabel YDYp 3×1.5mm² p/t (bez montażu urządzenia końcowego)'),
  ('WYPUST_COMMERCIAL_402',  'WYPUST', 'COMMERCIAL',  'Wypust kablowy — Biuro',      'Kabel YDYp 3×1.5mm² w korytku (bez montażu urządzenia końcowego)'),
  ('WYPUST_INDUSTRIAL_403',  'WYPUST', 'INDUSTRIAL',  'Wypust kablowy — Hala',       'Kabel YDYp 3×1.5mm² w rurze PVC karbowanej (bez urządzenia końcowego)'),
  -- TRASY × 3 sectors
  ('TRASY_RESIDENTIAL_501', 'TRASY', 'RESIDENTIAL', 'Trasa kablowa — Mieszkanie (bruzda)',       'Bruzdowanie ściany + układanie kabli p/t (per mb)'),
  ('TRASY_COMMERCIAL_502',  'TRASY', 'COMMERCIAL',  'Trasa kablowa — Biuro (korytko)',           'Montaż korytka kablowego PVC 60×60 + układanie kabli (per mb)'),
  ('TRASY_INDUSTRIAL_503',  'TRASY', 'INDUSTRIAL',  'Trasa kablowa — Hala (drabinka stalowa)',   'Drabinka kablowa stalowa 100mm + prowadzenie kabli (per mb)')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: Items for PUNKT_RESIDENTIAL_101 ───────────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('PUNKT_RESIDENTIAL_101', 1, 'Bruzdowanie ściany (cegła/beton)', 'KNR 4-01 0101-02', 'mb',  1.5, 0.10, true,  0.00),
  ('PUNKT_RESIDENTIAL_101', 2, 'Kabel YDYp 3×2.5mm²',             'KNR 5-08 0101-02', 'mb',  3.5, 0.16, false, 3.20),
  ('PUNKT_RESIDENTIAL_101', 3, 'Układanie kabla p/t',              'KNR 5-08 0201-01', 'mb',  3.5, 0.08, true,  0.00),
  ('PUNKT_RESIDENTIAL_101', 4, 'Puszka podtynkowa Ø60mm',          'KNR 5-08 0301-01', 'szt', 1.0, 0.15, false, 1.80),
  ('PUNKT_RESIDENTIAL_101', 5, 'Montaż urządzenia p/t',            'KNR 5-08 0401-03', 'szt', 1.0, 0.68, true,  0.00);

-- ─── Seed: Items for PUNKT_COMMERCIAL_102 ────────────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('PUNKT_COMMERCIAL_102', 1, 'Kabel YDYp 3×2.5mm²',          'KNR 5-08 0101-02', 'mb',  3.5, 0.16, false, 3.20),
  ('PUNKT_COMMERCIAL_102', 2, 'Układanie kabla w korytku',     'KNR 5-08 0202-01', 'mb',  3.5, 0.08, true,  0.00),
  ('PUNKT_COMMERCIAL_102', 3, 'Puszka podtynkowa pod G-K',     'KNR 5-08 0301-03', 'szt', 1.0, 0.18, false, 2.40),
  ('PUNKT_COMMERCIAL_102', 4, 'Montaż urządzenia (biuro/G-K)', 'KNR 5-08 0401-03', 'szt', 1.0, 0.68, true,  0.00);

-- ─── Seed: Items for PUNKT_INDUSTRIAL_103 ────────────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('PUNKT_INDUSTRIAL_103', 1, 'Kabel YDYp 3×2.5mm²',           'KNR 5-08 0101-02', 'mb',  3.5, 0.16, false, 3.20),
  ('PUNKT_INDUSTRIAL_103', 2, 'Rura karbowana PVC M20',         'KNR 5-08 0501-01', 'mb',  3.5, 0.07, false, 0.85),
  ('PUNKT_INDUSTRIAL_103', 3, 'Układanie rur + mocowania',      'KNR 5-08 0503-01', 'mb',  3.5, 0.05, true,  0.00),
  ('PUNKT_INDUSTRIAL_103', 4, 'Puszka natynkowa IP44',          'KNR 5-08 0301-04', 'szt', 1.0, 0.20, false, 5.50),
  ('PUNKT_INDUSTRIAL_103', 5, 'Montaż urządzenia natynk. IP44', 'KNR 5-08 0401-06', 'szt', 1.0, 0.54, true,  0.00);

-- ─── Seed: Items for PUNKT_3PHASE_RESIDENTIAL_201 ────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('PUNKT_3PHASE_RESIDENTIAL_201', 1, 'Bruzdowanie ściany (cegła/beton)',  'KNR 4-01 0101-02', 'mb',  4.5, 0.12, true,  0.00),
  ('PUNKT_3PHASE_RESIDENTIAL_201', 2, 'Kabel YDYp 5×2.5mm²',               'KNR 5-08 0101-04', 'mb',  4.5, 0.20, false, 5.80),
  ('PUNKT_3PHASE_RESIDENTIAL_201', 3, 'Układanie kabla p/t',                'KNR 5-08 0201-01', 'mb',  4.5, 0.08, true,  0.00),
  ('PUNKT_3PHASE_RESIDENTIAL_201', 4, 'Puszka podtynkowa głęboka',          'KNR 5-08 0301-02', 'szt', 1.0, 0.20, false, 3.20),
  ('PUNKT_3PHASE_RESIDENTIAL_201', 5, 'Gniazdo 3-faz CEE 16A p/t',          'KNR 5-08 0403-01', 'szt', 1.0, 1.18, true,  0.00);

-- ─── Seed: Items for BIALY_MONTAZ_RESIDENTIAL_301 ────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('BIALY_MONTAZ_RESIDENTIAL_301', 1, 'Montaż urządzenia p/t',            'KNR 5-08 0401-03', 'szt', 1.0, 0.68, true, 0.00),
  ('BIALY_MONTAZ_COMMERCIAL_302',  1, 'Montaż urządzenia (biuro/G-K)',    'KNR 5-08 0401-03', 'szt', 1.0, 0.68, true, 0.00),
  ('BIALY_MONTAZ_INDUSTRIAL_303',  1, 'Montaż urządzenia natynk. IP44',   'KNR 5-08 0401-06', 'szt', 1.0, 0.54, true, 0.00);

-- ─── Seed: Items for WYPUST templates ────────────────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('WYPUST_RESIDENTIAL_401', 1, 'Bruzdowanie ściany (cegła/beton)', 'KNR 4-01 0101-02', 'mb', 1.5, 0.10, true,  0.00),
  ('WYPUST_RESIDENTIAL_401', 2, 'Kabel YDYp 3×1.5mm²',              'KNR 5-08 0101-01', 'mb', 3.5, 0.13, false, 2.20),
  ('WYPUST_RESIDENTIAL_401', 3, 'Układanie kabla p/t',               'KNR 5-08 0201-01', 'mb', 3.5, 0.08, true,  0.00),
  ('WYPUST_COMMERCIAL_402',  1, 'Kabel YDYp 3×1.5mm²',              'KNR 5-08 0101-01', 'mb', 3.5, 0.13, false, 2.20),
  ('WYPUST_COMMERCIAL_402',  2, 'Układanie kabla w korytku',         'KNR 5-08 0202-01', 'mb', 3.5, 0.08, true,  0.00),
  ('WYPUST_INDUSTRIAL_403',  1, 'Kabel YDYp 3×1.5mm²',              'KNR 5-08 0101-01', 'mb', 3.5, 0.13, false, 2.20),
  ('WYPUST_INDUSTRIAL_403',  2, 'Rura karbowana PVC M20',            'KNR 5-08 0501-01', 'mb', 3.5, 0.07, false, 0.85),
  ('WYPUST_INDUSTRIAL_403',  3, 'Układanie rur + mocowania',         'KNR 5-08 0503-01', 'mb', 3.5, 0.05, true,  0.00);

-- ─── Seed: Items for TRASY templates ─────────────────────────────────
INSERT INTO smart_assembly_items (template_id, sort_order, label, knr_code, unit, qty_multiplier, rbh_per_unit, is_labor, material_price_per_unit) VALUES
  ('TRASY_RESIDENTIAL_501', 1, 'Bruzdowanie ściany (cegła/beton)', 'KNR 4-01 0101-02', 'mb', 1.0, 0.10, true,  0.00),
  ('TRASY_RESIDENTIAL_501', 2, 'Układanie kabla p/t',               'KNR 5-08 0201-01', 'mb', 1.0, 0.08, true,  0.00),
  ('TRASY_COMMERCIAL_502',  1, 'Korytko kablowe PVC 60×60',         'KNR 5-08 0601-02', 'mb', 1.0, 0.12, false, 12.50),
  ('TRASY_COMMERCIAL_502',  2, 'Montaż korytka',                    'KNR 5-08 0601-01', 'mb', 1.0, 0.12, true,  0.00),
  ('TRASY_COMMERCIAL_502',  3, 'Układanie kabla w korytku',         'KNR 5-08 0202-01', 'mb', 1.0, 0.08, true,  0.00),
  ('TRASY_INDUSTRIAL_503',  1, 'Drabinka kablowa stalowa 100mm',    'KNR 5-08 0602-02', 'mb', 1.0, 0.18, false, 22.00),
  ('TRASY_INDUSTRIAL_503',  2, 'Montaż drabinki kablowej',          'KNR 5-08 0602-01', 'mb', 1.0, 0.18, true,  0.00),
  ('TRASY_INDUSTRIAL_503',  3, 'Prowadzenie/układanie kabla',       'KNR 5-08 0203-01', 'mb', 1.0, 0.07, true,  0.00);

-- ─── Updated_at trigger ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_smart_assembly_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_sat_updated_at ON smart_assembly_templates;
CREATE TRIGGER trg_sat_updated_at
  BEFORE UPDATE ON smart_assembly_templates
  FOR EACH ROW EXECUTE FUNCTION update_smart_assembly_templates_updated_at();
