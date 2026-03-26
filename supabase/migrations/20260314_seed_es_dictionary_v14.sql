-- ============================================================
-- ES-Engine Dictionary Seed v14.0 — KOMBINACJE & BRAKI
-- Zdiagnozowane ze screena (wciąż L2):
--   "Bruzdowanie"                        → brak bare form
--   "Dołożenie listwy podparapetowej"    → brak kombinacji
--   "Doprowadzenie zasilania do funcoili"→ brak fan-coil
--   "Doprowadzenie zasilania do szafy lan" → brak kombinacji
--   "Montaż lamp awaryjnych i ewakuacyjnych" → brak
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- BRUZDOWANIE — forma ogólna (bez materiału ściany)
-- ═══════════════════════════════════════════════════════════════

('bruzdowanie',                        'KNR 5-04 0601-01', 'Bruzdowanie ściany',                  'robocizna', false, NULL, 0.45, 'mb',  'prowadzenie', 1.5),
('kucie bruzdy',                       'KNR 5-04 0601-01', 'Kucie bruzdy instalacyjnej',          'robocizna', false, NULL, 0.45, 'mb',  'prowadzenie', 1.5),
('wykonanie bruzdy',                   'KNR 5-04 0601-01', 'Wykonanie bruzdy pod instalację',     'robocizna', false, NULL, 0.45, 'mb',  'prowadzenie', 1.4),
('bruzdowanie sciany',                 'KNR 5-04 0601-01', 'Bruzdowanie ściany ogólnie',          'robocizna', false, NULL, 0.45, 'mb',  'prowadzenie', 1.6),
('bruzdowanie muru',                   'KNR 5-04 0601-01', 'Bruzdowanie w murze',                 'robocizna', false, NULL, 0.48, 'mb',  'prowadzenie', 1.5),
('bruzdowanie poziome',                'KNR 5-04 0601-01', 'Bruzdowanie poziome p/t',             'robocizna', false, NULL, 0.45, 'mb',  'prowadzenie', 1.4),
('bruzdowanie pionowe',                'KNR 5-04 0601-01', 'Bruzdowanie pionowe p/t',             'robocizna', false, NULL, 0.45, 'mb',  'prowadzenie', 1.4),
('frezowanie bruzdy',                  'KNR 5-04 0601-01', 'Frezowanie bruzdy instalacyjnej',     'robocizna', false, NULL, 0.35, 'mb',  'prowadzenie', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- LISTWY PODPARAPETOWE — kombinacje i dołożenie
-- ═══════════════════════════════════════════════════════════════

('dolozenie listwy podparapetowej',    'KNR 5-04 0701-04', 'Dołożenie listwy podparapetowej',     'robocizna', false, NULL, 0.12, 'mb',  'rury_trasy', 2.0),
('montaz listwy podparapetowej',       'KNR 5-04 0701-04', 'Montaż listwy podparapetowej',        'robocizna', false, NULL, 0.15, 'mb',  'rury_trasy', 1.8),
('ukladanie listwy podparapetowej',    'KNR 5-04 0701-04', 'Układanie listwy podparapetowej',     'robocizna', false, NULL, 0.15, 'mb',  'rury_trasy', 1.8),
('listwa podparapetowa montaz',        'KNR 5-04 0701-04', 'Listwa podparapetowa montaż',         'robocizna', false, NULL, 0.15, 'mb',  'rury_trasy', 1.6),
('listwa elektroinstalacyjna',         'KNR 5-04 0701-04', 'Listwa elektroinstalacyjna montaż',   'robocizna', false, NULL, 0.15, 'mb',  'rury_trasy', 1.4),
('listwa kablowa',                     'KNR 5-04 0701-04', 'Listwa kablowa montaż',               'robocizna', false, NULL, 0.15, 'mb',  'rury_trasy', 1.4),
('kanał podparapetowy',                'KNR 5-04 0701-04', 'Kanał podparapetowy montaż',          'robocizna', false, NULL, 0.18, 'mb',  'rury_trasy', 1.5),
('kanal podparapetowy',                'KNR 5-04 0701-04', 'Kanał podparapetowy montaż',          'robocizna', false, NULL, 0.18, 'mb',  'rury_trasy', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- FAN-COIL / FUNCOIL — klimatyzacja / wentylacja
-- ═══════════════════════════════════════════════════════════════

('funcoil',                            'KNR 5-04 0101-01', 'Zasilanie fan-coil 230V',             'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('fan coil',                           'KNR 5-04 0101-01', 'Zasilanie fan-coil 230V',             'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('fancoil',                            'KNR 5-04 0101-01', 'Zasilanie fan-coil 230V',             'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('doprowadzenie zasilania do funcoil', 'KNR 5-04 0101-01', 'Doprowadzenie zasilania do fan-coil', 'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 2.0),
('doprowadzenie zasilania funcoil',    'KNR 5-04 0101-01', 'Zasilanie fan-coil',                  'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('zasilanie funcoil',                  'KNR 5-04 0101-01', 'Zasilanie fan-coil 230V',             'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('zasilanie fan coil',                 'KNR 5-04 0101-01', 'Zasilanie fan-coil 230V',             'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('podlaczenie klimakonwektora',        'KNR 5-04 0101-01', 'Podłączenie klimakonwektora',         'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.5),
('klimakonwektor',                     'KNR 5-04 0101-01', 'Klimakonwektor zasilanie',            'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- DOPROWADZENIE ZASILANIA + URZĄDZENIE — kombinacje
-- ═══════════════════════════════════════════════════════════════

('doprowadzenie zasilania do szafy lan',    'KNR 5-06 0401-01', 'Zasilanie szafy LAN rack',       'robocizna', false, NULL, 0.40, 'szt', 'it_siec',   2.0),
('doprowadzenie zasilania szafy lan',       'KNR 5-06 0401-01', 'Zasilanie szafy LAN rack',       'robocizna', false, NULL, 0.40, 'szt', 'it_siec',   1.8),
('zasilanie szafy lan',                     'KNR 5-06 0401-01', 'Zasilanie szafy LAN rack',       'robocizna', false, NULL, 0.40, 'szt', 'it_siec',   1.8),
('zasilanie szafy rack',                    'KNR 5-06 0401-01', 'Zasilanie szafy rack',           'robocizna', false, NULL, 0.40, 'szt', 'it_siec',   1.8),
('doprowadzenie zasilania do szafy rack',   'KNR 5-06 0401-01', 'Zasilanie szafy rack',           'robocizna', false, NULL, 0.40, 'szt', 'it_siec',   2.0),
('doprowadzenie zasilania do centrali',     'KNR 5-04 0101-01', 'Zasilanie centrali',             'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('doprowadzenie zasilania do klimatyzatora','KNR 5-04 0101-01', 'Zasilanie klimatyzatora',        'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('doprowadzenie zasilania do pompy',        'KNR 5-04 0101-01', 'Zasilanie pompy',                'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.8),
('doprowadzenie zasilania do urzadzenia',   'KNR 5-04 0101-01', 'Zasilanie urządzenia 230V',      'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.6),
('doprowadzenie zasilania do gniazdka',     'KNR 5-04 0101-01', 'Doprowadzenie zasilania 230V',   'robocizna', false, NULL, 0.33, 'szt', 'aparatura', 1.6),

-- ═══════════════════════════════════════════════════════════════
-- LAMPY AWARYJNE I EWAKUACYJNE
-- ═══════════════════════════════════════════════════════════════

('montaz lampy awaryjnej',             'KNR 5-04 0401-05', 'Montaż lampy awaryjnej',             'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 1.8),
('montaz lamp awaryjnych',             'KNR 5-04 0401-05', 'Montaż lamp awaryjnych',             'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 2.0),
('montaz lampy ewakuacyjnej',          'KNR 5-04 0401-05', 'Montaż lampy ewakuacyjnej',          'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 1.8),
('montaz lamp ewakuacyjnych',          'KNR 5-04 0401-05', 'Montaż lamp ewakuacyjnych',          'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 2.0),
('montaz lamp awaryjnych ewakuacyjnych','KNR 5-04 0401-05', 'Montaż lamp awaryjnych/ewakuacyjnych','robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 2.0),
('lampa awaryjna',                     'KNR 5-04 0401-05', 'Lampa awaryjna montaż',              'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 1.5),
('lampa ewakuacyjna',                  'KNR 5-04 0401-05', 'Lampa ewakuacyjna montaż',           'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 1.5),
('oprawy awaryjne',                    'KNR 5-04 0401-05', 'Oprawy awaryjne montaż',             'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 1.5),
('oprawa awaryjna',                    'KNR 5-04 0401-05', 'Oprawa awaryjna montaż',             'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie', 1.5),
('exit sign',                          'KNR 5-04 0401-05', 'Tabliczka wyjście montaż',           'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.3),
('tabliczka wyjscie',                  'KNR 5-04 0401-05', 'Tabliczka wyjście montaż',           'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.4),
('piktogram ewakuacyjny',              'KNR 5-04 0401-05', 'Piktogram ewakuacyjny montaż',       'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- INNE CZĘSTE KOMBINACJE Z PROJEKTÓW
-- ═══════════════════════════════════════════════════════════════

('podlaczenie urzadzenia',             'KNR 5-04 0101-01', 'Podłączenie urządzenia 230V',        'robocizna', false, NULL, 0.30, 'szt', 'aparatura', 1.3),
('podlaczenie klimatyzatora',          'KNR 5-04 0101-01', 'Podłączenie klimatyzatora',          'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 1.5),
('podlaczenie pompy',                  'KNR 5-04 0101-01', 'Podłączenie pompy 230V',             'robocizna', false, NULL, 0.30, 'szt', 'aparatura', 1.4),
('podlaczenie silnika',                'KNR 5-04 0101-01', 'Podłączenie silnika',                'robocizna', false, NULL, 0.40, 'szt', 'aparatura', 1.4),
('podlaczenie grzalki',                'KNR 5-04 0101-01', 'Podłączenie grzałki',                'robocizna', false, NULL, 0.25, 'szt', 'aparatura', 1.3),
('wlacznik klawiszowy',                'KNR 5-04 0504-01', 'Włącznik klawiszowy p/t',            'robocizna', false, NULL, 0.25, 'szt', 'osprzet',   1.3),
('wlacznik podwojny',                  'KNR 5-04 0504-01', 'Włącznik podwójny p/t',              'robocizna', false, NULL, 0.28, 'szt', 'osprzet',   1.3),
('gniazdo komputerowe',                'KNR 5-06 0201-01', 'Gniazdo komputerowe RJ45',           'robocizna', false, NULL, 0.35, 'szt', 'it_siec',   1.4),
('gniazdo telefoniczne',               'KNR 5-06 0201-01', 'Gniazdo telefoniczne RJ11',          'robocizna', false, NULL, 0.30, 'szt', 'it_siec',   1.3),
('gniazdo tv',                         'KNR 5-06 0301-01', 'Gniazdo TV antenowe',                'robocizna', false, NULL, 0.30, 'szt', 'it_siec',   1.3),
('gniazdo antenowe',                   'KNR 5-06 0301-01', 'Gniazdo antenowe TV/SAT',            'robocizna', false, NULL, 0.30, 'szt', 'it_siec',   1.3),
('puszka sufitowa',                    'KNR 5-04 0201-01', 'Puszka sufitowa p/t montaż',         'robocizna', false, NULL, 0.12, 'szt', 'osprzet',   1.3),
('puszka sciezna',                     'KNR 5-04 0202-01', 'Puszka ścienna rozgałęźna',          'robocizna', false, NULL, 0.18, 'szt', 'osprzet',   1.3)

ON CONFLICT (keyword_normalized) DO NOTHING;
