-- ES-Dictionary v20: roboty_ziemne, oswietlenie_drogowe, kable_nh/ph90, agregaty_ups, odgromowka, trafostacje
-- ~60 wpisów | kolumny: keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ============================================================
-- ROBOTY ZIEMNE KABLOWE
-- ============================================================
('wykop rowu kablowego',             'ES-RZ-001', 'Wykop rowu kablowego ręczny kat.I-II (0.4×0.7m)',      'robocizna', false, NULL, 0.40, 'm',   'roboty_ziemne', 2.0),
('kopanie rowu elektrycznego',       'ES-RZ-001', 'Wykop rowu kablowego — kopanie',                        'robocizna', false, NULL, 0.40, 'm',   'roboty_ziemne', 1.8),
('row kablowy',                      'ES-RZ-001', 'Rów kablowy — roboty ziemne',                           'robocizna', false, NULL, 0.40, 'm',   'roboty_ziemne', 1.6),
('wykop pod kabel',                  'ES-RZ-001', 'Wykop pod kabel — ręczny',                              'robocizna', false, NULL, 0.40, 'm',   'roboty_ziemne', 1.8),
('wykop mechaniczny kabel',          'ES-RZ-002', 'Wykop rowu kablowego koparką (kat.I-III)',               'robocizna', false, NULL, 0.12, 'm',   'roboty_ziemne', 2.0),
('koparka row kablowy',              'ES-RZ-002', 'Mechaniczny wykop rowu kablowego',                      'robocizna', false, NULL, 0.12, 'm',   'roboty_ziemne', 1.8),
('wykop pod jezdnia',                'ES-RZ-003', 'Wykop pod jezdnią — frezowanie asfaltu (0.3m)',         'robocizna', false, NULL, 0.35, 'm',   'roboty_ziemne', 2.0),
('frezowanie asfaltu kabel',         'ES-RZ-003', 'Frezowanie asfaltu + wykop pod kabel',                  'robocizna', false, NULL, 0.35, 'm',   'roboty_ziemne', 1.8),
('zasypka rowu kablowego',           'ES-RZ-004', 'Zasypanie rowu kablowego piaskiem + zagęszczenie',      'robocizna', false, NULL, 0.20, 'm',   'roboty_ziemne', 2.0),
('zasypanie piaskiem kabel',         'ES-RZ-004', 'Zasypka piaskiem — podsypka kablowa',                   'robocizna', false, NULL, 0.20, 'm',   'roboty_ziemne', 1.8),
('folia ostrzegawcza kabel',         'ES-RZ-005', 'Ułożenie folii ostrzegawczej (niebieska/czerwona)',     'robocizna', false, NULL, 0.05, 'm',   'roboty_ziemne', 2.0),
('tasma ostrzegawcza kabel',         'ES-RZ-005', 'Taśma ostrzegawcza w rowie kablowym',                   'robocizna', false, NULL, 0.05, 'm',   'roboty_ziemne', 1.8),
('plyta ochronna kabel',             'ES-RZ-006', 'Ułożenie płyty ochronnej betonowej nad kablem',         'robocizna', false, NULL, 0.15, 'm',   'roboty_ziemne', 2.0),
('odtworzenie nawierzchni asfalt',   'ES-RZ-007', 'Odtworzenie nawierzchni asfaltowej po wykoie',          'robocizna', false, NULL, 0.50, 'm',   'roboty_ziemne', 2.0),
('naprawa asfaltu po kablu',         'ES-RZ-007', 'Remont asfaltu po wykoie kablowym',                     'robocizna', false, NULL, 0.50, 'm',   'roboty_ziemne', 1.8),
('odtworzenie chodnika kostka',      'ES-RZ-008', 'Odtworzenie chodnika (kostka brukowa) po wykoie',       'robocizna', false, NULL, 0.80, 'm2',  'roboty_ziemne', 2.0),
('ukladanie kabla w ziemi',          'ES-RZ-009', 'Ułożenie kabla w rowie — kabel do 1kV',                 'robocizna', false, NULL, 0.10, 'm',   'roboty_ziemne', 2.0),
('kabel podziemny',                  'ES-RZ-009', 'Kabel podziemny — ułożenie w rowie',                    'robocizna', false, NULL, 0.10, 'm',   'roboty_ziemne', 1.8),
('kabel w ziemi',                    'ES-RZ-009', 'Kabel bezpośrednio w ziemi',                            'robocizna', false, NULL, 0.10, 'm',   'roboty_ziemne', 1.6),
('kanalizacja kablowa hdpe',         'ES-RZ-010', 'Kanalizacja kablowa rury HDPE Ø110mm',                  'robocizna', false, NULL, 0.18, 'm',   'roboty_ziemne', 2.0),
('rura hdpe kabel',                  'ES-RZ-010', 'Rura HDPE kanalizacja kablowa',                         'robocizna', false, NULL, 0.18, 'm',   'roboty_ziemne', 1.8),
('przekop bezwykopowy',              'ES-RZ-011', 'Przekop bezwykopowy (przecisk pneumatyczny) Ø50-150mm', 'robocizna', false, NULL, 0.80, 'm',   'roboty_ziemne', 2.0),
('przecisk pneumatyczny',            'ES-RZ-011', 'Przecisk pneumatyczny pod drogą',                       'robocizna', false, NULL, 0.80, 'm',   'roboty_ziemne', 1.8),
('hdd kabel',                        'ES-RZ-011', 'HDD — przewiert poziomy kabel',                         'robocizna', false, NULL, 0.80, 'm',   'roboty_ziemne', 1.6),
('mufa kablowa',                     'ES-RZ-012', 'Mufa kablowa złączna 0.4kV YKY/YAKY',                   'robocizna', false, NULL, 3.00, 'szt', 'roboty_ziemne', 2.0),
('zlacze kablowe podziemne',         'ES-RZ-012', 'Złącze kablowe podziemne — mufa',                       'robocizna', false, NULL, 3.00, 'szt', 'roboty_ziemne', 1.8),
('mufa kablowa sn',                  'ES-RZ-013', 'Mufa kablowa złączna SN 6-15kV (żywiczna)',             'robocizna', false, NULL, 6.00, 'szt', 'roboty_ziemne', 2.0),
('studzienka kablowa',               'ES-RZ-014', 'Montaż studzienki kablowej SK-1 betonowej',             'robocizna', false, NULL, 5.00, 'szt', 'roboty_ziemne', 2.0),
('studnia kablowa',                  'ES-RZ-014', 'Studnia kablowa montaż (SK-1, SK-2)',                   'robocizna', false, NULL, 5.00, 'szt', 'roboty_ziemne', 1.8),

