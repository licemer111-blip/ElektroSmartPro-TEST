-- =============================================================================
-- ES-Dictionary v17: Synchronizacja 14 starych kategorii z plikami JSON
-- Data: 2026-03-05
-- Cel: DELETE starych wpisów 14 kategorii + INSERT/UPDATE aktualnych norm 2026
-- Stawki robocizny: 95-110 PLN/rbh wg kompleksowości (2026)
-- =============================================================================

-- Krok 1: Usuń stare wpisy 14 "bazowych" kategorii (zastąpione poniżej)
DELETE FROM es_dictionary WHERE category IN (
  'instalacje_podstawowe',
  'bruzdy_puszki',
  'osprzet',
  'trasy_kablowe',
  'oswietlenie',
  'dali_awaryjne',
  'security',
  'ssp_ppoz',
  'oze_ev',
  'ogrzewanie',
  'prace_ziemne',
  'remonty',
  'pomiary',
  'lan_rack',
  'teletechnika',
  'uziemienie',
  'odgromowa',
  'zasilanie_wlz',
  'infrastruktura_specjalna',
  -- kategorie ze starego seed v1 które zostały zastąpione
  'instalacje',
  'kable',
  'oswietlenie_smart'
);

-- =============================================================================
-- KATEGORIA 1: Podstawowe Instalacje (es_knr_baza_instalacje.json)
-- Stawka: 95 PLN/rbh | Kompleksowość: 1
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('wykucie bruzdy cegła',       'instalacje_podstawowe', 'KNR 5-08 0101', 0.08,  'mb',  'Wykucie bruzdy dla przewodu w podłożu z cegły/pustaka'),
  ('bruzdowanie cegła',          'instalacje_podstawowe', 'KNR 5-08 0101', 0.08,  'mb',  'Wykucie bruzdy dla przewodu w podłożu z cegły/pustaka'),
  ('bruzda cegła',               'instalacje_podstawowe', 'KNR 5-08 0101', 0.08,  'mb',  'Wykucie bruzdy dla przewodu w podłożu z cegły/pustaka'),
  ('wykucie bruzdy beton',       'instalacje_podstawowe', 'KNR 5-08 0102', 0.18,  'mb',  'Wykucie bruzdy w betonie zbrojonym (wielka płyta)'),
  ('bruzdowanie beton',          'instalacje_podstawowe', 'KNR 5-08 0102', 0.18,  'mb',  'Wykucie bruzdy w betonie zbrojonym'),
  ('bruzda beton wielka płyta',  'instalacje_podstawowe', 'KNR 5-08 0102', 0.18,  'mb',  'Wykucie bruzdy w betonie zbrojonym'),
  ('układanie przewodu YDYp',    'instalacje_podstawowe', 'KNR 5-08 0111', 3.20,  '100mb', 'Układanie YDYp 3x1.5/3x2.5 p/t w bruzdzie'),
  ('układanie YDY 3x1.5',        'instalacje_podstawowe', 'KNR 5-08 0111', 3.20,  '100mb', 'Układanie YDYp 3x1.5 p/t'),
  ('układanie YDY 3x2.5',        'instalacje_podstawowe', 'KNR 5-08 0111', 3.20,  '100mb', 'Układanie YDYp 3x2.5 p/t'),
  ('układanie YDY 5x4',          'instalacje_podstawowe', 'KNR 5-08 0112', 4.50,  '100mb', 'Układanie przewodu wielożyłowego YDY/YKY 5x4/5x6'),
  ('układanie YDY 5x6',          'instalacje_podstawowe', 'KNR 5-08 0112', 4.50,  '100mb', 'Układanie przewodu wielożyłowego 5x6'),
  ('puszka podtynkowa cegła',    'instalacje_podstawowe', 'KNR 5-08 0121', 0.15,  'szt', 'Osadzenie puszki fi60 w cegle/pustaku'),
  ('puszka fi60',                'instalacje_podstawowe', 'KNR 5-08 0121', 0.15,  'szt', 'Osadzenie puszki podtynkowej fi60'),
  ('puszka kieszeniowa',         'instalacje_podstawowe', 'KNR 5-08 0122', 0.22,  'szt', 'Osadzenie puszki pogłębianej/kieszeniowej'),
  ('puszka smart home',          'instalacje_podstawowe', 'KNR 5-08 0122', 0.22,  'szt', 'Osadzenie puszki pogłębianej dla Smart Home'),
  ('puszka GK gips-karton',      'instalacje_podstawowe', 'KNR 5-08 0123', 0.08,  'szt', 'Osadzenie puszki w płycie G-K'),
  ('montaż gniazda 230V',        'instalacje_podstawowe', 'KNR 5-08 0131', 0.12,  'szt', 'Montaż gniazda wtykowego 230V (2P+PE)'),
  ('gniazdo wtykowe',            'instalacje_podstawowe', 'KNR 5-08 0131', 0.12,  'szt', 'Montaż gniazda 2P+PE'),
  ('montaż łącznika',            'instalacje_podstawowe', 'KNR 5-08 0132', 0.12,  'szt', 'Montaż łącznika oświetleniowego'),
  ('włącznik światła',           'instalacje_podstawowe', 'KNR 5-08 0132', 0.12,  'szt', 'Montaż łącznika oświetleniowego'),
  ('wypust oświetleniowy',       'instalacje_podstawowe', 'KNR 5-08 0141', 0.10,  'szt', 'Przygotowanie wypustu oświetleniowego na suficie'),
  ('gniazdo siłowe 400V',        'instalacje_podstawowe', 'KNR 5-08 0151', 0.35,  'szt', 'Montaż gniazda siłowego 400V 16A/32A'),
  ('gniazdo siłowe trójfazowe',  'instalacje_podstawowe', 'KNR 5-08 0151', 0.35,  'szt', 'Montaż gniazda siłowego 5P')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 2: Trasy Kablowe i Instalacje Przemysłowe (es_knr_trasy_przemysl.json)
