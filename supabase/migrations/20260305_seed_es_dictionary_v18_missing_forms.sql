-- ============================================================
-- ES-Engine Dictionary Seed v18.0 — BRAKUJĄCE FORMY
-- Cel: pokryć L1 Exact dla pozycji ze skreenów które trafiają
--      jako L2 Analog lub szczunek (brak match):
--
--  Zdiagnozowane braki:
--   "Gniazdo 1×230 IP20 z ramką p/t + prz..."  → × (U+00D7) ≠ x
--   "Gniazdo 1×230 IP44 z ramką p/t + prz..."  → × (U+00D7) ≠ x
--   "Oprawy oświetlenia podstawowego i/d..."   → 'i' / 'd' suffix
--   "Oprawa oświetlenia awaryjnego"             → dokładna forma
--   "Oprawa oświetlenia kierunkowego"           → dokładna forma
--   "Detektory obecności pomieszczeń..."        → forma liczby mn.
--   "Rury instalacyjne karbowane"               → po v17 DELETE skasowane?
--   "Listwa PCV podparapetowa — uzupełn..."     → z myślnikiem w nazwie
--   "Łączniki oświetleniowe + przygotow..."     → łączniki + przygotowanie
--   "Demontaże instalacji oświetleniowej"       → demontaże (l.mn.)
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA — z ramką, symbol × (U+00D7), IP20 / IP44
-- Problem: unaccent NIE zamienia × na x — exact miss
-- ═══════════════════════════════════════════════════════════════

