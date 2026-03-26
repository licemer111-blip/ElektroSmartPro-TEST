-- ============================================================
-- ES-Engine Dictionary Seed v2.0 — Extended entries
-- Covers: demontaże, okablowanie YDY/YDYp variants,
-- oprawy kierunkowe/ewakuacyjne, pomiary, inne brakujące
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- DEMONTAŻE (Dismantling works — missing from v1)
-- ═══════════════════════════════════════════════════════════════

('demontaz',                  'KNR 5-04 9901-01', 'Demontaż instalacji elektrycznej',      'robocizna', false, NULL, 0.20,  'szt', 'demontaz', 1.0),
('demontaze',                 'KNR 5-04 9901-01', 'Demontaże instalacji elektrycznej',     'robocizna', false, NULL, 0.20,  'szt', 'demontaz', 1.0),
('demontaz instalacji',       'KNR 5-04 9901-01', 'Demontaż instalacji elektrycznej',      'robocizna', false, NULL, 0.20,  'szt', 'demontaz', 1.2),
('demontaz kabli',            'KNR 5-04 9901-02', 'Demontaż kabli i przewodów /100mb',     'robocizna', false, NULL, 1.00,  '100mb', 'demontaz', 1.2),
('demontaz przewodow',        'KNR 5-04 9901-02', 'Demontaż przewodów /100mb',             'robocizna', false, NULL, 1.00,  '100mb', 'demontaz', 1.2),
('demontaz gniazd',           'KNR 5-04 9902-01', 'Demontaż gniazd i łączników',          'robocizna', false, NULL, 0.10,  'szt', 'demontaz', 1.2),
('demontaz gniazdek',         'KNR 5-04 9902-01', 'Demontaż gniazd i łączników',          'robocizna', false, NULL, 0.10,  'szt', 'demontaz', 1.2),
('demontaz lamp',             'KNR 5-04 9903-01', 'Demontaż opraw oświetleniowych',        'robocizna', false, NULL, 0.20,  'szt', 'demontaz', 1.2),
('demontaz opraw',            'KNR 5-04 9903-01', 'Demontaż opraw oświetleniowych',        'robocizna', false, NULL, 0.20,  'szt', 'demontaz', 1.2),
('demontaz instalacji oswietleniowej', 'KNR 5-04 9903-01', 'Demontaż instalacji oświetleniowej', 'robocizna', false, NULL, 0.20, 'kpl', 'demontaz', 1.5),
('demontaz instalacji elektrycznej',   'KNR 5-04 9901-01', 'Demontaż instalacji elektrycznej',   'robocizna', false, NULL, 0.20, 'kpl', 'demontaz', 1.5),
('demontaz rozdzielnicy',     'KNR 5-04 9904-01', 'Demontaż rozdzielnicy elektrycznej',   'robocizna', false, NULL, 1.50,  'szt', 'demontaz', 1.3),
('demontaz tablicy',          'KNR 5-04 9904-01', 'Demontaż tablicy rozdzielczej',         'robocizna', false, NULL, 1.50,  'szt', 'demontaz', 1.2),
('demontaz puszek',           'KNR 5-04 9902-02', 'Demontaż puszek instalacyjnych',        'robocizna', false, NULL, 0.12,  'szt', 'demontaz', 1.2),
('demontaz wyłacznikow',      'KNR 5-04 9902-01', 'Demontaż wyłączników',                 'robocizna', false, NULL, 0.10,  'szt', 'demontaz', 1.1),
('demontaz rur',              'KNR 5-04 9905-01', 'Demontaż rur i korytek kablowych',      'robocizna', false, NULL, 0.05,  'mb', 'demontaz', 1.1),
('demontaz korytka',          'KNR 5-04 9905-01', 'Demontaż korytek kablowych',            'robocizna', false, NULL, 0.05,  'mb', 'demontaz', 1.1),
('likwidacja instalacji',     'KNR 5-04 9901-01', 'Likwidacja instalacji elektrycznej',    'robocizna', false, NULL, 0.20,  'kpl', 'demontaz', 1.0),
('rozbiórka instalacji',      'KNR 5-04 9901-01', 'Rozbiórka instalacji elektrycznej',     'robocizna', false, NULL, 0.20,  'kpl', 'demontaz', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- OKABLOWANIE (Wiring — "okablowanie" prefix variants)
-- ═══════════════════════════════════════════════════════════════

('okablowanie',               'KNR 5-04 0101-01', 'Okablowanie instalacyjne',              'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 0.9),
('okablowanie ydyp',          'KNR 5-04 0101-01', 'Okablowanie YDYp 3×1.5',               'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.3),
('okablowanie ydy',           'KNR 5-04 0101-01', 'Okablowanie YDY',                       'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.2),
('okablowanie ydy 2x1 5',     'KNR 5-04 0101-01', 'Okablowanie YDY 2×1.5',                'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydy 3x1 5',     'KNR 5-04 0101-01', 'Okablowanie YDY 3×1.5',                'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydy 3x2 5',     'KNR 5-04 0101-02', 'Okablowanie YDY 3×2.5',                'robocizna', false, NULL, 3.00,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydy 5x2 5',     'KNR 5-04 0101-03', 'Okablowanie YDY 5×2.5',                'robocizna', false, NULL, 3.50,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydyp 3x1 5',    'KNR 5-04 0101-01', 'Okablowanie YDYp 3×1.5',               'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydyp 3x2 5',    'KNR 5-04 0101-02', 'Okablowanie YDYp 3×2.5',               'robocizna', false, NULL, 3.00,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydyp 5x2 5',    'KNR 5-04 0101-03', 'Okablowanie YDYp 5×2.5',               'robocizna', false, NULL, 3.50,  '100mb', 'kable_silnopradowe', 1.5),
('okablowanie ydyzo',         'KNR 5-04 0101-01', 'Okablowanie YDYżo 3×1.5',              'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.2),
('okablowanie nym',           'KNR 5-04 0101-01', 'Okablowanie NYM 3×1.5',                'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.2),
('okablowanie lgyzo',         'KNR 5-04 0102-01', 'Okablowanie LgYżo /100mb',             'robocizna', false, NULL, 1.80,  '100mb', 'kable_silnopradowe', 1.2),
('ukladanie kabla',           'KNR 5-04 0101-01', 'Układanie kabla',                       'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.0),
('ukladanie przewodow',       'KNR 5-04 0101-01', 'Układanie przewodów',                   'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.0),
('prowadzenie kabla',         'KNR 5-04 0101-01', 'Prowadzenie kabla',                     'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 0.9),

-- YDY bez p (często używane)
('ydy',                       'KNR 5-04 0101-01', 'Przewód YDY 3×1.5',                    'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.0),
('ydy 2x1 5',                 'KNR 5-04 0101-01', 'Przewód YDY 2×1.5',                    'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.5),
('ydy 3x1 5',                 'KNR 5-04 0101-01', 'Przewód YDY 3×1.5',                    'robocizna', false, NULL, 2.50,  '100mb', 'kable_silnopradowe', 1.5),
('ydy 3x2 5',                 'KNR 5-04 0101-02', 'Przewód YDY 3×2.5',                    'robocizna', false, NULL, 3.00,  '100mb', 'kable_silnopradowe', 1.5),
('ydy 5x2 5',                 'KNR 5-04 0101-03', 'Przewód YDY 5×2.5',                    'robocizna', false, NULL, 3.50,  '100mb', 'kable_silnopradowe', 1.5),
('ydy 5x4',                   'KNR 5-04 0101-03', 'Przewód YDY 5×4',                      'robocizna', false, NULL, 3.80,  '100mb', 'kable_silnopradowe', 1.5),
('ydy 5x6',                   'KNR 5-04 0101-04', 'Przewód YDY 5×6',                      'robocizna', false, NULL, 4.00,  '100mb', 'kable_silnopradowe', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- OPRAWY OŚWIETLENIOWE — rozszerzone (Lighting fixtures extended)
-- ═══════════════════════════════════════════════════════════════

('oprawa oswietlenia awaryjnego',    'KNR 5-04 0401-03', 'Oprawa oświetlenia awaryjnego',        'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.5),
('oprawa oswietlenia kierunkowego',  'KNR 5-04 0401-03', 'Oprawa oświetlenia kierunkowego',       'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.5),
('oprawa ewakuacyjna',               'KNR 5-04 0401-03', 'Oprawa ewakuacyjna',                   'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.3),
('oprawa kierunkowa',                'KNR 5-04 0401-03', 'Oprawa kierunkowa EXIT',                'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.3),
('oprawa exit',                      'KNR 5-04 0401-03', 'Oprawa EXIT ewakuacyjna',               'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.3),
('znak ewakuacyjny',                 'KNR 5-04 0401-03', 'Znak ewakuacyjny LED',                  'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.0),
('oprawy awaryjne',                  'KNR 5-04 0401-03', 'Oprawy awaryjne',                       'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.2),
('oswietlenie awaryjne',             'KNR 5-04 0401-03', 'Oświetlenie awaryjne',                  'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.1),
('oswietlenie ewakuacyjne',          'KNR 5-04 0401-03', 'Oświetlenie ewakuacyjne',               'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.1),
('oprawy led halogenowe',            'KNR 5-04 0401-02', 'Oprawa LED halogenowa',                 'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.1),
('oprawa hermetyczna',               'KNR 5-04 0401-05', 'Oprawa hermetyczna IP65',               'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.1),
('oprawa ip65',                      'KNR 5-04 0401-05', 'Oprawa hermetyczna IP65',               'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.1),
('oswietlenie',                      'KNR 5-04 0401-01', 'Oświetlenie montaż',                    'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 0.7),
('montaz opraw',                     'KNR 5-04 0401-01', 'Montaż opraw oświetleniowych',          'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.1),
('montaz lamp',                      'KNR 5-04 0401-01', 'Montaż lamp oświetleniowych',           'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.1),
('oprawa natynkowa',                 'KNR 5-04 0401-01', 'Oprawa LED natynkowa',                  'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.1),
('oprawa podtynkowa',                'KNR 5-04 0401-02', 'Oprawa LED podtynkowa',                 'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.1),
('spot',                             'KNR 5-04 0401-02', 'Oprawa spotowa podtynkowa',             'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 0.9),
('reflektor',                        'KNR 5-04 0401-01', 'Reflektor montaż',                      'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 0.9),

-- ═══════════════════════════════════════════════════════════════
-- POMIARY I URUCHOMIENIE (Testing, commissioning)
-- ═══════════════════════════════════════════════════════════════

('pomiary elektryczne',              'KNR 5-04 1001-01', 'Pomiary elektryczne instalacji',        'robocizna', false, NULL, 0.30, 'kpl', 'pomiary', 1.2),
('pomiary',                          'KNR 5-04 1001-01', 'Pomiary instalacji elektrycznej',       'robocizna', false, NULL, 0.30, 'kpl', 'pomiary', 0.9),
('pomiar rezystancji',               'KNR 5-04 1001-01', 'Pomiar rezystancji izolacji',           'robocizna', false, NULL, 0.15, 'obwod', 'pomiary', 1.2),
('pomiar obwodu',                    'KNR 5-04 1001-01', 'Pomiar obwodu elektrycznego',           'robocizna', false, NULL, 0.15, 'obwod', 'pomiary', 1.2),
('protokol pomiarow',                'KNR 5-04 1001-02', 'Protokół pomiarów elektrycznych',       'robocizna', false, NULL, 0.50, 'kpl', 'pomiary', 1.1),
('uruchomienie',                     'KNR 5-04 1002-01', 'Uruchomienie i regulacja',              'robocizna', false, NULL, 1.00, 'kpl', 'pomiary', 0.9),
('rozruch',                          'KNR 5-04 1002-01', 'Rozruch instalacji elektrycznej',       'robocizna', false, NULL, 1.00, 'kpl', 'pomiary', 0.9),
('odbiory',                          'KNR 5-04 1003-01', 'Odbiory techniczne instalacji',         'robocizna', false, NULL, 1.00, 'kpl', 'pomiary', 0.8),
('odbiór',                           'KNR 5-04 1003-01', 'Odbiór techniczny instalacji',          'robocizna', false, NULL, 1.00, 'kpl', 'pomiary', 0.9),

-- ═══════════════════════════════════════════════════════════════
-- UZIEMIENIE I EKWIPOTENCJALIZACJA (Grounding, bonding)
-- ═══════════════════════════════════════════════════════════════

('uziemienie',                       'KNR 5-04 0801-01', 'Uziemienie montaż',                     'robocizna', false, NULL, 0.50, 'szt', 'uziemienie', 1.0),
('uziom',                            'KNR 5-04 0801-01', 'Uziom pionowy montaż',                  'robocizna', false, NULL, 1.20, 'szt', 'uziemienie', 1.0),
('szyna pe',                         'KNR 5-04 0801-02', 'Szyna PE montaż',                       'robocizna', false, NULL, 0.30, 'szt', 'uziemienie', 1.1),
('szyna uziemiajaca',                'KNR 5-04 0801-02', 'Szyna uziemiająca Cu',                  'robocizna', false, NULL, 0.30, 'szt', 'uziemienie', 1.1),
('ekwipotencjalizacja',              'KNR 5-04 0802-01', 'Połączenia ekwipotencjalne',             'robocizna', false, NULL, 0.25, 'szt', 'uziemienie', 1.2),
('polaczenia wyrownawcze',           'KNR 5-04 0802-01', 'Połączenia wyrównawcze',                'robocizna', false, NULL, 0.25, 'szt', 'uziemienie', 1.2),
('przewod pe',                       'KNR 5-04 0101-01', 'Przewód ochronny PE',                   'robocizna', false, NULL, 1.80, '100mb', 'uziemienie', 1.1),
('przewod ochronny',                 'KNR 5-04 0101-01', 'Przewód ochronny PE',                   'robocizna', false, NULL, 1.80, '100mb', 'uziemienie', 1.1),

-- ═══════════════════════════════════════════════════════════════
-- PRACE DODATKOWE (Additional works, misc)
-- ═══════════════════════════════════════════════════════════════

('przepust kablowy',                 'KNR 5-04 0702-01', 'Przepust kablowy przez przegrodę',      'robocizna', false, NULL, 0.25, 'szt', 'prowadzenie', 1.2),
('uszczelnienie przepustu',          'KNR 5-04 0702-02', 'Uszczelnienie przepustu ppoż.',          'robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 1.2),
('oznaczenie kabli',                 'KNR 5-04 1101-01', 'Oznaczenie i opisanie kabli',           'robocizna', false, NULL, 0.05, 'szt', 'prace_dodatkowe', 1.0),
('wiazanie kabli',                   'KNR 5-04 1101-02', 'Wiązanie i układanie kabli',            'robocizna', false, NULL, 0.03, 'mb', 'prace_dodatkowe', 0.9),
('transport materialu',              'KNR 5-04 1201-01', 'Transport materiałów na budowie',        'robocizna', false, NULL, 0.50, 'kpl', 'prace_dodatkowe', 0.8),
('prace pomocnicze',                 'KNR 5-04 1202-01', 'Prace pomocnicze monterskie',           'robocizna', false, NULL, 0.50, 'kpl', 'prace_dodatkowe', 0.8),
('klejenie puszki',                  'KNR 5-04 0602-01', 'Montaż puszki instalacyjnej',           'robocizna', false, NULL, 0.25, 'szt', 'prace_dodatkowe', 1.0),
('montaz puszki',                    'KNR 5-04 0602-01', 'Montaż puszki instalacyjnej',           'robocizna', false, NULL, 0.25, 'szt', 'prace_dodatkowe', 1.1),
('montaz gniazda',                   'KNR 5-04 0301-01', 'Montaż gniazda 230V',                  'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.2),
('montaz wylacznika',                'KNR 5-04 0201-01', 'Montaż wyłącznika/łącznika',            'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 1.2),
('montaz rozdzielnicy',              'KNR 5-04 0601-01', 'Montaż rozdzielnicy elektrycznej',      'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.2),
('montaz tablicy',                   'KNR 5-04 0601-01', 'Montaż tablicy rozdzielczej',           'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.2),
('montaz wyłacznika',                'KNR 5-04 0501-01', 'Montaż wyłącznika nadprądowego',        'robocizna', false, NULL, 0.15, 'szt', 'aparatura', 1.2),
('zakonczenie kabla',                'KNR 5-04 1101-03', 'Zakończenie i podłączenie kabla',       'robocizna', false, NULL, 0.15, 'szt', 'prace_dodatkowe', 1.1),
('podlaczenie kabla',                'KNR 5-04 1101-03', 'Podłączenie kabla do rozdzielnicy',     'robocizna', false, NULL, 0.15, 'szt', 'prace_dodatkowe', 1.1),
('lutowanie',                        'KNR 5-04 1101-04', 'Lutowanie połączeń elektrycznych',      'robocizna', false, NULL, 0.10, 'szt', 'prace_dodatkowe', 1.0),
('naprawa instalacji',               'KNR 5-04 9901-01', 'Naprawa instalacji elektrycznej',       'robocizna', false, NULL, 0.50, 'kpl', 'prace_dodatkowe', 0.9),
('przeglad techniczny',              'KNR 5-04 1003-01', 'Przegląd techniczny instalacji',        'robocizna', false, NULL, 0.50, 'kpl', 'pomiary', 0.9)

ON CONFLICT (keyword_normalized) DO NOTHING;

COMMENT ON TABLE es_dictionary IS
  'ES-Engine semantic dictionary v2.0 — ~220+ Polish installer slang entries. '
  'v2.0: Added demontaże, okablowanie variants, oprawy kierunkowe/awaryjne, pomiary, uziemienie. '
  'Auto-normalized via trigger. 4-phase matching: Exact → Fuzzy(pg_trgm) → Regex → LLM.';
