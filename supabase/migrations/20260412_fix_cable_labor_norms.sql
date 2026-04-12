-- =============================================================
-- Fix: YDYp cable laying labor norms
-- Root cause: es_knr_instalacja_podstawowa.json norms either not
-- imported or overwritten by solar cable norms (0.025 r-g/m).
-- Correct source: KNR 5-08, standard residential electrical work.
-- =============================================================

INSERT INTO knr_norms
  (catalog_code, table_number, column_number, description, unit, labor_norm, knr_category, is_industrial, synonyms)
VALUES
  ('KNR 5-08 0201', '5101', '08',
   'Ułożenie przewodu YDYp 3x1,5 mm² p/t w bruździe lub rurce', 'm', 0.07,
   'kablowanie', false,
   '["ydyp 3x1.5","przewód 3x1.5","kabel oświetleniowy","ydy 3x1.5","przewód płaski","kabel 1.5mm","obwód oświetleniowy","układanie przewodu ydyp 3x1"]'),

  ('KNR 5-08 0202', '5101', '09',
   'Ułożenie przewodu YDYp 3x2,5 mm² p/t w bruździe lub rurce', 'm', 0.08,
   'kablowanie', false,
   '["ydyp 3x2.5","przewód 3x2.5","kabel gniazdkowy","ydy 3x2.5","obwód 16a","przewód gniazdkowy","2.5mm przewód","układanie przewodu ydyp 3x2"]'),

  ('KNR 5-08 0203', '5101', '10',
   'Ułożenie przewodu YDYp 5x2,5 mm² p/t w bruździe (3-fazowy)', 'm', 0.11,
   'kablowanie', false,
   '["ydyp 5x2.5","przewód 5x2.5","kabel trójfazowy","3-fazowy przewód","pięciożyłowy","kabel kuchenny trójfazowy"]'),

  ('KNR 5-08 0204', '5101', '11',
   'Ułożenie przewodu YDYp 5x4 mm² p/t lub w rurce (silnik, piekarnik, klimatyzacja)', 'm', 0.13,
   'kablowanie', false,
   '["ydyp 5x4","przewód 5x4","kabel 4mm","obwód silnikowy","klimatyzacja zasilanie","piec elektryczny zasilanie","przewód do pieca"]'),

  ('KNR 5-08 0205', '5101', '12',
   'Ułożenie przewodu YDYp 5x6 mm² p/t (zasilanie kuchenki elektrycznej / pralki)', 'm', 0.15,
   'kablowanie', false,
   '["ydyp 5x6","przewód 5x6","kabel 6mm","kuchenka zasilanie","zasilanie indukcja","obwód 32a"]'),

  ('KNR 5-08 0101', '5101', '01',
   'Bruzdowanie ściany z cegły / silikatu / bloczka (bruzda 1-przewodowa, głęb. 3 cm)', 'm', 0.85,
   'bruzdowanie', false,
   '["bruzda","bruzdowanie","cegła","silikat","wykucie bruzdy","rowek w ścianie","kucie bruzdy","bruzda kablowa","kucie bruzdy w ścianie ceglano"]'),

  ('KNR 5-08 0102', '5101', '02',
   'Bruzdowanie ściany z cegły / silikatu — bruzda 2-przewodowa (poszerzenie)', 'm', 1.1,
   'bruzdowanie', false,
   '["bruzda 2-żyłowa","bruzda szeroka","podwójna bruzda","bruzdowanie cegła","bruzda dla 2 kabli"]'),

  ('KNR 5-08 0103', '5101', '03',
   'Bruzdowanie ściany betonowej / żelbetowej (bruzda 1-przewodowa)', 'm', 2.0,
   'bruzdowanie', false,
   '["bruzda beton","bruzdowanie beton","beton żelbetowy","szlifierka diamentowa","bruzda w betonie","bruzda żelbet","kucie bruzdy w betonie"]'),

  ('KNR 5-08 0104', '5101', '04',
   'Bruzdowanie w ścianie z G-K / tynku gipsowego / styropianu', 'm', 0.18,
   'bruzdowanie', false,
   '["bruzda gips","bruzdowanie gk","płyta gipsowo-kartonowa","ściana karton-gips","bruzda gipsowa","gk instalacja"]')

ON CONFLICT (catalog_code, table_number, column_number) DO UPDATE SET
  labor_norm   = EXCLUDED.labor_norm,
  description  = EXCLUDED.description,
  synonyms     = EXCLUDED.synonyms,
  knr_category = EXCLUDED.knr_category;

