-- ════════════════════════════════════════════════════════════════════════════
-- 20260306_create_knr_catalog_structure.sql
-- ElektroSmart PRO — Rozszerzona struktura katalogów KNR
--
-- Tabele:
--   1. knr_norms          — normy robocizny z katalogów KNR 5-08 / 5-10 / 5-12 / 4-03 / 5-06
--   2. knr_to_materials   — relacja M2M: norma KNR ↔ pozycje materiałowe (Zestawy)
--   3. regional_coefficients — korekty regionalne dla 16 województw (sync z lib/config/regions.ts)
--
-- Iron Rules:
--   - Robocizna i Materiał są ZAWSZE oddzielne (nigdy nie sumowane przedwcześnie)
--   - regional_coefficients.multiplier dotyczy WYŁĄCZNIE robocizny
--   - RLS włączone dla wszystkich tabel
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. knr_norms ─────────────────────────────────────────────────────────────
-- Przechowuje normy KNR z wielu katalogów branżowych.
-- Każda norma = 1 wiersz tabeli KNR (np. KNR 5-10 tab.02 kol.01).

CREATE TABLE IF NOT EXISTS knr_norms (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identyfikacja normy
  catalog_code      text        NOT NULL,                  -- np. "KNR 5-08", "KNR 5-10", "KNR 4-03", "KNR 5-12", "KNR 5-06"
  section           text        NOT NULL DEFAULT '',       -- Rozdział katalogu (np. "Rozdział 03 — Przewody")
  table_number      text        NOT NULL DEFAULT '',       -- Numer tabeli w katalogu (np. "0301")
  column_number     text        NOT NULL DEFAULT '',       -- Numer kolumny (np. "01", "02")
  full_code         text        GENERATED ALWAYS AS (
                                  catalog_code || ' ' || table_number || '-' || column_number
                                ) STORED,                  -- Pełny kod KNR np. "KNR 5-08 0301-01"

  -- Opis
  description       text        NOT NULL,                  -- Opis pracy w języku polskim
  unit              text        NOT NULL DEFAULT 'szt',    -- Jednostka miary: szt, m, mb, kpl, m2, godz

  -- Normy robocizny (Iron Rule: TYLKO robocizna — materiały w osobnej tabeli)
  labor_norm        numeric(10,4) NOT NULL DEFAULT 0,      -- Norma rbh / jednostkę miary
  labor_norm_min    numeric(10,4),                         -- Min. norma (przedział widełkowy)
  labor_norm_max    numeric(10,4),                         -- Max. norma (przedział widełkowy)

  -- Powiązania semantyczne (do Zestawy i ES-Engine)
  material_category text,                                  -- Kategoria materiałów np. "gniazda_wylaczniki", "kable_silnopradowe"
  knr_category      text,                                  -- Kategoria ES-Engine: "aparatura", "oswietlenie", "rozdzielnice"

  -- Flagi specjalne
  is_industrial     boolean     NOT NULL DEFAULT false,    -- +15% nadkład dla warunków przemysłowych (Hale/przemysł)
  is_active         boolean     NOT NULL DEFAULT true,     -- Wyłącznik (false = archiwum)
  is_verified       boolean     NOT NULL DEFAULT false,    -- Zweryfikowane przez ekspertów

  -- Metadane
  source_edition    text,                                  -- Wydanie katalogu np. "2026", "2024 (aktualizacja)"
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indeksy do szybkiego wyszukiwania
CREATE INDEX IF NOT EXISTS idx_knr_norms_catalog_code
  ON knr_norms (catalog_code);

CREATE INDEX IF NOT EXISTS idx_knr_norms_full_code
  ON knr_norms (full_code);

CREATE INDEX IF NOT EXISTS idx_knr_norms_material_category
  ON knr_norms (material_category);

CREATE INDEX IF NOT EXISTS idx_knr_norms_is_industrial
  ON knr_norms (is_industrial);

-- Full-text search na opisie (dla ES-Engine fuzzy lookup)
CREATE INDEX IF NOT EXISTS idx_knr_norms_description_gin
  ON knr_norms USING GIN (to_tsvector('simple', description));

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_knr_norms_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_knr_norms_updated_at ON knr_norms;
CREATE TRIGGER trg_knr_norms_updated_at
  BEFORE UPDATE ON knr_norms
  FOR EACH ROW EXECUTE FUNCTION update_knr_norms_updated_at();

-- ─── 2. knr_to_materials ──────────────────────────────────────────────────────
-- Relacja M2M: jedna norma KNR → wiele pozycji materiałowych.
-- Implementuje Iron Rule "Zestawy" — automatyczne podpinanie materiałów do normy robocizny.
-- Przykład: KNR 5-08 "Montaż gniazda" → kabel YDYp 3×2.5 + puszka + gniazdo + bruzda

CREATE TABLE IF NOT EXISTS knr_to_materials (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Klucz do normy KNR (robocizna)
  knr_norm_id      uuid         NOT NULL REFERENCES knr_norms(id) ON DELETE CASCADE,

  -- Powiązanie z katalogiem materiałów ElektroSmart
  catalog_item_id  uuid         REFERENCES catalog_items(id) ON DELETE SET NULL,

  -- Alternatywne powiązanie tekstowe (gdy catalog_item_id niedostępne / import zewnętrzny)
  material_name    text         NOT NULL,                   -- Opis materiału np. "Gniazdo podtynkowe 230V"
  material_unit    text         NOT NULL DEFAULT 'szt',     -- Jednostka materiału
  material_category text,                                   -- Kategoria ES-Engine

  -- Ilość materiału na jednostkę normy KNR
  quantity_factor  numeric(10,4) NOT NULL DEFAULT 1.0,      -- np. 3.5 mb kabla na 1 szt gniazdo

  -- Typ składnika Zestawu (Iron Rule: zawsze oddzielone)
  component_type   text         NOT NULL DEFAULT 'material'
                   CHECK (component_type IN ('material', 'robocizna', 'cable', 'box', 'device', 'chase')),

  -- Opis składnika w kontekście Zestawu
  recipe_component_id text,                                 -- ID składnika w ZESTAWY_RECIPES (np. "gnz_mat_kab")
  is_optional      boolean      NOT NULL DEFAULT false,     -- Czy składnik jest opcjonalny (np. bruzda)
  only_for_surface text[],                                  -- Tylko dla: 'w_tynku', 'pod_tynkiem', 'na_tynku'

  -- Metadane
  created_at       timestamptz  NOT NULL DEFAULT now()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_knr_to_materials_knr_norm_id
  ON knr_to_materials (knr_norm_id);

CREATE INDEX IF NOT EXISTS idx_knr_to_materials_catalog_item_id
  ON knr_to_materials (catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_knr_to_materials_component_type
  ON knr_to_materials (component_type);

-- ─── 3. regional_coefficients ────────────────────────────────────────────────
-- Korekty regionalne dla 16 województw polskich.
-- SYNCHRONIZOWANE z lib/config/regions.ts — NIE ZMIENIAĆ bez aktualizacji TS!
-- Iron Rule: multiplier dotyczy WYŁĄCZNIE robocizny, NIE materiałów.

CREATE TABLE IF NOT EXISTS regional_coefficients (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),

  province_id     text         NOT NULL UNIQUE,            -- Slug: "mazowieckie", "podkarpackie" itd.
  province_name   text         NOT NULL,                   -- Oficjalna nazwa: "Mazowieckie"
  capital         text         NOT NULL,                   -- Stolica: "Warszawa"
  multiplier      numeric(5,4) NOT NULL                    -- Współczynnik: 1.20, 0.88 itd.
                  CHECK (multiplier > 0 AND multiplier <= 2.0),

  -- Źródło danych (ważne dla audytu)
  source          text         NOT NULL DEFAULT 'SEKOCENBUD/GUS 2024',
  is_active       boolean      NOT NULL DEFAULT true,

  -- Iron Rule annotation — wymuszenie dokumentacji
  applies_to      text         NOT NULL DEFAULT 'labor_only'
                  CHECK (applies_to = 'labor_only'),       -- ZAWSZE 'labor_only' — Iron Rule

  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regional_coefficients_province_id
  ON regional_coefficients (province_id);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_regional_coefficients_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_regional_coefficients_updated_at ON regional_coefficients;
CREATE TRIGGER trg_regional_coefficients_updated_at
  BEFORE UPDATE ON regional_coefficients
  FOR EACH ROW EXECUTE FUNCTION update_regional_coefficients_updated_at();

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- knr_norms: publiczne dane KNR — wszyscy mogą czytać, tylko admin zapisuje
ALTER TABLE knr_norms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knr_norms_select_all" ON knr_norms;
CREATE POLICY "knr_norms_select_all"
  ON knr_norms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "knr_norms_insert_admin" ON knr_norms;
CREATE POLICY "knr_norms_insert_admin"
  ON knr_norms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "knr_norms_update_admin" ON knr_norms;
CREATE POLICY "knr_norms_update_admin"
  ON knr_norms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- knr_to_materials: publiczne dane — wszyscy czytają, admin zapisuje
ALTER TABLE knr_to_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knr_to_materials_select_all" ON knr_to_materials;
CREATE POLICY "knr_to_materials_select_all"
  ON knr_to_materials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "knr_to_materials_insert_admin" ON knr_to_materials;
CREATE POLICY "knr_to_materials_insert_admin"
  ON knr_to_materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- regional_coefficients: publiczne dane — wszyscy czytają, admin zapisuje
ALTER TABLE regional_coefficients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regional_coefficients_select_all" ON regional_coefficients;
CREATE POLICY "regional_coefficients_select_all"
  ON regional_coefficients FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "regional_coefficients_insert_admin" ON regional_coefficients;
CREATE POLICY "regional_coefficients_insert_admin"
  ON regional_coefficients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "regional_coefficients_update_admin" ON regional_coefficients;
CREATE POLICY "regional_coefficients_update_admin"
  ON regional_coefficients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ─── Seed: regional_coefficients ─────────────────────────────────────────────
-- Dane zsynchronizowane z lib/config/regions.ts (VOIVODESHIP_MODIFIERS + POLISH_REGIONS)
-- Iron Rule: applies_to = 'labor_only' jest WYMUSZONE przez CHECK constraint

INSERT INTO regional_coefficients (province_id, province_name, capital, multiplier, applies_to)
VALUES
  ('mazowieckie',         'Mazowieckie',          'Warszawa',     1.2000, 'labor_only'),
  ('dolnoslaskie',        'Dolnośląskie',          'Wrocław',      1.1200, 'labor_only'),
  ('malopolskie',         'Małopolskie',           'Kraków',       1.1000, 'labor_only'),
  ('pomorskie',           'Pomorskie',             'Gdańsk',       1.1000, 'labor_only'),
  ('slaskie',             'Śląskie',               'Katowice',     1.0800, 'labor_only'),
  ('wielkopolskie',       'Wielkopolskie',         'Poznań',       1.0600, 'labor_only'),
  ('zachodniopomorskie',  'Zachodniopomorskie',    'Szczecin',     1.0200, 'labor_only'),
  ('lodzkie',             'Łódzkie',               'Łódź',         1.0000, 'labor_only'),
  ('lubuskie',            'Lubuskie',              'Zielona Góra', 0.9600, 'labor_only'),
  ('kujawsko-pomorskie',  'Kujawsko-Pomorskie',    'Bydgoszcz',    0.9600, 'labor_only'),
  ('warminsko-mazurskie', 'Warmińsko-Mazurskie',   'Olsztyn',      0.9200, 'labor_only'),
  ('opolskie',            'Opolskie',              'Opole',        0.9400, 'labor_only'),
  ('swietokrzyskie',      'Świętokrzyskie',        'Kielce',       0.9000, 'labor_only'),
  ('lubelskie',           'Lubelskie',             'Lublin',       0.9200, 'labor_only'),
  ('podkarpackie',        'Podkarpackie',          'Rzeszów',      0.8800, 'labor_only'),
  ('podlaskie',           'Podlaskie',             'Białystok',    0.8800, 'labor_only')
ON CONFLICT (province_id) DO UPDATE
  SET multiplier   = EXCLUDED.multiplier,
      province_name = EXCLUDED.province_name,
      capital       = EXCLUDED.capital,
      updated_at    = now();

-- ─── Seed: knr_norms — przykładowe normy KNR 5-08 (Instalacje elektryczne mieszkaniowe) ──
-- Katalog: KNR 5-08 — Instalacje elektryczne w budownictwie mieszkaniowym i ogólnym
-- Serwuje jako template do importu pełnych katalogów KNR 5-10 / 5-12 / 4-03

INSERT INTO knr_norms (catalog_code, section, table_number, column_number, description, unit, labor_norm, material_category, knr_category, is_industrial, is_verified)
VALUES
  -- KNR 5-08: Przewody / Kablowanie
  ('KNR 5-08', 'Rozdział 01 — Przewody i kable', '0101', '01', 'Układanie przewodów YDYp 3×1.5mm² w rurach lub bruzdach', 'mb', 0.0250, 'kable_silnopradowe', 'aparatura', false, true),
  ('KNR 5-08', 'Rozdział 01 — Przewody i kable', '0101', '02', 'Układanie przewodów YDYp 3×2.5mm² w rurach lub bruzdach', 'mb', 0.0300, 'kable_silnopradowe', 'aparatura', false, true),
  ('KNR 5-08', 'Rozdział 01 — Przewody i kable', '0101', '03', 'Układanie przewodów YDYp 5×2.5mm² w rurach lub bruzdach', 'mb', 0.0350, 'kable_silnopradowe', 'aparatura', false, true),
  ('KNR 5-08', 'Rozdział 01 — Przewody i kable', '0101', '04', 'Układanie przewodów YDYp 5×4mm² w rurach lub bruzdach',   'mb', 0.0400, 'kable_silnopradowe', 'aparatura', false, true),
  ('KNR 5-08', 'Rozdział 01 — Przewody i kable', '0101', '05', 'Układanie kabla YKY 4×16mm² w ziemi lub kanale',          'mb', 0.0800, 'kable_silnopradowe', 'aparatura', false, true),

  -- KNR 5-08: Łączniki / Gniazda
  ('KNR 5-08', 'Rozdział 02 — Łączniki i gniazda', '0201', '01', 'Montaż łącznika podtynkowego 1P', 'szt', 0.2200, 'gniazda_wylaczniki', 'gniazda_wylaczniki', false, true),
  ('KNR 5-08', 'Rozdział 02 — Łączniki i gniazda', '0201', '02', 'Montaż łącznika podtynkowego 2P (krzyżowego)', 'szt', 0.2800, 'gniazda_wylaczniki', 'gniazda_wylaczniki', false, true),
  ('KNR 5-08', 'Rozdział 03 — Łączniki i gniazda', '0301', '01', 'Montaż gniazda podtynkowego 230V 16A (pojedynczego)', 'szt', 0.2200, 'gniazda_wylaczniki', 'gniazda_wylaczniki', false, true),
  ('KNR 5-08', 'Rozdział 03 — Łączniki i gniazda', '0301', '02', 'Montaż gniazda podtynkowego 230V 16A (podwójnego)',   'szt', 0.2800, 'gniazda_wylaczniki', 'gniazda_wylaczniki', false, true),
  ('KNR 5-08', 'Rozdział 03 — Łączniki i gniazda', '0301', '03', 'Montaż gniazda siłowego 400V/32A podtynkowego',       'szt', 0.4000, 'gniazda_wylaczniki', 'gniazda_wylaczniki', false, true),

  -- KNR 5-08: Oprawy oświetleniowe
  ('KNR 5-08', 'Rozdział 04 — Oświetlenie', '0401', '01', 'Montaż oprawy oświetleniowej LED do 100W', 'szt', 0.4000, 'oswietlenie', 'oswietlenie', false, true),
  ('KNR 5-08', 'Rozdział 04 — Oświetlenie', '0401', '02', 'Montaż oprawy oświetleniowej LED powyżej 100W', 'szt', 0.6000, 'oswietlenie', 'oswietlenie', false, true),
  ('KNR 5-08', 'Rozdział 04 — Oświetlenie', '0401', '03', 'Montaż oprawy zewnętrznej LED IP65', 'szt', 0.7000, 'oswietlenie', 'oswietlenie', false, true),

  -- KNR 5-08: Aparatura rozdzielcza
  ('KNR 5-08', 'Rozdział 05 — Aparatura modułowa', '0501', '01', 'Montaż wyłącznika nadprądowego MCB 1P (rozdzielnica)', 'szt', 0.1800, 'aparatura', 'rozdzielnice', false, true),
  ('KNR 5-08', 'Rozdział 05 — Aparatura modułowa', '0501', '02', 'Montaż wyłącznika nadprądowego MCB 3P (rozdzielnica)', 'szt', 0.2500, 'aparatura', 'rozdzielnice', false, true),
  ('KNR 5-08', 'Rozdział 05 — Aparatura modułowa', '0501', '03', 'Montaż wyłącznika różnicowoprądowego RCD 40A 30mA', 'szt', 0.3500, 'aparatura', 'rozdzielnice', false, true),
  ('KNR 5-08', 'Rozdział 05 — Aparatura modułowa', '0501', '04', 'Montaż rozdzielnicy podtynkowej do 12 modułów', 'kpl', 2.0000, 'rozdzielnice', 'rozdzielnice', false, true),
  ('KNR 5-08', 'Rozdział 05 — Aparatura modułowa', '0501', '05', 'Montaż rozdzielnicy podtynkowej do 24 modułów', 'kpl', 3.0000, 'rozdzielnice', 'rozdzielnice', false, true),

  -- KNR 5-08: Puszki
  ('KNR 5-08', 'Rozdział 06 — Puszki instalacyjne', '0602', '01', 'Montaż puszki podtynkowej Ø60 z mocowaniem', 'szt', 0.2500, 'gniazda_wylaczniki', 'aparatura', false, true),
  ('KNR 5-08', 'Rozdział 06 — Puszki instalacyjne', '0602', '02', 'Montaż puszki natynkowej z pokrywą', 'szt', 0.2000, 'gniazda_wylaczniki', 'aparatura', false, true),

  -- KNR 5-08: Bruzdowanie / Kucie
  ('KNR 5-08', 'Rozdział 07 — Bruzdowanie', '0701', '01', 'Kucie bruzd w ścianie ceglanej lub betonowej', 'mb', 0.0600, 'rury_trasy', 'prowadzenie', false, true),
  ('KNR 5-08', 'Rozdział 07 — Bruzdowanie', '0701', '02', 'Kucie bruzd w ścianie z bloczków Ytong/siporex', 'mb', 0.0450, 'rury_trasy', 'prowadzenie', false, true),
  ('KNR 5-08', 'Rozdział 07 — Bruzdowanie', '0701', '03', 'Zakrywanie bruzd (zaprawą gipsową)', 'mb', 0.0400, 'rury_trasy', 'prowadzenie', false, true),

  -- KNR 5-10: Instalacje w halach i budynkach przemysłowych
  ('KNR 5-10', 'Rozdział 01 — Trasy kablowe', '0101', '01', 'Montaż korytka kablowego stalowego 100×60mm', 'mb', 0.1500, 'rury_trasy', 'prowadzenie', true, true),
  ('KNR 5-10', 'Rozdział 01 — Trasy kablowe', '0101', '02', 'Montaż drabinki kablowej 200mm', 'mb', 0.2000, 'rury_trasy', 'prowadzenie', true, true),
  ('KNR 5-10', 'Rozdział 01 — Trasy kablowe', '0101', '03', 'Montaż rury stalowej RB 22 (przemysłowe)', 'mb', 0.1200, 'rury_trasy', 'prowadzenie', true, true),
  ('KNR 5-10', 'Rozdział 02 — Kable przemysłowe', '0201', '01', 'Układanie kabla YKY 4×35mm² na drabince lub korytku', 'mb', 0.1000, 'kable_silnopradowe', 'aparatura', true, true),
  ('KNR 5-10', 'Rozdział 02 — Kable przemysłowe', '0201', '02', 'Układanie kabla YKY 4×95mm² na drabince lub korytku', 'mb', 0.1500, 'kable_silnopradowe', 'aparatura', true, true),
  ('KNR 5-10', 'Rozdział 03 — Gniazda przemysłowe', '0301', '01', 'Montaż gniazda CEE 5P 16A/400V natynkowego', 'szt', 0.4000, 'gniazda_wylaczniki', 'gniazda_wylaczniki', true, true),
  ('KNR 5-10', 'Rozdział 03 — Gniazda przemysłowe', '0301', '02', 'Montaż gniazda CEE 5P 32A/400V natynkowego', 'szt', 0.5000, 'gniazda_wylaczniki', 'gniazda_wylaczniki', true, true),
  ('KNR 5-10', 'Rozdział 03 — Gniazda przemysłowe', '0301', '03', 'Montaż gniazda CEE 5P 63A/400V natynkowego', 'szt', 0.7000, 'gniazda_wylaczniki', 'gniazda_wylaczniki', true, true),

  -- KNR 5-12: Oświetlenie przemysłowe i specjalne
  ('KNR 5-12', 'Rozdział 01 — Oświetlenie przemysłowe', '0101', '01', 'Montaż oprawy przemysłowej LED high-bay 100-200W', 'szt', 1.0000, 'oswietlenie', 'oswietlenie', true, true),
  ('KNR 5-12', 'Rozdział 01 — Oświetlenie przemysłowe', '0101', '02', 'Montaż oprawy przemysłowej LED high-bay 200-500W', 'szt', 1.5000, 'oswietlenie', 'oswietlenie', true, true),
  ('KNR 5-12', 'Rozdział 02 — Oświetlenie ewakuacyjne', '0201', '01', 'Montaż oprawy awaryjnej LED 1W (CENTRAL bateria)', 'szt', 0.5000, 'oswietlenie', 'oswietlenie', false, true),
  ('KNR 5-12', 'Rozdział 02 — Oświetlenie ewakuacyjne', '0201', '02', 'Montaż oprawy ewakuacyjnej LED 3W podtynkowej', 'szt', 0.7000, 'oswietlenie', 'oswietlenie', false, true),

  -- KNR 4-03: Instalacje teletechniczne (LAN, TV, SAT)
  ('KNR 4-03', 'Rozdział 01 — Kable teletechniczne', '0101', '01', 'Układanie kabla UTP kat.6 w korytku lub bruzdzie', 'mb', 0.0200, 'kable_slabopradowe', 'it_siec', false, true),
  ('KNR 4-03', 'Rozdział 01 — Kable teletechniczne', '0101', '02', 'Układanie kabla światłowodowego SM 9/125 (OS2)', 'mb', 0.0300, 'kable_slabopradowe', 'it_siec', false, true),
  ('KNR 4-03', 'Rozdział 02 — Osprzęt LAN', '0201', '01', 'Montaż gniazda RJ45 kat.6 podtynkowego',   'szt', 0.2000, 'it_siec', 'it_siec', false, true),
  ('KNR 4-03', 'Rozdział 02 — Osprzęt LAN', '0201', '02', 'Montaż gniazda RJ45 kat.6A podtynkowego',  'szt', 0.2500, 'it_siec', 'it_siec', false, true),
  ('KNR 4-03', 'Rozdział 02 — Osprzęt LAN', '0201', '03', 'Montaż patch panelu 24 portowego kat.6',   'szt', 2.0000, 'it_siec', 'it_siec', false, true),
  ('KNR 4-03', 'Rozdział 03 — Anteny', '0301', '01', 'Montaż gniazda antenowego RTV/SAT podtynkowego', 'szt', 0.2000, 'kable_slabopradowe', 'it_siec', false, true),

  -- KNR 5-06: Instalacje sygnalizacyjne (Alarm, CCTV, Domofon)
  ('KNR 5-06', 'Rozdział 01 — Kable niskonapięciowe', '0101', '01', 'Układanie kabla sygnalizacyjnego YTDY 4×0.5mm²',  'mb', 0.0180, 'kable_slabopradowe', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 01 — Kable niskonapięciowe', '0101', '02', 'Układanie kabla sygnalizacyjnego YTDY 8×0.5mm²',  'mb', 0.0200, 'kable_slabopradowe', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 01 — Kable niskonapięciowe', '0601', '01', 'Układanie kabla koncentrycznego RG-6 75Ω',        'mb', 0.0150, 'kable_slabopradowe', 'it_siec', false, true),
  ('KNR 5-06', 'Rozdział 02 — Osprzęt sygnalizacyjny', '0201', '01', 'Montaż gniazda sygnalizacyjnego / antenowego',  'szt', 0.2000, 'kable_slabopradowe', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 02 — Systemy alarm', '0401', '01', 'Montaż czujki ruchu PIR podtynkowej',    'szt', 0.3500, 'bezpieczenstwo', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 02 — Systemy alarm', '0401', '02', 'Montaż czujki magnetycznej drzwiowej',   'szt', 0.2500, 'bezpieczenstwo', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 02 — Systemy alarm', '0402', '01', 'Montaż kamery IP dome PoE wewnętrznej',   'szt', 0.6000, 'bezpieczenstwo', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 02 — Systemy alarm', '0402', '02', 'Montaż kamery IP tube PoE zewnętrznej IP66', 'szt', 0.8000, 'bezpieczenstwo', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 03 — Domofony', '0501', '01', 'Montaż panelu zewnętrznego wideodomofonu', 'szt', 1.0000, 'bezpieczenstwo', 'bezpieczenstwo', false, true),
  ('KNR 5-06', 'Rozdział 03 — Domofony', '0501', '02', 'Montaż monitora wewnętrznego wideodomofonu', 'szt', 0.7000, 'bezpieczenstwo', 'bezpieczenstwo', false, true)
ON CONFLICT DO NOTHING;
