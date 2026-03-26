-- ES-Engine Dictionary Seed v19b — ŁĄCZNIKI, WYŁĄCZNIKI, OSPRZĘT
INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES
-- ═══════════════════════════════════════════════════════════════
-- ŁĄCZNIKI OŚWIETLENIOWE — wszystkie typy i warianty p/t n/t
-- ═══════════════════════════════════════════════════════════════
('wylacznik jednotarczowy',    'KNR 5-04 0501-03','Wyłącznik jednobiegunowy p/t',   'robocizna',false,NULL,0.28,'szt','osprzet',1.5),
('lacznik jednotarczowy',      'KNR 5-04 0501-03','Łącznik jednobiegunowy p/t',     'robocizna',false,NULL,0.28,'szt','osprzet',1.5),
('lacznik jednobiegunowy',     'KNR 5-04 0501-03','Łącznik jednobiegunowy p/t',     'robocizna',false,NULL,0.28,'szt','osprzet',1.5),
('wlacznik swiatla pt',        'KNR 5-04 0501-03','Włącznik światła p/t',           'robocizna',false,NULL,0.28,'szt','osprzet',1.5),
('wlacznik swiatla p/t',       'KNR 5-04 0501-03','Włącznik światła p/t',           'robocizna',false,NULL,0.28,'szt','osprzet',1.8),
('wlacznik swiatla nt',        'KNR 5-04 0501-03','Włącznik światła n/t',           'robocizna',false,NULL,0.25,'szt','osprzet',1.5),
('wlacznik swiatla n/t',       'KNR 5-04 0501-03','Włącznik światła n/t',           'robocizna',false,NULL,0.25,'szt','osprzet',1.8),
('lacznik schodowy p/t',       'KNR 5-04 0501-04','Łącznik schodowy p/t',           'robocizna',false,NULL,0.30,'szt','osprzet',1.8),
('lacznik schodowy pt',        'KNR 5-04 0501-04','Łącznik schodowy p/t',           'robocizna',false,NULL,0.30,'szt','osprzet',1.5),
('wylacznik schodowy',         'KNR 5-04 0501-04','Wyłącznik schodowy p/t',         'robocizna',false,NULL,0.30,'szt','osprzet',1.3),
('lacznik krzyzowy',           'KNR 5-04 0501-05','Łącznik krzyżowy p/t',           'robocizna',false,NULL,0.33,'szt','osprzet',1.5),
('wylacznik krzyzowy',         'KNR 5-04 0501-05','Wyłącznik krzyżowy p/t',         'robocizna',false,NULL,0.33,'szt','osprzet',1.3),
('lacznik seriowy',            'KNR 5-04 0501-06','Łącznik seriowy (podwójny)',      'robocizna',false,NULL,0.33,'szt','osprzet',1.5),
('lacznik podwojny',           'KNR 5-04 0501-06','Łącznik podwójny p/t',           'robocizna',false,NULL,0.33,'szt','osprzet',1.3),
('wylacznik podwojny',         'KNR 5-04 0501-06','Wyłącznik podwójny p/t',         'robocizna',false,NULL,0.33,'szt','osprzet',1.3),
('lacznik swieczkowy',         'KNR 5-04 0501-03','Łącznik świeczkowy p/t',         'robocizna',false,NULL,0.30,'szt','osprzet',1.5),
('lacznik z podswietleniem',   'KNR 5-04 0501-03','Łącznik z podświetleniem LED',   'robocizna',false,NULL,0.30,'szt','osprzet',1.5),
('sciemniacz',                 'KNR 5-04 0501-07','Ściemniacz 0-300W p/t',          'robocizna',false,NULL,0.45,'szt','osprzet',1.5),
('dimmer',                     'KNR 5-04 0501-07','Dimmer/ściemniacz p/t',          'robocizna',false,NULL,0.45,'szt','osprzet',1.3),
('lacznik czasowy',            'KNR 5-04 0501-08','Łącznik czasowy/timer',          'robocizna',false,NULL,0.45,'szt','osprzet',1.3),
('wylacznik zmierzchowy',      'KNR 5-04 0501-08','Wyłącznik zmierzchowy',          'robocizna',false,NULL,0.45,'szt','osprzet',1.3),
-- ═══════════════════════════════════════════════════════════════
-- WYŁĄCZNIKI NADPRĄDOWE MCB — B/C/D typy, różne prądy
-- ═══════════════════════════════════════════════════════════════
('wylacznik nadpradowy',       'KNR 5-08 0401-01','Wyłącznik nadprądowy MCB',       'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.3),
('wylacznik automatyczny',     'KNR 5-08 0401-01','Wyłącznik automatyczny MCB',     'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.3),
('bezpiecznik automatyczny',   'KNR 5-08 0401-01','Bezpiecznik automatyczny MCB',   'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.2),
('mcb b16',                    'KNR 5-08 0401-01','MCB B16 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb b10',                    'KNR 5-08 0401-01','MCB B10 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb b20',                    'KNR 5-08 0401-01','MCB B20 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb b25',                    'KNR 5-08 0401-01','MCB B25 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb b32',                    'KNR 5-08 0401-01','MCB B32 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb c16',                    'KNR 5-08 0401-01','MCB C16 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb c25',                    'KNR 5-08 0401-01','MCB C25 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('mcb c32',                    'KNR 5-08 0401-01','MCB C32 1P 6kA',                 'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.8),
('wylacznik nadpradowy 1p',    'KNR 5-08 0401-01','Wyłącznik nadprądowy 1P',        'robocizna',false,NULL,0.20,'szt','rozdzielnice',1.5),
('wylacznik nadpradowy 3p',    'KNR 5-08 0401-02','Wyłącznik nadprądowy 3P',        'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.5),
('wylacznik glowny',           'KNR 5-08 0401-03','Wyłącznik główny 2/4P',          'robocizna',false,NULL,0.40,'szt','rozdzielnice',1.5),
-- ═══════════════════════════════════════════════════════════════
-- WYŁĄCZNIKI RÓŻNICOWO-PRĄDOWE RCD/RCBO
-- ═══════════════════════════════════════════════════════════════
('wylacznik roznicowoprądowy', 'KNR 5-08 0401-04','Wyłącznik różnicowoprądowy RCD', 'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.8),
('wylacznik roznicowo pradowy','KNR 5-08 0401-04','Wyłącznik różnicowo-prądowy RCD','robocizna',false,NULL,0.30,'szt','rozdzielnice',1.8),
('rcd 30ma',                   'KNR 5-08 0401-04','RCD 30mA typ AC',                'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.8),
('rcd 30 ma',                  'KNR 5-08 0401-04','RCD 30mA typ AC',                'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.8),
('rcd typ a',                  'KNR 5-08 0401-04','RCD typ A 30mA',                 'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.8),
('rcd typ ac',                 'KNR 5-08 0401-04','RCD typ AC 30mA',                'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.8),
('bezpiecznik roznicowy',      'KNR 5-08 0401-04','Bezpiecznik różnicowy RCD',      'robocizna',false,NULL,0.30,'szt','rozdzielnice',1.3),
('rcbo 1p b16',                'KNR 5-08 0401-05','RCBO 1P B16 30mA',               'robocizna',false,NULL,0.40,'szt','rozdzielnice',1.8),
('rcbo 1p b10',                'KNR 5-08 0401-05','RCBO 1P B10 30mA',               'robocizna',false,NULL,0.40,'szt','rozdzielnice',1.8),
('wyłacznik nadpradowy z czlonem roznicowym','KNR 5-08 0401-05','RCBO — nadprądowy z różnicowym','robocizna',false,NULL,0.40,'szt','rozdzielnice',2.0),
('wylacznik z czlonem roznicowym','KNR 5-08 0401-05','Wyłącznik z członem różnicowym','robocizna',false,NULL,0.40,'szt','rozdzielnice',1.8),
-- ═══════════════════════════════════════════════════════════════
-- ROZDZIELNICE — tablice elektryczne
-- ═══════════════════════════════════════════════════════════════
('tablica elektryczna',        'KNR 5-08 0201-01','Tablica elektryczna montaż',     'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.5),
('tablica rozdzielcza',        'KNR 5-08 0201-01','Tablica rozdzielcza montaż',     'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.5),
('tablica mieszkaniowa',       'KNR 5-08 0201-01','Tablica mieszkaniowa TM montaż', 'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.8),
('tablica pietrowa',           'KNR 5-08 0201-01','Tablica piętrowa montaż',        'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.8),
('rozdzielnica mieszkaniowa',  'KNR 5-08 0201-01','Rozdzielnica mieszkaniowa',      'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.8),
('rozdzielnica lokalna',       'KNR 5-08 0201-01','Rozdzielnica lokalna montaż',    'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.8),
('rozdzielnica pietro',        'KNR 5-08 0201-01','Rozdzielnica piętrowa montaż',   'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.8),
('szafka elektryczna',         'KNR 5-08 0201-02','Szafka elektryczna montaż',      'robocizna',false,NULL,3.00,'kpl','rozdzielnice',1.5),
('szafa elektryczna',          'KNR 5-08 0201-02','Szafa elektryczna montaż',       'robocizna',false,NULL,4.00,'kpl','rozdzielnice',1.5),
('szafa rozdzielcza',          'KNR 5-08 0201-02','Szafa rozdzielcza montaż',       'robocizna',false,NULL,4.00,'kpl','rozdzielnice',1.5),
('podrozdzielnica',            'KNR 5-08 0201-01','Podrozdzielnica montaż',         'robocizna',false,NULL,2.00,'kpl','rozdzielnice',1.5),
('rozdzielnica glowna',        'KNR 5-08 0201-03','Rozdzielnica główna RG',         'robocizna',false,NULL,5.00,'kpl','rozdzielnice',1.8),
('rozdzielnica rg',            'KNR 5-08 0201-03','Rozdzielnica główna RG',         'robocizna',false,NULL,5.00,'kpl','rozdzielnice',1.8),
('rozdzielnica rm',            'KNR 5-08 0201-01','Rozdzielnica mieszkaniowa RM',   'robocizna',false,NULL,2.50,'kpl','rozdzielnice',1.8)

ON CONFLICT (keyword_normalized) DO UPDATE SET
  category        = EXCLUDED.category,
  knr_ref         = EXCLUDED.knr_ref,
  labor_norm_rbh  = EXCLUDED.labor_norm_rbh,
  unit            = EXCLUDED.unit,
  label           = EXCLUDED.label,
  confidence_weight = EXCLUDED.confidence_weight;
