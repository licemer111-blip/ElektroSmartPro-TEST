-- ============================================================
-- ES-Engine Dictionary Seed v19 — ENRICHMENT PIPELINE v1.0
-- Klastry "Ekspert" i "Serwis" — masowe uzupełnienie thin categories
--
-- Kategorie:
--   swiatlowody        14 → ~80 wpisów  (Ekspert: FTTH/FO pełne pokrycie)
--   fotowoltaika       12 → ~55 wpisów  (Ekspert: PV end-to-end)
--   smart_home          8 → ~55 wpisów  (Ekspert: KNX/Fibaro/Loxone/WiFi)
--   bezpieczenstwo     ~8 → ~35 wpisów  (Ekspert: alarm+CCTV+kontrola)
--   pomiary_dokumentacja ~6 → ~30 wpisów (Serwis: pełen zakres)
--
-- KNR refs: ES-FIBER-006..015, ES-PV-006..015, ES-SH-001..015,
--           ES-SEC-010..020, ES-PM-001..015
-- RBH: bazowane na KNR AT-02, KNR 5-09, rynek PL 2026
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ══════════════════════════════════════════════════════════════════
-- ŚWIATŁOWODY — pełne pokrycie FTTH/FO (65 nowych wpisów)
-- ══════════════════════════════════════════════════════════════════

-- Spawanie wg liczby włókien
('spawanie kabla 4j',                 'ES-FIBER-006', 'Spawanie fusja kabel 4J (4 spawy)',         'robocizna', false, NULL, 2.40, 'kpl', 'swiatlowody', 2.0),
('spawanie 4 wlokien',                'ES-FIBER-006', 'Spawanie włókien — kabel 4J',               'robocizna', false, NULL, 2.40, 'kpl', 'swiatlowody', 1.8),
('4 spawy swiatlowodowe',             'ES-FIBER-006', '4 spawy światłowodowe fusja',               'robocizna', false, NULL, 2.40, 'kpl', 'swiatlowody', 1.8),
('spawanie kabla 8j',                 'ES-FIBER-007', 'Spawanie fusja kabel 8J (8 spawów)',        'robocizna', false, NULL, 4.80, 'kpl', 'swiatlowody', 2.0),
('spawanie 8 wlokien',                'ES-FIBER-007', 'Spawanie włókien — kabel 8J',               'robocizna', false, NULL, 4.80, 'kpl', 'swiatlowody', 1.8),
('8 spawow swiatlowodowych',          'ES-FIBER-007', '8 spawów światłowodowych fusja',            'robocizna', false, NULL, 4.80, 'kpl', 'swiatlowody', 1.8),
('spawanie kabla 12j',                'ES-FIBER-008', 'Spawanie fusja kabel 12J (12 spawów)',      'robocizna', false, NULL, 7.20, 'kpl', 'swiatlowody', 2.0),
('spawanie 12 wlokien',               'ES-FIBER-008', 'Spawanie włókien — kabel 12J',              'robocizna', false, NULL, 7.20, 'kpl', 'swiatlowody', 1.8),
('spawanie kabla 24j',                'ES-FIBER-008', 'Spawanie fusja kabel 24J (24 spawy)',       'robocizna', false, NULL, 14.40, 'kpl', 'swiatlowody', 2.0),
('spawanie 24 wlokien',               'ES-FIBER-008', 'Spawanie włókien — kabel 24J',              'robocizna', false, NULL, 14.40, 'kpl', 'swiatlowody', 1.8),
('spawanie kabla 48j',                'ES-FIBER-009', 'Spawanie fusja kabel 48J (48 spawów)',      'robocizna', false, NULL, 28.80, 'kpl', 'swiatlowody', 2.0),
('spawanie 48 wlokien',               'ES-FIBER-009', 'Spawanie włókien — kabel 48J',              'robocizna', false, NULL, 28.80, 'kpl', 'swiatlowody', 1.8),
('spawanie kabla 96j',                'ES-FIBER-009', 'Spawanie fusja kabel 96J (96 spawów)',      'robocizna', false, NULL, 57.60, 'kpl', 'swiatlowody', 2.0),
('zlacze mechaniczne swiatlowod',     'ES-FIBER-006', 'Złącze mechaniczne światłowodu (1 szt)',    'robocizna', false, NULL, 0.35, 'szt', 'swiatlowody', 1.8),
('zlacze mechaniczne fiber',          'ES-FIBER-006', 'Złącze mechaniczne FO montaż',              'robocizna', false, NULL, 0.35, 'szt', 'swiatlowody', 1.6),

