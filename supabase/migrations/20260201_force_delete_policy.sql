-- =====================================================
-- FORCE FIX: Delete policy for project_items
-- =====================================================
-- Date: 2026-02-01
-- Issue: DELETE operations not checking RLS policy
-- =====================================================

-- Step 1: Disable and re-enable RLS to force refresh
ALTER TABLE public.project_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing DELETE policies
DROP POLICY IF EXISTS "Allow item deletion" ON public.project_items;
DROP POLICY IF EXISTS "Users can delete own project items" ON public.project_items;
DROP POLICY IF EXISTS "Editors can delete project items" ON public.project_items;
DROP POLICY IF EXISTS "Members can delete project items" ON public.project_items;

-- Step 3: Recreate helper function with explicit STABLE marking
-- Don't drop - other policies depend on it, just replace
CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an active editor or owner member
  IF EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role IN ('owner', 'editor')
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Step 4: Create DELETE policy with explicit USING clause
CREATE POLICY "project_items_delete_policy"
ON public.project_items
AS PERMISSIVE
FOR DELETE
TO public
USING (public.user_can_edit_project(project_id));

-- Step 5: Verify the policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'project_items'
  AND cmd = 'DELETE';
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'DELETE policy was not created!';
  END IF;
  
  RAISE NOTICE 'DELETE policy created successfully. Count: %', policy_count;
END $$;

-- Step 6: Show all policies on project_items
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'project_items'
ORDER BY cmd, policyname;

-- Step 7: Test the function
SELECT 
  'Testing user_can_edit_project' as test,
  auth.uid() as current_user,
  public.user_can_edit_project('00000000-0000-0000-0000-000000000000'::uuid) as can_edit_test_project;
