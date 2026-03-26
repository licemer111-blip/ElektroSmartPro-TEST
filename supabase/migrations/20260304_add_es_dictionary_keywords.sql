-- ═══════════════════════════════════════════════════════════════════
-- 20260304_add_es_dictionary_keywords.sql
-- Add missing keywords that were fuzzy-matching as L2 Analog instead of L1 Exact.
-- Apply manually in LIVE Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES
('listwa podparapetowa',     'KNR 5-08 0101-01', 'Listwa podparapetowa montaż',     'robocizna', false, NULL, 0.08,  'mb',  'rury_trasy',         1.5),
('listwa naścienna',         'KNR 5-08 0101-01', 'Listwa naścienna montaż',         'robocizna', false, NULL, 0.08,  'mb',  'rury_trasy',         1.4),
('dolozenie listwy',         'KNR 5-08 0101-01', 'Dołożenie listwy kablowej',       'robocizna', false, NULL, 0.08,  'mb',  'rury_trasy',         1.4),
('doprowadzenie zasilania',  'KNR 5-04 0101-01', 'Doprowadzenie zasilania 230V',    'robocizna', false, NULL, 0.35,  'szt', 'aparatura',          1.3),
('doprowadzenie kabla',      'KNR 5-04 0101-01', 'Doprowadzenie kabla',             'robocizna', false, NULL, 0.35,  'szt', 'aparatura',          1.2),
('podlaczenie zasilania',    'KNR 5-04 0101-01', 'Podłączenie zasilania',           'robocizna', false, NULL, 0.30,  'szt', 'aparatura',          1.2),
('przejscie pozarowe',       'KNR 5-04 0702-01', 'Przejście pożarowe uszczelnienie','robocizna', false, NULL, 0.40,  'szt', 'prowadzenie',        1.3),
('uszczelnienie przejscia',  'KNR 5-04 0702-01', 'Uszczelnienie przejścia ppoż',    'robocizna', false, NULL, 0.40,  'szt', 'prowadzenie',        1.3),
('montaz oprawy',            'KNR 5-04 0401-01', 'Montaż oprawy oświetleniowej',    'robocizna', false, NULL, 0.40,  'szt', 'oswietlenie',        1.3),
('montaz oswietlenia',       'KNR 5-04 0401-01', 'Montaż oświetlenia',              'robocizna', false, NULL, 0.40,  'szt', 'oswietlenie',        1.2),
('gniazdo ip20',             'KNR 5-04 0301-01', 'Gniazdo 230V IP20',               'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo ip44',             'KNR 5-04 0301-01', 'Gniazdo 230V IP44',               'robocizna', false, NULL, 0.25,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo ip65',             'KNR 5-04 0301-03', 'Gniazdo 230V IP65 zewnętrzne',    'robocizna', false, NULL, 0.30,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo 16a',              'KNR 5-04 0301-01', 'Gniazdo 230V 16A',                'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.3),
('gniazdo 1x230',            'KNR 5-04 0301-01', 'Gniazdo 1×230V',                  'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo 2x230',            'KNR 5-04 0301-02', 'Gniazdo 2×230V',                  'robocizna', false, NULL, 0.25,  'szt', 'gniazda_wylaczniki', 1.4),
('punkt 2xdata',             'KNR 5-06 0201-01', 'Punkt 2×DATA (2×RJ45)',           'robocizna', false, NULL, 0.35,  'szt', 'gniazda_wylaczniki', 1.4),
('punkt data',               'KNR 5-06 0201-01', 'Punkt DATA (RJ45)',               'robocizna', false, NULL, 0.20,  'szt', 'gniazda_wylaczniki', 1.3),
('laczenie 53600',           'KNR 5-04 0501-01', 'Łączenie S360Ø / złącze',         'robocizna', false, NULL, 0.20,  'szt', 'aparatura',          1.0),
('laczenie',                 'KNR 5-04 0501-01', 'Łączenie obwodu',                 'robocizna', false, NULL, 0.20,  'szt', 'aparatura',          0.7),
('szafa lan',                'KNR 5-06 0401-01', 'Szafa LAN rack montaż',           'robocizna', false, NULL, 0.90,  'szt', 'it_siec',            1.3),
('szafa serwerowa',          'KNR 5-06 0401-01', 'Szafa serwerowa rack montaż',     'robocizna', false, NULL, 0.90,  'szt', 'it_siec',            1.3),
('montaz kd',                'KNR 5-07 0601-01', 'Montaż kontroli dostępu KD',      'robocizna', false, NULL, 0.60,  'szt', 'bezpieczenstwo',     1.3),
('kontrola dostepu',         'KNR 5-07 0601-01', 'Kontrola dostępu montaż',         'robocizna', false, NULL, 0.60,  'szt', 'bezpieczenstwo',     1.2),
('montaz czujnika',          'KNR 5-07 0301-01', 'Montaż czujnika',                 'robocizna', false, NULL, 0.30,  'szt', 'bezpieczenstwo',     1.0),
('instalacja elektryczna',   'KNR 5-04 0101-01', 'Instalacja elektryczna ogólna',   'robocizna', false, NULL, 0.35,  'mb',  'rury_trasy',         0.7),
('punkt elektryczny',        'KNR 5-04 0301-01', 'Punkt elektryczny 230V',          'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.1)
ON CONFLICT (keyword_normalized) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Added % new keyword entries to es_dictionary', 27;
END $$;