-- Układanie kabla (różne typy)
('kabel swiatlowodowy ziemny 12j',    'ES-FIBER-010', 'Układanie kabla ziemnego FO do 12J',       'robocizna', false, NULL, 0.30, 'mb', 'swiatlowody', 2.0),
('kabel ziemny swiatlowodem',         'ES-FIBER-010', 'Kabel ziemny światłowodowy do 12J',         'robocizna', false, NULL, 0.30, 'mb', 'swiatlowody', 1.8),
('ukladanie kabla ziemnego fo',       'ES-FIBER-010', 'Układanie kabla FO w gruncie',              'robocizna', false, NULL, 0.30, 'mb', 'swiatlowody', 1.8),
('kabel swiatlowodowy ziemny 24j',    'ES-FIBER-010', 'Układanie kabla ziemnego FO 12-24J',       'robocizna', false, NULL, 0.40, 'mb', 'swiatlowody', 2.0),
('kabel swiatlowodowy ziemny 48j',    'ES-FIBER-010', 'Układanie kabla ziemnego FO 24-48J',       'robocizna', false, NULL, 0.50, 'mb', 'swiatlowody', 2.0),
('kabel adss napowietrzny',           'ES-FIBER-011', 'Kabel ADSS napowietrzny — montaż',         'robocizna', false, NULL, 0.35, 'mb', 'swiatlowody', 2.0),
('ukladanie kabla napowietrznego fo', 'ES-FIBER-011', 'Układanie kabla FO napowietrznego',         'robocizna', false, NULL, 0.35, 'mb', 'swiatlowody', 1.8),
('swiatlowod samonosny',              'ES-FIBER-011', 'Kabel samonośny ADSS FO instalacja',        'robocizna', false, NULL, 0.35, 'mb', 'swiatlowody', 1.8),
('kabel swiatlowodowy instalacyjny',  'ES-FIBER-001', 'Kabel FO instalacyjny wewnętrzny',          'robocizna', false, NULL, 0.10, 'mb', 'swiatlowody', 1.8),
('kabel drop ftth',                   'ES-FIBER-001', 'Kabel Drop FTTH abonencki — prowadzenie',   'robocizna', false, NULL, 0.08, 'mb', 'swiatlowody', 2.0),
('kabel swiatlowodem drop',           'ES-FIBER-001', 'Drop FTTH kabel abonencki',                 'robocizna', false, NULL, 0.08, 'mb', 'swiatlowody', 1.8),
('wdmuchiwanie kabla swiatlowodem',   'ES-FIBER-012', 'Wdmuchiwanie kabla FO w mikrorurkę',        'robocizna', false, NULL, 0.05, 'mb', 'swiatlowody', 2.0),
('cable blowing fiber',               'ES-FIBER-012', 'Kabel FO wdmuchiwanie pneumatyczne',        'robocizna', false, NULL, 0.05, 'mb', 'swiatlowody', 1.8),
('wdmuchiwanie mikrokabla',           'ES-FIBER-012', 'Mikrokabel FO wdmuchiwanie',                'robocizna', false, NULL, 0.05, 'mb', 'swiatlowody', 1.6),

-- Mufy i złącza
('mufa termokurczliwa fo 6spawnow',   'ES-FIBER-003', 'Mufa termokurczliwa FO do 6 spawów',       'robocizna', false, NULL, 3.00, 'szt', 'swiatlowody', 2.0),
('mufa termokurczliwa fo 24spawnow',  'ES-FIBER-003', 'Mufa termokurczliwa FO do 24 spawów',      'robocizna', false, NULL, 4.50, 'szt', 'swiatlowody', 2.0),
('mufa mechaniczna fiber',            'ES-FIBER-003', 'Mufa mechaniczna box FO montaż',            'robocizna', false, NULL, 3.50, 'szt', 'swiatlowody', 1.8),
('mufa rozgazna swiatlowodowa',       'ES-FIBER-003', 'Mufa rozgałęźna FO (1:4)',                 'robocizna', false, NULL, 5.00, 'szt', 'swiatlowody', 2.0),
('mufa napowietrzna fo',              'ES-FIBER-003', 'Mufa napowietrzna FO z zaciskami',          'robocizna', false, NULL, 4.00, 'szt', 'swiatlowody', 1.8),

-- ODF / Szafy / Przełącznice
('szafa odf 12j',                     'ES-FIBER-013', 'Szafa ODF 12J montaż i okablowanie',        'robocizna', false, NULL, 2.00, 'szt', 'swiatlowody', 2.0),
('odf 12 portow',                     'ES-FIBER-013', 'ODF 12 portów montaż',                      'robocizna', false, NULL, 2.00, 'szt', 'swiatlowody', 1.8),
('szafa odf 24j',                     'ES-FIBER-013', 'Szafa ODF 24J montaż i okablowanie',        'robocizna', false, NULL, 2.50, 'szt', 'swiatlowody', 2.0),
('odf 24 portow',                     'ES-FIBER-013', 'ODF 24 portów montaż',                      'robocizna', false, NULL, 2.50, 'szt', 'swiatlowody', 1.8),
('szafa odf 48j',                     'ES-FIBER-013', 'Szafa ODF 48J montaż i okablowanie',        'robocizna', false, NULL, 3.50, 'szt', 'swiatlowody', 2.0),
('szafa odf 96j',                     'ES-FIBER-013', 'Szafa ODF 96J montaż i okablowanie',        'robocizna', false, NULL, 5.00, 'szt', 'swiatlowody', 2.0),
('patchpanel optyczny sc 12p',        'ES-FIBER-013', 'Patchpanel optyczny SC 12-portów',          'robocizna', false, NULL, 1.50, 'szt', 'swiatlowody', 2.0),
('patchpanel optyczny sc 24p',        'ES-FIBER-013', 'Patchpanel optyczny SC 24-portów',          'robocizna', false, NULL, 2.00, 'szt', 'swiatlowody', 2.0),
('patchpanel optyczny lc 24p',        'ES-FIBER-013', 'Patchpanel optyczny LC 24-portów',          'robocizna', false, NULL, 2.00, 'szt', 'swiatlowody', 2.0),
('patchpanel optyczny lc 48p',        'ES-FIBER-013', 'Patchpanel optyczny LC 48-portów',          'robocizna', false, NULL, 3.00, 'szt', 'swiatlowody', 2.0),
('liu optyczny',                      'ES-FIBER-013', 'LIU (Line Interface Unit) FO montaż',       'robocizna', false, NULL, 2.50, 'szt', 'swiatlowody', 1.8),