-- ============================================================
-- OŚWIETLENIE DROGOWE / ZEWNĘTRZNE
-- ============================================================
('montaz slupa oswietleniowego',     'ES-OD-001', 'Montaż słupa oświetleniowego stalowego H=4m',          'robocizna', false, NULL, 5.00, 'szt', 'oswietlenie_drogowe', 2.0),
('slup oswietleniowy 4m',            'ES-OD-001', 'Słup oświetleniowy H=4m — betonowanie fundamentu',     'robocizna', false, NULL, 5.00, 'szt', 'oswietlenie_drogowe', 1.8),
('slup oswietleniowy 6m',            'ES-OD-002', 'Słup oświetleniowy stalowy H=6m',                      'robocizna', false, NULL, 6.00, 'szt', 'oswietlenie_drogowe', 2.0),
('latarnia 6m montaz',               'ES-OD-002', 'Latarnia uliczna H=6m — montaż',                       'robocizna', false, NULL, 6.00, 'szt', 'oswietlenie_drogowe', 1.8),
('slup oswietleniowy 8m',            'ES-OD-003', 'Słup oświetleniowy stalowy H=8-10m',                   'robocizna', false, NULL, 8.00, 'szt', 'oswietlenie_drogowe', 2.0),
('oprawa uliczna led',               'ES-OD-004', 'Montaż oprawy ulicznej LED 60-150W na wysięgniku',     'robocizna', false, NULL, 1.50, 'szt', 'oswietlenie_drogowe', 2.0),
('latarnia led',                     'ES-OD-004', 'Latarnia LED — montaż na słupie',                      'robocizna', false, NULL, 1.50, 'szt', 'oswietlenie_drogowe', 1.8),
('oprawa drogowa led',               'ES-OD-004', 'Oprawa drogowa LED — montaż',                          'robocizna', false, NULL, 1.50, 'szt', 'oswietlenie_drogowe', 1.6),
('szafa sterowania oswietleniem',    'ES-OD-005', 'Szafa SO — sterowanie oświetleniem zewnętrznym',       'robocizna', false, NULL, 4.00, 'szt', 'oswietlenie_drogowe', 2.0),
('reflektor led zewnetrzny',         'ES-OD-006', 'Montaż reflektora/naświetlacza LED zewnętrznego',      'robocizna', false, NULL, 0.70, 'szt', 'oswietlenie_drogowe', 2.0),
('naswietlacz led',                  'ES-OD-006', 'Naświetlacz LED — floodlight zewnętrzny',              'robocizna', false, NULL, 0.70, 'szt', 'oswietlenie_drogowe', 1.8),

