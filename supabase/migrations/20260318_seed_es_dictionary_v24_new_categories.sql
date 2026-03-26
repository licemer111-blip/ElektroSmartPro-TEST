-- =====================================================================
-- ES-Dictionary v24 — Nowe kategorie z 12 plików JSON (sesja Mar 2026)
-- Kategorie: instalacje_rurowe, przepusty_uszczelnienia, silniki_napedy,
--            agregaty_ups, wlz_przylacza, stacje_transformatorowe,
--            pompy_ciepla_oze, instalacje_zewnetrzne, dali_knx_bms,
--            klimatyzacja_hvac + uzupełnienie demontaz
-- ~200 nowych wpisów
-- =====================================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ────────────────────────────────────────────────────────────────────
-- INSTALACJE RUROWE (18 wpisów)
-- ────────────────────────────────────────────────────────────────────
('rura karbowana pvc 16mm', 'KNR 5-04 0601-01', 'Rura karbowana PVC ø16mm układanie', 'robocizna', false, 0.025, 'mb', 'instalacje_rurowe', 0.90),
('rura karbowana pvc 20mm', 'KNR 5-04 0601-01', 'Rura karbowana PVC ø20mm układanie', 'robocizna', false, 0.030, 'mb', 'instalacje_rurowe', 0.90),
('rura karbowana pvc 32mm', 'KNR 5-04 0601-02', 'Rura karbowana PVC ø32mm układanie', 'robocizna', false, 0.040, 'mb', 'instalacje_rurowe', 0.90),
('rura karbowana pvc 50mm', 'KNR 5-04 0601-03', 'Rura karbowana PVC ø50mm układanie', 'robocizna', false, 0.060, 'mb', 'instalacje_rurowe', 0.90),
('peszel karbowany 20', 'KNR 5-04 0601-01', 'Peszel karbowany ø20mm', 'robocizna', false, 0.030, 'mb', 'instalacje_rurowe', 0.85),
('peszel elektryczny', 'KNR 5-04 0601-01', 'Peszel elektryczny PVC', 'robocizna', false, 0.030, 'mb', 'instalacje_rurowe', 0.85),
('rura sztywna pvc 20mm', 'KNR 5-04 0601-04', 'Rura sztywna PVC ø20mm układanie', 'robocizna', false, 0.040, 'mb', 'instalacje_rurowe', 0.90),
('rura sztywna pvc 25mm', 'KNR 5-04 0601-04', 'Rura sztywna PVC ø25mm układanie', 'robocizna', false, 0.045, 'mb', 'instalacje_rurowe', 0.90),
('rura sztywna pvc 32mm', 'KNR 5-04 0601-04', 'Rura sztywna PVC ø32mm układanie', 'robocizna', false, 0.050, 'mb', 'instalacje_rurowe', 0.90),
('rura stalowa bst 25mm', 'KNR 5-04 0601-05', 'Rura stalowa BST ø25mm układanie', 'robocizna', false, 0.100, 'mb', 'instalacje_rurowe', 0.90),
('rura stalowa bst 32mm', 'KNR 5-04 0601-05', 'Rura stalowa BST ø32mm układanie', 'robocizna', false, 0.120, 'mb', 'instalacje_rurowe', 0.90),
('rura stalowa gwintowana', 'KNR 5-04 0601-05', 'Rura stalowa gwintowana układanie', 'robocizna', false, 0.120, 'mb', 'instalacje_rurowe', 0.85),
('rura hdpe 40mm', 'KNR-ES-RURA07', 'Rura HDPE ø40mm podposadzkowa', 'robocizna', false, 0.180, 'mb', 'instalacje_rurowe', 0.85),
('rura hdpe 63mm', 'KNR-ES-RURA08', 'Rura HDPE ø63mm podposadzkowa', 'robocizna', false, 0.220, 'mb', 'instalacje_rurowe', 0.85),
('rurka osłonowa', 'KNR 5-04 0601-01', 'Rurka osłonowa PVC', 'robocizna', false, 0.030, 'mb', 'instalacje_rurowe', 0.80),
('puszka elektryczna pt', 'KNR 5-04 0401-01', 'Puszka instalacyjna p/t ø60mm', 'robocizna', false, 0.150, 'szt', 'instalacje_rurowe', 0.85),
('puszka rozgałęźna', 'KNR 5-04 0401-02', 'Puszka rozgałęźna p/t', 'robocizna', false, 0.200, 'szt', 'instalacje_rurowe', 0.85),
('wciąganie kabla w rurę', 'KNR 5-04 0101-01', 'Wciąganie kabla w rurę ochronną', 'robocizna', false, 0.020, 'mb', 'instalacje_rurowe', 0.80),

