-- ============================================================
-- ES-Engine Dictionary Seed v18b — PATCH
-- Brakujące pozycje: wyłącznik awaryjny UPS + koryta pod podłogą
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- wyłącznik awaryjny UPS / EPO (Emergency Power Off)
('montaz wylacznika awaryjnego ups',    'KNR 5-08 6001-01', 'Montaz wylacznika awaryjnego UPS (EPO)',          'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 2.0),
('wylacznik awaryjny ups',              'KNR 5-08 6001-01', 'Wylacznik awaryjny UPS (EPO)',                    'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 2.0),
('epo ups montaz',                      'KNR 5-08 6001-01', 'EPO — Emergency Power Off montaz',               'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 2.0),
('wylacznik epo',                       'KNR 5-08 6001-01', 'Wylacznik EPO dla UPS',                          'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 1.8),
('montaz wylacznika ups',               'KNR 5-08 6001-01', 'Montaz wylacznika zasilania awaryjnego',         'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 1.8),
('wylacznik bezpieczenstwa ups',        'KNR 5-08 6001-01', 'Przycisk bezpieczenstwa UPS',                    'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 1.6),
('montaz obejscia ups',                 'KNR 5-08 6001-02', 'Montaz obejscia manualnego UPS (manual bypass)', 'robocizna', false, NULL, 3.00, 'szt', 'zasilanie_awaryjne', 2.0),
('bypass ups',                          'KNR 5-08 6001-02', 'UPS bypass manualny — montaz i okablowanie',    'robocizna', false, NULL, 3.00, 'szt', 'zasilanie_awaryjne', 1.8),

-- Koryta kablowe pod podłogą techniczną (raised floor)
('rozprowadzenie koryt pod podloga techniczna', 'KNR 5-08 7001-01', 'Koryta kablowe pod podloga techniczna', 'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 2.0),
('koryta pod podloga techniczna',       'KNR 5-08 7001-01', 'Trasa kablowa pod podloga techniczna',           'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 2.0),
('kabel pod podloga techniczna',        'KNR 5-08 7001-01', 'Przewod pod podloga techniczna (raised floor)',  'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 1.8),
('instalacja pod podloga',              'KNR 5-08 7001-01', 'Instalacja elektryczna pod podloga techniczna',  'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 1.8),
('rozprowadzenie koryt pod podloga',    'KNR 5-08 7001-01', 'Rozprowadzenie koryt pod podloga',               'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 2.0),
('raised floor okablowanie',            'KNR 5-08 7001-01', 'Okablowanie raised floor (podloga techniczna)',  'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 1.8),
('podloga techniczna instalacja',       'KNR 5-08 7001-01', 'Instalacja w podloze technicznej',               'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 1.6),
('koryto pod podloga',                  'KNR 5-08 7001-01', 'Koryto kablowe pod podloga techniczna',          'robocizna', false, NULL, 0.45, 'mb',  'gniazda_przemyslowe', 1.8)

ON CONFLICT (keyword_normalized) DO NOTHING;
