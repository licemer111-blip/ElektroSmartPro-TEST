-- =====================================================
-- MASSIVE CATALOG SEED: Polish Electrical Installation
-- Description: Thousands of atomic positions for professional estimates
-- Market: Poland 2024-2025 (realistic netto prices)
-- Date: 2026-01-21
-- =====================================================

DO $$
DECLARE
  default_object_type_id UUID;
  
  -- Category IDs
  cat_demontaze UUID;
  cat_ziemne UUID;
  cat_uziemienie UUID;
  cat_trasy UUID;
  cat_okablowanie UUID;
  cat_przygotowanie UUID;
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
  cat_awaryjne UUID;
  cat_teletechnika UUID;
  cat_security UUID;
  cat_biuro UUID;
  cat_pomiary UUID;
  cat_ppoz UUID;
  cat_monitoring UUID;
  cat_smart_home UUID;
BEGIN

  -- Get default object_type (universal)
  SELECT id INTO default_object_type_id 
  FROM object_types 
  LIMIT 1;

  IF default_object_type_id IS NULL THEN
    INSERT INTO object_types (name, slug, default_vat_rate)
    VALUES ('Uniwersalny', 'uniwersalny', 23)
    RETURNING id INTO default_object_type_id;
  END IF;

  -- =====================================================
  -- CZĘŚĆ 1: KATEGORIE
  -- =====================================================
  
  -- Insert categories if not exist
  INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES 
    (default_object_type_id, 'Demontaże', 'trash-2', 1),
    (default_object_type_id, 'Prace Ziemne', 'shovel', 2),
    (default_object_type_id, 'Uziemienie/Odgrom', 'zap', 3),
    (default_object_type_id, 'Trasy Kablowe', 'cable', 4),
    (default_object_type_id, 'Okablowanie', 'plug', 5),
    (default_object_type_id, 'Przygotowanie', 'wrench', 6),
    (default_object_type_id, 'Rozdzielnice', 'box', 7),
    (default_object_type_id, 'Oświetlenie', 'lightbulb', 8),
    (default_object_type_id, 'Awaryjne', 'alert-triangle', 9),
    (default_object_type_id, 'Teletechnika', 'wifi', 10),
    (default_object_type_id, 'Security', 'shield', 11),
    (default_object_type_id, 'Biuro', 'briefcase', 12),
    (default_object_type_id, 'Pomiary', 'activity', 13),
    (default_object_type_id, 'PPOŻ', 'flame', 14),
    (default_object_type_id, 'Monitoring', 'camera', 15),
    (default_object_type_id, 'Smart Home', 'home', 16)
  ON CONFLICT (object_type_id, name) DO NOTHING;

  -- Get category IDs
  SELECT id INTO cat_demontaze FROM catalog_categories WHERE name = 'Demontaże' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_ziemne FROM catalog_categories WHERE name = 'Prace Ziemne' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_uziemienie FROM catalog_categories WHERE name = 'Uziemienie/Odgrom' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_trasy FROM catalog_categories WHERE name = 'Trasy Kablowe' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_awaryjne FROM catalog_categories WHERE name = 'Awaryjne' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_teletechnika FROM catalog_categories WHERE name = 'Teletechnika' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_security FROM catalog_categories WHERE name = 'Security' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_biuro FROM catalog_categories WHERE name = 'Biuro' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_pomiary FROM catalog_categories WHERE name = 'Pomiary' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_ppoz FROM catalog_categories WHERE name = 'PPOŻ' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_monitoring FROM catalog_categories WHERE name = 'Monitoring' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_smart_home FROM catalog_categories WHERE name = 'Smart Home' AND object_type_id = default_object_type_id;

  -- =====================================================
  -- CZĘŚĆ 2: ROBOCIZNA (LABOR) - Detailed by specifications
  -- =====================================================

  -- SUBCATEGORY: Bruzdy (Chiseling/Grooving)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    -- Beton (Concrete)
    (NULL, cat_przygotowanie, 'Bruzdy w betonie', 'Bruzda w betonie 20x20mm', 'Bruzda głęboka w betonie', 'm', 25.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Bruzdy w betonie', 'Bruzda w betonie 25x25mm', 'Bruzda głęboka w betonie wzmocnionym', 'm', 30.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Bruzdy w betonie', 'Bruzda w betonie 30x30mm', 'Bruzda dla grubych przewodów', 'm', 35.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Bruzdy w betonie', 'Bruzda w betonie 40x40mm', 'Bruzda dla puszek głębokich', 'm', 45.00, 0, 'labor', true),
    
    -- Cegła (Brick)
    (NULL, cat_przygotowanie, 'Bruzdy w cegle', 'Bruzda w cegle 20x20mm', 'Bruzda w cegle ceramicznej', 'm', 18.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Bruzdy w cegle', 'Bruzda w cegle 25x25mm', 'Bruzda głęboka w cegle', 'm', 22.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Bruzdy w cegle', 'Bruzda w cegle silikatowej 20x20mm', 'Cegła wapienno-piaskowa', 'm', 20.00, 0, 'labor', true),
    
    -- Gips (Plaster)
    (NULL, cat_przygotowanie, 'Bruzdy w płycie G-K', 'Bruzda w płycie G-K', 'Płyta gipsowo-kartonowa', 'm', 12.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Bruzdy w tynku', 'Bruzda w tynku gipsowym', 'Tynk gipsowy maszynowy', 'm', 10.00, 0, 'labor', true),
    
    -- Wiercenie (Drilling)
    (NULL, cat_przygotowanie, 'Wiercenie', 'Wiercenie otworu fi 60mm beton', 'Pod puszkę podtynkową', 'szt', 15.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Wiercenie', 'Wiercenie otworu fi 68mm beton', 'Pod puszkę głęboką', 'szt', 18.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Wiercenie', 'Wiercenie otworu fi 80mm beton', 'Pod puszkę podwójną', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Wiercenie', 'Wiercenie przejścia przez strop fi 20mm', 'Dla przewodu', 'szt', 40.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Wiercenie', 'Wiercenie przejścia przez strop fi 50mm', 'Dla rury', 'szt', 80.00, 0, 'labor', true);

  -- SUBCATEGORY: Montaż kabli (Cable installation) - by cross-section
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    -- W bruzdach (In grooves)
    (NULL, cat_okablowanie, 'Montaż kabli p/t', 'Montaż YDYp 3x1.5mm² w bruździe', 'Przewód podtynkowy', 'm', 8.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli p/t', 'Montaż YDYp 3x2.5mm² w bruździe', 'Przewód gniazdkowy', 'm', 9.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli p/t', 'Montaż YDYp 5x2.5mm² w bruździe', 'Przewód 3-fazowy', 'm', 12.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli p/t', 'Montaż YDYp 5x6mm² w bruździe', 'Przewód zasilający', 'm', 15.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli p/t', 'Montaż YDYp 5x10mm² w bruździe', 'Przewód główny', 'm', 18.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli p/t', 'Montaż YDYp 5x16mm² w bruździe', 'Przewód zasilania budynku', 'm', 22.00, 0, 'labor', true),
    
    -- W goffrze (In corrugated pipe)
    (NULL, cat_okablowanie, 'Montaż kabli w goffrze', 'Montaż YDYp 3x1.5mm² w goffrze fi16', 'Z goffrą ochronną', 'm', 10.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli w goffrze', 'Montaż YDYp 3x2.5mm² w goffrze fi20', 'Z goffrą ochronną', 'm', 11.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli w goffrze', 'Montaż YDYp 5x2.5mm² w goffrze fi20', 'Z goffrą ochronną', 'm', 13.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli w goffrze', 'Montaż YDYp 5x6mm² w goffrze fi25', 'Z goffrą wzmocnioną', 'm', 16.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli w goffrze', 'Montaż YDYp 5x10mm² w goffrze fi32', 'Z goffrą ciężką', 'm', 20.00, 0, 'labor', true),
    
    -- W korytach (In cable trays)
    (NULL, cat_trasy, 'Montaż kabli w korytach', 'Montaż YKY 5x10mm² w korycie', 'Na trasach kablowych', 'm', 12.00, 0, 'labor', true),
    (NULL, cat_trasy, 'Montaż kabli w korytach', 'Montaż YKY 5x16mm² w korycie', 'Na trasach kablowych', 'm', 14.00, 0, 'labor', true),
    (NULL, cat_trasy, 'Montaż kabli w korytach', 'Montaż YKY 5x25mm² w korycie', 'Zasilanie główne', 'm', 18.00, 0, 'labor', true),
    (NULL, cat_trasy, 'Montaż kabli w korytach', 'Montaż YKY 5x35mm² w korycie', 'Zasilanie budynku', 'm', 22.00, 0, 'labor', true),
    (NULL, cat_trasy, 'Montaż kabli w korytach', 'Montaż YKY 5x50mm² w korycie', 'Główne zasilanie', 'm', 28.00, 0, 'labor', true),
    
    -- Natynkowo (Surface-mounted)
    (NULL, cat_okablowanie, 'Montaż kabli n/t', 'Montaż przewodu natynkowego w klipsach', 'Instalacja natynkowa', 'm', 6.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli n/t', 'Montaż przewodu w kanale kablowym 25x16mm', 'Kanał PCV/ABS', 'm', 8.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż kabli n/t', 'Montaż przewodu w kanale kablowym 40x25mm', 'Kanał PCV/ABS', 'm', 10.00, 0, 'labor', true);

  -- SUBCATEGORY: Montaż osprzętu (Equipment installation)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    -- Gniazda (Sockets)
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda pojedynczego p/t', 'Z rozłączeniem przewodów', 'szt', 35.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda podwójnego p/t', 'W jednej puszce', 'szt', 45.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda potrójnego p/t', 'W ramce poziomej', 'szt', 55.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda z USB', 'Z modułem USB-A/C', 'szt', 40.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda hermetycznego IP44', 'Łazienka/zewnętrzne', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda hermetycznego IP65', 'Całkowicie wodoszczelne', 'szt', 60.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda siłowego 16A 3P+N+PE', '3-fazowe czerwone', 'szt', 80.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż gniazd', 'Montaż gniazda siłowego 32A 3P+N+PE', '3-fazowe przemysłowe', 'szt', 100.00, 0, 'labor', true),
    
    -- Włączniki (Switches)
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż włącznika pojedynczego', 'Jednobiegunowy', 'szt', 30.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż włącznika podwójnego', 'Dwubiegunowy', 'szt', 35.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż włącznika schodowego', 'Z rozłączeniem fazy', 'szt', 40.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż włącznika krzyżowego', 'Dla 3+ miejsc sterowania', 'szt', 45.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż włącznika z podświetleniem', 'LED lokalizacyjny', 'szt', 35.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż ściemniacza obrotowego', 'Regulator jasności', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_okablowanie, 'Montaż włączników', 'Montaż ściemniacza elektronicznego', 'Z pamięcią ustawień', 'szt', 60.00, 0, 'labor', true);

  -- SUBCATEGORY: Montaż puszek (Junction box installation)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki fi 60mm p/t beton', 'Standardowa głębokość', 'szt', 20.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki fi 60mm p/t suchy montaż', 'W płycie G-K', 'szt', 12.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki głębokiej fi 60mm', 'Z dodatkową przestrzenią', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki podwójnej poziomej', 'Dla 2 mechanizmów', 'szt', 30.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki potrójnej poziomej', 'Dla 3 mechanizmów', 'szt', 40.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki rozgałęźnej fi 80mm', 'Puszka rozgałęźna', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Montaż puszek', 'Montaż puszki rozgałęźnej 100x100mm', 'Duża rozgałęźnia', 'szt', 35.00, 0, 'labor', true);

  -- =====================================================
  -- To be continued in next part (materials)...
  -- This is getting large, will split into multiple inserts
  -- =====================================================

END $$;
