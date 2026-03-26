-- ES-Dictionary v22: Instalacje specjalne + Teletechnika + E-mobility
-- ~100 entries covering gaps: structured cabling, IT cabinets, ATEX basics,
-- medical IT systems, EV charging, data center

INSERT INTO es_dictionary (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight) VALUES

-- ─── TELETECHNIKA / STRUCTURED CABLING ───────────────────────────────────────
('kabel utp kat6', 'KNR 5-08 0201-01', 'Kabel UTP kat.6 instalacja', 'robocizna', false, '[]', 0.040, 'mb', 'teletechnika', 1.0),
('kabel utp kat.6', 'KNR 5-08 0201-01', 'Kabel UTP kat.6 instalacja', 'robocizna', false, '[]', 0.040, 'mb', 'teletechnika', 1.0),
('przewod utp cat6', 'KNR 5-08 0201-01', 'Kabel UTP kat.6 instalacja', 'robocizna', false, '[]', 0.040, 'mb', 'teletechnika', 1.0),
('kabel utp kat5e', 'KNR 5-08 0201-01', 'Kabel UTP kat.5e instalacja', 'robocizna', false, '[]', 0.035, 'mb', 'teletechnika', 1.0),
('kabel sftp kat6a', 'KNR 5-08 0201-02', 'Kabel SFTP kat.6A instalacja', 'robocizna', false, '[]', 0.050, 'mb', 'teletechnika', 1.0),
('kabel sftp kat.6a', 'KNR 5-08 0201-02', 'Kabel SFTP kat.6A instalacja', 'robocizna', false, '[]', 0.050, 'mb', 'teletechnika', 1.0),
('gniazdo rj45', 'KNR 5-08 0301-01', 'Gniazdo RJ-45 kat.6 montaż', 'robocizna', false, '[]', 0.350, 'szt', 'teletechnika', 1.0),
('gniazdo rj-45', 'KNR 5-08 0301-01', 'Gniazdo RJ-45 kat.6 montaż', 'robocizna', false, '[]', 0.350, 'szt', 'teletechnika', 1.0),
('gniazdo sieciowe', 'KNR 5-08 0301-01', 'Gniazdo sieciowe RJ-45', 'robocizna', false, '[]', 0.350, 'szt', 'teletechnika', 1.0),
('gniazdo komputerowe', 'KNR 5-08 0301-01', 'Gniazdo komputerowe', 'robocizna', false, '[]', 0.350, 'szt', 'teletechnika', 1.0),
('punkt logiczny', 'KNR 5-08 0401-01', 'Punkt logiczny LAN kat.6', 'robocizna', false, '[]', 1.200, 'pkt', 'teletechnika', 1.0),
('punkt lan', 'KNR 5-08 0401-01', 'Punkt LAN kat.6', 'robocizna', false, '[]', 1.200, 'pkt', 'teletechnika', 1.0),
('punkt teletechniczny', 'KNR 5-08 0401-01', 'Punkt teletechniczny', 'robocizna', false, '[]', 1.200, 'pkt', 'teletechnika', 1.0),
('panel krosowniczy 24', 'KNR 5-08 0501-01', 'Patchpanel 24 porty RJ-45', 'robocizna', false, '[]', 1.800, 'szt', 'teletechnika', 1.0),
('patchpanel 24p', 'KNR 5-08 0501-01', 'Patchpanel 24 porty', 'robocizna', false, '[]', 1.800, 'szt', 'teletechnika', 1.0),
('patchpanel 48p', 'KNR 5-08 0501-02', 'Patchpanel 48 portów', 'robocizna', false, '[]', 2.800, 'szt', 'teletechnika', 1.0),
('panel krosowniczy 48', 'KNR 5-08 0501-02', 'Patchpanel 48 portów', 'robocizna', false, '[]', 2.800, 'szt', 'teletechnika', 1.0),
('szafa rack 19', 'KNR 5-08 0601-01', 'Szafa serwerowa 19" 42U montaż', 'robocizna', false, '[]', 6.000, 'szt', 'teletechnika', 1.0),
('szafa serwerowa', 'KNR 5-08 0601-01', 'Szafa serwerowa 19"', 'robocizna', false, '[]', 6.000, 'szt', 'teletechnika', 1.0),
('szafa rack', 'KNR 5-08 0601-01', 'Szafa rack 19"', 'robocizna', false, '[]', 6.000, 'szt', 'teletechnika', 1.0),
('szafa 19 cali', 'KNR 5-08 0601-01', 'Szafa rack 19"', 'robocizna', false, '[]', 6.000, 'szt', 'teletechnika', 1.0),
('szafka wisząca rack', 'KNR 5-08 0601-02', 'Szafka wisząca rack 19" 12U', 'robocizna', false, '[]', 3.500, 'szt', 'teletechnika', 1.0),
('switch sieciowy', 'KNR 5-08 0701-01', 'Switch sieciowy montaż', 'robocizna', false, '[]', 1.500, 'szt', 'teletechnika', 1.0),
('przelacznik sieciowy', 'KNR 5-08 0701-01', 'Switch sieciowy montaż', 'robocizna', false, '[]', 1.500, 'szt', 'teletechnika', 1.0),
('access point wifi', 'KNR 5-08 0801-01', 'Access point WiFi montaż', 'robocizna', false, '[]', 0.800, 'szt', 'teletechnika', 1.0),
('punkt dostępowy wifi', 'KNR 5-08 0801-01', 'Punkt dostępowy WiFi', 'robocizna', false, '[]', 0.800, 'szt', 'teletechnika', 1.0),
('ap wifi', 'KNR 5-08 0801-01', 'Access Point WiFi', 'robocizna', false, '[]', 0.800, 'szt', 'teletechnika', 1.0),
('okablowanie strukturalne', 'KNR 5-08 0401-01', 'Okablowanie strukturalne punkt', 'robocizna', false, '[]', 1.200, 'pkt', 'teletechnika', 1.0),
('nvu nvr', 'KNR 5-08 0901-01', 'Montaż rejestratora NVR', 'robocizna', false, '[]', 3.000, 'szt', 'teletechnika', 0.9),
('kamera ip', 'KNR 5-08 1001-01', 'Kamera IP montaż + okablowanie', 'robocizna', false, '[]', 1.200, 'szt', 'teletechnika', 1.0),
('kamera cctv', 'KNR 5-08 1001-01', 'Kamera CCTV montaż', 'robocizna', false, '[]', 1.200, 'szt', 'teletechnika', 1.0),
('czujnik ruchu pir', 'KNR 5-08 1101-01', 'Czujnik ruchu PIR', 'robocizna', false, '[]', 0.400, 'szt', 'teletechnika', 1.0),