-- ============================================================
-- KABLE SPECJALNE NH / PH90
-- ============================================================
('kabel nhxmh',                      'ES-KNH-001', 'Ułożenie kabla bezhalogenowego NHXMH p/t lub w korycie', 'robocizna', false, NULL, 0.09, 'm', 'kablowanie', 2.0),
('kabel bezhalogenowy',              'ES-KNH-001', 'Kabel bezhalogenowy NHXMH — układanie',               'robocizna', false, NULL, 0.09, 'm', 'kablowanie', 1.8),
('nhxmh 3x1.5',                      'ES-KNH-001', 'Kabel NHXMH 3x1.5mm² — ułożenie',                    'robocizna', false, NULL, 0.09, 'm', 'kablowanie', 2.0),
('nhxmh 3x2.5',                      'ES-KNH-002', 'Kabel NHXMH 3x2.5mm² — ułożenie',                    'robocizna', false, NULL, 0.10, 'm', 'kablowanie', 2.0),
('nhxmh 5x2.5',                      'ES-KNH-003', 'Kabel NHXMH 5x2.5mm² — ułożenie',                    'robocizna', false, NULL, 0.11, 'm', 'kablowanie', 2.0),
('kabel n2xh lszh',                  'ES-KNH-004', 'Ułożenie kabla N2XH LSZH (zewnętrzny bezhalogenowy)', 'robocizna', false, NULL, 0.10, 'm', 'kablowanie', 2.0),
('lszh kabel',                       'ES-KNH-004', 'Kabel LSZH — bezhalogenowy zewnętrzny',               'robocizna', false, NULL, 0.10, 'm', 'kablowanie', 1.8),
('kabel hdgs ph90',                  'ES-KPH-001', 'Ułożenie kabla ognioodpornego HDGs PH90 (p.poż)',     'robocizna', false, NULL, 0.12, 'm', 'ppoz',       2.0),
('kabel pozarowy ph90',              'ES-KPH-001', 'Kabel pożarowy PH90 — układanie',                     'robocizna', false, NULL, 0.12, 'm', 'ppoz',       1.8),
('kabel e90',                        'ES-KPH-001', 'Kabel E90 ognioodporny — montaż',                     'robocizna', false, NULL, 0.12, 'm', 'ppoz',       1.8),
('kabel hdgs 3x1.5',                 'ES-KPH-002', 'Kabel HDGs PH90 3x1.5mm² — ułożenie',                'robocizna', false, NULL, 0.12, 'm', 'ppoz',       2.0),
('kabel hdgs 3x2.5',                 'ES-KPH-003', 'Kabel HDGs PH90 3x2.5mm² — ułożenie',                'robocizna', false, NULL, 0.13, 'm', 'ppoz',       2.0),
('kabel htksh petla ssp',            'ES-KPH-004', 'Ułożenie kabla HTKSH 2x2x0.8 (pętla SSP)',            'robocizna', false, NULL, 0.14, 'm', 'ppoz',       2.0),
('htksh ekranowany',                 'ES-KPH-004', 'Kabel HTKSH ekranowany — linia adresowalna SAP',      'robocizna', false, NULL, 0.14, 'm', 'ppoz',       1.8),
('kabel pancerny xswy',              'ES-KNH-005', 'Ułożenie kabla pancernego XSWY/YXKSYw',               'robocizna', false, NULL, 0.15, 'm', 'kablowanie', 2.0),
('kabel zbrojony',                   'ES-KNH-005', 'Kabel zbrojony — układanie (SWA)',                    'robocizna', false, NULL, 0.15, 'm', 'kablowanie', 1.8),

