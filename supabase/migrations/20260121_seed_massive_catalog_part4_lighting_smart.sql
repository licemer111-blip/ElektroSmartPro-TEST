-- =====================================================
-- MASSIVE CATALOG SEED PART 4: LIGHTING & SMART SYSTEMS
-- Description: LED lights, Smart Home (KNX, Loxone, Fibaro), PPOŻ, Security
-- =====================================================

DO $$
DECLARE
  default_object_type_id UUID;
  cat_oswietlenie UUID;
  cat_ppoz UUID;
  cat_security UUID;
  cat_smart_home UUID;
  cat_teletechnika UUID;
BEGIN

  SELECT id INTO default_object_type_id FROM object_types LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_ppoz FROM catalog_categories WHERE name = 'PPOŻ' LIMIT 1;
  SELECT id INTO cat_security FROM catalog_categories WHERE name = 'Security' LIMIT 1;
  SELECT id INTO cat_smart_home FROM catalog_categories WHERE name = 'Smart Home' LIMIT 1;
  SELECT id INTO cat_teletechnika FROM catalog_categories WHERE name = 'Teletechnika' LIMIT 1;

  -- =====================================================
  -- OŚWIETLENIE (Lighting)
  -- =====================================================

  -- SUBCATEGORY: Panele LED
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_oswietlenie, 'Panele LED', 'Panel LED 60x60cm 40W 4000lm', 'Neutralny 4000K', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_oswietlenie, 'Panele LED', 'Panel LED 60x60cm 40W 3000K', 'Ciepły biały', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_oswietlenie, 'Panele LED', 'Panel LED 60x60cm 40W 6500K', 'Zimny biały', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_oswietlenie, 'Panele LED', 'Panel LED 30x120cm 40W 4000lm', 'Prostokątny', 'szt', 0, 140.00, 'material', true),
    (NULL, cat_oswietlenie, 'Panele LED', 'Panel LED 62x62cm 48W 4800lm', 'Zwiększona moc', 'szt', 0, 160.00, 'material', true);

  -- SUBCATEGORY: Downlighty (Spotlights)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED 5W fi 90mm', 'Mała', 'szt', 0, 35.00, 'material', true),
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED 7W fi 90mm', 'Standardowa', 'szt', 0, 42.00, 'material', true),
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED 10W fi 110mm', 'Średnia', 'szt', 0, 50.00, 'material', true),
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED 15W fi 150mm', 'Duża', 'szt', 0, 68.00, 'material', true),
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED 20W fi 180mm', 'Maksymalna', 'szt', 0, 85.00, 'material', true),
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED 7W kwadrat', 'Kwadratowa', 'szt', 0, 48.00, 'material', true),
    (NULL, cat_oswietlenie, 'Downlighty', 'Oprawa downlight LED IP44 łazienka', 'Wodoszczelna', 'szt', 0, 65.00, 'material', true);

  -- SUBCATEGORY: Oprawy liniowe LED
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_oswietlenie, 'Oprawy liniowe LED', 'Oprawa LED liniowa 60cm 20W', 'Kompaktowa', 'szt', 0, 85.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oprawy liniowe LED', 'Oprawa LED liniowa 120cm 40W', 'Standardowa', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oprawy liniowe LED', 'Oprawa LED liniowa 150cm 50W', 'Długa', 'szt', 0, 160.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oprawy liniowe LED', 'Oprawa LED liniowa 120cm IP65', 'Przemysłowa', 'szt', 0, 180.00, 'material', true);

  -- SUBCATEGORY: Oświetlenie zewnętrzne
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_oswietlenie, 'Oświetlenie zewnętrzne', 'Oprawa fasadowa LED 10W IP65', 'Na fasadę', 'szt', 0, 95.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oświetlenie zewnętrzne', 'Oprawa fasadowa LED 20W IP65', 'Mocna', 'szt', 0, 140.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oświetlenie zewnętrzne', 'Reflektor LED 30W z czujnikiem', 'Z czujnikiem ruchu', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oświetlenie zewnętrzne', 'Reflektor LED 50W z czujnikiem', 'Mocny', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_oswietlenie, 'Oświetlenie zewnętrzne', 'Reflektor LED 100W przemysłowy', 'Przemysłowy', 'szt', 0, 280.00, 'material', true);

  -- =====================================================
  -- SMART HOME SYSTEMS
  -- =====================================================

  -- SUBCATEGORY: KNX (Professional bus system)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_smart_home, 'KNX', 'Moduł KNX przełącznik 4-kan', 'Uniwersalny aktuator', 'szt', 0, 450.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Moduł KNX przełącznik 8-kan', 'Rozszerzony aktuator', 'szt', 0, 650.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Moduł KNX ściemniacz 4-kan', 'Ściemniacz 4 kanały', 'szt', 0, 750.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Moduł KNX roletowy 4-kan', 'Dla rolet', 'szt', 0, 550.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Przycisk dotykowy KNX 2-kan', 'Panel dotykowy', 'szt', 0, 380.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Przycisk dotykowy KNX 4-kan', 'Duży ekran', 'szt', 0, 520.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Panel dotykowy KNX 7" LCD', 'Z ekranem', 'szt', 0, 2200.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Czujnik ruchu KNX', 'Detektor ruchu', 'szt', 0, 420.00, 'material', true),
    (NULL, cat_smart_home, 'KNX', 'Czujnik temperatury KNX', 'Termostat', 'szt', 0, 380.00, 'material', true);

  -- SUBCATEGORY: Loxone (Miniserver-based)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_smart_home, 'Loxone', 'Loxone Miniserver Gen 2', 'Główny kontroler', 'szt', 0, 2800.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Extension', 'Rozszerzenie wejść/wyjść', 'szt', 0, 650.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Relay Extension', 'Moduł przekaźnikowy', 'szt', 0, 450.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Dimmer Extension', 'Moduł ściemniania', 'szt', 0, 850.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Touch Pure', 'Panel dotykowy', 'szt', 0, 680.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Touch Nightlight', 'Z podświetleniem', 'szt', 0, 750.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Motion Sensor', 'Czujnik ruchu', 'szt', 0, 320.00, 'material', true),
    (NULL, cat_smart_home, 'Loxone', 'Loxone Presence Sensor', 'Czujnik obecności', 'szt', 0, 420.00, 'material', true);

  -- SUBCATEGORY: Fibaro (Z-Wave wireless)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Home Center 3', 'Główny kontroler', 'szt', 0, 2400.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Double Switch 2', 'Podwójny przełącznik', 'szt', 0, 280.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Dimmer 2', 'Ściemniacz', 'szt', 0, 320.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Roller Shutter 3', 'Moduł dla rolet', 'szt', 0, 290.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Motion Sensor', 'Czujnik ruchu', 'szt', 0, 220.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Door/Window Sensor', 'Czujnik otwarcia', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Flood Sensor', 'Czujnik zalania', 'szt', 0, 190.00, 'material', true),
    (NULL, cat_smart_home, 'Fibaro', 'Fibaro Smoke Sensor', 'Czujnik dymu', 'szt', 0, 250.00, 'material', true);

  -- =====================================================
  -- PPOŻ (Fire Protection Systems)
  -- =====================================================

  -- SUBCATEGORY: Czujki dymu
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_ppoz, 'Czujki dymu', 'Czujka dymu optyczna', 'Standardowa', 'szt', 0, 45.00, 'material', true),
    (NULL, cat_ppoz, 'Czujki dymu', 'Czujka dymu adresowalna', 'Dla systemów adresowalnych', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_ppoz, 'Czujki dymu', 'Czujka dymu + CO', 'Kombinowana', 'szt', 0, 220.00, 'material', true),
    (NULL, cat_ppoz, 'Czujki dymu', 'Czujka dymu linear', 'Liniowa', 'szt', 0, 850.00, 'material', true);

  -- SUBCATEGORY: Czujki ciepła
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_ppoz, 'Czujki ciepła', 'Czujka ciepła 60°C', 'Standardowa', 'szt', 0, 38.00, 'material', true),
    (NULL, cat_ppoz, 'Czujki ciepła', 'Czujka ciepła 90°C', 'Podwyższona temperatura', 'szt', 0, 42.00, 'material', true),
    (NULL, cat_ppoz, 'Czujki ciepła', 'Czujka termowęglowa', 'Termoczuła', 'szt', 0, 35.00, 'material', true);

  -- SUBCATEGORY: Ręczne ostrzegacze ROP
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_ppoz, 'Ręczne ostrzegacze ROP', 'Ręczny ostrzegacz pożaru ROP', 'Standardowy przycisk', 'szt', 0, 65.00, 'material', true),
    (NULL, cat_ppoz, 'Ręczne ostrzegacze ROP', 'ROP natynkowy IP65', 'Zewnętrzny', 'szt', 0, 85.00, 'material', true),
    (NULL, cat_ppoz, 'Ręczne ostrzegacze ROP', 'ROP adresowalny', 'System adresowalny', 'szt', 0, 180.00, 'material', true);

  -- SUBCATEGORY: Sygnalizatory
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_ppoz, 'Sygnalizatory', 'Sygnalizator akustyczny SAP', 'Standardowa syrena', 'szt', 0, 120.00, 'material', true),
    (NULL, cat_ppoz, 'Sygnalizatory', 'Sygnalizator optyczno-akustyczny', 'Ze światłem', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_ppoz, 'Sygnalizatory', 'Sygnalizator wewnętrzny SAW', 'Wewnętrzny', 'szt', 0, 90.00, 'material', true),
    (NULL, cat_ppoz, 'Sygnalizatory', 'Sygnalizator zewnętrzny IP65', 'Zewnętrzny', 'szt', 0, 220.00, 'material', true);

  -- SUBCATEGORY: Centrale ppoż
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_ppoz, 'Centrale ppoż', 'Centrala ppoż 2 strefy', 'Mały system', 'szt', 0, 850.00, 'material', true),
    (NULL, cat_ppoz, 'Centrale ppoż', 'Centrala ppoż 4 strefy', 'Standardowa', 'szt', 0, 1200.00, 'material', true),
    (NULL, cat_ppoz, 'Centrale ppoż', 'Centrala ppoż 8 stref', 'Rozszerzona', 'szt', 0, 1800.00, 'material', true),
    (NULL, cat_ppoz, 'Centrale ppoż', 'Centrala adresowalna 32 adresy', 'Adresowalna mała', 'szt', 0, 3500.00, 'material', true),
    (NULL, cat_ppoz, 'Centrale ppoż', 'Centrala adresowalna 128 adresów', 'Adresowalna duża', 'szt', 0, 6500.00, 'material', true);

  -- =====================================================
  -- SECURITY SYSTEMS
  -- =====================================================

  -- SUBCATEGORY: Domofony
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_security, 'Domofony', 'Unifon głośnomówiący', 'Audio domofon', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_security, 'Domofony', 'Wideodomofon 7" TFT', 'Wideo domofon', 'szt', 0, 550.00, 'material', true),
    (NULL, cat_security, 'Domofony', 'Wideodomofon 10" Android', 'Smart wideo domofon', 'szt', 0, 1200.00, 'material', true),
    (NULL, cat_security, 'Domofony', 'Panel domofonowy 1-rodzinny', 'Panel wywołania', 'szt', 0, 420.00, 'material', true),
    (NULL, cat_security, 'Domofony', 'Panel domofonowy 4-rodzinny', 'Dla wielorodzinnego', 'szt', 0, 850.00, 'material', true);

  -- SUBCATEGORY: Kontrola dostępu
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_security, 'Kontrola dostępu', 'Czytnik kart RFID', 'Bezstykowy', 'szt', 0, 280.00, 'material', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Czytnik biometryczny odcisk', 'Skaner odcisków', 'szt', 0, 650.00, 'material', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Czytnik twarzy + RFID', 'Rozpoznawanie twarzy', 'szt', 0, 1800.00, 'material', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Zamek elektromagnetyczny 300kg', 'Zamek elektromagnetyczny', 'szt', 0, 380.00, 'material', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Zamek elektromagnetyczny 600kg', 'Wzmocniony', 'szt', 0, 580.00, 'material', true);

  -- SUBCATEGORY: Teletechnika (Network & Telecom)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_teletechnika, 'Kable sieciowe', 'Kabel UTP Cat.5e', 'Dla sieci 100Mbps', 'm', 0, 1.20, 'material', true),
    (NULL, cat_teletechnika, 'Kable sieciowe', 'Kabel UTP Cat.6', 'Gigabit 1Gbps', 'm', 0, 1.80, 'material', true),
    (NULL, cat_teletechnika, 'Kable sieciowe', 'Kabel UTP Cat.6a', '10Gigabit', 'm', 0, 2.80, 'material', true),
    (NULL, cat_teletechnika, 'Kable sieciowe', 'Kabel FTP Cat.6 ekranowany', 'Z ekranowaniem', 'm', 0, 2.20, 'material', true),
    (NULL, cat_teletechnika, 'Gniazda sieciowe', 'Gniazdo komputerowe RJ45 Cat.6', 'Gniazdo sieciowe', 'szt', 0, 15.00, 'material', true),
    (NULL, cat_teletechnika, 'Gniazda sieciowe', 'Gniazdo podwójne RJ45 Cat.6', 'Podwójne gniazdo', 'szt', 0, 25.00, 'material', true),
    (NULL, cat_teletechnika, 'Patch panele', 'Patch panel 24-port Cat.6', '19" rack', 'szt', 0, 180.00, 'material', true),
    (NULL, cat_teletechnika, 'Patch panele', 'Patch panel 48-port Cat.6', '19" rack', 'szt', 0, 320.00, 'material', true);

END $$;
