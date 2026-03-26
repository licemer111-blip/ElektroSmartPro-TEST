-- ========================================
-- ADD user_id TO catalog_items
-- ========================================
-- This migration makes catalog_items user-specific
-- Each user will have their own catalog
-- ========================================

-- Step 1: Add user_id column (nullable first)
ALTER TABLE catalog_items 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX idx_catalog_items_user_id ON catalog_items(user_id);

-- Step 3: Delete all existing global items (they will be re-seeded per user)
-- WARNING: This deletes all current catalog data!
DELETE FROM catalog_items WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL (now that we cleaned up)
ALTER TABLE catalog_items 
ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Update RLS policies
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Users can insert their own catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Users can update their own catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Users can delete their own catalog items" ON catalog_items;

-- Enable RLS
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies
CREATE POLICY "Users can view their own catalog items"
  ON catalog_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own catalog items"
  ON catalog_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catalog items"
  ON catalog_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catalog items"
  ON catalog_items FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION
-- ========================================
-- Check that user_id column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'catalog_items' AND column_name = 'user_id';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'catalog_items';

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================
-- Next steps:
-- 1. Update seed-actions.ts to include user_id when inserting
-- 2. Update getCatalogItems() to filter by user_id (RLS will do this automatically)
-- 3. New users will start with 0 items
-- ========================================
