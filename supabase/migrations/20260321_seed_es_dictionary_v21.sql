-- ES-Dictionary v21: Rozbudowa cienkich kategorii — fotowoltaika, smart_home, pomiary, swiatlowody
-- Docelowo: ~200 nowych wpisów, docelowe pokrycie fotowoltaika>100, smart_home>100, pomiary>100

INSERT INTO public.es_dictionary (normalized_description, canonical_category, labor_category, synonyms, confidence_boost, notes)
VALUES

-- ============================================================
-- FOTOWOLTAIKA (rozbudowa do 100+ wpisów)
-- ============================================================
('panel fotowoltaiczny montaż', 'fotowoltaika', 'fotowoltaika', ARRAY['panel pv','moduł solarny','panel solarny','panel fotowoltaiczny','solar panel','moduł pv montaż','montaż panelu pv','panel słoneczny'], 1.2, 'v21'),
('panel fotowoltaiczny 400wp', 'fotowoltaika', 'fotowoltaika', ARRAY['panel 400wp','panel 420wp','moduł 400wp','pv 400 wat','panel 410wp','moduł 400w solarny'], 1.2, 'v21'),
('panel fotowoltaiczny 450wp', 'fotowoltaika', 'fotowoltaika', ARRAY['panel 450wp','panel 460wp','moduł 450wp','pv 450 wat','panel half-cut','topcon panel','perc panel'], 1.2, 'v21'),
('panel bifacjalny', 'fotowoltaika', 'fotowoltaika', ARRAY['bifacial panel','panel dwustronny','bifacial 500wp','panel dwustronny pv','bifacial solar','moduł bifacial'], 1.2, 'v21'),
('konstrukcja dachowa pv', 'fotowoltaika', 'fotowoltaika', ARRAY['szyny pv dach','haki pv','konstrukcja pod panele','szyny aluminiowe pv','montaż konstrukcji solar','uchwyt panelu dach','klemy pv'], 1.2, 'v21'),
('konstrukcja dach płaski pv', 'fotowoltaika', 'fotowoltaika', ARRAY['pv flat roof','balast pv','dach płaski solar','konstrukcja flat','balast beton pv','flat roof montaż'], 1.2, 'v21'),
('konstrukcja gruntowa pv', 'fotowoltaika', 'fotowoltaika', ARRAY['farma pv','solar ground mount','wbijanie pali pv','pale stalowe pv','ground mount solar','instalacja gruntowa pv'], 1.2, 'v21'),
('inwerter falownik pv', 'fotowoltaika', 'fotowoltaika', ARRAY['falownik pv','inwerter solarny','inverter solar','falownik solny','inwerter sieciowy','solis falownik','fronius montaż','huawei solar'], 1.2, 'v21'),
('inwerter 1-fazowy do 6kw', 'fotowoltaika', 'fotowoltaika', ARRAY['falownik 1f pv','inwerter 5kw','inwerter 6kw pv','falownik jednofazowy solar','inverter 5kw 1f'], 1.2, 'v21'),
('inwerter 3-fazowy 10-15kw', 'fotowoltaika', 'fotowoltaika', ARRAY['falownik 3f pv','inwerter 10kw','inwerter 12kw','falownik 15kw','solar inverter 3f 10kw','inverter trójfazowy 10kw'], 1.2, 'v21'),
('inwerter 3-fazowy 20-50kw', 'fotowoltaika', 'fotowoltaika', ARRAY['falownik komercyjny pv','inwerter 25kw','inwerter 50kw','solar inverter commercial','falownik 30kw solar'], 1.2, 'v21'),
('inwerter centralny 60-100kw', 'fotowoltaika', 'fotowoltaika', ARRAY['falownik 100kw','inwerter centralny','central inverter','solar 100kw','farma inwerter 100kw'], 1.2, 'v21'),
('optymalizator mocy pv', 'fotowoltaika', 'fotowoltaika', ARRAY['optymalizator','mlpe','power optimizer','tigo optimizer','solaredge optymalizator','optimizer pv','optymalizator solar'], 1.2, 'v21'),
('mikrofalownik per panel', 'fotowoltaika', 'fotowoltaika', ARRAY['microinverter','mikroinwerter','enphase iq','micro inverter','enphase montaż','iq8 montaż'], 1.2, 'v21'),
('kabel dc solarny 6mm', 'fotowoltaika', 'fotowoltaika', ARRAY['kabel solarny dc','h1z2z2 6mm','kabel pv dc','string kabel pv','kabel fotowoltaika dc','solar cable 6mm'], 1.2, 'v21'),
('kabel dc solarny 10mm', 'fotowoltaika', 'fotowoltaika', ARRAY['kabel solarny dc 10','h1z2z2 10mm','kabel pv 10mm','string kabel 10mm','solar cable 10mm'], 1.2, 'v21'),
('skrzynka dc string combiner', 'fotowoltaika', 'fotowoltaika', ARRAY['string box pv','combiner box','skrzynka stringów','skrzynka dc solar','dc combiner','pv string box'], 1.2, 'v21'),
('rozłącznik dc 1000v pv', 'fotowoltaika', 'fotowoltaika', ARRAY['odłącznik dc pv','dc switch 1000v','rozłącznik dc solar','dc disconnect pv','wyłącznik dc pv'], 1.2, 'v21'),
('spd dc pv ochrona przepięciowa', 'fotowoltaika', 'fotowoltaika', ARRAY['spd dc pv','ochrona dc pv','zabezpieczenie dc solar','surge dc pv','ochronnik dc fotowoltaika'], 1.2, 'v21'),
('magazyn energii bateria pv', 'fotowoltaika', 'fotowoltaika', ARRAY['magazyn energii','bateria pv','akumulator solarny','energy storage','lifepo4','home battery','bms bateria pv','bateria 10kwh'], 1.2, 'v21'),
('magazyn energii 5-10kwh', 'fotowoltaika', 'fotowoltaika', ARRAY['bateria 5kwh','bateria 10kwh pv','magazyn 10kwh','lifepo4 10kwh','storage 10kwh solar'], 1.2, 'v21'),
('magazyn energii 15-30kwh komercyjny', 'fotowoltaika', 'fotowoltaika', ARRAY['bess komercyjny','bateria 20kwh','bess pv','battery commercial solar','energy storage 30kwh'], 1.2, 'v21'),
('licznik dwukierunkowy prosument', 'fotowoltaika', 'fotowoltaika', ARRAY['licznik dwukierunkowy','net metering','licznik prosument','smart meter solar','licznik pv produkcja','licznik eksport'], 1.2, 'v21'),
('monitoring online pv', 'fotowoltaika', 'fotowoltaika', ARRAY['monitoring pv','datalogger pv','logger solar','solarweb','portal pv','iot solar','wifi monitoring solar','monitoring instalacji pv'], 1.2, 'v21'),
('przyłączenie pv do sieci', 'fotowoltaika', 'fotowoltaika', ARRAY['przyłączenie instalacji pv','zgłoszenie pv','odbiór energetyki pv','prosument osd','aplikacja osd','grid connection pv'], 1.2, 'v21'),
('falownik hybrydowy off-grid', 'fotowoltaika', 'fotowoltaika', ARRAY['pv off grid','instalacja wyspowa','falownik hybrydowy','hybrid inverter','solar off grid','autonomiczny pv'], 1.2, 'v21'),
('carport solarny', 'fotowoltaika', 'fotowoltaika', ARRAY['wiata fotowoltaiczna','carport pv','solar carport','wiata z panelami','parking solar','carport panel solar'], 1.2, 'v21'),
('czyszczenie paneli pv serwis', 'fotowoltaika', 'fotowoltaika', ARRAY['mycie paneli','solar cleaning','panel washing','serwis pv','czyszczenie paneli słonecznych','panel service'], 1.1, 'v21'),
('inspekcja termowizyjna pv', 'fotowoltaika', 'fotowoltaika', ARRAY['termowizja pv','hot spot pv','termografia paneli','ir inspection solar','thermovision pv','termowizja fotowoltaika'], 1.2, 'v21'),
('instalacja pv 5kwp', 'fotowoltaika', 'fotowoltaika', ARRAY['pv 5kwp','fotowoltaika 5kw','instalacja 5kwp','5 kwp solar','montaż 5kwp'], 1.2, 'v21'),
('instalacja pv 10kwp', 'fotowoltaika', 'fotowoltaika', ARRAY['pv 10kwp','fotowoltaika 10kw','instalacja 10kwp','10 kwp solar','montaż 10kwp'], 1.2, 'v21'),
('instalacja pv 20kwp', 'fotowoltaika', 'fotowoltaika', ARRAY['pv 20kwp','fotowoltaika 20kw','farma 20kwp','20 kwp solar','montaż farmy pv'], 1.2, 'v21'),
('projekt instalacji pv', 'fotowoltaika', 'pomiary_dokumentacja', ARRAY['projekt pv','dokumentacja fotowoltaika','projekt solary','pv design','projektowanie instalacji pv'], 1.1, 'v21'),

