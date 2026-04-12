-- Apply KNR 2026 multiplier (1.4) to all existing project_items final_labor_price
-- This migration ensures that existing data is consistent with new storage-time logic
-- where knr_multiplier is applied when items are saved to the database

UPDATE project_items
SET final_labor_price = final_labor_price * 1.4
WHERE final_labor_price IS NOT NULL
  AND final_labor_price > 0;

-- Add a flag to track which items have been migrated
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS knr_multiplier_applied BOOLEAN DEFAULT FALSE;

UPDATE project_items
SET knr_multiplier_applied = TRUE
WHERE final_labor_price IS NOT NULL
  AND final_labor_price > 0;
