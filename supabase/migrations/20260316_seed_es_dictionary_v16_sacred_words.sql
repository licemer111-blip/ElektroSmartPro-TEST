-- ============================================================
-- ES-Engine Dictionary Seed v16.0 — SACRED WORDS + UNIT GUARDRAILS
-- Sacred Words: tokeny techniczne, które NIE mogą być stemowane
--   przez AI ani fuzzy-match (muszą dopasować się DOKŁADNIE).
-- Unit Guardrails: każdy token ma ściśle przypisaną jednostkę.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABELA: es_sacred_words — tokeny chronione przed stemowaniem
-- (Jeśli tabela nie istnieje, tworzymy ją tutaj)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS es_sacred_words (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token       text NOT NULL UNIQUE,
  category    text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE es_sacred_words ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "es_sacred_words_select_all" ON es_sacred_words FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indeks dla szybkiego wyszukiwania
CREATE INDEX IF NOT EXISTS es_sacred_words_token_idx ON es_sacred_words(token);

-- ─────────────────────────────────────────────────────────────
-- SACRED WORDS — przekrojowe tokeny techniczne
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_sacred_words (token, category, description) VALUES

-- TYPY KABLI I PRZEWODÓW (muszą być dopasowane DOKŁADNIE)
('YDYp',    'kable', 'Przewód instalacyjny YDYp (płaski)'),
('YDYżo',   'kable', 'Przewód instalacyjny YDYżo (żyłka ochronna)'),
('YKY',     'kable', 'Kabel energetyczny YKY'),
('YAKXS',   'kable', 'Kabel aluminiowy YAKXS'),
('YKXS',    'kable', 'Kabel miedziany YKXS'),
('NYM',     'kable', 'Kabel NYM (przewód mieszkaniowy)'),
('N2XH',    'kable', 'Kabel bezhalogenowy N2XH'),
('NHXMH',   'kable', 'Kabel bezhalogenowy NHXMH'),
('HDGs',    'kable', 'Kabel ognioodporny HDGs'),
('HTKSH',   'kable', 'Kabel HDGs HTKSH PH90'),
('LgYżo',   'kable', 'Linka giętka LgYżo'),
('LiYCY',   'kable', 'Kabel sterowniczy ekranowany LiYCY'),
('YTKSY',   'kable', 'Kabel telefoniczny YTKSY'),
('UTP',     'kable', 'Kabel sieciowy UTP (nieekranowany)'),
('FTP',     'kable', 'Kabel sieciowy FTP (ekranowany)'),

-- PRZEKROJE KABLI (Sacred: 3x1.5, 3x2.5 itd.)
('3x1.5',   'przekroje', 'Przekrój kabla 3×1,5mm²'),
('3x2.5',   'przekroje', 'Przekrój kabla 3×2,5mm²'),
('4x1.5',   'przekroje', 'Przekrój kabla 4×1,5mm²'),
('4x2.5',   'przekroje', 'Przekrój kabla 4×2,5mm²'),
('5x2.5',   'przekroje', 'Przekrój kabla 5×2,5mm²'),
('5x4',     'przekroje', 'Przekrój kabla 5×4mm²'),
('5x6',     'przekroje', 'Przekrój kabla 5×6mm²'),
('5x10',    'przekroje', 'Przekrój kabla 5×10mm²'),
('4x25',    'przekroje', 'Przekrój kabla 4×25mm²'),
('4x70',    'przekroje', 'Przekrój kabla 4×70mm²'),
('1x240',   'przekroje', 'Przekrój kabla 1×240mm²'),
('2x1.5',   'przekroje', 'Przekrój kabla 2×1,5mm²'),
('2x2.5',   'przekroje', 'Przekrój kabla 2×2,5mm²'),

-- APARATURA MODUŁOWA (kody typów wyłączników)
('B6',      'aparatura', 'MCB char. B 6A'),
('B10',     'aparatura', 'MCB char. B 10A'),
('B16',     'aparatura', 'MCB char. B 16A'),
('B20',     'aparatura', 'MCB char. B 20A'),
('B25',     'aparatura', 'MCB char. B 25A'),
('B32',     'aparatura', 'MCB char. B 32A'),
('C6',      'aparatura', 'MCB char. C 6A'),
('C10',     'aparatura', 'MCB char. C 10A'),
('C16',     'aparatura', 'MCB char. C 16A'),
('C20',     'aparatura', 'MCB char. C 20A'),
('C25',     'aparatura', 'MCB char. C 25A'),
('C32',     'aparatura', 'MCB char. C 32A'),
('C40',     'aparatura', 'MCB char. C 40A'),
('C63',     'aparatura', 'MCB char. C 63A'),
('D16',     'aparatura', 'MCB char. D 16A'),
('D20',     'aparatura', 'MCB char. D 20A'),
('D32',     'aparatura', 'MCB char. D 32A'),

-- RCD TYPY (klasy różnicowoprądowe)
('RCD',     'aparatura', 'Wyłącznik różnicowoprądowy (ogólnie)'),
('RCBO',    'aparatura', 'Wyłącznik nadprądowo-różnicowoprądowy RCBO'),
('RCD A',   'aparatura', 'RCD Typ A (prądy zmienne+pulsujące)'),
('RCD AC',  'aparatura', 'RCD Typ AC (tylko prądy zmienne)'),
('RCD B',   'aparatura', 'RCD Typ B (prądy DC, dla EV/PV)'),
('RCD F',   'aparatura', 'RCD Typ F (dla pomp ciepła/falowników)'),
('30mA',    'aparatura', 'Czułość RCD 30mA (ochrona ludzi)'),
('300mA',   'aparatura', 'Czułość RCD 300mA (ochrona pożarowa)'),

-- KLASY OCHRONY IP
('IP20',    'ochrona', 'Klasa ochrony IP20 (pomieszczenia suche)'),
('IP44',    'ochrona', 'Klasa ochrony IP44 (łazienka)'),
('IP54',    'ochrona', 'Klasa ochrona IP54 (zewnętrzne)'),
('IP65',    'ochrona', 'Klasa ochrony IP65 (kurz+strumień wody)'),
('IP66',    'ochrona', 'Klasa ochrony IP66 (silny strumień wody)'),
('IP67',    'ochrona', 'Klasa ochrony IP67 (czasowe zanurzenie)'),
('IP68',    'ochrona', 'Klasa ochrony IP68 (trwałe zanurzenie)'),
('IK08',    'ochrona', 'Klasa odporności na uderzenia IK08'),
('IK10',    'ochrona', 'Klasa odporności na uderzenia IK10'),

-- PROTOKOŁY KOMUNIKACYJNE AUTOMATYKI
('KNX',     'automatyka', 'Magistrala KNX (europejski standard BMS)'),
('DALI',    'automatyka', 'Magistrala DALI (sterowanie oświetleniem)'),
('DALI-2',  'automatyka', 'DALI-2 (nowy standard)'),
('Modbus',  'automatyka', 'Protokół Modbus RTU/TCP'),
('BACnet',  'automatyka', 'Protokół BACnet (automatyka budynku)'),
('BMS',     'automatyka', 'Building Management System'),
('PoE',     'automatyka', 'Power over Ethernet'),
('RS485',   'automatyka', 'Magistrala RS-485'),
('LON',     'automatyka', 'LON Works magistrala'),
('SNMP',    'automatyka', 'Simple Network Management Protocol'),

-- SIECI LAN / OKABLOWANIE STRUKTURALNE
('Cat5e',   'lan', 'Kabel LAN Cat 5e'),
('Cat6',    'lan', 'Kabel LAN Cat 6'),
('Cat6a',   'lan', 'Kabel LAN Cat 6a'),
('Cat7',    'lan', 'Kabel LAN Cat 7'),
('RJ45',    'lan', 'Złącze RJ45'),
('RJ11',    'lan', 'Złącze RJ11 telefoniczne'),
('SFP',     'lan', 'Moduł SFP światłowodowy'),
('OM3',     'lan', 'Kabel światłowodowy wielomodowy OM3'),
('OM4',     'lan', 'Kabel światłowodowy wielomodowy OM4'),
('OS2',     'lan', 'Kabel światłowodowy jednomodowy OS2'),
('OTDR',    'lan', 'Reflektometr optyczny OTDR'),

-- FOTOWOLTAIKA / OZE
('MC4',     'pv', 'Złącze MC4 (instalacje PV)'),
('LiFePO4', 'pv', 'Bateria litowo-żelazowo-fosforanowa'),
('MPPT',    'pv', 'Regulator MPPT (fotowoltaika)'),
('OSD',     'pv', 'Operator Systemu Dystrybucyjnego'),
('kWp',     'pv', 'Kilowat-peak (moc instalacji PV)'),

-- OCHRONA PRZEPIĘCIOWA
('SPD',     'spd', 'Surge Protection Device (ochronnik)'),
('SPD T1',  'spd', 'Ochronnik przepięciowy Typ 1'),
('SPD T2',  'spd', 'Ochronnik przepięciowy Typ 2'),
('SPD T3',  'spd', 'Ochronnik przepięciowy Typ 3'),

-- NORMY I CERTYFIKATY
('PN-HD 60364', 'normy', 'Norma instalacji elektrycznych PN-HD 60364'),
('CNBOP',   'normy', 'Centrum Naukowo-Badawcze Ochrony Pożarowej'),
('E30',     'normy', 'Odporność ogniowa kabla E30'),
('E90',     'normy', 'Odporność ogniowa kabla E90'),
('PH90',    'normy', 'Podtrzymanie funkcji PH90'),

-- APARATURA SPECJALNA
('SZR',     'aparatura', 'Samoczynne Załączanie Rezerwy'),
('UPS',     'aparatura', 'Uninterruptible Power Supply'),
('ATS',     'aparatura', 'Automatic Transfer Switch'),
('PWP',     'aparatura', 'Przeciwpożarowy Wyłącznik Prądu'),
('WLZ',     'aparatura', 'Wewnętrzna Linia Zasilająca'),
('ZK',      'aparatura', 'Złącze Kablowe'),
('ZPP',     'aparatura', 'Zestaw złączowo-pomiarowy'),

-- SMART HOME / MARKI SYSTEMÓW
('Fibaro',  'smart', 'Fibaro — system Smart Home Z-Wave'),
('Shelly',  'smart', 'Shelly — moduły IoT Wi-Fi'),
('Grenton', 'smart', 'Grenton — polski system Smart Home'),
('Supla',   'smart', 'Zamel Supla — polska automatyka'),
('Tuya',    'smart', 'Tuya — chiński system IoT'),
('Z-Wave',  'smart', 'Z-Wave — protokół bezprzewodowy'),
('Zigbee',  'smart', 'Zigbee — protokół mesh bezprzewodowy'),

-- SYSTEMY BEZPIECZEŃSTWA
('PIR',     'security', 'Passive Infrared detektor ruchu'),
('NVR',     'security', 'Network Video Recorder'),
('DVR',     'security', 'Digital Video Recorder'),
('EVSE',    'security', 'Electric Vehicle Supply Equipment'),
('FTTH',    'security', 'Fiber To The Home'),
('ONT',     'security', 'Optical Network Terminal')

ON CONFLICT (token) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- UNIT INTEGRITY GUARDRAILS — tokeny z przypisaną jednostką
-- Cel: jeśli pozycja zawiera ten token, wymuszamy jednostkę
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS es_unit_guardrails (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token           text NOT NULL,
  token_normalized text GENERATED ALWAYS AS (lower(token)) STORED,
  required_unit   text NOT NULL,
  category        text NOT NULL,
  match_strategy  text NOT NULL DEFAULT 'contains',
  priority        int  NOT NULL DEFAULT 1,
  description     text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (token, required_unit)
);

ALTER TABLE es_unit_guardrails ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "es_unit_guardrails_select_all" ON es_unit_guardrails FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS es_unit_guardrails_token_idx
  ON es_unit_guardrails(token_normalized);

-- ─────────────────────────────────────────────────────────────
-- GUARDRAILS — UNIT: mb (metr bieżący)
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_unit_guardrails (token, required_unit, category, match_strategy, priority, description) VALUES
('przewód',           'mb', 'kable', 'starts_with', 10, 'Każdy przewód/kabel = mb'),
('kabel',             'mb', 'kable', 'starts_with', 10, 'Każdy kabel = mb'),
('YDYp',              'mb', 'kable', 'contains',    10, 'Kabel YDYp = mb'),
('YDYżo',             'mb', 'kable', 'contains',    10, 'Kabel YDYżo = mb'),
('YKY',               'mb', 'kable', 'contains',    10, 'Kabel YKY = mb'),
('YAKXS',             'mb', 'kable', 'contains',    10, 'Kabel YAKXS = mb'),
('YKXS',              'mb', 'kable', 'contains',    10, 'Kabel YKXS = mb'),
('NYM',               'mb', 'kable', 'contains',    10, 'Kabel NYM = mb'),
('N2XH',              'mb', 'kable', 'contains',    10, 'Kabel N2XH = mb'),
('NHXMH',             'mb', 'kable', 'contains',    10, 'Kabel NHXMH = mb'),
('HDGs',              'mb', 'kable', 'contains',    10, 'Kabel HDGs = mb'),
('LgYżo',             'mb', 'kable', 'contains',    10, 'Linka LgYżo = mb'),
('UTP',               'mb', 'lan',   'contains',     9, 'Kabel UTP/LAN = mb'),
('FTP',               'mb', 'lan',   'contains',     9, 'Kabel FTP = mb'),
('bruzda',            'mb', 'prowadzenie', 'contains', 8, 'Bruzdowanie ściany = mb'),
('kucie',             'mb', 'prowadzenie', 'contains', 8, 'Kucie bruzdy = mb'),
('korytko',           'mb', 'trasy', 'contains',     8, 'Montaż korytka = mb'),
('drabinka kablowa',  'mb', 'trasy', 'contains',     8, 'Drabinka kablowa = mb'),
('peszel',            'mb', 'trasy', 'contains',     8, 'Peszel/rura ochronna = mb'),
('rura karbowana',    'mb', 'trasy', 'contains',     8, 'Rura karbowana = mb'),
('szynoprzewód',      'mb', 'trasy', 'contains',     8, 'Szynoprzewód = mb'),
('magistrala',        'mb', 'trasy', 'contains',     7, 'Magistrala kablowa = mb'),
('linia zasilająca',  'mb', 'przylacza', 'contains', 9, 'Linia zasilająca WLZ = mb'),
('WLZ',               'mb', 'przylacza', 'contains', 9, 'WLZ = mb'),
('światłowód',        'mb', 'swiatlowody', 'contains', 9, 'Kabel światłowodowy = mb'),
('listwa LED',        'mb', 'led',  'contains',      8, 'Listwa LED = mb'),
('profil LED',        'mb', 'led',  'contains',      8, 'Profil LED = mb'),
('taśma LED',         'mb', 'led',  'contains',      8, 'Taśma LED = mb'),
('drut odgromowy',    'mb', 'uziemienie', 'contains', 9, 'Drut odgromowy = mb'),
('zwód poziomy',      'mb', 'uziemienie', 'contains', 9, 'Zwód poziomy = mb')

ON CONFLICT (token, required_unit) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- GUARDRAILS — UNIT: szt (sztuka)
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_unit_guardrails (token, required_unit, category, match_strategy, priority, description) VALUES
('gniazdo',           'szt', 'osprzet', 'starts_with', 10, 'Gniazdo elektryczne = szt'),
('łącznik',           'szt', 'osprzet', 'starts_with', 10, 'Łącznik/wyłącznik = szt'),
('wyłącznik',         'szt', 'aparatura', 'starts_with', 10, 'Wyłącznik nadprądowy = szt'),
('różnicówka',        'szt', 'aparatura', 'starts_with', 10, 'Różnicówka RCD = szt'),
('ochronnik',         'szt', 'aparatura', 'starts_with', 10, 'Ochronnik przepięciowy = szt'),
('SPD',               'szt', 'aparatura', 'contains',    10, 'SPD = szt'),
('MCB',               'szt', 'aparatura', 'contains',    10, 'MCB = szt'),
('RCD',               'szt', 'aparatura', 'contains',    10, 'RCD (ogólnie) = szt'),
('RCBO',              'szt', 'aparatura', 'contains',    10, 'RCBO = szt'),
('oprawa',            'szt', 'oswietlenie', 'starts_with', 9, 'Oprawa oświetleniowa = szt'),
('lampa',             'szt', 'oswietlenie', 'starts_with', 8, 'Lampa = szt'),
('czujnik',           'szt', 'automatyka', 'starts_with', 8, 'Czujnik = szt'),
('kamera',            'szt', 'security', 'starts_with',  9, 'Kamera CCTV = szt'),
('UPS',               'szt', 'zasilanie', 'contains',     9, 'UPS = szt'),
('agregat',           'szt', 'zasilanie', 'starts_with',  9, 'Agregat prądotwórczy = szt'),
('rozdzielnica',      'szt', 'rozdzielnice', 'starts_with', 8, 'Rozdzielnica = szt'),
('Wallbox',           'szt', 'ev', 'contains',           10, 'Wallbox stacja EV = szt'),
('stacja ładowania',  'szt', 'ev', 'contains',            9, 'Stacja ładowania EV = szt'),
('falownik',          'szt', 'fotowoltaika', 'starts_with', 9, 'Falownik/inwerter = szt'),
('centrala alarmowa', 'szt', 'security', 'contains',      9, 'Centrala alarmowa = szt'),
('puszka',            'szt', 'osprzet', 'starts_with',    7, 'Puszka elektryczna = szt'),
('punkt',             'szt', 'osprzet', 'starts_with',    5, 'Punkt elektryczny = szt (domyślnie)'),
('spaw',              'szt', 'swiatlowody', 'starts_with', 9, 'Spaw światłowodowy = szt')

ON CONFLICT (token, required_unit) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- GUARDRAILS — UNIT: kpl (komplet)
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_unit_guardrails (token, required_unit, category, match_strategy, priority, description) VALUES
('zestaw',              'kpl', 'zestawy', 'starts_with',  9, 'Zestaw = kpl'),
('komplet',             'kpl', 'zestawy', 'contains',     9, 'Komplet = kpl'),
('system',              'kpl', 'systemy', 'starts_with',  7, 'System = kpl'),
('instalacja kpl',      'kpl', 'systemy', 'contains',     8, 'Instalacja kpl = kpl'),
('SZR',                 'kpl', 'zasilanie', 'contains',   9, 'SZR = kpl (układ)'),
('dokumentacja',        'kpl', 'dokumentacja', 'starts_with', 9, 'Dokumentacja powykonawcza = kpl'),
('pomiary odbiorcze',   'kpl', 'pomiary', 'contains',     9, 'Pomiary odbiorcze = kpl'),
('technologia basenowa','kpl', 'ogrod',  'contains',      8, 'Technika basenowa = kpl'),
('multiroom',           'kpl', 'smart',  'contains',      8, 'Multiroom audio = kpl'),
('wideodomofon',        'kpl', 'interkomy', 'contains',   9, 'Wideodomofon = kpl (komplet)'),
('próba funkcjonalna',  'kpl', 'ppoz',   'contains',      9, 'Próba PWP = kpl'),
('prefabrykacja',       'kpl', 'rozdzielnice', 'starts_with', 9, 'Prefabrykacja rozdzielnicy = kpl')

ON CONFLICT (token, required_unit) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- GUARDRAILS — UNIT: m2 (metr kwadratowy)
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_unit_guardrails (token, required_unit, category, match_strategy, priority, description) VALUES
('mata grzejna',          'm2', 'ogrzewanie', 'contains',  9, 'Maty grzejne = m2'),
('ogrzewanie podłogowe',  'm2', 'ogrzewanie', 'contains',  9, 'Ogrzewanie podłogowe = m2'),
('panele PV',             'kWp','fotowoltaika','contains',  9, 'Panele fotowoltaiczne = kWp')

ON CONFLICT (token, required_unit) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- GUARDRAILS — UNIT: godz (godzina)
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_unit_guardrails (token, required_unit, category, match_strategy, priority, description) VALUES
('zwyżka',          'godz', 'wysokosci', 'contains',  9, 'Zwyżka/podnośnik koszowy = godz'),
('podnośnik koszowy','godz','wysokosci', 'contains',   9, 'Podnośnik koszowy = godz'),
('diagnostyka',     'godz', 'serwis', 'starts_with',  8, 'Diagnostyka awarii = godz'),
('pogotowie',       'godz', 'serwis', 'starts_with',  8, 'Pogotowie elektryczne = godz'),
('inwentaryzacja',  'godz', 'dokumentacja', 'starts_with', 8, 'Inwentaryzacja = godz')

ON CONFLICT (token, required_unit) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- GUARDRAILS — UNIT: m-c (miesiąc — wynajem)
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_unit_guardrails (token, required_unit, category, match_strategy, priority, description) VALUES
('najem',     'm-c', 'wynajem', 'starts_with', 9, 'Najem/wynajem miesięczny = m-c'),
('wynajem',   'm-c', 'wynajem', 'starts_with', 9, 'Wynajem sprzętu = m-c'),
('dzierżawa', 'm-c', 'wynajem', 'starts_with', 8, 'Dzierżawa = m-c')

ON CONFLICT (token, required_unit) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- ES-DICTIONARY: dodatkowe tokeny Sacred Words jako keywords
-- Każde Sacred Word jest osobnym wpisem w słowniku dla Phase 1
-- ─────────────────────────────────────────────────────────────
INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- KABLE — typy z przekrojami (najczęstsze kombinacje)
('ydyp 3x1.5',   'KNR 5-04 0101-01', 'Przewód YDYp 3×1,5mm²',   'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 2.0),
('ydyp 3x2.5',   'KNR 5-04 0101-02', 'Przewód YDYp 3×2,5mm²',   'robocizna', false, NULL, 0.030, 'mb', 'kable_silnopradowe', 2.0),
('ydyp 5x2.5',   'KNR 5-04 0101-03', 'Przewód YDYp 5×2,5mm²',   'robocizna', false, NULL, 0.035, 'mb', 'kable_silnopradowe', 2.0),
('ydyp 5x4',     'KNR 5-04 0101-04', 'Przewód YDYp 5×4mm²',     'robocizna', false, NULL, 0.038, 'mb', 'kable_silnopradowe', 2.0),
('nym 3x1.5',    'KNR 5-04 0101-01', 'Kabel NYM 3×1,5mm²',       'robocizna', false, NULL, 0.025, 'mb', 'kable_silnopradowe', 1.8),
('nym 3x2.5',    'KNR 5-04 0101-02', 'Kabel NYM 3×2,5mm²',       'robocizna', false, NULL, 0.030, 'mb', 'kable_silnopradowe', 1.8),
('n2xh 3x1.5',   'KNR 5-04 0101-01', 'Kabel N2XH 3×1,5mm²',      'robocizna', false, NULL, 0.028, 'mb', 'kable_silnopradowe', 1.8),
('n2xh 5x2.5',   'KNR 5-04 0101-03', 'Kabel N2XH 5×2,5mm²',      'robocizna', false, NULL, 0.035, 'mb', 'kable_silnopradowe', 1.8),
('yky 4x25',     'KNR 5-04 0103-01', 'Kabel YKY 4×25mm²',         'robocizna', false, NULL, 0.055, 'mb', 'kable_silnopradowe', 2.0),
('yky 4x70',     'KNR 5-04 0103-03', 'Kabel YKY 4×70mm²',         'robocizna', false, NULL, 0.080, 'mb', 'kable_silnopradowe', 2.0),
('lgzzo 16mm2',  'KNR 5-04 0101-05', 'Linka LgYżo 1×16mm²',       'robocizna', false, NULL, 0.020, 'mb', 'kable_silnopradowe', 1.8),

-- APARATURA MODUŁOWA z kodem (Sacred)
('mcb b16',      'KNR 5-04 1201-01', 'Wyłącznik MCB B16A',        'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 2.0),
('mcb c16',      'KNR 5-04 1201-01', 'Wyłącznik MCB C16A',        'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 2.0),
('mcb c20',      'KNR 5-04 1201-01', 'Wyłącznik MCB C20A',        'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 2.0),
('mcb c25',      'KNR 5-04 1201-01', 'Wyłącznik MCB C25A',        'robocizna', false, NULL, 0.35, 'szt', 'aparatura', 2.0),
('mcb c32',      'KNR 5-04 1201-01', 'Wyłącznik MCB C32A',        'robocizna', false, NULL, 0.38, 'szt', 'aparatura', 2.0),
('rcd 30ma',     'KNR 5-04 1202-01', 'RCD 30mA Typ A/AC',         'robocizna', false, NULL, 0.40, 'szt', 'aparatura', 2.0),
('rcd 300ma',    'KNR 5-04 1202-02', 'RCD 300mA (p-poż)',         'robocizna', false, NULL, 0.40, 'szt', 'aparatura', 2.0),
('spd t2',       'KNR 5-04 1205-02', 'Ochronnik SPD Typ 2',       'robocizna', false, NULL, 0.45, 'szt', 'aparatura', 2.0),
('spd t1+t2',    'KNR 5-04 1205-01', 'Ochronnik SPD Typ 1+2',    'robocizna', false, NULL, 0.60, 'szt', 'aparatura', 2.0),

-- SIEĆ LAN — typy portów i kabli
('utp cat6',     'ES-IT-002', 'Kabel UTP Cat6 ułożenie',          'robocizna', false, NULL, 0.025, 'mb', 'it_siec', 1.8),
('utp cat6a',    'ES-IT-002', 'Kabel UTP Cat6a ułożenie',         'robocizna', false, NULL, 0.025, 'mb', 'it_siec', 1.8),
('ftp cat6a',    'ES-IT-002', 'Kabel FTP Cat6a ułożenie',         'robocizna', false, NULL, 0.028, 'mb', 'it_siec', 1.8),
('rj45 cat6a',   'ES-IT-002', 'Gniazdo RJ45 Cat6a Keystone',      'robocizna', false, NULL, 0.50,  'szt', 'it_siec', 2.0)

ON CONFLICT (keyword_normalized) DO NOTHING;
