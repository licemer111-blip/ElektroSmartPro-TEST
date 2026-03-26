-- ES-Engine Dictionary Seed v19e -- TELETECHNIKA, WLZ, SPECJALNE
INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES
-- TELETECHNIKA / LAN / RACK
('punkt lan',                    'KNR 5-06 0101-01','Punkt LAN RJ45 Cat.6 montaz',    'robocizna',false,NULL,0.40,'szt','it_siec',1.8),
('punkt sieciowy',               'KNR 5-06 0101-01','Punkt sieciowy RJ45 Cat.6',      'robocizna',false,NULL,0.40,'szt','it_siec',1.5),
('punkt logiczny',               'KNR 5-06 0101-01','Punkt logiczny RJ45 Cat.6',      'robocizna',false,NULL,0.40,'szt','it_siec',1.5),
('gniazdo rj45',                 'KNR 5-06 0101-01','Gniazdo RJ45 Cat.6 montaz',      'robocizna',false,NULL,0.40,'szt','it_siec',1.5),
('gniazdo cat6',                 'KNR 5-06 0101-01','Gniazdo Cat.6 RJ45',             'robocizna',false,NULL,0.40,'szt','it_siec',1.5),
('gniazdo cat6a',                'KNR 5-06 0101-02','Gniazdo Cat.6A RJ45',            'robocizna',false,NULL,0.45,'szt','it_siec',1.8),
('skretka utp cat6',             'KNR 5-06 0111-01','Skretka UTP Cat.6 ukladanie',    'robocizna',false,NULL,0.05,'mb','it_siec',1.5),
('kabel utp cat6',               'KNR 5-06 0111-01','Kabel UTP Cat.6 ukladanie',      'robocizna',false,NULL,0.05,'mb','it_siec',1.5),
('kabel ftp cat6',               'KNR 5-06 0111-02','Kabel FTP Cat.6 ukladanie',      'robocizna',false,NULL,0.05,'mb','it_siec',1.5),
('kabel cat6',                   'KNR 5-06 0111-01','Kabel Cat.6 ukladanie',          'robocizna',false,NULL,0.05,'mb','it_siec',1.3),
('kabel cat6a',                  'KNR 5-06 0111-02','Kabel Cat.6A ukladanie',         'robocizna',false,NULL,0.06,'mb','it_siec',1.3),
('szafa rack',                   'KNR 5-06 0201-01','Szafa RACK 19" montaz',          'robocizna',false,NULL,4.00,'szt','it_siec',1.8),
('szafa rack 42u',               'KNR 5-06 0201-02','Szafa RACK 42U 19" montaz',      'robocizna',false,NULL,5.00,'szt','it_siec',2.0),
('szafa rack 24u',               'KNR 5-06 0201-01','Szafa RACK 24U 19" montaz',      'robocizna',false,NULL,4.00,'szt','it_siec',2.0),
('patch panel',                  'KNR 5-06 0211-01','Patch panel zarabiane',          'robocizna',false,NULL,1.50,'szt','it_siec',1.5),
('zarobienie patch panelu',      'KNR 5-06 0211-01','Zarobienie patch panelu 24p',    'robocizna',false,NULL,1.50,'szt','it_siec',1.8),
('access point',                 'KNR 5-06 0221-01','Access Point WiFi montaz konfig','robocizna',false,NULL,1.00,'szt','it_siec',1.5),
('punkt dostepowy wifi',         'KNR 5-06 0221-01','Punkt dostepowy WiFi montaz',    'robocizna',false,NULL,1.00,'szt','it_siec',1.5),
('punkt tv',                     'KNR 5-06 0131-01','Punkt TV/SAT gniazdo',           'robocizna',false,NULL,0.35,'szt','it_siec',1.5),
('gniazdo tv',                   'KNR 5-06 0131-01','Gniazdo TV antenowe',            'robocizna',false,NULL,0.35,'szt','it_siec',1.3),
('gniazdo sat',                  'KNR 5-06 0131-02','Gniazdo SAT antenowe',           'robocizna',false,NULL,0.35,'szt','it_siec',1.3),
('gniazdo tv/sat',               'KNR 5-06 0131-03','Gniazdo TV/SAT combo',           'robocizna',false,NULL,0.40,'szt','it_siec',1.5),
('gniazdo telefoniczne',         'KNR 5-06 0141-01','Gniazdo telefoniczne RJ11',      'robocizna',false,NULL,0.30,'szt','it_siec',1.3),
-- WLZ I PRZYLACZA
('wlz',                          'KNR 5-08 0251-01','WLZ wewnętrzna linia zasilajaca','robocizna',false,NULL,0.06,'mb','przylacza_wlz',1.8),
('wewnetrzna linia zasilajaca',  'KNR 5-08 0251-01','WLZ wewnetrzna linia zasilajaca','robocizna',false,NULL,0.06,'mb','przylacza_wlz',2.0),
('przylacze energetyczne',       'KNR 5-08 0261-01','Przylacze energetyczne montaz',  'robocizna',false,NULL,4.00,'kpl','przylacza_wlz',1.8),
('zlacze kablowe',               'KNR 5-08 0261-02','Zlacze kablowe ZK montaz',       'robocizna',false,NULL,2.00,'szt','przylacza_wlz',1.5),
('szafka licznikowa',            'KNR 5-08 0271-01','Szafka licznikowa montaz',       'robocizna',false,NULL,3.00,'szt','przylacza_wlz',1.8),
('licznik energii',              'KNR 5-08 0281-01','Licznik energii 1F/3F montaz',   'robocizna',false,NULL,0.80,'szt','przylacza_wlz',1.5),
('licznik 3-fazowy',             'KNR 5-08 0281-02','Licznik 3-fazowy montaz',        'robocizna',false,NULL,0.80,'szt','przylacza_wlz',1.8),
-- UPS I ZASILANIE AWARYJNE
('ups',                          'ES-UPS-001','UPS montaz i konfiguracja',            'robocizna',false,NULL,1.50,'szt','zasilanie_awaryjne',1.5),
('zasilacz ups',                 'ES-UPS-001','Zasilacz UPS montaz',                  'robocizna',false,NULL,1.50,'szt','zasilanie_awaryjne',1.5),
('agregat pradotworczy',         'ES-UPS-002','Agregat pradotworczy podlaczenie',     'robocizna',false,NULL,5.00,'kpl','zasilanie_awaryjne',1.8),
('szr',                          'ES-UPS-003','SZR samoczynny zalacznik rezerwy',     'robocizna',false,NULL,4.00,'kpl','zasilanie_awaryjne',1.8),
-- OGRZEWANIE ELEKTRYCZNE
('maty grzejne',                 'ES-OGR-001','Maty grzejne elektryczne montaz',     'robocizna',false,NULL,0.30,'m2','ogrzewanie',1.5),
('folia grzewcza',               'ES-OGR-002','Folia grzewcza elektryczna montaz',   'robocizna',false,NULL,0.25,'m2','ogrzewanie',1.5),
('termostat podlogowy',          'ES-OGR-003','Termostat podlogowy montaz',          'robocizna',false,NULL,0.50,'szt','ogrzewanie',1.5),
('grzejnik elektryczny',         'ES-OGR-004','Grzejnik elektryczny montaz',         'robocizna',false,NULL,0.60,'szt','ogrzewanie',1.3),
-- PRZYGOTOWANIE I ORGANIZACJA ROBÓT
('organizacja robót',            'ES-ORG-001','Organizacja robót - przygotowanie',   'robocizna',false,NULL,4.00,'kpl','przygotowanie',1.3),
('przygotowanie stanowiska',     'ES-ORG-001','Przygotowanie stanowiska pracy',      'robocizna',false,NULL,1.00,'kpl','przygotowanie',1.2),
('sprzatanie po robotach',       'ES-ORG-002','Sprzatanie po robotach elektrycznych','robocizna',false,NULL,2.00,'kpl','przygotowanie',1.3),
('transport materialow',         'ES-ORG-003','Transport materialow na budowe',      'robocizna',false,NULL,2.00,'kpl','przygotowanie',1.2),
('geodezja/wytyczenie',          'ES-ORG-004','Wytyczenie tras instalacyjnych',      'robocizna',false,NULL,1.00,'kpl','przygotowanie',1.2),
-- SPECJALNE DEMONTAZE
('demontaz gniazdka',            'KNR 5-04 0341-02','Demontaz gniazda elektrycznego', 'robocizna',false,NULL,0.10,'szt','remonty_pomiary',1.5),
('demontaz gniazdek',            'KNR 5-04 0341-02','Demontaz gniazdek elektrycznych','robocizna',false,NULL,0.10,'szt','remonty_pomiary',1.5),
('demontaz lacznika',            'KNR 5-04 0341-03','Demontaz lacznika/wylacznika',  'robocizna',false,NULL,0.08,'szt','remonty_pomiary',1.5),
('demontaz lacznikow',           'KNR 5-04 0341-03','Demontaz lacznikow oswiet.',     'robocizna',false,NULL,0.08,'szt','remonty_pomiary',1.5),
('demontaz przewodow',           'KNR 5-04 0341-04','Demontaz przewodow instalacji', 'robocizna',false,NULL,0.03,'mb','remonty_pomiary',1.5),
('demontaz kabla',               'KNR 5-04 0341-04','Demontaz kabla instalacyjnego', 'robocizna',false,NULL,0.03,'mb','remonty_pomiary',1.3),
('demontaz korytka',             'KNR 5-04 0341-05','Demontaz korytka kablowego',    'robocizna',false,NULL,0.08,'mb','remonty_pomiary',1.3),
('demontaz listwy',              'KNR 5-04 0341-06','Demontaz listwy instalacyjnej', 'robocizna',false,NULL,0.08,'mb','remonty_pomiary',1.3),
('demontaz tablicy',             'KNR 5-04 0341-07','Demontaz tablicy rozdzielczej', 'robocizna',false,NULL,2.00,'kpl','remonty_pomiary',1.8),
('demontaz rozdzielnicy',        'KNR 5-04 0341-07','Demontaz rozdzielnicy',         'robocizna',false,NULL,2.00,'kpl','remonty_pomiary',1.8),
('demontaz instalacji',          'KNR 5-04 0341-01','Demontaz instalacji elektrycznej','robocizna',false,NULL,0.20,'mb','remonty_pomiary',1.3),
-- FOTOWOLTAIKA (skroty i warianty)
('panel fotowoltaiczny',         'ES-PV-001','Panel fotowoltaiczny montaz',          'robocizna',false,NULL,0.50,'szt','fotowoltaika',1.5),
('panel pv',                     'ES-PV-001','Panel PV montaz na dachu',             'robocizna',false,NULL,0.50,'szt','fotowoltaika',1.5),
('modul pv',                     'ES-PV-001','Modul PV montaz',                      'robocizna',false,NULL,0.50,'szt','fotowoltaika',1.5),
('falownik',                     'ES-PV-002','Falownik inwerter montaz',             'robocizna',false,NULL,2.00,'szt','fotowoltaika',1.5),
('inwerter',                     'ES-PV-002','Inwerter falownik montaz',             'robocizna',false,NULL,2.00,'szt','fotowoltaika',1.5),
('optymalizator mocy',           'ES-PV-003','Optymalizator mocy DC montaz',         'robocizna',false,NULL,0.30,'szt','fotowoltaika',1.5),
('konstrukcja dachowa pv',       'ES-PV-004','Konstrukcja dachowa pod PV',           'robocizna',false,NULL,0.40,'mb','fotowoltaika',1.5),
-- EV LADOWANIE
('ladowarka ev',                 'ES-EV-001','Ladowarka EV montaz i konfig.',        'robocizna',false,NULL,3.00,'szt','ev_ladowanie',1.8),
('stacja ladowania ev',          'ES-EV-001','Stacja ladowania EV AC',               'robocizna',false,NULL,3.00,'szt','ev_ladowanie',1.8),
('wallbox',                      'ES-EV-001','Wallbox EV montaz i konfig.',          'robocizna',false,NULL,3.00,'szt','ev_ladowanie',1.8),
-- SERWIS I DIAGNOSTYKA
('diagnoza usterki',             'ES-SRV-001','Diagnoza i lokalizacja usterki',      'robocizna',false,NULL,1.00,'godz','serwis_awarie',1.5),
('naprawa usterki',              'ES-SRV-002','Naprawa usterki instalacyjnej',       'robocizna',false,NULL,1.00,'godz','serwis_awarie',1.3),
('przeglad instalacji',          'ES-SRV-003','Przeglad techniczny instalacji',      'robocizna',false,NULL,2.00,'kpl','serwis_awarie',1.5)

ON CONFLICT (keyword_normalized) DO UPDATE SET
  category=EXCLUDED.category, knr_ref=EXCLUDED.knr_ref,
  labor_norm_rbh=EXCLUDED.labor_norm_rbh, unit=EXCLUDED.unit,
  label=EXCLUDED.label, confidence_weight=EXCLUDED.confidence_weight;
