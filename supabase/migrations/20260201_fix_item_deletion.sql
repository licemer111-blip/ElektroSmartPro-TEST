-- =====================================================
-- FIX: Enable deletion of project items
-- =====================================================
-- Date: 2026-02-01
-- Issue: Users cannot delete items from estimate table
-- Solution: Ensure RLS policy for DELETE exists
-- =====================================================

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Allow item deletion" ON public.project_items;
DROP POLICY IF EXISTS "Users can delete own project items" ON public.project_items;
DROP POLICY IF EXISTS "Editors can delete project items" ON public.project_items;

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role IN ('owner', 'editor')
  );
$$;

-- Enable RLS on project_items if not already enabled
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

-- Create DELETE policy for project items
CREATE POLICY "Allow item deletion"
ON public.project_items
FOR DELETE
USING (public.user_can_edit_project(project_id));

-- Verify the policy was created
SELECT 
  'project_items' as table_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'project_items'
AND cmd = 'DELETE';