-- Stawka: 95 PLN/rbh | Kompleksowość: 1
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('korytko siatkowe 100mm',     'trasy_przemyslowe', 'KNR 5-08 0201', 0.25, 'mb',    'Montaż korytka siatkowego szer. 100-200mm'),
  ('korytko siatkowe 200mm',     'trasy_przemyslowe', 'KNR 5-08 0201', 0.25, 'mb',    'Montaż korytka siatkowego szer. 200mm'),
  ('korytko kablowe siatkowe',   'trasy_przemyslowe', 'KNR 5-08 0201', 0.25, 'mb',    'Montaż korytka siatkowego'),
  ('korytko pełne z pokrywą',    'trasy_przemyslowe', 'KNR 5-08 0202', 0.35, 'mb',    'Montaż korytka pełnego z blachy do 300mm z pokrywą'),
  ('korytko metalowe',           'trasy_przemyslowe', 'KNR 5-08 0202', 0.35, 'mb',    'Montaż korytka pełnego z pokrywą'),
  ('drabinka kablowa',           'trasy_przemyslowe', 'KNR 5-08 0203', 0.45, 'mb',    'Montaż drabinki kablowej pod ciężkie kable WLZ'),
  ('drabinka WLZ',               'trasy_przemyslowe', 'KNR 5-08 0203', 0.45, 'mb',    'Montaż drabinki kablowej'),
  ('pręt gwintowany podwieszenie','trasy_przemyslowe','KNR 5-08 0211', 0.30, 'kpl',   'Montaż konstrukcji podwieszanej pręt+profil/ceownik'),
  ('podwieszenie sufitowe',      'trasy_przemyslowe', 'KNR 5-08 0211', 0.30, 'kpl',   'Montaż konstrukcji podwieszanej'),
  ('wysięgnik ścienny',          'trasy_przemyslowe', 'KNR 5-08 0212', 0.15, 'szt',   'Montaż wysięgnika ściennego pod korytka'),
  ('rura sztywna natynkowa',     'trasy_przemyslowe', 'KNR 5-08 0221', 0.12, 'mb',    'Układanie rury sztywnej RL/RS natynkowo'),
  ('rura PCV instalacyjna',      'trasy_przemyslowe', 'KNR 5-08 0221', 0.12, 'mb',    'Układanie rury instalacyjnej sztywnej'),
  ('peszel w betonie',           'trasy_przemyslowe', 'KNR 5-08 0222', 2.50, '100mb', 'Układanie rury karbowanej w betonie przed wylaniem'),
  ('rura karbowana strop',       'trasy_przemyslowe', 'KNR 5-08 0222', 2.50, '100mb', 'Układanie peszla w betonie stropu'),
  ('wciąganie kabla do rury',    'trasy_przemyslowe', 'KNR 5-08 0231', 1.80, '100mb', 'Wciąganie kabli do ułożonych rur osłonowych'),
  ('szynoprzewód dystrybucyjny', 'trasy_przemyslowe', 'KNR 5-08 0241', 1.20, 'element', 'Montaż szynoprzewodu 160A-400A na wspornikach'),
  ('busduct szynoprzewód',       'trasy_przemyslowe', 'KNR 5-08 0241', 1.20, 'element', 'Montaż szynoprzewodu dystrybucyjnego'),
  ('tap-off box szynoprzewód',   'trasy_przemyslowe', 'KNR 5-08 0242', 0.50, 'szt',   'Montaż skrzynki odpływowej na szynoprzewodzie')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 3: Oświetlenie i Smart Home (es_knr_oswietlenie_smart.json)
