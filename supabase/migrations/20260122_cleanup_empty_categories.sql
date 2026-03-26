-- Cleanup: Remove empty categories from catalog
-- Created: 2026-01-22
-- Purpose: Remove categories with 0 items to keep UI clean

-- Delete empty categories that have no associated items
DELETE FROM public.catalog_categories 
WHERE id IN (
  '6bbed534-a8c6-4185-99cc-f66e18eb34d4', -- Oświetlenie Awaryjne (0 items)
  '1c148eb4-e175-49e6-99ce-d463af1e8f01'  -- Uziemienie (0 items, duplicate of Uziemienie/Odgrom)
);

-- Verify: Show remaining categories with item counts
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Empty categories removed. Remaining categories:';
END $$;

-- Show final category list
SELECT 
  name AS category_name,
  (SELECT COUNT(*) FROM catalog_items WHERE category_id = catalog_categories.id AND user_id IS NULL) AS items_count
FROM catalog_categories
ORDER BY name;