-- ─── E-MOBILITY / ŁADOWARKI EV ───────────────────────────────────────────────
('ladowarka wallbox', 'KNR 5-04 2001-01', 'Ładowarka AC wallbox do 22kW montaż', 'robocizna', false, '[]', 3.500, 'szt', 'e_mobility', 1.0),
('stacja ladowania ev', 'KNR 5-04 2001-01', 'Stacja ładowania EV AC montaż', 'robocizna', false, '[]', 3.500, 'szt', 'e_mobility', 1.0),
('ladowarka ac ev', 'KNR 5-04 2001-01', 'Ładowarka AC EV', 'robocizna', false, '[]', 3.500, 'szt', 'e_mobility', 1.0),
('ladowarka dc fast', 'KNR 5-04 2002-01', 'Ładowarka DC fast charge 50kW+', 'robocizna', false, '[]', 10.000, 'szt', 'e_mobility', 1.0),
('stacja dc ccs', 'KNR 5-04 2002-01', 'Stacja DC CCS montaż', 'robocizna', false, '[]', 10.000, 'szt', 'e_mobility', 1.0),
('kabel zasilajacy ladowarke', 'KNR 5-09 2001-01', 'Kabel zasilający ładowarkę EV', 'robocizna', false, '[]', 0.050, 'mb', 'e_mobility', 1.0),
('podlicznik ev', 'KNR 5-04 2003-01', 'Podlicznik energii EV montaż', 'robocizna', false, '[]', 1.200, 'szt', 'e_mobility', 1.0),

