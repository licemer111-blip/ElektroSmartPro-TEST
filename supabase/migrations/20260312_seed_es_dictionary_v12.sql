-- ============================================================
-- ES-Engine Dictionary Seed v12.0 — PEŁNE POKRYCIE
-- Obejmuje WSZYSTKIE 14 kategorii KNR JSON:
--   es_knr_baza_instalacje      → bruzdy, kable p/t, puszki
--   es_knr_trasy_przemysl       → korytka, drabinki, rury, szynoprzewody
--   es_knr_prace_ziemne         → wykopy, kable ziemne, arot, podsypka
--   es_knr_uziomy_odgromowa     → bednarka, uziomy, odgromówka, GSU
--   es_knr_oswietlenie_smart    → oprawy, taśmy LED, smart home
--   es_knr_security_cctv_alarm  → kamery IP, NVR, alarmy, KD
--   es_knr_remonty_pomiary      → demontaż, pomiary, protokoły
--   es_knr_oze_ev_ogrzewanie    → EV wallbox, PV falowniki, maty grzewcze
--   es_knr_lan_rack_expert      → UTP, świat., patchpanel, spawy, RACK
--   es_knr_dali_awaryjne        → awaryjne, DALI, CBS, BMS
--   es_knr_ssp_oddymianie       → SSP, klapy dymowe, ROP, sygnalizatory
--   es_knr_infrastruktura_spec  → słupy, ATEX, kable grzejne, linie napow.
--   es_knr_zasilanie_wlz_szr    → agregaty, SZR, UPS 3f, WLZ 50-240mm2
--   ES-KNR-AUTOMATION           → złączki DIN, KNX/DALI, BMS
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- BRUZDY I UKŁADANIE KABLI P/T (es_knr_baza_instalacje)
-- ═══════════════════════════════════════════════════════════════

