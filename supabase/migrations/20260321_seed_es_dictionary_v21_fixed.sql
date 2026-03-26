-- ES-Dictionary v21: Rozbudowa thin categories — fotowoltaika, smart_home, pomiary, swiatlowody
-- ~90 wpisów | kolumny: keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ============================================================
-- FOTOWOLTAIKA (rozbudowa: +30 wpisów)
-- ============================================================
('montaz panelu fotowoltaicznego',   'ES-PV-020', 'Montaż panelu PV monokrystalicznego 400-460Wp',       'robocizna', false, NULL, 0.50,  'szt', 'fotowoltaika', 2.0),
('panel fotowoltaiczny 400wp',       'ES-PV-020', 'Panel PV 400Wp — montaż na konstrukcji',              'robocizna', false, NULL, 0.50,  'szt', 'fotowoltaika', 1.8),
('panel solarny montaz',             'ES-PV-020', 'Panel solarny — montaż',                              'robocizna', false, NULL, 0.50,  'szt', 'fotowoltaika', 1.6),
('panel bifacjalny',                 'ES-PV-021', 'Montaż panelu bifacjalnego 500-600Wp',                'robocizna', false, NULL, 0.60,  'szt', 'fotowoltaika', 2.0),
('modul bifacial pv',                'ES-PV-021', 'Moduł bifacial — montaż (dach/grunt)',                'robocizna', false, NULL, 0.60,  'szt', 'fotowoltaika', 1.8),
('konstrukcja dachowa pv',           'ES-PV-022', 'Montaż konstrukcji aluminiowej PV — dach skośny',    'robocizna', false, NULL, 0.60,  'm',   'fotowoltaika', 2.0),
('szyny pv dach',                    'ES-PV-022', 'Szyny PV + haki dachowe — montaż (1 m rządu)',       'robocizna', false, NULL, 0.60,  'm',   'fotowoltaika', 1.8),
('konstrukcja dach plask pv',        'ES-PV-023', 'Montaż konstrukcji PV dach płaski (balast)',          'robocizna', false, NULL, 0.40,  'szt', 'fotowoltaika', 2.0),
('konstrukcja gruntowa pv',          'ES-PV-024', 'Montaż konstrukcji gruntowej PV (pale+szyny)',        'robocizna', false, NULL, 0.70,  'szt', 'fotowoltaika', 2.0),
('inwerter falownik pv 1f',          'ES-PV-025', 'Montaż falownika sieciowego 1-fazowego do 6kW',      'robocizna', false, NULL, 2.00,  'szt', 'fotowoltaika', 2.0),
('falownik pv 1-fazowy',             'ES-PV-025', 'Falownik PV 1f (Solis/Fronius/SMA) — montaż',       'robocizna', false, NULL, 2.00,  'szt', 'fotowoltaika', 1.8),
('inwerter falownik pv 3f 10kw',     'ES-PV-026', 'Montaż falownika sieciowego 3-fazowego 8-15kW',      'robocizna', false, NULL, 3.00,  'szt', 'fotowoltaika', 2.0),
('falownik pv 3-fazowy',             'ES-PV-026', 'Falownik PV 3f (Huawei/SolarEdge) — montaż',        'robocizna', false, NULL, 3.00,  'szt', 'fotowoltaika', 1.8),
('inwerter pv 20-50kw',              'ES-PV-027', 'Montaż falownika 3f komercyjnego 20-50kW',           'robocizna', false, NULL, 5.00,  'szt', 'fotowoltaika', 2.0),
('optymalizator mocy pv',            'ES-PV-028', 'Montaż optymalizatora mocy (SolarEdge/Tigo) na panel', 'robocizna', false, NULL, 0.20,'szt', 'fotowoltaika', 2.0),
('mlpe optymalizator',               'ES-PV-028', 'Optymalizator MLPE per panel PV',                    'robocizna', false, NULL, 0.20,  'szt', 'fotowoltaika', 1.8),
('mikrofalownik enphase',            'ES-PV-029', 'Montaż mikrofalownika Enphase IQ8 per panel',        'robocizna', false, NULL, 0.30,  'szt', 'fotowoltaika', 2.0),
('kabel dc solarny 6mm',             'ES-PV-030', 'Ułożenie kabla DC H1Z2Z2-K 6mm² (string PV)',        'robocizna', false, NULL, 0.07,  'm',   'fotowoltaika', 2.0),
('kabel solarny dc',                 'ES-PV-030', 'Kabel solarny DC — string kablowy',                  'robocizna', false, NULL, 0.07,  'm',   'fotowoltaika', 1.8),
('skrzynka dc string combiner',      'ES-PV-031', 'Montaż skrzynki DC string combiner (2-8 stringów)',  'robocizna', false, NULL, 2.00,  'szt', 'fotowoltaika', 2.0),
('magazyn energii bateria pv',       'ES-PV-032', 'Montaż magazynu energii 5-10kWh LiFePO4',            'robocizna', false, NULL, 5.00,  'szt', 'fotowoltaika', 2.0),
('bateria pv 10kwh',                 'ES-PV-032', 'Bateria PV 10kWh — montaż i konfiguracja',           'robocizna', false, NULL, 5.00,  'szt', 'fotowoltaika', 1.8),
('energy storage solar',             'ES-PV-032', 'Energy storage PV — home battery',                   'robocizna', false, NULL, 5.00,  'szt', 'fotowoltaika', 1.6),
('licznik dwukierunkowy prosument',  'ES-PV-033', 'Montaż licznika dwukierunkowego (net-metering)',     'robocizna', false, NULL, 1.50,  'szt', 'fotowoltaika', 2.0),
('monitoring online pv',             'ES-PV-034', 'Montaż monitoringu PV (logger/gateway/WiFi)',         'robocizna', false, NULL, 1.00,  'szt', 'fotowoltaika', 2.0),
('przyłączenie pv do sieci',         'ES-PV-035', 'Przyłączenie PV do sieci — odbiór energetyki (kpl)', 'robocizna', false, NULL, 4.00,  'kpl', 'fotowoltaika', 2.0),
('falownik hybrydowy off-grid',      'ES-PV-036', 'Falownik hybrydowy — instalacja PV off-grid',        'robocizna', false, NULL, 8.00,  'kpl', 'fotowoltaika', 2.0),
('carport solarny',                  'ES-PV-037', 'Montaż carportu solarnego — wiata + panele',         'robocizna', false, NULL, 1.20,  'szt', 'fotowoltaika', 2.0),
('inspekcja termowizyjna pv',        'ES-PV-038', 'Inspekcja termowizyjna PV (hot-spot) — 1kWp',        'robocizna', false, NULL, 0.15,  'kWp', 'fotowoltaika', 2.0),
('projekt instalacji pv',            'ES-PV-039', 'Projekt instalacji PV — dokumentacja',               'robocizna', false, NULL, 8.00,  'kpl', 'fotowoltaika', 1.8),

