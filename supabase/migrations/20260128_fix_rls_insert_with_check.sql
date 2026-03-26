-- =====================================================
-- CRITICAL FIX: Project Members RLS for INSERT
-- =====================================================
-- Date: 2026-01-28
-- Issue: Error 42501 - RLS blocks INSERT because policies use USING instead of WITH CHECK
-- Root Cause: INSERT operations require WITH CHECK clause to validate NEW rows
-- =====================================================

-- Step 1: Ensure helper function exists
CREATE OR REPLACE FUNCTION public.is_project_owner(project_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 2: Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Owner can invite members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can invite members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can manage existing members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can insert new members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can update delete members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can view members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can view all members" ON public.project_members;
DROP POLICY IF EXISTS "View own membership" ON public.project_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.project_members;
DROP POLICY IF EXISTS "Update own membership" ON public.project_members;
DROP POLICY IF EXISTS "Members can update their own membership status" ON public.project_members;
DROP POLICY IF EXISTS "Members can update their own status" ON public.project_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.project_members;
DROP POLICY IF EXISTS "Owner can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view members of their projects" ON public.project_members;

-- =====================================================
-- Step 4: Create CORRECT policies
-- =====================================================

-- 4.1. SELECT: Users can view their own membership
CREATE POLICY "Users can view their own membership" 
ON public.project_members 
FOR SELECT 
USING (user_id = auth.uid());

-- 4.2. SELECT: Project owners can view all members
CREATE POLICY "Owners can view all members"
ON public.project_members
FOR SELECT
USING (public.is_project_owner(project_id));

-- 4.3. INSERT: ⚡ CRITICAL FIX - Use WITH CHECK for new rows
-- This is the key fix: INSERT requires WITH CHECK, not USING
CREATE POLICY "Owners can insert new members"
ON public.project_members
FOR INSERT
WITH CHECK (public.is_project_owner(project_id));

-- 4.4. UPDATE: Members can update their own status (accept/decline)
CREATE POLICY "Members can update their own status"
ON public.project_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4.5. UPDATE: Owners can update any member in their projects
CREATE POLICY "Owners can update members"
ON public.project_members
FOR UPDATE
USING (public.is_project_owner(project_id))
WITH CHECK (public.is_project_owner(project_id));

-- 4.6. DELETE: Owners can remove members (except themselves)
CREATE POLICY "Owners can delete members"
ON public.project_members
FOR DELETE
USING (
  public.is_project_owner(project_id)
  AND role != 'owner' -- Cannot delete owner role
);

-- =====================================================
-- Step 5: Verification
-- =====================================================

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING'
    ELSE '❌ No USING'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH_CHECK'
    ELSE '❌ No WITH_CHECK'
  END as has_with_check
FROM pg_policies 
WHERE tablename = 'project_members'
ORDER BY cmd, policyname;

-- Count policies by operation type
SELECT 
  cmd as operation,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'project_members'
GROUP BY cmd
ORDER BY cmd;

-- Verify the critical INSERT policy has WITH CHECK
SELECT 
  policyname,
  cmd,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'project_members' 
AND cmd = 'INSERT';

-- Success message
SELECT '✅ RLS FIXED! INSERT policy now uses WITH CHECK clause.' as status;
