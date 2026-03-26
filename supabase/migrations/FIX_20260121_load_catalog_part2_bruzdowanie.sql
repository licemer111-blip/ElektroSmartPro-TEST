-- =====================================================
-- CATALOG LOAD PART 2: Bruzdowanie + Trasy Kablowe
-- Optimized with ON CONFLICT
-- =====================================================

DO $$
DECLARE
  cat_przygotowanie UUID;
  cat_trasy UUID;
  inserted_count INTEGER := 0;
BEGIN

  -- Get category IDs
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' LIMIT 1;
  SELECT id INTO cat_trasy FROM catalog_categories WHERE name = 'Trasy Kablowe' LIMIT 1;

  -- =====================================================
  -- BRUZDOWANIE (Wall Chasing)
  -- =====================================================
  
  INSERT INTO catalog_items (user_id, category_id, name, unit, base_labor_price, base_material_price, sub_category, type)
  VALUES
    -- Bruzdy w różnych materiałach
    (NULL, cat_przygotowanie, 'Bruzda w tynku 20x20mm', 'm', 8.50, 0, 'Bruzdy w tynku', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w tynku 25x25mm', 'm', 10.00, 0, 'Bruzdy w tynku', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w tynku 30x30mm', 'm', 12.50, 0, 'Bruzdy w tynku', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w betonie 20x20mm', 'm', 15.00, 0, 'Bruzdy w betonie', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w betonie 25x25mm', 'm', 18.00, 0, 'Bruzdy w betonie', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w betonie 30x30mm', 'm', 22.00, 0, 'Bruzdy w betonie', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w cegłatynku 25x25mm', 'm', 11.50, 0, 'Bruzdy w cegle', 'labor'),
    (NULL, cat_przygotowanie, 'Bruzda w betonie komórkowym 25x25mm', 'm', 9.50, 0, 'Bruzdy w betonie komórkowym', 'labor'),
    
    -- Otwory pod puszki
    (NULL, cat_przygotowanie, 'Otwór pod puszkę fi60 w tynku', 'szt', 12.00, 0, 'Otwory pod puszki', 'labor'),
    (NULL, cat_przygotowanie, 'Otwór pod puszkę fi60 w betonie', 'szt', 22.00, 0, 'Otwory pod puszki', 'labor'),
    (NULL, cat_przygotowanie, 'Otwór pod puszkę fi60 w cegłatynku', 'szt', 15.00, 0, 'Otwory pod puszki', 'labor'),
    (NULL, cat_przygotowanie, 'Otwór pod puszkę podwójną w tynku', 'szt', 18.00, 0, 'Otwory pod puszki', 'labor'),
    (NULL, cat_przygotowanie, 'Otwór pod puszkę podwójną w betonie', 'szt', 32.00, 0, 'Otwory pod puszki', 'labor'),
    
    -- Otwory przejściowe
    (NULL, cat_przygotowanie, 'Prze bicie otworu fi20-25mm w ścianie', 'szt', 18.00, 0, 'Przebicia', 'labor'),
    (NULL, cat_przygotowanie, 'Przebicie otworu fi40-50mm w ścianie', 'szt', 32.00, 0, 'Przebicia', 'labor'),
    (NULL, cat_przygotowanie, 'Przebicie otworu fi80-100mm w ścianie', 'szt', 55.00, 0, 'Przebicia', 'labor'),
    (NULL, cat_przygotowanie, 'Przebicie stropufi20-25mm', 'szt', 28.00, 0, 'Przebicia', 'labor'),
    (NULL, cat_przygotowanie, 'Przebicie stropu fi40-50mm', 'szt', 48.00, 0, 'Przebicia', 'labor'),
    
    -- Zamykanie bruzd
    (NULL, cat_przygotowanie, 'Zam knięcie bruzdy gipsem', 'm', 5.50, 2.20, 'Zamykanie bruzd', 'mixed'),
    (NULL, cat_przygotowanie, 'Zamknięcie bruzdy zaprawą cementową', 'm', 6.20, 3.50, 'Zamykanie bruzd', 'mixed'),
    (NULL, cat_przygotowanie, 'Zatynkowanie bruzdy', 'm', 7.00, 4.00, 'Zamykanie bruzd', 'mixed')
  ON CONFLICT (user_id, name) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Bruzdowanie: % items inserted', inserted_count;

  -- =====================================================
  -- TRASY KABLOWE (Cable Routes)
  -- =====================================================
  
  INSERT INTO catalog_items (user_id, category_id, name, unit, base_labor_price, base_material_price, sub_category, type)
  VALUES
    -- Koryta kablowe
    (NULL, cat_trasy, 'Koryto kablowe perforowane 50mm', 'm', 15.00, 18.50, 'Koryta kablowe', 'mixed'),
    (NULL, cat_trasy, 'Koryto kablowe perforowane 100mm', 'm', 18.00, 28.00, 'Koryta kablowe', 'mixed'),
    (NULL, cat_trasy, 'Koryto kablowe perforowane 150mm', 'm', 22.00, 38.00, 'Koryta kablowe', 'mixed'),
    (NULL, cat_trasy, 'Koryto kablowe perforowane 200mm', 'm', 25.00, 52.00, 'Koryta kablowe', 'mixed'),
    (NULL, cat_trasy, 'Koryto kablowe perforowane 300mm', 'm', 32.00, 78.00, 'Koryta kablowe', 'mixed'),
    
    -- Drabinki kablowe
    (NULL, cat_trasy, 'Drabinka kablowa 100mm', 'm', 22.00, 42.00, 'Drabinki kablowe', 'mixed'),
    (NULL, cat_trasy, 'Drabinka kablowa 200mm', 'm', 28.00, 68.00, 'Drabinki kablowe', 'mixed'),
    (NULL, cat_trasy, 'Drabinka kablowa 300mm', 'm', 35.00, 95.00, 'Drabinki kablowe', 'mixed'),
    (NULL, cat_trasy, 'Drabinka kablowa 400mm', 'm', 42.00, 125.00, 'Drabinki kablowe', 'mixed'),
    (NULL, cat_trasy, 'Drabinka kablowa 600mm', 'm', 55.00, 185.00, 'Drabinki kablowe', 'mixed'),
    
    -- Listwy kablowe
    (NULL, cat_trasy, 'Listwa kablowa PCV 16x16mm', 'm', 4.50, 3.20, 'Listwy kablowe', 'mixed'),
    (NULL, cat_trasy, 'Listwa kablowa PCV 25x16mm', 'm', 5.00, 4.50, 'Listwy kablowe', 'mixed'),
    (NULL, cat_trasy, 'Listwa kablowa PCV 40x25mm', 'm', 6.50, 7.80, 'Listwy kablowe', 'mixed'),
    (NULL, cat_trasy, 'Listwa kablowa PCV 60x40mm', 'm', 8.50, 12.50, 'Listwy kablowe', 'mixed'),
    (NULL, cat_trasy, 'Listwa kablowa PCV 100x60mm', 'm', 12.00, 22.00, 'Listwy kablowe', 'mixed'),
    
    -- Rury ochronne
    (NULL, cat_trasy, 'Rura karbowana fi16mm (RKGL)', 'm', 3.50, 1.80, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura karbowana fi20mm (RKGL)', 'm', 4.00, 2.20, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura karbowana fi25mm (RKGL)', 'm', 4.80, 2.80, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura karbowana fi32mm (RKGL)', 'm', 5.50, 3.80, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura karbowana fi40mm (RKGL)', 'm', 6.50, 5.20, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura sztywna PCV fi16mm', 'm', 4.50, 3.50, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura sztywna PCV fi20mm', 'm', 5.00, 4.20, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura sztywna PCV fi25mm', 'm', 5.80, 5.50, 'Rury ochronne', 'mixed'),
    (NULL, cat_trasy, 'Rura stalowa fi20mm', 'm', 12.00, 18.00, 'Rury stalowe', 'mixed'),
    (NULL, cat_trasy, 'Rura stalowa fi25mm', 'm', 14.00, 22.00, 'Rury stalowe', 'mixed')
  ON CONFLICT (user_id, name) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Trasy Kablowe: % items inserted', inserted_count;

  RAISE NOTICE '=== COMPLETED: Part 2 loaded ===';

END $$;
