-- =====================================================
-- MIGRATION: Convert ALL existing catalog_items to GLOBAL
-- This is "The Great Merge" - consolidates all user items into one global catalog
-- =====================================================

DO $$
DECLARE
  duplicate_count INTEGER := 0;
  converted_count INTEGER := 0;
BEGIN

  RAISE NOTICE '🔄 Starting Global Catalog Conversion...';

  -- =====================================================
  -- STEP 1: Remove duplicates (keep the oldest item for each name)
  -- =====================================================
  
  RAISE NOTICE 'Step 1: Removing duplicate items...';
  
  WITH duplicates AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
    FROM catalog_items
    WHERE user_id IS NOT NULL
  )
  DELETE FROM catalog_items
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE '✅ Removed % duplicate items', duplicate_count;

  -- =====================================================
  -- STEP 2: Convert ALL remaining items to GLOBAL (user_id = NULL)
  -- =====================================================
  
  RAISE NOTICE 'Step 2: Converting all items to GLOBAL status...';
  
  UPDATE catalog_items
  SET user_id = NULL
  WHERE user_id IS NOT NULL;
  
  GET DIAGNOSTICS converted_count = ROW_COUNT;
  RAISE NOTICE '✅ Converted % items to GLOBAL', converted_count;

  -- =====================================================
  -- STEP 3: Update unique constraint to enforce global uniqueness
  -- =====================================================
  
  RAISE NOTICE 'Step 3: Updating constraints...';
  
  -- Drop old constraint (user_id, name)
  ALTER TABLE catalog_items 
  DROP CONSTRAINT IF EXISTS catalog_items_user_id_name_key;
  
  -- Add new constraint: unique names for global items, but users can have duplicates
  -- This allows: 1 global "Kabel YDYp" + User A can create "Kabel YDYp" + User B can create "Kabel YDYp"
  CREATE UNIQUE INDEX IF NOT EXISTS catalog_items_global_unique_name 
  ON catalog_items (name) 
  WHERE user_id IS NULL;
  
  -- Keep uniqueness for user items (user can't have 2 items with same name)
  CREATE UNIQUE INDEX IF NOT EXISTS catalog_items_user_unique_name 
  ON catalog_items (user_id, name) 
  WHERE user_id IS NOT NULL;
  
  RAISE NOTICE '✅ Constraints updated';

  -- =====================================================
  -- SUMMARY
  -- =====================================================
  
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Duplicates removed: %', duplicate_count;
  RAISE NOTICE 'Items converted to GLOBAL: %', converted_count;
  RAISE NOTICE 'Total GLOBAL items now: %', (SELECT COUNT(*) FROM catalog_items WHERE user_id IS NULL);

END $$;
