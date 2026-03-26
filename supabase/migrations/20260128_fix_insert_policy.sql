-- Fix RLS INSERT policy for project_members
-- Date: 2026-01-28
-- Issue: Policy blocks INSERT with code 42501
-- Problem: Multiple duplicate INSERT policies exist

-- Drop ALL existing INSERT policies to avoid duplicates
DROP POLICY IF EXISTS "Owner can invite members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can invite members" ON public.project_members;

-- Create correct policy
CREATE POLICY "Owner can invite members"
ON public.project_members FOR INSERT
WITH CHECK (
  -- Only check if current user is project owner
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id
    AND user_id = auth.uid()
  )
);

-- Verify
SELECT 
  policyname,
  cmd,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'project_members'
AND cmd = 'INSERT';