-- Splitter pasywny
('splitter pasywny 1:2',              'ES-FIBER-014', 'Splitter pasywny PON 1:2',                  'robocizna', false, NULL, 0.50, 'szt', 'swiatlowody', 2.0),
('splitter 1:4 pasywny',              'ES-FIBER-014', 'Splitter pasywny PON 1:4',                  'robocizna', false, NULL, 0.80, 'szt', 'swiatlowody', 2.0),
('splitter pasywny 1:8',              'ES-FIBER-014', 'Splitter pasywny PON 1:8',                  'robocizna', false, NULL, 1.00, 'szt', 'swiatlowody', 2.0),
('splitter 1:16',                     'ES-FIBER-014', 'Splitter pasywny PON 1:16',                 'robocizna', false, NULL, 1.50, 'szt', 'swiatlowody', 2.0),
('splitter 1:32',                     'ES-FIBER-014', 'Splitter pasywny PON 1:32',                 'robocizna', false, NULL, 2.50, 'szt', 'swiatlowody', 2.0),
('splitter pon ftth',                 'ES-FIBER-014', 'Splitter PON FTTH — montaż w szafie',       'robocizna', false, NULL, 1.00, 'szt', 'swiatlowody', 1.8),

-- Konektory
('konektor sc upc',                   'ES-FIBER-015', 'Konektor SC/UPC zakończenie kabla FO',      'robocizna', false, NULL, 0.40, 'szt', 'swiatlowody', 2.0),
('konektor sc apc',                   'ES-FIBER-015', 'Konektor SC/APC zakończenie kabla FO',      'robocizna', false, NULL, 0.50, 'szt', 'swiatlowody', 2.0),
('konektor lc upc',                   'ES-FIBER-015', 'Konektor LC/UPC zakończenie kabla FO',      'robocizna', false, NULL, 0.40, 'szt', 'swiatlowody', 2.0),
('konektor lc apc',                   'ES-FIBER-015', 'Konektor LC/APC zakończenie kabla FO',      'robocizna', false, NULL, 0.50, 'szt', 'swiatlowody', 2.0),
('konektor fc apc',                   'ES-FIBER-015', 'Konektor FC/APC zakończenie kabla FO',      'robocizna', false, NULL, 0.50, 'szt', 'swiatlowody', 1.8),
('pigkail swiatlowodowy sc',          'ES-FIBER-015', 'Pigtail SC montaż i zaprasowanie',          'robocizna', false, NULL, 0.45, 'szt', 'swiatlowody', 1.8),

-- Pomiary rozszerzone FO
('pomiar insertion loss fo',          'ES-FIBER-004', 'Pomiar tłumienności wtrąceniowej (IL)',     'robocizna', false, NULL, 0.50, 'kpl', 'swiatlowody', 2.0),
('certyfikacja trasy fo',             'ES-FIBER-004', 'Certyfikacja trasy FO TIA/EIA protokół',    'robocizna', false, NULL, 2.50, 'kpl', 'swiatlowody', 2.0),
('protokol pomiarowy fo',             'ES-FIBER-004', 'Protokół pomiarowy trasy światłowodowej',   'robocizna', false, NULL, 1.00, 'kpl', 'swiatlowody', 1.8),
('pomiar mocy optycznej',             'ES-FIBER-004', 'Pomiar mocy optycznej miernikiem',          'robocizna', false, NULL, 0.30, 'szt', 'swiatlowody', 1.8),
('otdr jednomodowy',                  'ES-FIBER-004', 'OTDR jednomodowy SM — pomiar trasy',        'robocizna', false, NULL, 1.50, 'kpl', 'swiatlowody', 2.0),
('otdr wielomodowy',                  'ES-FIBER-004', 'OTDR wielomodowy MM — pomiar trasy',        'robocizna', false, NULL, 1.50, 'kpl', 'swiatlowody', 2.0),

-- Mikrokanalizacja
('mikrokanalizacja 7mm',              'ES-FIBER-012', 'Układanie mikrokanalizacji 7mm FO',         'robocizna', false, NULL, 0.15, 'mb', 'swiatlowody', 2.0),
('mikrokanalizacja 10mm',             'ES-FIBER-012', 'Układanie mikrokanalizacji 10mm FO',        'robocizna', false, NULL, 0.18, 'mb', 'swiatlowody', 2.0),
('mikrokanalizacja 14mm',             'ES-FIBER-012', 'Układanie mikrokanalizacji 14mm FO',        'robocizna', false, NULL, 0.20, 'mb', 'swiatlowody', 1.8),
('przejscie przez sciane kabel fo',   'ES-FIBER-012', 'Przejście przez ścianę kabel FO',           'robocizna', false, NULL, 1.00, 'szt', 'swiatlowody', 2.0),
('wprowadzenie kabla do budynku fo',  'ES-FIBER-012', 'Wprowadzenie kabla FO do budynku',          'robocizna', false, NULL, 1.50, 'szt', 'swiatlowody', 2.0),