-- Stawka: 100 PLN/rbh | Kompleksowość: 2
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('oprawa oświetleniowa plafon',   'oswietlenie_montaz', 'KNR 5-08 0301', 0.35, 'szt', 'Montaż oprawy prostej — plafon/kinkiet/tuba LED'),
  ('oprawa LED natynkowa',          'oswietlenie_montaz', 'KNR 5-08 0301', 0.35, 'szt', 'Montaż oprawy oświetleniowej prostej'),
  ('żyrandol ciężki',               'oswietlenie_montaz', 'KNR 5-08 0302', 0.85, 'szt', 'Montaż żyrandola wieloramiennego/ciężkiej oprawy'),
  ('żyrandol wieloramienny',        'oswietlenie_montaz', 'KNR 5-08 0302', 0.85, 'szt', 'Montaż ciężkiej oprawy zwieszanej'),
  ('oczko LED downlight GK',        'oswietlenie_montaz', 'KNR 5-08 0303', 0.20, 'szt', 'Montaż oprawy wpuszczanej w suficie G-K'),
  ('downlight sufitowy',            'oswietlenie_montaz', 'KNR 5-08 0303', 0.20, 'szt', 'Montaż oczka LED/halogenowego w GK'),
  ('panel LED 60x60 Armstrong',     'oswietlenie_montaz', 'KNR 5-08 0304', 0.15, 'szt', 'Montaż panelu LED 60x60 w suficie modułowym'),
  ('panel biurowy LED',             'oswietlenie_montaz', 'KNR 5-08 0304', 0.15, 'szt', 'Montaż panelu LED w suficie Armstrong'),
  ('profil LED taśma',              'oswietlenie_montaz', 'KNR 5-08 0311', 0.40, 'mb',  'Montaż profilu aluminiowego z taśmą LED'),
  ('taśma LED profil aluminiowy',   'oswietlenie_montaz', 'KNR 5-08 0311', 0.40, 'mb',  'Montaż profilu LED z wklejeniem i lutowaniem'),
  ('zasilacz LED sterownik',        'oswietlenie_montaz', 'KNR 5-08 0312', 0.50, 'szt', 'Montaż zasilacza LED 12V/24V ze sterownikiem'),
  ('sterownik LED RGB',             'oswietlenie_montaz', 'KNR 5-08 0312', 0.50, 'szt', 'Montaż sterownika LED i zasilacza'),
  ('moduł smart home dopuszkowy',   'oswietlenie_montaz', 'KNR 5-08 0321', 0.35, 'szt', 'Montaż modułu Smart Home w puszce (Shelly/Fibaro)'),
  ('shelly dopuszkowy',             'oswietlenie_montaz', 'KNR 5-08 0321', 0.35, 'szt', 'Montaż modułu Shelly w puszce p/t'),
  ('słupek ogrodowy LED',           'oswietlenie_montaz', 'KNR 5-08 0331', 0.60, 'szt', 'Montaż oprawy parkowej/słupka oświetleniowego'),
  ('oprawa ogrodowa na fundamencie','oswietlenie_montaz', 'KNR 5-08 0331', 0.60, 'szt', 'Montaż słupka oświetleniowego ogrodowego'),
  ('demontaż oprawy świetlówkowej', 'oswietlenie_montaz', 'KNR 5-08 0341', 0.15, 'szt', 'Demontaż oprawy świetlówkowej/rastrowej')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 4: DALI i Oświetlenie Awaryjne (es_knr_dali_awaryjne.json)
-- Stawka: 105 PLN/rbh | Kompleksowość: 3
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('oprawa awaryjna autonomiczna',  'dali_awaryjne', 'KNR AL-01 0101', 0.45, 'szt',   'Montaż oprawy awaryjnej z własną baterią'),
  ('oprawa ewakuacyjna LED',        'dali_awaryjne', 'KNR AL-01 0101', 0.45, 'szt',   'Montaż oprawy oświetlenia ewakuacyjnego'),
  ('oprawa awaryjna CBS',           'dali_awaryjne', 'KNR AL-01 0102', 0.55, 'szt',   'Montaż oprawy awaryjnej zasilanej z Centralnej Baterii'),
  ('oprawa centralna bateria',      'dali_awaryjne', 'KNR AL-01 0102', 0.55, 'szt',   'Montaż oprawy w systemie CBS'),
  ('szafa CBS centralna bateria',   'dali_awaryjne', 'KNR AL-01 0111', 12.00,'kpl',   'Montaż i podłączenie szafy Centralnej Baterii CBS'),
  ('magistrala DALI kabel',         'dali_awaryjne', 'KNR AL-01 0121', 3.80, '100mb', 'Ułożenie magistrali DALI (YDY 5x1.5/YTDY)'),
  ('kabel DALI układanie',          'dali_awaryjne', 'KNR AL-01 0121', 3.80, '100mb', 'Układanie kabla magistrali DALI'),
  ('zasilacz DALI DIN',             'dali_awaryjne', 'KNR AL-01 0131', 0.35, 'szt',   'Montaż zasilacza magistrali DALI na szynie DIN'),
  ('DALI power supply',             'dali_awaryjne', 'KNR AL-01 0131', 0.35, 'szt',   'Montaż zasilacza DALI'),
  ('gateway DALI router',           'dali_awaryjne', 'KNR AL-01 0132', 0.80, 'szt',   'Montaż routera/bramki DALI (Gateway)'),
  ('bramka DALI BMS',               'dali_awaryjne', 'KNR AL-01 0132', 0.80, 'szt',   'Montaż Gateway DALI do sieci BMS'),
  ('programowanie DALI adresowanie','dali_awaryjne', 'KNR AL-01 0141', 0.15, 'szt',   'Programowanie i adresowanie opraw DALI'),
  ('adresowanie DALI oprawa',       'dali_awaryjne', 'KNR AL-01 0141', 0.15, 'szt',   'Nadanie adresu DALI lampie'),
  ('czujka DALI multisensor',       'dali_awaryjne', 'KNR AL-01 0142', 0.50, 'szt',   'Montaż czujki obecności/natężenia DALI Multisensor'),
  ('sensor DALI obecność',          'dali_awaryjne', 'KNR AL-01 0142', 0.50, 'szt',   'Montaż i konfiguracja sensora DALI')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 5: Sieci LAN, Rack, Światłowody (es_knr_lan_rack_expert.json)
