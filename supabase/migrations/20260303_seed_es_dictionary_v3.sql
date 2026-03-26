-- ============================================================
-- ES-Engine Dictionary Seed v3.0 — Real project items coverage
-- Based on analysis of Demo_Kosztorys project actual item names
-- Covers: WLZ/YKY cables, kasety, listwy, detektory, puszki,
-- NHXH/NHXMH, szyna wyrownania, zestawy gniazd, UPS prace
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- LINIE WLZ / YKY — Wewnętrzne linie zasilające
-- ═══════════════════════════════════════════════════════════════

('linia wlz',                    'KNR 5-04 0102-01', 'Linia WLZ montaz',                     'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.2),
('linie wlz',                    'KNR 5-04 0102-01', 'Linie WLZ montaz',                     'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.2),
('wlz',                          'KNR 5-04 0102-01', 'WLZ montaz',                           'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.0),
('yky',                          'KNR 5-04 0102-01', 'Kabel YKY montaz',                     'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.0),
('ykyzo',                        'KNR 5-04 0102-01', 'Kabel YKYzo montaz',                   'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.1),
('yky 3x6',                      'KNR 5-04 0102-01', 'Kabel YKY 3x6',                       'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x6',                      'KNR 5-04 0102-02', 'Kabel YKY 5x6',                       'robocizna', false, NULL, 2.20, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x10',                     'KNR 5-04 0102-02', 'Kabel YKY 5x10',                      'robocizna', false, NULL, 2.50, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x16',                     'KNR 5-04 0102-03', 'Kabel YKY 5x16',                      'robocizna', false, NULL, 3.00, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x35',                     'KNR 5-04 0102-04', 'Kabel YKY 5x35',                      'robocizna', false, NULL, 3.50, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x50',                     'KNR 5-04 0102-04', 'Kabel YKY 5x50',                      'robocizna', false, NULL, 4.00, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x95',                     'KNR 5-04 0102-05', 'Kabel YKY 5x95',                      'robocizna', false, NULL, 5.00, '100mb', 'kable_silnopradowe', 1.5),
('yky 5x240',                    'KNR 5-04 0102-06', 'Kabel YKY 5x240',                     'robocizna', false, NULL, 6.00, '100mb', 'kable_silnopradowe', 1.5),
('yky 3x240',                    'KNR 5-04 0102-06', 'Kabel YKY 3x240',                     'robocizna', false, NULL, 6.00, '100mb', 'kable_silnopradowe', 1.5),
('linia wlz ykyzo 3x6',         'KNR 5-04 0102-01', 'Linia WLZ YKYzo 3x6',                 'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.8),
('linie wlz ykyzo 5x10',        'KNR 5-04 0102-02', 'Linie WLZ YKYzo 5x10',                'robocizna', false, NULL, 2.50, '100mb', 'kable_silnopradowe', 1.8),
('linia wlz yky 3x6',           'KNR 5-04 0102-01', 'Linia WLZ YKY 3x6',                   'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.8),
('linie wlz 5xyky 240',         'KNR 5-04 0102-06', 'Linie WLZ 5xYKY 240',                 'robocizna', false, NULL, 6.00, '100mb', 'kable_silnopradowe', 1.8),
('zasilanie ykyzo 5x6',         'KNR 5-04 0102-02', 'Zasilanie YKYzo 5x6',                 'robocizna', false, NULL, 2.20, '100mb', 'kable_silnopradowe', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- OKABLOWANIE YDYzo WARIANTY (z przecinkiem i kropką)
-- ═══════════════════════════════════════════════════════════════

('okablowanie ydyzo 3x2 5',     'KNR 5-04 0101-02', 'Okablowanie YDYzo 3x2.5',             'robocizna', false, NULL, 3.00, '100mb', 'kable_silnopradowe', 1.8),
('okablowanie ydyzo 3x1 5',     'KNR 5-04 0101-01', 'Okablowanie YDYzo 3x1.5',             'robocizna', false, NULL, 2.50, '100mb', 'kable_silnopradowe', 1.8),
('okablowanie ydyzo 4x1 5',     'KNR 5-04 0101-01', 'Okablowanie YDYzo 4x1.5',             'robocizna', false, NULL, 2.50, '100mb', 'kable_silnopradowe', 1.8),
('okablowanie ydy 2x1 5',       'KNR 5-04 0101-01', 'Okablowanie YDY 2x1.5',               'robocizna', false, NULL, 2.50, '100mb', 'kable_silnopradowe', 1.8),
('przewod lgyzo 16',            'KNR 5-04 0102-03', 'Przewod LgYzo 16mm2',                  'robocizna', false, NULL, 3.50, '100mb', 'kable_silnopradowe', 1.8),
('przewod lgyzo 6',             'KNR 5-04 0102-01', 'Przewod LgYzo 6mm2',                   'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.8),
('lgyzo 16',                    'KNR 5-04 0102-03', 'Kabel LgYzo 16mm2',                    'robocizna', false, NULL, 3.50, '100mb', 'kable_silnopradowe', 1.5),
('lgyzo 6',                     'KNR 5-04 0102-01', 'Kabel LgYzo 6mm2',                     'robocizna', false, NULL, 1.80, '100mb', 'kable_silnopradowe', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- NHXH / NHXMH — Kable bezhalogenowe / p.poz
-- ═══════════════════════════════════════════════════════════════

('nhxh',                        'KNR 5-04 0102-01', 'Kabel NHXH bezhalogenowy',             'robocizna', false, NULL, 2.00, '100mb', 'kable_silnopradowe', 1.1),
('nhxh 3x2 5',                  'KNR 5-04 0102-01', 'Kabel NHXH 3x2.5',                    'robocizna', false, NULL, 2.00, '100mb', 'kable_silnopradowe', 1.5),
('nhxmh',                       'KNR 5-04 0102-01', 'Kabel NHXMHom bezhalogenowy',          'robocizna', false, NULL, 2.00, '100mb', 'kable_silnopradowe', 1.1),
('zasilanie sug nhxh 3x2 5',   'KNR 5-04 0102-01', 'Zasilanie systemu SUG NHXH 3x2.5',    'robocizna', false, NULL, 2.00, '100mb', 'kable_silnopradowe', 1.8),
('kabel ppoz',                  'KNR 5-04 0102-01', 'Kabel p.poz. bezhalogenowy',           'robocizna', false, NULL, 2.00, '100mb', 'kable_silnopradowe', 1.2),
('hdgs',                        'KNR 5-04 0102-01', 'Kabel HDGs p.poz.',                    'robocizna', false, NULL, 2.00, '100mb', 'kable_silnopradowe', 1.1),

-- ═══════════════════════════════════════════════════════════════
-- TRASY KABLOWE (Cable trays — podstropowe, naścienne)
-- ═══════════════════════════════════════════════════════════════

('trasy kablowe',               'KNR 5-04 0701-01', 'Trasy kablowe montaz',                 'robocizna', false, NULL, 0.25, 'mb', 'rury_trasy', 1.1),
('trasy kablowe podstropowe',   'KNR 5-04 0701-01', 'Trasy kablowe podstropowe',            'robocizna', false, NULL, 0.35, 'mb', 'rury_trasy', 1.5),
('trasa kablowa',               'KNR 5-04 0701-01', 'Trasa kablowa montaz',                 'robocizna', false, NULL, 0.25, 'mb', 'rury_trasy', 1.1),
('korytko kablowe 100x50',      'KNR 5-04 0701-01', 'Korytko kablowe 100x50mm',             'robocizna', false, NULL, 0.25, 'mb', 'rury_trasy', 1.3),
('korytko kablowe 200x100',     'KNR 5-04 0701-02', 'Korytko kablowe 200x100mm',            'robocizna', false, NULL, 0.35, 'mb', 'rury_trasy', 1.3),
('drabinka kablowa',            'KNR 5-04 0701-03', 'Drabinka kablowa montaz',              'robocizna', false, NULL, 0.45, 'mb', 'rury_trasy', 1.1),
('listwa pcv',                  'KNR 5-04 0701-04', 'Listwa elektroinstalacyjna PCV',       'robocizna', false, NULL, 0.15, 'mb', 'rury_trasy', 1.2),
('listwa podparapetowa',        'KNR 5-04 0701-04', 'Listwa podparapetowa PCV',             'robocizna', false, NULL, 0.15, 'mb', 'rury_trasy', 1.3),
('listwa naradarzetna',         'KNR 5-04 0701-04', 'Listwa elektroinstalacyjna narazetna', 'robocizna', false, NULL, 0.12, 'mb', 'rury_trasy', 1.0),
('rury instalacyjne karbowane', 'KNR 5-04 0703-01', 'Rury instalacyjne karbowane montaz',  'robocizna', false, NULL, 0.08, 'mb', 'rury_trasy', 1.3),
('rury instalacyjne sztywne',   'KNR 5-04 0703-02', 'Rury instalacyjne sztywne montaz',    'robocizna', false, NULL, 0.10, 'mb', 'rury_trasy', 1.3),
('rura karbowana',              'KNR 5-04 0703-01', 'Rura karbowana montaz',               'robocizna', false, NULL, 0.08, 'mb', 'rury_trasy', 1.1),
('rura sztywna',                'KNR 5-04 0703-02', 'Rura sztywna montaz',                 'robocizna', false, NULL, 0.10, 'mb', 'rury_trasy', 1.1),
('bruzdowanie do lamp',         'KNR 5-04 0601-02', 'Bruzdowanie sciany do lamp',          'robocizna', false, NULL, 0.40, 'mb', 'prowadzenie', 1.3),
('przejscia ppoz',              'KNR 5-04 0702-02', 'Przejscia p.poz. uszczelnienie',      'robocizna', false, NULL, 0.40, 'szt', 'prowadzenie', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- PUSZKI (Boxes — rozgałęźne, instalacyjne)
-- ═══════════════════════════════════════════════════════════════

('puszki rozgalezne',           'KNR 5-04 0602-02', 'Puszki rozgalezne montaz',            'robocizna', false, NULL, 0.30, 'szt', 'prace_dodatkowe', 1.3),
('puszki rozgalezne natynkowe', 'KNR 5-04 0602-02', 'Puszki rozgalezne natynkowe',         'robocizna', false, NULL, 0.30, 'szt', 'prace_dodatkowe', 1.5),
('puszka rozgalezna',           'KNR 5-04 0602-02', 'Puszka rozgalezna montaz',            'robocizna', false, NULL, 0.30, 'szt', 'prace_dodatkowe', 1.2),
('puszka natynkowa',            'KNR 5-04 0602-02', 'Puszka natynkowa montaz',             'robocizna', false, NULL, 0.25, 'szt', 'prace_dodatkowe', 1.1),
('puszka',                      'KNR 5-04 0602-01', 'Puszka instalacyjna montaz',          'robocizna', false, NULL, 0.25, 'szt', 'prace_dodatkowe', 0.8),

-- ═══════════════════════════════════════════════════════════════
-- KASETY PODŁOGOWE / NAŚCIENNE (Floor/wall boxes)
-- ═══════════════════════════════════════════════════════════════

('kaseta podlogowa',            'KNR 5-04 0301-03', 'Kaseta podlogowa montaz',             'robocizna', false, NULL, 0.60, 'szt', 'gniazda_wylaczniki', 1.3),
('kaseta podlogowa 4x230v',     'KNR 5-04 0301-03', 'Kaseta podlogowa 4x230V',             'robocizna', false, NULL, 0.80, 'szt', 'gniazda_wylaczniki', 1.8),
('floorbox',                    'KNR 5-04 0301-03', 'Floorbox montaz',                     'robocizna', false, NULL, 0.60, 'szt', 'gniazda_wylaczniki', 1.1),
('gniazdo podlogowe',           'KNR 5-04 0301-03', 'Gniazdo podlogowe montaz',            'robocizna', false, NULL, 0.60, 'szt', 'gniazda_wylaczniki', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- ZESTAWY GNIAZD (Composite socket sets)
-- ═══════════════════════════════════════════════════════════════

('zestaw gniazd 2x230v',        'KNR 5-04 0301-01', 'Zestaw gniazd 2x230V',               'robocizna', false, NULL, 0.50, 'szt', 'zestawy', 1.5),
('zestaw gniazd 3x230v',        'KNR 5-04 0301-01', 'Zestaw gniazd 3x230V',               'robocizna', false, NULL, 0.70, 'szt', 'zestawy', 1.5),
('zestaw gniazd 4x230v',        'KNR 5-04 0301-01', 'Zestaw gniazd 4x230V',               'robocizna', false, NULL, 0.90, 'szt', 'zestawy', 1.5),
('zestaw gniazd data',          'KNR 5-04 0301-02', 'Zestaw gniazd DATA+230V',             'robocizna', false, NULL, 0.80, 'szt', 'zestawy', 1.5),
('zestaw gniazd 3xdata',        'KNR 5-04 0301-02', 'Zestaw gniazd 3xDATA+230V',          'robocizna', false, NULL, 1.00, 'szt', 'zestawy', 1.8),
('zestaw gniazd dla drukarek',  'KNR 5-04 0301-01', 'Zestaw gniazd dla drukarek 3x230V',  'robocizna', false, NULL, 0.70, 'szt', 'zestawy', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA RÓŻNE (Various sockets)
-- ═══════════════════════════════════════════════════════════════

('gniazdo 1x230 ip20',          'KNR 5-04 0301-01', 'Gniazdo 230V IP20 p/t',              'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.5),
('gniazdo 1x230 ip44',          'KNR 5-04 0301-01', 'Gniazdo 230V IP44 p/t',              'robocizna', false, NULL, 0.30, 'szt', 'gniazda_wylaczniki', 1.5),
('gniazdo ip44',                'KNR 5-04 0301-01', 'Gniazdo hermetyczne IP44',           'robocizna', false, NULL, 0.30, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo ip20',                'KNR 5-04 0301-01', 'Gniazdo 230V IP20',                  'robocizna', false, NULL, 0.22, 'szt', 'gniazda_wylaczniki', 1.2),
('gniazdo silowe cee',          'KNR 5-04 0302-01', 'Gniazdo silowe CEE 16A',             'robocizna', false, NULL, 0.60, 'szt', 'gniazda_wylaczniki', 1.3),
('laczniki oswietleniowe',      'KNR 5-04 0201-01', 'Laczniki oswietleniowe montaz',      'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 1.3),
('lacznik oswietleniowy',       'KNR 5-04 0201-01', 'Lacznik oswietleniowy montaz',       'robocizna', false, NULL, 0.20, 'szt', 'gniazda_wylaczniki', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- DETEKTORY OBECNOŚCI (Presence/motion detectors)
-- ═══════════════════════════════════════════════════════════════

('detektor obecnosci',          'KNR 5-04 0401-04', 'Detektor obecnosci montaz',           'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.3),
('detektory obecnosci',         'KNR 5-04 0401-04', 'Detektory obecnosci montaz',          'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.3),
('detektor obecnosci pomieszczeniowy', 'KNR 5-04 0401-04', 'Detektor obecnosci pomieszczeniowy', 'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.8),
('detektor obecnosci korytarzowy',     'KNR 5-04 0401-04', 'Detektor obecnosci korytarzowy z=20m', 'robocizna', false, NULL, 0.60, 'szt', 'oswietlenie', 1.8),
('czujnik ruchu',               'KNR 5-04 0401-04', 'Czujnik ruchu PIR montaz',            'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.1),
('czujnik pir',                 'KNR 5-04 0401-04', 'Czujnik PIR montaz',                  'robocizna', false, NULL, 0.50, 'szt', 'bezpieczenstwo', 1.1),

-- ═══════════════════════════════════════════════════════════════
-- SZYNA WYRÓWNANIA POTENCJAŁU (Equipotential bonding bar)
-- ═══════════════════════════════════════════════════════════════

('szyna wyrownania potencjalu', 'KNR 5-04 0802-01', 'Szyna wyrownania potencjalu',         'robocizna', false, NULL, 0.30, 'szt', 'uziemienie', 1.5),
('szyna wyrownawcza',           'KNR 5-04 0802-01', 'Szyna wyrownawcza Cu montaz',         'robocizna', false, NULL, 0.30, 'szt', 'uziemienie', 1.2),
('bednarka',                    'KNR 5-04 0801-03', 'Bednarka FeZn montaz',                'robocizna', false, NULL, 0.10, 'mb', 'uziemienie', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- TABLICE ELEKTRYCZNE (Distribution boards)
-- ═══════════════════════════════════════════════════════════════

('tablica elektryczna',         'KNR 5-04 0601-01', 'Tablica elektryczna montaz',          'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.2),
('tablice elektryczne',         'KNR 5-04 0601-01', 'Tablice elektryczne montaz',          'robocizna', false, NULL, 2.00, 'kpl', 'rozdzielnice', 1.2),
('rozdzielnia',                 'KNR 5-04 0601-01', 'Rozdzielnia elektryczna montaz',      'robocizna', false, NULL, 3.00, 'kpl', 'rozdzielnice', 1.1),
('rozdzielnica glowna',         'KNR 5-04 0601-02', 'Rozdzielnica glowna RGnn montaz',     'robocizna', false, NULL, 4.00, 'kpl', 'rozdzielnice', 1.5),
('rgnn',                        'KNR 5-04 0601-02', 'Rozdzielnica glowna RGnn',            'robocizna', false, NULL, 4.00, 'kpl', 'rozdzielnice', 1.3),
('wykorz istniejacego tablicy', 'KNR 5-04 0601-01', 'Wykorzystanie istniejacego tablicy',  'robocizna', false, NULL, 1.00, 'kpl', 'rozdzielnice', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- PRACE PRZY UPS / AGREGAT (UPS works)
-- ═══════════════════════════════════════════════════════════════

('ups',                         'KNR 5-04 1002-01', 'UPS montaz i uruchomienie',           'robocizna', false, NULL, 2.00, 'szt', 'aparatura', 1.0),
('prace przy ups',              'KNR 5-04 1002-01', 'Prace montazowe przy UPS',            'robocizna', false, NULL, 2.00, 'szt', 'aparatura', 1.3),
('podlaczenie ups',             'KNR 5-04 1002-01', 'Podlaczenie UPS do tablic',           'robocizna', false, NULL, 2.00, 'szt', 'aparatura', 1.5),
('agregat',                     'KNR 5-04 1002-02', 'Agregat pradotworczy montaz',         'robocizna', false, NULL, 4.00, 'szt', 'aparatura', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- DEMONTAŻE DODATKOWE
-- ═══════════════════════════════════════════════════════════════

('demontaze instalacji silowej',       'KNR 5-04 9901-01', 'Demontaz instalacji silowej',        'robocizna', false, NULL, 0.20, 'kpl', 'demontaz', 1.8),
('demontaze instalacji oswietleniowej','KNR 5-04 9903-01', 'Demontaz instalacji oswietleniowej', 'robocizna', false, NULL, 0.20, 'kpl', 'demontaz', 1.8),
('demontaze instalacji lan',           'KNR 5-04 9906-01', 'Demontaz instalacji LAN',            'robocizna', false, NULL, 0.15, 'kpl', 'demontaz', 1.8),
('demontaze instalacji',               'KNR 5-04 9901-01', 'Demontaze instalacji',               'robocizna', false, NULL, 0.20, 'kpl', 'demontaz', 1.3),
('demontaz instalacji lan',            'KNR 5-04 9906-01', 'Demontaz instalacji LAN',            'robocizna', false, NULL, 0.15, 'kpl', 'demontaz', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- OPRAWY OŚWIETLENIOWE dodatkowe
-- ═══════════════════════════════════════════════════════════════

('oprawy oswietlenia podstawowego',  'KNR 5-04 0401-01', 'Oprawy oswietlenia podstawowego LED', 'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.5),
('oprawa oswietlenia podstawowego',  'KNR 5-04 0401-01', 'Oprawa oswietlenia podstawowego LED', 'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.5),
('downlight led',                    'KNR 5-04 0401-02', 'Oprawa downlight LED podtynkowa',     'robocizna', false, NULL, 0.50, 'szt', 'oswietlenie', 1.3),
('panel led',                        'KNR 5-04 0401-01', 'Panel LED natynkowy montaz',          'robocizna', false, NULL, 0.40, 'szt', 'oswietlenie', 1.1),

-- ═══════════════════════════════════════════════════════════════
-- PRZEWÓD HDMI / MULTIMEDIALNE
-- ═══════════════════════════════════════════════════════════════

('przewod hdmi',                'KNR 5-04 0102-01', 'Przewod HDMI montaz',                 'robocizna', false, NULL, 0.30, 'mb', 'kable_slabopradowe', 1.0),
('kabel hdmi',                  'KNR 5-04 0102-01', 'Kabel HDMI montaz',                   'robocizna', false, NULL, 0.30, 'mb', 'kable_slabopradowe', 1.0),

-- ═══════════════════════════════════════════════════════════════
-- MATERIAŁY DODATKOWE / INNE
-- ═══════════════════════════════════════════════════════════════

('materialy dodatkowe',         'KNR 5-04 1202-01', 'Materialy dodatkowe montazowe',       'material',  false, NULL, 0.00, 'kpl', 'prace_dodatkowe', 0.7),
('inne prace',                  'KNR 5-04 1202-01', 'Inne prace nie wymienione',           'robocizna', false, NULL, 1.00, 'kpl', 'prace_dodatkowe', 0.7),
('prace nie wymienione',        'KNR 5-04 1202-01', 'Prace nie wymienione',                'robocizna', false, NULL, 1.00, 'kpl', 'prace_dodatkowe', 0.7),
('pomiary instalacji elektrycznej', 'KNR 5-04 1001-01', 'Pomiary instalacji elektrycznej', 'robocizna', false, NULL, 0.30, 'kpl', 'pomiary', 1.5)

ON CONFLICT (keyword_normalized) DO NOTHING;

COMMENT ON TABLE es_dictionary IS
  'ES-Engine semantic dictionary v3.0 — ~340+ Polish installer slang entries. '
  'v3.0: Added WLZ/YKY cables, kasety podlogowe, listwy PCV, detektory, puszki rozgalezne, NHXH, szyna wyrownania, zestawy gniazd. '
  'v2.0: demontaze, okablowanie variants, oprawy awaryjne/kierunkowe, pomiary. '
  'v1.0: Base 140 entries. Auto-normalized via trigger. 4-phase: Exact → Fuzzy → Regex → LLM.';
