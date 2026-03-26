-- ============================================================
-- ES-Engine Dictionary Seed v18 — PRZEMYSŁ / BIURO / HALE / SKLEPY
-- Gap-fill dla kompleksowego pokrycia 2026
--
-- Nowe kategorie:
--   maszyny_napedy       — silniki, falowniki VFD, rozruszniki
--   gniazda_przemyslowe  — 32A/63A/125A CEE, floorbox, podłogowe
--   szafy_sterowania     — MCC, PLC, HMI, SCADA, automatyka
--   wentylacja_hvac      — NFZ, rekuperator, kurtyna, nagrzewnica
--   retail_sklepy        — track lighting, chłodnictwo, digital signage
--   heat_tracing         — taśma grzewcza rur, rynien, przeciwzamrożeniowa
--   szynoprzewod_zasilajacy — busbar 100A–1600A zasilający
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ══════════════════════════════════════════════════════════════════
-- MASZYNY I NAPĘDY (hale, przemysł) — silniki, VFD, rozruszniki
-- ══════════════════════════════════════════════════════════════════

('podlaczenie silnika elektrycznego',   'KNR 5-10 1201-01', 'Podłączenie silnika 3-fazowego do 7.5kW',         'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie silnika 3 fazowego',      'KNR 5-10 1201-01', 'Podłączenie silnika 3-faz (puszka zaciskowa)',    'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie silnika',                 'KNR 5-10 1201-01', 'Podłączenie silnika elektrycznego',               'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 1.8),
('montaz silnika elektrycznego',        'KNR 5-10 1201-02', 'Montaż i podłączenie silnika 3-fazowego',        'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 2.0),
('silnik 3faz',                         'KNR 5-10 1201-01', 'Silnik elektryczny 3-fazowy montaż',             'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 1.8),
('silnik elektryczny',                  'KNR 5-10 1201-01', 'Silnik elektryczny — podłączenie',               'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 1.6),

('montaz falownika',                    'KNR 5-10 1301-01', 'Montaż falownika VFD/invertera',                 'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 2.0),
('montaz invertera',                    'KNR 5-10 1301-01', 'Montaż i okablowanie falownika',                 'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 1.8),
('falownik vfd',                        'KNR 5-10 1301-01', 'Falownik VFD — montaż, konfiguracja',            'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 2.0),
('inverter montaz',                     'KNR 5-10 1301-01', 'Inverter (falownik) — instalacja',               'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 1.8),
('przemiennik czestotliwosci',          'KNR 5-10 1301-01', 'Przemiennik częstotliwości — montaż',            'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 2.0),
('vfd montaz',                          'KNR 5-10 1301-01', 'VFD — montaż i podłączenie silnika',             'robocizna', false, NULL, 3.00, 'szt', 'maszyny_napedy', 1.8),
('soft starter',                        'KNR 5-10 1302-01', 'Softstart — montaż i konfiguracja',              'robocizna', false, NULL, 2.50, 'szt', 'maszyny_napedy', 2.0),
('rozrusznik gwiazda trojkat',          'KNR 5-10 1302-02', 'Rozrusznik gwiazda-trójkąt (Y/Δ)',              'robocizna', false, NULL, 5.00, 'kpl', 'maszyny_napedy', 2.0),
('rozrusznik silnika',                  'KNR 5-10 1302-01', 'Rozrusznik silnika elektrycznego',               'robocizna', false, NULL, 2.50, 'szt', 'maszyny_napedy', 1.8),
('podlaczenie maszyny',                 'KNR 5-10 1201-03', 'Podłączenie maszyny produkcyjnej (do 22kW)',     'robocizna', false, NULL, 3.50, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie maszyny produkcyjnej',    'KNR 5-10 1201-03', 'Podłączenie urządzenia technologicznego',        'robocizna', false, NULL, 3.50, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie urzadzenia technologicznego','KNR 5-10 1201-03','Podłączenie urządzenia technologicznego',      'robocizna', false, NULL, 3.50, 'szt', 'maszyny_napedy', 1.8),
('podlaczenie sprężarki',               'KNR 5-10 1201-04', 'Podłączenie sprężarki (3-faz, do 22kW)',         'robocizna', false, NULL, 3.50, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie spreżarki',               'KNR 5-10 1201-04', 'Podłączenie sprężarki',                          'robocizna', false, NULL, 3.50, 'szt', 'maszyny_napedy', 1.8),
('podlaczenie wentylatora przemyslowego','KNR 5-10 1201-05','Podłączenie wentylatora przemysłowego',          'robocizna', false, NULL, 2.00, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie pompy',                   'KNR 5-10 1201-06', 'Podłączenie pompy (do 7.5kW)',                   'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 2.0),
('podlaczenie pompy cyrkulacyjnej',     'KNR 5-10 1201-06', 'Podłączenie pompy cyrkulacyjnej',                'robocizna', false, NULL, 1.50, 'szt', 'maszyny_napedy', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- GNIAZDA PRZEMYSŁOWE + FLOORBOX (hale, biuro, sklepy)
-- ══════════════════════════════════════════════════════════════════

('gniazdo przemyslowe 32a',             'KNR 5-08 0501-01', 'Gniazdo CEE 32A 3P+N+PE',                        'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo cee 32a',                     'KNR 5-08 0501-01', 'Gniazdo CEE 32A (czerwone/niebieskie)',           'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo silowe 32a',                  'KNR 5-08 0501-01', 'Gniazdo siłowe 32A',                             'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo 32a',                         'KNR 5-08 0501-01', 'Gniazdo 32A 3-fazowe',                           'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 1.8),
('gniazdo 3 fazowe',                    'KNR 5-08 0501-01', 'Gniazdo 3-fazowe 16A/32A',                       'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 1.8),
('gniazdo cee 63a',                     'KNR 5-08 0501-02', 'Gniazdo CEE 63A 3P+N+PE',                        'robocizna', false, NULL, 1.50, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo przemyslowe 63a',             'KNR 5-08 0501-02', 'Gniazdo siłowe 63A',                             'robocizna', false, NULL, 1.50, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo 63a',                         'KNR 5-08 0501-02', 'Gniazdo 63A CEE',                                'robocizna', false, NULL, 1.50, 'szt', 'gniazda_przemyslowe', 1.8),
('gniazdo cee 125a',                    'KNR 5-08 0501-03', 'Gniazdo CEE 125A 3P+N+PE',                       'robocizna', false, NULL, 2.50, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo wtyk silowy',                 'KNR 5-08 0501-01', 'Gniazdo + wtyk siłowy CEE',                      'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 1.6),
('gniazdo 400v',                        'KNR 5-08 0501-01', 'Gniazdo 400V 3-fazowe',                          'robocizna', false, NULL, 0.80, 'szt', 'gniazda_przemyslowe', 1.8),

('floorbox montaz',                     'KNR 5-08 0502-01', 'Floorbox podłogowy z gniazdami (biuro)',          'robocizna', false, NULL, 1.50, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo podlogowe',                   'KNR 5-08 0502-01', 'Gniazdo podłogowe (floorbox)',                    'robocizna', false, NULL, 1.50, 'szt', 'gniazda_przemyslowe', 2.0),
('puszka podlogowa',                    'KNR 5-08 0502-01', 'Puszka podłogowa z gniazdem 230V + RJ45',        'robocizna', false, NULL, 1.50, 'szt', 'gniazda_przemyslowe', 2.0),
('kolumna instalacyjna',                'KNR 5-08 0502-02', 'Kolumna instalacyjna biurowa (power + LAN)',      'robocizna', false, NULL, 2.50, 'szt', 'gniazda_przemyslowe', 2.0),
('kolumna biurkowa',                    'KNR 5-08 0502-02', 'Kolumna biurkowa z gniazdami',                   'robocizna', false, NULL, 2.50, 'szt', 'gniazda_przemyslowe', 1.8),
('listwa nabiurkowa',                   'KNR 5-08 0502-02', 'Listwa nabiurkowa z gniazdami power + data',     'robocizna', false, NULL, 2.00, 'mb',  'gniazda_przemyslowe', 1.8),
('gniazdo usb',                         'KNR 5-08 0201-06', 'Gniazdo z ładowarką USB (Type-A/C)',             'robocizna', false, NULL, 0.35, 'szt', 'gniazda_przemyslowe', 1.8),
('gniazdo z usb',                       'KNR 5-08 0201-06', 'Gniazdo 230V z USB Type-C',                     'robocizna', false, NULL, 0.35, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo hermetyczne',                 'KNR 5-08 0201-07', 'Gniazdo hermetyczne IP44/IP65',                  'robocizna', false, NULL, 0.45, 'szt', 'gniazda_przemyslowe', 2.0),
('gniazdo ip44',                        'KNR 5-08 0201-07', 'Gniazdo zewnętrzne IP44',                        'robocizna', false, NULL, 0.45, 'szt', 'gniazda_przemyslowe', 1.8),
('gniazdo ip65',                        'KNR 5-08 0201-07', 'Gniazdo przemysłowe IP65',                       'robocizna', false, NULL, 0.45, 'szt', 'gniazda_przemyslowe', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- SZAFY STEROWANIA / AUTOMATYKA (MCC, PLC, HMI, SCADA)
-- ══════════════════════════════════════════════════════════════════

('szafa sterownicza montaz',            'KNR 5-10 2001-01', 'Montaż szafy sterowniczej (do 36 mod.)',          'robocizna', false, NULL, 8.00, 'szt', 'szafy_sterowania', 2.0),
('szafa sterowania',                    'KNR 5-10 2001-01', 'Szafa sterowania — montaż i okablowanie',        'robocizna', false, NULL, 8.00, 'szt', 'szafy_sterowania', 2.0),
('montaz szafy plc',                    'KNR 5-10 2001-02', 'Montaż szafy z PLC i modułami I/O',              'robocizna', false, NULL, 12.00, 'szt', 'szafy_sterowania', 2.0),
('szafa plc',                           'KNR 5-10 2001-02', 'Szafa PLC — montaż, okablowanie, konfiguracja', 'robocizna', false, NULL, 12.00, 'szt', 'szafy_sterowania', 2.0),
('sterownik plc montaz',                'KNR 5-10 2001-02', 'Sterownik PLC — montaż i konfiguracja I/O',     'robocizna', false, NULL, 6.00, 'szt', 'szafy_sterowania', 2.0),
('plc montaz',                          'KNR 5-10 2001-02', 'PLC (sterownik logiczny) montaż',                'robocizna', false, NULL, 6.00, 'szt', 'szafy_sterowania', 1.8),
('montaz hmi',                          'KNR 5-10 2002-01', 'Montaż panelu HMI (dotykowy operator)',          'robocizna', false, NULL, 3.00, 'szt', 'szafy_sterowania', 2.0),
('panel hmi',                           'KNR 5-10 2002-01', 'Panel HMI — montaż i konfiguracja sieci',       'robocizna', false, NULL, 3.00, 'szt', 'szafy_sterowania', 1.8),
('scada podlaczenie',                   'KNR 5-10 2003-01', 'Podłączenie do systemu SCADA/BMS (sieć ind.)',   'robocizna', false, NULL, 4.00, 'kpl', 'szafy_sterowania', 2.0),
('montaz mcc',                          'KNR 5-10 2004-01', 'Montaż centrum sterowania silnikami (MCC)',      'robocizna', false, NULL, 16.00, 'szt', 'szafy_sterowania', 2.0),
('centrum sterowania silnikami',        'KNR 5-10 2004-01', 'MCC (Motor Control Center) montaż',             'robocizna', false, NULL, 16.00, 'szt', 'szafy_sterowania', 2.0),
('szafa automatyki',                    'KNR 5-10 2001-01', 'Szafa automatyki przemysłowej',                  'robocizna', false, NULL, 8.00, 'szt', 'szafy_sterowania', 1.8),
('rozdzielnica przemyslowa',            'KNR 5-10 0801-01', 'Rozdzielnica przemysłowa IP65 — montaż',        'robocizna', false, NULL, 6.00, 'szt', 'szafy_sterowania', 1.8),
('szafa rozdzielcza przemyslowa',       'KNR 5-10 0801-01', 'Szafa rozdzielcza przemysłowa (metalowa)',      'robocizna', false, NULL, 6.00, 'szt', 'szafy_sterowania', 1.8),
('okablowanie szafy sterownicy',        'KNR 5-10 2001-03', 'Okablowanie wewnętrzne szafy sterowniczej',     'robocizna', false, NULL, 0.08, 'mb',  'szafy_sterowania', 1.8),
('przewod sterowniczy liycy',           'KNR 5-10 2001-04', 'Przewód sterowniczy LiYCY ekranowany',          'robocizna', false, NULL, 0.04, 'mb',  'szafy_sterowania', 2.0),
('kabel sterowniczy',                   'KNR 5-10 2001-04', 'Kabel sterowniczy (YKSY/LiYCY)',                'robocizna', false, NULL, 0.04, 'mb',  'szafy_sterowania', 1.8),
('montaz przekaznika',                  'KNR 5-10 2005-01', 'Montaż przekaźnika sterującego (moduł)',        'robocizna', false, NULL, 0.40, 'szt', 'szafy_sterowania', 1.8),
('przekaznik montaz',                   'KNR 5-10 2005-01', 'Przekaźnik — montaż w szynie DIN',              'robocizna', false, NULL, 0.40, 'szt', 'szafy_sterowania', 1.6),
('montaz stycznika',                    'KNR 5-10 2005-02', 'Montaż stycznika (3P, AC, 9-95A)',               'robocizna', false, NULL, 0.60, 'szt', 'szafy_sterowania', 2.0),
('stycznik montaz',                     'KNR 5-10 2005-02', 'Stycznik — montaż i podłączenie cewki',        'robocizna', false, NULL, 0.60, 'szt', 'szafy_sterowania', 2.0),
('bms montaz',                          'KNR 5-10 2006-01', 'BMS — montaż sterownika budynku',               'robocizna', false, NULL, 5.00, 'szt', 'szafy_sterowania', 2.0),
('system bms',                          'KNR 5-10 2006-01', 'System zarządzania budynkiem BMS — montaż',    'robocizna', false, NULL, 5.00, 'szt', 'szafy_sterowania', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- WENTYLACJA I OGRZEWANIE ELEKTRYCZNE (NFZ, rekuperator, kurtyna)
-- ══════════════════════════════════════════════════════════════════

('podlaczenie nfz',                     'KNR 5-08 3001-01', 'Podłączenie nawiewno-wywiewnej NFZ',             'robocizna', false, NULL, 3.50, 'szt', 'wentylacja_hvac_el', 2.0),
('centrale nfz podlaczenie',            'KNR 5-08 3001-01', 'Centrala NFZ — podłączenie elektryczne',        'robocizna', false, NULL, 3.50, 'szt', 'wentylacja_hvac_el', 2.0),
('montaz rekuperatora',                 'KNR 5-08 3001-02', 'Podłączenie elektryczne rekuperatora',          'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 2.0),
('podlaczenie rekuperatora',            'KNR 5-08 3001-02', 'Rekuperator — zasilanie + sterowanie',          'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 2.0),
('rekuperator elektryczny',             'KNR 5-08 3001-02', 'Rekuperator ERV/HRV podłączenie',               'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 1.8),
('montaz kurtyny powietrznej',          'KNR 5-08 3002-01', 'Montaż kurtyny powietrznej elektrycznej',       'robocizna', false, NULL, 2.50, 'szt', 'wentylacja_hvac_el', 2.0),
('kurtyna powietrzna',                  'KNR 5-08 3002-01', 'Kurtyna powietrzna — montaż i podłączenie',    'robocizna', false, NULL, 2.50, 'szt', 'wentylacja_hvac_el', 2.0),
('montaz nagrzewnicy kanalowej',        'KNR 5-08 3003-01', 'Montaż nagrzewnicy kanałowej elektrycznej',     'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 2.0),
('nagrzewnica kanalowa',                'KNR 5-08 3003-01', 'Nagrzewnica kanałowa — montaż i okablowanie',  'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 2.0),
('nagrzewnica elektryczna',             'KNR 5-08 3003-01', 'Nagrzewnica elektryczna (DUCT HEATER)',         'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 1.8),
('montaz klimatyzacji split',           'KNR 5-08 3004-01', 'Montaż klimatyzatora split — instalacja elektr.','robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 2.0),
('klimatyzacja split montaz',           'KNR 5-08 3004-01', 'Klimatyzator split — zasilanie + sterowanie',  'robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 2.0),
('podlaczenie klimatyzatora',           'KNR 5-08 3004-01', 'Podłączenie klimatyzatora do instalacji elektr.','robocizna', false, NULL, 2.00, 'szt', 'wentylacja_hvac_el', 1.8),
('montaz wentylatora',                  'KNR 5-08 3005-01', 'Montaż wentylatora dachowego/kanałowego',       'robocizna', false, NULL, 1.50, 'szt', 'wentylacja_hvac_el', 2.0),
('wentylator kanalowy montaz',          'KNR 5-08 3005-01', 'Wentylator kanałowy — montaż i podłączenie',   'robocizna', false, NULL, 1.50, 'szt', 'wentylacja_hvac_el', 1.8),
('podlaczenie centrali wentylacyjnej',  'KNR 5-08 3001-03', 'Podłączenie centrali wentylacyjnej AHU',        'robocizna', false, NULL, 5.00, 'szt', 'wentylacja_hvac_el', 2.0),
('centrala wentylacyjna ahu',           'KNR 5-08 3001-03', 'Centrala AHU — zasilanie + sterownik',         'robocizna', false, NULL, 5.00, 'szt', 'wentylacja_hvac_el', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- RETAIL / SKLEPY — oświetlenie szynowe, chłodnictwo, signage
-- ══════════════════════════════════════════════════════════════════

('montaz szyny oswietleniowej',         'KNR 5-08 4001-01', 'Montaż szyny oświetleniowej track system',       'robocizna', false, NULL, 0.50, 'mb',  'retail_sklepy', 2.0),
('szyna oswietleniowa',                 'KNR 5-08 4001-01', 'Szyna oświetleniowa 1/3-fazowa',                 'robocizna', false, NULL, 0.50, 'mb',  'retail_sklepy', 2.0),
('track lighting',                      'KNR 5-08 4001-01', 'Track lighting — montaż szyny + oprawy',         'robocizna', false, NULL, 0.50, 'mb',  'retail_sklepy', 1.8),
('szynoprzewod oswietleniowy sklep',    'KNR 5-08 4001-01', 'Szynoprzewód oświetleniowy (sklep/galeria)',     'robocizna', false, NULL, 0.80, 'mb',  'retail_sklepy', 1.8),
('montaz oprawy do szyny',              'KNR 5-08 4001-02', 'Oprawa na szynę (track spotlight) — montaż',    'robocizna', false, NULL, 0.40, 'szt', 'retail_sklepy', 2.0),
('spotlight track',                     'KNR 5-08 4001-02', 'Spot LED na szynę oświetleniową',               'robocizna', false, NULL, 0.40, 'szt', 'retail_sklepy', 1.8),

('zasilanie lady chłodniczej',          'KNR 5-08 4002-01', 'Podłączenie lady chłodniczej (do 16A)',         'robocizna', false, NULL, 2.00, 'szt', 'retail_sklepy', 2.0),
('lady chłodnicze zasilanie',           'KNR 5-08 4002-01', 'Lada chłodnicza — zasilanie elektryczne',       'robocizna', false, NULL, 2.00, 'szt', 'retail_sklepy', 1.8),
('podlaczenie agregatu chłodniczego',   'KNR 5-08 4002-02', 'Podłączenie agregatu chłodniczego (3-faz)',     'robocizna', false, NULL, 3.50, 'szt', 'retail_sklepy', 2.0),
('agregat chłodniczy',                  'KNR 5-08 4002-02', 'Agregat chłodniczy — zasilanie + sterowanie',   'robocizna', false, NULL, 3.50, 'szt', 'retail_sklepy', 1.8),
('zasilanie lodowki witryny',           'KNR 5-08 4002-01', 'Zasilanie witryny / lodówki handlowej',         'robocizna', false, NULL, 2.00, 'szt', 'retail_sklepy', 1.8),

('montaz reklamy swietlnej',            'KNR 5-08 4003-01', 'Montaż reklamy świetlnej / kasetonu LED',       'robocizna', false, NULL, 3.00, 'szt', 'retail_sklepy', 2.0),
('kaseton reklamowy led',               'KNR 5-08 4003-01', 'Kaseton reklamowy LED — montaż i zasilanie',    'robocizna', false, NULL, 3.00, 'szt', 'retail_sklepy', 1.8),
('szyld led montaz',                    'KNR 5-08 4003-01', 'Szyld LED — montaż, okablowanie',               'robocizna', false, NULL, 3.00, 'szt', 'retail_sklepy', 1.8),
('neon montaz',                         'KNR 5-08 4003-02', 'Neon / reklama neonowa — montaż i podłączenie', 'robocizna', false, NULL, 2.50, 'szt', 'retail_sklepy', 1.8),
('zasilanie kasy fiskalnej',            'KNR 5-08 4004-01', 'Gniazdo + zasilanie kasy fiskalnej / POS',      'robocizna', false, NULL, 0.60, 'szt', 'retail_sklepy', 2.0),
('punkt sprzedazy pos',                 'KNR 5-08 4004-01', 'Punkt POS — gniazdo zasilające + LAN',         'robocizna', false, NULL, 0.60, 'szt', 'retail_sklepy', 1.8),
('okablowanie stanowiska kasowego',     'KNR 5-08 4004-01', 'Okablowanie stanowiska kasowego (230V + LAN)',  'robocizna', false, NULL, 1.50, 'kpl', 'retail_sklepy', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- HEAT TRACING — grzanie rur, rynien, antyoblodzenie
-- ══════════════════════════════════════════════════════════════════

('tasma grzewcza rur',                  'KNR 5-08 5001-01', 'Taśma grzewcza rur (samoregulująca)',            'robocizna', false, NULL, 0.30, 'mb',  'heat_tracing', 2.0),
('grzanie rur elektryczne',             'KNR 5-08 5001-01', 'Elektryczne grzanie rurociągów',                 'robocizna', false, NULL, 0.30, 'mb',  'heat_tracing', 2.0),
('heat tracing',                        'KNR 5-08 5001-01', 'Heat tracing — taśma grzewcza rur',             'robocizna', false, NULL, 0.30, 'mb',  'heat_tracing', 1.8),
('kabel grzejny rur',                   'KNR 5-08 5001-01', 'Kabel grzejny rurociągu',                        'robocizna', false, NULL, 0.30, 'mb',  'heat_tracing', 1.8),
('tasma grzewcza rynnowa',              'KNR 5-08 5001-02', 'Taśma grzewcza do rynien i rur spustowych',     'robocizna', false, NULL, 0.25, 'mb',  'heat_tracing', 2.0),
('antyoblodzenie rynien',               'KNR 5-08 5001-02', 'Antyoblodzenie rynien — kabel grzewczy',        'robocizna', false, NULL, 0.25, 'mb',  'heat_tracing', 2.0),
('ogrzewanie rynien elektryczne',       'KNR 5-08 5001-02', 'Elektryczne ogrzewanie rynien i dachu',         'robocizna', false, NULL, 0.25, 'mb',  'heat_tracing', 1.8),
('tasma grzewcza schodow',              'KNR 5-08 5001-03', 'Taśma grzewcza schodów/podjazdów (na zewnątrz)','robocizna', false, NULL, 0.35, 'mb',  'heat_tracing', 2.0),
('ogrzewanie podjazdow',                'KNR 5-08 5001-03', 'Elektryczne ogrzewanie podjazdów/chodników',    'robocizna', false, NULL, 0.35, 'mb',  'heat_tracing', 1.8),
('termostat heat tracing',              'KNR 5-08 5001-04', 'Termostat sterujący systemem heat tracing',     'robocizna', false, NULL, 0.80, 'szt', 'heat_tracing', 2.0),
('sterownik taśmy grzewczej',           'KNR 5-08 5001-04', 'Sterownik / termostat taśmy grzewczej',        'robocizna', false, NULL, 0.80, 'szt', 'heat_tracing', 1.8),

-- ══════════════════════════════════════════════════════════════════
-- SZYNOPRZEWÓD ZASILAJĄCY (hale, sklepy, galerie)
-- ══════════════════════════════════════════════════════════════════

('szynoprzewod zasilajacy montaz',      'KNR 5-10 3001-01', 'Montaż szynoprzewodu zasilającego (busbar)',     'robocizna', false, NULL, 1.20, 'mb',  'szynoprzewod_zasilajacy', 2.0),
('busbar zasilajacy',                   'KNR 5-10 3001-01', 'Busbar zasilający (Power Busbar)',               'robocizna', false, NULL, 1.20, 'mb',  'szynoprzewod_zasilajacy', 2.0),
('szynoprzewod 400a',                   'KNR 5-10 3001-02', 'Szynoprzewód zasilający 400A — montaż',         'robocizna', false, NULL, 1.50, 'mb',  'szynoprzewod_zasilajacy', 2.0),
('szynoprzewod 630a',                   'KNR 5-10 3001-03', 'Szynoprzewód zasilający 630A — montaż',         'robocizna', false, NULL, 2.00, 'mb',  'szynoprzewod_zasilajacy', 2.0),
('szynoprzewod 1000a',                  'KNR 5-10 3001-04', 'Szynoprzewód zasilający 1000A — montaż',        'robocizna', false, NULL, 2.50, 'mb',  'szynoprzewod_zasilajacy', 2.0),
('montaz odgaleznika szynoprzewodu',    'KNR 5-10 3001-05', 'Odgałęźnik szynoprzewodu (tap-off unit)',       'robocizna', false, NULL, 1.50, 'szt', 'szynoprzewod_zasilajacy', 2.0),
('tap off unit',                        'KNR 5-10 3001-05', 'Tap-off unit — odgałęźnik busbar',              'robocizna', false, NULL, 1.50, 'szt', 'szynoprzewod_zasilajacy', 1.8),
('rozdzielnica na koncu szynoprzewodu', 'KNR 5-10 3001-06', 'Rozdzielnica końcowa szynoprzewodu',            'robocizna', false, NULL, 3.00, 'szt', 'szynoprzewod_zasilajacy', 1.8)

ON CONFLICT (keyword_normalized) DO NOTHING;
