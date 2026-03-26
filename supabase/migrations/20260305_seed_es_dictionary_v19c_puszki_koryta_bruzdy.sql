-- ES-Engine Dictionary Seed v19c -- PUSZKI, KORYTA, BRUZDY
INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES
-- PUSZKI INSTALACYJNE
('puszka instalacyjna fi60',     'KNR 5-04 0601-01','Puszka instalacyjna fi60 p/t',    'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.8),
('puszka instalacyjna fi70',     'KNR 5-04 0601-01','Puszka instalacyjna fi70 p/t',    'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.8),
('puszka instalacyjna fi80',     'KNR 5-04 0601-02','Puszka instalacyjna fi80 p/t',    'robocizna',false,NULL,0.18,'szt','instalacje_podstawowe',1.8),
('puszka instalacyjna fi86',     'KNR 5-04 0601-02','Puszka instalacyjna fi86 p/t',    'robocizna',false,NULL,0.18,'szt','instalacje_podstawowe',1.8),
('puszka podtynkowa',            'KNR 5-04 0601-01','Puszka podtynkowa fi60/70',       'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.3),
('puszka pt',                    'KNR 5-04 0601-01','Puszka p/t instalacyjna',         'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.3),
('puszka p/t',                   'KNR 5-04 0601-01','Puszka p/t instalacyjna',         'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.5),
('puszki instalacyjne',          'KNR 5-04 0601-01','Puszki instalacyjne p/t',         'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.3),
('puszka odgalezna',             'KNR 5-04 0601-03','Puszka odgałęźna n/t',            'robocizna',false,NULL,0.20,'szt','instalacje_podstawowe',1.5),
('puszka rozgalezna',            'KNR 5-04 0601-03','Puszka rozgałęźna',               'robocizna',false,NULL,0.20,'szt','instalacje_podstawowe',1.5),
('puszka hermetyczna',           'KNR 5-04 0602-01','Puszka hermetyczna IP65',         'robocizna',false,NULL,0.25,'szt','instalacje_podstawowe',1.5),
('puszka szczelna',              'KNR 5-04 0602-01','Puszka szczelna IP65',            'robocizna',false,NULL,0.25,'szt','instalacje_podstawowe',1.5),
('puszka ip65',                  'KNR 5-04 0602-01','Puszka IP65 hermetyczna',         'robocizna',false,NULL,0.25,'szt','instalacje_podstawowe',1.5),
('puszka bh',                    'KNR 5-04 0601-04','Puszka BH betonowa',              'robocizna',false,NULL,0.18,'szt','instalacje_podstawowe',1.5),
('puszki bh',                    'KNR 5-04 0601-04','Puszki BH betonowe',              'robocizna',false,NULL,0.18,'szt','instalacje_podstawowe',1.5),
('puszka natynkowa',             'KNR 5-04 0601-05','Puszka natynkowa n/t',            'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.2),
('puszka n/t',                   'KNR 5-04 0601-05','Puszka natynkowa n/t',            'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.3),
('puszka nt',                    'KNR 5-04 0601-05','Puszka natynkowa n/t',            'robocizna',false,NULL,0.15,'szt','instalacje_podstawowe',1.3),
-- KORYTKA KABLOWE -- rozmiary
('korytko 25x16',                'KNR 5-08 0201-01','Korytko kablowe PVC 25x16mm',     'robocizna',false,NULL,0.12,'mb','trasy_przemyslowe',1.8),
('korytko 40x25',                'KNR 5-08 0201-02','Korytko kablowe PVC 40x25mm',     'robocizna',false,NULL,0.14,'mb','trasy_przemyslowe',1.8),
('korytko 60x40',                'KNR 5-08 0201-03','Korytko kablowe PVC 60x40mm',     'robocizna',false,NULL,0.16,'mb','trasy_przemyslowe',1.8),
('korytko 80x60',                'KNR 5-08 0201-04','Korytko kablowe PVC 80x60mm',     'robocizna',false,NULL,0.18,'mb','trasy_przemyslowe',1.8),
('korytko 100x60',               'KNR 5-08 0201-05','Korytko kablowe PVC 100x60mm',    'robocizna',false,NULL,0.20,'mb','trasy_przemyslowe',1.8),
('korytko 100x80',               'KNR 5-08 0201-06','Korytko kablowe PVC 100x80mm',    'robocizna',false,NULL,0.22,'mb','trasy_przemyslowe',1.8),
('korytko 200x80',               'KNR 5-08 0201-07','Korytko kablowe PVC 200x80mm',    'robocizna',false,NULL,0.25,'mb','trasy_przemyslowe',1.8),
('korytko kablowe pcv',          'KNR 5-08 0201-01','Korytko kablowe PVC',             'robocizna',false,NULL,0.15,'mb','trasy_przemyslowe',1.3),
('korytko kablowe metalowe',     'KNR 5-08 0211-01','Korytko kablowe metalowe',        'robocizna',false,NULL,0.20,'mb','trasy_przemyslowe',1.5),
('korytko perforowane',          'KNR 5-08 0211-01','Korytko perforowane metalowe',    'robocizna',false,NULL,0.20,'mb','trasy_przemyslowe',1.5),
('korytka kablowe',              'KNR 5-08 0201-01','Korytka kablowe PVC montaż',      'robocizna',false,NULL,0.15,'mb','trasy_przemyslowe',1.3),
('drabinka kablowa',             'KNR 5-08 0221-01','Drabinka kablowa montaż',         'robocizna',false,NULL,0.25,'mb','trasy_przemyslowe',1.5),
('drabinki kablowe',             'KNR 5-08 0221-01','Drabinki kablowe montaż',         'robocizna',false,NULL,0.25,'mb','trasy_przemyslowe',1.5),
('szyna kablowa',                'KNR 5-08 0201-01','Szyna kablowa montaż',            'robocizna',false,NULL,0.15,'mb','trasy_przemyslowe',1.2),
('taca kablowa',                 'KNR 5-08 0221-01','Taca kablowa stalowa montaż',     'robocizna',false,NULL,0.22,'mb','trasy_przemyslowe',1.3),
-- BRUZDY -- wszystkie substraty
('bruzda w cegle',               'KNR 5-04 0101-01','Bruzda w cegle',                  'robocizna',false,NULL,0.25,'mb','instalacje_podstawowe',1.8),
('bruzda w betonie',             'KNR 5-04 0101-02','Bruzda w betonie',                'robocizna',false,NULL,0.45,'mb','instalacje_podstawowe',1.8),
('bruzda w gipsie',              'KNR 5-04 0101-03','Bruzda w płycie GK/gipsie',       'robocizna',false,NULL,0.15,'mb','instalacje_podstawowe',1.8),
('bruzda w ytong',               'KNR 5-04 0101-04','Bruzda w bloczku Ytong',          'robocizna',false,NULL,0.20,'mb','instalacje_podstawowe',1.8),
('bruzda w bloczku',             'KNR 5-04 0101-04','Bruzda w bloczku betonu kom.',    'robocizna',false,NULL,0.20,'mb','instalacje_podstawowe',1.8),
('bruzda w pustaku',             'KNR 5-04 0101-05','Bruzda w pustaku ceramicznym',    'robocizna',false,NULL,0.30,'mb','instalacje_podstawowe',1.8),
('bruzdowanie',                  'KNR 5-04 0101-01','Bruzdowanie montaż',              'robocizna',false,NULL,0.25,'mb','instalacje_podstawowe',1.3),
('kucie bruzd',                  'KNR 5-04 0101-02','Kucie bruzd ręcznie/mech.',       'robocizna',false,NULL,0.35,'mb','instalacje_podstawowe',1.5),
('zaplombowanie bruzdy',         'KNR 5-04 0102-01','Zaplombowanie bruzdy tynkiem',    'robocizna',false,NULL,0.10,'mb','instalacje_podstawowe',1.5),
('zaprawienie bruzdy',           'KNR 5-04 0102-01','Zaprawienie bruzdy po instalacji','robocizna',false,NULL,0.10,'mb','instalacje_podstawowe',1.3),
-- PRZEKUCIA I PRZEJSCIA
('przekucie sciany',             'KNR 5-04 0103-01','Przekucie ściany fi50-100',       'robocizna',false,NULL,0.50,'szt','instalacje_podstawowe',1.5),
('przebicie sciany',             'KNR 5-04 0103-01','Przebicie ściany fi50',           'robocizna',false,NULL,0.50,'szt','instalacje_podstawowe',1.5),
('przebicia scian',              'KNR 5-04 0103-01','Przebicia ścian montaż',          'robocizna',false,NULL,0.50,'szt','instalacje_podstawowe',1.5),
('przejscie przez strop',        'KNR 5-04 0103-02','Przejście przez strop',           'robocizna',false,NULL,0.60,'szt','instalacje_podstawowe',1.5),
('przejscie przez sciane',       'KNR 5-04 0103-01','Przejście przez ścianę',          'robocizna',false,NULL,0.50,'szt','instalacje_podstawowe',1.5),
('otwor w scianie',              'KNR 5-04 0103-01','Otwór w ścianie montaż',          'robocizna',false,NULL,0.50,'szt','instalacje_podstawowe',1.3)

ON CONFLICT (keyword_normalized) DO UPDATE SET
  category=EXCLUDED.category, knr_ref=EXCLUDED.knr_ref,
  labor_norm_rbh=EXCLUDED.labor_norm_rbh, unit=EXCLUDED.unit,
  label=EXCLUDED.label, confidence_weight=EXCLUDED.confidence_weight;