-- ============================================================
-- AGREGATY / UPS / SZR
-- ============================================================
('agregat pradotworczy',             'ES-AGR-001', 'Montaż i uruchomienie agregatu prądotwórczego',       'robocizna', false, NULL, 8.00, 'szt', 'zasilanie_awaryjne', 2.0),
('generator diesel elektryczny',     'ES-AGR-001', 'Generator diesel — montaż elektryczny',               'robocizna', false, NULL, 8.00, 'szt', 'zasilanie_awaryjne', 1.8),
('ups zasilacz awaryjny',            'ES-AGR-002', 'Montaż UPS (zasilacz awaryjny) + okablowanie',        'robocizna', false, NULL, 3.00, 'szt', 'zasilanie_awaryjne', 2.0),
('ups rack montaz',                  'ES-AGR-002', 'UPS rack — montaż i okablowanie',                     'robocizna', false, NULL, 3.00, 'szt', 'zasilanie_awaryjne', 1.8),
('szr samoczynne zalaczanie rezerwy','ES-AGR-003', 'Montaż i uruchomienie SZR (ATS)',                     'robocizna', false, NULL, 4.00, 'kpl', 'zasilanie_awaryjne', 2.0),
('ats przelacznik zasilania',        'ES-AGR-003', 'ATS — automatyczne przełączenie zasilania',           'robocizna', false, NULL, 4.00, 'kpl', 'zasilanie_awaryjne', 1.8),
('wymiana akumulatora ups',          'ES-AGR-004', 'Wymiana akumulatorów UPS (serwis)',                   'robocizna', false, NULL, 1.50, 'szt', 'zasilanie_awaryjne', 2.0),

