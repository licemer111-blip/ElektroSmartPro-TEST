-- =====================================================
-- Migration: Add Project Categories Support
-- Description: Creates project_categories table and adds category_id to projects
-- Date: 2026-01-17
-- =====================================================

-- 1. Create project_categories table
CREATE TABLE IF NOT EXISTS project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_categories_user_name_unique UNIQUE (user_id, name)
);

-- 2. Add category_id to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_categories_user_id 
ON project_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_category_id 
ON projects(category_id);

-- 4. Enable RLS
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for project_categories
CREATE POLICY "Users can view their own project categories"
ON project_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project categories"
ON project_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project categories"
ON project_categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project categories"
ON project_categories FOR DELETE
USING (auth.uid() = user_id);

-- 6. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_categories_updated_at
BEFORE UPDATE ON project_categories
FOR EACH ROW
EXECUTE FUNCTION update_project_categories_updated_at();

-- =====================================================
-- Rollback Instructions:
-- DROP TRIGGER IF EXISTS project_categories_updated_at ON project_categories;
-- DROP FUNCTION IF EXISTS update_project_categories_updated_at();
-- ALTER TABLE projects DROP COLUMN IF EXISTS category_id;
-- DROP TABLE IF EXISTS project_categories;
-- =====================================================
