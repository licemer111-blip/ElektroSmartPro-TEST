-- ============================================================
-- ES-Engine Dictionary Seed v17 — OŚWIETLENIE PODSTAWOWE + AWARYJNE
-- Kategorie: oswietlenie_podstawowe, oswietlenie_awaryjne
-- Naprawia: "Montaż lamp" i "Montaż lamp awaryjnych" pokazują
--           L3-Szacunek zamiast być dopasowane do KNR.
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ── OŚWIETLENIE PODSTAWOWE ─────────────────────────────────────────────────────

-- Montaż prostej oprawy (plafon / kinkiet / tuba)
('montaz lampy',                      'KNR 5-08 9004-01', 'Montaż lampy/oprawy prostej',            'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 2.0),
('montaz lamp',                       'KNR 5-08 9004-01', 'Montaż opraw oświetleniowych',           'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 2.0),
('montaz oprawy oswietleniowej',      'KNR 5-08 9004-01', 'Montaż oprawy oświetleniowej',           'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 2.0),
('montaz opraw oswietleniowych',      'KNR 5-08 9004-01', 'Montaż opraw oświetleniowych',           'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 2.0),
('montaz plafonu',                    'KNR 5-08 9004-01', 'Montaż plafonu LED',                     'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.8),
('montaz kinkietu',                   'KNR 5-08 9004-01', 'Montaż kinkietu',                        'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.8),
('montaz tuby led',                   'KNR 5-08 9004-01', 'Montaż tuby LED',                        'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.8),
('montaz oprawy natynkowej',          'KNR 5-08 9004-01', 'Montaż oprawy natynkowej',               'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.8),
('punkt oswietleniowy',               'KNR 5-08 9004-01', 'Punkt oświetleniowy (montaż oprawy)',    'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 2.0),
('punkt swietlny',                    'KNR 5-08 9004-01', 'Punkt świetlny LED',                     'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.8),
('oprawa led montaz',                 'KNR 5-08 9004-01', 'Oprawa LED — montaż i podłączenie',      'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.8),
('lampa sufitowa montaz',             'KNR 5-08 9004-01', 'Lampa sufitowa — montaż',                'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.6),
('montaz oswietlenia',                'KNR 5-08 9004-01', 'Montaż oświetlenia ogólnego',            'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.6),
('instalacja oswietlenia',            'KNR 5-08 9004-01', 'Instalacja oświetlenia wewnętrznego',    'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie_podstawowe', 1.6),

-- Montaż żyrandola / ciężkiej oprawy zwieszanej
('montaz zyrandola',                  'KNR 5-08 9004-02', 'Montaż żyrandola ozdobnego',             'robocizna', false, NULL, 0.85, 'szt', 'oswietlenie_podstawowe', 2.0),
('zyrandol montaz',                   'KNR 5-08 9004-02', 'Żyrandol wieloramienny — montaż',        'robocizna', false, NULL, 0.85, 'szt', 'oswietlenie_podstawowe', 1.8),
('lampa wiszaca montaz',              'KNR 5-08 9004-02', 'Lampa wisząca — montaż i podwieszenie',  'robocizna', false, NULL, 0.85, 'szt', 'oswietlenie_podstawowe', 1.8),
('oprawa zwieszana',                  'KNR 5-08 9004-02', 'Oprawa zwieszana — montaż',              'robocizna', false, NULL, 0.85, 'szt', 'oswietlenie_podstawowe', 1.6),
('pendel oswietleniowy',              'KNR 5-08 9004-02', 'Pendel oświetleniowy — montaż',          'robocizna', false, NULL, 0.85, 'szt', 'oswietlenie_podstawowe', 1.5),

-- Montaż downlightu / oczka LED / spotu
('montaz downlight',                  'KNR 5-08 9004-03', 'Montaż oprawy wpuszczanej downlight',    'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 2.0),
('downlight led',                     'KNR 5-08 9004-03', 'Downlight LED — montaż i podłączenie',   'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 1.8),
('oczko led',                         'KNR 5-08 9004-03', 'Oczko halogenowe/LED w suficie',         'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 1.8),
('spot led',                          'KNR 5-08 9004-03', 'Spot LED sufitowy',                      'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 1.6),
('oprawa wpuszczana',                 'KNR 5-08 9004-03', 'Oprawa wpuszczana w sufit',              'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 1.8),
('halogen sufitowy',                  'KNR 5-08 9004-03', 'Halogen/LED sufitowy wpuszczany',        'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 1.5),
('gu10 montaz',                       'KNR 5-08 9004-03', 'Oprawa GU10 sufitowa',                   'robocizna', false, NULL, 0.45, 'szt', 'oswietlenie_podstawowe', 1.4),

-- Montaż panelu LED 60x60
('panel led 60x60',                   'KNR 5-08 9004-04', 'Panel LED 60×60 cm — montaż',            'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie_podstawowe', 2.0),
('panel sufitowy led',                'KNR 5-08 9004-04', 'Panel LED sufitowy kaseton',             'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie_podstawowe', 1.8),
('kaseton led',                       'KNR 5-08 9004-04', 'Kaseton LED Armstrong',                  'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie_podstawowe', 1.8),
('oprawa armstrong',                  'KNR 5-08 9004-04', 'Oprawa LED Armstrong do sufitów',        'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie_podstawowe', 1.6),
('panel biurowy led',                 'KNR 5-08 9004-04', 'Panel LED biurowy (120×30, 60×60)',       'robocizna', false, NULL, 0.55, 'szt', 'oswietlenie_podstawowe', 1.6),

-- Czujnik ruchu / zmierzchu do oświetlenia
('czujnik ruchu oswietlenie',         'KNR 5-08 9006-01', 'Czujnik ruchu do sterowania oświetleniem','robocizna', false, NULL, 0.50, 'szt', 'oswietlenie_podstawowe', 1.8),
('czujnik zmierzchu',                 'KNR 5-08 9006-01', 'Czujnik zmierzchu outdoor',              'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie_podstawowe', 1.6),
('czujnik pir oswietlenie',           'KNR 5-08 9006-01', 'Czujnik PIR — automatyka oświetlenia',   'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie_podstawowe', 1.6),

-- ── OŚWIETLENIE AWARYJNE ──────────────────────────────────────────────────────

-- Oprawa awaryjna / ewakuacyjna LED (3h autonomia)
('montaz lampy awaryjnej',            'KNR 5-08 9005-01', 'Montaż oprawy awaryjnej LED 3h',         'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 2.0),
('montaz lamp awaryjnych',            'KNR 5-08 9005-01', 'Montaż opraw awaryjnych LED',            'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 2.0),
('montaz oprawy awaryjnej',           'KNR 5-08 9005-01', 'Montaż oprawy awaryjnej',                'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 2.0),
('oprawa awaryjna montaz',            'KNR 5-08 9005-01', 'Oprawa awaryjna — montaż i podłączenie', 'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 2.0),
('lampa awaryjna',                    'KNR 5-08 9005-01', 'Lampa awaryjna LED z akumulatorem',      'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 1.8),
('montaz lamp awaryjnych i ewakuacyjnych', 'KNR 5-08 9005-01', 'Montaż opraw awaryjnych i ewakuacyjnych', 'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 2.0),
('oswietlenie awaryjne montaz',       'KNR 5-08 9005-01', 'Oświetlenie awaryjne — montaż systemu', 'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 1.8),
('oswietlenie ewakuacyjne',           'KNR 5-08 9005-01', 'Oświetlenie ewakuacyjne LED',            'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 2.0),
('droga ewakuacyjna oswietlenie',     'KNR 5-08 9005-01', 'Oznaczenie drogi ewakuacyjnej — LED',    'robocizna', false, NULL, 1.20, 'szt', 'oswietlenie_awaryjne', 1.8),

-- Oprawa EXIT / piktogram ewakuacyjny
('montaz exit',                       'KNR 5-08 9005-02', 'Montaż oprawy EXIT (wyjście awaryjne)',  'robocizna', false, NULL, 1.00, 'szt', 'oswietlenie_awaryjne', 2.0),
('oprawa ewakuacyjna exit',           'KNR 5-08 9005-02', 'Oprawa ewakuacyjna EXIT LED',            'robocizna', false, NULL, 1.00, 'szt', 'oswietlenie_awaryjne', 2.0),
('piktogram ewakuacyjny led',         'KNR 5-08 9005-02', 'Piktogram LED "Wyjście"',                'robocizna', false, NULL, 1.00, 'szt', 'oswietlenie_awaryjne', 1.8),
('znak ewakuacyjny led',              'KNR 5-08 9005-02', 'Znak LED ewakuacyjny',                   'robocizna', false, NULL, 1.00, 'szt', 'oswietlenie_awaryjne', 1.8),
('exit led montaz',                   'KNR 5-08 9005-02', 'EXIT LED — montaż i test',               'robocizna', false, NULL, 1.00, 'szt', 'oswietlenie_awaryjne', 1.6),

-- Centrala bateryjno-zasilająca (CBS)
('centrala batteryjno zasilajaca',    'KNR 5-08 9005-03', 'Centralka CBS — montaż i konfiguracja', 'robocizna', false, NULL, 4.00, 'szt', 'oswietlenie_awaryjne', 2.0),
('cbs oswietlenie awaryjne',          'KNR 5-08 9005-03', 'CBS — centrala oświetlenia awaryjnego',  'robocizna', false, NULL, 4.00, 'szt', 'oswietlenie_awaryjne', 2.0),
('centralny system zasilania',        'KNR 5-08 9005-03', 'Centralny system zasilania awaryjnego',  'robocizna', false, NULL, 4.00, 'kpl', 'oswietlenie_awaryjne', 1.8),
('zasilacz centralny lamp awaryjnych','KNR 5-08 9005-03', 'Zasilacz centralny dla lamp awaryjnych', 'robocizna', false, NULL, 4.00, 'szt', 'oswietlenie_awaryjne', 1.8),

-- Test / pomiary oświetlenia awaryjnego
('test lamp awaryjnych',              'KNR 5-08 9005-04', 'Test i pomiar natężenia oświetlenia awaryjnego', 'robocizna', false, NULL, 0.30, 'szt', 'oswietlenie_awaryjne', 1.8),
('pomiar oswietlenia ewakuacyjnego',  'KNR 5-08 9005-04', 'Pomiar natężenia oświetlenia ewakuacyjnego', 'robocizna', false, NULL, 0.30, 'szt', 'oswietlenie_awaryjne', 1.8),
('protokol oswietlenia awaryjnego',   'KNR 5-08 9005-04', 'Protokół odbioru oświetlenia awaryjnego','robocizna', false, NULL, 0.30, 'kpl', 'oswietlenie_awaryjne', 1.6)

ON CONFLICT (keyword_normalized) DO NOTHING;