-- Stawka: 105 PLN/rbh | Kompleksowość: 3
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('kabel UTP skrętka kat6',      'lan_rack', 'KNR 5-06 0101', 3.80, '100mb', 'Układanie kabla UTP/FTP kat.5e/6/6a w trasach'),
  ('układanie kabla sieciowego',  'lan_rack', 'KNR 5-06 0101', 3.80, '100mb', 'Układanie skrętki w korytach kablowych'),
  ('kabel światłowodowy wnętrze', 'lan_rack', 'KNR 5-06 0102', 4.50, '100mb', 'Układanie kabla światłowodowego wewnątrz budynku'),
  ('światłowód układanie',        'lan_rack', 'KNR 5-06 0102', 4.50, '100mb', 'Układanie kabla FO w trasach kablowych'),
  ('gniazdo RJ45 keystone',       'lan_rack', 'KNR 5-06 0111', 0.25, 'szt',   'Montaż modułu RJ45 (Keystone) w gnieździe'),
  ('gniazdo LAN natynkowe',       'lan_rack', 'KNR 5-06 0111', 0.25, 'szt',   'Montaż gniazda logicznego RJ45'),
  ('floorbox puszka podłogowa',   'lan_rack', 'KNR 5-06 0112', 1.10, 'szt',   'Montaż floorboxa z modułami zasilanie+LAN'),
  ('szafa rack 19 wisząca',       'lan_rack', 'KNR 5-06 0121', 1.80, 'szt',   'Montaż szafy Rack 19" wiszącej do 15U'),
  ('rack wisząca szafa',          'lan_rack', 'KNR 5-06 0121', 1.80, 'szt',   'Montaż szafy rack wiszącej z uziemieniem'),
  ('szafa serwerowa stojąca',     'lan_rack', 'KNR 5-06 0122', 4.50, 'szt',   'Montaż szafy Rack 19" stojącej 24U-42U'),
  ('rack serwerowy 42U',          'lan_rack', 'KNR 5-06 0122', 4.50, 'szt',   'Montaż szafy serwerowej stojącej'),
  ('patchpanel 24-portowy',       'lan_rack', 'KNR 5-06 0131', 2.20, 'szt',   'Zaszycie patchpanelu 24-portowego kat.5e/6'),
  ('panel krosowniczy rack',      'lan_rack', 'KNR 5-06 0131', 2.20, 'szt',   'Zaszycie kabli UTP/FTP na patchpanelu'),
  ('spawanie światłowodów pigtail','lan_rack','KNR 5-06 0132', 0.30, 'spaw',  'Spawanie światłowodów w przełącznicy 19"'),
  ('spaw FO włókno',              'lan_rack', 'KNR 5-06 0132', 0.30, 'spaw',  'Spawanie włókna światłowodowego'),
  ('listwa PDU zasilająca rack',  'lan_rack', 'KNR 5-06 0141', 0.40, 'szt',   'Montaż listwy zasilającej PDU w rack'),
  ('UPS rack 19 montaż',          'lan_rack', 'KNR 5-06 0142', 1.50, 'szt',   'Montaż i uruchomienie UPS rack 19"'),
  ('switch router rack',          'lan_rack', 'KNR 5-06 0143', 0.60, 'szt',   'Montaż switcha/routera w rack i krosowanie'),
  ('pomiar LAN certyfikacja',     'lan_rack', 'KNR 5-06 0151', 0.15, 'port',  'Pomiary certyfikacyjne sieci LAN (Fluke)'),
  ('pomiar OTDR światłowód',      'lan_rack', 'KNR 5-06 0152', 0.25, 'włókno','Pomiary reflektometryczne linii światłowodowej OTDR')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 6: OZE, EV, Ogrzewanie (es_knr_oze_ev_ogrzewanie.json)
-- Stawka: 105 PLN/rbh | Kompleksowość: 3
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('wallbox ładowarka EV 11kW',    'oze_ev_ogrzewanie', 'KNR 9-10 0101', 2.50, 'szt', 'Montaż stacji ładowania EV Wallbox 11kW/22kW'),
  ('stacja ładowania EV',          'oze_ev_ogrzewanie', 'KNR 9-10 0101', 2.50, 'szt', 'Montaż wallbox ładowarki EV na elewacji'),
  ('zabezpieczenia EV RCD Typ B',  'oze_ev_ogrzewanie', 'KNR 9-10 0102', 1.00, 'kpl', 'Montaż zabezpieczeń EV: RCD Typ B + MCB w rozdzielnicy'),
  ('falownik PV fotowoltaiczny',   'oze_ev_ogrzewanie', 'KNR 9-10 0111', 3.00, 'szt', 'Montaż falownika (inwertera) PV 3-fazowego do 15kW'),
  ('inwerter solar 3-fazowy',      'oze_ev_ogrzewanie', 'KNR 9-10 0111', 3.00, 'szt', 'Montaż falownika fotowoltaicznego'),
  ('panel PV moduł dach skośny',   'oze_ev_ogrzewanie', 'KNR 9-10 0112', 1.20, 'szt', 'Montaż modułu PV na dachu skośnym z konstrukcją'),
  ('montaż panelu fotowoltaicznego','oze_ev_ogrzewanie','KNR 9-10 0112', 1.20, 'szt', 'Montaż modułu solarnego z hakami i profilem'),
  ('smart meter licznik energii',  'oze_ev_ogrzewanie', 'KNR 9-10 0121', 1.50, 'szt', 'Montaż smart metera z przekładnikami prądowymi CT'),
  ('mata grzewcza podłogowa',      'oze_ev_ogrzewanie', 'KNR 9-10 0131', 0.50, 'm2',  'Układanie maty grzejnej elektrycznej pod płytki'),
  ('elektryczne ogrzewanie podłogowe','oze_ev_ogrzewanie','KNR 9-10 0131',0.50,'m2',  'Montaż maty grzewczej podłogowej'),
  ('termostat smart Wi-Fi',        'oze_ev_ogrzewanie', 'KNR 9-10 0132', 0.40, 'szt', 'Montaż termostatu z czujnikiem powietrze+podłoga'),
  ('pompa ciepła podłączenie',     'oze_ev_ogrzewanie', 'KNR 9-10 0141', 4.50, 'kpl', 'Elektryczne podłączenie pompy ciepła (jednostka zew+wew)')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 7: Prace Ziemne i Trasy Zewnętrzne (es_knr_prace_ziemne.json)