-- ─── INSTALACJE MEDYCZNE IT (Izolowany system zasilania) ─────────────────────
('gniazdo it medyczne', 'KNR 5-04 1501-01', 'Gniazdo 230V system IT medyczny', 'robocizna', false, '[]', 0.650, 'szt', 'instalacje_medyczne', 1.0),
('gniazdo system it', 'KNR 5-04 1501-01', 'Gniazdo w systemie IT', 'robocizna', false, '[]', 0.650, 'szt', 'instalacje_medyczne', 1.0),
('separator medyczny', 'KNR 5-04 1502-01', 'Separator izolujący IT medyczny montaż', 'robocizna', false, '[]', 10.000, 'szt', 'instalacje_medyczne', 1.0),
('transformator separacyjny medyczny', 'KNR 5-04 1502-01', 'Transformator separacyjny IT', 'robocizna', false, '[]', 10.000, 'szt', 'instalacje_medyczne', 1.0),
('monitor izolacji', 'KNR 5-04 1503-01', 'Monitor izolacji IMD montaż', 'robocizna', false, '[]', 4.000, 'szt', 'instalacje_medyczne', 1.0),
('imd monitor', 'KNR 5-04 1503-01', 'Monitor izolacji IMD', 'robocizna', false, '[]', 4.000, 'szt', 'instalacje_medyczne', 1.0),
('panel alarmowy it', 'KNR 5-04 1504-01', 'Panel alarmowy systemu IT', 'robocizna', false, '[]', 3.000, 'szt', 'instalacje_medyczne', 1.0),
('tablica zasilajaca medyczna', 'KNR 5-04 1505-01', 'Tablica zasilająca medyczna IT', 'robocizna', false, '[]', 12.000, 'szt', 'instalacje_medyczne', 0.9),

-- ─── INSTALACJE ATEX / EX (Strefy zagrożenia wybuchem) ───────────────────────
('oprawa oswietleniowa ex', 'KNR 5-04 1601-01', 'Oprawa oświetleniowa Ex strefa 1/2', 'robocizna', false, '[]', 2.000, 'szt', 'instalacje_specjalne', 1.0),
('oprawa ex', 'KNR 5-04 1601-01', 'Oprawa Ex montaż', 'robocizna', false, '[]', 2.000, 'szt', 'instalacje_specjalne', 1.0),
('oprawa atex', 'KNR 5-04 1601-01', 'Oprawa ATEX', 'robocizna', false, '[]', 2.000, 'szt', 'instalacje_specjalne', 1.0),
('gniazdo ex', 'KNR 5-04 1602-01', 'Gniazdo Ex strefa 1/2 montaż', 'robocizna', false, '[]', 1.500, 'szt', 'instalacje_specjalne', 1.0),
('gniazdo przemyslowe ex', 'KNR 5-04 1602-01', 'Gniazdo przemysłowe Ex', 'robocizna', false, '[]', 1.500, 'szt', 'instalacje_specjalne', 1.0),
('skrzynka ex', 'KNR 5-04 1603-01', 'Skrzynka rozdzielcza Ex', 'robocizna', false, '[]', 5.000, 'szt', 'instalacje_specjalne', 1.0),
('rozdzielnica atex', 'KNR 5-04 1603-02', 'Rozdzielnica ATEX montaż', 'robocizna', false, '[]', 8.000, 'szt', 'instalacje_specjalne', 1.0),
('kabel ex nhxhx', 'KNR 5-04 1604-01', 'Kabel Ex NHXHX strefa zagrożenia', 'robocizna', false, '[]', 0.080, 'mb', 'instalacje_specjalne', 1.0),
('kabel atex', 'KNR 5-04 1604-01', 'Kabel ATEX montaż', 'robocizna', false, '[]', 0.080, 'mb', 'instalacje_specjalne', 1.0),
('dławnica ex', 'KNR 5-04 1605-01', 'Dławnica kablowa Ex', 'robocizna', false, '[]', 0.500, 'szt', 'instalacje_specjalne', 1.0),
('czujnik ex', 'KNR 5-04 1606-01', 'Czujnik/detektor Ex montaż', 'robocizna', false, '[]', 1.200, 'szt', 'instalacje_specjalne', 0.9),