('gniazdo 1×230 ip20 z ramka',          'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 z ramką p/t',     'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 2.0),
('gniazdo 1×230 ip20',                  'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',             'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazdo 1×230v ip20',                 'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',             'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazdo 1×230 ip44 z ramka',          'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 z ramką p/t',     'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 2.0),
('gniazdo 1×230 ip44',                  'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 p/t',             'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.8),
('gniazdo 1×230v ip44',                 'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 p/t',             'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.8),
('gniazdo 1×230 z ramka',               'KNR 5-04 0501-01', 'Gniazdo 1×230V z ramką p/t',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazdo 1×230v z ramka',              'KNR 5-04 0501-01', 'Gniazdo 1×230V z ramką p/t',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazda 1×230 ip20 z ramka',          'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 z ramką p/t',     'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 2.0),
('gniazda 1×230 ip44 z ramka',          'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 z ramką p/t',     'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 2.0),
('gniazda 1×230 ip20',                  'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',             'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazda 1×230 ip44',                  'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 p/t',             'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.8),
('gniazda 1×230',                       'KNR 5-04 0501-01', 'Gniazdo 1×230V p/t',                  'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.6),
('gniazdo 1×230',                       'KNR 5-04 0501-01', 'Gniazdo 1×230V p/t',                  'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.6),

-- ═══════════════════════════════════════════════════════════════
-- OPRAWY OŚWIETLENIA PODSTAWOWEGO — warianty z sufixem
-- Problem: opis często jest "... i" lub "... d" (skrót)
-- ═══════════════════════════════════════════════════════════════

('oprawy oswietlenia podstawowego i',   'KNR 5-04 0401-01', 'Oprawy oświetlenia podstawowego LED',  'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 2.0),
('oprawy oswietlenia podstawowego d',   'KNR 5-04 0401-01', 'Oprawy oświetlenia podstawowego LED',  'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 2.0),
('oprawy oswietlenia podstawowego led', 'KNR 5-04 0401-01', 'Oprawy oświetlenia podstawowego LED',  'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.8),
('oprawy oswietleniowe',                'KNR 5-04 0401-01', 'Oprawy oświetleniowe LED montaż',      'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.5),
('oprawa sufitowa',                     'KNR 5-04 0401-01', 'Oprawa sufitowa LED montaż',           'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.3),
('oprawa natynkowa',                    'KNR 5-04 0401-01', 'Oprawa natynkowa LED montaż',          'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- OPRAWA OŚWIETLENIA AWARYJNEGO / KIERUNKOWEGO
-- Problem: jest w v2 ale jako 'oswietlenie awaryjne' — nie exact
-- ═══════════════════════════════════════════════════════════════

('oprawa oswietlenia awaryjnego',       'KNR 5-04 0401-03', 'Oprawa oświetlenia awaryjnego',        'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 2.0),
('oprawy oswietlenia awaryjnego',       'KNR 5-04 0401-03', 'Oprawy oświetlenia awaryjnego',        'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 2.0),
('oprawa oswietlenia kierunkowego',     'KNR 5-04 0401-03', 'Oprawa oświetlenia kierunkowego',      'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 2.0),
('oprawy oswietlenia kierunkowego',     'KNR 5-04 0401-03', 'Oprawy oświetlenia kierunkowego',      'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 2.0),
('oprawa awaryjna',                     'KNR 5-04 0401-03', 'Oprawa awaryjna montaż',               'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 1.5),
('oprawy awaryjne',                     'KNR 5-04 0401-03', 'Oprawy awaryjne LED montaż',           'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 1.5),
('lampa awaryjna',                      'KNR 5-04 0401-03', 'Lampa awaryjna LED montaż',            'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 1.3),
('oswietlenie awaryjne',                'KNR 5-04 0401-03', 'Oświetlenie awaryjne — punkt',         'robocizna', false, NULL, 0.60, 'szt', 'dali_awaryjne', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- DETEKTORY OBECNOŚCI — forma liczby mnogi + warianty
-- ═══════════════════════════════════════════════════════════════

('detektory obecnosci pomieszczen',     'KNR 5-04 0401-04', 'Detektor obecności pomieszczeń',       'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 2.0),
('detektory obecnosci pomieszczeniowe', 'KNR 5-04 0401-04', 'Detektor obecności pomieszczeń',       'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 2.0),
('detektor obecnosci sufitowy',         'KNR 5-04 0401-04', 'Detektor obecności sufitowy 360°',     'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.8),
('detektor 360',                        'KNR 5-04 0401-04', 'Detektor obecności 360° sufitowy',     'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.5),
('czujka obecnosci',                    'KNR 5-04 0401-04', 'Czujka obecności montaż',              'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.5),
('czujki obecnosci',                    'KNR 5-04 0401-04', 'Czujki obecności montaż',              'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- RURY INSTALACYJNE KARBOWANE — odbudowa po DELETE w v17
-- v17 usunął kategorię 'rury_trasy' jako część starych categorii
-- ═══════════════════════════════════════════════════════════════

('rury instalacyjne karbowane',         'KNR 5-04 0703-01', 'Rury instalacyjne karbowane montaż',  'robocizna', false, NULL, 0.08, 'mb', 'trasy_przemyslowe', 1.8),
('rury karbowane',                      'KNR 5-04 0703-01', 'Rury karbowane instalacyjne',         'robocizna', false, NULL, 0.08, 'mb', 'trasy_przemyslowe', 1.6),
('rura karbowana instalacyjna',         'KNR 5-04 0703-01', 'Rura karbowana montaż',               'robocizna', false, NULL, 0.08, 'mb', 'trasy_przemyslowe', 1.5),
('rura instalacyjna karbowana',         'KNR 5-04 0703-01', 'Rura instalacyjna karbowana montaż',  'robocizna', false, NULL, 0.08, 'mb', 'trasy_przemyslowe', 1.5),
('peszel',                              'KNR 5-04 0703-01', 'Peszel / rura karbowana montaż',      'robocizna', false, NULL, 0.08, 'mb', 'trasy_przemyslowe', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- LISTWA PCV PODPARAPETOWA — z myślnikiem i uzupełnieniem
-- ═══════════════════════════════════════════════════════════════

('listwa pcv podparapetowa',            'KNR 5-04 0701-04', 'Listwa PCV podparapetowa montaż',      'robocizna', false, NULL, 0.15, 'mb', 'trasy_przemyslowe', 2.0),
('listwa pcv podparapetowa uzupelnienie','KNR 5-04 0701-04', 'Listwa PCV podparapetowa uzupełnienie','robocizna', false, NULL, 0.12, 'mb', 'trasy_przemyslowe', 2.0),
('listwa pcv podparapetowa dolozenie',  'KNR 5-04 0701-04', 'Listwa PCV podparapetowa dołożenie',  'robocizna', false, NULL, 0.12, 'mb', 'trasy_przemyslowe', 1.8),
('listwa pcv',                          'KNR 5-04 0701-04', 'Listwa PCV elektroinstalacyjna',      'robocizna', false, NULL, 0.15, 'mb', 'trasy_przemyslowe', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- ŁĄCZNIKI OŚWIETLENIOWE + PRZYGOTOWANIE
-- ═══════════════════════════════════════════════════════════════

('laczniki oswietleniowe',              'KNR 5-04 0501-03', 'Łącznik oświetleniowy p/t montaż',    'robocizna', false, NULL, 0.30, 'szt', 'osprzet', 1.8),
('lacznik oswietleniowy',               'KNR 5-04 0501-03', 'Łącznik oświetleniowy p/t montaż',    'robocizna', false, NULL, 0.30, 'szt', 'osprzet', 1.5),
('laczniki oswietleniowe przygotowanie','KNR 5-04 0501-03', 'Łączniki oświetleniowe + przygotowanie','robocizna', false, NULL, 0.35, 'szt', 'osprzet', 2.0),
('wlacznik swiatla',                    'KNR 5-04 0501-03', 'Włącznik światła p/t montaż',          'robocizna', false, NULL, 0.30, 'szt', 'osprzet', 1.3),
('wlaczniki swiatla',                   'KNR 5-04 0501-03', 'Włączniki światła p/t montaż',         'robocizna', false, NULL, 0.30, 'szt', 'osprzet', 1.3),
('lacznik schodowy',                    'KNR 5-04 0501-04', 'Łącznik schodowy p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.3),
('laczniki schodowe',                   'KNR 5-04 0501-04', 'Łączniki schodowe p/t montaż',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- DEMONTAŻE — forma liczby mnogiej (ze skreena)
-- ═══════════════════════════════════════════════════════════════

('demontaze instalacji oswietleniowej', 'ES-REM-003',        'Demontaż instalacji oświetleniowej',  'robocizna', false, NULL, 0.40, 'szt', 'remonty_pomiary', 2.0),
('demontaz instalacji oswietleniowej',  'ES-REM-003',        'Demontaż instalacji oświetleniowej',  'robocizna', false, NULL, 0.40, 'szt', 'remonty_pomiary', 1.8),
('demontaz oprawy oswietleniowej',      'KNR 5-04 0341-01', 'Demontaż oprawy oświetleniowej',       'robocizna', false, NULL, 0.15, 'szt', 'remonty_pomiary', 1.8),
('demontaze opraw oswietleniowych',     'KNR 5-04 0341-01', 'Demontaże opraw oświetleniowych',      'robocizna', false, NULL, 0.15, 'szt', 'remonty_pomiary', 1.8)

ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label,
  confidence_weight = EXCLUDED.confidence_weight;
