-- =====================================================
-- FIX: Load remaining catalog items (optimized version)
-- This file combines all parts with proper error handling
-- Uses ON CONFLICT to skip duplicates
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
  
  inserted_count INTEGER := 0;
BEGIN

  -- Get default object_type
  SELECT id INTO default_object_type_id 
  FROM object_types 
  LIMIT 1;

  -- =====================================================
  -- ENSURE ALL CATEGORIES EXIST
  -- =====================================================
  
  INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES 
    (default_object_type_id, 'Demontaże', 'trash-2', 1),
    (default_object_type_id, 'Prace Ziemne', 'shovel', 2),
    (default_object_type_id, 'Uziemienie', 'zap', 3),
    (default_object_type_id, 'Trasy Kablowe', 'package', 4),
    (default_object_type_id, 'Okablowanie', 'cable', 5),
    (default_object_type_id, 'Przygotowanie', 'wrench', 6),
    (default_object_type_id, 'Rozdzielnice', 'box', 7),
    (default_object_type_id, 'Oświetlenie', 'lightbulb', 8),
    (default_object_type_id, 'Oświetlenie Awaryjne', 'alert-triangle', 9),
    (default_object_type_id, 'Teletechnika', 'phone', 10),
    (default_object_type_id, 'Security', 'shield', 11),
    (default_object_type_id, 'Biuro', 'briefcase', 12),
    (default_object_type_id, 'Pomiary', 'activity', 13),
    (default_object_type_id, 'PPOŻ', 'flame', 14),
    (default_object_type_id, 'Monitoring', 'video', 15),
    (default_object_type_id, 'Smart Home', 'smartphone', 16)
  ON CONFLICT (object_type_id, name) DO NOTHING;

  -- Get category IDs
  SELECT id INTO cat_demontaze FROM catalog_categories WHERE name = 'Demontaże' LIMIT 1;
  SELECT id INTO cat_ziemne FROM catalog_categories WHERE name = 'Prace Ziemne' LIMIT 1;
  SELECT id INTO cat_uziemienie FROM catalog_categories WHERE name = 'Uziemienie' LIMIT 1;
  SELECT id INTO cat_trasy FROM catalog_categories WHERE name = 'Trasy Kablowe' LIMIT 1;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' LIMIT 1;
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' LIMIT 1;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_awaryjne FROM catalog_categories WHERE name = 'Oświetlenie Awaryjne' LIMIT 1;
  SELECT id INTO cat_teletechnika FROM catalog_categories WHERE name = 'Teletechnika' LIMIT 1;
  SELECT id INTO cat_security FROM catalog_categories WHERE name = 'Security' LIMIT 1;
  SELECT id INTO cat_biuro FROM catalog_categories WHERE name = 'Biuro' LIMIT 1;
  SELECT id INTO cat_pomiary FROM catalog_categories WHERE name = 'Pomiary' LIMIT 1;
  SELECT id INTO cat_ppoz FROM catalog_categories WHERE name = 'PPOŻ' LIMIT 1;
  SELECT id INTO cat_monitoring FROM catalog_categories WHERE name = 'Monitoring' LIMIT 1;
  SELECT id INTO cat_smart_home FROM catalog_categories WHERE name = 'Smart Home' LIMIT 1;

  RAISE NOTICE 'Categories loaded successfully';

  -- =====================================================
  -- BATCH 1: DEMONTAŻE (Demolition Work)
  -- =====================================================
  
  INSERT INTO catalog_items (user_id, category_id, name, unit, base_labor_price, base_material_price, sub_category, type)
  VALUES
    -- Demontaż instalacji
    (NULL, cat_demontaze, 'Demontaż przewodów elektrycznych', 'm', 3.50, 0, 'Demontaż instalacji', 'labor'),
    (NULL, cat_demontaze, 'Demontaż kabli w listwach', 'm', 4.20, 0, 'Demontaż instalacji', 'labor'),
    (NULL, cat_demontaze, 'Demontaż koryt kablowych', 'm', 5.80, 0, 'Demontaż instalacji', 'labor'),
    (NULL, cat_demontaze, 'Demontaż rur ochronnych PCV', 'm', 4.50, 0, 'Demontaż instalacji', 'labor'),
    (NULL, cat_demontaze, 'Demontaż rur stalowych', 'm', 6.20, 0, 'Demontaż instalacji', 'labor'),
    
    -- Demontaż wyposażenia
    (NULL, cat_demontaze, 'Demontaż oprawy oświetleniowej', 'szt', 12.00, 0, 'Demontaż wyposażenia', 'labor'),
    (NULL, cat_demontaze, 'Demontaż gniazda wtyczkowego', 'szt', 8.50, 0, 'Demontaż wyposażenia', 'labor'),
    (NULL, cat_demontaze, 'Demontaż łącznika', 'szt', 7.50, 0, 'Demontaż wyposażenia', 'labor'),
    (NULL, cat_demontaze, 'Demontaż puszki instalacyjnej', 'szt', 6.00, 0, 'Demontaż wyposażenia', 'labor'),
    (NULL, cat_demontaze, 'Demontaż tablicy rozdzielczej', 'szt', 45.00, 0, 'Demontaż wyposażenia', 'labor'),
    
    -- Demontaż systemów
    (NULL, cat_demontaze, 'Demontaż kamery CCTV', 'szt', 35.00, 0, 'Demontaż systemów', 'labor'),
    (NULL, cat_demontaze, 'Demontaż czujki alarmowej', 'szt', 18.00, 0, 'Demontaż systemów', 'labor'),
    (NULL, cat_demontaze, 'Demontaż czujki pożarowej', 'szt', 22.00, 0, 'Demontaż systemów', 'labor'),
    (NULL, cat_demontaze, 'Demontaż domofonu', 'szt', 28.00, 0, 'Demontaż systemów', 'labor'),
    (NULL, cat_demontaze, 'Demontaż sygnalizatora', 'szt', 15.00, 0, 'Demontaż systemów', 'labor')
  ON CONFLICT (user_id, name) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Batch 1 (Demontaże): % items inserted', inserted_count;

  -- =====================================================
  -- BATCH 2: PRACE ZIEMNE (Earthworks)
  -- =====================================================
  
  INSERT INTO catalog_items (user_id, category_id, name, unit, base_labor_price, base_material_price, sub_category, type)
  VALUES
    -- Wykopy ręczne
    (NULL, cat_ziemne, 'Wykop rów w gruncie kat. I-II (ręcznie)', 'm3', 85.00, 0, 'Wykopy ręczne', 'labor'),
    (NULL, cat_ziemne, 'Wykop rów w gruncie kat. III (ręcznie)', 'm3', 120.00, 0, 'Wykopy ręczne', 'labor'),
    (NULL, cat_ziemne, 'Wykop rowu pod kabel 0.6m głębokości', 'm', 18.00, 0, 'Wykopy ręczne', 'labor'),
    (NULL, cat_ziemne, 'Wykop rowu pod kabel 0.8m głębokości', 'm', 24.00, 0, 'Wykopy ręczne', 'labor'),
    (NULL, cat_ziemne, 'Wykop rowu pod kabel 1.0m głębokości', 'm', 32.00, 0, 'Wykopy ręczne', 'labor'),
    
    -- Wykopy mechaniczne
    (NULL, cat_ziemne, 'Wykop mechaniczny koparką (grunt I-II)', 'm3', 35.00, 0, 'Wykopy mechaniczne', 'labor'),
    (NULL, cat_ziemne, 'Wykop mechaniczny koparką (grunt III)', 'm3', 48.00, 0, 'Wykopy mechaniczne', 'labor'),
    (NULL, cat_ziemne, 'Wykop wąskoprzestrzenny pod kable', 'm', 12.00, 0, 'Wykopy mechaniczne', 'labor'),
    
    -- Zasypki i ubijanie
    (NULL, cat_ziemne, 'Zasypka rowu z ubijanem ręcznym', 'm3', 45.00, 0, 'Zasypki', 'labor'),
    (NULL, cat_ziemne, 'Zasypka rowu z ubijaniem mechanicznym', 'm3', 28.00, 0, 'Zasypki', 'labor'),
    (NULL, cat_ziemne, 'Podsypka piaskowa pod kable', 'm3', 15.00, 85.00, 'Zasypki', 'mixed'),
    (NULL, cat_ziemne, 'Obsypka piaskowa kabli', 'm3', 12.00, 85.00, 'Zasypki', 'mixed'),
    
    -- Transport gruntu
    (NULL, cat_ziemne, 'Załadunek i wywóz ziemi (do 5km)', 'm3', 18.00, 25.00, 'Transport', 'mixed'),
    (NULL, cat_ziemne, 'Załadunek i wywóz ziemi (5-10km)', 'm3', 22.00, 32.00, 'Transport', 'mixed'),
    (NULL, cat_ziemne, 'Załadunek i wywóz gruzu', 'm3', 25.00, 40.00, 'Transport', 'mixed')
  ON CONFLICT (user_id, name) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Batch 2 (Prace Ziemne): % items inserted', inserted_count;

  RAISE NOTICE '=== COMPLETED: First 2 batches loaded ===';
  RAISE NOTICE 'Run the next migration file to continue...';

END $$;