('wykucie bruzdy',             'KNR 5-08 0301-01', 'Wykucie bruzdy w cegle/pustaku',    'robocizna', false, NULL, 0.08, 'mb', 'prowadzenie', 1.5),
('bruzda w cegle',             'KNR 5-08 0301-01', 'Bruzda w cegle ręcznie',            'robocizna', false, NULL, 0.08, 'mb', 'prowadzenie', 1.4),
('bruzda w gazobetonie',       'KNR 5-08 0301-01', 'Bruzda w gazobetonie',              'robocizna', false, NULL, 0.08, 'mb', 'prowadzenie', 1.3),
('bruzda w betonie zbrojonym', 'KNR 5-08 0301-02', 'Bruzda w betonie zbrojonym',        'robocizna', false, NULL, 0.18, 'mb', 'prowadzenie', 1.5),
('bruzda w wielkiej plycie',   'KNR 5-08 0301-02', 'Bruzda wielka płyta/żelbet',        'robocizna', false, NULL, 0.18, 'mb', 'prowadzenie', 1.4),
('ukladanie przewodu pt',      'KNR 5-08 0101-01', 'Układanie przewodu YDYp p/t',       'robocizna', false, NULL, 0.032,'mb', 'kable_silnopradowe', 1.3),
('ukladanie kabla',            'KNR 5-08 0101-01', 'Układanie kabla p/t w bruzdzie',    'robocizna', false, NULL, 0.032,'mb', 'kable_silnopradowe', 1.1),
('ukladanie przewodu',         'KNR 5-08 0101-01', 'Układanie przewodu w bruzdzie',     'robocizna', false, NULL, 0.032,'mb', 'kable_silnopradowe', 1.0),
('ukladanie kabla 5x6',        'KNR 5-08 0101-02', 'Układanie kabla 5x6 p/t (indukcja)','robocizna',false, NULL, 0.045,'mb', 'kable_silnopradowe', 1.4),
('ukladanie kabla 5x4',        'KNR 5-08 0101-02', 'Układanie kabla 5x4 p/t',          'robocizna', false, NULL, 0.045,'mb', 'kable_silnopradowe', 1.4),
('osadzenie puszki',           'KNR 5-08 0201-01', 'Osadzenie puszki p/t fi60',         'robocizna', false, NULL, 0.15, 'szt','prowadzenie', 1.3),
('osadzenie puszki gk',        'KNR 5-08 0201-02', 'Osadzenie puszki w płycie G-K',     'robocizna', false, NULL, 0.08, 'szt','prowadzenie', 1.3),
('puszka kieszeniowa',         'KNR 5-08 0201-02', 'Puszka pogłębiana/kieszeniowa p/t', 'robocizna', false, NULL, 0.22, 'szt','prowadzenie', 1.3),
('wypust oswietleniowy sufit',  'KNR 5-08 0301-01', 'Wypust oświetleniowy sufit',       'robocizna', false, NULL, 0.10, 'szt','oswietlenie', 1.3),
('montaz gniazda 230v',        'KNR 5-04 0301-01', 'Montaż gniazda 230V w puszce',      'robocizna', false, NULL, 0.12, 'szt','gniazda_wylaczniki', 1.3),
('montaz lacznika',            'KNR 5-04 0201-01', 'Montaż łącznika oświetlenia',       'robocizna', false, NULL, 0.12, 'szt','gniazda_wylaczniki', 1.2),
('gniazdo silowe 400v',        'KNR 5-04 0301-03', 'Gniazdo siłowe 400V 5P montaż',     'robocizna', false, NULL, 0.35, 'szt','gniazda_wylaczniki', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- TRASY KABLOWE PRZEMYSŁOWE (es_knr_trasy_przemysl)
-- ═══════════════════════════════════════════════════════════════

('korytko siatkowe',           'KNR 5-08 0201-01', 'Korytko siatkowe 100-200mm montaż', 'robocizna', false, NULL, 0.25, 'mb', 'rury_trasy', 1.4),
('koryto siatkowe',            'KNR 5-08 0201-01', 'Koryto siatkowe montaż',            'robocizna', false, NULL, 0.25, 'mb', 'rury_trasy', 1.3),
('korytko pelne',              'KNR 5-08 0101-02', 'Korytko pełne z pokrywą montaż',    'robocizna', false, NULL, 0.35, 'mb', 'rury_trasy', 1.3),
('koryto pelne z pokrywa',     'KNR 5-08 0101-02', 'Koryto pełne z pokrywą montaż',     'robocizna', false, NULL, 0.35, 'mb', 'rury_trasy', 1.3),
('drabinka kablowa',           'KNR 5-08 0201-01', 'Drabinka kablowa 200mm montaż',     'robocizna', false, NULL, 0.45, 'mb', 'rury_trasy', 1.4),
('drabina kablowa',            'KNR 5-08 0201-01', 'Drabina kablowa montaż',            'robocizna', false, NULL, 0.45, 'mb', 'rury_trasy', 1.3),
('konstrukcja podwieszana',    'KNR 5-08 0101-01', 'Konstrukcja podwieszana pret gw.',  'robocizna', false, NULL, 0.30, 'kpl','rury_trasy', 1.3),
('wieszak kablowy',            'KNR 5-08 0101-01', 'Wieszak/konsola pod korytka',       'robocizna', false, NULL, 0.15, 'szt','rury_trasy', 1.2),
('wysiegnik scienny',          'KNR 5-08 0101-01', 'Wysięgnik ścienny pod korytka',     'robocizna', false, NULL, 0.15, 'szt','rury_trasy', 1.2),
('rura instalacyjna natynkowa','KNR 5-08 0301-01', 'Rura PVC natynkowa na uchwytach',   'robocizna', false, NULL, 0.12, 'mb', 'rury_trasy', 1.3),
('rura sztywna nt',            'KNR 5-08 0301-01', 'Rura sztywna PVC n/t montaż',       'robocizna', false, NULL, 0.12, 'mb', 'rury_trasy', 1.2),
('peszel w betonie',           'KNR 5-08 0301-01', 'Peszel w betonie stropu',           'robocizna', false, NULL, 0.025,'mb', 'rury_trasy', 1.3),
('rura karbowana w betonie',   'KNR 5-08 0301-01', 'Rura karbowana w betonie stropu',   'robocizna', false, NULL, 0.025,'mb', 'rury_trasy', 1.3),
('wciaganie kabla do rury',    'KNR 5-08 0301-02', 'Wciąganie kabla do rur osłonowych', 'robocizna', false, NULL, 0.018,'mb', 'rury_trasy', 1.2),
('szynoprzewod',               'KNR 5-08 0401-01', 'Szynoprzewód dystrybucyjny montaż', 'robocizna', false, NULL, 1.20, 'el', 'rury_trasy', 1.4),
('busbar',                     'KNR 5-08 0401-01', 'Busbar/szynoprzewód montaż',        'robocizna', false, NULL, 1.20, 'el', 'rury_trasy', 1.2),
('tap off box',                'KNR 5-08 0401-02', 'Skrzynka odpływowa tap-off box',    'robocizna', false, NULL, 0.50, 'szt','rury_trasy', 1.3),
('kaseta szynoprzewod',        'KNR 5-08 0401-02', 'Kaseta odpływowa szynoprzewód',     'robocizna', false, NULL, 0.50, 'szt','rury_trasy', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- PRACE ZIEMNE I KABLE ZEWNĘTRZNE (es_knr_prace_ziemne)
-- ═══════════════════════════════════════════════════════════════

('kopanie rowu',               'KNR 5-01 0101-01', 'Kopanie rowu dla kabla ręcznie',    'robocizna', false, NULL, 2.50, 'm3', 'prace_ziemne', 1.5),
('wykop reczny',               'KNR 5-01 0101-01', 'Wykop ręczny dla kabla',            'robocizna', false, NULL, 2.50, 'm3', 'prace_ziemne', 1.3),
('wykop minikoparką',          'KNR 5-01 0101-02', 'Wykop minikoparką dla kabla',       'robocizna', false, NULL, 0.030,'mb', 'prace_ziemne', 1.4),
('minikoparką',                'KNR 5-01 0101-02', 'Wykop minikoparką',                 'robocizna', false, NULL, 0.030,'mb', 'prace_ziemne', 1.2),
('podsypka piaskowa',          'KNR 5-01 0201-01', 'Podsypka piaskowa w wykopie',       'robocizna', false, NULL, 1.20, 'm3', 'prace_ziemne', 1.3),
('nasypka piaskowa',           'KNR 5-01 0201-01', 'Nasypka piaskowa ponad kablem',     'robocizna', false, NULL, 1.20, 'm3', 'prace_ziemne', 1.2),
('kabel ziemny yky',           'KNR 5-01 0301-01', 'Układanie kabla YKY w ziemi',       'robocizna', false, NULL, 0.035,'mb', 'kable_silnopradowe', 1.5),
('kabel ziemny yakxs',         'KNR 5-01 0301-01', 'Układanie kabla YAKXS w ziemi',     'robocizna', false, NULL, 0.035,'mb', 'kable_silnopradowe', 1.5),
('kabel yky',                  'KNR 5-01 0301-01', 'Kabel YKY ziemny układanie',        'robocizna', false, NULL, 0.035,'mb', 'kable_silnopradowe', 1.3),
('kabel ziemny',               'KNR 5-01 0301-01', 'Kabel ziemny układanie',            'robocizna', false, NULL, 0.035,'mb', 'kable_silnopradowe', 1.0),
('rura osłonowa arot ziemia',  'KNR 5-01 0301-02', 'Rura osłonowa Arot w wykopie',     'robocizna', false, NULL, 0.015,'mb', 'rury_trasy', 1.4),
('arot dwuścienny',            'KNR 5-01 0301-02', 'Rura Arot DVK/DVR w wykopie',      'robocizna', false, NULL, 0.015,'mb', 'rury_trasy', 1.3),
('tasma ostrzegawcza',         'KNR 5-01 0401-01', 'Taśma ostrzegawcza w wykopie',      'robocizna', false, NULL, 0.004,'mb', 'prace_ziemne', 1.3),
('folia ostrzegawcza',         'KNR 5-01 0401-01', 'Folia ostrzegawcza niebieska',      'robocizna', false, NULL, 0.004,'mb', 'prace_ziemne', 1.2),
('zasypanie wykopu',           'KNR 5-01 0501-01', 'Zasypanie wykopu z zagęszczaniem',  'robocizna', false, NULL, 1.80, 'm3', 'prace_ziemne', 1.3),
('przewiert sterowany',        'KNR 5-01 0601-01', 'Przewiert sterowany pod droga',     'robocizna', false, NULL, 0.80, 'mb', 'prace_ziemne', 1.5),
('przecisk pod droga',         'KNR 5-01 0601-01', 'Przecisk pod drogą/chodnikiem',     'robocizna', false, NULL, 0.80, 'mb', 'prace_ziemne', 1.4),
('zlacze kablowo pomiarowe',   'KNR 5-01 0701-01', 'Złącze kablowo-pomiarowe ZKP',      'robocizna', false, NULL, 4.50, 'szt','prace_ziemne', 1.5),
('zkp',                        'KNR 5-01 0701-01', 'ZKP montaż w granicy działki',      'robocizna', false, NULL, 4.50, 'szt','prace_ziemne', 1.4),
('szafka licznikowa zewnetrzna','KNR 5-01 0701-01','Szafka licznikowa zewnętrzna ZKP',  'robocizna', false, NULL, 4.50, 'szt','prace_ziemne', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- UZIEMIENIA I ODGROMÓWKA (es_knr_uziomy_odgromowa)
-- ═══════════════════════════════════════════════════════════════

('bednarka ocynkowana',        'KNR 5-14 0101-01', 'Bednarka ocynkowana uziom otokowy', 'robocizna', false, NULL, 0.12, 'mb', 'uziem_odgrom', 1.5),
('uziom otokowy',              'KNR 5-14 0101-01', 'Uziom otokowy bednarka 30x4',       'robocizna', false, NULL, 0.12, 'mb', 'uziem_odgrom', 1.5),
('uziom fundamentowy',         'KNR 5-14 0101-02', 'Uziom fundamentowy w ławie',        'robocizna', false, NULL, 0.18, 'mb', 'uziem_odgrom', 1.5),
('uziom poziomy',              'KNR 5-14 0101-01', 'Uziom poziomy bednarka',            'robocizna', false, NULL, 0.12, 'mb', 'uziem_odgrom', 1.3),
('szpilka uziemiajaca',        'KNR 5-14 0201-01', 'Szpilka uziemiająca wbijanie',      'robocizna', false, NULL, 0.45, 'mb', 'uziem_odgrom', 1.4),
('uziom pionowy',              'KNR 5-14 0201-01', 'Uziom pionowy pret miedziowany',    'robocizna', false, NULL, 0.45, 'mb', 'uziem_odgrom', 1.4),
('pret uziomowy',              'KNR 5-14 0201-01', 'Pręt uziomowy wbijanie',            'robocizna', false, NULL, 0.45, 'mb', 'uziem_odgrom', 1.3),
('spawanie bednarki',          'KNR 5-14 0301-01', 'Spawanie połączenia bednarka-bednarka','robocizna',false,NULL, 0.40, 'szt','uziem_odgrom', 1.4),
('zlacze kontrolne uziom',     'KNR 5-14 0401-01', 'Złącze kontrolne uziomu montaż',    'robocizna', false, NULL, 0.85, 'szt','uziem_odgrom', 1.4),
('drut odgromowy dach plask',  'KNR 5-14 0501-01', 'Drut odgromowy fi8 dach płaski',    'robocizna', false, NULL, 0.045,'mb', 'uziem_odgrom', 1.5),
('drut odgromowy',             'KNR 5-14 0501-01', 'Drut odgromowy układanie',          'robocizna', false, NULL, 0.045,'mb', 'uziem_odgrom', 1.2),
('zwod poziomy',               'KNR 5-14 0501-01', 'Zwód poziomy odgromówka',           'robocizna', false, NULL, 0.045,'mb', 'uziem_odgrom', 1.3),
('drut odgromowy dach spad',   'KNR 5-14 0501-02', 'Drut odgromowy dach spadzisty',     'robocizna', false, NULL, 0.060,'mb', 'uziem_odgrom', 1.5),
('iglica odgromowa',           'KNR 5-14 0601-01', 'Iglica odgromowa maszt montaż',     'robocizna', false, NULL, 1.50, 'szt','uziem_odgrom', 1.5),
('maszt odgromowy',            'KNR 5-14 0601-01', 'Maszt odgromowy montaż',            'robocizna', false, NULL, 1.50, 'szt','uziem_odgrom', 1.4),
('gsu',                        'KNR 5-14 0701-01', 'Główna Szyna Uziemiająca GSU',      'robocizna', false, NULL, 0.50, 'szt','uziem_odgrom', 1.4),
('szyna wyrownawcza',          'KNR 5-14 0701-01', 'Szyna wyrównawcza GSU/GSW',         'robocizna', false, NULL, 0.50, 'szt','uziem_odgrom', 1.4),
('polaczenia wyrownawcze',     'KNR 5-14 0801-01', 'Połączenia wyrównawcze rur LGY',    'robocizna', false, NULL, 0.12, 'mb', 'uziem_odgrom', 1.3),
('uziemienie rur',             'KNR 5-14 0801-01', 'Uziemienie rur CO/wod/gaz',         'robocizna', false, NULL, 0.12, 'mb', 'uziem_odgrom', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- OŚWIETLENIE I SMART HOME (es_knr_oswietlenie_smart)
-- ═══════════════════════════════════════════════════════════════

('plafon led',                 'KNR 5-08 0401-01', 'Plafon LED natynkowy montaż',       'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.4),
('kinkiet',                    'KNR 5-08 0401-01', 'Kinkiet oświetleniowy montaż',      'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.3),
('tuba led',                   'KNR 5-08 0401-01', 'Tuba LED montaż',                   'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.3),
('zyrandol',                   'KNR 5-08 0401-02', 'Żyrandol ciężki montaż',            'robocizna', false, NULL, 0.85, 'szt','oswietlenie', 1.4),
('zyrandol wieloramienny',     'KNR 5-08 0401-02', 'Żyrandol wieloramienny montaż',     'robocizna', false, NULL, 0.85, 'szt','oswietlenie', 1.4),
('oczko led',                  'KNR 5-08 0401-03', 'Oczko LED halogenowe w GK',         'robocizna', false, NULL, 0.20, 'szt','oswietlenie', 1.3),
('downlight led',              'KNR 5-08 0401-03', 'Downlight LED wpuszczany GK',       'robocizna', false, NULL, 0.20, 'szt','oswietlenie', 1.3),
('panel led 60x60',            'KNR 5-08 0401-04', 'Panel LED 60x60 Armstrong',         'robocizna', false, NULL, 0.15, 'szt','oswietlenie', 1.4),
('panel armstrong',            'KNR 5-08 0401-04', 'Panel LED sufit modułowy',          'robocizna', false, NULL, 0.15, 'szt','oswietlenie', 1.2),
('profil aluminiowy led',      'KNR 5-08 0401-05', 'Profil aluminiowy taśma LED',       'robocizna', false, NULL, 0.40, 'mb', 'oswietlenie', 1.4),
('tasma led montaz',           'KNR 5-08 0401-05', 'Taśma LED montaż z profilem',       'robocizna', false, NULL, 0.40, 'mb', 'oswietlenie', 1.3),
('zasilacz led',               'KNR 5-08 0401-06', 'Zasilacz LED 12V/24V montaż',       'robocizna', false, NULL, 0.50, 'szt','oswietlenie', 1.3),
('sterownik led',              'KNR 5-08 0401-06', 'Sterownik LED (Mi-Light/Tuya)',      'robocizna', false, NULL, 0.50, 'szt','oswietlenie', 1.3),
('modul smarthome',            'KNR 5-08 0501-01', 'Moduł Smart Home Shelly/Fibaro',    'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.4),
('shelly',                     'KNR 5-08 0501-01', 'Moduł Shelly dopuszkowy montaż',    'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.4),
('fibaro',                     'KNR 5-08 0501-01', 'Moduł Fibaro Smart Home montaż',    'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.3),
('bebox',                      'KNR 5-08 0501-01', 'BleBox Smart Home montaż',          'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.3),
('supla',                      'KNR 5-08 0501-01', 'Zamel Supla moduł montaż',          'robocizna', false, NULL, 0.35, 'szt','oswietlenie', 1.3),
('oprawa parkowa',             'KNR 5-08 0401-07', 'Oprawa parkowa/słupek ogród',       'robocizna', false, NULL, 0.60, 'szt','oswietlenie', 1.3),
('slupek oswietleniowy ogrod', 'KNR 5-08 0401-07', 'Słupek oświetleniowy ogrodowy',     'robocizna', false, NULL, 0.60, 'szt','oswietlenie', 1.3),
('demontaz swietlowki',        'KNR 5-08 0901-01', 'Demontaż oprawy świetlówkowej',     'robocizna', false, NULL, 0.15, 'szt','oswietlenie', 1.3),
('demontaz oprawy',            'KNR 5-08 0901-01', 'Demontaż oprawy oświetleniowej',    'robocizna', false, NULL, 0.15, 'szt','oswietlenie', 1.2),

-- ═══════════════════════════════════════════════════════════════
-- SECURITY: CCTV, ALARM, KD (es_knr_security_cctv_alarm)
-- ═══════════════════════════════════════════════════════════════

('kamera kopulkowa',           'KNR 5-07 0101-01', 'Kamera kopułkowa IP wewnętrzna',    'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.4),
('kamera ip wewnetrzna',       'KNR 5-07 0101-01', 'Kamera IP wewnętrzna montaż',       'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.4),
('kamera zewnetrzna elewacja', 'KNR 5-07 0101-02', 'Kamera zewnętrzna elewacja',        'robocizna', false, NULL, 1.80, 'szt','bezpieczenstwo', 1.4),
('kamera ahd',                 'KNR 5-07 0101-01', 'Kamera AHD montaż',                 'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.2),
('rejestrator nvr',            'KNR 5-07 0201-01', 'Rejestrator NVR z dyskiem HDD',     'robocizna', false, NULL, 2.50, 'szt','bezpieczenstwo', 1.4),
('rejestrator dvr',            'KNR 5-07 0201-01', 'Rejestrator DVR montaż i uruchom.', 'robocizna', false, NULL, 2.50, 'szt','bezpieczenstwo', 1.3),
('czujnik pir alarm',          'KNR 5-07 0301-01', 'Czujka PIR alarmowa montaż',        'robocizna', false, NULL, 0.80, 'szt','bezpieczenstwo', 1.4),
('czujka ruchu alarm',         'KNR 5-07 0301-01', 'Czujka ruchu PIR SSWiN montaż',     'robocizna', false, NULL, 0.80, 'szt','bezpieczenstwo', 1.3),
('czujka dualna',              'KNR 5-07 0301-01', 'Czujka dualna PIR/MW montaż',       'robocizna', false, NULL, 0.80, 'szt','bezpieczenstwo', 1.3),
('kontaktron',                 'KNR 5-07 0301-02', 'Kontaktron wpuszczany okno/drzwi',  'robocizna', false, NULL, 1.10, 'szt','bezpieczenstwo', 1.4),
('czujka magnetyczna',         'KNR 5-07 0301-02', 'Czujka magnetyczna drzwi/okna',     'robocizna', false, NULL, 1.10, 'szt','bezpieczenstwo', 1.3),
('manipulator alarm',          'KNR 5-07 0401-01', 'Manipulator LCD alarmowy montaż',   'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.4),
('klawiatura alarmowa',        'KNR 5-07 0401-01', 'Klawiatura alarmowa montaż',        'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.3),
('sygnalizator zewnetrzny',    'KNR 5-07 0401-02', 'Sygnalizator zewnętrzny opto-akust','robocizna', false, NULL, 1.50, 'szt','bezpieczenstwo', 1.4),
('syrena zewnetrzna',          'KNR 5-07 0401-02', 'Syrena alarmowa zewnętrzna',        'robocizna', false, NULL, 1.50, 'szt','bezpieczenstwo', 1.3),
('stacja bramowa wideodomofo', 'KNR 5-07 0601-01', 'Stacja bramowa wideodomofon IP',    'robocizna', false, NULL, 2.50, 'szt','bezpieczenstwo', 1.4),
('wideodomofon',               'KNR 5-07 0601-01', 'Wideodomofon stacja zewnętrzna',    'robocizna', false, NULL, 2.50, 'szt','bezpieczenstwo', 1.3),
('monitor wideodomofon',       'KNR 5-07 0601-02', 'Monitor wideodomofonu wewnętrzny',  'robocizna', false, NULL, 1.00, 'szt','bezpieczenstwo', 1.3),
('zasilacz buforowy',          'KNR 5-07 0701-01', 'Zasilacz buforowy 12V/5A montaż',   'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.3),
('zasilacz 12v alarm',         'KNR 5-07 0701-01', 'Zasilacz 12V alarmowy z akum.',     'robocizna', false, NULL, 1.20, 'szt','bezpieczenstwo', 1.2),
('centrala alarmowa sswin',    'KNR 5-07 0401-03', 'Centrala alarmowa SSWiN montaż',    'robocizna', false, NULL, 2.00, 'szt','bezpieczenstwo', 1.4),
('centrala satel',             'KNR 5-07 0401-03', 'Centrala Satel montaż i program.',  'robocizna', false, NULL, 2.00, 'szt','bezpieczenstwo', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- REMONTY I POMIARY (es_knr_remonty_pomiary)
-- ═══════════════════════════════════════════════════════════════

('demontaz gniazda',           'KNR 4-03 0101-01', 'Demontaż gniazda/wyłącznika',       'robocizna', false, NULL, 0.08, 'szt','remonty', 1.4),
('demontaz wylacznika',        'KNR 4-03 0101-01', 'Demontaż wyłącznika instalacyjnego', 'robocizna', false, NULL, 0.08, 'szt','remonty', 1.3),
('usuniecie starych przewodow','KNR 4-03 0201-01', 'Usunięcie starych przewodów',        'robocizna', false, NULL, 0.12, 'mb', 'remonty', 1.3),
('demontaz starej instalacji', 'KNR 4-03 0201-01', 'Demontaż starej instalacji elektr.',  'robocizna', false, NULL, 0.12, 'mb', 'remonty', 1.2),
('demontaz rozdzielnicy',      'KNR 4-03 0301-01', 'Demontaż starej rozdzielnicy',       'robocizna', false, NULL, 1.50, 'szt','remonty', 1.4),
('lokalizacja usterki kabla',  'KNR 4-03 0401-01', 'Lokalizacja uszkodzenia kabla',      'robocizna', false, NULL, 1.00, 'rbh','remonty', 1.3),
('diagnostyka',                'KNR 4-03 0401-01', 'Diagnostyka usterki elektrycznej',   'robocizna', false, NULL, 1.00, 'rbh','remonty', 1.0),
('pomiar impedancji petli',    'KNR 4-03 0501-01', 'Pomiar impedancji pętli zwarcia',    'robocizna', false, NULL, 0.12, 'pkt','pomiary', 1.5),
('pomiar swz',                 'KNR 4-03 0501-01', 'Pomiar SWZ samoczynne wyłączenie',   'robocizna', false, NULL, 0.12, 'pkt','pomiary', 1.4),
('pomiar rezystancji izolacji','KNR 4-03 0501-02', 'Pomiar rezystancji izolacji obwód',  'robocizna', false, NULL, 0.25, 'obw','pomiary', 1.5),
('pomiar izolacji',            'KNR 4-03 0501-02', 'Pomiar izolacji 500V/1000V',         'robocizna', false, NULL, 0.25, 'obw','pomiary', 1.4),
('badanie rcd',                'KNR 4-03 0502-01', 'Badanie wyłącznika RCD czas/prąd',   'robocizna', false, NULL, 0.30, 'szt','pomiary', 1.4),
('pomiar rcd',                 'KNR 4-03 0502-01', 'Pomiar RCD cykl pełny',              'robocizna', false, NULL, 0.30, 'szt','pomiary', 1.3),
('pomiar rezystancji uziemien','KNR 4-03 0503-01', 'Pomiar rezystancji uziemienia',      'robocizna', false, NULL, 0.80, 'pkt','pomiary', 1.5),
('pomiar uziomu',              'KNR 4-03 0503-01', 'Pomiar uziomu metoda 3-biegun.',     'robocizna', false, NULL, 0.80, 'pkt','pomiary', 1.4),
('protokol pomiarow',          'KNR 4-03 0504-01', 'Protokół pomiarów elektrycznych',    'robocizna', false, NULL, 1.50, 'kpl','pomiary', 1.4),
('dokumentacja odbiorcza',     'KNR 4-03 0504-01', 'Dokumentacja odbiorcza pomiary',     'robocizna', false, NULL, 1.50, 'kpl','pomiary', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- OZE, EV I OGRZEWANIE (es_knr_oze_ev_ogrzewanie)
-- ═══════════════════════════════════════════════════════════════

('wallbox',                    'KNR 5-08 0295-10', 'Stacja ładowania EV Wallbox montaż', 'robocizna', false, NULL, 2.50, 'szt','oze_ev', 1.5),
('ladowarka ev',               'KNR 5-08 0295-10', 'Ładowarka EV montaż 11kW/22kW',     'robocizna', false, NULL, 2.50, 'szt','oze_ev', 1.4),
('stacja ladowania',           'KNR 5-08 0295-10', 'Stacja ładowania pojazdów EV',      'robocizna', false, NULL, 2.50, 'szt','oze_ev', 1.4),
('zabezpieczenie ev rcd typb', 'KNR 5-08 0295-11', 'Zabezpieczenie EV RCD Typ B',        'robocizna', false, NULL, 1.00, 'kpl','oze_ev', 1.4),
('rcd typ b',                  'KNR 5-08 0295-11', 'RCD Typ B EV montaż',                'robocizna', false, NULL, 1.00, 'kpl','oze_ev', 1.4),
('falownik pv',                'KNR 5-08 0295-05', 'Falownik PV fotowoltaiczny 3-faz',  'robocizna', false, NULL, 3.00, 'szt','oze_ev', 1.5),
('inwerter pv',                'KNR 5-08 0295-05', 'Inwerter PV montaż do 15kW',        'robocizna', false, NULL, 3.00, 'szt','oze_ev', 1.4),
('modul fotowoltaiczny',       'KNR 5-08 0295-06', 'Moduł PV montaż dach skośny',       'robocizna', false, NULL, 1.20, 'szt','oze_ev', 1.4),
('panel pv',                   'KNR 5-08 0295-06', 'Panel fotowoltaiczny montaż',        'robocizna', false, NULL, 1.20, 'szt','oze_ev', 1.3),
('smart meter',                'KNR 5-08 0601-02', 'Smart Meter licznik energii konfig.','robocizna', false, NULL, 1.50, 'szt','oze_ev', 1.4),
('licznik z przekladnikami',   'KNR 5-08 0601-02', 'Licznik z przekładnikami CT',       'robocizna', false, NULL, 1.50, 'szt','oze_ev', 1.3),
('mata grzejna',               'KNR 5-08 0295-07', 'Mata grzewcza podłogowa 1m2',       'robocizna', false, NULL, 0.50, 'm2', 'oze_ev', 1.5),
('ogrzewanie podlogowe elekt', 'KNR 5-08 0295-07', 'Ogrzewanie podłogowe elektryczne',  'robocizna', false, NULL, 0.50, 'm2', 'oze_ev', 1.4),
('kabel grzejny podlogowy',    'KNR 5-08 0295-07', 'Kabel grzejny podłogowy układanie', 'robocizna', false, NULL, 0.50, 'm2', 'oze_ev', 1.3),
('termostat podlogowy',        'KNR 5-08 0295-08', 'Termostat pokojowy podwójny',        'robocizna', false, NULL, 0.40, 'szt','oze_ev', 1.4),
('pompa ciepla podlaczenie',   'KNR 5-08 0295-09', 'Podłączenie pompy ciepła elektr.',  'robocizna', false, NULL, 4.50, 'kpl','oze_ev', 1.5),
('pompa ciepla',               'KNR 5-08 0295-09', 'Pompa ciepła podłączenie elektryczne','robocizna',false,NULL, 4.50, 'kpl','oze_ev', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- LAN, RACK, ŚWIATŁOWODY (es_knr_lan_rack_expert)
-- ═══════════════════════════════════════════════════════════════

('ukladanie kabla utp',        'KNR 5-06 0101-01', 'Układanie kabla UTP/FTP w trasach',  'robocizna', false, NULL, 0.038,'mb', 'kable_slabopradowe', 1.4),
('ciagniecie skretki',         'KNR 5-06 0101-01', 'Ciągnięcie skrętki w korytach',     'robocizna', false, NULL, 0.038,'mb', 'kable_slabopradowe', 1.3),
('kabel swiatlowodem',         'KNR 5-06 0101-02', 'Kabel światłowodowy układanie',      'robocizna', false, NULL, 0.045,'mb', 'kable_slabopradowe', 1.4),
('ukladanie swiatlowodu',      'KNR 5-06 0101-02', 'Układanie światłowodu wewn.',        'robocizna', false, NULL, 0.045,'mb', 'kable_slabopradowe', 1.4),
('modul keystone rj45',        'KNR 5-06 0201-01', 'Moduł Keystone RJ45 montaż',        'robocizna', false, NULL, 0.25, 'szt','it_siec', 1.4),
('gniazdo rj45 keystone',      'KNR 5-06 0201-01', 'Gniazdo RJ45 Keystone montaż',      'robocizna', false, NULL, 0.25, 'szt','it_siec', 1.3),
('floorbox',                   'KNR 5-06 0201-02', 'Floorbox puszka podłogowa biuro',    'robocizna', false, NULL, 1.10, 'szt','it_siec', 1.4),
('szafa rack wisząca',         'KNR 5-06 0401-01', 'Szafa Rack wisząca 19" montaż',     'robocizna', false, NULL, 1.80, 'szt','it_siec', 1.4),
('szafa rack stojaca',         'KNR 5-06 0401-02', 'Szafa Rack stojąca 24-42U',         'robocizna', false, NULL, 4.50, 'szt','it_siec', 1.4),
('szafa 19cali',               'KNR 5-06 0401-01', 'Szafa 19" Rack montaż',             'robocizna', false, NULL, 1.80, 'szt','it_siec', 1.3),
('patchpanel 24p',             'KNR 5-06 0301-01', 'Patchpanel 24-port zaszycie',        'robocizna', false, NULL, 2.20, 'szt','it_siec', 1.4),
('zaszycie patchpanela',       'KNR 5-06 0301-01', 'Zaszycie patchpanela 24p w szafie', 'robocizna', false, NULL, 2.20, 'szt','it_siec', 1.4),
('spawanie swiatlowodu',       'KNR 5-06 0701-02', 'Spawanie światłowodów pigtail',     'robocizna', false, NULL, 0.30, 'spaw','it_siec', 1.5),
('spaw swiatlowodem',          'KNR 5-06 0701-02', 'Spaw światłowodowy spawarką łukową','robocizna', false, NULL, 0.30, 'spaw','it_siec', 1.4),
('pdu',                        'KNR 5-06 0401-03', 'Listwa zasilająca PDU Rack montaż', 'robocizna', false, NULL, 0.40, 'szt','it_siec', 1.3),
('listwa pdu',                 'KNR 5-06 0401-03', 'Listwa PDU 19" montaż',             'robocizna', false, NULL, 0.40, 'szt','it_siec', 1.2),
('ups rack',                   'KNR 5-06 0401-04', 'UPS Rack 19" montaż i podłącz.',    'robocizna', false, NULL, 1.50, 'szt','it_siec', 1.4),
('zasilacz ups rack',          'KNR 5-06 0401-04', 'Zasilacz UPS Rack montaż',          'robocizna', false, NULL, 1.50, 'szt','it_siec', 1.3),
('krosowanie',                 'KNR 5-06 0301-02', 'Krosowanie patchcordami switch',     'robocizna', false, NULL, 0.60, 'szt','it_siec', 1.3),
('pomiary lan fluke',          'KNR 5-06 0801-01', 'Pomiary certyfikacyjne LAN Fluke',   'robocizna', false, NULL, 0.15, 'tor','it_siec', 1.5),
('pomiary otdr',               'KNR 5-06 0801-02', 'Pomiary OTDR reflektometryczne',     'robocizna', false, NULL, 0.25, 'wl', 'it_siec', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- OŚWIETLENIE AWARYJNE I DALI/BMS (es_knr_dali_awaryjne)
-- ═══════════════════════════════════════════════════════════════

('oprawa awaryjna',            'KNR 5-08 0601-01', 'Oprawa awaryjna autonomiczna',       'robocizna', false, NULL, 0.45, 'szt','oswietlenie', 1.4),
('oprawa ewakuacyjna',         'KNR 5-08 0601-01', 'Oprawa ewakuacyjna z baterią',       'robocizna', false, NULL, 0.45, 'szt','oswietlenie', 1.4),
('oprawa awaryjna cbs',        'KNR 5-08 0601-02', 'Oprawa awaryjna CBS kabel E90',      'robocizna', false, NULL, 0.55, 'szt','oswietlenie', 1.4),
('szafa cbs',                  'KNR 5-08 0601-03', 'Szafa Centralnej Baterii CBS',       'robocizna', false, NULL, 12.00,'kpl','oswietlenie', 1.5),
('centralna bateria',          'KNR 5-08 0601-03', 'Centralna Bateria CBS montaż',       'robocizna', false, NULL, 12.00,'kpl','oswietlenie', 1.5),
('magistrala dali',            'KNR 5-08 0801-02', 'Magistrala DALI kabel układanie',    'robocizna', false, NULL, 0.038,'mb', 'dali_bms', 1.5),
('kabel dali',                 'KNR 5-08 0801-02', 'Kabel DALI/KNX układanie',           'robocizna', false, NULL, 0.038,'mb', 'dali_bms', 1.4),
('zasilacz dali',              'KNR 5-08 0801-01', 'Zasilacz magistrali DALI DIN',       'robocizna', false, NULL, 0.35, 'szt','dali_bms', 1.4),
('router dali',                'KNR 5-08 0801-05', 'Router/bramka DALI Gateway',         'robocizna', false, NULL, 0.80, 'szt','dali_bms', 1.4),
('gateway dali',               'KNR 5-08 0801-05', 'Gateway DALI/KNX 64 adresy',        'robocizna', false, NULL, 0.80, 'szt','dali_bms', 1.4),
('programowanie dali',         'KNR 5-08 0801-06', 'Programowanie adresów DALI',         'robocizna', false, NULL, 0.15, 'adr','dali_bms', 1.4),
('adresowanie dali',           'KNR 5-08 0801-06', 'Adresowanie opraw DALI',             'robocizna', false, NULL, 0.15, 'adr','dali_bms', 1.4),
('czujka dali multisensor',    'KNR 5-08 0801-07', 'Multisensor DALI czujka strefy',     'robocizna', false, NULL, 0.50, 'szt','dali_bms', 1.4),
('sensor dali',                'KNR 5-08 0801-07', 'Sensor DALI obecność/natężenie',     'robocizna', false, NULL, 0.50, 'szt','dali_bms', 1.3),
('sterownik knx',              'KNR 5-08 0801-10', 'Sterownik KNX aktuator binarny',     'robocizna', false, NULL, 0.85, 'szt','dali_bms', 1.4),
('aktuator knx',               'KNR 5-08 0801-10', 'Aktuator KNX 8-kanałowy DIN',        'robocizna', false, NULL, 0.85, 'szt','dali_bms', 1.3),
('serwer bms',                 'KNR 5-08 0801-20', 'Kontroler BMS serwer logiki DIN',    'robocizna', false, NULL, 3.50, 'szt','dali_bms', 1.5),
('kontroler bms',              'KNR 5-08 0801-20', 'Kontroler BMS montaż i konfigur.',   'robocizna', false, NULL, 3.50, 'szt','dali_bms', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- SSP, ODDYMIANIE (es_knr_ssp_oddymianie)
-- ═══════════════════════════════════════════════════════════════

('kabel ognioodporny',         'KNR 5-06 0103-01', 'Kabel ognioodporny HTKSH E90',      'robocizna', false, NULL, 0.055,'mb', 'kable_slabopradowe', 1.5),
('kabel hdgs e90',             'KNR 5-06 0103-01', 'Kabel HDGs E90 ppoż natynkowo',     'robocizna', false, NULL, 0.055,'mb', 'kable_slabopradowe', 1.5),
('htksh',                      'KNR 5-06 0103-01', 'HTKSH PH90 kabel p.poż montaż',    'robocizna', false, NULL, 0.055,'mb', 'kable_slabopradowe', 1.5),
('czujka dymu adresowalna',    'KNR 5-07 0801-01', 'Czujka dymu adresowalna SSP',       'robocizna', false, NULL, 0.45, 'szt','ssp', 1.5),
('czujka pozaru',              'KNR 5-07 0801-01', 'Czujka pożarowa SSP montaż',        'robocizna', false, NULL, 0.45, 'szt','ssp', 1.4),
('czujka ciepla',              'KNR 5-07 0801-01', 'Czujka cieplna SSP montaż',         'robocizna', false, NULL, 0.45, 'szt','ssp', 1.3),
('rop',                        'KNR 5-07 0801-02', 'ROP ręczny ostrzegacz pożarowy',    'robocizna', false, NULL, 0.60, 'szt','ssp', 1.5),
('reczny ostrzegacz pozarowy', 'KNR 5-07 0801-02', 'ROP ręczny ostrzegacz montaż',      'robocizna', false, NULL, 0.60, 'szt','ssp', 1.5),
('sygnalizator ppoz',          'KNR 5-07 0801-03', 'Sygnalizator akust. SSP ppoż',      'robocizna', false, NULL, 0.50, 'szt','ssp', 1.4),
('centrala ssp',               'KNR 5-07 0801-04', 'Centrala SSP programowanie',         'robocizna', false, NULL, 8.00, 'kpl','ssp', 1.5),
('centrala pozarowa',          'KNR 5-07 0801-04', 'Centrala pożarowa SSP montaż',       'robocizna', false, NULL, 8.00, 'kpl','ssp', 1.5),
('centrala oddymiania',        'KNR 5-07 0901-01', 'Centrala oddymiania montaż',         'robocizna', false, NULL, 2.50, 'szt','ssp', 1.5),
('silownik okienny',           'KNR 5-07 0901-02', 'Siłownik okienny klapa dymowa',     'robocizna', false, NULL, 1.50, 'szt','ssp', 1.5),
('klapa dymowa',               'KNR 5-07 0901-02', 'Klapa dymowa siłownik montaż',      'robocizna', false, NULL, 1.50, 'szt','ssp', 1.4),
('przycisk oddymiania',        'KNR 5-07 0901-03', 'Przycisk oddymiania pomarańczowy',  'robocizna', false, NULL, 1.00, 'kpl','ssp', 1.5),

-- ═══════════════════════════════════════════════════════════════
-- INFRASTRUKTURA SPECJALNA (es_knr_infrastruktura_specjalna)
-- ═══════════════════════════════════════════════════════════════

('slup oswietleniowy',         'KNR 5-10 0101-01', 'Słup oświetleniowy 6-10m montaż',   'robocizna', false, NULL, 3.50, 'szt','infrastruktura', 1.5),
('slup uliczny',               'KNR 5-10 0101-01', 'Słup uliczny oświetleniowy',         'robocizna', false, NULL, 3.50, 'szt','infrastruktura', 1.4),
('oprawa drogowa led',         'KNR 5-10 0101-02', 'Oprawa drogowa LED na słupie',       'robocizna', false, NULL, 1.50, 'szt','oswietlenie', 1.4),
('rozdzielnica budowlana',     'KNR 5-08 0601-04', 'Rozdzielnica budowlana RB montaż',  'robocizna', false, NULL, 2.50, 'kpl','rozdzielnice', 1.4),
('rb budowlana',               'KNR 5-08 0601-04', 'RB rozdzielnica budowy montaż',     'robocizna', false, NULL, 2.50, 'kpl','rozdzielnice', 1.4),
('linia napowietrzna',         'KNR 5-10 0201-01', 'Linia napowietrzna AsXSn',           'robocizna', false, NULL, 0.080,'mb', 'infrastruktura', 1.4),
('przewod asxsn',              'KNR 5-10 0201-01', 'Przewód izolowany AsXSn napow.',     'robocizna', false, NULL, 0.080,'mb', 'infrastruktura', 1.4),
('osprzet atex',               'KNR 5-08 0701-01', 'Osprzęt ATEX strefa EX montaż',     'robocizna', false, NULL, 1.80, 'szt','infrastruktura', 1.5),
('oprawa ex',                  'KNR 5-08 0701-01', 'Oprawa przeciwwybuchowa EX',         'robocizna', false, NULL, 1.80, 'szt','infrastruktura', 1.4),
('strefa ex',                  'KNR 5-08 0701-01', 'Strefa EX/ATEX montaż osprzętu',    'robocizna', false, NULL, 1.80, 'szt','infrastruktura', 1.3),
('kabel grzejny samoczynny',   'KNR 5-08 0801-08', 'Kabel grzejny samoregulujący rura', 'robocizna', false, NULL, 0.12, 'mb', 'infrastruktura', 1.4),
('ochrona rury przed zamarz',  'KNR 5-08 0801-08', 'Ochrona rur przed zamarzaniem',     'robocizna', false, NULL, 0.12, 'mb', 'infrastruktura', 1.3),
('system przeciwoblodzeniowy', 'KNR 5-08 0801-09', 'System przeciwoblodzeniowy rynny',  'robocizna', false, NULL, 0.25, 'mb', 'infrastruktura', 1.4),
('kabel w rynnach',            'KNR 5-08 0801-09', 'Kabel grzejny rynny spusty',         'robocizna', false, NULL, 0.25, 'mb', 'infrastruktura', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- ZASILANIE GWARANTOWANE, WLZ, SZR (es_knr_zasilanie_wlz_szr)
-- ═══════════════════════════════════════════════════════════════

('agregat pradotwórczy',       'KNR 5-08 0295-12', 'Agregat prądotwórczy montaż',        'robocizna', false, NULL, 18.00,'kpl','zasilanie_gwar', 1.5),
('agregat stacjonarny',        'KNR 5-08 0295-12', 'Agregat stacjonarny posadowienie',   'robocizna', false, NULL, 18.00,'kpl','zasilanie_gwar', 1.5),
('szr',                        'KNR 5-08 0295-13', 'Szafa SZR agregat podłączenie',      'robocizna', false, NULL, 8.50, 'kpl','zasilanie_gwar', 1.5),
('samoczynne zalaczanie',      'KNR 5-08 0295-13', 'SZR samoczynne załączenie rezerwy',  'robocizna', false, NULL, 8.50, 'kpl','zasilanie_gwar', 1.5),
('ups trojfazowy',             'KNR 5-08 0295-14', 'UPS 3-fazowy wolnostojący 40-100kVA','robocizna',false, NULL, 6.00, 'szt','zasilanie_gwar', 1.5),
('ups centralny',              'KNR 5-08 0295-14', 'UPS centralny 3-faz montaż',         'robocizna', false, NULL, 6.00, 'szt','zasilanie_gwar', 1.4),
('kabel wlz 50',               'KNR 5-08 0102-02', 'Kabel WLZ Cu 50mm2 drabinki',        'robocizna', false, NULL, 0.14, 'mb', 'kable_silnopradowe', 1.5),
('kabel wlz 70',               'KNR 5-08 0102-02', 'Kabel WLZ Cu 70mm2 drabinki',        'robocizna', false, NULL, 0.14, 'mb', 'kable_silnopradowe', 1.5),
('kabel wlz 95',               'KNR 5-08 0102-02', 'Kabel WLZ Cu 95mm2 drabinki',        'robocizna', false, NULL, 0.14, 'mb', 'kable_silnopradowe', 1.5),
('kabel wlz 120',              'KNR 5-08 0102-02', 'Kabel WLZ Cu 120mm2 drabinki',       'robocizna', false, NULL, 0.14, 'mb', 'kable_silnopradowe', 1.5),
('kabel wlz 150',              'KNR 5-08 0102-03', 'Kabel WLZ Cu 150mm2 ciężki',         'robocizna', false, NULL, 0.22, 'mb', 'kable_silnopradowe', 1.5),
('kabel wlz 240',              'KNR 5-08 0102-03', 'Kabel WLZ Cu 240mm2 ciężki',         'robocizna', false, NULL, 0.22, 'mb', 'kable_silnopradowe', 1.5),
('wlz',                        'KNR 5-08 0102-02', 'WLZ wewnętrzna linia zasilająca',    'robocizna', false, NULL, 0.14, 'mb', 'kable_silnopradowe', 1.2),
('zarobienie konca kablowego', 'KNR 5-08 0102-04', 'Zarobienie końcówki 50-120mm2',      'robocizna', false, NULL, 0.25, 'szt','kable_silnopradowe', 1.4),
('prasowanie hydrauliczne',    'KNR 5-08 0102-04', 'Prasowanie hydrauliczne końcówki',   'robocizna', false, NULL, 0.25, 'szt','kable_silnopradowe', 1.3),
('zarobienie 150 240',         'KNR 5-08 0102-05', 'Zarobienie końcówki 150-240mm2',     'robocizna', false, NULL, 0.40, 'szt','kable_silnopradowe', 1.4),
('kabel sterowniczy',          'KNR 5-08 0102-06', 'Kabel sterowniczy linka LiYCY',      'robocizna', false, NULL, 0.045,'mb', 'kable_slabopradowe', 1.3),
('liycy',                      'KNR 5-08 0102-06', 'Kabel sterowniczy LiYCY ekrany',     'robocizna', false, NULL, 0.045,'mb', 'kable_slabopradowe', 1.4),
('rozszycie kabla sterownic',  'KNR 5-08 0102-07', 'Rozszycie kabla sterowniczego',      'robocizna', false, NULL, 0.05, 'zyl','kable_slabopradowe', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- ZŁĄCZKI I AUTOMATYKA DIN (ES-KNR-AUTOMATION)
-- ═══════════════════════════════════════════════════════════════

('zlaczka szynowa',            'KNR 5-08 0401-01', 'Złączka szynowa ZUG 2.5mm2',        'robocizna', false, NULL, 0.05, 'szt','aparatura', 1.3),
('zlaczka zug',                'KNR 5-08 0401-01', 'Złączka ZUG przelotowa DIN',        'robocizna', false, NULL, 0.05, 'szt','aparatura', 1.4),
('zlaczki din',                'KNR 5-08 0401-01', 'Złączki DIN szynowe montaż',        'robocizna', false, NULL, 0.05, 'szt','aparatura', 1.2),
('zlaczka pe',                 'KNR 5-08 0401-10', 'Złączka ochronna PE żółto-zielona', 'robocizna', false, NULL, 0.05, 'szt','aparatura', 1.3),
('licznik energii modbus',     'KNR 5-08 0601-01', 'Licznik energii Modbus RTU',         'robocizna', false, NULL, 0.45, 'szt','aparatura', 1.4),
('licznik energii',            'KNR 5-08 0601-01', 'Licznik energii montaż DIN',        'robocizna', false, NULL, 0.45, 'szt','aparatura', 1.2)

ON CONFLICT (keyword_normalized) DO NOTHING;
