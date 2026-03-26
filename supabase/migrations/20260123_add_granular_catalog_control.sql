-- ============================================================================
-- GRANULAR CATALOG CONTROL: Separate Base Global and Schneider
-- ============================================================================
-- Problem: Previous fix hid EVERYTHING. Users want to keep base items visible.
-- Solution: Two separate toggles:
--   1. show_base_global (Default: TRUE) - ~1600 core items
--   2. show_schneider (Default: FALSE) - ~15k Schneider items
-- ============================================================================

-- Step 1: Add new columns to profiles
-- ============================================================================

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS show_global_catalog;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_base_global BOOLEAN DEFAULT TRUE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_schneider BOOLEAN DEFAULT FALSE;

-- Step 2: Set defaults for existing users
-- ============================================================================

-- All users get base global items (enabled by default)
UPDATE public.profiles
SET show_base_global = TRUE
WHERE show_base_global IS NULL;

-- Schneider catalog is OFF by default (for performance)
UPDATE public.profiles
SET show_schneider = FALSE
WHERE show_schneider IS NULL;

-- Step 3: Add comments
-- ============================================================================

COMMENT ON COLUMN public.profiles.show_base_global IS 
'When TRUE, user sees base global catalog (~1600 core system items). 
Recommended: TRUE for most users. Default: TRUE.';

COMMENT ON COLUMN public.profiles.show_schneider IS 
'When TRUE, user sees Schneider Electric catalog (~15k items with Ref: codes). 
Warning: May slow down app. Recommended: FALSE unless needed. Default: FALSE.';

-- ============================================================================
-- Helper function to identify Schneider items
-- ============================================================================

CREATE OR REPLACE FUNCTION is_schneider_item(item_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT item_name LIKE '%Ref:%' OR item_name LIKE '%REF:%' OR item_name LIKE '%ref:%';
$$;

COMMENT ON FUNCTION is_schneider_item(TEXT) IS 
'Returns TRUE if item name contains "Ref:" (indicates Schneider Electric product).
Used to distinguish Schneider catalog (~15k items) from base global catalog (~1600 items).';

-- ============================================================================
-- Statistics
-- ============================================================================

DO $$
DECLARE
  total_items INT;
  schneider_items INT;
  base_global_items INT;
  user_items INT;
BEGIN
  -- Count all items
  SELECT COUNT(*) INTO total_items FROM public.catalog_items;
  
  -- Count Schneider items (name contains "Ref:")
  SELECT COUNT(*) INTO schneider_items 
  FROM public.catalog_items 
  WHERE user_id IS NULL 
    AND (name LIKE '%Ref:%' OR name LIKE '%REF:%' OR name LIKE '%ref:%');
  
  -- Count base global items (global but NOT Schneider)
  SELECT COUNT(*) INTO base_global_items 
  FROM public.catalog_items 
  WHERE user_id IS NULL 
    AND NOT (name LIKE '%Ref:%' OR name LIKE '%REF:%' OR name LIKE '%ref:%');
  
  -- Count user's own items
  SELECT COUNT(*) INTO user_items 
  FROM public.catalog_items 
  WHERE user_id IS NOT NULL;
  
  -- Log results
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ GRANULAR CATALOG CONTROL ENABLED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total items in database: %', total_items;
  RAISE NOTICE '  ├─ Base Global (show_base_global): %', base_global_items;
  RAISE NOTICE '  ├─ Schneider Electric (show_schneider): %', schneider_items;
  RAISE NOTICE '  └─ User''s Own Items: %', user_items;
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 Defaults for users:';
  RAISE NOTICE '  ├─ show_base_global = TRUE (enabled)';
  RAISE NOTICE '  └─ show_schneider = FALSE (disabled)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚡ Performance Impact:';
  RAISE NOTICE '  ├─ Base Global: Fast (<1s load time)';
  RAISE NOTICE '  └─ Schneider: Slow if enabled (use pagination)';
  RAISE NOTICE '========================================';
END $$;