-- FTTH rozszerzony
('konfiguracja ont router',           'ES-FIBER-005', 'Konfiguracja ONT/routera + IPTV/VOIP',     'robocizna', false, NULL, 1.50, 'szt', 'swiatlowody', 2.0),
('wymiana ont fiber',                 'ES-FIBER-005', 'Wymiana terminala ONT abonenta',             'robocizna', false, NULL, 0.75, 'szt', 'swiatlowody', 1.8),
('punkt abonencki ftth kompletny',    'ES-FIBER-005', 'Punkt FTTH kompletny (gniazdo+ONT+router)', 'robocizna', false, NULL, 2.50, 'kpl', 'swiatlowody', 2.0),
('instalacja olt',                    'ES-FIBER-013', 'Instalacja i konfiguracja OLT (szafa)',      'robocizna', false, NULL, 6.00, 'szt', 'swiatlowody', 2.0),
('olt gpon',                          'ES-FIBER-013', 'OLT GPON — montaż i konfiguracja portów',   'robocizna', false, NULL, 6.00, 'szt', 'swiatlowody', 1.8),
('switch optyczny fo',                'ES-FIBER-013', 'Switch optyczny z wkładkami SFP',            'robocizna', false, NULL, 2.50, 'szt', 'swiatlowody', 2.0),

-- ══════════════════════════════════════════════════════════════════
-- FOTOWOLTAIKA — rozszerzone pokrycie PV end-to-end (43 nowych)
-- ══════════════════════════════════════════════════════════════════

-- Panele PV — różne warunki montażu
('montaz paneli pv dach plask',       'ES-PV-006', 'Montaż paneli PV dach płaski + balast',      'robocizna', false, NULL, 4.00, 'kWp', 'fotowoltaika', 2.0),
('montaz paneli pv grunt',            'ES-PV-006', 'Montaż paneli PV na gruncie',                 'robocizna', false, NULL, 4.50, 'kWp', 'fotowoltaika', 2.0),
('instalacja pv na gruncie',          'ES-PV-006', 'Instalacja PV grunt — konstrukcja + panele',  'robocizna', false, NULL, 4.50, 'kWp', 'fotowoltaika', 1.8),
('montaz paneli pv elewacja',         'ES-PV-006', 'Montaż paneli PV BIPV na elewacji',           'robocizna', false, NULL, 5.50, 'kWp', 'fotowoltaika', 2.0),
('panel pv 400w montaz',              'ES-PV-001', 'Panel PV 400W montaż na konstrukcji',         'robocizna', false, NULL, 1.20, 'szt', 'fotowoltaika', 1.8),
('panel fotowoltaiczny 450w',         'ES-PV-001', 'Panel PV 450W monokrystaliczny montaż',       'robocizna', false, NULL, 1.20, 'szt', 'fotowoltaika', 1.8),
('panel pv 550w monokrystaliczny',    'ES-PV-001', 'Panel PV 550W monokrystaliczny HJT',          'robocizna', false, NULL, 1.20, 'szt', 'fotowoltaika', 1.8),
('demontaz paneli pv',                'ES-PV-006', 'Demontaż paneli PV (czyszczenie dachu)',      'robocizna', false, NULL, 0.80, 'szt', 'fotowoltaika', 2.0),

-- Okablowanie DC i złącza
('kabel dc 4mm2 pv',                  'ES-PV-007', 'Kabel DC 4mm² PV1-F — prowadzenie',          'robocizna', false, NULL, 0.25, 'mb', 'fotowoltaika', 2.0),
('kabel dc 6mm2 pv',                  'ES-PV-007', 'Kabel DC 6mm² PV1-F — prowadzenie',          'robocizna', false, NULL, 0.30, 'mb', 'fotowoltaika', 2.0),
('przewod dc pv',                     'ES-PV-007', 'Przewód DC do falownika PV',                  'robocizna', false, NULL, 0.25, 'mb', 'fotowoltaika', 1.8),
('zlacze mc4 pv',                     'ES-PV-007', 'Złącze MC4 krimping + montaż',                'robocizna', false, NULL, 0.30, 'szt', 'fotowoltaika', 2.0),
('skrzynka stringow pv',              'ES-PV-007', 'Skrzynka string box PV AC+DC',                'robocizna', false, NULL, 2.00, 'szt', 'fotowoltaika', 2.0),
('string box dc',                     'ES-PV-007', 'String box DC z zabezpieczeniem',              'robocizna', false, NULL, 2.00, 'szt', 'fotowoltaika', 1.8),

-- Zabezpieczenia AC/DC PV
('wylacznik dc 1000v pv',             'ES-PV-008', 'Wyłącznik DC 1000V/32A PV montaż',           'robocizna', false, NULL, 0.50, 'szt', 'fotowoltaika', 2.0),
('spd dc klasa 2 pv',                 'ES-PV-008', 'Ochronnik SPD DC Klasa II PV montaż',         'robocizna', false, NULL, 0.80, 'szt', 'fotowoltaika', 2.0),
('spd ac klasa 2 pv',                 'ES-PV-008', 'Ochronnik SPD AC Klasa II (za falownikiem)',  'robocizna', false, NULL, 0.80, 'szt', 'fotowoltaika', 2.0),
('bezpiecznik dc pv',                 'ES-PV-008', 'Bezpiecznik DC PV gPV montaż',                'robocizna', false, NULL, 0.40, 'szt', 'fotowoltaika', 2.0),
('ochronnik przepieciowy pv',         'ES-PV-008', 'Ochronnik przepięciowy PV kompleksowy',       'robocizna', false, NULL, 1.20, 'kpl', 'fotowoltaika', 2.0),