-- =============================================================
-- Osprzęt elektroinstalacyjny (gniazda, łączniki, puszki)
-- Source: es_knr_gniazda_wylaczniki_oprawy.json
-- =============================================================

INSERT INTO knr_norms
  (catalog_code, table_number, column_number, description, unit, labor_norm, knr_category, is_industrial, synonyms)
VALUES
  ('KNR 5-08 0401', '5104', '01',
   'Montaż gniazda pojedynczego 230V/16A z uziemieniem (typ Schuko) — podtynkowe', 'szt', 0.35,
   'osprzet_elektryczny', false,
   '["gniazdo schuko","gniazdo 230v","gniazdo pojedyncze","gniazdo uziemione","gniazdo 16a","gniazdko elektryczne","gniazdo podtynkowe","montaz gniazda 230v"]'),

  ('KNR 5-08 0402', '5104', '02',
   'Montaż gniazda podwójnego 230V/16A z uziemieniem (2x Schuko) — podtynkowe', 'szt', 0.45,
   'osprzet_elektryczny', false,
   '["gniazdo podwójne","gniazdo 2x230v","gniazdo podwójne schuko","gniazdo 2x16a","gniazdko podwójne","gniazdo podwojne"]'),

  ('KNR 5-08 0404', '5104', '04',
   'Montaż gniazda 230V pojedynczego natynkowego IP20 (przemysłowe, warsztat, garaż)', 'szt', 0.30,
   'osprzet_elektryczny', false,
   '["gniazdo natynkowe","gniazdo na tynku","gniazdo biały natynk","gniazdo garaż","gniazdko natynkowe","gniazdo naskialne"]'),

  ('KNR 5-08 0407', '5104', '07',
   'Montaż gniazda 3-fazowego CEE 16A 5P (niebieskie, przemysłowe, 400V)', 'szt', 0.60,
   'osprzet_elektryczny', true,
   '["gniazdo cee 16a","gniazdo 3-fazowe","gniazdo 3f 16a","cee blue 16a","gniazdo przemysłowe 16a","gniazdo 3 fazy","gniazdo 400v 16a","gniazdo 3-fazowego 16a","gniazdo trifazowe 16a","gniazdo 5-pin 16a","montaz gniazda 3-fazowego"]'),

  ('KNR 5-08 0408', '5104', '08',
   'Montaż gniazda 3-fazowego CEE 32A 5P (niebieskie, przemysłowe, 400V)', 'szt', 0.70,
   'osprzet_elektryczny', true,
   '["gniazdo cee 32a","gniazdo 3-fazowe 32","gniazdo 3f 32a","cee 32a 5p","gniazdo przemysłowe 32a","gniazdo 400v 32a"]'),

  ('KNR 5-08 0411', '5104', '11',
   'Montaż wyłącznika jednobiegunowego (S1) — montaż p/t, podłączenie, regulacja', 'szt', 0.25,
   'osprzet_elektryczny', false,
   '["wyłącznik jednoobwodowy","włącznik światła","wyłącznik s1","włącznik 1-biegunowy","przełącznik oświetlenia","wyłącznik zwykły","montaz wylacznika 1-biegunowego","wlacznik podtynkowy"]'),

  ('KNR 5-08 0412', '5104', '12',
   'Montaż wyłącznika schodowego (S6/S7) — schemat schodowy, 2 lokalizacje', 'szt', 0.30,
   'osprzet_elektryczny', false,
   '["wyłącznik schodowy","przełącznik schodowy","s6 s7 wyłącznik","światło schodowe","wyłącznik 2-biegunowy s6","switching s7","montaz wylacznika schodowego"]'),

  ('KNR 5-08 0502', '5105', '02',
   'Montaż oprawy wpuszczanej downlight LED 3–12W do sufitu podwieszanego (oczko)', 'szt', 0.25,
   'oswietlenie', false,
   '["downlight","oczko led","spot led","oprawa wpuszczana","downlight led","oczko sufitowe","led downlight","panel oczko","oprawa sufitowa led podtynkowa"]')

ON CONFLICT (catalog_code, table_number, column_number) DO UPDATE SET
  labor_norm   = EXCLUDED.labor_norm,
  description  = EXCLUDED.description,
  synonyms     = EXCLUDED.synonyms,
  knr_category = EXCLUDED.knr_category;