-- ─── DATA CENTER / SERWEROWNIA ────────────────────────────────────────────────
('kabel zasilajacy ups', 'KNR 5-04 1701-01', 'Kabel zasilający UPS', 'robocizna', false, '[]', 0.060, 'mb', 'data_center', 1.0),
('ups zasilacz', 'KNR 5-04 1702-01', 'UPS rack montaż i okablowanie', 'robocizna', false, '[]', 4.000, 'szt', 'data_center', 1.0),
('ups tower', 'KNR 5-04 1702-02', 'UPS tower montaż', 'robocizna', false, '[]', 3.000, 'szt', 'data_center', 1.0),
('zasilacz awaryjny ups', 'KNR 5-04 1702-01', 'Zasilacz awaryjny UPS', 'robocizna', false, '[]', 4.000, 'szt', 'data_center', 1.0),
('pdu listwa zasilajaca', 'KNR 5-04 1703-01', 'PDU listwa zasilająca rack', 'robocizna', false, '[]', 0.800, 'szt', 'data_center', 1.0),
('listwa zasilajaca rack', 'KNR 5-04 1703-01', 'Listwa zasilająca rack PDU', 'robocizna', false, '[]', 0.800, 'szt', 'data_center', 1.0),
('klimatyzator serwerowni', 'KNR 5-04 1704-01', 'Klimatyzacja precyzyjna serwerowni', 'robocizna', false, '[]', 8.000, 'szt', 'data_center', 0.9),
('szyna kablowa data center', 'KNR 5-04 1705-01', 'Szyna kablowa pod podłogą', 'robocizna', false, '[]', 0.030, 'mb', 'data_center', 0.9),

-- ─── TRAFOSTACJE ROZBUDOWA ────────────────────────────────────────────────────
('trafostacja 630kva', 'KNR K-47 0301-01', 'Trafostacja 630kVA kompletna', 'robocizna', false, '[]', 80.000, 'kpl', 'trafostacje', 0.9),
('transformator 630kva', 'KNR K-47 0302-01', 'Transformator SN/nN 630kVA montaż', 'robocizna', false, '[]', 40.000, 'szt', 'trafostacje', 0.9),
('rozdzielnia sredniego napiecia', 'KNR K-47 0401-01', 'Rozdzielnia SN montaż', 'robocizna', false, '[]', 60.000, 'kpl', 'trafostacje', 0.9),
('kabel sredniego napiecia', 'KNR K-47 0501-01', 'Kabel SN 15kV układanie', 'robocizna', false, '[]', 0.120, 'mb', 'trafostacje', 1.0),
('kabel 15kv', 'KNR K-47 0501-01', 'Kabel SN 15kV układanie', 'robocizna', false, '[]', 0.120, 'mb', 'trafostacje', 1.0),
('mufa kablowa sn', 'KNR K-47 0601-01', 'Mufa kablowa SN montaż', 'robocizna', false, '[]', 6.000, 'szt', 'trafostacje', 1.0),
('zlacze kablowe sn', 'KNR K-47 0601-01', 'Złącze kablowe SN', 'robocizna', false, '[]', 6.000, 'szt', 'trafostacje', 1.0),

-- ─── SYSTEMY SYGNALIZACJI POŻARU (SSP) ───────────────────────────────────────
('centrala sygnalizacji pozarowej', 'KNR 5-04 1801-01', 'Centrala SSP montaż i uruchomienie', 'robocizna', false, '[]', 8.000, 'szt', 'instalacje_specjalne', 1.0),
('centrala ppoż', 'KNR 5-04 1801-01', 'Centrala ppoż montaż', 'robocizna', false, '[]', 8.000, 'szt', 'instalacje_specjalne', 1.0),
('czujnik dymu', 'KNR 5-04 1802-01', 'Czujnik dymu optyczny montaż', 'robocizna', false, '[]', 0.450, 'szt', 'instalacje_specjalne', 1.0),
('detektor dymu', 'KNR 5-04 1802-01', 'Detektor dymu montaż', 'robocizna', false, '[]', 0.450, 'szt', 'instalacje_specjalne', 1.0),
('czujnik temperatury ppoż', 'KNR 5-04 1803-01', 'Czujnik temperatury ppoż', 'robocizna', false, '[]', 0.400, 'szt', 'instalacje_specjalne', 1.0),
('rop ręczny ostrzegacz', 'KNR 5-04 1804-01', 'ROP ręczny ostrzegacz pożarowy', 'robocizna', false, '[]', 0.500, 'szt', 'instalacje_specjalne', 1.0),
('sygnalizator akustyczny ppoż', 'KNR 5-04 1805-01', 'Sygnalizator akustyczny ppoż', 'robocizna', false, '[]', 0.600, 'szt', 'instalacje_specjalne', 1.0),
('kabel ppoż nhxh', 'KNR 5-04 1806-01', 'Kabel ppoż NHXH E90 układanie', 'robocizna', false, '[]', 0.055, 'mb', 'instalacje_specjalne', 1.0),
('kabel ognioodporny', 'KNR 5-04 1806-01', 'Kabel ognioodporny E90', 'robocizna', false, '[]', 0.055, 'mb', 'instalacje_specjalne', 1.0),
('kabel e90', 'KNR 5-04 1806-01', 'Kabel E90 ognioodporny', 'robocizna', false, '[]', 0.055, 'mb', 'instalacje_specjalne', 1.0),

