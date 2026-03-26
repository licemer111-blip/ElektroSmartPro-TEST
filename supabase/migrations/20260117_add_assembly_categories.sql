-- =====================================================
-- Migration: Add Assembly Categories Support
-- Description: Creates assembly_categories table and adds category_id to user_assemblies
-- Date: 2026-01-17
-- =====================================================

-- 1. Create assembly_categories table
CREATE TABLE IF NOT EXISTS assembly_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT assembly_categories_user_name_unique UNIQUE (user_id, name)
);

-- 2. Add category_id to user_assemblies
ALTER TABLE user_assemblies
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES assembly_categories(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assembly_categories_user_id 
ON assembly_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_user_assemblies_category_id 
ON user_assemblies(category_id);

-- 4. Enable RLS
ALTER TABLE assembly_categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for assembly_categories
CREATE POLICY "Users can view their own assembly categories"
ON assembly_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assembly categories"
ON assembly_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assembly categories"
ON assembly_categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assembly categories"
ON assembly_categories FOR DELETE
USING (auth.uid() = user_id);

-- 6. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_assembly_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assembly_categories_updated_at
BEFORE UPDATE ON assembly_categories
FOR EACH ROW
EXECUTE FUNCTION update_assembly_categories_updated_at();

-- =====================================================
-- Rollback Instructions:
-- DROP TRIGGER IF EXISTS assembly_categories_updated_at ON assembly_categories;
-- DROP FUNCTION IF EXISTS update_assembly_categories_updated_at();
-- ALTER TABLE user_assemblies DROP COLUMN IF EXISTS category_id;
-- DROP TABLE IF EXISTS assembly_categories;
-- =====================================================
