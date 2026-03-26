-- =====================================================
-- MASSIVE CATALOG SEED PART 3: EQUIPMENT & AUTOMATION
-- Description: Circuit breakers, sockets, switches, lights
-- Brands: Hager, Eaton, Schneider, Legrand
-- =====================================================

DO $$
DECLARE
  default_object_type_id UUID;
  cat_okablowanie UUID;
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
BEGIN

  SELECT id INTO default_object_type_id FROM object_types LIMIT 1;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' LIMIT 1;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;

  -- =====================================================
  -- AUTOMATYKA (Circuit Breakers)
  -- =====================================================

  -- SUBCATEGORY: Wyłączniki nadprądowe (MCBs)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    -- B-Characteristic (for low inrush loads)
    (NULL, cat_rozdzielnice, 'Wyłączniki B', 'Wyłącznik nadprądowy B6 1P', 'Hager/Eaton', 'szt', 0, 25.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki B', 'Wyłącznik nadprądowy B10 1P', 'Oświetlenie', 'szt', 0, 25.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki B', 'Wyłącznik nadprądowy B16 1P', 'Standardowy obwód', 'szt', 0, 25.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki B', 'Wyłącznik nadprądowy B20 1P', 'Gniazda standardowe', 'szt', 0, 28.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki B', 'Wyłącznik nadprądowy B25 1P', 'Większe obciążenia', 'szt', 0, 30.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki B', 'Wyłącznik nadprądowy B32 1P', 'Mocne odbiorniki', 'szt', 0, 32.00, 'material', true),
    
    -- C-Characteristic (standard)
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C6 1P', 'Małe obwody', 'szt', 0, 28.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C10 1P', 'Oświetlenie', 'szt', 0, 28.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C16 1P', 'Najpopularniejszy', 'szt', 0, 28.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C20 1P', 'Gniazda', 'szt', 0, 30.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C25 1P', 'Duże obciążenia', 'szt', 0, 32.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C32 1P', 'Mocne urządzenia', 'szt', 0, 35.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C40 1P', 'Przemysłowy', 'szt', 0, 40.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C50 1P', 'Duża moc', 'szt', 0, 48.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki C', 'Wyłącznik nadprądowy C63 1P', 'Maksymalny', 'szt', 0, 58.00, 'material', true),
    
    -- 3-Phase MCBs
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C16 3P', '3-fazowy 16A', 'szt', 0, 80.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C20 3P', '3-fazowy 20A', 'szt', 0, 85.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C25 3P', '3-fazowy 25A', 'szt', 0, 90.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C32 3P', '3-fazowy 32A', 'szt', 0, 95.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C40 3P', '3-fazowy 40A', 'szt', 0, 110.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C50 3P', '3-fazowy 50A', 'szt', 0, 130.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki 3P', 'Wyłącznik nadprądowy C63 3P', '3-fazowy 63A', 'szt', 0, 150.00, 'material', true);

  -- SUBCATEGORY: Wyłączniki różnicowoprądowe (RCDs - Residual Current Devices)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 25A 30mA 2P', 'Typ AC', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 40A 30mA 2P', 'Typ AC standard', 'szt', 0, 135.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 63A 30mA 2P', 'Typ AC duży', 'szt', 0, 160.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 40A 300mA 2P', 'Przeciwpożarowy', 'szt', 0, 150.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 63A 300mA 2P', 'Ppoż główny', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 25A 30mA 4P', '3-fazowy', 'szt', 0, 220.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 40A 30mA 4P', '3-fazowy standard', 'szt', 0, 240.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Wyłączniki różnicowoprądowe', 'Wyłącznik różnicowoprądowy 63A 30mA 4P', '3-fazowy duży', 'szt', 0, 280.00, 'material', true);

  -- SUBCATEGORY: Rozdzielnice (Distribution boards)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica n/t 12 modułów IP40', 'Dla mieszkania', 'szt', 0, 45.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica p/t 12 modułów IP40', 'Podtynkowa', 'szt', 0, 65.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica n/t 24 moduły IP40', 'Standardowa', 'szt', 0, 80.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica p/t 24 moduły IP40', 'Podtynkowa duża', 'szt', 0, 110.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica n/t 36 modułów IP40', 'Dla domu', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica n/t 48 modułów IP40', 'Duża', 'szt', 0, 160.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica n/t 72 moduły IP40', 'Dla biura', 'szt', 0, 240.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica n/t 120 modułów IP40', 'Przemysłowa', 'szt', 0, 380.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica hermetyczna IP65 12M', 'Zewnętrzna', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_rozdzielnice, 'Rozdzielnice', 'Rozdzielnica hermetyczna IP65 24M', 'Zewnętrzna duża', 'szt', 0, 280.00, 'material', true);

  -- =====================================================
  -- OSPRZĘT (Sockets & Switches) - TOP BRANDS
  -- =====================================================

  -- SUBCATEGORY: Gniazda (Sockets)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    -- Basic Schuko
    (NULL, cat_okablowanie, 'Gniazda Schuko', 'Gniazdo Schuko p/t białe', 'Legrand Valena', 'szt', 0, 18.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda Schuko', 'Gniazdo Schuko p/t antracyt', 'Legrand Valena', 'szt', 0, 22.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda Schuko', 'Gniazdo Schuko p/t srebrne', 'Premium Schneider', 'szt', 0, 28.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda Schuko', 'Gniazdo Schuko podwójne białe', 'Legrand', 'szt', 0, 32.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda Schuko', 'Gniazdo Schuko podwójne antracyt', 'Legrand', 'szt', 0, 38.00, 'material', true),
    
    -- With USB
    (NULL, cat_okablowanie, 'Gniazda z USB', 'Gniazdo Schuko + USB-A białe', 'Z ładowaniem USB', 'szt', 0, 55.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda z USB', 'Gniazdo Schuko + USB-A antracyt', 'Z ładowaniem', 'szt', 0, 62.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda z USB', 'Gniazdo Schuko + USB-C białe', 'Fast charging', 'szt', 0, 75.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda z USB', 'Gniazdo Schuko + 2xUSB-A białe', 'Podwójne USB', 'szt', 0, 80.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda z USB', 'Gniazdo Schuko + USB-A + USB-C', 'Uniwersalne', 'szt', 0, 90.00, 'material', true),
    
    -- Waterproof
    (NULL, cat_okablowanie, 'Gniazda hermetyczne', 'Gniazdo Schuko IP44 z klapką', 'Łazienka', 'szt', 0, 35.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda hermetyczne', 'Gniazdo Schuko IP55 zewnętrzne', 'Z uszczelką', 'szt', 0, 45.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda hermetyczne', 'Gniazdo Schuko IP65 pełne', 'Całkowicie szczelne', 'szt', 0, 58.00, 'material', true),
    
    -- Industrial
    (NULL, cat_okablowanie, 'Gniazda siłowe', 'Gniazdo siłowe 16A 230V 2P+PE', 'Niebieskie', 'szt', 0, 45.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda siłowe', 'Gniazdo siłowe 16A 400V 3P+N+PE', 'Czerwone', 'szt', 0, 65.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda siłowe', 'Gniazdo siłowe 32A 230V 2P+PE', 'Niebieskie duże', 'szt', 0, 75.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda siłowe', 'Gniazdo siłowe 32A 400V 3P+N+PE', 'Czerwone 32A', 'szt', 0, 90.00, 'material', true),
    (NULL, cat_okablowanie, 'Gniazda siłowe', 'Gniazdo siłowe 63A 400V 3P+N+PE', 'Przemysłowe', 'szt', 0, 180.00, 'material', true);

  -- SUBCATEGORY: Włączniki (Switches)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    -- Basic switches
    (NULL, cat_okablowanie, 'Włączniki', 'Włącznik pojedynczy biały', 'Legrand Valena', 'szt', 0, 15.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki', 'Włącznik pojedynczy antracyt', 'Premium', 'szt', 0, 19.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki', 'Włącznik podwójny biały', 'Dwa obwody', 'szt', 0, 22.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki', 'Włącznik podwójny antracyt', 'Premium', 'szt', 0, 28.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki', 'Włącznik potrójny biały', 'Trzy obwody', 'szt', 0, 30.00, 'material', true),
    
    -- Staircase switches
    (NULL, cat_okablowanie, 'Włączniki schodowe', 'Włącznik schodowy biały', 'Dla 2 miejsc', 'szt', 0, 18.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki schodowe', 'Włącznik schodowy antracyt', 'Premium', 'szt', 0, 22.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki schodowe', 'Włącznik krzyżowy biały', 'Dla 3+ miejsc', 'szt', 0, 20.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki schodowe', 'Włącznik krzyżowy antracyt', 'Premium', 'szt', 0, 25.00, 'material', true),
    
    -- With LED
    (NULL, cat_okablowanie, 'Włączniki z LED', 'Włącznik z podświetleniem LED', 'Lokalizacyjny', 'szt', 0, 25.00, 'material', true),
    (NULL, cat_okablowanie, 'Włączniki z LED', 'Włącznik z kontrolką LED', 'Wskaźnikowy', 'szt', 0, 28.00, 'material', true),
    
    -- Dimmers
    (NULL, cat_okablowanie, 'Ściemniacze', 'Ściemniacz obrotowy 0-400W', 'Dla lamp żarowych', 'szt', 0, 65.00, 'material', true),
    (NULL, cat_okablowanie, 'Ściemniacze', 'Ściemniacz elektroniczny LED 0-250W', 'Dla LED', 'szt', 0, 95.00, 'material', true),
    (NULL, cat_okablowanie, 'Ściemniacze', 'Ściemniacz dotykowy z pilotem', 'Smart', 'szt', 0, 150.00, 'material', true);

END $$;
