-- Sprint v1.2: UI Modifiers + Equipment ("S") Category + D3 Synonym
-- Apply to: TEST (upwctgdpuckreoquofiu) + LIVE (jbxveulddoznswyeihda)

-- ────────────────────────────────────────────────────────────────────
-- 1. Profiles: persist KNR difficulty coefficient toggles
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coeff_height     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coeff_difficulty boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coeff_surface    boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.coeff_height     IS 'Praca na wysokości >3m: ×1.25 dla robocizny (KNR 5-08 r.1.3)';
COMMENT ON COLUMN profiles.coeff_difficulty IS 'Utrudnienia / zamieszkały lokal: ×1.22 dla robocizny';
COMMENT ON COLUMN profiles.coeff_surface    IS 'Trudne podłoże: +15% do modyfikatora powierzchni';

-- ────────────────────────────────────────────────────────────────────
-- 2. project_items: Equipment ("S") category (wykopy, maszyny)
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS equipment_price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equipment_norm  numeric(8,4)  DEFAULT 0;

COMMENT ON COLUMN project_items.equipment_price IS 'Kategoria S: koszt sprzętu/maszyn (PLN/jm), np. wynajem koparki';
COMMENT ON COLUMN project_items.equipment_norm  IS 'Kategoria S: norma maszynogodzin (mh/jm)';

-- ────────────────────────────────────────────────────────────────────
-- 3. es_dictionary: D3 synonym "kabelkowe" → "kablowe" family
-- ────────────────────────────────────────────────────────────────────
INSERT INTO es_dictionary (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES
  ('kabelkowe',           'ES-KNR-KABEL-01', 'Trasy kablowe (kabelkowe)',         'robocizna', false, NULL, 0.08, 'mb', 'rury_trasy', 0.85),
  ('trasowe kabelkowe',   'ES-KNR-KABEL-02', 'Układanie tras kablowych',           'robocizna', false, NULL, 0.10, 'mb', 'rury_trasy', 0.80),
  ('koryto kabelkowe',    'ES-KNR-KABEL-03', 'Koryto kablowe (kabelkowe)',         'material',  false, NULL, 0.08, 'mb', 'rury_trasy', 0.85),
  ('drabinka kabelkowa',  'ES-KNR-KABEL-04', 'Drabinka kablowa (kabelkowa)',       'material',  false, NULL, 0.15, 'mb', 'rury_trasy', 0.80),
  ('przepust kabelkowy',  'ES-KNR-KABEL-05', 'Przepust kablowy (kabelkowy)',       'robocizna', false, NULL, 0.25, 'szt','rury_trasy', 0.75)
ON CONFLICT (keyword_normalized) DO NOTHING;