-- ============================================================
-- ODGROMÓWKA / PIORUNOCHRON / SPD
-- ============================================================
('instalacja odgromowa',             'ES-OD-010', 'Montaż instalacji piorunochronnej — zwody poziome',    'robocizna', false, NULL, 0.25, 'm',   'uziemienie', 2.0),
('piorunochron montaz',              'ES-OD-010', 'Piorunochron — montaż zwodów',                         'robocizna', false, NULL, 0.25, 'm',   'uziemienie', 1.8),
('zwod poziomy bednarka dach',       'ES-OD-011', 'Zwód poziomy — bednarka FeZn 30×4 na dachu',          'robocizna', false, NULL, 0.25, 'm',   'uziemienie', 2.0),
('bednarka dach odgromowa',          'ES-OD-011', 'Bednarka odgromowa na dachu — wsporniki',              'robocizna', false, NULL, 0.25, 'm',   'uziemienie', 1.8),
('zwod pionowy iglica',              'ES-OD-012', 'Zwód pionowy — iglica odgromowa H=0.5-1.5m',          'robocizna', false, NULL, 0.80, 'szt', 'uziemienie', 2.0),
('iglica odgromowa',                 'ES-OD-012', 'Iglica — piorunochron pionowy',                        'robocizna', false, NULL, 0.80, 'szt', 'uziemienie', 1.8),
('przewod odprowadzajacy odgromowy', 'ES-OD-013', 'Przewód odprowadzający bednarka/linka po elewacji',    'robocizna', false, NULL, 0.30, 'm',   'uziemienie', 2.0),
('uziom pionowy pret',               'ES-OD-014', 'Uziom pionowy — pręt Fe/Cu Ø16mm L=3m (wbijanie)',   'robocizna', false, NULL, 1.50, 'szt', 'uziemienie', 2.0),
('pret uziemiajacy',                 'ES-OD-014', 'Pręt uziemiający — earth rod 3m',                     'robocizna', false, NULL, 1.50, 'szt', 'uziemienie', 1.8),
('uziom poziomy bednarka',           'ES-OD-015', 'Uziom poziomy — bednarka FeZn 30×4 w wykopie',       'robocizna', false, NULL, 0.25, 'm',   'uziemienie', 2.0),
('uziom otokowy',                    'ES-OD-016', 'Uziom otokowy (pierścień) wokół budynku',             'robocizna', false, NULL, 0.28, 'm',   'uziemienie', 2.0),
('szyna wyrownania potencjalow hes', 'ES-OD-017', 'Szyna HES/MEB — główna szyna uziemiająca budynku',   'robocizna', false, NULL, 2.00, 'szt', 'uziemienie', 2.0),
('szyna hes meb',                    'ES-OD-017', 'Szyna HES/MEB montaż',                                'robocizna', false, NULL, 2.00, 'szt', 'uziemienie', 1.8),
('spd typ 1 klasa i',                'ES-SPD-001', 'Montaż SPD typ 1 (klasa I) — ochrona piorunowa',     'robocizna', false, NULL, 0.60, 'szt', 'uziemienie', 2.0),
('spd klasa 1',                      'ES-SPD-001', 'SPD klasa I — montaż w rozdzielnicy',                'robocizna', false, NULL, 0.60, 'szt', 'uziemienie', 1.8),
('spd typ 2 klasa ii',               'ES-SPD-002', 'Montaż SPD typ 2 (klasa II) — ochrona przepięciowa', 'robocizna', false, NULL, 0.50, 'szt', 'uziemienie', 2.0),
('spd klasa 2',                      'ES-SPD-002', 'SPD klasa II — rozdzielnia piętrowa',                'robocizna', false, NULL, 0.50, 'szt', 'uziemienie', 1.8),
('spd typ 3 klasa iii',              'ES-SPD-003', 'Montaż SPD typ 3 (klasa III) — gniazda końcowe',     'robocizna', false, NULL, 0.40, 'szt', 'uziemienie', 2.0),
('spd kombinowany typ 1+2',          'ES-SPD-004', 'SPD kombinowany typ 1+2 — rozdzielnica główna',      'robocizna', false, NULL, 0.80, 'szt', 'uziemienie', 2.0),
('zwod aktywny ese',                 'ES-OD-018', 'Montaż zwodu aktywnego ESE — piorunochron aktywny',   'robocizna', false, NULL, 4.00, 'szt', 'uziemienie', 2.0),
('pomiar rezystancji uziomow',       'ES-OD-019', 'Pomiar rezystancji uziomów + protokół odgromowy',     'robocizna', false, NULL, 3.00, 'kpl', 'pomiary_dokumentacja', 2.0),
('pomiar odgromowki certyfikat',     'ES-OD-019', 'Certyfikat instalacji odgromowej — pomiary',          'robocizna', false, NULL, 3.00, 'kpl', 'pomiary_dokumentacja', 1.8),

-- ============================================================
-- TRAFOSTACJE I ŚREDNIE NAPIĘCIE
-- ============================================================
('trafostacja prefabrykowana',       'ES-TR-001', 'Montaż trafostacji prefabrykowanej SN/nn',             'robocizna', false, NULL, 40.0, 'kpl', 'trafostacje', 2.0),
('stacja transformatorowa',          'ES-TR-001', 'Stacja transformatorowa — montaż elektryczny',         'robocizna', false, NULL, 40.0, 'kpl', 'trafostacje', 1.8),
('transformator sn nn',              'ES-TR-002', 'Montaż transformatora SN/nn (630-1000 kVA)',           'robocizna', false, NULL, 16.0, 'szt', 'trafostacje', 2.0),
('kabel sn 15kv',                    'ES-TR-003', 'Ułożenie kabla SN 15kV (XRUHAKXS) w rowie',           'robocizna', false, NULL, 0.18, 'm',   'trafostacje', 2.0),
('kabel sredniego napiecia',         'ES-TR-003', 'Kabel SN średniego napięcia — układanie',              'robocizna', false, NULL, 0.18, 'm',   'trafostacje', 1.8),
('rozdzielnica sn',                  'ES-TR-004', 'Montaż rozdzielnicy SN (RMU, RV7)',                    'robocizna', false, NULL, 20.0, 'szt', 'trafostacje', 2.0)

ON CONFLICT (keyword_normalized) DO NOTHING;
