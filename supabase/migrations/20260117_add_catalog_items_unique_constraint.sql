-- Add unique constraint on (user_id, name) to catalog_items
-- This allows upsert operations and prevents duplicate items per user

-- First, remove any existing duplicates (if any)
-- Keep the oldest record for each (user_id, name) combination
DELETE FROM catalog_items a
USING catalog_items b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.name = b.name;

-- Add unique constraint
ALTER TABLE catalog_items
ADD CONSTRAINT catalog_items_user_name_unique UNIQUE (user_id, name);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_catalog_items_user_name 
ON catalog_items(user_id, name);