-- ============================================================
-- SMART HOME / KNX / DALI (rozbudowa do 100+ wpisów)
-- ============================================================
('system knx instalacja', 'smart_home', 'smart_home', ARRAY['knx','eib','knx montaż','system knx','instalacja knx','knx eib','inteligentny dom knx'], 1.2, 'v21'),
('moduł knx aktor', 'smart_home', 'smart_home', ARRAY['aktor knx','moduł knx din','knx actuator','aktor oświetlenie knx','aktor rolet knx','knx module','sterownik knx'], 1.2, 'v21'),
('zasilacz knx 320ma', 'smart_home', 'smart_home', ARRAY['zasilacz magistrali knx','knx power supply','ps640 knx','zasilacz 320ma','knx psu','dławik knx'], 1.2, 'v21'),
('czujnik knx', 'smart_home', 'smart_home', ARRAY['sensor knx','czujnik temperatury knx','czujnik obecności knx','czujnik jasności knx','knx sensor','brightness sensor knx'], 1.2, 'v21'),
('panel obsługi knx', 'smart_home', 'smart_home', ARRAY['przycisk knx','panel knx','klawiatura knx','touch panel knx','knx switch','przyciski sterowania knx'], 1.2, 'v21'),
('programowanie knx ets', 'smart_home', 'smart_home', ARRAY['ets programowanie','knx konfiguracja','programista knx','ets5','ets6','knx uruchomienie','knx commissioning'], 1.2, 'v21'),
('system dali oświetlenie', 'smart_home', 'smart_home', ARRAY['dali','dali-2','sterowanie oświetleniem dali','dali driver','dali 2 driver','dali protocol','dali system'], 1.2, 'v21'),
('sterownik dali 2', 'smart_home', 'smart_home', ARRAY['dali-2 sterownik','driver dali','dali kontroller','dali bus','dali controller','dali 2 driver montaż'], 1.2, 'v21'),
('czujnik obecności dali', 'smart_home', 'smart_home', ARRAY['sensor dali','czujnik dali','presence sensor dali','occupancy dali','czujnik biuro dali','dali motion sensor'], 1.2, 'v21'),
('system loxone', 'smart_home', 'smart_home', ARRAY['loxone','loxone miniserver','loxone montaż','smart home loxone','loxone konfiguracja','loxone uruchomienie'], 1.2, 'v21'),
('loxone miniserver', 'smart_home', 'smart_home', ARRAY['miniserver loxone','loxone serwer','loxone brain','miniserver go loxone','loxone central','loxone server'], 1.2, 'v21'),
('system home assistant', 'smart_home', 'smart_home', ARRAY['home assistant','hass','ha smart home','home assistant konfiguracja','ha hub','hassio','ha server'], 1.1, 'v21'),
('system z-wave zigbee', 'smart_home', 'smart_home', ARRAY['z-wave','zigbee','z-wave hub','zigbee coordinator','z-wave bridge','smart home zigbee','zwave zigbee'], 1.1, 'v21'),
('gniazdo smart 230v', 'smart_home', 'smart_home', ARRAY['smart socket','inteligentne gniazdo','gniazdo wifi','smart plug','gniazdko wifi','gniazdo z pomiarem','smart outlet'], 1.1, 'v21'),
('wyłącznik smart wifi', 'smart_home', 'smart_home', ARRAY['wyłącznik smart','smart switch wifi','włącznik wifi','smart light switch','wyłącznik inteligentny wifi','smart wyłącznik'], 1.1, 'v21'),
('ściemniacz smart dimmer', 'smart_home', 'smart_home', ARRAY['dimmer smart','ściemniacz wifi','smart dimmer','dimmer inteligentny','ściemniacz knx','dali dimmer','dimmer sterowany'], 1.1, 'v21'),
('roletator silnik smart', 'smart_home', 'smart_home', ARRAY['silnik rolet smart','roletator wifi','żaluzje elektryczne','rolety smart','knx roletator','motor rolet sterowany'], 1.2, 'v21'),
('kurtyna drzwiowa elektryczna', 'smart_home', 'smart_home', ARRAY['kurtyna powietrzna','air curtain elektryczny','kurtyna drzwi','dmuchawa drzwiowa','air curtain montaż'], 1.0, 'v21'),
('czujnik temperatury wilgotności', 'smart_home', 'smart_home', ARRAY['czujnik temperatury','czujnik wilgotności','temp sensor','humidity sensor','czujnik klima','sensor temp wilgot'], 1.1, 'v21'),
('centrala inteligentna budynku', 'smart_home', 'smart_home', ARRAY['bms smart','centrala smart home','hub smart','gateway inteligentny','centrala dom','brain budynek smart'], 1.2, 'v21'),
('mat grzejna elektryczna', 'smart_home', 'ogrzewanie', ARRAY['mata grzejna','ogrzewanie podłogowe elektryczne','elektryczna podłogówka','mat heating','podłoga grzewcza elektryczna','mata 150w'], 1.1, 'v21'),
('kabel grzejny samoregulujący', 'smart_home', 'ogrzewanie', ARRAY['heat trace','kabel samoregulujący','grzałka rur','trace heating','kabel antyoblodzeniowy','rury grzejne kabel'], 1.1, 'v21'),
('termostat podłogowy programowalny', 'smart_home', 'smart_home', ARRAY['termostat smart','regulator temperatury','termostat programowalny','termostat wifi','termostat knx','termostat podłogi'], 1.1, 'v21'),
('bramka integracyjna smart home', 'smart_home', 'smart_home', ARRAY['gateway smart','bridge smart home','hub integracja','bramka iot','central hub','integracja systemów smart'], 1.1, 'v21'),
('programowanie scen oświetlenia', 'smart_home', 'smart_home', ARRAY['sceny oświetlenia','scene light','programowanie sceny','knx scena','dali scena','light scene programming'], 1.1, 'v21'),

