-- ═══════════════════════════════════════════════════════════════════════════
-- Phase C1b: Seed composite rozdzielnica norms (mieszkaniowe 12-96 mod)
--
-- PURPOSE: User often adds "Rozdzielnica X-mod p/t" as a SINGLE line item
-- expecting full-install price (obudowa + aparatura + testing). Previously
-- this fell through to L3 AI which hallucinated norms (e.g. 2.5 rbh with
-- 1320 PLN implied rate 528 PLN/h). Now seeded with realistic KNR 2026
-- composite norms matching typical residential/office panels.
--
-- NORMS (calibrated from individual component norms already in DB):
-- 12-mod p/t = 6.0 rbh  (obudowa 3.0 + 6×MCB 2.16 + RCD 0.77 + test 1.5 ≈ 7 rbh, -10% for routing overlap)
-- 24-mod p/t = 10.0 rbh (obudowa 3.0 + 12×MCB 4.32 + 2×RCD 1.54 + SPD 1.15 + test 1.5 ≈ 11 rbh)
-- 36-mod p/t = 14.0 rbh (+MCB + RCD + dokumentacja)
-- 48-mod p/t = 18.0 rbh (3-faz + MCCB główny + szyny Cu)
-- 72-mod p/t = 25.0 rbh (2 rzędy + selektywność)
-- 96-mod p/t = 32.0 rbh (4 rzędy + licznik + DTR)
-- n/t variants: -25% (prostszy montaż — brak wnęki)
--
-- DUPLICATE SAFETY: uses unique (catalog_code, table_number, column_number)
-- constraint via ON CONFLICT DO UPDATE, so repeated runs are idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

-- NOTE: `full_code` is a GENERATED column in knr_norms — do NOT include in INSERT.

INSERT INTO public.knr_norms (
  catalog_code, table_number, column_number,
  description, unit, labor_norm, knr_category, is_industrial,
  is_active, is_verified, source_edition, synonyms
) VALUES
  ('ES-KNR-ROZ', 'FULL', '12PT',
   'Rozdzielnica mieszkaniowa podtynkowa 12-modułowa — KOMPLET (obudowa p/t + ~6 MCB + 1 RCD + SPD T2 + szyny PE/N + podłączenia + testy + oznakowanie)',
   'szt', 6.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 12 mod pt", "rozdzielnica mieszkaniowa 12 modul podtynkowa", "tablica 12 mod pt", "rozdzielnia 12 mod pt", "12 mod pt komplet"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '24PT',
   'Rozdzielnica mieszkaniowa podtynkowa 24-modułowa — KOMPLET (obudowa p/t + ~12 MCB + 2 RCD + SPD T2 + szyny + okablowanie + testy + oznakowanie + dokumentacja)',
   'szt', 10.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 24 mod pt", "rozdzielnica 24 modulowa podtynkowa", "tablica 24 mod pt", "rozdzielnia 24 mod pt", "24 mod pt komplet", "szafka elektryczna 24 pt"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '36PT',
   'Rozdzielnica mieszkaniowa/biurowa podtynkowa 36-modułowa — KOMPLET (obudowa p/t + ~18 MCB + 3 RCD + SPD T2 + wyłącznik główny + szyny + okablowanie + testy + dokumentacja)',
   'szt', 14.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 36 mod pt", "rozdzielnica 36 modulowa podtynkowa", "tablica 36 mod pt", "rozdzielnia 36 mod pt", "36 mod pt komplet"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '48PT',
   'Rozdzielnica 3-fazowa podtynkowa 48-modułowa — KOMPLET (obudowa p/t + ~24 MCB + 4 RCD + SPD T1+T2 + wyłącznik główny 3P + szyny zbiorcze + okablowanie + testy + dokumentacja + schemat)',
   'szt', 18.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 48 mod pt", "rozdzielnica 48 modulowa podtynkowa", "tablica 48 mod pt", "rozdzielnia 48 mod pt", "rozdzielnica 3-fazowa pt", "48 mod pt komplet"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '72PT',
   'Rozdzielnica biurowa/piętrowa podtynkowa 72-modułowa — KOMPLET (obudowa 3-rzędowa p/t + ~36 MCB + 6 RCD + SPD T1+T2 + MCCB główny + szyny + okablowanie + testy + selektywność + dokumentacja)',
   'szt', 25.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 72 mod pt", "rozdzielnica 72 modulowa podtynkowa", "rozdzielnica pietrowa 72", "tablica 72 mod pt", "rozdzielnia 72 mod pt"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '96PT',
   'Rozdzielnica główna/biurowa podtynkowa 96-modułowa — KOMPLET (obudowa 4-rzędowa p/t + ~48 MCB + 8 RCD + SPD T1+T2 + MCCB 100-160A + szyny Cu + okablowanie + licznik + testy + selektywność + DTR)',
   'szt', 32.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 96 mod pt", "rozdzielnica 96 modulowa podtynkowa", "rozdzielnica glowna 96", "tablica 96 mod pt", "rozdzielnia 96 mod pt"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '12NT',
   'Rozdzielnica mieszkaniowa natynkowa 12-modułowa — KOMPLET (obudowa n/t + aparatura ~6 MCB + 1 RCD + SPD T2 + szyny + podłączenia + testy)',
   'szt', 4.5, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 12 mod nt", "rozdzielnica 12 modulowa natynkowa", "tablica 12 mod nt", "rozdzielnia 12 mod nt"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '24NT',
   'Rozdzielnica mieszkaniowa natynkowa 24-modułowa — KOMPLET (obudowa n/t + ~12 MCB + 2 RCD + SPD T2 + szyny PE/N + okablowanie + testy + oznakowanie)',
   'szt', 7.5, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 24 mod nt", "rozdzielnica 24 modulowa natynkowa", "tablica 24 mod nt", "rozdzielnia 24 mod nt"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '36NT',
   'Rozdzielnica natynkowa 36-modułowa — KOMPLET (obudowa n/t + ~18 MCB + 3 RCD + SPD T2 + wyłącznik główny + szyny + okablowanie + testy + dokumentacja)',
   'szt', 11.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 36 mod nt", "rozdzielnica 36 modulowa natynkowa", "tablica 36 mod nt", "rozdzielnia 36 mod nt"]'::jsonb),
  ('ES-KNR-ROZ', 'FULL', '48NT',
   'Rozdzielnica 3-fazowa natynkowa 48-modułowa — KOMPLET (obudowa n/t + ~24 MCB + 4 RCD + SPD T1+T2 + wyłącznik główny 3P + szyny + okablowanie + testy + schemat)',
   'szt', 15.0, 'rozdzielnice-kompletne', false, true, true,
   'es_knr_rozdzielnice_kompletne.json',
   '["rozdzielnica 48 mod nt", "rozdzielnica 48 modulowa natynkowa", "tablica 48 mod nt", "rozdzielnia 48 mod nt"]'::jsonb)
ON CONFLICT (catalog_code, table_number, column_number) DO UPDATE
  SET description = EXCLUDED.description,
      unit        = EXCLUDED.unit,
      labor_norm  = EXCLUDED.labor_norm,
      synonyms    = EXCLUDED.synonyms,
      is_active   = EXCLUDED.is_active,
      is_verified = EXCLUDED.is_verified,
      source_edition = EXCLUDED.source_edition,
      updated_at  = NOW();
