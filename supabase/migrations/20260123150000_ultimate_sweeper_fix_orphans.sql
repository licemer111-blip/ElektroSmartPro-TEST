-- ============================================================================
-- ULTIMATE SWEEPER: Classify ALL "Orphaned" Items (Multi-Stage Strategy)
-- ============================================================================
-- Problem: Thousands of items have source = NULL despite previous repair
-- Root Cause: Previous migration only checked "Ref:" pattern
-- Solution: Use multi-stage classification with fallback rules
-- ============================================================================

-- ============================================================================
-- STAGE 1: Secure ALL Labor/Services (High Confidence)
-- ============================================================================
-- Labor is almost ALWAYS Base Global (unless user-added)
-- Priority: Highest (most confident classification)

UPDATE public.catalog_items
SET 
  source = 'global',
  is_global = TRUE
WHERE 
  type = 'labor'
  AND user_id IS NULL
  AND source IS NULL;

-- Report Stage 1
DO $$
DECLARE
  labor_fixed INT;
BEGIN
  SELECT COUNT(*) INTO labor_fixed 
  FROM public.catalog_items 
  WHERE type = 'labor' AND source = 'global';
  
  RAISE NOTICE '✅ STAGE 1: Secured % labor items as Base Global', labor_fixed;
END $$;

-- ============================================================================
-- STAGE 2: Schneider Items (Multiple Pattern Detection)
-- ============================================================================
-- Schneider items can be identified by:
--   1. Name contains "Ref:" (already done in previous migration)
--   2. Name contains "Schneider" or "SE" prefix
--   3. Category contains "Schneider" in name
--   4. Very high count (>10k items suggests imported catalog)

-- 2a: Name-based detection (extended patterns)
UPDATE public.catalog_items
SET 
  source = 'schneider',
  is_global = TRUE,
  user_id = NULL
WHERE 
  user_id IS NULL
  AND source IS NULL
  AND type = 'material'
  AND (
    name ILIKE '%Ref:%'
    OR name ILIKE '%REF:%'
    OR name ILIKE '%Schneider%'
    OR name ILIKE 'SE %'
    OR name ILIKE '%SE-%'
  );

-- 2b: Category-based detection
-- If category name contains "Schneider", all items in it are Schneider
UPDATE public.catalog_items ci
SET 
  source = 'schneider',
  is_global = TRUE,
  user_id = NULL
FROM public.catalog_categories cc
WHERE 
  ci.category_id = cc.id
  AND ci.user_id IS NULL
  AND ci.source IS NULL
  AND ci.type = 'material'
  AND (
    cc.name ILIKE '%Schneider%'
    OR cc.name ILIKE '%SE%'
  );

-- Report Stage 2
DO $$
DECLARE
  schneider_fixed INT;
BEGIN
  SELECT COUNT(*) INTO schneider_fixed 
  FROM public.catalog_items 
  WHERE source = 'schneider';
  
  RAISE NOTICE '✅ STAGE 2: Classified % items as Schneider Electric', schneider_fixed;
END $$;

-- ============================================================================
-- STAGE 3: Base Global Materials (Conservative Fallback)
-- ============================================================================
-- Remaining global items (user_id IS NULL) that aren't Schneider
-- These are likely Base Global materials that slipped through

UPDATE public.catalog_items
SET 
  source = 'global',
  is_global = TRUE
WHERE 
  user_id IS NULL
  AND source IS NULL
  AND type = 'material';

-- Report Stage 3
DO $$
DECLARE
  base_global_fixed INT;
BEGIN
  SELECT COUNT(*) INTO base_global_fixed 
  FROM public.catalog_items 
  WHERE source = 'global';
  
  RAISE NOTICE '✅ STAGE 3: Classified % items as Base Global', base_global_fixed;
END $$;

-- ============================================================================
-- STAGE 4: User Items (Safety Net)
-- ============================================================================
-- Any item with user_id NOT NULL is a user item