-- ============================================================
-- POMIARY I DOKUMENTACJA (rozbudowa do 100+ wpisów)
-- ============================================================
('pomiar rezystancji izolacji', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['pomiar izolacji','megaomierz','rezystancja izolacji','test izolacji','pomiar megom','izolacja przewodów pomiar','pomiar 1000v'], 1.15, 'v21'),
('pomiar impedancji pętli zwarciowej', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['impedancja pętli','zs pomiar','loop impedance','pomiar pętli zwarciowej','zs ochrona','impedancja zwarcie'], 1.15, 'v21'),
('pomiar ciągłości pe', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['ciągłość pe','ciągłość ochronna','continuity test pe','pomiar pe','test przewodu pe','ciągłość ochronna pe'], 1.15, 'v21'),
('test wyłącznika rcd fi', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['test rcd','pomiar rcd','rcd trip test','sprawdzenie fi','test fi','rcd 30ma test','pomiar wyłącznika różnicowego'], 1.15, 'v21'),
('pomiar uziomów rezystancja', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['pomiar uziomów','rezystancja uziomu','earth resistance','earth electrode test','wenner pomiar','uziom rezystancja'], 1.15, 'v21'),
('protokół pomiarów elektrycznych', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['protokół pomiarów','protokół odbioru elektryczny','protokół elektryczny','dokumentacja pomiarowa','raport pomiarów','odbiór instalacji protokół'], 1.15, 'v21'),
('termowizja instalacji elektrycznej', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['termowizja','kamera termowizyjna','thermovision electric','termografia','badanie termowizyjne','ir kamera elektryczna','termowizja rozdzielnia'], 1.15, 'v21'),
('pomiar natężenia oświetlenia lux', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['luksomierz','pomiar oświetlenia','lux pomiar','natężenie oświetlenia','pomiar lux','light measurement','oświetlenie norma pomiar'], 1.1, 'v21'),
('odbiór instalacji elektrycznej', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['odbiór elektryczny','sprawdzenie instalacji','odbiór instalacji','komisja elektryczna','odbiór nowej instalacji','przegląd elektryczny odbiór'], 1.15, 'v21'),
('przegląd 5-letni instalacji', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['przegląd 5-letni','kontrola 5 lat','sprawdzenie elektryczne 5 lat','przegląd elektryczny 5 letni','kontrola elektryczna budynku','inspekcja 5 letnia'], 1.15, 'v21'),
('dokumentacja powykonawcza elektryczna', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['dokumentacja powykonawcza','as-built elektryka','rzuty powykonawcze','schematy powykonawcze','dokumentacja końcowa elektryczna','rysunki powykonawcze'], 1.1, 'v21'),
('pomiar jakości energii', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['analizator jakości energii','pomiar harmonicznych','thd pomiar','power quality','rejestracja jakości','flicker','harmoniczne elektryczne'], 1.15, 'v21'),
('analizator parametrów sieci', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['power meter','analizator mocy','analizator sieci','multimetr tablicowy','power analyser','cos fi pomiar','power quality meter'], 1.1, 'v21'),
('otdr pomiar swiatlowod', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['otdr','reflektometr fo','pomiar swiatlowodu otdr','otdr test','otdr fiber','certyfikacja fo','tłumienność swiatlowód pomiar'], 1.15, 'v21'),
('certyfikacja instalacji lan', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['certyfikacja lan','test kabli lan','fluke certyfikacja','certyfikat sieci','lan certified','kabel sieciowy test'], 1.15, 'v21'),
('ekspertyza elektryczna', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['ekspertyza elektryczna','ocena stanu instalacji','e1 ekspertyza','opinia elektryczna','audyt elektryczny','stan instalacji ocena'], 1.1, 'v21'),
('audyt energetyczny budynku', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['audyt energetyczny','efektywność energetyczna','świadectwo energetyczne','energy audit','certyfikat energetyczny','audyt ee'], 1.1, 'v21'),
('uruchomienie rozdzielnicy głównej', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['uruchomienie rozdzielnicy','próba rg','rozdzielnica uruchomienie','commissioning switchboard','odbiór rozdzielnicy','rg uruchomienie'], 1.1, 'v21'),
('próba falownika vfd uruchomienie', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['próba falownika','test vfd','uruchomienie falownika','vfd commissioning','falownik test run','parametryzacja vfd'], 1.1, 'v21'),
('pomiar prądu upływu', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['prąd upływu','leakage current','pomiar upływu','gfci test','earth leakage','test upływ'], 1.1, 'v21'),
('szkolenie użytkownika instalacja', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['szkolenie użytkownika','instruktaż elektryczny','szkolenie obsługi','user training','instrukcja elektryczna','szkolenie system'], 1.0, 'v21'),
('licznik energii podlicznik', 'pomiary_dokumentacja', 'pomiary_dokumentacja', ARRAY['licznik energii','podlicznik prądu','licznik kwh','energy meter','submetering','licznik elektryczny','smart meter'], 1.1, 'v21'),

