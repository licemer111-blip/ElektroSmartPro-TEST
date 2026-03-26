-- ============================================================
-- ES-Engine Dictionary Seed v13.0 — FLEKSJA & EXACT FORMS FIX
-- Cel: pokryć L1 Exact dla form fleksyjnych i złożonych opisów
-- które trafiają jako L2 Analog po fuzzy match.
--
-- Zdiagnozowane problemy (ze screena):
--   "Gniazda 1×230V 16A p/t IP20"   → L2 (gniazda ≠ gniazdo)
--   "Punkt 2xDATA + 1×230V"          → L2 (brak exact "punkt 2xdata 1 230v")
--   "Przejścia pożarowe"             → L2 (przejścia ≠ przejście)
--   "Puszki rozgałęzne BH"           → L2 (puszki ≠ puszka, BH noise)
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA — FORMA MNOGA (gniazda zamiast gniazdo)
-- Projekty często piszą "Gniazda 1×230V" (liczba mnoga)
-- ═══════════════════════════════════════════════════════════════

('gniazda 230v',                 'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.3),
('gniazda 1x230v',               'KNR 5-04 0501-01', 'Gniazdo 1×230V p/t montaż',       'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.5),
('gniazda 1x230',                'KNR 5-04 0501-01', 'Gniazdo 1×230V p/t montaż',       'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.5),
('gniazda ip20',                 'KNR 5-04 0501-01', 'Gniazdo 230V IP20 p/t montaż',    'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.5),
('gniazda 1x230v ip20',          'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazda 1x230 ip20',           'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.8),
('gniazda 1x230v 16a ip20',      'KNR 5-04 0501-01', 'Gniazdo 1×230V 16A IP20 p/t',    'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 2.0),
('gniazda 1x230v 16a pt ip20',   'KNR 5-04 0501-01', 'Gniazdo 1×230V 16A IP20 p/t',    'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 2.0),
('gniazda 1x230 16a pt ip20',    'KNR 5-04 0501-01', 'Gniazdo 1×230V 16A IP20 p/t',    'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 2.0),
('gniazda ip44',                 'KNR 5-04 0502-01', 'Gniazdo 230V IP44 p/t montaż',   'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.5),
('gniazda 1x230v ip44',          'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 p/t',        'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.8),
('gniazda 2x230v',               'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',      'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.5),
('gniazda 2x230',                'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',      'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.5),
('gniazda pt',                   'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- PUNKT 2xDATA + 1×230V — złożone opisy punktów kombi
-- ═══════════════════════════════════════════════════════════════

('punkt 2xdata 1x230v',          'KNR 5-06 0201-01', 'Punkt 2×DATA + 1×230V kombi',    'robocizna', false, NULL, 0.55, 'szt', 'it_siec', 2.0),
('punkt 2xdata 1 230v',          'KNR 5-06 0201-01', 'Punkt 2×DATA + 1×230V kombi',    'robocizna', false, NULL, 0.55, 'szt', 'it_siec', 2.0),
('punkt 2x data 230v',           'KNR 5-06 0201-01', 'Punkt 2×DATA + 230V kombi',      'robocizna', false, NULL, 0.55, 'szt', 'it_siec', 1.8),
('punkt data 230v',              'KNR 5-06 0201-01', 'Punkt DATA + 230V kombi',         'robocizna', false, NULL, 0.50, 'szt', 'it_siec', 1.6),
('punkt 2xrj45 230v',            'KNR 5-06 0201-01', 'Punkt 2×RJ45 + 230V kombi',      'robocizna', false, NULL, 0.55, 'szt', 'it_siec', 1.8),
('punkt rj45 230v',              'KNR 5-06 0201-01', 'Punkt RJ45 + 230V kombi',         'robocizna', false, NULL, 0.50, 'szt', 'it_siec', 1.6),
('punkt 2xdata',                 'KNR 5-06 0201-01', 'Punkt 2×DATA (2×RJ45)',           'robocizna', false, NULL, 0.40, 'szt', 'it_siec', 1.5),
('punkt 2x rj45',                'KNR 5-06 0201-01', 'Punkt 2×RJ45 (DATA)',             'robocizna', false, NULL, 0.40, 'szt', 'it_siec', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- PRZEJŚCIA POŻAROWE — forma mnoga i warianty
-- ═══════════════════════════════════════════════════════════════

('przejscia pozarowe',           'KNR 5-04 0702-01', 'Przejście pożarowe uszczelnienie','robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 2.0),
('przejscie ogniowe',            'KNR 5-04 0702-01', 'Przejście ognioodporne',           'robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 1.5),
('uszczelnienie ppoż',           'KNR 5-04 0702-01', 'Uszczelnienie ppoż p-poż',        'robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 1.5),
('przepust pozarowy',            'KNR 5-04 0702-01', 'Przepust pożarowy montaż',         'robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 1.5),
('przepusty pozarowe',           'KNR 5-04 0702-01', 'Przepust pożarowy montaż',         'robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 1.8),
('kolnierz pozarowy',            'KNR 5-04 0702-01', 'Kołnierz pożarowy montaż',         'robocizna', false, NULL, 0.35, 'szt', 'prowadzenie', 1.5),
('masa ogniochronna',            'KNR 5-04 0702-01', 'Masa ogniochronna uszczelnienie',  'robocizna', false, NULL, 0.30, 'szt', 'prowadzenie', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- PUSZKI ROZGAŁĘŹNE — forma mnoga i warianty z BH
-- "Puszki rozgałęzne BH" → puszki (mn.) + BH (typ) = noise
-- ═══════════════════════════════════════════════════════════════

('puszki rozgalezne',            'KNR 5-04 0202-01', 'Puszki rozgałęźne p/t montaż',   'robocizna', false, NULL, 0.18, 'szt', 'osprzet', 1.8),
('puszki odgalezne',             'KNR 5-04 0202-01', 'Puszki odgałęźne p/t montaż',    'robocizna', false, NULL, 0.18, 'szt', 'osprzet', 1.8),
('puszki instalacyjne',          'KNR 5-04 0201-01', 'Puszki instalacyjne p/t montaż',  'robocizna', false, NULL, 0.10, 'szt', 'osprzet', 1.5),
('puszka bh',                    'KNR 5-04 0202-01', 'Puszka rozgałęźna typ BH',        'robocizna', false, NULL, 0.18, 'szt', 'osprzet', 1.5),
('puszki bh',                    'KNR 5-04 0202-01', 'Puszki rozgałęźne typ BH',        'robocizna', false, NULL, 0.18, 'szt', 'osprzet', 1.8),
('puszka hermetyczna bh',        'KNR 5-04 0203-01', 'Puszka hermetyczna BH IP44',      'robocizna', false, NULL, 0.20, 'szt', 'osprzet', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- DODATKOWE FORMY MNOGE — inne często spotykane w projektach
-- ═══════════════════════════════════════════════════════════════

('wylaczniki',                   'KNR 5-04 0504-01', 'Wyłączniki instalacyjne p/t',     'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.3),
('lacniki',                      'KNR 5-04 0504-01', 'Łączniki instalacyjne p/t',       'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.3),
('przyciski',                    'KNR 5-04 0504-04', 'Przyciski instalacyjne p/t',      'robocizna', false, NULL, 0.22, 'szt', 'osprzet', 1.2),
('oprawy oswietleniowe',         'KNR 5-04 0401-01', 'Oprawy oświetleniowe montaż',     'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.3),
('oprawy led',                   'KNR 5-04 0401-02', 'Oprawy LED montaż',               'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.3),
('oprawy sufitowe',              'KNR 5-04 0401-01', 'Oprawy sufitowe montaż',           'robocizna', false, NULL, 0.38, 'szt', 'oswietlenie', 1.3),
('czujniki ruchu',               'KNR 5-04 0401-04', 'Czujniki ruchu/obecności montaż', 'robocizna', false, NULL, 0.35, 'szt', 'oswietlenie', 1.3),
('rozdzielnice',                 'KNR 5-04 1101-01', 'Rozdzielnice elektryczne montaż', 'robocizna', false, NULL, 2.00, 'szt', 'rozdzielnice', 1.2),
('tablice rozdzielcze',          'KNR 5-04 1101-01', 'Tablice rozdzielcze montaż',      'robocizna', false, NULL, 2.00, 'szt', 'rozdzielnice', 1.2),
('rury instalacyjne',            'KNR 5-04 0801-01', 'Rury instalacyjne montaż',        'robocizna', false, NULL, 0.015,'mb',  'rury_trasy', 1.3),
('korytka kablowe',              'KNR 5-10 0101-01', 'Korytka kablowe montaż',          'robocizna', false, NULL, 0.06, 'mb',  'rury_trasy', 1.3),
('drabinki kablowe',             'KNR 5-10 0201-01', 'Drabinki kablowe montaż',         'robocizna', false, NULL, 0.08, 'mb',  'rury_trasy', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- PRZEWODY — formy z żo (ż→z, o) dla YDYżo / NYYżo / YKYżo
-- (Phase 3 cable regex obsłuży te jako L1, ale też dla Phase 1)
-- ═══════════════════════════════════════════════════════════════

('przewod ydyzo',                'KNR 5-04 0101-01', 'Przewód YDYżo układanie',         'robocizna', false, NULL, 0.030,'mb',  'kable_silnopradowe', 1.5),
('ydyzo',                        'KNR 5-04 0101-01', 'Przewód YDYżo',                   'robocizna', false, NULL, 0.030,'mb',  'kable_silnopradowe', 1.5),
('ydyzo 3x2.5',                  'KNR 5-04 0101-02', 'Przewód YDYżo 3×2,5',             'robocizna', false, NULL, 0.030,'mb',  'kable_silnopradowe', 2.0),
('ydyzo 3x1.5',                  'KNR 5-04 0101-01', 'Przewód YDYżo 3×1,5',             'robocizna', false, NULL, 0.025,'mb',  'kable_silnopradowe', 2.0),
('ydyzo 5x2.5',                  'KNR 5-04 0101-03', 'Przewód YDYżo 5×2,5',             'robocizna', false, NULL, 0.035,'mb',  'kable_silnopradowe', 2.0),
('ydyzo 5x4',                    'KNR 5-04 0101-04', 'Przewód YDYżo 5×4',               'robocizna', false, NULL, 0.038,'mb',  'kable_silnopradowe', 2.0),
('przewod nyy',                  'KNR 5-04 0101-01', 'Przewód NYY układanie',            'robocizna', false, NULL, 0.025,'mb',  'kable_silnopradowe', 1.4),
('kabel nyy',                    'KNR 5-04 0101-01', 'Kabel NYY układanie',              'robocizna', false, NULL, 0.025,'mb',  'kable_silnopradowe', 1.4),
('nyy 3x2.5',                    'KNR 5-04 0101-02', 'Kabel NYY 3×2,5',                 'robocizna', false, NULL, 0.030,'mb',  'kable_silnopradowe', 1.8),
('nyy 5x4',                      'KNR 5-04 0101-04', 'Kabel NYY 5×4',                   'robocizna', false, NULL, 0.038,'mb',  'kable_silnopradowe', 1.8)

ON CONFLICT (keyword_normalized) DO NOTHING;