-- Stawka: 95 PLN/rbh | Kompleksowość: 1
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('kopanie rowu ręcznie',         'prace_ziemne', 'KNR 2-01 0101', 2.50, 'm3',    'Kopanie rowu kablowego głębokość 0.8m grunt kat.III'),
  ('wykop pod kabel',              'prace_ziemne', 'KNR 2-01 0101', 2.50, 'm3',    'Ręczne kopanie rowu dla kabla'),
  ('kopanie minioparką',           'prace_ziemne', 'KNR 2-01 0102', 3.00, '100mb', 'Kopanie rowu kablowego minikoparką'),
  ('rów kablowy minikoparką',      'prace_ziemne', 'KNR 2-01 0102', 3.00, '100mb', 'Mechaniczne kopanie rowu'),
  ('podsypka piaskowa wykop',      'prace_ziemne', 'KNR 2-01 0111', 1.20, 'm3',    'Podsypka i nasypka piaskowa w wykopie 10+10cm'),
  ('układanie kabla YKY ziemia',   'prace_ziemne', 'KNR 5-01 0101', 3.50, '100mb', 'Ręczne układanie kabla YKY/YAKXS w wykopie'),
  ('kabel ziemny układanie',       'prace_ziemne', 'KNR 5-01 0101', 3.50, '100mb', 'Układanie kabla ziemnego w wykopie'),
  ('rura Arot DVK w wykopie',      'prace_ziemne', 'KNR 5-01 0111', 1.50, '100mb', 'Układanie rury osłonowej karbowanej Arot w wykopie'),
  ('rura osłonowa ziemia',         'prace_ziemne', 'KNR 5-01 0111', 1.50, '100mb', 'Układanie rury DVK/DVR w wykopie'),
  ('taśma ostrzegawcza niebieska', 'prace_ziemne', 'KNR 5-01 0121', 0.40, '100mb', 'Układanie taśmy ostrzegawczej w wykopie'),
  ('folia ostrzegawcza kabel',     'prace_ziemne', 'KNR 5-01 0121', 0.40, '100mb', 'Układanie folii ostrzegawczej nad kablem'),
  ('zasypanie wykopu zagęszczanie','prace_ziemne', 'KNR 2-01 0131', 1.80, 'm3',    'Zasypanie wykopu z zagęszczaniem mechanicznym'),
  ('przewiert sterowany HDD',      'prace_ziemne', 'KNR 5-01 0141', 0.80, 'mb',    'Przewiert sterowany/przecisk pod drogą/chodnikiem'),
  ('przecisk poziomy',             'prace_ziemne', 'KNR 5-01 0141', 0.80, 'mb',    'Wykonanie przecisku pod nawierzchnią drogową'),
  ('złącze kablowo-pomiarowe ZKP', 'prace_ziemne', 'KNR 5-01 0151', 4.50, 'szt',   'Montaż złącza ZKP w granicy działki')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 8: Pomiary Elektryczne i Remonty (es_knr_remonty_pomiary.json)
-- Stawka: 100 PLN/rbh | Kompleksowość: 2
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('demontaż oprawy gniazda',      'remonty_pomiary', 'KNR 4-03 0101', 0.08, 'szt', 'Demontaż oprawy/gniazda/wyłącznika'),
  ('demontaż osprzętu elektrycznego','remonty_pomiary','KNR 4-03 0101',0.08, 'szt', 'Demontaż starego osprzętu elektrycznego'),
  ('usunięcie przewodów z tynku',  'remonty_pomiary', 'KNR 4-03 0111', 0.12, 'mb',  'Wykucie i usunięcie starych przewodów z tynku'),
  ('demontaż instalacji stara',    'remonty_pomiary', 'KNR 4-03 0111', 0.12, 'mb',  'Wykucie starych przewodów z tynku'),
  ('demontaż rozdzielnicy',        'remonty_pomiary', 'KNR 4-03 0121', 1.50, 'szt', 'Demontaż starej rozdzielnicy z odłączeniem WLZ'),
  ('lokalizacja uszkodzenia kabla','remonty_pomiary', 'KNR 4-03 0131', 1.00, 'godz','Lokalizacja uszkodzenia kabla w ziemi/ścianie'),
  ('diagnostyka awaria kabel',     'remonty_pomiary', 'KNR 4-03 0131', 1.00, 'godz','Diagnostyka uszkodzenia kabla reflektometrem'),
  ('pomiar impedancji pętli',      'remonty_pomiary', 'KNR 5-08 0501', 0.12, 'szt', 'Pomiar impedancji pętli zwarcia (ochrona SWZ)'),
  ('pomiar impedancja zwarcia',    'remonty_pomiary', 'KNR 5-08 0501', 0.12, 'szt', 'Pomiar pętli zwarcia miernikiem MPI'),
  ('pomiar izolacji obwód',        'remonty_pomiary', 'KNR 5-08 0502', 0.25, 'obwód','Pomiar rezystancji izolacji obwodu 1-faz/3-faz'),
  ('badanie izolacji megaom',      'remonty_pomiary', 'KNR 5-08 0502', 0.25, 'obwód','Badanie izolacji napięciem 500V/1000V'),
  ('badanie RCD wyłącznik różn',   'remonty_pomiary', 'KNR 5-08 0511', 0.30, 'szt', 'Badanie wyłącznika różnicowoprądowego RCD'),
  ('test RCD czas zadziałania',    'remonty_pomiary', 'KNR 5-08 0511', 0.30, 'szt', 'Pomiar czasu i prądu zadziałania RCD'),
  ('pomiar rezystancji uziemienia','remonty_pomiary', 'KNR 5-08 0521', 0.80, 'uziom','Pomiar rezystancji uziemienia metodą 3-biegunową'),
  ('protokół pomiarów elektrycznych','remonty_pomiary','KNR 5-08 0531',1.50, 'kpl', 'Sporządzenie protokołu z pomiarów elektrycznych')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 9: Systemy Bezpieczeństwa CCTV/Alarm (es_knr_security_cctv_alarm.json)
