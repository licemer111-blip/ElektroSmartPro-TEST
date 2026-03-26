-- ============================================================================
-- CATALOG EXPANSION 2026 - MASSIVE ADDITION
-- ============================================================================
-- Расширение каталога: робочизна (labor), демонтажи, материалы
-- Для mieszkań, biur, hal przemysłowych
-- Базовые цены без НДС (VAT 8% для mieszkań, 23% для pozostałych)
-- ============================================================================

DO $$
DECLARE
  cat_instalacje_id UUID;
  cat_oswietlenie_id UUID;
  cat_rozdzielnice_id UUID;
  cat_automatyka_id UUID;
  cat_okablowanie_id UUID;
  cat_osprzet_id UUID;
  cat_pomiary_id UUID;
  cat_smart_home_id UUID;
  cat_led_przemyslowe_id UUID;
  cat_demontaz_id UUID;
BEGIN
  -- Получаем существующие категории
  SELECT id INTO cat_instalacje_id FROM catalog_categories WHERE name = 'Instalacje elektryczne' LIMIT 1;
  SELECT id INTO cat_oswietlenie_id FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_rozdzielnice_id FROM catalog_categories WHERE name = 'Rozdzielnice i tablice' LIMIT 1;
  SELECT id INTO cat_automatyka_id FROM catalog_categories WHERE name = 'Automatyka' LIMIT 1;
  SELECT id INTO cat_okablowanie_id FROM catalog_categories WHERE name = 'Okablowanie strukturalne' LIMIT 1;
  SELECT id INTO cat_osprzet_id FROM catalog_categories WHERE name = 'Osprzęt elektryczny' LIMIT 1;
  SELECT id INTO cat_pomiary_id FROM catalog_categories WHERE name = 'Pomiary i badania' LIMIT 1;

  -- Создаем новые категории если нужно
  SELECT id INTO cat_smart_home_id FROM catalog_categories WHERE name = 'Smart Home & KNX' LIMIT 1;
  IF cat_smart_home_id IS NULL THEN
    INSERT INTO catalog_categories (name)
    VALUES ('Smart Home & KNX')
    RETURNING id INTO cat_smart_home_id;
  END IF;

  SELECT id INTO cat_led_przemyslowe_id FROM catalog_categories WHERE name = 'Oświetlenie przemysłowe LED' LIMIT 1;
  IF cat_led_przemyslowe_id IS NULL THEN
    INSERT INTO catalog_categories (name)
    VALUES ('Oświetlenie przemysłowe LED')
    RETURNING id INTO cat_led_przemyslowe_id;
  END IF;

  SELECT id INTO cat_demontaz_id FROM catalog_categories WHERE name = 'Demontaż instalacji' LIMIT 1;
  IF cat_demontaz_id IS NULL THEN
    INSERT INTO catalog_categories (name)
    VALUES ('Demontaż instalacji')
    RETURNING id INTO cat_demontaz_id;
  END IF;

  RAISE NOTICE 'Kategorie: instalacje=%, oswietlenie=%, rozdzielnice=%, demontaz=%', 
    cat_instalacje_id, cat_oswietlenie_id, cat_rozdzielnice_id, cat_demontaz_id;

  -- ============================================================================
  -- 1. ROBOCIZNA - MONTAŻ PODSTAWOWY (Mieszkania, biura)
  -- ============================================================================
  
  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  -- Punkty elektryczne
  ('Montaż gniazdka pojedynczego 230V (podtynkowe)', 'labor', cat_instalacje_id, 'szt', 85.00, 0, 'Montaż gniazdka podtynkowego z podłączeniem do istniejącej instalacji'),
  ('Montaż gniazdka podwójnego 230V (podtynkowe)', 'labor', cat_instalacje_id, 'szt', 95.00, 0, 'Montaż gniazdka podwójnego z podłączeniem'),
  ('Montaż gniazdka potrójnego 230V (podtynkowe)', 'labor', cat_instalacje_id, 'szt', 110.00, 0, 'Montaż gniazdka potrójnego z podłączeniem'),
  ('Montaż gniazdka natynkowego 230V', 'labor', cat_instalacje_id, 'szt', 65.00, 0, 'Montaż gniazdka natynkowego - szybszy montaż'),
  ('Montaż gniazdka z uziemieniem + klapką IP44', 'labor', cat_instalacje_id, 'szt', 120.00, 0, 'Montaż gniazdka hermetycznego do łazienki/na zewnątrz'),
  ('Montaż gniazdka siłowego 400V 16A', 'labor', cat_instalacje_id, 'szt', 180.00, 0, 'Montaż gniazdka trójfazowego dla urządzeń przemysłowych'),
  ('Montaż gniazdka siłowego 400V 32A', 'labor', cat_instalacje_id, 'szt', 220.00, 0, 'Montaż gniazdka trójfazowego 32A'),
  ('Montaż gniazdka USB (ładowanie urządzeń)', 'labor', cat_instalacje_id, 'szt', 95.00, 0, 'Montaż gniazdka z portem USB do ładowania'),
  
  -- Wyłączniki i łączniki
  ('Montaż włącznika pojedynczego', 'labor', cat_instalacje_id, 'szt', 75.00, 0, 'Montaż prostego wyłącznika światła'),
  ('Montaż włącznika podwójnego (schodowego)', 'labor', cat_instalacje_id, 'szt', 85.00, 0, 'Montaż wyłącznika schodowego - sterowanie z 2 miejsc'),
  ('Montaż włącznika krzyżowego', 'labor', cat_instalacje_id, 'szt', 95.00, 0, 'Montaż wyłącznika krzyżowego - sterowanie z 3+ miejsc'),
  ('Montaż ściemniacza (dimmer)', 'labor', cat_instalacje_id, 'szt', 110.00, 0, 'Montaż ściemniacza do regulacji jasności oświetlenia'),
  ('Montaż włącznika z czujnikiem ruchu', 'labor', cat_instalacje_id, 'szt', 130.00, 0, 'Montaż wyłącznika automatycznego z czujnikiem ruchu'),
  ('Montaż włącznika zmierzchowego', 'labor', cat_instalacje_id, 'szt', 120.00, 0, 'Montaż wyłącznika reagującego na zmrok'),
  ('Montaż włącznika czasowego (timer)', 'labor', cat_instalacje_id, 'szt', 115.00, 0, 'Montaż włącznika z zegarem czasowym'),
  
  -- Oświetlenie
  ('Montaż oprawy oświetleniowej sufitowej (do 2,5m)', 'labor', cat_oswietlenie_id, 'szt', 110.00, 0, 'Montaż lampy na suficie do wysokości 2,5m'),
  ('Montaż oprawy oświetleniowej sufitowej (powyżej 2,5m)', 'labor', cat_oswietlenie_id, 'szt', 150.00, 0, 'Montaż lampy na suficie powyżej 2,5m - wymaga rusztowania'),
  ('Montaż oprawy halogenowej wpuszczanej (spot)', 'labor', cat_oswietlenie_id, 'szt', 85.00, 0, 'Montaż punktowego oświetlenia wpuszczanego'),
  ('Montaż lampy wiszacej (żyrandol lekki)', 'labor', cat_oswietlenie_id, 'szt', 130.00, 0, 'Montaż żyrandola do 5kg'),
  ('Montaż lampy wiszącej (żyrandol ciężki)', 'labor', cat_oswietlenie_id, 'szt', 200.00, 0, 'Montaż żyrandola powyżej 5kg - wzmocnienie mocowania'),
  ('Montaż kinkietu ściennego', 'labor', cat_oswietlenie_id, 'szt', 95.00, 0, 'Montaż lampy ściennej'),
  ('Montaż taśmy LED z zasilaczem', 'labor', cat_oswietlenie_id, 'mb', 45.00, 0, 'Montaż i podłączenie taśmy LED (cena za metr)'),
  ('Montaż profilu LED z dyfuzorem', 'labor', cat_oswietlenie_id, 'mb', 60.00, 0, 'Montaż profilu aluminiowego z taśmą LED'),
  ('Montaż oprawy LED panel 60x60', 'labor', cat_oswietlenie_id, 'szt', 120.00, 0, 'Montaż panelu LED kwadratowego'),
  ('Montaż oprawy liniowej LED 120cm', 'labor', cat_oswietlenie_id, 'szt', 95.00, 0, 'Montaż oprawy LED liniowej'),
  ('Montaż downlight LED wpuszczany', 'labor', cat_oswietlenie_id, 'szt', 75.00, 0, 'Montaż oprawy downlight wpuszczanej w sufit'),
  ('Montaż oświetlenia szynowego (track light)', 'labor', cat_oswietlenie_id, 'mb', 85.00, 0, 'Montaż systemu oświetlenia na szynie'),
  ('Montaż oświetlenia awaryjnego (exit)', 'labor', cat_oswietlenie_id, 'szt', 140.00, 0, 'Montaż lampy awaryjnej ewakuacyjnej'),

  -- Floorbox i puszki podłogowe
  ('Montaż floorbox''u podłogowego prostokątnego', 'labor', cat_instalacje_id, 'szt', 180.00, 0, 'Montaż puszki podłogowej z gniazdami'),
  ('Montaż floorbox''u podłogowego okrągłego', 'labor', cat_instalacje_id, 'szt', 160.00, 0, 'Montaż okrągłej puszki podłogowej'),
  ('Montaż kolumny biurowej (gniazda + USB)', 'labor', cat_instalacje_id, 'szt', 220.00, 0, 'Montaż kolumny z gniazdami dla biurek'),

  -- Okablowanie
  ('Układanie przewodu w bruździe (za mb)', 'labor', cat_okablowanie_id, 'mb', 15.00, 0, 'Ułożenie kabla w przygotowanej bruździe'),
  ('Układanie przewodu w korytku PCV', 'labor', cat_okablowanie_id, 'mb', 18.00, 0, 'Ułożenie kabla w korytku kablowym'),
  ('Układanie przewodu w rurze karbowanej', 'labor', cat_okablowanie_id, 'mb', 20.00, 0, 'Przepuszczenie kabla przez rurę ochronną'),
  ('Bruzdowanie ściany ceglane (do 2cm)', 'labor', cat_instalacje_id, 'mb', 35.00, 0, 'Wykucie bruzdy w murze ceglanym'),
  ('Bruzdowanie betonu (do 2cm)', 'labor', cat_instalacje_id, 'mb', 55.00, 0, 'Wykucie bruzdy w betonie - trudniejsze'),
  ('Wykucie otworu na puszkę podtynkową (cegła)', 'labor', cat_instalacje_id, 'szt', 25.00, 0, 'Wykonanie otworu 60mm na puszkę'),
  ('Wykucie otworu na puszkę podtynkową (beton)', 'labor', cat_instalacje_id, 'szt', 40.00, 0, 'Wykonanie otworu 60mm w betonie'),
  ('Montaż puszki instalacyjnej podtynkowej', 'labor', cat_instalacje_id, 'szt', 15.00, 0, 'Osadzenie puszki w ścianie'),
  ('Montaż koryta kablowego stalowego 100mm', 'labor', cat_okablowanie_id, 'mb', 40.00, 0, 'Montaż korytka kablowego stalowego'),
  ('Montaż drabinki kablowej stalowej 200mm', 'labor', cat_okablowanie_id, 'mb', 60.00, 0, 'Montaż drabinki kablowej dla hal'),
  ('Montaż listwy kablowej PCV', 'labor', cat_okablowanie_id, 'mb', 25.00, 0, 'Montaż listwy instalacyjnej naściennej')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- ============================================================================
  -- 2. ROBOCIZNA - ROZDZIELNICE I TABLICE
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Montaż rozdzielnicy 8-12 modułów (podtynkowa)', 'labor', cat_rozdzielnice_id, 'szt', 200.00, 0, 'Montaż małej rozdzielnicy z osadzeniem'),
  ('Montaż rozdzielnicy 12-24 moduły (podtynkowa)', 'labor', cat_rozdzielnice_id, 'szt', 230.00, 0, 'Montaż średniej rozdzielnicy'),
  ('Montaż rozdzielnicy 36-48 modułów (natynkowa)', 'labor', cat_rozdzielnice_id, 'szt', 290.00, 0, 'Montaż dużej rozdzielnicy natynkowej'),
  ('Montaż rozdzielnicy 56-104 moduły (natynkowa)', 'labor', cat_rozdzielnice_id, 'szt', 380.00, 0, 'Montaż bardzo dużej rozdzielnicy'),
  ('Wymiana rozdzielnicy na nową (z przełączeniem)', 'labor', cat_rozdzielnice_id, 'szt', 450.00, 0, 'Demontaż starej i montaż nowej rozdzielnicy'),
  ('Rozbudowa rozdzielnicy (dodanie modułów)', 'labor', cat_rozdzielnice_id, 'kpl', 180.00, 0, 'Powiększenie istniejącej rozdzielnicy'),
  ('Montaż skrzynki elektrycznej licznikowej', 'labor', cat_rozdzielnice_id, 'szt', 250.00, 0, 'Montaż skrzynki dla licznika energii'),
  ('Montaż tablicy rozdzielczej przemysłowej (wieloobwodowa)', 'labor', cat_rozdzielnice_id, 'szt', 650.00, 0, 'Montaż dużej tablicy wieloobwodowej dla hali'),
  
  -- Elementy rozdzielnic
  ('Montaż wyłącznika nadprądowego 1P (MCB)', 'labor', cat_rozdzielnice_id, 'szt', 35.00, 0, 'Montaż pojedynczego automatu'),
  ('Montaż wyłącznika nadprądowego 3P (MCB)', 'labor', cat_rozdzielnice_id, 'szt', 45.00, 0, 'Montaż automatu trójfazowego'),
  ('Montaż wyłącznika różnicowoprądowego 2P (RCD)', 'labor', cat_rozdzielnice_id, 'szt', 55.00, 0, 'Montaż wyłącznika różnicowego 30mA'),
  ('Montaż wyłącznika różnicowoprądowego 4P (RCD)', 'labor', cat_rozdzielnice_id, 'szt', 70.00, 0, 'Montaż wyłącznika różnicowo-prądowego 4P'),
  ('Montaż wyłącznika różnicowo-nadprądowego (RCBO)', 'labor', cat_rozdzielnice_id, 'szt', 65.00, 0, 'Montaż kombinowanego wyłącznika'),
  ('Montaż rozłącznika głównego', 'labor', cat_rozdzielnice_id, 'szt', 85.00, 0, 'Montaż głównego wyłącznika zasilania'),
  ('Montaż ogranicznika przepięć (SPD)', 'labor', cat_rozdzielnice_id, 'szt', 95.00, 0, 'Montaż ochrony przeciwprzepięciowej'),
  ('Montaż przekaźnika zmierzchowego', 'labor', cat_rozdzielnice_id, 'szt', 75.00, 0, 'Montaż przekaźnika świetlnego w rozdzielnicy'),
  ('Montaż przekaźnika czasowego', 'labor', cat_rozdzielnice_id, 'szt', 75.00, 0, 'Montaż timera w rozdzielnicy'),
  ('Montaż licznika energii 1-fazowego', 'labor', cat_rozdzielnice_id, 'szt', 120.00, 0, 'Montaż licznika jednofazowego'),
  ('Montaż licznika energii 3-fazowego', 'labor', cat_rozdzielnice_id, 'szt', 150.00, 0, 'Montaż licznika trójfazowego'),
  ('Podłączenie przewodów do rozdzielnicy (1 obwód)', 'labor', cat_rozdzielnice_id, 'obw', 45.00, 0, 'Podłączenie jednego obwodu w rozdzielnicy'),
  ('Opisanie i oznakowanie obwodów w rozdzielnicy', 'labor', cat_rozdzielnice_id, 'kpl', 80.00, 0, 'Wykonanie opisów wszystkich obwodów')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- ============================================================================
  -- 3. ROBOCIZNA - URZĄDZENIA I SPRZĘT AGD
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Podłączenie płyty indukcyjnej', 'labor', cat_instalacje_id, 'szt', 210.00, 0, 'Podłączenie płyty indukcyjnej do zasilania'),
  ('Podłączenie piekarnika elektrycznego', 'labor', cat_instalacje_id, 'szt', 180.00, 0, 'Podłączenie piekarnika do instalacji'),
  ('Podłączenie kuchenki elektrycznej (płyta+piekarnik)', 'labor', cat_instalacje_id, 'szt', 250.00, 0, 'Podłączenie pełnej kuchenki elektrycznej'),
  ('Podłączenie zmywarki', 'labor', cat_instalacje_id, 'szt', 95.00, 0, 'Podłączenie zmywarki do gniazdka'),
  ('Podłączenie pralki', 'labor', cat_instalacje_id, 'szt', 85.00, 0, 'Podłączenie pralki do gniazdka'),
  ('Podłączenie lodówki/zamrażarki', 'labor', cat_instalacje_id, 'szt', 75.00, 0, 'Podłączenie lodówki'),
  ('Podłączenie okapu kuchennego', 'labor', cat_instalacje_id, 'szt', 95.00, 0, 'Podłączenie okapu z montażem elektrycznym'),
  ('Podłączenie bojlera elektrycznego', 'labor', cat_instalacje_id, 'szt', 180.00, 0, 'Podłączenie podgrzewacza wody'),
  ('Podłączenie pompy ciepła', 'labor', cat_instalacje_id, 'szt', 450.00, 0, 'Podłączenie elektryczne pompy ciepła'),
  ('Podłączenie klimatyzacji split', 'labor', cat_instalacje_id, 'szt', 220.00, 0, 'Podłączenie jednostki klimatyzacji'),
  ('Podłączenie grzejnika elektrycznego', 'labor', cat_instalacje_id, 'szt', 110.00, 0, 'Montaż i podłączenie grzejnika'),
  ('Podłączenie ogrzewania podłogowego (termostat)', 'labor', cat_instalacje_id, 'szt', 150.00, 0, 'Montaż termostatu i podłączenie mat'),
  ('Podłączenie rolety elektrycznej', 'labor', cat_automatyka_id, 'szt', 140.00, 0, 'Podłączenie sterowania roletą'),
  ('Podłączenie bramy garażowej (napęd)', 'labor', cat_automatyka_id, 'szt', 250.00, 0, 'Podłączenie napędu bramy'),
  ('Podłączenie domofonu/wideofonu', 'labor', cat_instalacje_id, 'szt', 180.00, 0, 'Montaż i podłączenie domofonu')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- ============================================================================
  -- 4. ROBOCIZNA - SMART HOME & AUTOMATYKA KNX
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Projekt systemu Smart Home (do 100m²)', 'labor', cat_smart_home_id, 'kpl', 2500.00, 0, 'Projektowanie systemu inteligentnego domu'),
  ('Projekt systemu Smart Home (100-200m²)', 'labor', cat_smart_home_id, 'kpl', 4500.00, 0, 'Projekt Smart Home dla większego domu'),
  ('Projekt systemu Smart Home (powyżej 200m²)', 'labor', cat_smart_home_id, 'kpl', 7500.00, 0, 'Projekt Smart Home dla dużego domu'),
  ('Okablowanie magistrali KNX (za mb)', 'labor', cat_smart_home_id, 'mb', 35.00, 0, 'Ułożenie kabla KNX Bus'),
  ('Montaż modułu KNX w rozdzielnicy', 'labor', cat_smart_home_id, 'szt', 180.00, 0, 'Montaż urządzenia KNX w tablicy'),
  ('Montaż przycisków dotykowych KNX', 'labor', cat_smart_home_id, 'szt', 120.00, 0, 'Montaż panelu sterującego KNX'),
  ('Programowanie systemu KNX (ETS) - podstawowe', 'labor', cat_smart_home_id, 'godz', 250.00, 0, 'Programowanie KNX za godzinę'),
  ('Montaż bramki KNX IP (router)', 'labor', cat_smart_home_id, 'szt', 220.00, 0, 'Montaż i konfiguracja routera KNX-IP'),
  ('Montaż czujnika obecności KNX', 'labor', cat_smart_home_id, 'szt', 150.00, 0, 'Montaż czujnika ruchu KNX'),
  ('Montaż termostatu pokojowego KNX', 'labor', cat_smart_home_id, 'szt', 160.00, 0, 'Montaż regulatora temperatury KNX'),
  ('Integracja z systemem audio multiroom', 'labor', cat_smart_home_id, 'kpl', 1200.00, 0, 'Integracja KNX z systemem dźwięku'),
  ('Montaż sterownika RGB LED (Smart Home)', 'labor', cat_smart_home_id, 'szt', 140.00, 0, 'Montaż kontrolera taśm LED RGB'),
  ('Montaż inteligentnej gniazdka WiFi/Zigbee', 'labor', cat_smart_home_id, 'szt', 45.00, 0, 'Montaż smart gniazdka'),
  ('Montaż inteligentnego włącznika WiFi/Zigbee', 'labor', cat_smart_home_id, 'szt', 55.00, 0, 'Montaż smart włącznika'),
  ('Konfiguracja systemu Loxone (podstawowa)', 'labor', cat_smart_home_id, 'kpl', 1800.00, 0, 'Podstawowa konfiguracja Loxone'),
  ('Konfiguracja systemu Control4', 'labor', cat_smart_home_id, 'kpl', 2200.00, 0, 'Konfiguracja systemu Control4'),
  ('Montaż serwera domowego (home server)', 'labor', cat_smart_home_id, 'szt', 450.00, 0, 'Instalacja centralnego serwera Smart Home'),
  ('Uruchomienie i szkolenie użytkownika (Smart Home)', 'labor', cat_smart_home_id, 'godz', 180.00, 0, 'Szkolenie z obsługi systemu')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- ============================================================================
  -- 5. ROBOCIZNA - OŚWIETLENIE PRZEMYSŁOWE (Hale, magazyny)
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Montaż oprawy LED High-Bay 100W (do 6m)', 'labor', cat_led_przemyslowe_id, 'szt', 180.00, 0, 'Montaż przemysłowej oprawy LED do 6m'),
  ('Montaż oprawy LED High-Bay 150W (6-10m)', 'labor', cat_led_przemyslowe_id, 'szt', 220.00, 0, 'Montaż oprawy LED do 10m wysokości'),
  ('Montaż oprawy LED High-Bay 200W (powyżej 10m)', 'labor', cat_led_przemyslowe_id, 'szt', 280.00, 0, 'Montaż oprawy LED powyżej 10m'),
  ('Montaż oprawy LED liniowej 1200mm (hala)', 'labor', cat_led_przemyslowe_id, 'szt', 110.00, 0, 'Montaż oprawy liniowej LED 120cm'),
  ('Montaż oprawy LED liniowej 1500mm (hala)', 'labor', cat_led_przemyslowe_id, 'szt', 125.00, 0, 'Montaż oprawy liniowej LED 150cm'),
  ('Montaż oprawy hermetycznej LED IP65', 'labor', cat_led_przemyslowe_id, 'szt', 140.00, 0, 'Montaż oprawy wodoodpornej'),
  ('Montaż oprawy przeciwwybuchowej Ex (ATEX)', 'labor', cat_led_przemyslowe_id, 'szt', 320.00, 0, 'Montaż oprawy do stref zagrożonych'),
  ('Montaż linii świetlnych (busbar lighting)', 'labor', cat_led_przemyslowe_id, 'mb', 95.00, 0, 'Montaż szyny oświetleniowej z gniazdkami'),
  ('Montaż reflektora LED halogenowego 50W', 'labor', cat_led_przemyslowe_id, 'szt', 130.00, 0, 'Montaż reflektora zewnętrznego'),
  ('Montaż reflektora LED halogenowego 100W', 'labor', cat_led_przemyslowe_id, 'szt', 150.00, 0, 'Montaż dużego reflektora LED'),
  ('Montaż oprawy LED z czujnikiem ruchu (hala)', 'labor', cat_led_przemyslowe_id, 'szt', 190.00, 0, 'Montaż oprawy z automatyką'),
  ('Montaż systemu oświetlenia ewakuacyjnego (hala)', 'labor', cat_led_przemyslowe_id, 'kpl', 1800.00, 0, 'Kompleksowy system awaryjny'),
  ('Montaż lampki sygnalizacyjnej LED', 'labor', cat_led_przemyslowe_id, 'szt', 75.00, 0, 'Montaż lampki ostrzegawczej'),
  ('Montaż oświetlenia liniowego LED nad stanowiskiem', 'labor', cat_led_przemyslowe_id, 'mb', 85.00, 0, 'Oświetlenie stanowiska roboczego')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- ============================================================================
  -- 6. ROBOCIZNA - POMIARY I BADANIA
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Pomiar rezystancji izolacji instalacji', 'labor', cat_pomiary_id, 'obw', 25.00, 0, 'Pomiar izolacji jednego obwodu'),
  ('Pomiar rezystancji uziemienia', 'labor', cat_pomiary_id, 'szt', 80.00, 0, 'Pomiar rezystancji ziemi'),
  ('Pomiar impedancji pętli zwarciowej', 'labor', cat_pomiary_id, 'obw', 30.00, 0, 'Pomiar impedancji obwodu'),
  ('Pomiar skuteczności wyłącznika RCD', 'labor', cat_pomiary_id, 'szt', 25.00, 0, 'Test czasu zadziałania RCD'),
  ('Pomiar napięcia dotykowego', 'labor', cat_pomiary_id, 'punkt', 35.00, 0, 'Pomiar napięć dotykowych'),
  ('Pomiar ciągłości przewodów ochronnych', 'labor', cat_pomiary_id, 'obw', 20.00, 0, 'Sprawdzenie ciągłości PE'),
  ('Pomiary termowizyjne instalacji', 'labor', cat_pomiary_id, 'kpl', 150.00, 0, 'Diagnostyka termowizyjna'),
  ('Protokół pomiarowy z opisem (komplet)', 'labor', cat_pomiary_id, 'kpl', 180.00, 0, 'Sporządzenie pełnej dokumentacji pomiarowej'),
  ('Odbiór techniczny instalacji elektrycznej', 'labor', cat_pomiary_id, 'kpl', 500.00, 0, 'Kompleksowy odbiór z protokołami'),
  ('Pomiar jakości energii (analizator sieci)', 'labor', cat_pomiary_id, 'doba', 350.00, 0, 'Analiza jakości zasilania - doba')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- ============================================================================
  -- 7. ROBOCIZNA - PRACE INSTALACYJNE (Nowe obwody, przyłącza)
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Wykonanie nowego obwodu gniazd 230V', 'labor', cat_instalacje_id, 'obw', 180.00, 0, 'Wykonanie kompletnego obwodu gniazdkowego'),
  ('Wykonanie nowego obwodu oświetlenia', 'labor', cat_instalacje_id, 'obw', 160.00, 0, 'Wykonanie obwodu oświetleniowego'),
  ('Wykonanie obwodu siłowego 400V 16A', 'labor', cat_instalacje_id, 'obw', 280.00, 0, 'Obwód trójfazowy dla maszyn'),
  ('Wykonanie obwodu siłowego 400V 32A', 'labor', cat_instalacje_id, 'obw', 350.00, 0, 'Obwód trójfazowy 32A'),
  ('Wymiana całej instalacji w mieszkaniu (za m²)', 'labor', cat_instalacje_id, 'm2', 85.00, 0, 'Kompleksowa wymiana instalacji'),
  ('Rozbudowa istniejącej instalacji (dodanie obwodu)', 'labor', cat_instalacje_id, 'obw', 220.00, 0, 'Dodanie nowego obwodu do istniejącej instalacji'),
  ('Podłączenie domu do sieci energetycznej', 'labor', cat_instalacje_id, 'kpl', 1500.00, 0, 'Wykonanie przyłącza energetycznego'),
  ('Montaż złącza kablowego głównego', 'labor', cat_instalacje_id, 'szt', 450.00, 0, 'Montaż głównego złącza kablowego'),
  ('Przeciągnięcie kabla przez rurę (za mb)', 'labor', cat_okablowanie_id, 'mb', 12.00, 0, 'Przeciąganie przewodu przez instalacje'),
  ('Montaż opaski zaciskowej (opaska kablowa)', 'labor', cat_okablowanie_id, '100szt', 25.00, 0, 'Mocowanie kabli opaski (za 100szt)')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano część 1 - robocizna podstawowa i montaż';

END $$;
