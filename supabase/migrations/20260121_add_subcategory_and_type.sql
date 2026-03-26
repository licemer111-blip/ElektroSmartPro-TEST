-- =====================================================
-- Migration: Add sub_category and type to catalog_items
-- Description: Refactor catalog for atomic positions with detailed classification
-- Date: 2026-01-21
-- =====================================================

-- 1. Add sub_category field for detailed classification
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- 2. Add type field to distinguish materials from labor
-- This is for ATOMIC positions (not assemblies)
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('material', 'labor', 'mixed'));

-- 3. Add index for fast filtering
CREATE INDEX IF NOT EXISTS idx_catalog_items_sub_category 
ON catalog_items(sub_category);

CREATE INDEX IF NOT EXISTS idx_catalog_items_type 
ON catalog_items(type);

-- 4. Create index for combined search
CREATE INDEX IF NOT EXISTS idx_catalog_items_search 
ON catalog_items(name, sub_category, type);

-- 5. Update existing items: set type = 'mixed' for old items that have both prices
UPDATE catalog_items
SET type = CASE
  WHEN base_labor_price > 0 AND base_material_price > 0 THEN 'mixed'
  WHEN base_labor_price > 0 THEN 'labor'
  WHEN base_material_price > 0 THEN 'material'
  ELSE 'mixed'
END
WHERE type IS NULL;

-- 6. Add comment for documentation
COMMENT ON COLUMN catalog_items.sub_category IS 'Detailed classification: Kable siłowe, Puszki podtynkowe, Automatyka, Bruzdy w betonie, etc.';
COMMENT ON COLUMN catalog_items.type IS 'Type of position: material (materials), labor (work), mixed (both)';

-- =====================================================
-- SUCCESS: catalog_items is now ready for atomic positions
-- Next step: Seed with thousands of Polish electrical items
-- =====================================================
