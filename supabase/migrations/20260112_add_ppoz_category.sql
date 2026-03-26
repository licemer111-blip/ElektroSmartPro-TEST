-- ========================================
-- 🔥 ADD MISSING CATEGORIES: PPOŻ + MONITORING
-- ========================================
-- Adds 2 missing categories:
-- 1. "PPOŻ" (Fire Protection) - 41 items
-- 2. "Monitoring" (CCTV/Security) - 78 items
-- Total: 119 items will be unlocked
-- ========================================

DO $$
DECLARE
  default_object_type_id UUID;
  cat_ppoz UUID;
  cat_monitoring UUID;
BEGIN
  -- Get first object_type
  SELECT id INTO default_object_type_id FROM object_types LIMIT 1;

  IF default_object_type_id IS NULL THEN
    RAISE EXCEPTION 'No object_type found. Please create at least one object_type first.';
  END IF;

  -- ========================================
  -- 1. ADD PPOŻ CATEGORY (Fire Protection)
  -- ========================================
  SELECT id INTO cat_ppoz 
  FROM catalog_categories 
  WHERE name = 'PPOŻ' AND object_type_id = default_object_type_id;

  IF cat_ppoz IS NULL THEN
    INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
    VALUES (default_object_type_id, 'PPOŻ', 'flame', 14)
    RETURNING id INTO cat_ppoz;

    RAISE NOTICE '✅ Created PPOŻ category with ID: %', cat_ppoz;
  ELSE
    RAISE NOTICE '⚠️  PPOŻ category already exists with ID: %', cat_ppoz;
  END IF;

  -- ========================================
  -- 2. ADD MONITORING CATEGORY (CCTV)
  -- ========================================
  SELECT id INTO cat_monitoring 
  FROM catalog_categories 
  WHERE name = 'Monitoring' AND object_type_id = default_object_type_id;

  IF cat_monitoring IS NULL THEN
    INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
    VALUES (default_object_type_id, 'Monitoring', 'video', 15)
    RETURNING id INTO cat_monitoring;

    RAISE NOTICE '✅ Created Monitoring category with ID: %', cat_monitoring;
  ELSE
    RAISE NOTICE '⚠️  Monitoring category already exists with ID: %', cat_monitoring;
  END IF;

  RAISE NOTICE '🎉 Migration complete! 2 categories added (PPOŻ + Monitoring)';

END $$;
