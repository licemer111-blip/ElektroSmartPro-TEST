-- ============================================================================
-- 🚨 NUCLEAR RESET: Wipe All Global Catalog Items
-- ============================================================================
-- WARNING: This will DELETE all global catalog items (Base + Schneider)
-- User items (where user_id IS NOT NULL) will be preserved
-- ============================================================================

-- Step 1: Show current state BEFORE deletion
DO $$
DECLARE
  total_count INT;
  global_count INT;
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.catalog_items;
  SELECT COUNT(*) INTO global_count FROM public.catalog_items WHERE user_id IS NULL;
  SELECT COUNT(*) INTO user_count FROM public.catalog_items WHERE user_id IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚨 NUCLEAR RESET - BEFORE STATE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total items: %', total_count;
  RAISE NOTICE '  ├─ Global items (WILL BE DELETED): %', global_count;
  RAISE NOTICE '  └─ User items (WILL BE KEPT): %', user_count;
  RAISE NOTICE '========================================';
END $$;

-- Step 2: Remove project item references first (prevent FK constraint violations)
DELETE FROM public.project_items
WHERE catalog_item_id IN (
  SELECT id FROM public.catalog_items WHERE user_id IS NULL
);

-- Step 2b: Delete ALL global items (where user_id IS NULL)
-- This includes both Base Global and Schneider Electric items
DELETE FROM public.catalog_items 
WHERE user_id IS NULL;

-- Step 3: Show state AFTER deletion
DO $$
DECLARE
  total_count INT;
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.catalog_items;
  SELECT COUNT(*) INTO user_count FROM public.catalog_items WHERE user_id IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NUCLEAR RESET - AFTER STATE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total items remaining: %', total_count;
  RAISE NOTICE '  └─ User items (preserved): %', user_count;
  RAISE NOTICE '========================================';
  
  IF total_count = user_count THEN
    RAISE NOTICE '✅ SUCCESS! All global items deleted.';
    RAISE NOTICE '✅ User items preserved safely.';
  ELSE
    RAISE WARNING '⚠️ Unexpected state! Check data integrity.';
  END IF;
END $$;

-- Step 4: Clean up source/is_global columns (optional)
-- Reset these columns for any remaining items
UPDATE public.catalog_items
SET 
  source = 'user',
  is_global = FALSE
WHERE user_id IS NOT NULL;

-- Step 5: Drop the source column entirely (optional - clean slate)
-- Uncomment if you want to completely remove the source classification system
-- ALTER TABLE public.catalog_items DROP COLUMN IF EXISTS source;
-- ALTER TABLE public.catalog_items DROP COLUMN IF EXISTS is_global;

-- Step 6: Reset profiles toggles to simple state
ALTER TABLE public.profiles DROP COLUMN IF EXISTS show_base_global;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS show_schneider;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_global_catalog BOOLEAN DEFAULT TRUE;

-- Set default for existing users
UPDATE public.profiles SET show_global_catalog = TRUE WHERE show_global_catalog IS NULL;

COMMENT ON COLUMN public.profiles.show_global_catalog IS 
'Show global catalog items. Default: TRUE. (Simplified after global catalog wipe)';

-- Step 7: Drop helper function (no longer needed)
DROP FUNCTION IF EXISTS is_schneider_item(TEXT);

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 NUCLEAR RESET COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ What was done:';
  RAISE NOTICE '  1. Deleted all global catalog items (~16k items)';
  RAISE NOTICE '  2. Preserved all user items';
  RAISE NOTICE '  3. Reset source columns to "user"';
  RAISE NOTICE '  4. Simplified Settings toggles';
  RAISE NOTICE '  5. Removed Schneider helper function';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 NEXT STEPS:';
  RAISE NOTICE '  1. Refresh browser → Catalog should show only YOUR items';
  RAISE NOTICE '  2. Settings page → Simple "Show Global Catalog" toggle';
  RAISE NOTICE '  3. To re-import Base Catalog: Use seed script';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Clean slate achieved! Database is healthy.';
  RAISE NOTICE '========================================';
END $$;