-- ============================================================
-- SMART HOME / KNX / DALI (rozbudowa: +30 wpisów)
-- ============================================================
('system knx instalacja',            'ES-SH-020', 'Instalacja systemu KNX/EIB — okablowanie magistrali', 'robocizna', false, NULL, 0.30,  'm',   'smart_home', 2.0),
('knx montaz',                       'ES-SH-020', 'KNX — montaż magistrali i modułów',                 'robocizna', false, NULL, 0.30,  'm',   'smart_home', 1.8),
('modul knx aktor',                  'ES-SH-021', 'Montaż aktora KNX (DIN, 4-8ch) — konfiguracja',     'robocizna', false, NULL, 0.80,  'szt', 'smart_home', 2.0),
('zasilacz knx 320ma',               'ES-SH-022', 'Montaż zasilacza magistrali KNX 320mA',              'robocizna', false, NULL, 0.60,  'szt', 'smart_home', 2.0),
('programowanie knx ets',            'ES-SH-023', 'Programowanie KNX ETS — 1 godzina',                  'robocizna', false, NULL, 1.00,  'godz','smart_home', 2.0),
('ets konfiguracja',                 'ES-SH-023', 'KNX ETS konfiguracja — programowanie',               'robocizna', false, NULL, 1.00,  'godz','smart_home', 1.8),
('system dali oswietlenie',          'ES-SH-024', 'Montaż systemu DALI/DALI-2 — driver + magistrala',   'robocizna', false, NULL, 0.70,  'szt', 'smart_home', 2.0),
('dali driver montaz',               'ES-SH-024', 'Driver DALI-2 — montaż i adresowanie',               'robocizna', false, NULL, 0.70,  'szt', 'smart_home', 1.8),
('sterownik dali 2',                 'ES-SH-025', 'Sterownik DALI-2 + czujnik — instalacja',            'robocizna', false, NULL, 0.70,  'szt', 'smart_home', 2.0),
('system loxone',                    'ES-SH-026', 'Montaż systemu Loxone (Miniserver + moduły)',         'robocizna', false, NULL, 4.00,  'kpl', 'smart_home', 2.0),
('loxone miniserver',                'ES-SH-026', 'Loxone Miniserver — montaż i konfiguracja',          'robocizna', false, NULL, 4.00,  'kpl', 'smart_home', 1.8),
('gniazdo smart wifi 230v',          'ES-SH-027', 'Montaż inteligentnego gniazda Smart (WiFi/Z-Wave)',  'robocizna', false, NULL, 0.40,  'szt', 'smart_home', 2.0),
('smart socket',                     'ES-SH-027', 'Smart socket — inteligentne gniazdo',                'robocizna', false, NULL, 0.40,  'szt', 'smart_home', 1.8),
('wylacznik smart wifi',             'ES-SH-028', 'Montaż wyłącznika Smart (WiFi/Zigbee) — instalacja', 'robocizna', false, NULL, 0.40,  'szt', 'smart_home', 2.0),
('sciemniacz smart dimmer',          'ES-SH-029', 'Montaż ściemniacza Smart/DALI/KNX',                  'robocizna', false, NULL, 0.50,  'szt', 'smart_home', 2.0),
('roletator silnik smart',           'ES-SH-030', 'Montaż silnika rolet elektrycznych Smart',           'robocizna', false, NULL, 1.20,  'szt', 'smart_home', 2.0),
('rolety elektryczne',               'ES-SH-030', 'Rolety elektryczne — motor + sterowanie',            'robocizna', false, NULL, 1.20,  'szt', 'smart_home', 1.8),
('termostat programowalny',          'ES-SH-031', 'Montaż termostatu programowalnego/Smart',             'robocizna', false, NULL, 0.50,  'szt', 'smart_home', 2.0),
('termostat wifi',                   'ES-SH-031', 'Termostat WiFi/KNX — montaż',                        'robocizna', false, NULL, 0.50,  'szt', 'smart_home', 1.8),
('czujnik temperatury wilgotnosci',  'ES-SH-032', 'Montaż czujnika T+RH (Smart/KNX/BMS)',               'robocizna', false, NULL, 0.40,  'szt', 'smart_home', 2.0),
('centrala inteligentna budynku',    'ES-SH-033', 'Montaż centralki Smart Home (hub/gateway)',           'robocizna', false, NULL, 2.00,  'szt', 'smart_home', 2.0),
('bramka integracyjna iot',          'ES-SH-033', 'Gateway IoT — integracja Smart Home',                'robocizna', false, NULL, 2.00,  'szt', 'smart_home', 1.8),
('programowanie scen oswietlenia',   'ES-SH-034', 'Programowanie scen oświetlenia KNX/DALI — 1 scena',  'robocizna', false, NULL, 0.50,  'szt', 'smart_home', 2.0),
('kabel knx magistrala',             'ES-SH-035', 'Ułożenie kabla magistrali KNX 2x2x0.8mm²',          'robocizna', false, NULL, 0.08,  'm',   'smart_home', 2.0),
('mat grzejna elektryczna',          'ES-SH-036', 'Ułożenie maty grzewczej 150W/m² (podłogówka el.)',   'robocizna', false, NULL, 0.80,  'm2',  'smart_home', 2.0),
('ogrzewanie podlogowe elektryczne', 'ES-SH-036', 'Ogrzewanie podłogowe elektryczne — mata',            'robocizna', false, NULL, 0.80,  'm2',  'smart_home', 1.8),
('kabel grzejny samoregulujacy',     'ES-SH-037', 'Kabel grzejny samoregulujący (heat trace)',          'robocizna', false, NULL, 0.25,  'm',   'smart_home', 2.0),
('heat trace rury',                  'ES-SH-037', 'Heat trace — ogrzewanie rur kablem',                 'robocizna', false, NULL, 0.25,  'm',   'smart_home', 1.8),