-- ────────────────────────────────────────────────────────────────────
-- PRZEPUSTY I USZCZELNIENIA OGNIOWE (16 wpisów)
-- ────────────────────────────────────────────────────────────────────
('przepust kablowy ei60', 'KNR 2-02 1001-04', 'Przepust kablowy ognioodporny EI60', 'robocizna', false, 0.500, 'szt', 'przepusty_uszczelnienia', 0.95),
('przepust ogniowy ei60', 'KNR 2-02 1001-04', 'Przepust ogniowy EI60', 'robocizna', false, 0.500, 'szt', 'przepusty_uszczelnienia', 0.95),
('przepust kablowy ei120', 'KNR 2-02 1001-05', 'Przepust kablowy ognioodporny EI120', 'robocizna', false, 0.800, 'szt', 'przepusty_uszczelnienia', 0.95),
('przepust ogniowy ei120', 'KNR 2-02 1001-05', 'Przepust ogniowy EI120', 'robocizna', false, 0.800, 'szt', 'przepusty_uszczelnienia', 0.95),
('obroża pożarowa', 'KNR 2-02 1001-06', 'Obroża pożarowa na rurę', 'robocizna', false, 0.400, 'szt', 'przepusty_uszczelnienia', 0.95),
('obróżka ognioszczelna', 'KNR 2-02 1001-06', 'Obróżka ognioszczelna na rurę PVC', 'robocizna', false, 0.400, 'szt', 'przepusty_uszczelnienia', 0.90),
('uszczelnienie modułowe roxtec', 'KNR 2-02 1001-07', 'Uszczelnienie modułowe Roxtec', 'robocizna', false, 1.200, 'szt', 'przepusty_uszczelnienia', 0.90),
('uszczelnienie przepustu kablowego', 'KNR 2-02 1001-07', 'Uszczelnienie przepustu kablowego', 'robocizna', false, 0.800, 'szt', 'przepusty_uszczelnienia', 0.90),
('masa ogniochronna', 'KNR 2-02 1001-03', 'Masa ogniochronna uszczelnienie przepustu', 'robocizna', false, 0.300, 'szt', 'przepusty_uszczelnienia', 0.85),
('pianka ogniochronna', 'KNR 2-02 1001-03', 'Pianka ogniochronna uszczelnienie', 'robocizna', false, 0.300, 'szt', 'przepusty_uszczelnienia', 0.85),
('dławica kablowa ip68', 'KNR-ES-DLAWICA01', 'Dławica kablowa IP68 montaż', 'robocizna', false, 0.200, 'szt', 'przepusty_uszczelnienia', 0.85),
('dławica kablowa atex', 'KNR-ES-DLAWICA02', 'Dławica kablowa ATEX strefa Ex', 'robocizna', false, 0.500, 'szt', 'przepusty_uszczelnienia', 0.90),
('dławica kablowa emv', 'KNR-ES-DLAWICA03', 'Dławica kablowa EMV (ekranowanie)', 'robocizna', false, 0.300, 'szt', 'przepusty_uszczelnienia', 0.85),
('mufa kablowa', 'KNR 5-04 1311-01', 'Mufa kablowa montaż', 'robocizna', false, 2.500, 'szt', 'przepusty_uszczelnienia', 0.90),
('głowica kablowa nn', 'KNR 5-04 1311-02', 'Głowica kablowa nN montaż', 'robocizna', false, 2.000, 'szt', 'przepusty_uszczelnienia', 0.90),
('uszczelnienie ściany', 'KNR 2-02 1001-03', 'Uszczelnienie przepustu w ścianie', 'robocizna', false, 0.300, 'szt', 'przepusty_uszczelnienia', 0.80),

