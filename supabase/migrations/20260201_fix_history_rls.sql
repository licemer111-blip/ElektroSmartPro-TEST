-- =====================================================
-- FIX: RLS policy for project_item_history
-- =====================================================
-- Date: 2026-02-01
-- Issue: DELETE fails because trigger can't write to project_item_history
-- Error: "new row violates row-level security policy for table project_item_history"
-- =====================================================

-- Check current policies on project_item_history
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'project_item_history'
ORDER BY cmd;

-- Drop existing INSERT policies on project_item_history
DROP POLICY IF EXISTS "Allow history creation" ON public.project_item_history;
DROP POLICY IF EXISTS "Users can insert history" ON public.project_item_history;
DROP POLICY IF EXISTS "Allow item history insert" ON public.project_item_history;

-- Enable RLS on project_item_history
ALTER TABLE public.project_item_history ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for project_item_history
-- Allow inserting if user can edit the related project
CREATE POLICY "project_item_history_insert_policy"
ON public.project_item_history
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_items
    WHERE project_items.id = project_item_history.project_item_id
    AND public.user_can_edit_project(project_items.project_id)
  )
  OR
  -- Allow if user is the one making the change
  user_id = auth.uid()
);

-- Create SELECT policy for project_item_history
DROP POLICY IF EXISTS "Allow history access" ON public.project_item_history;
DROP POLICY IF EXISTS "Users can view history" ON public.project_item_history;

CREATE POLICY "project_item_history_select_policy"
ON public.project_item_history
AS PERMISSIVE
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM project_items
    WHERE project_items.id = project_item_history.project_item_id
    AND public.has_project_access(project_items.project_id, auth.uid())
  )
);

-- Verify policies were created
SELECT 
  'project_item_history policies:' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'project_item_history'
ORDER BY cmd, policyname;