-- ─── KONTROLA DOSTĘPU / KD ────────────────────────────────────────────────────
('czytnik kart dostep', 'KNR 5-08 1201-01', 'Czytnik kart kontrola dostępu', 'robocizna', false, '[]', 0.800, 'szt', 'teletechnika', 1.0),
('czytnik rfid', 'KNR 5-08 1201-01', 'Czytnik RFID KD', 'robocizna', false, '[]', 0.800, 'szt', 'teletechnika', 1.0),
('elektrozamek', 'KNR 5-08 1202-01', 'Elektrozamek montaż', 'robocizna', false, '[]', 1.000, 'szt', 'teletechnika', 1.0),
('zamek elektromagnetyczny', 'KNR 5-08 1202-01', 'Zamek elektromagnetyczny', 'robocizna', false, '[]', 1.000, 'szt', 'teletechnika', 1.0),
('centrala kontroli dostepu', 'KNR 5-08 1203-01', 'Centrala KD montaż i konfiguracja', 'robocizna', false, '[]', 4.000, 'szt', 'teletechnika', 1.0),
('domofon wideo', 'KNR 5-08 1301-01', 'Domofon wideo montaż i okablowanie', 'robocizna', false, '[]', 2.500, 'szt', 'teletechnika', 1.0),
('wideodomofon', 'KNR 5-08 1301-01', 'Wideodomofon montaż', 'robocizna', false, '[]', 2.500, 'szt', 'teletechnika', 1.0),

-- ─── INTELIGENTNY BUDYNEK (KNX EXPANSION) ────────────────────────────────────
('sterownik knx', 'KNR 5-04 0901-01', 'Sterownik KNX IP montaż', 'robocizna', false, '[]', 3.000, 'szt', 'smart_home', 1.0),
('interface knx ip', 'KNR 5-04 0901-01', 'Interface KNX/IP', 'robocizna', false, '[]', 3.000, 'szt', 'smart_home', 1.0),
('klawiatura knx dotykowa', 'KNR 5-04 0902-01', 'Klawiatura KNX dotykowa', 'robocizna', false, '[]', 1.500, 'szt', 'smart_home', 1.0),
('panel dotykowy knx', 'KNR 5-04 0902-01', 'Panel dotykowy KNX', 'robocizna', false, '[]', 1.500, 'szt', 'smart_home', 1.0),
('aktuator knx', 'KNR 5-04 0903-01', 'Aktuator KNX DIN montaż', 'robocizna', false, '[]', 0.800, 'szt', 'smart_home', 1.0),
('kabel knx bus', 'KNR 5-04 0904-01', 'Kabel KNX bus układanie', 'robocizna', false, '[]', 0.025, 'mb', 'smart_home', 1.0),
('zasilacz knx', 'KNR 5-04 0905-01', 'Zasilacz systemu KNX', 'robocizna', false, '[]', 1.000, 'szt', 'smart_home', 1.0),

-- ─── DŹWIGNIKI / WINDY (elektryczna część) ───────────────────────────────────
('zasilanie windy', 'KNR 5-04 2101-01', 'Zasilanie elektryczne windy', 'robocizna', false, '[]', 12.000, 'kpl', 'instalacje_specjalne', 0.9),
('wlacznik przystankowy windy', 'KNR 5-04 2102-01', 'Włącznik przystankowy windy', 'robocizna', false, '[]', 1.000, 'szt', 'instalacje_specjalne', 0.9)

ON CONFLICT (keyword_normalized) DO NOTHING;