-- Stawka: 105 PLN/rbh | Kompleksowość: 3
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('kamera IP kopułkowa wewnętrzna','bezpieczenstwo', 'KNR 5-06 0201', 1.20, 'szt', 'Montaż kamery IP/AHD wewnętrznej na suficie/ścianie'),
  ('kamera CCTV montaż',           'bezpieczenstwo', 'KNR 5-06 0201', 1.20, 'szt', 'Montaż kamery telewizji dozorowej wewnętrznej'),
  ('kamera zewnętrzna elewacja',   'bezpieczenstwo', 'KNR 5-06 0202', 1.80, 'szt', 'Montaż kamery zewnętrznej na elewacji ocieplonej'),
  ('kamera IP outdoor',            'bezpieczenstwo', 'KNR 5-06 0202', 1.80, 'szt', 'Montaż kamery zewnętrznej hermetycznej'),
  ('rejestrator NVR DVR',          'bezpieczenstwo', 'KNR 5-06 0211', 2.50, 'szt', 'Montaż i uruchomienie rejestratora NVR/DVR z HDD'),
  ('czujka PIR ruch wewnętrzna',   'bezpieczenstwo', 'KNR 5-06 0221', 0.80, 'szt', 'Montaż czujki ruchu PIR/Dual wewnętrznej'),
  ('detektor ruchu alarm',         'bezpieczenstwo', 'KNR 5-06 0221', 0.80, 'szt', 'Montaż czujki PIR z rezystorami parametrycznymi EOL'),
  ('kontaktron wpuszczany okno',   'bezpieczenstwo', 'KNR 5-06 0222', 1.10, 'szt', 'Montaż kontaktronu wpuszczanego w ramę okna/drzwi'),
  ('manipulator klawiatura alarm', 'bezpieczenstwo', 'KNR 5-06 0231', 1.20, 'szt', 'Montaż manipulatora LCD/dotykowego systemu alarmowego'),
  ('sygnalizator akustyczny optyczny','bezpieczenstwo','KNR 5-06 0241',1.50,'szt', 'Montaż sygnalizatora zew. optyczno-akustycznego'),
  ('wideodomofon stacja bramowa',  'bezpieczenstwo', 'KNR 5-06 0251', 2.50, 'szt', 'Montaż stacji bramowej wideodomofonu IP'),
  ('monitor wideodomofon wew',     'bezpieczenstwo', 'KNR 5-06 0252', 1.00, 'szt', 'Montaż monitora wideodomofonu wewnętrznego 7"'),
  ('zasilacz buforowy 12V alarm',  'bezpieczenstwo', 'KNR 5-06 0261', 1.20, 'szt', 'Montaż zasilacza buforowego 12V/5A dla CCTV/KD')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 10: SSP, Oddymianie, PPOŻ (es_knr_ssp_oddymianie.json)
-- Stawka: 110 PLN/rbh | Kompleksowość: 4
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('kabel ognioodporny E90 PH90',  'ppoz_ssp', 'KNR AL-01 0201', 5.50, '100mb', 'Układanie kabla ognioodpornego HTKSH PH90/HDGS E90'),
  ('HTKSH E90 kabel PPOŻ',         'ppoz_ssp', 'KNR AL-01 0201', 5.50, '100mb', 'Układanie kabla ognioodpornego natynkowo'),
  ('czujka dymu adresowalna',      'ppoz_ssp', 'KNR AL-01 0211', 0.45, 'szt',   'Montaż adresowalnej czujki dymu/ciepła z gniazdem'),
  ('czujka pożarowa optyczna',     'ppoz_ssp', 'KNR AL-01 0211', 0.45, 'szt',   'Montaż czujki optycznej SSP z nadaniem adresu'),
  ('ROP ręczny ostrzegacz pożaru', 'ppoz_ssp', 'KNR AL-01 0212', 0.60, 'szt',   'Montaż Ręcznego Ostrzegacza Pożarowego'),
  ('przycisk ROP SSP',             'ppoz_ssp', 'KNR AL-01 0212', 0.60, 'szt',   'Montaż przycisku alarmowania pożarowego'),
  ('sygnalizator PPOŻ czerwony',   'ppoz_ssp', 'KNR AL-01 0213', 0.50, 'szt',   'Montaż sygnalizatora akustycznego/optycznego PPOŻ'),
  ('centrala SSP montaż',          'ppoz_ssp', 'KNR AL-01 0221', 8.00, 'kpl',   'Montaż i programowanie centrali SSP (Polon/Bosch)'),
  ('centrala pożarowa programowanie','ppoz_ssp','KNR AL-01 0221', 8.00, 'kpl',  'Montaż centrali sygnalizacji pożarowej'),
  ('centrala oddymiania D+H',      'ppoz_ssp', 'KNR AL-01 0231', 2.50, 'szt',   'Montaż centrali oddymiania z akumulatorami 24V'),
  ('siłownik okienny klapa dymowa','ppoz_ssp', 'KNR AL-01 0232', 1.50, 'szt',   'Montaż siłownika okiennego klapy dymowej'),
  ('przycisk oddymiania pomarańcz','ppoz_ssp', 'KNR AL-01 0233', 1.00, 'kpl',   'Montaż przycisku oddymiania i czujki dymu klatki')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 11: Instalacje Odgromowe i Uziemienie (es_knr_uziomy_odgromowa.json)