UPDATE public.catalog_items
SET 
  source = 'user',
  is_global = FALSE
WHERE 
  user_id IS NOT NULL
  AND source IS NULL;

-- Report Stage 4
DO $$
DECLARE
  user_fixed INT;
BEGIN
  SELECT COUNT(*) INTO user_fixed 
  FROM public.catalog_items 
  WHERE source = 'user';
  
  RAISE NOTICE '✅ STAGE 4: Classified % items as User Items', user_fixed;
END $$;

-- ============================================================================
-- STAGE 5: Final Verification & Statistics
-- ============================================================================

DO $$
DECLARE
  schneider_count INT;
  base_global_count INT;
  user_count INT;
  total_count INT;
  null_source_count INT;
  labor_count INT;
  material_count INT;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO schneider_count 
  FROM public.catalog_items WHERE source = 'schneider';
  
  SELECT COUNT(*) INTO base_global_count 
  FROM public.catalog_items WHERE source = 'global';
  
  SELECT COUNT(*) INTO user_count 
  FROM public.catalog_items WHERE source = 'user';
  
  SELECT COUNT(*) INTO total_count 
  FROM public.catalog_items;
  
  SELECT COUNT(*) INTO null_source_count 
  FROM public.catalog_items WHERE source IS NULL;
  
  SELECT COUNT(*) INTO labor_count 
  FROM public.catalog_items WHERE type = 'labor';
  
  SELECT COUNT(*) INTO material_count 
  FROM public.catalog_items WHERE type = 'material';
  
  -- Display results
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 ULTIMATE SWEEPER COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total items: %', total_count;
  RAISE NOTICE '  ├─ Base Global: % (target: ~1,600)', base_global_count;
  RAISE NOTICE '  ├─ Schneider: % (target: ~15,000)', schneider_count;
  RAISE NOTICE '  ├─ User: %', user_count;
  RAISE NOTICE '  └─ NULL/Orphaned: % (should be 0!)', null_source_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'By Type:';
  RAISE NOTICE '  ├─ Labor: %', labor_count;
  RAISE NOTICE '  └─ Material: %', material_count;
  RAISE NOTICE '========================================';
  
  IF null_source_count > 0 THEN
    RAISE WARNING '⚠️ Still have % orphaned items! Manual inspection required.', null_source_count;
    
    -- Show samples
    RAISE NOTICE 'Sample orphaned items:';
    PERFORM 
      'ID: ' || id || ' | Name: ' || COALESCE(name, 'NULL') || ' | Type: ' || COALESCE(type::TEXT, 'NULL') || ' | User: ' || COALESCE(user_id::TEXT, 'NULL')
    FROM public.catalog_items
    WHERE source IS NULL
    LIMIT 10;
  ELSE
    RAISE NOTICE '✅✅✅ ALL ITEMS CLASSIFIED! Zero orphans!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STAGE 6: Create Performance Indexes (if not exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_catalog_items_type_source 
ON public.catalog_items(type, source);

CREATE INDEX IF NOT EXISTS idx_catalog_items_is_global_source 
ON public.catalog_items(is_global, source);

-- Add helpful comments
COMMENT ON COLUMN public.catalog_items.source IS 
'Item classification: "global" (base ~1600), "schneider" (SE catalog ~15k), "user" (custom). NEVER NULL after sweeper migration.';

COMMENT ON COLUMN public.catalog_items.is_global IS 
'Quick filter: TRUE = global/schneider, FALSE = user. Indexed for performance.';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Check Settings page → counts should show:';
  RAISE NOTICE '     - Base Global: ~1,600';
  RAISE NOTICE '     - Schneider: ~15,000';
  RAISE NOTICE '  2. Open Catalog → all items visible';
  RAISE NOTICE '  3. Toggle filters → instant filtering';
  RAISE NOTICE '========================================';
END $$;
