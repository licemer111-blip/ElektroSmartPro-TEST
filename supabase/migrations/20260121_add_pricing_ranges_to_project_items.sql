-- Add price range columns to project_items for accurate pricing mode calculations
-- This allows us to store catalog item's price_min/max at the time of adding to project

ALTER TABLE project_items
ADD COLUMN IF NOT EXISTS price_min NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS price_max NUMERIC(10, 2);

COMMENT ON COLUMN project_items.price_min IS 'Minimum price from catalog_item (economy mode)';
COMMENT ON COLUMN project_items.price_max IS 'Maximum price from catalog_item (premium mode)';

-- Note: final_material_price and final_labor_price remain as standard/base prices
-- The pricing_mode in projects table determines which price to use in calculations:
-- - economy: use price_min (if available, else final_price * 0.85)
-- - standard: use final_price (default)
-- - premium: use price_max (if available, else final_price * 1.15)