-- Stawka: 100 PLN/rbh | Kompleksowość: 2
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('bednarka uziom otokowy',      'uziemienie_odgromowa', 'KNR 5-14 0101', 1.20, '10mb', 'Układanie bednarki ocynkowanej 30x4 w wykopie (uziom otokowy)'),
  ('bednarka ocynkowana uziom',   'uziemienie_odgromowa', 'KNR 5-14 0101', 1.20, '10mb', 'Układanie bednarki uziomowej'),
  ('bednarka fundamentowa',       'uziemienie_odgromowa', 'KNR 5-14 0102', 1.80, '10mb', 'Układanie bednarki uziomowej w ławie fundamentowej'),
  ('uziom fundamentowy bednarka', 'uziemienie_odgromowa', 'KNR 5-14 0102', 1.80, '10mb', 'Bednarka w betonie fundamentu'),
  ('uziom szpilkowy pionowy',     'uziemienie_odgromowa', 'KNR 5-14 0111', 0.45, 'mb',   'Wbijanie uziomów pionowych (szpilek) miedziowanych'),
  ('pręt uziomowy wbijanie',      'uziemienie_odgromowa', 'KNR 5-14 0111', 0.45, 'mb',   'Wbijanie pręta uziomowego SDS-Max'),
  ('spaw bednarka antykorozja',   'uziemienie_odgromowa', 'KNR 5-14 0121', 0.40, 'szt',  'Spawanie bednarek z zabezpieczeniem antykorozyjnym'),
  ('złącze kontrolne uziom',      'uziemienie_odgromowa', 'KNR 5-14 0131', 0.85, 'szt',  'Montaż złącza kontrolnego uziomu w puszce elewacyjnej'),
  ('drut odgromowy dach płaski',  'uziemienie_odgromowa', 'KNR 5-14 0141', 4.50, '100mb','Układanie drutu odgromowego fi8mm na dachu płaskim'),
  ('zwód poziomy dach płaski',    'uziemienie_odgromowa', 'KNR 5-14 0141', 4.50, '100mb','Układanie zwodów poziomych instalacji odgromowej'),
  ('drut odgromowy dach spadzisty','uziemienie_odgromowa','KNR 5-14 0142', 6.00, '100mb','Układanie drutu odgromowego na dachu spadzistym'),
  ('maszt odgromowy iglica',      'uziemienie_odgromowa', 'KNR 5-14 0151', 1.50, 'szt',  'Montaż masztu odgromowego (iglicy) na dachu/kominie'),
  ('GSU szyna uziemiająca główna','uziemienie_odgromowa', 'KNR 5-14 0161', 0.50, 'szt',  'Montaż Głównej Szyny Uziemiającej GSU/GSW natynkowo'),
  ('połączenia wyrównawcze rury', 'uziemienie_odgromowa', 'KNR 5-14 0162', 1.20, '10mb', 'Wykonanie połączeń wyrównawczych rur gazowych/wodnych LGY')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 12: Zasilanie Awaryjne, SZR, WLZ (es_knr_zasilanie_wlz_szr.json)
-- Stawka: 110 PLN/rbh | Kompleksowość: 4
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('agregat prądotwórczy posadowienie','zasilanie_awaryjne','KNR 5-08 0601',18.00,'kpl', 'Posadowienie agregatu prądotwórczego >50kVA'),
  ('generator posadowienie',       'zasilanie_awaryjne', 'KNR 5-08 0601', 18.00, 'kpl', 'Montaż stacjonarnego agregatu prądotwórczego'),
  ('szafa SZR samoczynne załączanie','zasilanie_awaryjne','KNR 5-08 0611', 8.50,'kpl', 'Montaż szafy SZR dla agregatu prądotwórczego'),
  ('SZR agregat sieć',             'zasilanie_awaryjne', 'KNR 5-08 0611',  8.50, 'kpl', 'Montaż i podłączenie szafy SZR'),
  ('UPS centralny trójfazowy',     'zasilanie_awaryjne', 'KNR 5-08 0621',  6.00, 'szt', 'Montaż UPS centralnego 3-fazowego 40-100kVA'),
  ('zasilacz UPS 3-faz wolnostojący','zasilanie_awaryjne','KNR 5-08 0621', 6.00, 'szt', 'Montaż dużego UPS wolnostojącego'),
  ('kabel WLZ 50-120mm2',          'zasilanie_awaryjne', 'KNR 5-08 0631', 14.00, '100mb','Układanie WLZ Cu/Al 50-120mm² na drabinkach'),
  ('kabel zasilający gruby WLZ',   'zasilanie_awaryjne', 'KNR 5-08 0631', 14.00, '100mb','Układanie ciężkiego kabla zasilającego WLZ'),
  ('kabel WLZ 150-240mm2',         'zasilanie_awaryjne', 'KNR 5-08 0632', 22.00, '100mb','Układanie WLZ Cu/Al 150-240mm² (bardzo ciężki)'),
  ('zarobienie końcówki 50-120mm2','zasilanie_awaryjne', 'KNR 5-08 0641',  0.25, 'szt', 'Zarobienie końcówki hydrauliczne 50-120mm²'),
  ('zaprasowanie końcówki WLZ',    'zasilanie_awaryjne', 'KNR 5-08 0641',  0.25, 'szt', 'Prasowanie końcówki kablowej Cu/Al 50-120mm²'),
  ('zarobienie końcówki 150-240mm2','zasilanie_awaryjne','KNR 5-08 0642',  0.40, 'szt', 'Zarobienie końcówki kablowej sektorowej 150-240mm²'),
  ('kabel sterowniczy LiYCY',      'zasilanie_awaryjne', 'KNR 5-08 0651',  4.50, '100mb','Układanie kabla sterowniczego LiYCY 12x0.5/24x0.75'),
  ('kabel wielożyłowy sterowniczy','zasilanie_awaryjne', 'KNR 5-08 0651',  4.50, '100mb','Układanie ekranowanego kabla sterowniczego'),
  ('rozszycie kabla sterowniczego','zasilanie_awaryjne', 'KNR 5-08 0652',  0.05, 'żyła', 'Rozszycie kabla sterowniczego — 1 żyła z tulejką')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- KATEGORIA 13: Infrastruktura Specjalna ATEX/Drogowa (es_knr_infrastruktura_specjalna.json)
