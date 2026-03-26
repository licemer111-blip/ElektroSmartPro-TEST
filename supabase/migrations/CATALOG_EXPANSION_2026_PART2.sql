-- ============================================================================
-- CATALOG EXPANSION 2026 - PART 2: DEMONTAŻ I MATERIAŁY
-- ============================================================================
-- Demontaż wszystkich elementów + materiały dla różnych obiektów
-- ============================================================================

DO $$
DECLARE
  cat_instalacje_id UUID;
  cat_oswietlenie_id UUID;
  cat_rozdzielnice_id UUID;
  cat_automatyka_id UUID;
  cat_okablowanie_id UUID;
  cat_osprzet_id UUID;
  cat_smart_home_id UUID;
  cat_led_przemyslowe_id UUID;
  cat_demontaz_id UUID;
  cat_kable_id UUID;
BEGIN
  -- Получаем категории
  SELECT id INTO cat_instalacje_id FROM catalog_categories WHERE name = 'Instalacje elektryczne' LIMIT 1;
  SELECT id INTO cat_oswietlenie_id FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_rozdzielnice_id FROM catalog_categories WHERE name = 'Rozdzielnice i tablice' LIMIT 1;
  SELECT id INTO cat_automatyka_id FROM catalog_categories WHERE name = 'Automatyka' LIMIT 1;
  SELECT id INTO cat_okablowanie_id FROM catalog_categories WHERE name = 'Okablowanie strukturalne' LIMIT 1;
  SELECT id INTO cat_osprzet_id FROM catalog_categories WHERE name = 'Osprzęt elektryczny' LIMIT 1;
  SELECT id INTO cat_smart_home_id FROM catalog_categories WHERE name = 'Smart Home & KNX' LIMIT 1;
  SELECT id INTO cat_led_przemyslowe_id FROM catalog_categories WHERE name = 'Oświetlenie przemysłowe LED' LIMIT 1;
  SELECT id INTO cat_demontaz_id FROM catalog_categories WHERE name = 'Demontaż instalacji' LIMIT 1;

  -- Kategoria kabli
  SELECT id INTO cat_kable_id FROM catalog_categories WHERE name = 'Kable i przewody' LIMIT 1;
  IF cat_kable_id IS NULL THEN
    INSERT INTO catalog_categories (name)
    VALUES ('Kable i przewody')
    RETURNING id INTO cat_kable_id;
  END IF;

  -- ============================================================================
  -- 1. DEMONTAŻ - PUNKTY ELEKTRYCZNE
  -- ============================================================================
  
  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description) VALUES
  
  ('Demontaż gniazdka pojedynczego 230V', 'labor', cat_demontaz_id, 'szt', 35.00, 0, 'Demontaż i odłączenie gniazdka'),
  ('Demontaż gniazdka podwójnego/potrójnego', 'labor', cat_demontaz_id, 'szt', 40.00, 0, 'Demontaż gniazdka wielokrotnego'),
  ('Demontaż gniazdka siłowego 400V', 'labor', cat_demontaz_id, 'szt', 75.00, 0, 'Demontaż gniazdka trójfazowego'),
  ('Demontaż gniazdka natynkowego', 'labor', cat_demontaz_id, 'szt', 25.00, 0, 'Demontaż gniazdka natynkowego'),
  ('Demontaż włącznika/łącznika', 'labor', cat_demontaz_id, 'szt', 30.00, 0, 'Demontaż wyłącznika światła'),
  ('Demontaż ściemniacza (dimmer)', 'labor', cat_demontaz_id, 'szt', 40.00, 0, 'Demontaż regulatora światła'),
  ('Demontaż włącznika z czujnikiem ruchu', 'labor', cat_demontaz_id, 'szt', 50.00, 0, 'Demontaż włącznika automatycznego'),
  ('Demontaż puszki instalacyjnej', 'labor', cat_demontaz_id, 'szt', 15.00, 0, 'Wyłamanie puszki ze ściany'),
  
  -- Demontaż oświetlenia
  ('Demontaż oprawy oświetleniowej sufitowej', 'labor', cat_demontaz_id, 'szt', 45.00, 0, 'Demontaż lampy sufitowej'),
  ('Demontaż oprawy halogenowej wpuszczanej', 'labor', cat_demontaz_id, 'szt', 35.00, 0, 'Demontaż spota'),
  ('Demontaż lampy wiszącej (żyrandol)', 'labor', cat_demontaz_id, 'szt', 65.00, 0, 'Demontaż żyrandola'),
  ('Demontaż kinkietu ściennego', 'labor', cat_demontaz_id, 'szt', 40.00, 0, 'Demontaż lampy ściennej'),
  ('Demontaż taśmy LED z profilem', 'labor', cat_demontaz_id, 'mb', 20.00, 0, 'Demontaż taśmy LED (za mb)'),
  ('Demontaż oprawy LED panel', 'labor', cat_demontaz_id, 'szt', 50.00, 0, 'Demontaż panelu LED'),
  ('Demontaż oprawy liniowej LED', 'labor', cat_demontaz_id, 'szt', 40.00, 0, 'Demontaż oprawy liniowej'),
  ('Demontaż downlight LED', 'labor', cat_demontaz_id, 'szt', 30.00, 0, 'Demontaż downlight'),
  ('Demontaż oświetlenia szynowego', 'labor', cat_demontaz_id, 'mb', 35.00, 0, 'Demontaż track light'),
  ('Demontaż oświetlenia awaryjnego', 'labor', cat_demontaz_id, 'szt', 55.00, 0, 'Demontaż lampy exit'),
  
  -- Demontaż floorbox i kolumn
  ('Demontaż floorbox''u podłogowego', 'labor', cat_demontaz_id, 'szt', 95.00, 0, 'Demontaż puszki podłogowej'),
  ('Demontaż kolumny biurowej', 'labor', cat_demontaz_id, 'szt', 110.00, 0, 'Demontaż kolumny z gniazdami'),

  -- ============================================================================
  -- 2. DEMONTAŻ - ROZDZIELNICE I TABLICE
  -- ============================================================================
  
  ('Demontaż rozdzielnicy małej (do 24 mod.)', 'labor', cat_demontaz_id, 'szt', 120.00, 0, 'Demontaż małej rozdzielnicy'),
  ('Demontaż rozdzielnicy średniej (24-48 mod.)', 'labor', cat_demontaz_id, 'szt', 150.00, 0, 'Demontaż średniej rozdzielnicy'),
  ('Demontaż rozdzielnicy dużej (powyżej 48 mod.)', 'labor', cat_demontaz_id, 'szt', 200.00, 0, 'Demontaż dużej rozdzielnicy'),
  ('Demontaż tablicy rozdzielczej przemysłowej', 'labor', cat_demontaz_id, 'szt', 350.00, 0, 'Demontaż dużej tablicy'),
  ('Demontaż skrzynki licznikowej', 'labor', cat_demontaz_id, 'szt', 130.00, 0, 'Demontaż skrzynki z licznikiem'),
  ('Demontaż wyłącznika nadprądowego (MCB)', 'labor', cat_demontaz_id, 'szt', 15.00, 0, 'Demontaż automatu'),
  ('Demontaż wyłącznika różnicowoprądowego (RCD)', 'labor', cat_demontaz_id, 'szt', 25.00, 0, 'Demontaż wyłącznika różnicowego'),
  ('Demontaż licznika energii', 'labor', cat_demontaz_id, 'szt', 65.00, 0, 'Demontaż licznika'),

  -- ============================================================================
  -- 3. DEMONTAŻ - OKABLOWANIE I INSTALACJE
  -- ============================================================================
  
  ('Demontaż przewodu z bruzdy (za mb)', 'labor', cat_demontaz_id, 'mb', 8.00, 0, 'Wyciągniecie kabla z bruzdy'),
  ('Demontaż przewodu z koryta/listwy', 'labor', cat_demontaz_id, 'mb', 10.00, 0, 'Usunięcie kabla z koryta'),
  ('Demontaż koryta kablowego PCV', 'labor', cat_demontaz_id, 'mb', 12.00, 0, 'Demontaż korytka kablowego'),
  ('Demontaż koryta kablowego stalowego', 'labor', cat_demontaz_id, 'mb', 20.00, 0, 'Demontaż stalowego korytka'),
  ('Demontaż drabinki kablowej', 'labor', cat_demontaz_id, 'mb', 30.00, 0, 'Demontaż drabinki kablowej'),
  ('Demontaż listwy kablowej', 'labor', cat_demontaz_id, 'mb', 15.00, 0, 'Demontaż listwy instalacyjnej'),
  ('Demontaż rury karbowanej', 'labor', cat_demontaz_id, 'mb', 10.00, 0, 'Demontaż rury ochronnej'),
  ('Likwidacja obwodu elektrycznego', 'labor', cat_demontaz_id, 'obw', 85.00, 0, 'Całkowita likwidacja obwodu z odłączeniem'),

  -- ============================================================================
  -- 4. DEMONTAŻ - URZĄDZENIA I SPRZĘT
  -- ============================================================================
  
  ('Odłączenie płyty indukcyjnej', 'labor', cat_demontaz_id, 'szt', 95.00, 0, 'Odłączenie płyty od zasilania'),
  ('Odłączenie piekarnika elektrycznego', 'labor', cat_demontaz_id, 'szt', 80.00, 0, 'Odłączenie piekarnika'),
  ('Odłączenie kuchenki elektrycznej', 'labor', cat_demontaz_id, 'szt', 110.00, 0, 'Odłączenie pełnej kuchenki'),
  ('Odłączenie zmywarki/pralki', 'labor', cat_demontaz_id, 'szt', 45.00, 0, 'Odłączenie AGD'),
  ('Odłączenie okapu kuchennego', 'labor', cat_demontaz_id, 'szt', 50.00, 0, 'Odłączenie okapu'),
  ('Odłączenie bojlera elektrycznego', 'labor', cat_demontaz_id, 'szt', 95.00, 0, 'Odłączenie podgrzewacza'),
  ('Odłączenie pompy ciepła', 'labor', cat_demontaz_id, 'szt', 250.00, 0, 'Odłączenie pompy ciepła'),
  ('Odłączenie klimatyzacji', 'labor', cat_demontaz_id, 'szt', 110.00, 0, 'Odłączenie jednostki klimy'),
  ('Odłączenie grzejnika elektrycznego', 'labor', cat_demontaz_id, 'szt', 55.00, 0, 'Demontaż grzejnika'),
  ('Demontaż termostatu ogrzewania podłogowego', 'labor', cat_demontaz_id, 'szt', 65.00, 0, 'Demontaż termostatu'),
  ('Odłączenie rolety elektrycznej', 'labor', cat_demontaz_id, 'szt', 70.00, 0, 'Odłączenie napędu rolety'),
  ('Odłączenie bramy garażowej', 'labor', cat_demontaz_id, 'szt', 130.00, 0, 'Odłączenie napędu bramy'),
  ('Demontaż domofonu/wideofonu', 'labor', cat_demontaz_id, 'szt', 90.00, 0, 'Demontaż domofonu'),

  -- ============================================================================
  -- 5. DEMONTAŻ - OŚWIETLENIE PRZEMYSŁOWE
  -- ============================================================================
  
  ('Demontaż oprawy LED High-Bay (do 6m)', 'labor', cat_demontaz_id, 'szt', 85.00, 0, 'Demontaż przemysłowej oprawy LED'),
  ('Demontaż oprawy LED High-Bay (6-10m)', 'labor', cat_demontaz_id, 'szt', 110.00, 0, 'Demontaż oprawy z wysokości'),
  ('Demontaż oprawy LED High-Bay (powyżej 10m)', 'labor', cat_demontaz_id, 'szt', 150.00, 0, 'Demontaż oprawy z dużej wysokości'),
  ('Demontaż oprawy liniowej LED (hala)', 'labor', cat_demontaz_id, 'szt', 50.00, 0, 'Demontaż oprawy liniowej'),
  ('Demontaż oprawy hermetycznej', 'labor', cat_demontaz_id, 'szt', 60.00, 0, 'Demontaż oprawy IP65'),
  ('Demontaż reflektora LED', 'labor', cat_demontaz_id, 'szt', 65.00, 0, 'Demontaż reflektora'),
  ('Demontaż linii świetlnych (busbar)', 'labor', cat_demontaz_id, 'mb', 40.00, 0, 'Demontaż szyny oświetleniowej'),

  -- ============================================================================
  -- 6. DEMONTAŻ - SMART HOME & KNX
  -- ============================================================================
  
  ('Demontaż modułu KNX z rozdzielnicy', 'labor', cat_demontaz_id, 'szt', 90.00, 0, 'Demontaż urządzenia KNX'),
  ('Demontaż przycisków dotykowych KNX', 'labor', cat_demontaz_id, 'szt', 60.00, 0, 'Demontaż panelu KNX'),
  ('Demontaż bramki KNX IP', 'labor', cat_demontaz_id, 'szt', 110.00, 0, 'Demontaż routera KNX'),
  ('Demontaż czujnika KNX', 'labor', cat_demontaz_id, 'szt', 75.00, 0, 'Demontaż czujnika KNX'),
  ('Demontaż inteligentnego gniazdka/włącznika', 'labor', cat_demontaz_id, 'szt', 35.00, 0, 'Demontaż smart device'),
  ('Demontaż serwera domowego', 'labor', cat_demontaz_id, 'szt', 200.00, 0, 'Demontaż home server'),

  -- ============================================================================
  -- 7. DEMONTAŻ - LIKWIDACJA INSTALACJI
  -- ============================================================================
  
  ('Likwidacja całej instalacji elektrycznej (za m²)', 'labor', cat_demontaz_id, 'm2', 35.00, 0, 'Kompleksowy demontaż instalacji'),
  ('Likwidacja starej instalacji (bez odnowienia)', 'labor', cat_demontaz_id, 'kpl', 800.00, 0, 'Demontaż starej instalacji w mieszkaniu'),
  ('Wykuwanie bruzd pod demontaż', 'labor', cat_demontaz_id, 'mb', 15.00, 0, 'Odsłonięcie przewodów w ścianie'),
  ('Usunięcie przewodów z betonu', 'labor', cat_demontaz_id, 'mb', 25.00, 0, 'Wyciąganie kabli z betonu'),
  ('Transport i utylizacja odpadów elektrycznych', 'labor', cat_demontaz_id, 'kpl', 200.00, 0, 'Wywóz złomu i odpadów')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano demontaże - część 2a';

  -- ============================================================================
  -- 8. MATERIAŁY - GNIAZDKA I WŁĄCZNIKI (Osprzęt)
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Gniazdka podstawowe
  ('Gniazdko 230V pojedyncze (uziemione) Basic', 'material', cat_osprzet_id, 'szt', 0, 15.00, 'Gniazdko podstawowe białe', 'Gniazdka 230V'),
  ('Gniazdko 230V pojedyncze (uziemione) Premium', 'material', cat_osprzet_id, 'szt', 0, 35.00, 'Gniazdko marki Legrand/Schneider', 'Gniazdka 230V'),
  ('Gniazdko 230V podwójne Basic', 'material', cat_osprzet_id, 'szt', 0, 22.00, 'Gniazdko podwójne białe', 'Gniazdka 230V'),
  ('Gniazdko 230V podwójne Premium', 'material', cat_osprzet_id, 'szt', 0, 45.00, 'Gniazdko podwójne Legrand', 'Gniazdka 230V'),
  ('Gniazdko 230V potrójne', 'material', cat_osprzet_id, 'szt', 0, 55.00, 'Gniazdko potrójne', 'Gniazdka 230V'),
  ('Gniazdko hermetyczne IP44 (łazienka)', 'material', cat_osprzet_id, 'szt', 0, 28.00, 'Gniazdko z klapką do łazienki', 'Gniazdka 230V'),
  ('Gniazdko z USB typu A+C', 'material', cat_osprzet_id, 'szt', 0, 65.00, 'Gniazdko z portami USB', 'Gniazdka 230V'),
  ('Gniazdko z USB Quick Charge', 'material', cat_osprzet_id, 'szt', 0, 85.00, 'Gniazdko z szybkim ładowaniem USB', 'Gniazdka 230V'),
  
  -- Gniazdka siłowe
  ('Gniazdko siłowe 400V 16A (3P+N+PE)', 'material', cat_osprzet_id, 'szt', 0, 140.00, 'Gniazdko trójfazowe 16A', 'Gniazdka siłowe'),
  ('Gniazdko siłowe 400V 32A (3P+N+PE)', 'material', cat_osprzet_id, 'szt', 0, 180.00, 'Gniazdko trójfazowe 32A', 'Gniazdka siłowe'),
  ('Gniazdko siłowe 400V 63A (3P+N+PE)', 'material', cat_osprzet_id, 'szt', 0, 280.00, 'Gniazdko trójfazowe 63A', 'Gniazdka siłowe'),
  ('Wtyczka siłowa 400V 16A', 'material', cat_osprzet_id, 'szt', 0, 45.00, 'Wtyczka trójfazowa 16A', 'Gniazdka siłowe'),
  ('Wtyczka siłowa 400V 32A', 'material', cat_osprzet_id, 'szt', 0, 85.00, 'Wtyczka trójfazowa 32A', 'Gniazdka siłowe'),
  
  -- Włączniki
  ('Włącznik pojedynczy Basic', 'material', cat_osprzet_id, 'szt', 0, 12.00, 'Włącznik światła podstawowy', 'Włączniki i łączniki'),
  ('Włącznik pojedynczy Premium', 'material', cat_osprzet_id, 'szt', 0, 28.00, 'Włącznik Legrand/Schneider', 'Włączniki i łączniki'),
  ('Włącznik podwójny (schodowy)', 'material', cat_osprzet_id, 'szt', 0, 35.00, 'Włącznik schodowy', 'Włączniki i łączniki'),
  ('Włącznik krzyżowy', 'material', cat_osprzet_id, 'szt', 0, 42.00, 'Włącznik krzyżowy', 'Włączniki i łączniki'),
  ('Ściemniacz obrotowy 300W', 'material', cat_osprzet_id, 'szt', 0, 85.00, 'Dimmer obrotowy', 'Włączniki i łączniki'),
  ('Ściemniacz dotykowy LED', 'material', cat_osprzet_id, 'szt', 0, 120.00, 'Dimmer dotykowy dla LED', 'Włączniki i łączniki'),
  ('Włącznik z czujnikiem ruchu 180°', 'material', cat_osprzet_id, 'szt', 0, 95.00, 'Włącznik automatyczny PIR', 'Włączniki i łączniki'),
  ('Włącznik zmierzchowy', 'material', cat_osprzet_id, 'szt', 0, 75.00, 'Czujnik zmierzchowy', 'Włączniki i łączniki'),
  ('Włącznik czasowy (timer)', 'material', cat_osprzet_id, 'szt', 0, 68.00, 'Timer elektroniczny', 'Włączniki i łączniki'),
  
  -- Puszki
  ('Puszka podtynkowa pojedyncza fi60', 'material', cat_osprzet_id, 'szt', 0, 2.50, 'Puszka instalacyjna 60mm', 'Puszki'),
  ('Puszka podtynkowa podwójna', 'material', cat_osprzet_id, 'szt', 0, 4.00, 'Puszka instalacyjna x2', 'Puszki'),
  ('Puszka podtynkowa potrójna', 'material', cat_osprzet_id, 'szt', 0, 5.50, 'Puszka instalacyjna x3', 'Puszki'),
  ('Puszka natynkowa IP44', 'material', cat_osprzet_id, 'szt', 0, 8.00, 'Puszka hermetyczna', 'Puszki'),
  ('Puszka natynkowa podwójna', 'material', cat_osprzet_id, 'szt', 0, 12.00, 'Puszka natynkowa x2', 'Puszki'),
  ('Puszka rozgałęźna 100x100', 'material', cat_osprzet_id, 'szt', 0, 15.00, 'Puszka odgałęźna duża', 'Puszki')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano materiały osprzęt - część 2b';

END $$;