-- ============================================================
-- POMIARY I DOKUMENTACJA (rozbudowa: +25 wpisów)
-- ============================================================
('pomiar rezystancji izolacji',      'ES-PM-020', 'Pomiar rezystancji izolacji (megaomierz 1kV)',        'robocizna', false, NULL, 0.25,  'szt', 'pomiary_dokumentacja', 2.0),
('megaomierz pomiar',                'ES-PM-020', 'Megaomierz — pomiar izolacji przewodów',             'robocizna', false, NULL, 0.25,  'szt', 'pomiary_dokumentacja', 1.8),
('pomiar impedancji petli',          'ES-PM-021', 'Pomiar impedancji pętli zwarciowej Zs',               'robocizna', false, NULL, 0.20,  'szt', 'pomiary_dokumentacja', 2.0),
('impedancja petli zwarciowej',      'ES-PM-021', 'Pomiar Zs — ochrona przed porażeniem',               'robocizna', false, NULL, 0.20,  'szt', 'pomiary_dokumentacja', 1.8),
('pomiar ciaglości pe',              'ES-PM-022', 'Pomiar ciągłości przewodów ochronnych PE',            'robocizna', false, NULL, 0.15,  'szt', 'pomiary_dokumentacja', 2.0),
('test rcd fi',                      'ES-PM-023', 'Test wyłącznika RCD/FI (czas i prąd wyzwolenia)',    'robocizna', false, NULL, 0.20,  'szt', 'pomiary_dokumentacja', 2.0),
('sprawdzenie wyłącznika rcd',       'ES-PM-023', 'Sprawdzenie RCD — czas reakcji 30mA',                'robocizna', false, NULL, 0.20,  'szt', 'pomiary_dokumentacja', 1.8),
('protokol pomiarow elektrycznych',  'ES-PM-024', 'Protokół z pomiarów instalacji elektrycznej',        'robocizna', false, NULL, 1.50,  'kpl', 'pomiary_dokumentacja', 2.0),
('protokol odbioru elektryczny',     'ES-PM-024', 'Protokół odbioru instalacji — PN-IEC 60364',         'robocizna', false, NULL, 1.50,  'kpl', 'pomiary_dokumentacja', 1.8),
('termowizja instalacji',            'ES-PM-025', 'Badanie termowizyjne instalacji elektrycznej',        'robocizna', false, NULL, 2.00,  'szt', 'pomiary_dokumentacja', 2.0),
('kamera termowizyjna elektryczna',  'ES-PM-025', 'Kamera termowizyjna — badanie rozdzielnicy',         'robocizna', false, NULL, 2.00,  'szt', 'pomiary_dokumentacja', 1.8),
('pomiar natezenia oswietlenia lux', 'ES-PM-026', 'Pomiar natężenia oświetlenia (luksomierz)',           'robocizna', false, NULL, 0.30,  'szt', 'pomiary_dokumentacja', 2.0),
('odbior instalacji elektrycznej',   'ES-PM-027', 'Odbiór instalacji elektrycznej — do 20 obwodów',     'robocizna', false, NULL, 4.00,  'kpl', 'pomiary_dokumentacja', 2.0),
('sprawdzenie instalacji elektrycznej','ES-PM-027', 'Sprawdzenie nowej instalacji elektrycznej',        'robocizna', false, NULL, 4.00,  'kpl', 'pomiary_dokumentacja', 1.8),
('przeglad 5-letni instalacji',      'ES-PM-028', 'Przegląd 5-letni instalacji elektrycznej',           'robocizna', false, NULL, 5.00,  'kpl', 'pomiary_dokumentacja', 2.0),
('kontrola 5 lat elektryczna',       'ES-PM-028', 'Kontrola 5-letnia — PN-EN 50699',                    'robocizna', false, NULL, 5.00,  'kpl', 'pomiary_dokumentacja', 1.8),
('dokumentacja powykonawcza',        'ES-PM-029', 'Dokumentacja powykonawcza instalacji elektrycznej',  'robocizna', false, NULL, 8.00,  'kpl', 'pomiary_dokumentacja', 2.0),
('as-built elektryka',               'ES-PM-029', 'Dokumentacja as-built — rzuty + schematy',           'robocizna', false, NULL, 8.00,  'kpl', 'pomiary_dokumentacja', 1.8),
('pomiar jakosci energii',           'ES-PM-030', 'Pomiar jakości energii — analizator harmonicznych',  'robocizna', false, NULL, 2.50,  'szt', 'pomiary_dokumentacja', 2.0),
('analizator sieci thd',             'ES-PM-030', 'Analizator sieci THD — pomiar harmonicznych',        'robocizna', false, NULL, 2.50,  'szt', 'pomiary_dokumentacja', 1.8),
('certyfikacja instalacji lan',      'ES-PM-031', 'Certyfikacja kabli LAN (Fluke) — 1 tor',             'robocizna', false, NULL, 0.30,  'szt', 'pomiary_dokumentacja', 2.0),
('otdr pomiar swiatlowod',           'ES-PM-032', 'Pomiar OTDR kabla światłowodowego — 1 trasa',        'robocizna', false, NULL, 1.50,  'szt', 'pomiary_dokumentacja', 2.0),
('uruchomienie rozdzielnicy',        'ES-PM-033', 'Uruchomienie i próba rozdzielnicy głównej',           'robocizna', false, NULL, 4.00,  'szt', 'pomiary_dokumentacja', 2.0),
('ekspertyza elektryczna',           'ES-PM-034', 'Ekspertyza stanu instalacji elektrycznej',           'robocizna', false, NULL, 8.00,  'kpl', 'pomiary_dokumentacja', 2.0),
('audyt energetyczny',               'ES-PM-035', 'Audyt energetyczny budynku',                          'robocizna', false, NULL, 16.0,  'kpl', 'pomiary_dokumentacja', 1.8),