-- ============================================================
-- ŚWIATŁOWODY (rozbudowa istniejącej kategorii)
-- ============================================================
('kabel swiatlowodowy os2 jednomodowy', 'swiatlowody', 'swiatlowody', ARRAY['kabel os2','swiatlowód jednomodowy','os2 kabel','fiber jednomod','sm fiber','single mode kabel','kabel fo os2'], 1.2, 'v21'),
('kabel swiatlowodowy 4j', 'swiatlowody', 'swiatlowody', ARRAY['os2 4j','swiatlowód 4 włókna','fiber 4j','kabel fo 4j','4 core fiber','kabel 4 jednomod'], 1.2, 'v21'),
('kabel swiatlowodowy 8j', 'swiatlowody', 'swiatlowody', ARRAY['os2 8j','swiatlowód 8 włókna','fiber 8j','kabel fo 8j','8 core fiber','kabel 8j fo'], 1.2, 'v21'),
('kabel swiatlowodowy 12j', 'swiatlowody', 'swiatlowody', ARRAY['os2 12j','swiatlowód 12 włókna','fiber 12j','kabel fo 12j','12 core fiber','12j jednomod'], 1.2, 'v21'),
('kabel swiatlowodowy 24j', 'swiatlowody', 'swiatlowody', ARRAY['os2 24j','swiatlowód 24 włókna','fiber 24j','kabel fo 24j','24 core os2','kabel 24 jednomod'], 1.2, 'v21'),
('kabel swiatlowodowy om3 wielomodowy', 'swiatlowody', 'swiatlowody', ARRAY['om3','om4','kabel om3','multimode fiber','wielomodowy swiatlowód','om3 12j','om4 kabel','data center fiber'], 1.2, 'v21'),
('spawanie swiatlowodowe fusion splice', 'swiatlowody', 'swiatlowody', ARRAY['spawanie swiatlowodu','fusion splice','splot swiatlowodowy','splicer','spawanie włókna','fusion splicing'], 1.2, 'v21'),
('mufa swiatlowodowa', 'swiatlowody', 'swiatlowody', ARRAY['mufa fo','mufa swiatlowodowa','fiber splice closure','mufa kablowa fo','złącze swiatlowodowe','splice closure'], 1.2, 'v21'),
('odf panel krosowniczy fo', 'swiatlowody', 'swiatlowody', ARRAY['odf','panel fo','patch panel fiber','odf 12j','odf 24j','odf rack','panel swiatlowodowy'], 1.2, 'v21'),
('gniazdo swiatlowodowe sc lc', 'swiatlowody', 'swiatlowody', ARRAY['gniazdo fo','outlet swiatlowód','sc apc gniazdo','lc upc gniazdo','fiber outlet','gniazdo ftth','sc gniazdo'], 1.2, 'v21'),
('pigtail sc apc lc upc', 'swiatlowody', 'swiatlowody', ARRAY['pigtail fo','pigtail sc','pigtail lc','sc apc pigtail','lc upc pigtail','fiber pigtail terminacja'], 1.2, 'v21'),
('dmuchanie kabla microduct', 'swiatlowody', 'swiatlowody', ARRAY['blown fiber','microduct','dmuchanie fo','air blown','kabel microduct dmuchanie','fiber blown installation'], 1.2, 'v21'),
('splitter optyczny plc', 'swiatlowody', 'swiatlowody', ARRAY['splitter plc','pon splitter','splitter 1:8','gpon splitter','plc 1:8','optical splitter','ftth splitter'], 1.2, 'v21'),
('kabel adss napowietrzny', 'swiatlowody', 'swiatlowody', ARRAY['adss kabel','swiatlowód napowietrzny','kabel samonośny fo','aerial fiber','kabel między słupami fo','napowietrzny swiatlowód'], 1.2, 'v21'),
('skrzynka ftth rozdzielcza', 'swiatlowody', 'swiatlowody', ARRAY['skrzynka fo','ftth distribucja','box ftth','skrzynka rozdzielcza swiatlowód','fiber distribution box','ftth skrzynka klatka'], 1.2, 'v21'),
('media konwerter fo ethernet', 'swiatlowody', 'swiatlowody', ARRAY['media konwerter','fiber ethernet','sfp konwerter','fo ethernet','konwerter swiatlowód lan','media converter fo'], 1.1, 'v21')

ON CONFLICT (normalized_description) DO NOTHING;
