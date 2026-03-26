-- ============================================================================
-- CATALOG FIX & EXPANSION - February 2026
-- 1. Fix unrealistically low labor prices across existing items
-- 2. Add missing Robocizna (pure labor) items
-- 3. Add missing materials: CEE, contactors, grounding, RCBO, etc.
-- ============================================================================

-- ============================================================================
-- PART 1: UPDATE existing items with too-low prices (labor was 8 PLN everywhere)
-- ============================================================================

-- Fix low labor prices on socket/switch materials
UPDATE catalog_items SET base_labor_price = 25 
WHERE user_id IS NULL AND base_labor_price < 15 AND base_labor_price > 0
  AND (name ILIKE '%gniazdo%' OR name ILIKE '%gniazdko%') 
  AND type = 'material';

UPDATE catalog_items SET base_labor_price = 22 
WHERE user_id IS NULL AND base_labor_price < 15 AND base_labor_price > 0
  AND (name ILIKE '%łącznik%' OR name ILIKE '%włącznik%' OR name ILIKE '%przycisk%') 
  AND type = 'material';

-- Fix low labor prices on lighting fixtures
UPDATE catalog_items SET base_labor_price = 40 
WHERE user_id IS NULL AND base_labor_price < 20 AND base_labor_price > 0
  AND (name ILIKE '%oprawa%' OR name ILIKE '%downlight%' OR name ILIKE '%panel LED%')
  AND type = 'material';

UPDATE catalog_items SET base_labor_price = 60
WHERE user_id IS NULL AND base_labor_price < 40 AND base_labor_price > 0
  AND name ILIKE '%High Bay%'
  AND type = 'material';

-- Fix low labor prices on distribution board apparatus
UPDATE catalog_items SET base_labor_price = 15 
WHERE user_id IS NULL AND base_labor_price < 10 AND base_labor_price > 0
  AND (name ILIKE '%wyłącznik nadprądowy%' OR name ILIKE '%MCB%' OR name ILIKE '%S301%')
  AND type = 'material';

UPDATE catalog_items SET base_labor_price = 25 
WHERE user_id IS NULL AND base_labor_price < 20 AND base_labor_price > 0
  AND (name ILIKE '%różnicowoprąd%' OR name ILIKE '%różnicówka%' OR name ILIKE '%RCD%')
  AND type = 'material';

-- Fix low labor prices on Smart Home sensors
UPDATE catalog_items SET base_labor_price = 25 
WHERE user_id IS NULL AND base_labor_price < 20 AND base_labor_price > 0
  AND (name ILIKE '%czujnik%' OR name ILIKE '%sensor%')
  AND type = 'material';

-- ============================================================================
-- PART 2: ADD NEW ITEMS - Robocizna, CEE, Grounding, Contactors, etc.
-- ============================================================================

DO $$
DECLARE
  cat_robocizna_id UUID;
  cat_osprzet_id UUID;
  cat_rozdzielnice_id UUID;
  cat_uziemienie_id UUID;
  cat_pomiary_id UUID;
  cat_oswietlenie_id UUID;
  cat_kable_id UUID;
  default_object_type_id UUID;
