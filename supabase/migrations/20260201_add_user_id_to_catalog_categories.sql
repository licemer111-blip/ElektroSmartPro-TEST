-- =====================================================
-- ADD: user_id column to catalog_categories
-- =====================================================
-- Date: 2026-02-01
-- Issue: Code tries to insert user_id but column doesn't exist
-- Error: Could not find the 'user_id' column of 'catalog_categories'
-- =====================================================

-- Step 1: Add user_id column (nullable for existing global categories)
ALTER TABLE public.catalog_categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Add object_type_id as nullable (for user categories)
ALTER TABLE public.catalog_categories
  ALTER COLUMN object_type_id DROP NOT NULL;

-- Step 3: Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_catalog_categories_user_id 
  ON public.catalog_categories(user_id);

-- Step 4: Update RLS policies to allow user categories
DROP POLICY IF EXISTS "Users can view catalog categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Users can create categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.catalog_categories;

-- Enable RLS
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

-- SELECT: View global categories (user_id IS NULL) OR own categories
CREATE POLICY "catalog_categories_select_policy"
ON public.catalog_categories
AS PERMISSIVE
FOR SELECT
TO public
USING (
  user_id IS NULL  -- Global categories visible to all
  OR user_id = auth.uid()  -- Own categories
);

-- INSERT: Users can create their own categories
CREATE POLICY "catalog_categories_insert_policy"
ON public.catalog_categories
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid()  -- Can only create categories for themselves
);

-- UPDATE: Users can update only their own categories
CREATE POLICY "catalog_categories_update_policy"
ON public.catalog_categories
AS PERMISSIVE
FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete only their own categories
CREATE POLICY "catalog_categories_delete_policy"
ON public.catalog_categories
AS PERMISSIVE
FOR DELETE
TO public
USING (user_id = auth.uid());

-- Step 5: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify
SELECT 
  'catalog_categories schema updated!' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'catalog_categories'
AND column_name IN ('user_id', 'object_type_id')
ORDER BY column_name;

-- Show RLS policies
SELECT 
  'RLS Policies:' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'catalog_categories'
ORDER BY cmd, policyname;