-- Stawka: 110 PLN/rbh | Kompleksowość: 4
-- =============================================================================
INSERT INTO es_dictionary (keyword, category, knr_ref, labor_norm_rbh, unit, label) VALUES
  ('słup oświetleniowy drogowy',   'infrastruktura_specjalna', 'KNR 5-10 0101', 3.50, 'szt',   'Montaż słupa oświetleniowego 6-10m na fundamencie'),
  ('słup oświetlenia zewnętrznego','infrastruktura_specjalna', 'KNR 5-10 0101', 3.50, 'szt',   'Montaż słupa aluminiowego/stalowego drogowego'),
  ('oprawa drogowa LED podnośnik', 'infrastruktura_specjalna', 'KNR 5-10 0102', 1.50, 'szt',   'Montaż oprawy drogowej LED na wysięgniku — zwyżka'),
  ('oprawa uliczna zwyżka',        'infrastruktura_specjalna', 'KNR 5-10 0102', 1.50, 'szt',   'Montaż oprawy drogowej LED z podnośnika koszowego'),
  ('rozdzielnica budowlana RB',    'infrastruktura_specjalna', 'KNR 5-08 0701', 2.50, 'kpl',   'Montaż tymczasowej rozdzielnicy budowlanej RB'),
  ('eRBetka budowlana',            'infrastruktura_specjalna', 'KNR 5-08 0701', 2.50, 'kpl',   'Montaż i podłączenie rozdzielnicy budowlanej'),
  ('linia napowietrzna AsXSn',     'infrastruktura_specjalna', 'KNR 5-10 0111', 8.00, '100mb', 'Rozciąganie linii napowietrznej izolowanej AsXSn'),
  ('przewód napowietrzny 4x16',    'infrastruktura_specjalna', 'KNR 5-10 0111', 8.00, '100mb', 'Podwieszanie linii napowietrznej izolowanej'),
  ('oprawa EX ATEX wybuch',        'infrastruktura_specjalna', 'KNR 5-08 0711', 1.80, 'szt',   'Montaż oprawy/osprzętu w strefie zagrożonej wybuchem'),
  ('strefa ATEX instalacja',       'infrastruktura_specjalna', 'KNR 5-08 0711', 1.80, 'szt',   'Montaż w strefie EX z certyfikowanymi dławikami'),
  ('kabel grzejny rurociąg',       'infrastruktura_specjalna', 'KNR 5-08 0721', 1.20, '10mb',  'Układanie kabla grzejnego samoregulującego na rurociągu'),
  ('ogrzewanie elektryczne rura',  'infrastruktura_specjalna', 'KNR 5-08 0721', 1.20, '10mb',  'Kabel grzejny ochrona przed zamarzaniem rurociągu'),
  ('system przeciwoblodzeniowy rynna','infrastruktura_specjalna','KNR 5-08 0722',2.50,'10mb',  'Układanie systemu przeciwoblodzeniowego w rynnach')
ON CONFLICT (keyword_normalized) DO UPDATE SET
  category = EXCLUDED.category,
  knr_ref = EXCLUDED.knr_ref,
  labor_norm_rbh = EXCLUDED.labor_norm_rbh,
  unit = EXCLUDED.unit,
  label = EXCLUDED.label;

-- =============================================================================
-- Potwierdzenie: zliczenie nowych wpisów
-- =============================================================================
SELECT category, COUNT(*) AS ile_wpisow
FROM es_dictionary
WHERE category IN (
  'instalacje_podstawowe',
  'trasy_przemyslowe',
  'oswietlenie_montaz',
  'dali_awaryjne',
  'lan_rack',
  'oze_ev_ogrzewanie',
  'prace_ziemne',
  'remonty_pomiary',
  'bezpieczenstwo',
  'ppoz_ssp',
  'uziemienie_odgromowa',
  'zasilanie_awaryjne',
  'infrastruktura_specjalna'
)
GROUP BY category
ORDER BY category;


