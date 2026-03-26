-- =====================================================================
-- ES-Dictionary v23 — Rozbudowa słabych kategorii
-- Kategorie: kontrola_dostepu, wlz, ochrona_ppoz, rury_ochronne,
--            cctv, sygnalizacja_pozaru, systemy_bezpieczenstwa,
--            data_center, rury_instalacyjne, e_mobility, pomiary
-- Target: ~110 nowych wpisów
-- =====================================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ────────────────────────────────────────────────────────────────────
-- KONTROLA DOSTĘPU (12 wpisów)
-- ────────────────────────────────────────────────────────────────────
('czytnik rfid 125khz', 'KNR-ES-KD01', 'Czytnik RFID 125kHz', 'zestaw', false, 0.75, 'szt', 'kontrola_dostepu', 0.85),
('czytnik rfid mifare 13.56mhz', 'KNR-ES-KD02', 'Czytnik RFID MIFARE 13.56MHz', 'zestaw', false, 0.75, 'szt', 'kontrola_dostepu', 0.85),
('zamek elektromagnetyczny 600n', 'KNR-ES-KD03', 'Zamek elektromagnetyczny 600N', 'zestaw', false, 1.20, 'szt', 'kontrola_dostepu', 0.85),
('zamek elektromagnetyczny 1200n', 'KNR-ES-KD04', 'Zamek elektromagnetyczny 1200N', 'zestaw', false, 1.20, 'szt', 'kontrola_dostepu', 0.85),
('elektrozaczep rewersyjny', 'KNR-ES-KD05', 'Elektrozaczep rewersyjny', 'zestaw', false, 0.80, 'szt', 'kontrola_dostepu', 0.85),
('kontroler dostępu 2-drzwiowy', 'KNR-ES-KD06', 'Kontroler dostępu 2-drzwiowy', 'zestaw', false, 2.50, 'szt', 'kontrola_dostepu', 0.85),
('kontroler dostępu jednodrzwiowy', 'KNR-ES-KD07', 'Kontroler dostępu 1-drzwiowy', 'zestaw', false, 1.80, 'szt', 'kontrola_dostepu', 0.85),
('przycisk wyjścia natynkowy', 'KNR-ES-KD08', 'Przycisk wyjścia natynkowy', 'zestaw', false, 0.30, 'szt', 'kontrola_dostepu', 0.85),
('zasilacz kontroli dostępu 12v', 'KNR-ES-KD09', 'Zasilacz systemu KD 12V/3A', 'zestaw', false, 0.60, 'szt', 'kontrola_dostepu', 0.80),
('domofon cyfrowy', 'KNR-ES-KD10', 'Domofon cyfrowy', 'zestaw', false, 1.50, 'szt', 'kontrola_dostepu', 0.85),
('wideofon kolorowy 7 cali', 'KNR-ES-KD11', 'Wideofon kolorowy 7"', 'zestaw', false, 1.80, 'szt', 'kontrola_dostepu', 0.85),
('kabel kd ytksy 2x0.8', 'KNR-ES-KD12', 'Kabel KD YTKSY 2x0.8mm', 'robocizna', false, 0.10, 'mb', 'kontrola_dostepu', 0.80),