-- ────────────────────────────────────────────────────────────────────
-- SILNIKI I NAPĘDY PRZEMYSŁOWE (18 wpisów)
-- ────────────────────────────────────────────────────────────────────
('silnik trójfazowy 3kw', 'KNR 5-10 1101-01', 'Silnik elektryczny 3-faz. ≤7,5kW montaż', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.90),
('silnik elektryczny 3 fazowy', 'KNR 5-10 1101-01', 'Silnik elektryczny 3-faz. montaż', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.90),
('silnik 3f 7.5kw', 'KNR 5-10 1101-01', 'Silnik elektryczny 3-faz. 7,5kW', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.90),
('silnik 3f 11kw', 'KNR 5-10 1101-02', 'Silnik elektryczny 3-faz. 11kW', 'robocizna', false, 5.000, 'szt', 'silniki_napedy', 0.90),
('silnik 3f 22kw', 'KNR 5-10 1101-02', 'Silnik elektryczny 3-faz. 22kW', 'robocizna', false, 5.000, 'szt', 'silniki_napedy', 0.90),
('silnik 3f 45kw', 'KNR 5-10 1101-03', 'Silnik elektryczny 3-faz. 45kW', 'robocizna', false, 8.000, 'szt', 'silniki_napedy', 0.90),
('falownik vfd', 'KNR 5-10 1101-01', 'Falownik VFD montaż i uruchomienie', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.90),
('falownik vfd 11kw', 'KNR 5-10 1101-01', 'Falownik VFD ≤11kW montaż', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.90),
('falownik vfd 45kw', 'KNR 5-10 1101-02', 'Falownik VFD 11-45kW montaż', 'robocizna', false, 5.000, 'szt', 'silniki_napedy', 0.90),
('przemiennik częstotliwości', 'KNR 5-10 1101-01', 'Przemiennik częstotliwości VFD', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.90),
('inverter silnikowy', 'KNR 5-10 1101-01', 'Inverter do silnika', 'robocizna', false, 3.000, 'szt', 'silniki_napedy', 0.85),
('softstart 45kw', 'KNR 5-10 1102-01', 'Softstart ≤45kW montaż', 'robocizna', false, 4.000, 'szt', 'silniki_napedy', 0.90),
('układ rozruchowy silnika', 'KNR 5-10 1102-01', 'Układ rozruchowy silnika softstart', 'robocizna', false, 4.000, 'szt', 'silniki_napedy', 0.85),
('enkoder silnika', 'KNR-ES-SILNIK01', 'Enkoder / przetwornik do silnika', 'robocizna', false, 1.000, 'szt', 'silniki_napedy', 0.85),
('hamulec elektromagnetyczny', 'KNR-ES-SILNIK02', 'Hamulec elektromagnetyczny silnika', 'robocizna', false, 2.000, 'szt', 'silniki_napedy', 0.85),
('serwomotor', 'KNR-ES-SILNIK03', 'Serwomotor montaż i konfiguracja', 'robocizna', false, 5.000, 'szt', 'silniki_napedy', 0.85),
('sterownik serwonapędu', 'KNR-ES-SILNIK04', 'Sterownik serwonapędu montaż', 'robocizna', false, 4.000, 'szt', 'silniki_napedy', 0.85),
('uruchomienie silnika', 'KNR-ES-SILNIK05', 'Uruchomienie i próba silnika', 'robocizna', false, 2.000, 'kpl', 'silniki_napedy', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- AGREGATY, UPS, SZR (16 wpisów)
-- ────────────────────────────────────────────────────────────────────
('agregat prądotwórczy 15kva', 'KNR 5-08 0404-01', 'Agregat prądotwórczy ≤50kVA montaż', 'robocizna', false, 8.000, 'szt', 'agregaty_ups', 0.95),
('agregat prądotwórczy 50kva', 'KNR 5-08 0404-01', 'Agregat prądotwórczy ≤50kVA', 'robocizna', false, 8.000, 'szt', 'agregaty_ups', 0.95),
('agregat prądotwórczy 100kva', 'KNR-ES-AGR01', 'Agregat prądotwórczy 100kVA montaż', 'robocizna', false, 12.000, 'szt', 'agregaty_ups', 0.95),
('agregat 200kva', 'KNR-ES-AGR02', 'Agregat prądotwórczy 200kVA montaż', 'robocizna', false, 16.000, 'szt', 'agregaty_ups', 0.90),
('generator prądu', 'KNR 5-08 0404-01', 'Generator prądu montaż', 'robocizna', false, 8.000, 'szt', 'agregaty_ups', 0.90),
('prądnica', 'KNR 5-08 0404-01', 'Prądnica montaż i uruchomienie', 'robocizna', false, 8.000, 'szt', 'agregaty_ups', 0.85),
('szafa szr', 'KNR 5-08 0403-03', 'Szafa SZR (samoczynne załączenie rezerwy)', 'robocizna', false, 6.000, 'szt', 'agregaty_ups', 0.95),
('szafa ats', 'KNR 5-08 0403-03', 'Szafa ATS automatyczne przełączenie', 'robocizna', false, 6.000, 'szt', 'agregaty_ups', 0.95),
('samoczynne załączenie rezerwy', 'KNR 5-08 0403-03', 'SZR samoczynne załączenie rezerwy', 'robocizna', false, 6.000, 'szt', 'agregaty_ups', 0.95),
('ups 3kva', 'KNR 5-08 0401-07', 'UPS rack ≤3kVA montaż', 'robocizna', false, 2.000, 'szt', 'agregaty_ups', 0.95),
('ups 10kva', 'KNR 5-08 0401-08', 'UPS rack >3kVA montaż', 'robocizna', false, 3.000, 'szt', 'agregaty_ups', 0.95),
('ups 3 fazowy', 'KNR-ES-UPS01', 'UPS 3-fazowy on-line montaż', 'robocizna', false, 6.000, 'szt', 'agregaty_ups', 0.90),
('zasilacz ups', 'KNR 5-08 0401-07', 'Zasilacz UPS montaż', 'robocizna', false, 2.000, 'szt', 'agregaty_ups', 0.90),
('baterie do ups', 'KNR-ES-UPS02', 'Wymiana baterii UPS', 'robocizna', false, 2.000, 'kpl', 'agregaty_ups', 0.85),
('moduł bateryjny ups', 'KNR-ES-UPS02', 'Moduł bateryjny UPS', 'robocizna', false, 3.000, 'szt', 'agregaty_ups', 0.85),
('uruchomienie agregatu', 'KNR-ES-AGR03', 'Uruchomienie i próby agregatu', 'robocizna', false, 4.000, 'kpl', 'agregaty_ups', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- WLZ / PRZYŁĄCZA (14 wpisów)
-- ────────────────────────────────────────────────────────────────────
('wlz kabel yky 35mm2', 'KNR 5-04 1301-01', 'WLZ kabel YKY ≤35mm² ułożenie', 'robocizna', false, 0.060, 'mb', 'wlz_przylacza', 0.90),
('wlz kabel yky 70mm2', 'KNR 5-04 1301-02', 'WLZ kabel YKY 50-95mm² ułożenie', 'robocizna', false, 0.100, 'mb', 'wlz_przylacza', 0.90),
('wlz kabel yaky 120mm2', 'KNR 5-04 1301-03', 'WLZ kabel YAKY 95-150mm² ułożenie', 'robocizna', false, 0.140, 'mb', 'wlz_przylacza', 0.90),
('wlz kabel yaky 240mm2', 'KNR 5-04 1301-04', 'WLZ kabel YAKY 185-240mm² ułożenie', 'robocizna', false, 0.200, 'mb', 'wlz_przylacza', 0.90),
('wewnętrzna linia zasilająca', 'KNR 5-04 1301-01', 'Wewnętrzna linia zasilająca WLZ', 'robocizna', false, 0.060, 'mb', 'wlz_przylacza', 0.90),
('linia zasilająca główna', 'KNR 5-04 1301-01', 'Linia zasilająca główna WLZ', 'robocizna', false, 0.060, 'mb', 'wlz_przylacza', 0.90),
('przyłącze kablowe nn', 'KNR 5-04 1301-05', 'Przyłącze kablowe nN wykonanie', 'robocizna', false, 6.000, 'szt', 'wlz_przylacza', 0.90),
('złącze kablowe nn', 'KNR 5-04 1311-01', 'Złącze kablowe nN montaż', 'robocizna', false, 2.500, 'szt', 'wlz_przylacza', 0.90),
('mufa przelotowa', 'KNR 5-04 1311-01', 'Mufa przelotowa kabla nN', 'robocizna', false, 2.500, 'szt', 'wlz_przylacza', 0.90),
('głowica kablowa zewnętrzna', 'KNR 5-04 1311-02', 'Głowica kablowa zewnętrzna nN', 'robocizna', false, 2.000, 'szt', 'wlz_przylacza', 0.90),
('licznik energii główny', 'KNR 5-08 0501-02', 'Licznik energii główny 3-faz. montaż', 'robocizna', false, 1.200, 'szt', 'wlz_przylacza', 0.90),
('skrzynka przyłączowa zkp', 'KNR-ES-WLZ04', 'Skrzynka ZKP / ZPP montaż', 'robocizna', false, 2.000, 'szt', 'wlz_przylacza', 0.90),
('rozdzielnica główna rgnn', 'KNR 5-08 0101-05', 'Rozdzielnica główna RGnN montaż', 'robocizna', false, 14.000, 'szt', 'wlz_przylacza', 0.85),
('zarobienie kabla nn', 'KNR 5-04 1301-05', 'Zarobienie kabla nN (głowicowanie)', 'robocizna', false, 1.500, 'szt', 'wlz_przylacza', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- STACJE TRANSFORMATOROWE (14 wpisów)
-- ────────────────────────────────────────────────────────────────────
('transformator suchy 100kva', 'KNR-ES-TRAFO01', 'Transformator suchy 100kVA montaż', 'robocizna', false, 10.000, 'szt', 'stacje_transformatorowe', 0.95),
('transformator suchy 400kva', 'KNR-ES-TRAFO02', 'Transformator suchy 400kVA montaż', 'robocizna', false, 14.000, 'szt', 'stacje_transformatorowe', 0.95),
('transformator suchy 630kva', 'KNR-ES-TRAFO03', 'Transformator suchy 630kVA montaż', 'robocizna', false, 16.000, 'szt', 'stacje_transformatorowe', 0.95),
('transformator olejowy', 'KNR-ES-TRAFO04', 'Transformator olejowy montaż', 'robocizna', false, 20.000, 'szt', 'stacje_transformatorowe', 0.90),
('transformator 1000kva', 'KNR-ES-TRAFO05', 'Transformator SN/nN 1000kVA', 'robocizna', false, 24.000, 'szt', 'stacje_transformatorowe', 0.90),
('stacja transformatorowa sn', 'KNR-ES-TRAFO06', 'Stacja transformatorowa SN/nN', 'robocizna', false, 40.000, 'kpl', 'stacje_transformatorowe', 0.90),
('rozdzielnica sn', 'KNR-ES-TRAFO07', 'Rozdzielnica SN (komora) montaż', 'robocizna', false, 12.000, 'szt', 'stacje_transformatorowe', 0.95),
('komora sn', 'KNR-ES-TRAFO07', 'Komora SN rozdzielnicy', 'robocizna', false, 12.000, 'szt', 'stacje_transformatorowe', 0.90),
('głowica kablowa sn', 'KNR-ES-TRAFO08', 'Głowica kablowa SN montaż', 'robocizna', false, 4.000, 'szt', 'stacje_transformatorowe', 0.95),
('mufa kablowa sn', 'KNR-ES-TRAFO09', 'Mufa kablowa SN montaż', 'robocizna', false, 5.000, 'szt', 'stacje_transformatorowe', 0.95),
('zabezpieczenie nadprądowe sn', 'KNR-ES-TRAFO10', 'Zabezpieczenie nadprądowe SN montaż', 'robocizna', false, 4.000, 'szt', 'stacje_transformatorowe', 0.90),
('przekładnik prądowy sn', 'KNR-ES-TRAFO11', 'Przekładnik prądowy SN montaż', 'robocizna', false, 2.000, 'szt', 'stacje_transformatorowe', 0.90),
('uziemienie stacji trafo', 'KNR-ES-TRAFO12', 'Uziemienie stacji transformatorowej', 'robocizna', false, 8.000, 'kpl', 'stacje_transformatorowe', 0.90),
('uruchomienie stacji trafo', 'KNR-ES-TRAFO13', 'Uruchomienie i próby stacji trafo', 'robocizna', false, 8.000, 'kpl', 'stacje_transformatorowe', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- POMPY CIEPŁA / OZE (14 wpisów)
-- ────────────────────────────────────────────────────────────────────
('pompa ciepła split 8kw', 'KNR AT-26 0503-03', 'Podłączenie pompy ciepła ≤12kW 3-faz.', 'robocizna', false, 6.000, 'szt', 'pompy_ciepla_oze', 0.95),
('pompa ciepła monoblok', 'KNR AT-26 0503-03', 'Podłączenie pompy ciepła monoblok', 'robocizna', false, 6.000, 'szt', 'pompy_ciepla_oze', 0.95),
('pompa ciepła grunt', 'KNR AT-26 0503-03', 'Podłączenie pompy ciepła grunt-woda', 'robocizna', false, 8.000, 'szt', 'pompy_ciepla_oze', 0.90),
('pompa ciepła cwd', 'KNR AT-26 0503-03', 'Pompa ciepła CWU podłączenie', 'robocizna', false, 4.000, 'szt', 'pompy_ciepla_oze', 0.90),
('inwerter pv 5kw', 'KNR 5-11 0102-01', 'Falownik PV ≤5kW 1-faz. montaż', 'robocizna', false, 3.000, 'szt', 'pompy_ciepla_oze', 0.95),
('falownik pv 10kw', 'KNR 5-11 0102-02', 'Falownik PV ≤10kW 3-faz. montaż', 'robocizna', false, 4.000, 'szt', 'pompy_ciepla_oze', 0.95),
('inwerter fotowoltaiczny', 'KNR 5-11 0102-01', 'Inwerter fotowoltaiczny montaż', 'robocizna', false, 3.000, 'szt', 'pompy_ciepla_oze', 0.90),
('magazyn energii bateria 10kwh', 'KNR 5-11 0109-01', 'Magazyn energii bateria domowa montaż', 'robocizna', false, 6.000, 'szt', 'pompy_ciepla_oze', 0.90),
('akumulator dom bateria energii', 'KNR 5-11 0109-01', 'Bateria domowa magazyn energii', 'robocizna', false, 6.000, 'szt', 'pompy_ciepla_oze', 0.85),
('licznik dwukierunkowy pv', 'KNR 5-11 0110-01', 'Licznik dwukierunkowy prosument', 'robocizna', false, 1.500, 'szt', 'pompy_ciepla_oze', 0.90),
('rozdzielnica pv ac dc', 'KNR 5-11 0118-01', 'Rozdzielnica PV AC/DC montaż', 'robocizna', false, 4.000, 'szt', 'pompy_ciepla_oze', 0.90),
('kabel solarny dc 4mm2', 'KNR 5-11 0104-01', 'Kabel solarny DC 4mm² ułożenie', 'robocizna', false, 0.025, 'mb', 'pompy_ciepla_oze', 0.90),
('kabel solarny dc 6mm2', 'KNR 5-11 0104-01', 'Kabel solarny DC 6mm² ułożenie', 'robocizna', false, 0.030, 'mb', 'pompy_ciepla_oze', 0.90),
('uruchomienie pompy ciepła', 'KNR-ES-PC01', 'Uruchomienie i próby pompy ciepła', 'robocizna', false, 4.000, 'kpl', 'pompy_ciepla_oze', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- INSTALACJE ZEWNĘTRZNE (14 wpisów)
-- ────────────────────────────────────────────────────────────────────
('słup oświetleniowy stalowy', 'KNR-ES-ZEW01', 'Słup oświetleniowy stalowy do 8m', 'robocizna', false, 4.000, 'szt', 'instalacje_zewnetrzne', 0.90),
('słup oświetleniowy betonowy', 'KNR-ES-ZEW02', 'Słup oświetleniowy betonowy', 'robocizna', false, 5.000, 'szt', 'instalacje_zewnetrzne', 0.90),
('oprawa uliczna led', 'KNR 5-04 0301-06', 'Oprawa uliczna LED montaż na słupie', 'robocizna', false, 1.500, 'szt', 'instalacje_zewnetrzne', 0.90),
('kabel asxsn zewnętrzny', 'KNR-ES-ZEW03', 'Kabel AsXSn napowietrzny montaż', 'robocizna', false, 0.080, 'mb', 'instalacje_zewnetrzne', 0.90),
('naświetlacz led zewnętrzny', 'KNR 5-04 0301-07', 'Naświetlacz LED zewnętrzny ≤100W', 'robocizna', false, 0.800, 'szt', 'instalacje_zewnetrzne', 0.90),
('szafka sterowania oświetleniem', 'KNR-ES-ZEW04', 'Szafka sterowania oświetleniem zewn.', 'robocizna', false, 6.000, 'szt', 'instalacje_zewnetrzne', 0.90),
('kabel nn ziemny yky', 'KNR 5-04 1301-01', 'Kabel nN ziemny YKY układanie w ziemi', 'robocizna', false, 0.060, 'mb', 'instalacje_zewnetrzne', 0.90),
('kabel yaky ziemny alu', 'KNR 5-04 1301-02', 'Kabel YAKY aluminium w ziemi', 'robocizna', false, 0.100, 'mb', 'instalacje_zewnetrzne', 0.90),
('rozdzielnia budowlana', 'KNR 5-04 2001-01', 'Rozdzielnia budowlana montaż', 'robocizna', false, 4.000, 'szt', 'instalacje_zewnetrzne', 0.90),
('brama sterowana elektrycznie', 'KNR-ES-ZEW05', 'Napęd bramy elektryczny montaż', 'robocizna', false, 4.000, 'szt', 'instalacje_zewnetrzne', 0.85),
('czujnik zmierzchu zewnętrzny', 'KNR-ES-ZEW06', 'Czujnik zmierzchu zewnętrzny', 'robocizna', false, 0.500, 'szt', 'instalacje_zewnetrzne', 0.85),
('zegar astronomiczny zewnętrzny', 'KNR-ES-ZEW07', 'Zegar astronomiczny oświetlenia', 'robocizna', false, 1.000, 'szt', 'instalacje_zewnetrzne', 0.85),
('fundament pod słup', 'KNR-ES-ZEW08', 'Fundament prefabrykowany pod słup', 'robocizna', false, 2.000, 'szt', 'instalacje_zewnetrzne', 0.85),
('kabel napowietrzny montaz', 'KNR-ES-ZEW09', 'Kabel napowietrzny na uchwytach', 'robocizna', false, 0.080, 'mb', 'instalacje_zewnetrzne', 0.85),

-- ────────────────────────────────────────────────────────────────────
-- DALI / KNX / BMS (16 wpisów)
-- ────────────────────────────────────────────────────────────────────
('sterownik dali 2 kanałowy', 'KNR 5-09 0502-09', 'Driver DALI 2-kanałowy montaż', 'robocizna', false, 1.000, 'szt', 'dali_knx_bms', 0.90),
('zasilacz dali', 'KNR 5-09 0502-09', 'Zasilacz magistrali DALI montaż', 'robocizna', false, 0.800, 'szt', 'dali_knx_bms', 0.90),
('moduł dali', 'KNR 5-09 0502-09', 'Moduł DALI sterownik', 'robocizna', false, 1.000, 'szt', 'dali_knx_bms', 0.85),
('adresowanie dali', 'KNR-ES-DALI01', 'Adresowanie opraw DALI (per oprawa)', 'robocizna', false, 0.200, 'szt', 'dali_knx_bms', 0.90),
('programowanie systemu dali', 'KNR-ES-DALI02', 'Programowanie systemu DALI (per scena)', 'robocizna', false, 0.500, 'szt', 'dali_knx_bms', 0.90),
('sterownik knx 4 kanałowy', 'KNR 5-09 0502-06', 'Sterownik KNX actor 4-kanałowy', 'robocizna', false, 2.000, 'szt', 'dali_knx_bms', 0.90),
('zasilacz knx 30v', 'KNR 5-09 0502-07', 'Zasilacz magistrali KNX 30V', 'robocizna', false, 1.500, 'szt', 'dali_knx_bms', 0.90),
('kabel magistrali knx', 'KNR 5-09 0502-08', 'Kabel magistrali KNX J-Y(St)Y', 'robocizna', false, 0.030, 'mb', 'dali_knx_bms', 0.90),
('programowanie systemu knx', 'KNR-ES-KNX01', 'Programowanie systemu KNX ETS (per urządzenie)', 'robocizna', false, 0.500, 'szt', 'dali_knx_bms', 0.90),
('panel knx', 'KNR 5-09 0502-06', 'Panel / przycisk KNX 4-klaw.', 'robocizna', false, 0.800, 'szt', 'dali_knx_bms', 0.90),
('sterownik bms', 'KNR-ES-BMS01', 'Sterownik BMS / DDC montaż', 'robocizna', false, 8.000, 'szt', 'dali_knx_bms', 0.85),
('bramka bms', 'KNR-ES-BMS02', 'Bramka / gateway BMS montaż', 'robocizna', false, 4.000, 'szt', 'dali_knx_bms', 0.85),
('czujnik temperatury bms', 'KNR-ES-BMS03', 'Czujnik temperatury BMS montaż', 'robocizna', false, 0.500, 'szt', 'dali_knx_bms', 0.85),
('moduł modbus', 'KNR-ES-BMS04', 'Moduł Modbus RTU/TCP montaż', 'robocizna', false, 1.500, 'szt', 'dali_knx_bms', 0.85),
('panel hmi operatorski', 'KNR-ES-BMS05', 'Panel HMI operatorski montaż', 'robocizna', false, 3.000, 'szt', 'dali_knx_bms', 0.85),
('uruchomienie bms', 'KNR-ES-BMS06', 'Uruchomienie systemu BMS/KNX', 'robocizna', false, 8.000, 'kpl', 'dali_knx_bms', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- KLIMATYZACJA / WENTYLACJA (14 wpisów)
-- ────────────────────────────────────────────────────────────────────
('klimatyzacja split 3.5kw', 'KNR AT-26 0503-01', 'Podłączenie klimatyzatora split ≤5kW', 'robocizna', false, 1.500, 'szt', 'klimatyzacja_hvac', 0.95),
('klimatyzator split', 'KNR AT-26 0503-01', 'Klimatyzator split podłączenie elektryczne', 'robocizna', false, 1.500, 'szt', 'klimatyzacja_hvac', 0.95),
('klimatyzacja multi split', 'KNR AT-26 0503-02', 'Klimatyzacja multi-split podłączenie', 'robocizna', false, 3.000, 'szt', 'klimatyzacja_hvac', 0.90),
('klimatyzacja 7kw 3 faz', 'KNR AT-26 0503-02', 'Klimatyzacja >5kW 3-faz. podłączenie', 'robocizna', false, 3.000, 'szt', 'klimatyzacja_hvac', 0.90),
('klimatyzacja kasetonowa', 'KNR AT-26 0503-02', 'Klimatyzacja kasetonowa podłączenie el.', 'robocizna', false, 3.000, 'szt', 'klimatyzacja_hvac', 0.90),
('wentylator kanałowy', 'KNR-ES-HVAC01', 'Wentylator kanałowy podłączenie', 'robocizna', false, 1.500, 'szt', 'klimatyzacja_hvac', 0.90),
('centrala wentylacyjna', 'KNR-ES-HVAC02', 'Centrala wentylacyjna HRV podłączenie', 'robocizna', false, 4.000, 'szt', 'klimatyzacja_hvac', 0.90),
('rekuperator', 'KNR-ES-HVAC02', 'Rekuperator podłączenie elektryczne', 'robocizna', false, 4.000, 'szt', 'klimatyzacja_hvac', 0.90),
('sterownik klimatyzacji', 'KNR AT-26 0301-01', 'Sterownik / termostat klimatyzacji', 'robocizna', false, 0.800, 'szt', 'klimatyzacja_hvac', 0.90),
('pompa cyrkulacyjna', 'KNR AT-26 0503-01', 'Pompa cyrkulacyjna podłączenie', 'robocizna', false, 1.500, 'szt', 'klimatyzacja_hvac', 0.85),
('nagrzewnica elektryczna', 'KNR AT-26 0503-01', 'Nagrzewnica elektryczna podłączenie', 'robocizna', false, 2.000, 'szt', 'klimatyzacja_hvac', 0.85),
('kabel zasilający klimatyzację', 'KNR AT-26 0201-03', 'Kabel zasilający klimatyzację 5×2,5mm²', 'robocizna', false, 0.040, 'mb', 'klimatyzacja_hvac', 0.85),
('chiller wodny', 'KNR-ES-HVAC03', 'Chiller wodny podłączenie elektryczne', 'robocizna', false, 6.000, 'szt', 'klimatyzacja_hvac', 0.85),
('uruchomienie klimatyzacji', 'KNR-ES-HVAC04', 'Uruchomienie i próby klimatyzacji', 'robocizna', false, 2.000, 'kpl', 'klimatyzacja_hvac', 0.90),

-- ────────────────────────────────────────────────────────────────────
-- DEMONTAŻ — uzupełnienie (12 wpisów)
-- ────────────────────────────────────────────────────────────────────
('demontaż instalacji elektrycznej', 'KNR 4-03 0103-01', 'Demontaż instalacji el. (kable+osprzęt)', 'robocizna', false, 0.050, 'mb', 'demontaz', 0.90),
('demontaż rozdzielnicy 48', 'KNR 4-03 0102-02', 'Demontaż rozdzielnicy ≤48 mod.', 'robocizna', false, 4.000, 'szt', 'demontaz', 0.90),
('demontaż oprawy hermetycznej', 'KNR 4-03 0101-01', 'Demontaż oprawy LED hermetycznej', 'robocizna', false, 0.350, 'szt', 'demontaz', 0.90),
('demontaż drabinki kablowej', 'KNR 4-03 0103-04', 'Demontaż drabinki kablowej', 'robocizna', false, 0.080, 'mb', 'demontaz', 0.90),
('demontaż koryta kablowego', 'KNR 4-03 0103-03', 'Demontaż koryta kablowego', 'robocizna', false, 0.060, 'mb', 'demontaz', 0.90),
('demontaż systemu alarmowego', 'KNR 4-03 0104-03', 'Demontaż systemu alarmowego', 'robocizna', false, 4.000, 'kpl', 'demontaz', 0.85),
('demontaż gniazda przemysłowego', 'KNR 4-03 0101-02', 'Demontaż gniazda przemysłowego CEE', 'robocizna', false, 0.300, 'szt', 'demontaz', 0.85),
('demontaż falownika', 'KNR 4-03 0101-02', 'Demontaż falownika VFD', 'robocizna', false, 2.000, 'szt', 'demontaz', 0.85),
('demontaż agregatu', 'KNR-ES-DEM01', 'Demontaż agregatu prądotwórczego', 'robocizna', false, 6.000, 'szt', 'demontaz', 0.85),
('demontaż instalacji odgromowej', 'KNR-ES-DEM02', 'Demontaż instalacji odgromowej', 'robocizna', false, 0.100, 'mb', 'demontaz', 0.85),
('lokalizacja uszkodzenia kabla', 'KNR 4-03 0201-01', 'Lokalizacja uszkodzenia kabla', 'robocizna', false, 2.000, 'szt', 'demontaz', 0.90),
('naprawa uszkodzenia kabla', 'KNR 4-03 0201-02', 'Naprawa uszkodzonego kabla nN', 'robocizna', false, 1.500, 'szt', 'demontaz', 0.90)

ON CONFLICT (keyword_normalized) WHERE user_id IS NULL DO NOTHING;
