-- Add missing price columns to project_items
-- These store base prices and final region-adjusted prices

-- First, add base price columns if they don't exist
ALTER TABLE project_items
ADD COLUMN IF NOT EXISTS material_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_price NUMERIC(10, 2) DEFAULT 0;

-- Then add final price columns
ALTER TABLE project_items
ADD COLUMN IF NOT EXISTS final_material_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_labor_price NUMERIC(10, 2) DEFAULT 0;

-- Add notes column for additional information
ALTER TABLE project_items
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add description column (some code might use this)
ALTER TABLE project_items
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN project_items.material_price IS 'Base material price (not region-adjusted)';
COMMENT ON COLUMN project_items.labor_price IS 'Base labor price (not region-adjusted)';
COMMENT ON COLUMN project_items.final_material_price IS 'Final material price (region-adjusted, user can modify)';
COMMENT ON COLUMN project_items.final_labor_price IS 'Final labor price (region-adjusted, user can modify)';
COMMENT ON COLUMN project_items.notes IS 'Additional notes or comments for the item';
COMMENT ON COLUMN project_items.description IS 'Item description';

-- Update existing rows: if final_* is null or 0, copy from base prices
UPDATE project_items
SET 
  final_material_price = CASE 
    WHEN final_material_price IS NULL OR final_material_price = 0 
    THEN COALESCE(material_price, 0) 
    ELSE final_material_price 
  END,
  final_labor_price = CASE 
    WHEN final_labor_price IS NULL OR final_labor_price = 0 
    THEN COALESCE(labor_price, 0) 
    ELSE final_labor_price 
  END;
