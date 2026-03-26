-- ============================================================
-- ES-Engine Dictionary Seed Data v1.0
-- Polish electrical installer slang → KNR codes
-- ~140 entries covering all major installation categories
-- NOTE: keyword_normalized is computed automatically by trigger
-- ============================================================

-- Helper: insert with conflict ignore (allows re-running safely)
INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- KABLE SILNOPRĄDOWE (Power cables — YDYp, NYM, LgYżo, NHXMH)
-- ═══════════════════════════════════════════════════════════════

('ydyp',               'KNR 5-04 0101-01', 'Przewód YDYp 3×1.5',     'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.0),
('ydyp 3x1.5',         'KNR 5-04 0101-01', 'Przewód YDYp 3×1.5',     'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.5),
('ydyp 3x2.5',         'KNR 5-04 0101-02', 'Przewód YDYp 3×2.5',     'robocizna', false, NULL, 0.030, 'mb', 'kable_silnopradowe', 1.5),
('ydyp 5x2.5',         'KNR 5-04 0101-03', 'Przewód YDYp 5×2.5',     'robocizna', false, NULL, 0.035, 'mb', 'kable_silnopradowe', 1.5),
('ydyp 5x6',           'KNR 5-04 0101-04', 'Przewód YDYp 5×6',       'robocizna', false, NULL, 0.040, 'mb', 'kable_silnopradowe', 1.5),
('ydyp 3x4',           'KNR 5-04 0101-02', 'Przewód YDYp 3×4',       'robocizna', false, NULL, 0.032, 'mb', 'kable_silnopradowe', 1.5),
('ydyp 3x6',           'KNR 5-04 0101-04', 'Przewód YDYp 3×6',       'robocizna', false, NULL, 0.038, 'mb', 'kable_silnopradowe', 1.5),
('ydyżo',              'KNR 5-04 0101-01', 'Przewód YDYżo 3×1.5',    'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.0),
('ydyzo',              'KNR 5-04 0101-01', 'Przewód YDYżo 3×1.5',    'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.0),
('ydyzo 3x1.5',        'KNR 5-04 0101-01', 'Przewód YDYżo 3×1.5',   'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.5),
('ydyzo 3x2.5',        'KNR 5-04 0101-02', 'Przewód YDYżo 3×2.5',   'robocizna', false, NULL, 0.030, 'mb', 'kable_silnopradowe', 1.5),
('nym',                'KNR 5-04 0101-01', 'Przewód NYM 3×1.5',      'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 0.9),
('nym 3x1.5',          'KNR 5-04 0101-01', 'Przewód NYM 3×1.5',      'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.3),
('nym 3x2.5',          'KNR 5-04 0101-02', 'Przewód NYM 3×2.5',      'robocizna', false, NULL, 0.030, 'mb', 'kable_silnopradowe', 1.3),
('lgyzo',              'KNR 5-04 0102-01', 'Przewód LgYżo',           'robocizna', false, NULL, 0.018, 'mb', 'kable_silnopradowe', 1.0),
('lgyzho',             'KNR 5-04 0102-01', 'Przewód LgYżo',           'robocizna', false, NULL, 0.018, 'mb', 'kable_silnopradowe', 1.0),
('lgyzo 6',            'KNR 5-04 0102-01', 'Przewód LgYżo 6mm²',     'robocizna', false, NULL, 0.018, 'mb', 'kable_silnopradowe', 1.4),
('lgyzo 16',           'KNR 5-04 0102-02', 'Przewód LgYżo 16mm²',    'robocizna', false, NULL, 0.022, 'mb', 'kable_silnopradowe', 1.4),
('nhxmh',              'KNR 5-04 0103-01', 'Kabel NHXMH bezhalogenowy', 'robocizna', false, NULL, 0.035, 'mb', 'kable_silnopradowe', 1.0),
('bezhalogenowy',      'KNR 5-04 0103-01', 'Kabel bezhalogenowy',    'robocizna', false, NULL, 0.035, 'mb', 'kable_silnopradowe', 0.8),
('hdgs',               'KNR 5-04 0103-02', 'Kabel HDGs p.poż.',      'robocizna', false, NULL, 0.040, 'mb', 'kable_silnopradowe', 1.0),
('kabel ppoz',         'KNR 5-04 0103-02', 'Kabel p.poż. HDGs',      'robocizna', false, NULL, 0.040, 'mb', 'kable_silnopradowe', 1.2),
('kabel p.poz',        'KNR 5-04 0103-02', 'Kabel p.poż. HDGs',      'robocizna', false, NULL, 0.040, 'mb', 'kable_silnopradowe', 1.2),
('kabel solarny',      'KNR 5-04 0104-01', 'Kabel solarny PV',       'robocizna', false, NULL, 0.020, 'mb', 'kable_silnopradowe', 1.0),
('pv kabel',           'KNR 5-04 0104-01', 'Kabel solarny PV',       'robocizna', false, NULL, 0.020, 'mb', 'kable_silnopradowe', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- KABLE SŁABOPRĄDOWE (Signal / Low-voltage cables)
-- ═══════════════════════════════════════════════════════════════

('skretka',            'KNR 5-06 0101-01', 'Kabel UTP kat.6',        'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.0),
('utp',                'KNR 5-06 0101-01', 'Kabel UTP kat.6',        'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.0),
('ftp',                'KNR 5-06 0101-01', 'Kabel FTP kat.6',        'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.0),
('lan',                'KNR 5-06 0101-01', 'Kabel LAN',               'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 0.9),
('kabel lan',          'KNR 5-06 0101-01', 'Kabel LAN',               'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.2),
('kabel sieciowy',     'KNR 5-06 0101-01', 'Kabel sieciowy',          'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.1),
('utp cat6',           'KNR 5-06 0101-01', 'Kabel UTP kat.6',        'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.5),
('utp kat 6',          'KNR 5-06 0101-01', 'Kabel UTP kat.6',        'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.5),
('utp cat6a',          'KNR 5-06 0101-02', 'Kabel UTP kat.6a',       'robocizna', false, NULL, 0.025, 'mb', 'kable_slabopradowe', 1.5),
('ftp 5e',             'KNR 5-06 0101-01', 'Kabel FTP kat.5e',       'robocizna', false, NULL, 0.020, 'mb', 'kable_slabopradowe', 1.4),
('swiatlowood',        'KNR 5-06 0701-01', 'Kabel światłowodowy',    'robocizna', false, NULL, 0.025, 'mb', 'kable_slabopradowe', 1.0),
('swiatlowood',        'KNR 5-06 0701-01', 'Kabel światłowodowy',    'robocizna', false, NULL, 0.025, 'mb', 'kable_slabopradowe', 1.0),
('fiber',              'KNR 5-06 0701-01', 'Kabel światłowodowy',    'robocizna', false, NULL, 0.025, 'mb', 'kable_slabopradowe', 0.8),
('kabel optyczny',     'KNR 5-06 0701-01', 'Kabel światłowodowy',    'robocizna', false, NULL, 0.025, 'mb', 'kable_slabopradowe', 1.2),
('koncentryk',         'KNR 5-06 0601-01', 'Kabel RG-6 koaxialny',   'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.0),
('kabel tv',           'KNR 5-06 0601-01', 'Kabel RG-6 TV',          'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.2),
('kabel coaxialny',    'KNR 5-06 0601-01', 'Kabel koaxialny',        'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.2),
('rg6',                'KNR 5-06 0601-01', 'Kabel RG-6',             'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.3),
('rg59',               'KNR 5-06 0601-01', 'Kabel RG-59',            'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.3),
('hdmi',               'KNR 5-06 0501-01', 'Kabel HDMI/AV',          'robocizna', false, NULL, 0.15, 'szt',   'kable_slabopradowe', 0.9),
('kabel hdmi',         'KNR 5-06 0501-01', 'Kabel HDMI',             'robocizna', false, NULL, 0.15, 'szt',   'kable_slabopradowe', 1.2),
('alarmowy',           'KNR 5-07 0501-01', 'Kabel alarmowy YTKSY',   'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 0.9),
('ytksy',              'KNR 5-07 0501-01', 'Kabel YTKSY',            'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.0),
('jy st y',            'KNR 5-07 0501-01', 'Kabel YTKSY',            'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.0),
('jysty',              'KNR 5-07 0501-01', 'Kabel YTKSY',            'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.0),
('kabel alarmowy',     'KNR 5-07 0501-01', 'Kabel alarmowy',         'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.2),
('kabel sswin',        'KNR 5-07 0501-01', 'Kabel SSWiN',            'robocizna', false, NULL, 0.015, 'mb', 'kable_slabopradowe', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- RURY I TRASY KABLOWE (Pipes, conduits, trays)
-- ═══════════════════════════════════════════════════════════════

('peszel',             'KNR 5-04 0801-01', 'Rura instalacyjna M20',   'robocizna', false, NULL, 0.015, 'mb', 'rury_trasy', 1.0),
('peszel m20',         'KNR 5-04 0801-01', 'Rura instalacyjna M20',   'robocizna', false, NULL, 0.015, 'mb', 'rury_trasy', 1.5),
('rura karbowana',     'KNR 5-04 0801-01', 'Rura karbowana M20',      'robocizna', false, NULL, 0.015, 'mb', 'rury_trasy', 1.2),
('rura gieta',         'KNR 5-04 0801-01', 'Rura giętka M20',         'robocizna', false, NULL, 0.015, 'mb', 'rury_trasy', 1.0),
('rura m20',           'KNR 5-04 0801-01', 'Rura instalacyjna M20',   'robocizna', false, NULL, 0.015, 'mb', 'rury_trasy', 1.5),
('rura m25',           'KNR 5-04 0801-02', 'Rura instalacyjna M25',   'robocizna', false, NULL, 0.020, 'mb', 'rury_trasy', 1.5),
('rura m32',           'KNR 5-04 0801-03', 'Rura instalacyjna M32',   'robocizna', false, NULL, 0.025, 'mb', 'rury_trasy', 1.5),
('rura m16',           'KNR 5-04 0801-01', 'Rura instalacyjna M16',   'robocizna', false, NULL, 0.012, 'mb', 'rury_trasy', 1.5),
('rura pvcu',          'KNR 5-04 0801-01', 'Rura PVC-U instalacyjna', 'robocizna', false, NULL, 0.015, 'mb', 'rury_trasy', 1.0),
('arot',               'KNR 5-08 0301-01', 'Rura sztywna PVC (AROT)', 'robocizna', false, NULL, 0.025, 'mb', 'rury_trasy', 1.0),
('rura sztywna',       'KNR 5-08 0301-01', 'Rura sztywna PVC',        'robocizna', false, NULL, 0.025, 'mb', 'rury_trasy', 1.1),
('rura pvc',           'KNR 5-08 0301-01', 'Rura sztywna PVC',        'robocizna', false, NULL, 0.025, 'mb', 'rury_trasy', 0.9),
('korytko',            'KNR 5-08 0101-01', 'Koryto kablowe 60×40',    'robocizna', false, NULL, 0.08,  'mb', 'rury_trasy', 1.0),
('koryto kablowe',     'KNR 5-08 0101-01', 'Koryto kablowe 60×40',    'robocizna', false, NULL, 0.08,  'mb', 'rury_trasy', 1.2),
('koryto',             'KNR 5-08 0101-01', 'Koryto kablowe',          'robocizna', false, NULL, 0.08,  'mb', 'rury_trasy', 0.9),
('kanalka',            'KNR 5-08 0101-01', 'Kanałka kablowa',         'robocizna', false, NULL, 0.08,  'mb', 'rury_trasy', 0.9),
('drabinka',           'KNR 5-08 0201-01', 'Drabinka kablowa 200mm',  'robocizna', false, NULL, 0.15,  'mb', 'rury_trasy', 1.0),
('drabinka kablowa',   'KNR 5-08 0201-01', 'Drabinka kablowa 200mm',  'robocizna', false, NULL, 0.15,  'mb', 'rury_trasy', 1.2),
('koryto siatkowe',    'KNR 5-08 0201-01', 'Koryto siatkowe',         'robocizna', false, NULL, 0.15,  'mb', 'rury_trasy', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- PROWADZENIE KABLI (Chasing / routing)
-- ═══════════════════════════════════════════════════════════════

('bruzda',             'KNR 5-04 0701-01', 'Bruzda w tynku /mb',      'robocizna', false, NULL, 0.06,  'mb', 'prowadzenie', 1.0),
('kucie',              'KNR 5-04 0701-01', 'Kucie bruzdy /mb',         'robocizna', false, NULL, 0.06,  'mb', 'prowadzenie', 1.0),
('rowek',              'KNR 5-04 0701-01', 'Rowek pod kabel /mb',      'robocizna', false, NULL, 0.06,  'mb', 'prowadzenie', 0.9),
('kucie w betonie',    'KNR 5-04 0701-02', 'Kucie bruzdy w betonie',   'robocizna', false, NULL, 0.12,  'mb', 'prowadzenie', 1.3),
('bruzda beton',       'KNR 5-04 0701-02', 'Bruzda w betonie /mb',     'robocizna', false, NULL, 0.12,  'mb', 'prowadzenie', 1.3),
('przepust',           'KNR 5-04 0702-01', 'Przepust przez przegrodę', 'robocizna', false, NULL, 0.20,  'szt','prowadzenie', 1.0),
('przebicie',          'KNR 5-04 0702-01', 'Przebicie przez ścianę',   'robocizna', false, NULL, 0.20,  'szt','prowadzenie', 0.9),

-- ═══════════════════════════════════════════════════════════════
-- APARATURA DIN (Breakers, RCDs, SPDs)
-- ═══════════════════════════════════════════════════════════════

('roznicowka',         'KNR 5-04 0501-03', 'RCD 2P 40A/30mA',         'robocizna', false, NULL, 0.30,  'szt', 'aparatura', 1.0),
('rcd',                'KNR 5-04 0501-03', 'RCD 2P 40A/30mA',         'robocizna', false, NULL, 0.30,  'szt', 'aparatura', 1.0),
('wylacznik roznicowopradowy', 'KNR 5-04 0501-03', 'RCD wyłącznik różnicowoprądowy', 'robocizna', false, NULL, 0.30, 'szt', 'aparatura', 1.3),
('eska',               'KNR 5-04 0501-01', 'MCB 1P wyłącznik nadprądowy', 'robocizna', false, NULL, 0.15, 'szt', 'aparatura', 1.0),
('bezpiecznik',        'KNR 5-04 0501-01', 'MCB bezpiecznik',          'robocizna', false, NULL, 0.15,  'szt', 'aparatura', 0.9),
('mcb',                'KNR 5-04 0501-01', 'MCB wyłącznik nadprądowy', 'robocizna', false, NULL, 0.15,  'szt', 'aparatura', 1.0),
('wylacznik nadpradowy','KNR 5-04 0501-01','MCB wyłącznik nadprądowy', 'robocizna', false, NULL, 0.15,  'szt', 'aparatura', 1.2),
('automat',            'KNR 5-04 0501-01', 'MCB automat wyłączający',  'robocizna', false, NULL, 0.15,  'szt', 'aparatura', 0.9),
('wylacznik 1p',       'KNR 5-04 0501-01', 'MCB 1P',                  'robocizna', false, NULL, 0.15,  'szt', 'aparatura', 1.3),
('wylacznik 3p',       'KNR 5-04 0501-02', 'MCB 3P wyłącznik nadprądowy', 'robocizna', false, NULL, 0.25, 'szt', 'aparatura', 1.3),
('mcb 3p',             'KNR 5-04 0501-02', 'MCB 3P',                  'robocizna', false, NULL, 0.25,  'szt', 'aparatura', 1.3),
('rcbo',               'KNR 5-04 0501-04', 'RCBO kombiautomat',        'robocizna', false, NULL, 0.20,  'szt', 'aparatura', 1.0),
('kombiautomat',       'KNR 5-04 0501-04', 'RCBO kombiautomat',        'robocizna', false, NULL, 0.20,  'szt', 'aparatura', 1.0),
('ochronnik przepieciowy', 'KNR 5-04 0901-01', 'SPD ochronnik przepięciowy', 'robocizna', false, NULL, 0.50, 'szt', 'aparatura', 1.2),
('ochronnik',          'KNR 5-04 0901-01', 'SPD ochronnik',            'robocizna', false, NULL, 0.50,  'szt', 'aparatura', 0.9),
('przepiecowka',       'KNR 5-04 0901-01', 'SPD ochronnik przepięciowy', 'robocizna', false, NULL, 0.50, 'szt', 'aparatura', 1.0),
('spd',                'KNR 5-04 0901-01', 'SPD ochronnik',            'robocizna', false, NULL, 0.50,  'szt', 'aparatura', 1.0),
('odgromnik',          'KNR 5-04 0901-01', 'SPD ochronnik przepięć',   'robocizna', false, NULL, 0.50,  'szt', 'aparatura', 1.0),
('rozlacznik izolacyjny','KNR 5-04 0701-01','Rozłącznik izolacyjny',   'robocizna', false, NULL, 0.25,  'szt', 'aparatura', 1.1),
('lampka faz',         'KNR 5-04 0401-02', 'Sygnalizator lampka faz',  'robocizna', false, NULL, 0.20,  'szt', 'aparatura', 1.0),
('sygnalizator',       'KNR 5-04 0401-02', 'Sygnalizator/lampka',      'robocizna', false, NULL, 0.20,  'szt', 'aparatura', 0.8),
('przekaznik',         'KNR 5-04 0302-01', 'Przekaźnik instalacyjny',  'robocizna', false, NULL, 0.30,  'szt', 'aparatura', 0.8),
('przekaznik czasowy', 'KNR 5-04 0302-02', 'Przekaźnik czasowy',       'robocizna', false, NULL, 0.35,  'szt', 'aparatura', 1.2),
('regulator',          'KNR 5-08 0295-02', 'Regulator/moduł automatyki','robocizna', false, NULL, 0.40, 'szt', 'aparatura', 0.7),
('stycznik',           'KNR 5-04 0303-01', 'Stycznik 3P',              'robocizna', false, NULL, 0.45,  'szt', 'aparatura', 1.0),
('falownik',           'KNR 5-08 0295-04', 'Falownik VFD montaż',      'robocizna', false, NULL, 2.00,  'szt', 'aparatura', 1.0),
('softstart',          'KNR 5-08 0295-04', 'Softstart montaż',         'robocizna', false, NULL, 1.50,  'szt', 'aparatura', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA I WYŁĄCZNIKI (Sockets, switches)
-- ═══════════════════════════════════════════════════════════════

('gniazdo',            'KNR 5-04 0301-01', 'Gniazdo 230V wtyczkowe',   'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.0),
('gniazdko',           'KNR 5-04 0301-01', 'Gniazdo 230V wtyczkowe',   'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.0),
('kontakt',            'KNR 5-04 0301-01', 'Gniazdo 230V',             'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 0.9),
('gniazdo 230',        'KNR 5-04 0301-01', 'Gniazdo 230V',             'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo schuko',     'KNR 5-04 0301-01', 'Gniazdo Schuko',           'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo 2x',         'KNR 5-04 0301-02', 'Gniazdo 230V 2-gniazdowe', 'robocizna', false, NULL, 0.25, 'szt', 'gniazda_wylaczniki', 1.1),
('gniazdo 400',        'KNR 5-04 0301-03', 'Gniazdo siłowe 400V',      'robocizna', false, NULL, 0.40, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo silowe',     'KNR 5-04 0301-03', 'Gniazdo siłowe 3F',        'robocizna', false, NULL, 0.40, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo 3f',         'KNR 5-04 0301-03', 'Gniazdo siłowe 3F',        'robocizna', false, NULL, 0.40, 'szt', 'gniazda_wylaczniki', 1.2),
('cee 16a',            'KNR 5-04 0301-03', 'Gniazdo CEE 16A',          'robocizna', false, NULL, 0.40, 'szt', 'gniazda_wylaczniki', 1.3),
('cee 32a',            'KNR 5-04 0301-04', 'Gniazdo CEE 32A',          'robocizna', false, NULL, 0.50, 'szt', 'gniazda_wylaczniki', 1.3),
('wylacznik',          'KNR 5-04 0201-01', 'Łącznik instalacyjny',      'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 0.9),
('lacznik',            'KNR 5-04 0201-01', 'Łącznik instalacyjny',      'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 1.0),
('klawisz',            'KNR 5-04 0201-01', 'Łącznik klawiszowy',        'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 0.9),
('wlacznik',           'KNR 5-04 0201-01', 'Łącznik instalacyjny',      'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 0.9),
('wylacznik schodowy', 'KNR 5-04 0201-02', 'Wyłącznik schodowy',        'robocizna', false, NULL, 0.25, 'szt', 'gniazda_wylaczniki', 1.3),
('gniazdo rj45',       'KNR 5-06 0201-01', 'Gniazdo RJ45 kat.6',        'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo lan',        'KNR 5-06 0201-01', 'Gniazdo RJ45 kat.6',        'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 1.2),
('keystone',           'KNR 5-06 0501-01', 'Wkładka keystonowa RJ45',   'robocizna', false, NULL, 0.05, 'szt', 'gniazda_wylaczniki', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- OPRAWY OŚWIETLENIOWE (Lighting fixtures)
-- ═══════════════════════════════════════════════════════════════

('oprawa led',         'KNR 5-04 0401-01', 'Oprawa LED natynkowa',      'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.2),
('lampa',              'KNR 5-04 0401-01', 'Oprawa oświetleniowa',      'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 0.8),
('oprawa',             'KNR 5-04 0401-01', 'Oprawa oświetleniowa',      'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 0.9),
('oprawy',             'KNR 5-04 0401-01', 'Oprawy oświetleniowe',      'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 0.8),
('downlight',          'KNR 5-04 0401-02', 'Oprawa LED podtynkowa',     'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.0),
('led panel',          'KNR 5-04 0401-02', 'Panel LED podtynkowy',      'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.1),
('panel led',          'KNR 5-04 0401-02', 'Panel LED',                 'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.1),
('oprawa awaryjna',    'KNR 5-04 0401-03', 'Oprawa awaryjno-ewakuacyjna','robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.2),
('listwa led',         'KNR 5-04 0401-04', 'Listwa/taśma LED',          'robocizna', false, NULL, 0.08, 'mb', 'oswietlenie', 1.0),
('tasma led',          'KNR 5-04 0401-04', 'Taśma LED',                 'robocizna', false, NULL, 0.08, 'mb', 'oswietlenie', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- ROZDZIELNICE (Distribution boards)
-- ═══════════════════════════════════════════════════════════════

('rozdzielnica',       'KNR 5-04 0601-01', 'Rozdzielnica montaż',       'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.0),
('rozdzielnia',        'KNR 5-04 0601-01', 'Rozdzielnica montaż',       'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.0),
('tablice rozdzielcza','KNR 5-04 0601-01', 'Tablica rozdzielcza',       'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.1),
('tablica',            'KNR 5-04 0601-01', 'Tablica rozdzielcza',       'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 0.8),
('skrzynka elektryczna','KNR 5-04 0601-01','Skrzynka elektryczna',      'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.0),
('puszka rozgalezna',  'KNR 5-04 0602-01', 'Puszka rozgałęźna',         'robocizna', false, NULL, 0.25, 'szt', 'rozdzielnice', 1.0),
('puszka instalacyjna','KNR 5-04 0602-01', 'Puszka instalacyjna',       'robocizna', false, NULL, 0.25, 'szt', 'rozdzielnice', 1.0),
('puszka',             'KNR 5-04 0602-01', 'Puszka montażowa',          'robocizna', false, NULL, 0.25, 'szt', 'rozdzielnice', 0.8),

-- ═══════════════════════════════════════════════════════════════
-- IT / SIEĆ KOMPUTEROWA (Network infrastructure)
-- ═══════════════════════════════════════════════════════════════

('patch panel',        'KNR 5-06 0301-01', 'Patchpanel 24p montaż',     'robocizna', false, NULL, 0.45, 'szt', 'it_siec', 1.2),
('patchpanel',         'KNR 5-06 0301-01', 'Patchpanel 24p montaż',     'robocizna', false, NULL, 0.45, 'szt', 'it_siec', 1.2),
('switch',             'KNR 5-06 0302-01', 'Switch sieciowy montaż',    'robocizna', false, NULL, 0.30, 'szt', 'it_siec', 0.8),
('switch poe',         'KNR 5-06 0302-01', 'Switch PoE montaż',         'robocizna', false, NULL, 0.30, 'szt', 'it_siec', 1.1),
('szafa rack',         'KNR 5-06 0401-01', 'Szafa rack 12U montaż',     'robocizna', false, NULL, 0.90, 'szt', 'it_siec', 1.2),
('rack 12u',           'KNR 5-06 0401-01', 'Szafa rack 12U',            'robocizna', false, NULL, 0.90, 'szt', 'it_siec', 1.3),
('rack 42u',           'KNR 5-06 0401-02', 'Szafa rack 42U',            'robocizna', false, NULL, 2.50, 'szt', 'it_siec', 1.3),
('access point',       'KNR 5-06 0303-01', 'Access point WiFi montaż',  'robocizna', false, NULL, 0.40, 'szt', 'it_siec', 1.0),
('ap wifi',            'KNR 5-06 0303-01', 'Access point WiFi',         'robocizna', false, NULL, 0.40, 'szt', 'it_siec', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- SYSTEMY BEZPIECZEŃSTWA (Security, alarm, CCTV, access control)
-- ═══════════════════════════════════════════════════════════════

('kamera ip',          'KNR 5-07 0101-01', 'Kamera IP montaż',          'robocizna', false, NULL, 1.20, 'szt', 'bezpieczenstwo', 1.2),
('kamera',             'KNR 5-07 0101-01', 'Kamera montaż',             'robocizna', false, NULL, 1.20, 'szt', 'bezpieczenstwo', 0.8),
('kamera cctv',        'KNR 5-07 0101-01', 'Kamera CCTV montaż',        'robocizna', false, NULL, 1.20, 'szt', 'bezpieczenstwo', 1.2),
('nvr',                'KNR 5-07 0201-01', 'Rejestrator NVR montaż',    'robocizna', false, NULL, 1.50, 'szt', 'bezpieczenstwo', 1.0),
('rejestrator',        'KNR 5-07 0201-01', 'Rejestrator NVR/DVR',       'robocizna', false, NULL, 1.50, 'szt', 'bezpieczenstwo', 0.9),
('czujnik pir',        'KNR 5-07 0301-01', 'Czujnik PIR montaż',        'robocizna', false, NULL, 0.30, 'szt', 'bezpieczenstwo', 1.2),
('czujnik ruchu',      'KNR 5-07 0301-01', 'Czujnik ruchu PIR',         'robocizna', false, NULL, 0.30, 'szt', 'bezpieczenstwo', 1.1),
('centrala alarmowa',  'KNR 5-07 0401-01', 'Centrala alarmowa montaż',  'robocizna', false, NULL, 2.00, 'szt', 'bezpieczenstwo', 1.3),
('czytnik rfid',       'KNR 5-07 0601-01', 'Czytnik RFID kontrola dostępu', 'robocizna', false, NULL, 0.60, 'szt', 'bezpieczenstwo', 1.2),
('elektrozaczep',      'KNR 5-07 0601-02', 'Elektrozaczep montaż',      'robocizna', false, NULL, 0.45, 'szt', 'bezpieczenstwo', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- ZESTAWY KOMPOZYTOWE (Smart Assemblies — is_composite = true)
-- Każdy zestaw rozbija się na indywidualne kody KNR
-- ═══════════════════════════════════════════════════════════════

('zestaw gniazd',
 'KNR 5-04 0301-01',
 'Zestaw: Gniazdo 230V (gniazdo + puszka + kabel + bruzda)',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-04 0301-01","type":"robocizna","label":"Montaż gniazda 230V","labor_norm_rbh":0.22,"unit":"szt"},{"knr_ref":"KNR 5-04 0101-01","type":"robocizna","label":"Okablowanie YDYp 3x1.5","labor_norm_rbh":0.025,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"},{"knr_ref":"KNR 5-04 0701-01","type":"robocizna","label":"Bruzda w tynku","labor_norm_rbh":0.06,"unit":"mb"}]',
 0.22, 'szt', 'zestawy', 1.5),

('punkt oswietleniowy',
 'KNR 5-04 0401-01',
 'Zestaw: Punkt oświetleniowy (oprawa + łącznik + kabel + puszka + bruzda)',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-04 0401-01","type":"robocizna","label":"Montaż oprawy LED","labor_norm_rbh":0.40,"unit":"szt"},{"knr_ref":"KNR 5-04 0201-01","type":"robocizna","label":"Łącznik oświetlenia","labor_norm_rbh":0.20,"unit":"szt"},{"knr_ref":"KNR 5-04 0101-01","type":"robocizna","label":"Okablowanie YDYp 3x1.5","labor_norm_rbh":0.025,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"},{"knr_ref":"KNR 5-04 0701-01","type":"robocizna","label":"Bruzda w tynku","labor_norm_rbh":0.06,"unit":"mb"}]',
 0.40, 'szt', 'zestawy', 1.5),

('wypust oswietleniowy',
 'KNR 5-04 0401-01',
 'Zestaw: Wypust oświetleniowy (punkt bez łącznika)',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-04 0401-01","type":"robocizna","label":"Montaż oprawy LED","labor_norm_rbh":0.40,"unit":"szt"},{"knr_ref":"KNR 5-04 0101-01","type":"robocizna","label":"Okablowanie YDYp 3x1.5","labor_norm_rbh":0.025,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"},{"knr_ref":"KNR 5-04 0701-01","type":"robocizna","label":"Bruzda w tynku","labor_norm_rbh":0.06,"unit":"mb"}]',
 0.40, 'szt', 'zestawy', 1.5),

('zasilanie rolety',
 'KNR 5-04 0301-01',
 'Zestaw: Zasilanie rolety elektrycznej',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-04 0301-01","type":"robocizna","label":"Gniazdo 230V do rolety","labor_norm_rbh":0.22,"unit":"szt"},{"knr_ref":"KNR 5-04 0101-01","type":"robocizna","label":"Okablowanie YDYp 3x1.5","labor_norm_rbh":0.025,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"},{"knr_ref":"KNR 5-04 0701-01","type":"robocizna","label":"Bruzda w tynku","labor_norm_rbh":0.06,"unit":"mb"}]',
 0.22, 'szt', 'zestawy', 1.5),

('punkt agd',
 'KNR 5-04 0301-01',
 'Zestaw: Punkt AGD 230V 16A',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-04 0301-01","type":"robocizna","label":"Gniazdo AGD 230V 16A","labor_norm_rbh":0.22,"unit":"szt"},{"knr_ref":"KNR 5-04 0101-02","type":"robocizna","label":"Okablowanie YDYp 3x2.5","labor_norm_rbh":0.030,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"},{"knr_ref":"KNR 5-04 0701-01","type":"robocizna","label":"Bruzda w tynku","labor_norm_rbh":0.06,"unit":"mb"}]',
 0.22, 'szt', 'zestawy', 1.5),

('zasilanie plyty indukcyjnej',
 'KNR 5-04 0301-03',
 'Zestaw: Zasilanie płyty indukcyjnej 400V',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-04 0301-03","type":"robocizna","label":"Gniazdo siłowe 400V","labor_norm_rbh":0.40,"unit":"szt"},{"knr_ref":"KNR 5-04 0101-03","type":"robocizna","label":"Okablowanie YDYp 5x2.5","labor_norm_rbh":0.035,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"},{"knr_ref":"KNR 5-04 0701-01","type":"robocizna","label":"Bruzda w tynku","labor_norm_rbh":0.06,"unit":"mb"}]',
 0.40, 'szt', 'zestawy', 1.5),

('punkt tv',
 'KNR 5-06 0201-01',
 'Zestaw: Punkt TV-SAT (gniazdo + kabel RG-6 + puszka)',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-06 0201-01","type":"robocizna","label":"Gniazdo antenowe TV-SAT","labor_norm_rbh":0.20,"unit":"szt"},{"knr_ref":"KNR 5-06 0601-01","type":"robocizna","label":"Kabel RG-6","labor_norm_rbh":0.015,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"}]',
 0.20, 'szt', 'zestawy', 1.5),

('punkt lan',
 'KNR 5-06 0201-01',
 'Zestaw: Punkt LAN (gniazdo RJ45 + kabel UTP + puszka)',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-06 0201-01","type":"robocizna","label":"Gniazdo RJ45 kat.6","labor_norm_rbh":0.20,"unit":"szt"},{"knr_ref":"KNR 5-06 0101-01","type":"robocizna","label":"Kabel UTP kat.6","labor_norm_rbh":0.020,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"}]',
 0.20, 'szt', 'zestawy', 1.5),

('punkt sieci',
 'KNR 5-06 0201-01',
 'Zestaw: Punkt sieciowy LAN',
 'zestaw', true,
 '[{"knr_ref":"KNR 5-06 0201-01","type":"robocizna","label":"Gniazdo RJ45 kat.6","labor_norm_rbh":0.20,"unit":"szt"},{"knr_ref":"KNR 5-06 0101-01","type":"robocizna","label":"Kabel UTP kat.6","labor_norm_rbh":0.020,"unit":"mb"},{"knr_ref":"KNR 5-04 0602-01","type":"robocizna","label":"Puszka instalacyjna","labor_norm_rbh":0.25,"unit":"szt"}]',
 0.20, 'szt', 'zestawy', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- DODATKOWE SŁOWA KLUCZOWE (Common Polish electrician phrases)
-- ═══════════════════════════════════════════════════════════════

('listwa podparapetowa',     'KNR 5-08 0101-01', 'Listwa podparapetowa montaż',    'robocizna', false, NULL, 0.08,  'mb',  'rury_trasy',         1.5),
('listwa naścienna',         'KNR 5-08 0101-01', 'Listwa naścienna montaż',        'robocizna', false, NULL, 0.08,  'mb',  'rury_trasy',         1.4),
('dolozenie listwy',         'KNR 5-08 0101-01', 'Dołożenie listwy kablowej',      'robocizna', false, NULL, 0.08,  'mb',  'rury_trasy',         1.4),
('doprowadzenie zasilania',  'KNR 5-04 0101-01', 'Doprowadzenie zasilania 230V',   'robocizna', false, NULL, 0.35,  'szt', 'aparatura',          1.3),
('doprowadzenie kabla',      'KNR 5-04 0101-01', 'Doprowadzenie kabla',            'robocizna', false, NULL, 0.35,  'szt', 'aparatura',          1.2),
('podlaczenie zasilania',    'KNR 5-04 0101-01', 'Podłączenie zasilania',          'robocizna', false, NULL, 0.30,  'szt', 'aparatura',          1.2),
('przejscie pozarowe',       'KNR 5-04 0702-01', 'Przejście pożarowe uszczelnienie','robocizna',false, NULL, 0.40,  'szt', 'prowadzenie',        1.3),
('uszczelnienie przejscia',  'KNR 5-04 0702-01', 'Uszczelnienie przejścia ppoż',   'robocizna', false, NULL, 0.40,  'szt', 'prowadzenie',        1.3),
('montaz oprawy',            'KNR 5-04 0401-01', 'Montaż oprawy oświetleniowej',   'robocizna', false, NULL, 0.40,  'szt', 'oswietlenie',        1.3),
('montaz oswietlenia',       'KNR 5-04 0401-01', 'Montaż oświetlenia',             'robocizna', false, NULL, 0.40,  'szt', 'oswietlenie',        1.2),
('gniazdo ip20',             'KNR 5-04 0301-01', 'Gniazdo 230V IP20',              'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo ip44',             'KNR 5-04 0301-01', 'Gniazdo 230V IP44',              'robocizna', false, NULL, 0.25,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo ip65',             'KNR 5-04 0301-03', 'Gniazdo 230V IP65 zewnętrzne',   'robocizna', false, NULL, 0.30,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo 16a',              'KNR 5-04 0301-01', 'Gniazdo 230V 16A',               'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.3),
('gniazdo 1x230',            'KNR 5-04 0301-01', 'Gniazdo 1×230V',                 'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.4),
('gniazdo 2x230',            'KNR 5-04 0301-02', 'Gniazdo 2×230V',                 'robocizna', false, NULL, 0.25,  'szt', 'gniazda_wylaczniki', 1.4),
('punkt 2xdata',             'KNR 5-06 0201-01', 'Punkt 2×DATA (2×RJ45)',          'robocizna', false, NULL, 0.35,  'szt', 'gniazda_wylaczniki', 1.4),
('punkt data',               'KNR 5-06 0201-01', 'Punkt DATA (RJ45)',              'robocizna', false, NULL, 0.20,  'szt', 'gniazda_wylaczniki', 1.3),
('laczenie 53600',           'KNR 5-04 0501-01', 'Łączenie S360Ø / złącze',        'robocizna', false, NULL, 0.20,  'szt', 'aparatura',          1.0),
('laczenie',                 'KNR 5-04 0501-01', 'Łączenie obwodu',                'robocizna', false, NULL, 0.20,  'szt', 'aparatura',          0.7),
('szafa lan',                'KNR 5-06 0401-01', 'Szafa LAN rack montaż',          'robocizna', false, NULL, 0.90,  'szt', 'it_siec',            1.3),
('szafa serwerowa',          'KNR 5-06 0401-01', 'Szafa serwerowa rack montaż',    'robocizna', false, NULL, 0.90,  'szt', 'it_siec',            1.3),
('montaz kd',                'KNR 5-07 0601-01', 'Montaż kontroli dostępu KD',     'robocizna', false, NULL, 0.60,  'szt', 'bezpieczenstwo',     1.3),
('kontrola dostepu',         'KNR 5-07 0601-01', 'Kontrola dostępu montaż',        'robocizna', false, NULL, 0.60,  'szt', 'bezpieczenstwo',     1.2),
('montaz czujnika',          'KNR 5-07 0301-01', 'Montaż czujnika',                'robocizna', false, NULL, 0.30,  'szt', 'bezpieczenstwo',     1.0),
('instalacja elektryczna',   'KNR 5-04 0101-01', 'Instalacja elektryczna ogólna',  'robocizna', false, NULL, 0.35,  'mb',  'rury_trasy',         0.7),
('punkt elektryczny',        'KNR 5-04 0301-01', 'Punkt elektryczny 230V',         'robocizna', false, NULL, 0.22,  'szt', 'gniazda_wylaczniki', 1.1)

ON CONFLICT (keyword_normalized) DO NOTHING;

-- Summary comment
COMMENT ON TABLE es_dictionary IS
  'ES-Engine semantic dictionary v1.0 — ~140 Polish installer slang entries. '
  'Auto-normalized via trigger (unaccent + lowercase). '
  'Supports 4-phase matching: Exact → Fuzzy(pg_trgm) → Regex → LLM.';