-- Konstrukcja montażowa
('konstrukcja dach skosny pv',        'ES-PV-009', 'Montaż konstrukcji PV dach skośny',           'robocizna', false, NULL, 0.50, 'szt', 'fotowoltaika', 2.0),
('haki montazowe pv dach',            'ES-PV-009', 'Haki montażowe PV + uszczelnianie',           'robocizna', false, NULL, 0.50, 'szt', 'fotowoltaika', 1.8),
('konstrukcja dach plask balast',     'ES-PV-009', 'Konstrukcja balastowa dach płaski PV',        'robocizna', false, NULL, 0.60, 'szt', 'fotowoltaika', 2.0),
('uziemienie systemu pv',             'ES-PV-009', 'Uziemienie systemu PV — szyna PE+ekwipot.',   'robocizna', false, NULL, 2.00, 'kpl', 'fotowoltaika', 2.0),

-- Falowniki i magazyny energii
('falownik string 5kw',               'ES-PV-002', 'Falownik string 5kW montaż i konfiguracja',  'robocizna', false, NULL, 5.00, 'szt', 'fotowoltaika', 2.0),
('falownik string 10kw',              'ES-PV-002', 'Falownik string 10kW montaż',                 'robocizna', false, NULL, 6.00, 'szt', 'fotowoltaika', 2.0),
('falownik 3 fazowy 15kw pv',         'ES-PV-002', 'Falownik 3-fazowy 15kW montaż PV',           'robocizna', false, NULL, 8.00, 'szt', 'fotowoltaika', 2.0),
('falownik pv 20kw',                  'ES-PV-002', 'Falownik PV 20kW — montaż i rozruch',        'robocizna', false, NULL, 9.00, 'szt', 'fotowoltaika', 2.0),
('bateria lifepo4 5kwh',              'ES-PV-003', 'Magazyn energii LiFePO4 5kWh montaż',        'robocizna', false, NULL, 5.00, 'szt', 'fotowoltaika', 2.0),
('bateria lifepo4 10kwh',             'ES-PV-003', 'Magazyn energii LiFePO4 10kWh montaż',       'robocizna', false, NULL, 7.00, 'szt', 'fotowoltaika', 2.0),
('optymalizator mocy pv',             'ES-PV-010', 'Optymalizator mocy PV (MPPT per panel)',     'robocizna', false, NULL, 0.40, 'szt', 'fotowoltaika', 2.0),
('mikroinwerter pv',                  'ES-PV-010', 'Mikroinwerter PV montaż per panel',           'robocizna', false, NULL, 0.80, 'szt', 'fotowoltaika', 2.0),
('akumulator pv backup',              'ES-PV-003', 'Akumulator backup PV konfiguracja',           'robocizna', false, NULL, 4.00, 'szt', 'fotowoltaika', 1.8),