-- ============================================================
-- ŚWIATŁOWODY (rozbudowa istniejącej kategorii: +10 wpisów)
-- ============================================================
('kabel swiatlowodowy os2',          'ES-FO-020', 'Ułożenie kabla FO OS2 jednomodowego',                 'robocizna', false, NULL, 0.08,  'm',   'swiatlowody', 2.0),
('kabel os2 4j',                     'ES-FO-021', 'Kabel OS2 4J — ułożenie w korycie/rurce',             'robocizna', false, NULL, 0.07,  'm',   'swiatlowody', 2.0),
('kabel os2 12j',                    'ES-FO-022', 'Kabel OS2 12J — ułożenie',                            'robocizna', false, NULL, 0.09,  'm',   'swiatlowody', 2.0),
('kabel os2 24j',                    'ES-FO-023', 'Kabel OS2 24J — ułożenie w kanalizacji',              'robocizna', false, NULL, 0.10,  'm',   'swiatlowody', 2.0),
('kabel om3 wielomodowy',            'ES-FO-024', 'Kabel OM3/OM4 wielomodowy — ułożenie',               'robocizna', false, NULL, 0.10,  'm',   'swiatlowody', 2.0),
('odf panel krosowniczy 24j',        'ES-FO-025', 'Montaż ODF 24J (kaseta spawalnicza + adaptery)',      'robocizna', false, NULL, 2.00,  'szt', 'swiatlowody', 2.0),
('gniazdo swiatlowodowe sc apc',     'ES-FO-026', 'Montaż gniazda FO SC/APC w lokalu/biurze',           'robocizna', false, NULL, 0.50,  'szt', 'swiatlowody', 2.0),
('skrzynka ftth rozdzielcza',        'ES-FO-027', 'Montaż skrzynki rozdzielczej FTTH (do 24J)',          'robocizna', false, NULL, 1.50,  'szt', 'swiatlowody', 2.0),
('splitter optyczny plc 1:8',        'ES-FO-028', 'Montaż splittera PLC 1:8 (PON/FTTH)',                 'robocizna', false, NULL, 0.50,  'szt', 'swiatlowody', 2.0),
('media konwerter fo ethernet',      'ES-FO-029', 'Montaż media konwertera FO-Ethernet (SFP)',           'robocizna', false, NULL, 0.50,  'szt', 'swiatlowody', 2.0),
('dmuchanie kabla microduct',        'ES-FO-030', 'Wciąganie kabla FO dmuchaniem w mikrodukcie',         'robocizna', false, NULL, 0.05,  'm',   'swiatlowody', 2.0),
('kabel adss napowietrzny',          'ES-FO-031', 'Ułożenie kabla ADSS napowietrznego między słupami',   'robocizna', false, NULL, 0.15,  'm',   'swiatlowody', 2.0)

ON CONFLICT (keyword_normalized) DO NOTHING;
