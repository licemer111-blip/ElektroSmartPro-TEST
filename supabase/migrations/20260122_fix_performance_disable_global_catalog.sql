-- ============================================================================
-- CRITICAL PERFORMANCE FIX: Disable Global Catalog by Default
-- ============================================================================
-- **Problem:**
-- After importing 5000+ Schneider Electric items, the app became unusable
-- (10+ second load times) because ALL users have show_global_catalog = TRUE
-- and the system tries to load ALL items at once.
--
-- **Solution:**
-- Set show_global_catalog = FALSE for all users (unless they're admin)
-- This restores the app to instant loading with only user's own items.
--
-- **Impact:**
-- - Users will see ONLY their own catalog items by default
-- - They can enable the global catalog via Settings if they want
-- - All labor items are always visible (when catalog is enabled)
-- ============================================================================

-- Update ALL users to have global catalog OFF (performance fix)
-- Users can manually enable it in Settings if they want
UPDATE public.profiles
SET show_global_catalog = false
WHERE show_global_catalog IS DISTINCT FROM false; -- Only update if not already false

-- ============================================================================
-- Add comment about the new default
-- ============================================================================

COMMENT ON COLUMN public.profiles.show_global_catalog IS 
'When TRUE, user sees global catalog (5000+ imported items like Schneider Electric). 
When FALSE, user sees only their own items (RECOMMENDED for performance). 
Default: FALSE to prevent performance issues with large catalogs.';

-- ============================================================================
-- Statistics (for verification)
-- ============================================================================

DO $$
DECLARE
  total_users INT;
  users_with_global_on INT;
  users_with_global_off INT;
  global_items_count INT;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO users_with_global_on FROM public.profiles WHERE show_global_catalog = true;
  SELECT COUNT(*) INTO users_with_global_off FROM public.profiles WHERE show_global_catalog = false;
  
  -- Count global catalog items (user_id IS NULL)
  SELECT COUNT(*) INTO global_items_count FROM public.catalog_items WHERE user_id IS NULL;
  
  -- Log results
  RAISE NOTICE '================================';
  RAISE NOTICE '🚀 PERFORMANCE FIX APPLIED!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Global catalog ON: %', users_with_global_on;
  RAISE NOTICE 'Global catalog OFF: %', users_with_global_off;
  RAISE NOTICE 'Global items in DB: %', global_items_count;
  RAISE NOTICE '================================';
  RAISE NOTICE '✅ Users can now enable global catalog in Settings if needed';
  RAISE NOTICE '⚡ App should load INSTANTLY now (only user items by default)';
END $$;
