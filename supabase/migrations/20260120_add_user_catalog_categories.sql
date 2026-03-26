-- =====================================================
-- Migration: Add User Catalog Categories Support
-- Description: Allow users to create their own catalog categories
-- Date: 2026-01-20
-- =====================================================

-- 1. Add user_id column to catalog_categories (nullable for global categories)
ALTER TABLE catalog_categories
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Make object_type_id nullable (categories can be universal)
ALTER TABLE catalog_categories
ALTER COLUMN object_type_id DROP NOT NULL;

-- 3. Add unique constraint for user categories
ALTER TABLE catalog_categories
ADD CONSTRAINT catalog_categories_user_name_unique UNIQUE (user_id, name);

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_catalog_categories_user_id 
ON catalog_categories(user_id);

-- 5. Enable RLS
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for catalog_categories

-- Everyone can view global categories (user_id IS NULL)
CREATE POLICY "Anyone can view global catalog categories"
ON catalog_categories FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

-- Users can create their own categories
CREATE POLICY "Users can create their own catalog categories"
ON catalog_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own categories
CREATE POLICY "Users can update their own catalog categories"
ON catalog_categories FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own categories
CREATE POLICY "Users can delete their own catalog categories"
ON catalog_categories FOR DELETE
USING (auth.uid() = user_id);

-- 7. Add trigger for updated_at
ALTER TABLE catalog_categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_catalog_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS catalog_categories_updated_at ON catalog_categories;
CREATE TRIGGER catalog_categories_updated_at
BEFORE UPDATE ON catalog_categories
FOR EACH ROW
EXECUTE FUNCTION update_catalog_categories_updated_at();