BEGIN

  -- Get default object type
  SELECT id INTO default_object_type_id FROM object_types LIMIT 1;

  -- Create Robocizna category if not exists
  INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES (default_object_type_id, 'Robocizna', 'hard-hat', 0)
  ON CONFLICT (object_type_id, name) DO NOTHING;

  -- Get category IDs (try multiple naming conventions)
  SELECT id INTO cat_robocizna_id FROM catalog_categories WHERE name = 'Robocizna' LIMIT 1;
  SELECT id INTO cat_osprzet_id FROM catalog_categories WHERE name IN ('Osprzęt elektryczny', 'Osprzęt', 'Biuro') LIMIT 1;
  SELECT id INTO cat_rozdzielnice_id FROM catalog_categories WHERE name IN ('Rozdzielnice i tablice', 'Rozdzielnice') LIMIT 1;
  SELECT id INTO cat_uziemienie_id FROM catalog_categories WHERE name IN ('Uziemienie/Odgrom', 'Uziemienie') LIMIT 1;
  SELECT id INTO cat_pomiary_id FROM catalog_categories WHERE name = 'Pomiary' LIMIT 1;
  SELECT id INTO cat_oswietlenie_id FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_kable_id FROM catalog_categories WHERE name IN ('Kable i przewody', 'Okablowanie') LIMIT 1;

  -- If uziemienie category doesn't exist, create it
  IF cat_uziemienie_id IS NULL THEN
    INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
    VALUES (default_object_type_id, 'Uziemienie', 'zap', 3)
    RETURNING id INTO cat_uziemienie_id;
  END IF;

  -- ========================================================================
  -- ROBOCIZNA (Pure Labor) - Prace instalacyjne
  -- ========================================================================
  
  IF cat_robocizna_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    -- Kucie i przygotowanie
    (NULL, cat_robocizna_id, 'Kucie bruzd', 'Kucie bruzd w ścianie (cegła/bloczki)', 'Bruzda pod jeden przewód', 'mb', 30.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Kucie bruzd', 'Kucie bruzd w ścianie (beton)', 'Bruzda w żelbetonie', 'mb', 50.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Kucie bruzd', 'Kucie bruzd podwójnych (2 przewody)', 'Szersza bruzda', 'mb', 45.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Wiercenie', 'Wiercenie otworu koronkowego Ø68 (cegła)', 'Pod puszkę podtynkową', 'szt', 15.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Wiercenie', 'Wiercenie otworu koronkowego Ø68 (beton)', 'Pod puszkę w betonie', 'szt', 30.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Przepusty', 'Przepust przez ścianę (do 30cm)', 'Wiercenie + uszczelnienie', 'szt', 40.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Przepusty', 'Przepust przez ścianę (31-50cm)', 'Gruba ściana', 'szt', 60.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Przepusty', 'Przepust przez strop żelbetowy', 'Z zabezpieczeniem ppoż.', 'szt', 100.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Przepusty', 'Przepust ppoż. (ogniochronny)', 'Z masą ogniochronną', 'szt', 80.00, 30, 'labor', true),
    
    -- Układanie przewodów
    (NULL, cat_robocizna_id, 'Układanie przewodów', 'Układanie przewodu w bruzdzie', 'Wciąganie i mocowanie', 'mb', 10.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Układanie przewodów', 'Układanie przewodu w peszlu/rurkach', 'Z przeciąganiem', 'mb', 12.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Układanie przewodów', 'Układanie przewodu w korytku kablowym', 'Na trasach kablowych', 'mb', 8.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Układanie przewodów', 'Układanie kabla ziemnego w wykopie', 'Z piaskowaniem', 'mb', 18.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Układanie przewodów', 'Ciągnięcie kabla w istniejącej rurze', 'Przeciąganie', 'mb', 10.00, 0, 'labor', true),
    
    -- Montaż rozdzielnic
    (NULL, cat_robocizna_id, 'Rozdzielnice', 'Montaż rozdzielnicy podtynkowej (kucie wnęki)', 'Przygotowanie i osadzenie', 'szt', 250.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Rozdzielnice', 'Montaż rozdzielnicy natynkowej', 'Montaż na ścianie', 'szt', 150.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Rozdzielnice', 'Podłączenie rozdzielnicy (do 24 mod)', 'Okablowanie wewnętrzne', 'kpl', 350.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Rozdzielnice', 'Podłączenie rozdzielnicy (25-48 mod)', 'Okablowanie wewnętrzne', 'kpl', 600.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Rozdzielnice', 'Oznakowanie i opis rozdzielnicy', 'Etykiety + schemat', 'kpl', 100.00, 0, 'labor', true),
    
    -- Montaż oświetlenia
    (NULL, cat_robocizna_id, 'Montaż oświetlenia', 'Montaż oprawy LED natynkowej/wpuszczanej', 'Podłączenie i mocowanie', 'szt', 45.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Montaż oświetlenia', 'Montaż oprawy przemysłowej High Bay', 'Montaż na wysokości', 'szt', 80.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Montaż oświetlenia', 'Montaż naświetlacza LED na wysięgniku', 'Z mocowaniem', 'szt', 60.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Montaż oświetlenia', 'Montaż oprawy awaryjnej/ewakuacyjnej', 'Z podłączeniem akumulatora', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Montaż oświetlenia', 'Montaż taśmy LED (z profilem)', 'Komplet: profil + taśma + zasilacz', 'mb', 30.00, 0, 'labor', true),
    
    -- Prace wykończeniowe
    (NULL, cat_robocizna_id, 'Prace wykończeniowe', 'Tynkowanie bruzd (zaprawą)', 'Zamurowanie po instalacji', 'mb', 15.00, 2, 'labor', true),
    (NULL, cat_robocizna_id, 'Prace wykończeniowe', 'Tynkowanie po puszce podtynkowej', 'Wyrównanie tynku', 'szt', 10.00, 1, 'labor', true),
    
    -- Demontaż
    (NULL, cat_robocizna_id, 'Demontaż', 'Demontaż starej instalacji (punkt)', 'Gniazdo/łącznik + przewód', 'szt', 18.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Demontaż', 'Demontaż starej rozdzielnicy', 'Z odłączeniem zasilania', 'szt', 200.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Demontaż', 'Demontaż starej oprawy oświetleniowej', 'Zdjęcie i odłączenie', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Demontaż', 'Wywóz i utylizacja odpadów', 'Gruz, stare kable', 'kpl', 250.00, 0, 'labor', true),
    
    -- Logistyka i organizacja
    (NULL, cat_robocizna_id, 'Logistyka', 'Transport materiałów na budowę', 'Dostawa + wniesienie', 'kpl', 350.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Logistyka', 'Dojazd na budowę (do 30 km)', 'Koszt dojazdu', 'kpl', 100.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Logistyka', 'Dojazd na budowę (30-60 km)', 'Koszt dojazdu dalekiego', 'kpl', 200.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Logistyka', 'Nadzór instalacyjny (stawka godzinowa)', 'Nadzór kierownika', 'h', 120.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Logistyka', 'Szkolenie obsługi instalacji', 'Instruktaż klienta', 'h', 80.00, 0, 'labor', true),
    (NULL, cat_robocizna_id, 'Logistyka', 'Uruchomienie instalacji elektrycznej', 'Sprawdzenie i załączenie', 'kpl', 500.00, 0, 'labor', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================================================
  -- OSPRZĘT - Gniazda przemysłowe CEE, ramki, dimmery
  -- ========================================================================
  
  IF cat_osprzet_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    -- Gniazda CEE przemysłowe
    (NULL, cat_osprzet_id, 'Gniazda CEE', 'Gniazdo przemysłowe CEE 16A 3P (230V)', 'Jednofazowe przemysłowe', 'szt', 35.00, 25.00, 'material', true),
    (NULL, cat_osprzet_id, 'Gniazda CEE', 'Gniazdo przemysłowe CEE 16A 5P (400V)', 'Trójfazowe 16A', 'szt', 40.00, 35.00, 'material', true),
    (NULL, cat_osprzet_id, 'Gniazda CEE', 'Gniazdo przemysłowe CEE 32A 5P (400V)', 'Trójfazowe 32A', 'szt', 50.00, 55.00, 'material', true),
    (NULL, cat_osprzet_id, 'Gniazda CEE', 'Gniazdo przemysłowe CEE 63A 5P (400V)', 'Trójfazowe 63A', 'szt', 65.00, 130.00, 'material', true),
    (NULL, cat_osprzet_id, 'Wtyczki CEE', 'Wtyczka przemysłowa CEE 16A 5P (400V)', 'Wtyczka przenośna', 'szt', 20.00, 30.00, 'material', true),
    (NULL, cat_osprzet_id, 'Wtyczki CEE', 'Wtyczka przemysłowa CEE 32A 5P (400V)', 'Wtyczka przenośna 32A', 'szt', 25.00, 50.00, 'material', true),
    
    -- Dimmery
    (NULL, cat_osprzet_id, 'Dimmery', 'Dimmer obrotowy 400W', 'Ściemniacz obrotowy tradycyjny', 'szt', 30.00, 55.00, 'material', true),
    (NULL, cat_osprzet_id, 'Dimmery', 'Dimmer LED 200W (push)', 'Ściemniacz do LED push-to-dim', 'szt', 35.00, 85.00, 'material', true),
    
    -- Ramki
    (NULL, cat_osprzet_id, 'Ramki', 'Ramka pojedyncza (biała)', 'Ramka osprzętowa 1-krotna', 'szt', 0, 5.00, 'material', true),
    (NULL, cat_osprzet_id, 'Ramki', 'Ramka podwójna (biała)', 'Ramka osprzętowa 2-krotna', 'szt', 0, 10.00, 'material', true),
    (NULL, cat_osprzet_id, 'Ramki', 'Ramka potrójna (biała)', 'Ramka osprzętowa 3-krotna', 'szt', 0, 14.00, 'material', true),
    (NULL, cat_osprzet_id, 'Ramki', 'Ramka poczwórna (biała)', 'Ramka osprzętowa 4-krotna', 'szt', 0, 18.00, 'material', true),
    (NULL, cat_osprzet_id, 'Ramki', 'Ramka pięciokrotna (biała)', 'Ramka osprzętowa 5-krotna', 'szt', 0, 22.00, 'material', true),

    -- Floorbox
    (NULL, cat_osprzet_id, 'Floorbox', 'Puszka podłogowa (floorbox) 4-modułowa', 'Do posadzki', 'szt', 80.00, 180.00, 'material', true),
    (NULL, cat_osprzet_id, 'Floorbox', 'Puszka podłogowa (floorbox) 8-modułowa', 'Do posadzki duża', 'szt', 120.00, 320.00, 'material', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================================================
  -- ROZDZIELNICE - Styczniki, RCBO, wyłączniki silnikowe, szyny
  -- ========================================================================
  
  IF cat_rozdzielnice_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    -- RCBO (kombinowane)
    (NULL, cat_rozdzielnice_id, 'RCBO', 'RCBO 10A/30mA 1P+N', 'Wyłącznik kombinowany nadp.+różnic.', 'szt', 25.00, 145.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'RCBO', 'RCBO 16A/30mA 1P+N', 'Wyłącznik kombinowany nadp.+różnic.', 'szt', 25.00, 155.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'RCBO', 'RCBO 20A/30mA 1P+N', 'Wyłącznik kombinowany nadp.+różnic.', 'szt', 25.00, 165.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'RCBO', 'RCBO 25A/30mA 1P+N', 'Wyłącznik kombinowany nadp.+różnic.', 'szt', 25.00, 170.00, 'material', true),
    
    -- Styczniki modułowe
    (NULL, cat_rozdzielnice_id, 'Styczniki', 'Stycznik modułowy 20A 230V (2NO)', 'Do sterowania obwodami', 'szt', 20.00, 105.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Styczniki', 'Stycznik modułowy 25A 230V (2NO)', 'Do sterowania obwodami', 'szt', 20.00, 110.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Styczniki', 'Stycznik modułowy 40A 230V (2NO)', 'Do dużych obciążeń', 'szt', 25.00, 130.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Styczniki', 'Stycznik modułowy 63A 230V (2NO)', 'Do dużych obciążeń', 'szt', 25.00, 160.00, 'material', true),
    
    -- Wyłączniki silnikowe
    (NULL, cat_rozdzielnice_id, 'Wyłączniki silnikowe', 'Wyłącznik silnikowy 2.5-4A', 'Ochrona silników małych', 'szt', 25.00, 90.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Wyłączniki silnikowe', 'Wyłącznik silnikowy 6-10A', 'Ochrona silników średnich', 'szt', 25.00, 95.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Wyłączniki silnikowe', 'Wyłącznik silnikowy 10-16A', 'Ochrona silników dużych', 'szt', 30.00, 105.00, 'material', true),
    
    -- Programatory, przekaźniki
    (NULL, cat_rozdzielnice_id, 'Automatyka', 'Programator czasowy modułowy', 'Timer analogowy/cyfrowy', 'szt', 20.00, 80.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Automatyka', 'Programator astronomiczny', 'Z funkcją zmierzchu', 'szt', 25.00, 180.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Automatyka', 'Przekaźnik priorytetowy', 'Odciążanie obwodów', 'szt', 25.00, 150.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Automatyka', 'Przełącznik sieć/agregat 40A 4P', 'Przełącznik 1-0-2', 'szt', 40.00, 200.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Automatyka', 'Przełącznik sieć/agregat 63A 4P', 'Przełącznik 1-0-2', 'szt', 45.00, 280.00, 'material', true),
    
    -- Szyny i osprzęt rozdzielnicowy
    (NULL, cat_rozdzielnice_id, 'Osprzęt rozdzielnicowy', 'Szyna zbiorcza N (niebieska) 12 mod', 'Do rozdzielnicy', 'szt', 8.00, 15.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Osprzęt rozdzielnicowy', 'Szyna zbiorcza PE (żółto-zielona) 12 mod', 'Do rozdzielnicy', 'szt', 8.00, 15.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Osprzęt rozdzielnicowy', 'Szyna łączeniowa grzebieniowa 1P 12 mod', 'Mostek grzebieniowy', 'szt', 10.00, 18.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Osprzęt rozdzielnicowy', 'Szyna łączeniowa grzebieniowa 3P 12 mod', 'Mostek trójfazowy', 'szt', 12.00, 38.00, 'material', true),
    (NULL, cat_rozdzielnice_id, 'Osprzęt rozdzielnicowy', 'Lampka sygnalizacyjna modułowa LED', 'Wskaźnik napięcia', 'szt', 8.00, 25.00, 'material', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================================================
  -- UZIEMIENIE - Uziomy, bednarka, złącza
  -- ========================================================================
  
  IF cat_uziemienie_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    (NULL, cat_uziemienie_id, 'Uziomy', 'Uziom pionowy stalowy ocynkowany 1,5m', 'Pręt uziemiający', 'szt', 45.00, 35.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Uziomy', 'Uziom pionowy stalowy ocynkowany 3m', 'Pręt uziemiający długi', 'szt', 70.00, 65.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Uziomy', 'Uziom prętowy miedziowany fi18 1,5m', 'Pręt miedziowany', 'szt', 50.00, 55.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Bednarka', 'Bednarka ocynkowana 25x4mm', 'Pas uziemiający', 'mb', 18.00, 10.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Bednarka', 'Bednarka ocynkowana 30x4mm', 'Pas uziemiający szeroki', 'mb', 20.00, 12.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Bednarka', 'Bednarka miedziana 25x4mm', 'Pas miedziany', 'mb', 22.00, 40.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Złącza', 'Złącze kontrolne (z pokrywą)', 'Punkt pomiarowy uziemienia', 'szt', 25.00, 28.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Złącza', 'Złącze krzyżowe uziemienia', 'Łącznik krzyżowy', 'szt', 15.00, 12.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Złącza', 'Szyna wyrównawcza potencjałów', 'GST', 'szt', 25.00, 35.00, 'material', true),
    (NULL, cat_uziemienie_id, 'Złącza', 'Połączenie wyrównawcze (łazienka)', 'Komplet z przewodami', 'kpl', 60.00, 45.00, 'material', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================================================
  -- OŚWIETLENIE - Oprawy awaryjne, naświetlacze
  -- ========================================================================
  
  IF cat_oswietlenie_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    (NULL, cat_oswietlenie_id, 'Oprawy awaryjne', 'Oprawa awaryjna LED 3W (1h)', 'Z akumulatorem 1h', 'szt', 45.00, 85.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Oprawy awaryjne', 'Oprawa awaryjna LED 3W (3h)', 'Z akumulatorem 3h', 'szt', 45.00, 130.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Oprawy awaryjne', 'Oprawa ewakuacyjna LED EXIT', 'Piktogram wyjście', 'szt', 45.00, 110.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Naświetlacze', 'Naświetlacz LED 10W IP65', 'Halogen LED mały', 'szt', 35.00, 45.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Naświetlacze', 'Naświetlacz LED 30W IP65', 'Halogen LED średni', 'szt', 40.00, 75.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Naświetlacze', 'Naświetlacz LED 50W IP65', 'Halogen LED duży', 'szt', 45.00, 105.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Naświetlacze', 'Naświetlacz LED 100W IP65', 'Halogen LED przemysłowy', 'szt', 55.00, 180.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Naświetlacze', 'Naświetlacz LED 200W IP65', 'Halogen LED duży przemysłowy', 'szt', 65.00, 330.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Oprawy liniowe', 'Oprawa liniowa LED 36W 120cm IP20', 'Natynkowa biurowa', 'szt', 40.00, 90.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Oprawy liniowe', 'Oprawa hermetyczna LED 36W 120cm IP65', 'Wodoszczelna', 'szt', 45.00, 110.00, 'material', true),
    (NULL, cat_oswietlenie_id, 'Oprawy liniowe', 'Oprawa hermetyczna LED 54W 150cm IP65', 'Wodoszczelna duża', 'szt', 50.00, 145.00, 'material', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================================================
  -- KABLE - Dodatkowe specjalne kable
  -- ========================================================================
  
  IF cat_kable_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    (NULL, cat_kable_id, 'Kable specjalne', 'Kabel koncentryczny RG-6 TV/SAT (za mb)', 'Kabel antenowy', 'mb', 8.00, 3.50, 'material', true),
    (NULL, cat_kable_id, 'Kable specjalne', 'Kabel światłowodowy SM 4J (za mb)', 'Światłowód 4 włókna', 'mb', 15.00, 5.00, 'material', true),
    (NULL, cat_kable_id, 'Kable specjalne', 'Kabel światłowodowy SM 8J (za mb)', 'Światłowód 8 włókien', 'mb', 18.00, 8.00, 'material', true),
    (NULL, cat_kable_id, 'Kable sterownicze', 'Kabel YKSY 3x1mm² (za mb)', 'Sterowniczy 3-żyłowy', 'mb', 8.00, 4.00, 'material', true),
    (NULL, cat_kable_id, 'Kable sterownicze', 'Kabel YKSY 5x1mm² (za mb)', 'Sterowniczy 5-żyłowy', 'mb', 8.00, 6.00, 'material', true),
    (NULL, cat_kable_id, 'Kable sterownicze', 'Kabel YKSY 7x1mm² (za mb)', 'Sterowniczy 7-żyłowy', 'mb', 10.00, 8.00, 'material', true),
    (NULL, cat_kable_id, 'Kable sterownicze', 'Kabel YKSY 12x1mm² (za mb)', 'Sterowniczy 12-żyłowy', 'mb', 12.00, 12.00, 'material', true),
    (NULL, cat_kable_id, 'Rury instalacyjne', 'Rura elektroinstalacyjna RL fi16 (za mb)', 'Rura sztywna PCV', 'mb', 8.00, 2.00, 'material', true),
    (NULL, cat_kable_id, 'Rury instalacyjne', 'Rura elektroinstalacyjna RL fi20 (za mb)', 'Rura sztywna PCV', 'mb', 8.00, 2.50, 'material', true),
    (NULL, cat_kable_id, 'Rury instalacyjne', 'Rura elektroinstalacyjna RL fi25 (za mb)', 'Rura sztywna PCV', 'mb', 10.00, 3.00, 'material', true),
    (NULL, cat_kable_id, 'Rury instalacyjne', 'Rura elektroinstalacyjna RL fi32 (za mb)', 'Rura sztywna PCV', 'mb', 10.00, 4.00, 'material', true),
    (NULL, cat_kable_id, 'Rury ochronne', 'Rura osłonowa DVR fi50 czerwona (za mb)', 'Rura kablowa ziemna', 'mb', 5.00, 3.50, 'material', true),
    (NULL, cat_kable_id, 'Rury ochronne', 'Rura osłonowa DVR fi110 czerwona (za mb)', 'Rura kablowa ziemna duża', 'mb', 8.00, 8.00, 'material', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================================================
  -- POMIARY - Uzupełnienie
  -- ========================================================================
  
  IF cat_pomiary_id IS NOT NULL THEN
    INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active) VALUES
    (NULL, cat_pomiary_id, 'Pomiary', 'Pomiar ciągłości przewodów ochronnych', 'Weryfikacja PE', 'szt', 15.00, 0, 'labor', true),
    (NULL, cat_pomiary_id, 'Pomiary', 'Pomiar spadku napięcia', 'Na obwodzie', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_pomiary_id, 'Pomiary', 'Sprawdzenie skuteczności ochrony ppoż.', 'Kontrola systemu', 'szt', 80.00, 0, 'labor', true),
    (NULL, cat_pomiary_id, 'Dokumentacja', 'Protokół pomiarowy (mieszkanie)', 'Komplet pomiarów mieszkania', 'kpl', 250.00, 0, 'labor', true),
    (NULL, cat_pomiary_id, 'Dokumentacja', 'Dokumentacja powykonawcza (dom)', 'Kompletna dokumentacja', 'kpl', 800.00, 0, 'labor', true),
    (NULL, cat_pomiary_id, 'Dokumentacja', 'Dokumentacja powykonawcza (obiekt komercyjny)', 'Pełna dokumentacja z rysunkami', 'kpl', 2000.00, 0, 'labor', true)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
