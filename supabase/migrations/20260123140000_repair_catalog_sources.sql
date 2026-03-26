-- ============================================================================
-- CRITICAL DATA REPAIR: Classify All "Orphaned" Catalog Items
-- ============================================================================
-- Problem: 16,133 items exist in database but are invisible in UI
-- Cause: Items have source = NULL or incorrect flags, don't match filters
-- Solution: Classify ALL items based on name pattern and user_id
-- ============================================================================

-- Step 1: Add source column if it doesn't exist (safety check)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.catalog_items ADD COLUMN source TEXT;
    RAISE NOTICE 'Added source column to catalog_items';
  ELSE
    RAISE NOTICE 'Column source already exists';
  END IF;
END $$;

-- Step 2: Add is_global column if it doesn't exist (safety check)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'is_global'
  ) THEN
    ALTER TABLE public.catalog_items ADD COLUMN is_global BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_global column to catalog_items';
  ELSE
    RAISE NOTICE 'Column is_global already exists';
  END IF;
END $$;

-- Step 3: Classify Schneider Electric Items
-- ============================================================================
-- Items with "Ref:" in name are Schneider Electric products
-- Set source = 'schneider', is_global = TRUE, ensure user_id = NULL

UPDATE public.catalog_items
SET 
  source = 'schneider',
  is_global = TRUE,
  user_id = NULL
WHERE 
  (name ILIKE '%Ref:%' OR name ILIKE '%REF:%' OR name ILIKE '%ref:%')
  AND (source IS DISTINCT FROM 'schneider' OR is_global IS DISTINCT FROM TRUE OR user_id IS NOT NULL);

-- Step 4: Classify Base Global Items
-- ============================================================================
-- Items WITHOUT "Ref:" and user_id IS NULL are base global catalog
-- Set source = 'global', is_global = TRUE

UPDATE public.catalog_items
SET 
  source = 'global',
  is_global = TRUE
WHERE 
  user_id IS NULL
  AND NOT (name ILIKE '%Ref:%' OR name ILIKE '%REF:%' OR name ILIKE '%ref:%')
  AND (source IS DISTINCT FROM 'global' OR is_global IS DISTINCT FROM TRUE);

-- Step 5: Classify User Items
-- ============================================================================
-- Items with user_id NOT NULL are user's own items
-- Set source = 'user', is_global = FALSE

UPDATE public.catalog_items
SET 
  source = 'user',
  is_global = FALSE
WHERE 
  user_id IS NOT NULL
  AND (source IS DISTINCT FROM 'user' OR is_global IS DISTINCT FROM FALSE);

-- Step 6: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_catalog_items_source 
ON public.catalog_items(source);

CREATE INDEX IF NOT EXISTS idx_catalog_items_is_global 
ON public.catalog_items(is_global);

CREATE INDEX IF NOT EXISTS idx_catalog_items_user_id_source 
ON public.catalog_items(user_id, source);

-- Step 7: Display classification results
-- ============================================================================

DO $$
DECLARE
  schneider_count INT;
  base_global_count INT;
  user_count INT;
  total_count INT;
  null_source_count INT;
BEGIN
  -- Count Schneider items
  SELECT COUNT(*) INTO schneider_count 
  FROM public.catalog_items 
  WHERE source = 'schneider';
  
  -- Count Base Global items
  SELECT COUNT(*) INTO base_global_count 
  FROM public.catalog_items 
  WHERE source = 'global';
  
  -- Count User items
  SELECT COUNT(*) INTO user_count 
  FROM public.catalog_items 
  WHERE source = 'user';
  
  -- Count total items
  SELECT COUNT(*) INTO total_count 
  FROM public.catalog_items;
  
  -- Count items with NULL source (should be 0 after repair)
  SELECT COUNT(*) INTO null_source_count 
  FROM public.catalog_items 
  WHERE source IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚨 CRITICAL DATA REPAIR COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total items in database: %', total_count;
  RAISE NOTICE '  ├─ Base Global (source=global): %', base_global_count;
  RAISE NOTICE '  ├─ Schneider Electric (source=schneider): %', schneider_count;
  RAISE NOTICE '  ├─ User Items (source=user): %', user_count;
  RAISE NOTICE '  └─ NULL source (orphaned): %', null_source_count;
  RAISE NOTICE '========================================';
  
  IF null_source_count > 0 THEN
    RAISE WARNING '⚠️ Still have % items with NULL source! Check data.', null_source_count;
  ELSE
    RAISE NOTICE '✅ All items classified successfully!';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Expected Results:';
  RAISE NOTICE '  ├─ Base Global: ~1,600 items';
  RAISE NOTICE '  ├─ Schneider: ~15,000 items';
  RAISE NOTICE '  └─ Total Global: ~16,600 items';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔄 Next Steps:';
  RAISE NOTICE '  1. Refresh Settings page → counts should be correct';
  RAISE NOTICE '  2. Open Catalog page → items should be visible';
  RAISE NOTICE '  3. Toggle Schneider ON → see all 16k items';
  RAISE NOTICE '========================================';
END $$;

-- Step 8: Add column comments
-- ============================================================================

COMMENT ON COLUMN public.catalog_items.source IS 
'Item source: "global" (base catalog), "schneider" (Schneider Electric), "user" (user-added). Used for filtering and classification.';

COMMENT ON COLUMN public.catalog_items.is_global IS 
'TRUE if item is part of global catalog (base or Schneider), FALSE if user-added. Used for quick filtering.';

-- Step 9: Verify data integrity
-- ============================================================================

-- Check for any items that might have slipped through
DO $$
DECLARE
  unclassified_count INT;
BEGIN
  SELECT COUNT(*) INTO unclassified_count
  FROM public.catalog_items
  WHERE source IS NULL OR source NOT IN ('global', 'schneider', 'user');
  
  IF unclassified_count > 0 THEN
    RAISE WARNING '⚠️ Found % unclassified items! Manual review needed.', unclassified_count;
    
    -- Show sample of unclassified items
    RAISE NOTICE 'Sample unclassified items:';
    PERFORM name, user_id, source, is_global
    FROM public.catalog_items
    WHERE source IS NULL OR source NOT IN ('global', 'schneider', 'user')
    LIMIT 5;
  END IF;
END $$;