-- Pomiary, dokumentacja, zgłoszenia PV
('protokol odbioru pv',               'ES-PV-005', 'Protokół odbioru technicznego PV',            'robocizna', false, NULL, 4.00, 'kpl', 'fotowoltaika', 2.0),
('inspekcja termowizyjna paneli pv',  'ES-PV-005', 'Inspekcja termowizyjna paneli PV drona',      'robocizna', false, NULL, 3.00, 'kpl', 'fotowoltaika', 2.0),
('pomiary iv krzywej pv',             'ES-PV-005', 'Pomiary krzywej I-V paneli PV',               'robocizna', false, NULL, 2.00, 'kpl', 'fotowoltaika', 2.0),
('zgloszenie pge enea tauron',        'ES-PV-005', 'Zgłoszenie PV do OSD (PGE/Tauron/Enea)',      'robocizna', false, NULL, 3.00, 'kpl', 'fotowoltaika', 2.0),
('bilans energii pv projekt',         'ES-PV-005', 'Projekt bilansowy + dokumentacja PV',         'robocizna', false, NULL, 6.00, 'kpl', 'fotowoltaika', 2.0),
('montoring pv online',               'ES-PV-011', 'Konfiguracja monitoringu online PV',          'robocizna', false, NULL, 1.50, 'kpl', 'fotowoltaika', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- SMART HOME — pełne pokrycie KNX / Fibaro / Loxone / WiFi (50 nowych)
-- ══════════════════════════════════════════════════════════════════

-- KNX Okablowanie i zasilanie
('okablowanie magistrali knx',        'ES-SH-001', 'Okablowanie magistrali KNX YCYM 2x2x0.8',    'robocizna', false, NULL, 0.08, 'mb', 'smart_home', 2.0),
('kabel knx bus',                     'ES-SH-001', 'Kabel KNX Bus prowadzenie + terminalowanie', 'robocizna', false, NULL, 0.08, 'mb', 'smart_home', 1.8),
('zasilacz knx din',                  'ES-SH-001', 'Zasilacz magistrali KNX 640mA DIN',          'robocizna', false, NULL, 1.00, 'szt', 'smart_home', 2.0),
('zasilacz knx 320ma',                'ES-SH-001', 'Zasilacz KNX 320mA montaż',                  'robocizna', false, NULL, 0.80, 'szt', 'smart_home', 1.8),
('router ip knx',                     'ES-SH-001', 'Router IP KNX (bramka Ethernet)',             'robocizna', false, NULL, 1.50, 'szt', 'smart_home', 2.0),
('interfejs usb knx',                 'ES-SH-001', 'USB Interface KNX do programowania',          'robocizna', false, NULL, 0.50, 'szt', 'smart_home', 1.6),

-- KNX Moduły
('modul wyjsc binarnych knx 8ch',     'ES-SH-002', 'Moduł KNX wyjść binarnych 8x16A',            'robocizna', false, NULL, 2.50, 'szt', 'smart_home', 2.0),
('modul wyjsc binarnych knx 4ch',     'ES-SH-002', 'Moduł KNX wyjść binarnych 4x16A',            'robocizna', false, NULL, 2.00, 'szt', 'smart_home', 1.8),
('modul wejsc binarnych knx',         'ES-SH-002', 'Moduł KNX wejść binarnych 8ch',              'robocizna', false, NULL, 1.80, 'szt', 'smart_home', 1.8),
('dimmer knx 4ch',                    'ES-SH-002', 'Ściemniacz KNX 4-kanałowy 4x300W',           'robocizna', false, NULL, 3.00, 'szt', 'smart_home', 2.0),
('modul rolet knx',                   'ES-SH-002', 'Moduł sterowania roletami KNX 4ch',           'robocizna', false, NULL, 2.50, 'szt', 'smart_home', 2.0),
('modul ogrzewania knx',              'ES-SH-002', 'Moduł grzewczy KNX 6ch ogrzewanie',           'robocizna', false, NULL, 2.50, 'szt', 'smart_home', 2.0),

-- KNX Panele i sensory
('panel dotykowy knx 2p',             'ES-SH-003', 'Panel dotykowy KNX 2-przyciskowy montaż',    'robocizna', false, NULL, 1.50, 'szt', 'smart_home', 2.0),
('panel dotykowy knx 4p',             'ES-SH-003', 'Panel dotykowy KNX 4-przyciskowy montaż',    'robocizna', false, NULL, 2.00, 'szt', 'smart_home', 2.0),
('panel dotykowy knx 6p',             'ES-SH-003', 'Panel dotykowy KNX 6-przyciskowy montaż',    'robocizna', false, NULL, 2.50, 'szt', 'smart_home', 2.0),
('sensor temperatury knx',            'ES-SH-003', 'Sensor temperatury/CO2 KNX montaż',          'robocizna', false, NULL, 1.20, 'szt', 'smart_home', 1.8),
('czujnik obecnosci knx',             'ES-SH-003', 'Czujnik obecności KNX HVAC+Light',           'robocizna', false, NULL, 1.50, 'szt', 'smart_home', 1.8),
('programowanie ets knx',             'ES-SH-003', 'Programowanie i uruchomienie KNX ETS',        'robocizna', false, NULL, 8.00, 'kpl', 'smart_home', 2.0),

-- Fibaro / Z-Wave
('hub smart home fibaro hc3',         'ES-SH-004', 'Hub smart home Fibaro HC3 konfiguracja',      'robocizna', false, NULL, 3.00, 'szt', 'smart_home', 2.0),
('sterownik fibaro',                  'ES-SH-004', 'Sterownik/moduł Fibaro montaż',               'robocizna', false, NULL, 1.00, 'szt', 'smart_home', 1.8),
('czujnik zalania fibaro',            'ES-SH-004', 'Czujnik zalania smart home (Z-Wave)',         'robocizna', false, NULL, 0.50, 'szt', 'smart_home', 1.8),
('czujnik gazu smart home',           'ES-SH-004', 'Czujnik gazu/CO smart home montaż',          'robocizna', false, NULL, 0.80, 'szt', 'smart_home', 1.8),
('czujnik drzwi okna zwave',          'ES-SH-004', 'Czujnik drzwi/okna Z-Wave montaż',           'robocizna', false, NULL, 0.30, 'szt', 'smart_home', 1.6),
('programowanie scen smart home',     'ES-SH-004', 'Programowanie scen i automatyzacji',          'robocizna', false, NULL, 4.00, 'kpl', 'smart_home', 2.0),

-- Loxone
('miniserver loxone',                 'ES-SH-005', 'Miniserver Loxone montaż i konfiguracja',     'robocizna', false, NULL, 4.00, 'szt', 'smart_home', 2.0),
('modul loxone ai',                   'ES-SH-005', 'Moduł rozszerzeń Loxone AI 4x4',              'robocizna', false, NULL, 2.00, 'szt', 'smart_home', 2.0),
('drzewo 1wire loxone',               'ES-SH-005', 'Okablowanie drzewa 1-Wire Loxone',            'robocizna', false, NULL, 0.10, 'mb', 'smart_home', 1.8),
('programowanie loxone',              'ES-SH-005', 'Programowanie Loxone Config + uruchomienie',  'robocizna', false, NULL, 8.00, 'kpl', 'smart_home', 2.0),
('touchscreen loxone',                'ES-SH-005', 'Touchscreen Loxone 7" montaż',               'robocizna', false, NULL, 2.50, 'szt', 'smart_home', 1.8),

-- Ogólne Smart Home WiFi / Zigbee
('gniazdo smart wifi',                'ES-SH-006', 'Gniazdo smart WiFi/Zigbee — montaż',         'robocizna', false, NULL, 0.35, 'szt', 'smart_home', 1.8),
('wlacznik smart wifi',               'ES-SH-006', 'Włącznik smart WiFi p/t — montaż',           'robocizna', false, NULL, 0.40, 'szt', 'smart_home', 1.8),
('sterownik swiatla smart',           'ES-SH-006', 'Sterownik oświetlenia smart home',            'robocizna', false, NULL, 1.00, 'szt', 'smart_home', 1.8),
('roleta sterowanie smart',           'ES-SH-006', 'Sterownik rolet/żaluzji smart montaż',        'robocizna', false, NULL, 1.50, 'szt', 'smart_home', 1.8),
('termostat smart wifi',              'ES-SH-006', 'Termostat smart WiFi/Zigbee + konfiguracja', 'robocizna', false, NULL, 1.00, 'szt', 'smart_home', 2.0),
('interkom ip smart',                 'ES-SH-006', 'Domofon IP smart home (2-wire) konfiguracja','robocizna', false, NULL, 2.50, 'szt', 'smart_home', 2.0),
('zamek elektryczny smart',           'ES-SH-006', 'Zamek elektromagnetyczny smart montaż',      'robocizna', false, NULL, 2.00, 'szt', 'smart_home', 2.0),
('system multiroom audio',            'ES-SH-007', 'System multiroom audio (4 strefy)',           'robocizna', false, NULL, 6.00, 'kpl', 'smart_home', 1.8),
('konfiguracja google home',          'ES-SH-006', 'Konfiguracja Google Home/Alexa integracja',   'robocizna', false, NULL, 2.00, 'kpl', 'smart_home', 1.5),
('apple homekit konfiguracja',        'ES-SH-006', 'Konfiguracja Apple HomeKit (bridge)',         'robocizna', false, NULL, 2.00, 'kpl', 'smart_home', 1.5),

-- ══════════════════════════════════════════════════════════════════
-- BEZPIECZEŃSTWO — rozszerzone alarmy, CCTV, kontrola dostępu
-- ══════════════════════════════════════════════════════════════════

('montaz sygnalizatora alarmowego',   'ES-SEC-010', 'Sygnalizator akustyczno-optyczny alarmowy', 'robocizna', false, NULL, 1.20, 'szt', 'bezpieczenstwo', 2.0),
('sygnalizator zewnetrzny alarmowy',  'ES-SEC-010', 'Sygnalizator zewnętrzny IP54 z akum.',       'robocizna', false, NULL, 1.50, 'szt', 'bezpieczenstwo', 1.8),
('czujnik drzwi alarmowy',            'ES-SEC-010', 'Czujnik otwarcia drzwi/okna alarmowy',       'robocizna', false, NULL, 0.50, 'szt', 'bezpieczenstwo', 1.8),
('kontaktron drzwi okna',             'ES-SEC-010', 'Kontaktron drzwiowy/okienny montaż',         'robocizna', false, NULL, 0.50, 'szt', 'bezpieczenstwo', 1.6),
('czujnik wibracyjny alarmowy',       'ES-SEC-010', 'Czujnik wibracji/stłuczenia szyby',          'robocizna', false, NULL, 0.80, 'szt', 'bezpieczenstwo', 1.8),
('klawiatura alarmowa lcd',           'ES-SEC-011', 'Klawiatura alarmowa LCD montaż',             'robocizna', false, NULL, 1.20, 'szt', 'bezpieczenstwo', 2.0),
('czytnik kart kontrola dostepu',     'ES-SEC-011', 'Czytnik kart RFID kontrola dostępu',        'robocizna', false, NULL, 1.50, 'szt', 'bezpieczenstwo', 2.0),
('kontroler dostepu centralka',       'ES-SEC-011', 'Kontroler dostępu centralny montaż',         'robocizna', false, NULL, 3.00, 'szt', 'bezpieczenstwo', 2.0),
('turnikiet bramka kontrolna',        'ES-SEC-011', 'Turnikiet/bramka kontroli dostępu',          'robocizna', false, NULL, 6.00, 'szt', 'bezpieczenstwo', 1.8),
('rejestracja czasu pracy rfid',      'ES-SEC-011', 'System rejestracji czasu pracy RCP',         'robocizna', false, NULL, 3.00, 'kpl', 'bezpieczenstwo', 1.8),
('kamera kopulkowa 4mp',              'ES-SEC-012', 'Kamera kopułkowa 4MP PoE montaż',            'robocizna', false, NULL, 1.50, 'szt', 'bezpieczenstwo', 1.8),
('kamera ptz obrotowa cctv',          'ES-SEC-012', 'Kamera PTZ obrotowa IP montaż',              'robocizna', false, NULL, 2.50, 'szt', 'bezpieczenstwo', 2.0),
('nvr rejestrator 8ch',               'ES-SEC-012', 'Rejestrator NVR 8-kanałowy PoE montaż',     'robocizna', false, NULL, 2.50, 'szt', 'bezpieczenstwo', 2.0),
('nvr rejestrator 16ch',              'ES-SEC-012', 'Rejestrator NVR 16-kanałowy montaż',         'robocizna', false, NULL, 3.50, 'szt', 'bezpieczenstwo', 2.0),

-- ══════════════════════════════════════════════════════════════════
-- POMIARY I DOKUMENTACJA — kompletne pokrycie (25 nowych)
-- ══════════════════════════════════════════════════════════════════

('pomiary odbiorcze instalacji',      'ES-PM-001', 'Pomiary odbiorcze instalacji elektrycznej',   'robocizna', false, NULL, 4.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('protokol pomiarow elektrycznych',   'ES-PM-001', 'Protokół pomiarów PN-HD 60364-6',             'robocizna', false, NULL, 4.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('pomiary opornosci izolacji',        'ES-PM-001', 'Pomiar oporności izolacji 1MΩ·km',            'robocizna', false, NULL, 0.30, 'szt', 'pomiary_dokumentacja', 2.0),
('pomiar rezystancji uziemienia',     'ES-PM-002', 'Pomiar rezystancji uziemienia (metoda 3-bieg.)','robocizna', false, NULL, 1.50, 'szt', 'pomiary_dokumentacja', 2.0),
('pomiar impedancji petli',           'ES-PM-002', 'Pomiar impedancji pętli zwarciowej',          'robocizna', false, NULL, 0.50, 'szt', 'pomiary_dokumentacja', 2.0),
('pomiar pradu zwarcia ik',           'ES-PM-002', 'Pomiar prądu zwarcia Ik1/Ik3',               'robocizna', false, NULL, 0.50, 'szt', 'pomiary_dokumentacja', 2.0),
('pomiar rcd wylacznika roznicowego', 'ES-PM-002', 'Pomiar czasu zadziałania RCD/RCCB',           'robocizna', false, NULL, 0.25, 'szt', 'pomiary_dokumentacja', 2.0),
('pomiar zabezpieczenia rcd',         'ES-PM-002', 'Sprawdzenie skuteczności ochrony RCD',        'robocizna', false, NULL, 0.25, 'szt', 'pomiary_dokumentacja', 1.8),
('pomiar obwodu piorunochronnego',    'ES-PM-003', 'Pomiar obwodu piorunochronnego R<10Ω',        'robocizna', false, NULL, 2.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('inwentaryzacja instalacji',         'ES-PM-003', 'Inwentaryzacja istniejącej instalacji',       'robocizna', false, NULL, 6.00, 'kpl', 'pomiary_dokumentacja', 1.8),
('audyt energetyczny instalacji',     'ES-PM-003', 'Audyt energetyczny instalacji elektrycznej',  'robocizna', false, NULL, 8.00, 'kpl', 'pomiary_dokumentacja', 1.8),
('thermowizja instalacji',            'ES-PM-004', 'Inspekcja termowizyjna instalacji i RG',      'robocizna', false, NULL, 3.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('inspekcja termowizyjna rg',         'ES-PM-004', 'Inspekcja termowizyjna rozdzielnicy',         'robocizna', false, NULL, 2.50, 'szt', 'pomiary_dokumentacja', 2.0),
('projekt instalacji elektrycznej',   'ES-PM-005', 'Projekt wykonawczy instalacji elektrycznej',  'robocizna', false, NULL, 12.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('schemat tablicy rozdzielczej',      'ES-PM-005', 'Schemat elektryczny tablicy rozdzielczej',    'robocizna', false, NULL, 4.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('dokumentacja powykonawcza',         'ES-PM-005', 'Dokumentacja powykonawcza instalacji',        'robocizna', false, NULL, 6.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('kosztorys elektryczny operat',      'ES-PM-005', 'Operat kosztorysowy instalacji elektrycznej', 'robocizna', false, NULL, 8.00, 'kpl', 'pomiary_dokumentacja', 1.5),
('pomiar jakosci energii',            'ES-PM-006', 'Analiza jakości energii THD/harmoniczne',     'robocizna', false, NULL, 4.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('bilans mocy instalacji',            'ES-PM-006', 'Bilans mocy + obliczenia zwarciowe',          'robocizna', false, NULL, 5.00, 'kpl', 'pomiary_dokumentacja', 1.8),
('harmonogram prac elektrycznych',    'ES-PM-006', 'Harmonogram robót + koordynacja budowy',      'robocizna', false, NULL, 4.00, 'kpl', 'pomiary_dokumentacja', 1.5),
('ekspertyza techniczna instalacji',  'ES-PM-007', 'Ekspertyza techniczna instalacji (SEP)',      'robocizna', false, NULL, 10.00, 'kpl', 'pomiary_dokumentacja', 1.8),
('swiadectwo charakterystyki en',     'ES-PM-007', 'Świadectwo charakterystyki energetycznej',    'robocizna', false, NULL, 8.00, 'kpl', 'pomiary_dokumentacja', 1.5),
('upr sek sep',                       'ES-PM-007', 'Dokumentacja uprawnień SEP E/D + UDT',       'robocizna', false, NULL, 2.00, 'kpl', 'pomiary_dokumentacja', 1.5),
('pomiar natezenia oswietlenia',      'ES-PM-004', 'Pomiar natężenia oświetlenia (luksomierz)',    'robocizna', false, NULL, 1.50, 'kpl', 'pomiary_dokumentacja', 2.0),
('pomiar pola elektromagnetycznego',  'ES-PM-004', 'Pomiar pola EM EMC — zgodność dyrektywa',     'robocizna', false, NULL, 4.00, 'kpl', 'pomiary_dokumentacja', 1.8)

ON CONFLICT (keyword_normalized) DO NOTHING;
