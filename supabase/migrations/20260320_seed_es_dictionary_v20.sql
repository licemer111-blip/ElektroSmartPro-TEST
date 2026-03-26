-- ES-Dictionary v20: Nowe kategorie — roboty_ziemne, oswietlenie_drogowe, kable_specjalne_nh, agregaty_upsy, odgromowka
-- ~60 nowych wpisów | format: (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ============================================================
-- ROBOTY ZIEMNE KABLOWE
-- ============================================================
('wykop rowu kablowego',             'ES-RZ-001', 'Wykop rowu kablowego ręczny kat.I-II (0.4×0.7m)',   'robocizna', false, NULL, 0.40,  'm',   'roboty_ziemne', 2.0),
('wykop mechaniczny kabel', 'roboty_ziemne', 'roboty_ziemne', ARRAY['wykop koparką','koparka rów kablowy','mechaniczny wykop','koparka kabel','excavation cable','wykop maszynowy kabel'], 1.1, 'v20'),
('wykop pod jezdnią', 'roboty_ziemne', 'roboty_ziemne', ARRAY['frezowanie asfaltu','rów pod jezdnią','frez kabel','nacinanie asfaltu','wykop chodnik kabel','cięcie asfaltu kabel'], 1.1, 'v20'),
('zasypka rowu kablowego', 'roboty_ziemne', 'roboty_ziemne', ARRAY['zasypanie piaskiem','zagęszczenie rowu','podsypka kablowa','zasyp piasek kabel','backfill trench','zasypanie wykopu kabel','zagęszczenie piasku'], 1.1, 'v20'),
('folia ostrzegawcza kabel', 'roboty_ziemne', 'roboty_ziemne', ARRAY['taśma ostrzegawcza kabel','folia niebieska kabel','taśma czerwona kabel','warning tape cable','folia kablowa','taśma ostrzegawcza rów'], 1.1, 'v20'),
('płyta ochronna kablowa', 'roboty_ziemne', 'roboty_ziemne', ARRAY['płyta betonowa kabel','przykrycie kabla płytą','płyta ochronna beton','cable protection slab','płyta kablowa beton'], 1.1, 'v20'),
('odtworzenie nawierzchni asfaltowej', 'roboty_ziemne', 'roboty_ziemne', ARRAY['remont asfaltu po wykoie','asfalt po wykoie','naprawa jezdni po kablu','asfalt na zimno kabel','odbudowa nawierzchni','patch asfalt'], 1.1, 'v20'),
('odtworzenie chodnika kostka', 'roboty_ziemne', 'roboty_ziemne', ARRAY['kostka po wykopie','bruk po kablu','naprawa chodnika kabel','odbudowa chodnika bruk','pavement restoration','kostkowanie po kablu'], 1.1, 'v20'),
('ułożenie kabla w ziemi', 'roboty_ziemne', 'roboty_ziemne', ARRAY['kabel w rowie','kabel w ziemi','kabel bezpośrednio ziemia','kabel underground','kabel podziemny','kabel w gruncie','ułożenie w rowie'], 1.1, 'v20'),
('kanalizacja kablowa hdpe', 'roboty_ziemne', 'roboty_ziemne', ARRAY['rura hdpe 110mm kabel','kanalizacja kablowa','hdpe kanalizacja','pvc kanalizacja kablowa','rura kablowa 110','teletechniczna kanalizacja'], 1.1, 'v20'),
('przekop bezwykopowy', 'roboty_ziemne', 'roboty_ziemne', ARRAY['przecisk pneumatyczny','hdd kabel','bezwykopowy','mole grunt','kret elektryczny','directional drilling','przebicie pod drogą'], 1.1, 'v20'),
('mufa kablowa złączna', 'roboty_ziemne', 'roboty_ziemne', ARRAY['mufa kablowa','złącze kablowe','mufa łącząca','splice cable','mufa podziemna','złącze podziemne kabel','mufa yky'], 1.1, 'v20'),
('mufa kablowa sn', 'roboty_ziemne', 'roboty_ziemne', ARRAY['mufa sn','mufa 15kv','złącze kablowe sn','mufa średniego napięcia','splice sn','mufa 6kv','mufa 10kv'], 1.1, 'v20'),
('głowica kablowa końcowa', 'roboty_ziemne', 'roboty_ziemne', ARRAY['głowica końcowa kabel','termination cable','głowica yky','zakończenie kabla termokurczliwa','końcówka kabla','head cable end'], 1.1, 'v20'),
('studzienka kablowa', 'roboty_ziemne', 'roboty_ziemne', ARRAY['studnia kablowa','studzienka sk-1','studnia betonowa kabel','manhol kablowy','studzienka sk1','kable studnia','studnia kablowa betonowa'], 1.1, 'v20'),

-- ============================================================
-- OŚWIETLENIE DROGOWE / ZEWNĘTRZNE
-- ============================================================
('słup oświetleniowy montaż', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['montaż słupa oświetleniowego','słup latarni','betonowanie słupa','montaż latarni','słup stalowy ocynkowany','fundament słupa latarni'], 1.1, 'v20'),
('słup oświetleniowy 4m', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['słup 4 metry','latarnia 4m','słup niski','słup parking 4m','słup oświetlenie 4m'], 1.1, 'v20'),
('słup oświetleniowy 6m', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['słup 6 metrów','latarnia 6m','słup droga 6m','słup oświetlenie uliczne 6m'], 1.1, 'v20'),
('słup oświetleniowy 8m', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['słup 8m','latarnia 8 metrów','słup hala','słup wysoki 8m','mast 8m oświetlenie'], 1.1, 'v20'),
('oprawa uliczna led', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['led uliczny','latarnia led','oprawa drogowa led','street light led','wysięgnik led','oprawa 150w uliczna','led drogowy'], 1.1, 'v20'),
('szafa sterowania oświetleniem zewnętrznym', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['so szafa','szafa oświetlenie zewnętrzne','zegar astronomiczny szafa','sterownik oświetlenie uliczne','szafa za latarnie','sterownik zewnętrzny'], 1.1, 'v20'),
('oprawa parkingowa led', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['oświetlenie parkingu','lampa parkingowa','led parking','oprawa parking zewnętrzna','latarnia parkingowa led'], 1.1, 'v20'),
('reflektor led zewnętrzny', 'oswietlenie_drogowe', 'oswietlenie_drogowe', ARRAY['reflektor zewnętrzny','halogen led','naświetlacz led','reflektor elewacja','flood light led','naświetlacz zewnętrzny'], 1.1, 'v20'),
('kabel zasilanie oświetlenie zewnętrzne', 'oswietlenie_drogowe', 'roboty_ziemne', ARRAY['kabel latarnie','yky rów oświetlenie','kabel 4x16 teren','kabel oświetlenie uliczne','linia zasilająca latarnie'], 1.1, 'v20'),

-- ============================================================
-- KABLE SPECJALNE NH / BEZHALOGENOWE
-- ============================================================
('kabel nhxmh', 'kablowanie', 'kablowanie', ARRAY['nhxmh','kabel bezhalogenowy','nh kabel','nhxmh 3x1.5','nhxmh 3x2.5','nhxmh 5x2.5','kabel nh budynek','nh bezhalogenowy'], 1.15, 'v20'),
('kabel nhxmh 1.5mm', 'kablowanie', 'kablowanie', ARRAY['nhxmh 3x1.5','kabel nh 1.5','nhxmh 1.5','nh 1.5mm','nhxmh oświetlenie','bezhalogenowy 1.5'], 1.15, 'v20'),
('kabel nhxmh 2.5mm', 'kablowanie', 'kablowanie', ARRAY['nhxmh 3x2.5','nhxmh 5x2.5','nh 2.5mm','nhxmh gniazdka','bezhalogenowy 2.5mm','nh szpital'], 1.15, 'v20'),
('kabel nhxmh 6mm', 'kablowanie', 'kablowanie', ARRAY['nhxmh 5x6','nhxmh 3x6','nh 6mm kabel','nhxmh klimatyzacja','bezhalogenowy 6mm'], 1.15, 'v20'),
('kabel nhxmh 16mm', 'kablowanie', 'kablowanie', ARRAY['nhxmh 5x16','nh 16mm','nhxmh wlz','bezhalogenowy wlz','nh 16 budynek'], 1.15, 'v20'),
('kabel n2xh lszh', 'kablowanie', 'kablowanie', ARRAY['n2xh','lszh kabel','kabel n2xh','n2xh lszh','kabel lszh','bezhalogenowy zewnętrzny','n2xh 3x1.5'], 1.15, 'v20'),
('kabel hdgs ph90', 'kablowanie_pozarowe', 'kablowanie_pozarowe', ARRAY['hdgs ph90','kabel ph90','kabel pożarowy','kabel e90','kabel czerwony pożar','hdgs ognioodporny','fire cable ph90'], 1.2, 'v20'),
('kabel hdgs 3x1.5 ph90', 'kablowanie_pozarowe', 'kablowanie_pozarowe', ARRAY['hdgs ph90 3x1.5','ph90 1.5mm','kabel ssp zasilanie','kabel pożar 1.5','kabel e90 1.5mm'], 1.2, 'v20'),
('kabel hdgs 3x2.5 ph90', 'kablowanie_pozarowe', 'kablowanie_pozarowe', ARRAY['hdgs ph90 3x2.5','ph90 2.5mm','kabel ssp 2.5','kabel brama ppoz','kabel e90 2.5'], 1.2, 'v20'),
('kabel htksh pętla ssp', 'kablowanie_pozarowe', 'kablowanie_pozarowe', ARRAY['htksh','kabel pętla sap','htksh ekranowany','kabel ssp adresowy','pętla adresowalna kabel','htksh 2x1.5','htksh 2x2x1'], 1.2, 'v20'),
('kabel pancerny xswy', 'kablowanie', 'kablowanie', ARRAY['xswy','yxksy','kabel pancerny','kabel zbrojony','swa kabel','kabel zbrojony miedź','kabel pancerny 6mm','kabel zbrojony zewnętrzny'], 1.1, 'v20'),
('kabel asxsn aluminium zbrojony', 'kablowanie', 'kablowanie', ARRAY['asxsn','axswa','kabel pancerny al','kabel zbrojony aluminiowy','asxsn ziemia','kabel al zbrojony'], 1.1, 'v20'),

-- ============================================================
-- AGREGATY / UPS / SZR
-- ============================================================
('agregat prądotwórczy', 'zasilanie_awaryjne', 'zasilanie_awaryjne', ARRAY['agregat prądotwórczy','generator diesel','agregat prąd','prądnica','generator elektryczny','generator awaryjny','zasilanie awaryjne agregat'], 1.1, 'v20'),
('ups zasilacz awaryjny', 'zasilanie_awaryjne', 'zasilanie_awaryjne', ARRAY['ups','zasilacz ups','ups 1kva','ups 3kva','ups rack','ups online','zasilanie awaryjne ups','uninterruptible power'], 1.1, 'v20'),
('szr samoczynne załączanie rezerwy', 'zasilanie_awaryjne', 'zasilanie_awaryjne', ARRAY['szr','samoczynne załączanie rezerwy','ats przełącznik','szr automatyczny','przełącznik zasilania awaryjnego','szr próba','automatic transfer switch'], 1.15, 'v20'),
('szafa ups centralna', 'zasilanie_awaryjne', 'zasilanie_awaryjne', ARRAY['centralne ups','ups centrala','ups 3f','ups 20kva','ups 80kva','ups centralny','central ups system'], 1.1, 'v20'),
('akumulator ups wymiana', 'zasilanie_awaryjne', 'zasilanie_awaryjne', ARRAY['wymiana akumulatora ups','akumulator ups','battery ups','bateria ups wymiana','agm 12v ups','serwis ups akumulator'], 1.1, 'v20'),

-- ============================================================
-- ODGROMÓWKA / PIORUNOCHRON / SPD
-- ============================================================
('instalacja odgromowa', 'odgromowka', 'odgromowka', ARRAY['piorunochron','instalacja piorunochronna','zwody odgromowe','bednarka dach','odgromówka montaż','lightning protection','instalacja odgromowa budynek'], 1.1, 'v20'),
('zwód poziomy bednarka dach', 'odgromowka', 'odgromowka', ARRAY['zwód poziomy','bednarka dach','bednarka 30x4 dach','odgromówka dach','zwody dach','lightning conductor roof','bednarka zwód'], 1.1, 'v20'),
('zwód pionowy iglica', 'odgromowka', 'odgromowka', ARRAY['iglica odgromowa','zwód pionowy','iglica piorunochron','pręt odgromowy','lightning rod','iglica dach'], 1.1, 'v20'),
('przewód odprowadzający odgromowy', 'odgromowka', 'odgromowka', ARRAY['przewód odprowadzający','down conductor','bednarka elewacja odprowadzenie','linka odgromowa elewacja','przewód piorunochron'], 1.1, 'v20'),
('uziom pionowy pręt', 'odgromowka', 'odgromowka', ARRAY['pręt uziemiający','uziom pionowy','earth rod','wbicie pręta uziomowego','szpila uziemiająca 3m','grounding rod','pręt uziom'], 1.1, 'v20'),
('uziom poziomy bednarka', 'odgromowka', 'odgromowka', ARRAY['uziom poziomy','bednarka ziemia','uziom taśmowy','horizontal earth electrode','bednarka uziom rów','uziomowanie poziome'], 1.1, 'v20'),
('uziom otokowy pierścień', 'odgromowka', 'odgromowka', ARRAY['uziom otokowy','uziom fundament pierścień','ring earth','uziom obwodowy','foundation earth ring','bednarka otokowa','uziom fundament'], 1.1, 'v20'),
('pomiar rezystancji uziomów', 'odgromowka', 'pomiary_odbiory', ARRAY['pomiar uziomów','pomiar odgromówki','certyfikat odgromowy','protokół odgromowy','rezystancja uziomu','odbiór odgromówki','earth resistance test'], 1.1, 'v20'),
('spd typ 1 klasa i', 'odgromowka', 'odgromowka', ARRAY['spd typ 1','ochronnik klasa 1','spd klasa i','lightning arrester','ochrona klasa 1','spd 1 faza','zabezpieczenie klasa 1'], 1.15, 'v20'),
('spd typ 2 klasa ii', 'odgromowka', 'odgromowka', ARRAY['spd typ 2','ochronnik typ 2','klasa 2 spd','type 2 spd','spd rozdzielnia','ochrona przepięcia klasa 2'], 1.1, 'v20'),
('spd typ 3 klasa iii', 'odgromowka', 'odgromowka', ARRAY['spd typ 3','ochronnik typ 3','klasa 3 spd','type 3 spd','spd gniazdko','terminal spd'], 1.1, 'v20'),
('spd kombinowany typ 1+2', 'odgromowka', 'odgromowka', ARRAY['spd typ 1+2','spd kombinowany','klasa 1 2 spd','combined spd','spd 1+2 rozdzielnia'], 1.15, 'v20'),
('zwód aktywny ese', 'odgromowka', 'odgromowka', ARRAY['zwód aktywny','ese piorunochron','aktywny piorunochron','early streamer emission','ese dach','aktywny zwód'], 1.1, 'v20'),
('szyna wyrównania potencjałów hes', 'odgromowka', 'odgromowka', ARRAY['szyna hes','meb szyna','szyna wyrównania','main earth busbar','szyna pe główna','szyna uziom budynek','główna szyna uziemiająca'], 1.1, 'v20'),
('złącze kontrolne odgromowe', 'odgromowka', 'odgromowka', ARRAY['złącze rewizyjne','złącze pomiarowe odgrom','test clamp lightning','złącze probiercze','connection point lightning'], 1.0, 'v20'),

-- ============================================================
-- TRAFOSTACJE I ŚREDNIE NAPIĘCIE
-- ============================================================
('trafostacja prefabrykowana', 'trafostacje', 'trafostacje', ARRAY['trafostacja','trafostacja prefabrykowana','stacja transformatorowa','kontenerowa trafostacja','trafostacja betonowa','substation','stacja 15/0.4kv'], 1.2, 'v20'),
('transformator sn/nn', 'trafostacje', 'trafostacje', ARRAY['transformator','transformator 630kva','transformator 1000kva','transformator sn nn','transformer 0.4kv','montaż transformatora','transformator olejowy'], 1.2, 'v20'),
('kabel sn 15kv', 'trafostacje', 'roboty_ziemne', ARRAY['kabel sn','kabel 15kv','kabel średniego napięcia','kabel 6kv','kabel 10kv','kabel sn podziemny','xruhakxs','kabel 15 kv układanie'], 1.2, 'v20'),
('rozdzielnica sn', 'trafostacje', 'trafostacje', ARRAY['rozdzielnica 15kv','rozdzielnica sn','rv7 rozdzielnica','szafa sn','rmu rozdzielnica','ring main unit','rozdzielnica średniego napięcia'], 1.2, 'v20'),
('pomiar rezystancji transformatora', 'trafostacje', 'pomiary_odbiory', ARRAY['pomiar transformatora','test transformatora','odbiór trafostacji','próba transformator','certyfikat trafostacja','HV test transformator'], 1.2, 'v20')

ON CONFLICT (normalized_description) DO NOTHING;
