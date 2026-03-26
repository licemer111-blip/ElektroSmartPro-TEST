-- ============================================================================
-- CATALOG EXPANSION 2026 - PART 4: OŚWIETLENIE LED, SMART HOME, FLOORBOX
-- ============================================================================
-- Ostatnia część: LED, KNX, floorbox'y, przemysłowe oprawy
-- ============================================================================

DO $$
DECLARE
  cat_oswietlenie_id UUID;
  cat_smart_home_id UUID;
  cat_led_przemyslowe_id UUID;
  cat_instalacje_id UUID;
  cat_osprzet_id UUID;
BEGIN
  SELECT id INTO cat_oswietlenie_id FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_smart_home_id FROM catalog_categories WHERE name = 'Smart Home & KNX' LIMIT 1;
  SELECT id INTO cat_led_przemyslowe_id FROM catalog_categories WHERE name = 'Oświetlenie przemysłowe LED' LIMIT 1;
  SELECT id INTO cat_instalacje_id FROM catalog_categories WHERE name = 'Instalacje elektryczne' LIMIT 1;
  SELECT id INTO cat_osprzet_id FROM catalog_categories WHERE name = 'Osprzęt elektryczny' LIMIT 1;

  -- ============================================================================
  -- 1. MATERIAŁY - OŚWIETLENIE LED (Mieszkania, Biura)
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Żarówki i źródła światła
  ('Żarówka LED E27 10W 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 12.00, 'Żarówka LED neutralna', 'Żarówki LED'),
  ('Żarówka LED E27 15W 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 18.00, 'Żarówka LED mocna', 'Żarówki LED'),
  ('Żarówka LED E14 6W 3000K', 'material', cat_oswietlenie_id, 'szt', 0, 10.00, 'Żarówka LED mała ciepła', 'Żarówki LED'),
  ('Żarówka LED GU10 5W 3000K', 'material', cat_oswietlenie_id, 'szt', 0, 9.00, 'Halogen LED ciepły', 'Żarówki LED'),
  ('Żarówka LED GU10 7W 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 11.00, 'Halogen LED neutralny', 'Żarówki LED'),
  ('Żarówka LED AR111 12W 3000K', 'material', cat_oswietlenie_id, 'szt', 0, 35.00, 'Halogen LED duży', 'Żarówki LED'),
  
  -- Oprawy LED wpuszczane
  ('Downlight LED 8W okrągły biały', 'material', cat_oswietlenie_id, 'szt', 0, 35.00, 'Oprawa wpuszczana LED 8W', 'Downlights LED'),
  ('Downlight LED 12W okrągły biały', 'material', cat_oswietlenie_id, 'szt', 0, 45.00, 'Oprawa wpuszczana LED 12W', 'Downlights LED'),
  ('Downlight LED 18W okrągły biały', 'material', cat_oswietlenie_id, 'szt', 0, 55.00, 'Oprawa wpuszczana LED 18W', 'Downlights LED'),
  ('Downlight LED 24W okrągły biały', 'material', cat_oswietlenie_id, 'szt', 0, 70.00, 'Oprawa wpuszczana LED 24W', 'Downlights LED'),
  ('Spot LED wpuszczany ruchomy GU10', 'material', cat_oswietlenie_id, 'szt', 0, 25.00, 'Spot regulowany', 'Downlights LED'),
  ('Oprawa halogenowa kwadratowa czarna', 'material', cat_oswietlenie_id, 'szt', 0, 22.00, 'Spot kwadratowy', 'Downlights LED'),
  
  -- Panele LED
  ('Panel LED 60x60cm 40W 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 85.00, 'Panel LED kwadratowy', 'Panele LED'),
  ('Panel LED 30x120cm 36W 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 110.00, 'Panel LED prostokątny', 'Panele LED'),
  ('Panel LED okrągły 18W wpuszczany', 'material', cat_oswietlenie_id, 'szt', 0, 55.00, 'Panel okrągły LED', 'Panele LED'),
  ('Panel LED okrągły 24W natynkowy', 'material', cat_oswietlenie_id, 'szt', 0, 65.00, 'Panel okrągły natynkowy', 'Panele LED'),
  
  -- Oprawy liniowe LED
  ('Oprawa liniowa LED 18W 60cm 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 45.00, 'Świetlówka LED 60cm', 'Oprawy liniowe LED'),
  ('Oprawa liniowa LED 36W 120cm 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 65.00, 'Świetlówka LED 120cm', 'Oprawy liniowe LED'),
  ('Oprawa liniowa LED 54W 150cm 4000K', 'material', cat_oswietlenie_id, 'szt', 0, 85.00, 'Świetlówka LED 150cm', 'Oprawy liniowe LED'),
  ('Oprawa hermetyczna LED 36W 120cm IP65', 'material', cat_oswietlenie_id, 'szt', 0, 95.00, 'Świetlówka LED wodoodporna', 'Oprawy liniowe LED'),
  
  -- Taśmy LED i akcesoria
  ('Taśma LED 12V 5m 4,8W/m IP20 (ciepła)', 'material', cat_oswietlenie_id, 'kpl', 0, 45.00, 'Taśma LED 5m ciepła', 'Taśmy LED'),
  ('Taśma LED 12V 5m 9,6W/m IP20 (neutralna)', 'material', cat_oswietlenie_id, 'kpl', 0, 65.00, 'Taśma LED 5m neutralna', 'Taśmy LED'),
  ('Taśma LED 12V 5m 14,4W/m IP20 (zimna)', 'material', cat_oswietlenie_id, 'kpl', 0, 85.00, 'Taśma LED 5m mocna', 'Taśmy LED'),
  ('Taśma LED RGB 12V 5m z pilotem', 'material', cat_oswietlenie_id, 'kpl', 0, 95.00, 'Taśma LED RGB kolorowa', 'Taśmy LED'),
  ('Zasilacz LED 12V 60W', 'material', cat_oswietlenie_id, 'szt', 0, 38.00, 'Zasilacz do taśm LED 60W', 'Zasilacze LED'),
  ('Zasilacz LED 12V 100W', 'material', cat_oswietlenie_id, 'szt', 0, 55.00, 'Zasilacz do taśm LED 100W', 'Zasilacze LED'),
  ('Zasilacz LED 12V 150W', 'material', cat_oswietlenie_id, 'szt', 0, 75.00, 'Zasilacz do taśm LED 150W', 'Zasilacze LED'),
  ('Profil aluminiowy do taśm LED 1m (wpuszczany)', 'material', cat_oswietlenie_id, 'szt', 0, 18.00, 'Profil LED z dyfuzorem', 'Profile LED'),
  ('Profil aluminiowy do taśm LED 1m (narożny)', 'material', cat_oswietlenie_id, 'szt', 0, 22.00, 'Profil LED narożny', 'Profile LED'),
  ('Profil aluminiowy do taśm LED 2m (natynkowy)', 'material', cat_oswietlenie_id, 'szt', 0, 35.00, 'Profil LED 2m', 'Profile LED'),
  ('Sterownik RGB LED z pilotem', 'material', cat_oswietlenie_id, 'szt', 0, 45.00, 'Kontroler taśm RGB', 'Sterowniki LED'),
  
  -- Oprawy dekoracyjne
  ('Plafon LED 24W okrągły', 'material', cat_oswietlenie_id, 'szt', 0, 65.00, 'Plafon sufitowy LED', 'Plafony LED'),
  ('Plafon LED 36W kwadratowy', 'material', cat_oswietlenie_id, 'szt', 0, 85.00, 'Plafon duży LED', 'Plafony LED'),
  ('Kinkiet LED 6W ściana (góra-dół)', 'material', cat_oswietlenie_id, 'szt', 0, 55.00, 'Kinkiet LED ścienny', 'Kinkiety LED'),
  ('Oprawa track light LED 20W', 'material', cat_oswietlenie_id, 'szt', 0, 95.00, 'Reflektor szynowy LED', 'Track light'),
  ('Szyna do track light 1m (3-fazowa)', 'material', cat_oswietlenie_id, 'szt', 0, 65.00, 'Szyna oświetleniowa 1m', 'Track light'),
  
  -- Oświetlenie awaryjne
  ('Oprawa awaryjna LED EXIT (zielona)', 'material', cat_oswietlenie_id, 'szt', 0, 85.00, 'Lampa ewakuacyjna LED', 'Oświetlenie awaryjne'),
  ('Oprawa awaryjna LED z akumulatorem 3h', 'material', cat_oswietlenie_id, 'szt', 0, 120.00, 'Lampa awaryjna z baterią', 'Oświetlenie awaryjne')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano oświetlenie LED - część 4a';

  -- ============================================================================
  -- 2. MATERIAŁY - OŚWIETLENIE PRZEMYSŁOWE LED (Hale, magazyny)
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Oprawy High-Bay
  ('Oprawa LED High-Bay 100W 4000K IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 280.00, 'High-Bay LED 100W do hal', 'High-Bay LED'),
  ('Oprawa LED High-Bay 150W 4000K IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 380.00, 'High-Bay LED 150W do hal', 'High-Bay LED'),
  ('Oprawa LED High-Bay 200W 4000K IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 480.00, 'High-Bay LED 200W do hal', 'High-Bay LED'),
  ('Oprawa LED High-Bay 240W 4000K IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 650.00, 'High-Bay LED 240W mocna', 'High-Bay LED'),
  ('Oprawa LED High-Bay 100W z czujnikiem ruchu', 'material', cat_led_przemyslowe_id, 'szt', 0, 350.00, 'High-Bay LED 100W PIR', 'High-Bay LED'),
  
  -- Oprawy liniowe przemysłowe
  ('Oprawa LED liniowa 36W 120cm IP65 (hala)', 'material', cat_led_przemyslowe_id, 'szt', 0, 95.00, 'Oprawa LED 120cm przemysłowa', 'Oprawy liniowe'),
  ('Oprawa LED liniowa 54W 150cm IP65 (hala)', 'material', cat_led_przemyslowe_id, 'szt', 0, 125.00, 'Oprawa LED 150cm przemysłowa', 'Oprawy liniowe'),
  ('Oprawa LED liniowa 72W 150cm IP65 mocna', 'material', cat_led_przemyslowe_id, 'szt', 0, 150.00, 'Oprawa LED 150cm mocna', 'Oprawy liniowe'),
  
  -- Reflektory LED
  ('Reflektor LED 50W zewnętrzny IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 85.00, 'Naświetlacz LED 50W', 'Reflektory LED'),
  ('Reflektor LED 100W zewnętrzny IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 135.00, 'Naświetlacz LED 100W', 'Reflektory LED'),
  ('Reflektor LED 150W zewnętrzny IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 185.00, 'Naświetlacz LED 150W', 'Reflektory LED'),
  ('Reflektor LED 200W zewnętrzny IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 280.00, 'Naświetlacz LED 200W mocny', 'Reflektory LED'),
  ('Reflektor LED 50W z czujnikiem ruchu', 'material', cat_led_przemyslowe_id, 'szt', 0, 110.00, 'Naświetlacz LED PIR', 'Reflektory LED'),
  
  -- Oprawy hermetyczne
  ('Oprawa hermetyczna LED 18W 60cm IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 75.00, 'Oprawa wodoodporna 60cm', 'Oprawy hermetyczne'),
  ('Oprawa hermetyczna LED 36W 120cm IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 105.00, 'Oprawa wodoodporna 120cm', 'Oprawy hermetyczne'),
  ('Oprawa hermetyczna LED 54W 150cm IP65', 'material', cat_led_przemyslowe_id, 'szt', 0, 135.00, 'Oprawa wodoodporna 150cm', 'Oprawy hermetyczne'),
  
  -- Oprawy specjalne
  ('Oprawa przeciwwybuchowa Ex LED 36W ATEX', 'material', cat_led_przemyslowe_id, 'szt', 0, 850.00, 'Oprawa LED Ex do stref', 'Oprawy Ex'),
  ('Lampka sygnalizacyjna LED czerwona 230V', 'material', cat_led_przemyslowe_id, 'szt', 0, 45.00, 'Lampka ostrzegawcza LED', 'Sygnalizacja'),
  ('Lampka sygnalizacyjna LED pomarańczowa 230V', 'material', cat_led_przemyslowe_id, 'szt', 0, 45.00, 'Lampka ostrzegawcza LED', 'Sygnalizacja')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano oświetlenie przemysłowe - część 4b';

  -- ============================================================================
  -- 3. MATERIAŁY - SMART HOME & KNX
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Moduły KNX
  ('Moduł KNX wyjścia binarne 8x16A', 'material', cat_smart_home_id, 'szt', 0, 550.00, 'Moduł przełączający KNX 8ch', 'Moduły KNX'),
  ('Moduł KNX wyjścia binarne 4x16A', 'material', cat_smart_home_id, 'szt', 0, 380.00, 'Moduł przełączający KNX 4ch', 'Moduły KNX'),
  ('Moduł KNX wejścia binarne 8ch', 'material', cat_smart_home_id, 'szt', 0, 420.00, 'Moduł wejść binarnych KNX', 'Moduły KNX'),
  ('Moduł KNX ściemniacz 4x300W', 'material', cat_smart_home_id, 'szt', 0, 680.00, 'Dimmer KNX 4-kanałowy', 'Moduły KNX'),
  ('Moduł KNX sterowanie roletami 4ch', 'material', cat_smart_home_id, 'szt', 0, 580.00, 'Moduł rolet KNX 4ch', 'Moduły KNX'),
  ('Moduł KNX sterowanie ogrzewaniem 6ch', 'material', cat_smart_home_id, 'szt', 0, 750.00, 'Moduł grzewczy KNX 6ch', 'Moduły KNX'),
  ('Zasilacz KNX 640mA na szynę DIN', 'material', cat_smart_home_id, 'szt', 0, 280.00, 'Zasilacz magistrali KNX', 'Moduły KNX'),
  ('Router IP KNX (bramka KNX-Ethernet)', 'material', cat_smart_home_id, 'szt', 0, 850.00, 'Interfejs KNX IP', 'Moduły KNX'),
  ('USB Interface KNX (programowanie)', 'material', cat_smart_home_id, 'szt', 0, 420.00, 'Interface USB do ETS', 'Moduły KNX'),
  
  -- Panele sterujące KNX
  ('Panel dotykowy KNX 2-przyciskowy', 'material', cat_smart_home_id, 'szt', 0, 320.00, 'Przycisk KNX 2-krotny', 'Panele KNX'),
  ('Panel dotykowy KNX 4-przyciskowy', 'material', cat_smart_home_id, 'szt', 0, 450.00, 'Przycisk KNX 4-krotny', 'Panele KNX'),
  ('Panel dotykowy KNX 6-przyciskowy', 'material', cat_smart_home_id, 'szt', 0, 580.00, 'Przycisk KNX 6-krotny', 'Panele KNX'),
  ('Panel dotykowy KNX z wyświetlaczem LCD', 'material', cat_smart_home_id, 'szt', 0, 950.00, 'Panel KNX z ekranem', 'Panele KNX'),
  
  -- Czujniki KNX
  ('Czujnik ruchu KNX sufitowy 360°', 'material', cat_smart_home_id, 'szt', 0, 380.00, 'Czujnik PIR KNX 360°', 'Czujniki KNX'),
  ('Czujnik ruchu KNX ścienny 180°', 'material', cat_smart_home_id, 'szt', 0, 320.00, 'Czujnik PIR KNX ścienny', 'Czujniki KNX'),
  ('Termostat pokojowy KNX z wyświetlaczem', 'material', cat_smart_home_id, 'szt', 0, 420.00, 'Regulator temperatury KNX', 'Termostaty KNX'),
  ('Czujnik pogody KNX (wiatr, deszcz, słońce)', 'material', cat_smart_home_id, 'szt', 0, 850.00, 'Stacja pogodowa KNX', 'Czujniki KNX'),
  
  -- Smart Home WiFi/Zigbee
  ('Inteligentne gniazdko WiFi 16A', 'material', cat_smart_home_id, 'szt', 0, 45.00, 'Smart gniazdko WiFi', 'Smart WiFi'),
  ('Inteligentny włącznik WiFi (bez N)', 'material', cat_smart_home_id, 'szt', 0, 55.00, 'Smart switch WiFi', 'Smart WiFi'),
  ('Inteligentny włącznik Zigbee (z N)', 'material', cat_smart_home_id, 'szt', 0, 65.00, 'Smart switch Zigbee', 'Smart Zigbee'),
  ('Kontroler RGB WiFi do taśm LED', 'material', cat_smart_home_id, 'szt', 0, 85.00, 'Smart RGB controller', 'Smart WiFi'),
  ('Hub Zigbee (bramka)', 'material', cat_smart_home_id, 'szt', 0, 150.00, 'Centralka Zigbee', 'Smart Zigbee'),
  ('Czujnik ruchu Zigbee bateria', 'material', cat_smart_home_id, 'szt', 0, 55.00, 'PIR Zigbee bateryjny', 'Smart Zigbee'),
  ('Czujnik otwarcia Zigbee (drzwi/okno)', 'material', cat_smart_home_id, 'szt', 0, 45.00, 'Sensor otwarcia Zigbee', 'Smart Zigbee'),
  
  -- Serwery Smart Home
  ('Miniserver Loxone Gen.2', 'material', cat_smart_home_id, 'szt', 0, 2800.00, 'Centralka Loxone', 'Loxone'),
  ('Moduł rozszerzeń Loxone (8 wejść/wyjść)', 'material', cat_smart_home_id, 'szt', 0, 450.00, 'Extension Loxone', 'Loxone'),
  ('Raspberry Pi 4 (4GB) z obudową (Home Assistant)', 'material', cat_smart_home_id, 'szt', 0, 280.00, 'RPi dla HA', 'Home Assistant')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano Smart Home i KNX - część 4c';

  -- ============================================================================
  -- 4. MATERIAŁY - FLOORBOX'Y I KOLUMNY BIUROWE
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Floorbox''y podłogowe
  ('Floorbox prostokątny 2x230V (inox)', 'material', cat_osprzet_id, 'szt', 0, 180.00, 'Puszka podłogowa 2xSchuko inox', 'Floorbox'),
  ('Floorbox prostokątny 3x230V (inox)', 'material', cat_osprzet_id, 'szt', 0, 220.00, 'Puszka podłogowa 3xSchuko inox', 'Floorbox'),
  ('Floorbox prostokątny 2x230V + 2xRJ45 (inox)', 'material', cat_osprzet_id, 'szt', 0, 250.00, 'Puszka podłogowa data+power', 'Floorbox'),
  ('Floorbox okrągły 2x230V aluminium', 'material', cat_osprzet_id, 'szt', 0, 150.00, 'Puszka podłogowa okrągła', 'Floorbox'),
  ('Floorbox okrągły 3x230V + USB aluminium', 'material', cat_osprzet_id, 'szt', 0, 220.00, 'Puszka podłogowa USB', 'Floorbox'),
  ('Floorbox podłogowy 4x230V + 4xRJ45 duży', 'material', cat_osprzet_id, 'szt', 0, 350.00, 'Puszka podłogowa kombi duża', 'Floorbox'),
  
  -- Kolumny biurowe
  ('Kolumna biurowa 3x230V + 2xUSB', 'material', cat_osprzet_id, 'szt', 0, 280.00, 'Kolumna elektryczna biurkowa', 'Kolumny biurowe'),
  ('Kolumna biurowa 4x230V + 2xUSB + 2xRJ45', 'material', cat_osprzet_id, 'szt', 0, 350.00, 'Kolumna biurowa kombi', 'Kolumny biurowe'),
  ('Kolumna wysuwana z blatu 3x230V + USB', 'material', cat_osprzet_id, 'szt', 0, 420.00, 'Kolumna chowana w blacie', 'Kolumny biurowe'),
  ('Gniazdo wpuszczane w blat 2x230V (okrągłe)', 'material', cat_osprzet_id, 'szt', 0, 95.00, 'Gniazdko do blatu biurka', 'Kolumny biurowe'),
  ('Gniazdo wpuszczane w blat 2x230V + 2xUSB', 'material', cat_osprzet_id, 'szt', 0, 135.00, 'Gniazdko do blatu z USB', 'Kolumny biurowe')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano floorbox''y i kolumny - część 4d';

  -- ============================================================================
  -- 5. MATERIAŁY - AKCESORIA I ELEMENTY UZUPEŁNIAJĄCE
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Czujniki i detektory
  ('Czujnik ruchu PIR 180° natynkowy 230V', 'material', cat_osprzet_id, 'szt', 0, 45.00, 'Czujnik ruchu zewnętrzny', 'Czujniki ruchu'),
  ('Czujnik ruchu PIR 360° sufitowy 230V', 'material', cat_osprzet_id, 'szt', 0, 55.00, 'Czujnik ruchu 360°', 'Czujniki ruchu'),
  ('Czujnik zmierzchowy (fotokomórka)', 'material', cat_osprzet_id, 'szt', 0, 38.00, 'Czujnik światła dziennego', 'Czujniki'),
  ('Dzwonek przewodowy 230V', 'material', cat_osprzet_id, 'szt', 0, 25.00, 'Dzwonek do drzwi', 'Dzwonki'),
  ('Dzwonek bezprzewodowy zasięg 100m', 'material', cat_osprzet_id, 'szt', 0, 45.00, 'Dzwonek wireless', 'Dzwonki'),
  
  -- Przedłużacze i listwy
  ('Listwa zasilająca 5 gniazd z wyłącznikiem', 'material', cat_osprzet_id, 'szt', 0, 28.00, 'Przedłużacz 5 gniazd', 'Przedłużacze'),
  ('Listwa zasilająca 8 gniazd rack 19"', 'material', cat_osprzet_id, 'szt', 0, 75.00, 'Listwa rack do szafy', 'Przedłużacze'),
  ('Przedłużacz bębnowy 50m 4 gniazda', 'material', cat_osprzet_id, 'szt', 0, 180.00, 'Bęben kablowy 50m', 'Przedłużacze'),
  
  -- Materiały montażowe
  ('Łączówka gwintowana 5szt (2,5mm²)', 'material', cat_osprzet_id, 'op', 0, 8.00, 'Złączka śrubowa 5szt', 'Łączówki'),
  ('Złączka szybkomontażowa Wago 2-przewodowa 10szt', 'material', cat_osprzet_id, 'op', 0, 15.00, 'Wago 2ch x10', 'Łączówki'),
  ('Złączka szybkomontażowa Wago 3-przewodowa 10szt', 'material', cat_osprzet_id, 'op', 0, 18.00, 'Wago 3ch x10', 'Łączówki'),
  ('Złączka szybkomontażowa Wago 5-przewodowa 10szt', 'material', cat_osprzet_id, 'op', 0, 25.00, 'Wago 5ch x10', 'Łączówki'),
  ('Opaska zaciskowa 2,5x100mm 100szt (biała)', 'material', cat_osprzet_id, 'op', 0, 8.00, 'Opaski kablowe 100szt', 'Opaski'),
  ('Opaska zaciskowa 4,8x200mm 100szt (czarna)', 'material', cat_osprzet_id, 'op', 0, 15.00, 'Opaski kablowe duże 100szt', 'Opaski'),
  ('Uchwyt do kabli fi6-10mm (50szt)', 'material', cat_osprzet_id, 'op', 0, 12.00, 'Klipsy kablowe 50szt', 'Uchwyty'),
  ('Tuleja miedziana 2,5mm² (100szt)', 'material', cat_osprzet_id, 'op', 0, 15.00, 'Końcówki kablowe 100szt', 'Końcówki'),
  ('Izolacja termokurczliwa zestaw kolorowy', 'material', cat_osprzet_id, 'kpl', 0, 25.00, 'Rurki termokurczliwe komplet', 'Izolacja'),
  ('Taśma izolacyjna PCV 19mm czarna', 'material', cat_osprzet_id, 'szt', 0, 3.50, 'Izolacja elektryczna', 'Izolacja')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano akcesoria - część 4e - KONIEC!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CATALOG EXPANSION 2026 - ZAKOŃCZONE!';
  RAISE NOTICE '========================================';

END $$;