-- ────────────────────────────────────────────────────────────────────
-- WLZ — WEWNĘTRZNA LINIA ZASILAJĄCA (10 wpisów)
-- ────────────────────────────────────────────────────────────────────
('wlz kabel ydy 3x6', 'KNR 5-08/3.1', 'WLZ kabel YDY 3x6mm²', 'robocizna', false, 0.18, 'mb', 'wlz', 0.90),
('wlz kabel ydy 3x10', 'KNR 5-08/3.2', 'WLZ kabel YDY 3x10mm²', 'robocizna', false, 0.22, 'mb', 'wlz', 0.90),
('wlz kabel ydy 5x6', 'KNR 5-08/3.3', 'WLZ kabel YDY 5x6mm²', 'robocizna', false, 0.22, 'mb', 'wlz', 0.90),
('wlz kabel ydy 5x10', 'KNR 5-08/3.4', 'WLZ kabel YDY 5x10mm²', 'robocizna', false, 0.26, 'mb', 'wlz', 0.90),
('wlz kabel ydy 5x16', 'KNR 5-08/3.5', 'WLZ kabel YDY 5x16mm²', 'robocizna', false, 0.32, 'mb', 'wlz', 0.90),
('wlz kabel ydy 5x25', 'KNR 5-08/3.6', 'WLZ kabel YDY 5x25mm²', 'robocizna', false, 0.40, 'mb', 'wlz', 0.90),
('wlz kabel ydy 5x35', 'KNR 5-08/3.7', 'WLZ kabel YDY 5x35mm²', 'robocizna', false, 0.50, 'mb', 'wlz', 0.90),
('wlz rura osłonowa hdpe 50', 'KNR-ES-WLZ01', 'Rura osłonowa HDPE 50mm dla WLZ', 'robocizna', false, 0.15, 'mb', 'wlz', 0.85),
('główny wyłącznik prądu gp', 'KNR-ES-WLZ02', 'Główny wyłącznik prądu (GP)', 'zestaw', false, 2.00, 'szt', 'wlz', 0.85),
('złącze kablowe sk 1x240', 'KNR-ES-WLZ03', 'Złącze kablowe SK do 1x240mm²', 'zestaw', false, 1.50, 'szt', 'wlz', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- OCHRONA PPOŻ (10 wpisów)
-- ────────────────────────────────────────────────────────────────────
('kabel nhxh e30 3x1.5', 'KNR-ES-PPOZ01', 'Kabel NHXH E30 3x1.5mm² (ppoż)', 'robocizna', false, 0.18, 'mb', 'ochrona_ppoz', 0.90),
('kabel nhxh e90 3x2.5', 'KNR-ES-PPOZ02', 'Kabel NHXH E90 3x2.5mm² (ppoż)', 'robocizna', false, 0.22, 'mb', 'ochrona_ppoz', 0.90),
('kabel nhxh e90 5x2.5', 'KNR-ES-PPOZ03', 'Kabel NHXH E90 5x2.5mm² (ppoż)', 'robocizna', false, 0.28, 'mb', 'ochrona_ppoz', 0.90),
('oprawa ppoż led 18w 3h', 'KNR-ES-PPOZ04', 'Oprawa LED ppoż 18W/3h', 'zestaw', false, 0.90, 'szt', 'ochrona_ppoz', 0.85),
('lampa ewakuacyjna led 3h', 'KNR-ES-PPOZ05', 'Lampa ewakuacyjna LED 3h autonomia', 'zestaw', false, 0.90, 'szt', 'ochrona_ppoz', 0.85),
('znak ewakuacyjny led podświetlany', 'KNR-ES-PPOZ06', 'Znak ewakuacyjny LED podświetlany', 'zestaw', false, 0.60, 'szt', 'ochrona_ppoz', 0.85),
('wyłącznik pożarowy wppoż', 'KNR-ES-PPOZ07', 'Wyłącznik pożarowy WPPoż', 'zestaw', false, 1.50, 'szt', 'ochrona_ppoz', 0.85),
('centrala dsp oświetlenia ewakuacyjnego', 'KNR-ES-PPOZ08', 'Centrala DSP oświetlenia ewakuacyjnego', 'zestaw', false, 4.00, 'szt', 'ochrona_ppoz', 0.80),
('kurek gazowy odcinający elektromagnetyczny', 'KNR-ES-PPOZ09', 'Zawór gazowy elektromagnetyczny', 'zestaw', false, 1.20, 'szt', 'ochrona_ppoz', 0.80),
('klapa pożarowa wentylacyjna 24v', 'KNR-ES-PPOZ10', 'Klapa pożarowa wentylacyjna 24V', 'zestaw', false, 2.50, 'szt', 'ochrona_ppoz', 0.80),

-- ────────────────────────────────────────────────────────────────────
-- RURY OCHRONNE / INSTALACYJNE (12 wpisów)
-- ────────────────────────────────────────────────────────────────────
('rura karbowana pvc m20', 'KNR-ES-RURA01', 'Rura karbowana PVC M20', 'robocizna', false, 0.06, 'mb', 'rury_ochronne', 0.90),
('rura karbowana pvc m25', 'KNR-ES-RURA02', 'Rura karbowana PVC M25', 'robocizna', false, 0.07, 'mb', 'rury_ochronne', 0.90),
('rura karbowana pvc m32', 'KNR-ES-RURA03', 'Rura karbowana PVC M32', 'robocizna', false, 0.09, 'mb', 'rury_ochronne', 0.90),
('rura sztywna pvc 20mm', 'KNR-ES-RURA04', 'Rura sztywna PVC 20mm', 'robocizna', false, 0.10, 'mb', 'rury_instalacyjne', 0.90),
('rura sztywna pvc 32mm', 'KNR-ES-RURA05', 'Rura sztywna PVC 32mm', 'robocizna', false, 0.12, 'mb', 'rury_instalacyjne', 0.90),
('rura sztywna pvc 50mm', 'KNR-ES-RURA06', 'Rura sztywna PVC 50mm', 'robocizna', false, 0.15, 'mb', 'rury_instalacyjne', 0.90),
('rura hdpe 40mm podposadzkowa', 'KNR-ES-RURA07', 'Rura HDPE 40mm (podposadzkowa)', 'robocizna', false, 0.18, 'mb', 'rury_instalacyjne', 0.85),
('rura hdpe 63mm podposadzkowa', 'KNR-ES-RURA08', 'Rura HDPE 63mm (podposadzkowa)', 'robocizna', false, 0.22, 'mb', 'rury_instalacyjne', 0.85),
('kucie otworu w ścianie do 100mm', 'KNR-ES-RURA09', 'Kucie otworu w ścianie ø≤100mm', 'robocizna', false, 0.50, 'szt', 'rury_instalacyjne', 0.85),
('kucie otworu w stropie do 100mm', 'KNR-ES-RURA10', 'Kucie otworu w stropie ø≤100mm', 'robocizna', false, 0.80, 'szt', 'rury_instalacyjne', 0.85),
('korytko kablowe z pokrywą 60x60', 'KNR-ES-RURA11', 'Korytko kablowe z pokrywą 60×60mm', 'robocizna', false, 0.20, 'mb', 'rury_instalacyjne', 0.85),
('korytko kablowe z pokrywą 100x60', 'KNR-ES-RURA12', 'Korytko kablowe z pokrywą 100×60mm', 'robocizna', false, 0.28, 'mb', 'rury_instalacyjne', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- CCTV / TELEWIZJA DOZOROWA (10 wpisów)
-- ────────────────────────────────────────────────────────────────────
('kamera ip zewnętrzna 4mp', 'KNR-ES-CCTV01', 'Kamera IP zewnętrzna 4MP', 'zestaw', false, 1.20, 'szt', 'cctv', 0.85),
('kamera ip zewnętrzna 8mp 4k', 'KNR-ES-CCTV02', 'Kamera IP zewnętrzna 8MP 4K', 'zestaw', false, 1.40, 'szt', 'cctv', 0.85),
('kamera ip wewnętrzna kopułkowa', 'KNR-ES-CCTV03', 'Kamera IP wewnętrzna kopułkowa', 'zestaw', false, 0.90, 'szt', 'cctv', 0.85),
('rejestrator nvr 8 kanalow', 'KNR-ES-CCTV04', 'Rejestrator NVR 8-kanałowy', 'zestaw', false, 2.50, 'szt', 'cctv', 0.85),
('rejestrator nvr 16 kanalow', 'KNR-ES-CCTV05', 'Rejestrator NVR 16-kanałowy', 'zestaw', false, 3.00, 'szt', 'cctv', 0.85),
('kabel skrętka cat6 utp', 'KNR-ES-CCTV06', 'Kabel skrętka CAT6 UTP (CCTV/KD)', 'robocizna', false, 0.08, 'mb', 'cctv', 0.90),
('switch poe 8 portowy', 'KNR-ES-CCTV07', 'Switch PoE 8-portowy', 'zestaw', false, 1.50, 'szt', 'cctv', 0.85),
('monitor lcd 22 do cctv', 'KNR-ES-CCTV08', 'Monitor LCD 22" do CCTV', 'zestaw', false, 0.80, 'szt', 'cctv', 0.80),
('gniazdo rj45 keystone', 'KNR-ES-CCTV09', 'Gniazdo RJ45 Keystone', 'zestaw', false, 0.20, 'szt', 'cctv', 0.90),
('panel krosowniczy 24 porty cat6', 'KNR-ES-CCTV10', 'Panel krosowniczy 24p CAT6', 'zestaw', false, 2.00, 'szt', 'cctv', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- SYGNALIZACJA POŻARU SAP (10 wpisów)
-- ────────────────────────────────────────────────────────────────────
('centrala sap 4 strefowa', 'KNR-ES-SAP01', 'Centrala SAP 4-strefowa', 'zestaw', false, 6.00, 'szt', 'sygnalizacja_pozaru', 0.85),
('centrala sap 8 strefowa', 'KNR-ES-SAP02', 'Centrala SAP 8-strefowa', 'zestaw', false, 8.00, 'szt', 'sygnalizacja_pozaru', 0.85),
('czujka optyczna dymu', 'KNR-ES-SAP03', 'Czujka optyczna dymu', 'zestaw', false, 0.60, 'szt', 'sygnalizacja_pozaru', 0.90),
('czujka jonizacyjna dymu', 'KNR-ES-SAP04', 'Czujka jonizacyjna dymu', 'zestaw', false, 0.60, 'szt', 'sygnalizacja_pozaru', 0.90),
('czujka temperaturowa', 'KNR-ES-SAP05', 'Czujka temperaturowa', 'zestaw', false, 0.50, 'szt', 'sygnalizacja_pozaru', 0.90),
('ręczny ostrzegacz pożarowy rop', 'KNR-ES-SAP06', 'Ręczny ostrzegacz pożarowy ROP', 'zestaw', false, 0.50, 'szt', 'sygnalizacja_pozaru', 0.90),
('sygnalizator akustyczny pożarowy', 'KNR-ES-SAP07', 'Sygnalizator akustyczny pożarowy', 'zestaw', false, 0.60, 'szt', 'sygnalizacja_pozaru', 0.90),
('sygnalizator akustyczno-optyczny pożarowy', 'KNR-ES-SAP08', 'Sygnalizator akustyczno-optyczny', 'zestaw', false, 0.70, 'szt', 'sygnalizacja_pozaru', 0.90),
('pętla adresowalna sap', 'KNR-ES-SAP09', 'Kabel pętlowy SAP HTKSH 1x2x0.8', 'robocizna', false, 0.12, 'mb', 'sygnalizacja_pozaru', 0.85),
('przycisk p0w z szybką', 'KNR-ES-SAP10', 'Przycisk POW z szybką', 'zestaw', false, 0.50, 'szt', 'sygnalizacja_pozaru', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- SYSTEMY BEZPIECZEŃSTWA (8 wpisów)
-- ────────────────────────────────────────────────────────────────────
('centrala alarmowa 8 strefowa', 'KNR-ES-SB01', 'Centrala alarmowa 8-strefowa', 'zestaw', false, 4.00, 'szt', 'systemy_bezpieczenstwa', 0.85),
('centrala alarmowa 16 strefowa', 'KNR-ES-SB02', 'Centrala alarmowa 16-strefowa', 'zestaw', false, 6.00, 'szt', 'systemy_bezpieczenstwa', 0.85),
('czujka pir wewnętrzna', 'KNR-ES-SB03', 'Czujka PIR wewnętrzna', 'zestaw', false, 0.60, 'szt', 'systemy_bezpieczenstwa', 0.90),
('czujka pir zewnętrzna', 'KNR-ES-SB04', 'Czujka PIR zewnętrzna', 'zestaw', false, 0.80, 'szt', 'systemy_bezpieczenstwa', 0.90),
('syrena alarmowa zewnętrzna', 'KNR-ES-SB05', 'Syrena alarmowa zewnętrzna z błyskiem', 'zestaw', false, 1.00, 'szt', 'systemy_bezpieczenstwa', 0.85),
('klawiatura alarmowa lcd', 'KNR-ES-SB06', 'Klawiatura alarmowa LCD', 'zestaw', false, 0.60, 'szt', 'systemy_bezpieczenstwa', 0.85),
('kontaktron magnetyczny', 'KNR-ES-SB07', 'Kontaktron magnetyczny drzwiowy', 'zestaw', false, 0.20, 'szt', 'systemy_bezpieczenstwa', 0.90),
('zasilacz buforowy 12v 7ah', 'KNR-ES-SB08', 'Zasilacz buforowy 12V/7Ah', 'zestaw', false, 0.50, 'szt', 'systemy_bezpieczenstwa', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- DATA CENTER (8 wpisów)
-- ────────────────────────────────────────────────────────────────────
('szafa serwerowa rack 42u', 'KNR-ES-DC01', 'Szafa serwerowa RACK 42U', 'zestaw', false, 4.00, 'szt', 'data_center', 0.85),
('szafa serwerowa rack 24u', 'KNR-ES-DC02', 'Szafa serwerowa RACK 24U', 'zestaw', false, 3.00, 'szt', 'data_center', 0.85),
('pdu listwa zasilająca 19 16a', 'KNR-ES-DC03', 'PDU listwa zasilająca 19" 16A', 'zestaw', false, 1.00, 'szt', 'data_center', 0.85),
('ups tower 1000va', 'KNR-ES-DC04', 'UPS tower 1000VA', 'zestaw', false, 1.50, 'szt', 'data_center', 0.85),
('ups tower 3000va', 'KNR-ES-DC05', 'UPS tower 3000VA', 'zestaw', false, 2.00, 'szt', 'data_center', 0.85),
('ups rack 2000va 2u', 'KNR-ES-DC06', 'UPS rack 2000VA 2U', 'zestaw', false, 2.00, 'szt', 'data_center', 0.85),
('kabel zasilający c13 c14 2m', 'KNR-ES-DC07', 'Kabel zasilający C13-C14 2m', 'zestaw', false, 0.10, 'szt', 'data_center', 0.80),
('klimatyzacja precyzyjna serwerowni', 'KNR-ES-DC08', 'Klimatyzacja precyzyjna serwerowni', 'zestaw', false, 8.00, 'szt', 'data_center', 0.75),

-- ────────────────────────────────────────────────────────────────────
-- E-MOBILITY — ŁADOWANIE EV (8 wpisów)
-- ────────────────────────────────────────────────────────────────────
('stacja ładowania ev 7.4kw 1f', 'KNR-ES-EV01', 'Stacja ładowania EV 7.4kW 1-faz', 'zestaw', false, 3.00, 'szt', 'e_mobility', 0.85),
('stacja ładowania ev 11kw 3f', 'KNR-ES-EV02', 'Stacja ładowania EV 11kW 3-faz', 'zestaw', false, 4.00, 'szt', 'e_mobility', 0.85),
('stacja ładowania ev 22kw 3f', 'KNR-ES-EV03', 'Stacja ładowania EV 22kW 3-faz', 'zestaw', false, 4.50, 'szt', 'e_mobility', 0.85),
('ładowarka ev 50kw dc szybka', 'KNR-ES-EV04', 'Ładowarka EV DC 50kW (szybka)', 'zestaw', false, 8.00, 'szt', 'e_mobility', 0.80),
('kabel ev mode3 type2 32a', 'KNR-ES-EV05', 'Kabel EV Mode3 Type2 32A 7.5m', 'zestaw', false, 0.20, 'szt', 'e_mobility', 0.80),
('ochronnik przepięć ev class 2', 'KNR-ES-EV06', 'Ogranicznik przepięć EV Klasa 2', 'zestaw', false, 0.50, 'szt', 'e_mobility', 0.85),
('licznik energii mv3 3f ev', 'KNR-ES-EV07', 'Licznik energii MID 3-faz do EV', 'zestaw', false, 0.80, 'szt', 'e_mobility', 0.85),
('kabel ydy 5x10 do wallboxa', 'KNR-ES-EV08', 'Kabel YDY 5x10mm² zasilanie wallbox', 'robocizna', false, 0.26, 'mb', 'e_mobility', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- POMIARY ELEKTRYCZNE (12 wpisów)
-- ────────────────────────────────────────────────────────────────────
('pomiar rezystancji izolacji', 'KNR-ES-POM01', 'Pomiar rezystancji izolacji', 'robocizna', false, 0.08, 'obw', 'pomiary', 0.90),
('pomiar ciągłości przewodów ochronnych', 'KNR-ES-POM02', 'Pomiar ciągłości przewodów ochronnych', 'robocizna', false, 0.05, 'obw', 'pomiary', 0.90),
('pomiar impedancji pętli zwarcia', 'KNR-ES-POM03', 'Pomiar impedancji pętli zwarcia', 'robocizna', false, 0.10, 'obw', 'pomiary', 0.90),
('pomiar działania wyłącznika różnicowoprądowego', 'KNR-ES-POM04', 'Pomiar zadziałania RCD', 'robocizna', false, 0.10, 'szt', 'pomiary', 0.90),
('pomiar rezystancji uziemienia', 'KNR-ES-POM05', 'Pomiar rezystancji uziemienia', 'robocizna', false, 0.25, 'pkt', 'pomiary', 0.90),
('pomiar skuteczności ochrony przed porażeniem', 'KNR-ES-POM06', 'Pomiar skuteczności ochrony (zerowanie)', 'robocizna', false, 0.12, 'obw', 'pomiary', 0.90),
('protokół pomiarowy instalacji elektrycznej', 'KNR-ES-POM07', 'Protokół pomiarowy (kpl)', 'robocizna', false, 2.00, 'kpl', 'pomiary', 0.85),
('pomiar natężenia oświetlenia lux', 'KNR-ES-POM08', 'Pomiar natężenia oświetlenia', 'robocizna', false, 0.20, 'pkt', 'pomiary', 0.85),
('badanie termowizyjne rozdzielnicy', 'KNR-ES-POM09', 'Badanie termowizyjne rozdzielnicy', 'robocizna', false, 1.50, 'szt', 'pomiary', 0.80),
('próba napięciowa kabla 1kv', 'KNR-ES-POM10', 'Próba napięciowa kabla 1kV', 'robocizna', false, 0.40, 'kpl', 'pomiary', 0.85),
('pomiar parametrów sieci jakość energii', 'KNR-ES-POM11', 'Pomiar parametrów sieci (jakość energii)', 'robocizna', false, 2.00, 'kpl', 'pomiary', 0.80),
('odbiór techniczny instalacji elektrycznej', 'KNR-ES-POM12', 'Odbiór techniczny instalacji elektrycznej', 'robocizna', false, 4.00, 'kpl', 'pomiary', 0.85)

ON CONFLICT (keyword_normalized) WHERE user_id IS NULL DO NOTHING;
