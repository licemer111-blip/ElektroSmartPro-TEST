-- =====================================================
-- 🔥 CRITICAL FIX: INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- Date: 2026-01-29
-- 
-- ERROR: "infinite recursion detected in policy for relation"
-- 
-- CAUSE: Circular RLS policies:
--   - Policy on "projects" checks "project_members" 
--   - Policy on "project_members" checks "projects"
--   = INFINITE LOOP!
--
-- SOLUTION: Use SECURITY DEFINER functions that bypass RLS
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL PROBLEMATIC POLICIES
-- =====================================================

-- Drop ALL policies on projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can view projects" ON public.projects;
DROP POLICY IF EXISTS "Editors can update projects" ON public.projects;

-- Drop ALL policies on project_members  
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

-- Drop ALL policies on project_items
DROP POLICY IF EXISTS "Users can view own project items" ON public.project_items;
DROP POLICY IF EXISTS "Users can insert own project items" ON public.project_items;
DROP POLICY IF EXISTS "Users can update own project items" ON public.project_items;
DROP POLICY IF EXISTS "Users can delete own project items" ON public.project_items;
DROP POLICY IF EXISTS "Members can view project items" ON public.project_items;
DROP POLICY IF EXISTS "Editors can insert project items" ON public.project_items;
DROP POLICY IF EXISTS "Editors can update project items" ON public.project_items;
DROP POLICY IF EXISTS "Editors can delete project items" ON public.project_items;

-- =====================================================
-- STEP 2: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- These functions bypass RLS to prevent recursion!
-- =====================================================

-- Check if user owns the project (NO RLS)
CREATE OR REPLACE FUNCTION public.user_owns_project(p_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = auth.uid()
  );
$$;

-- Check if user is active member of project (NO RLS)
CREATE OR REPLACE FUNCTION public.user_is_project_member(p_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

-- Check if user can EDIT project (owner or editor)
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

-- Check if user has ANY access (owner or member)
CREATE OR REPLACE FUNCTION public.has_project_access(
  p_project_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND status = 'active'
  );
$$;

-- =====================================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- =====================================================

-- 3.1 PROJECTS TABLE
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner OR any active member
CREATE POLICY "Allow project access"
ON public.projects
FOR SELECT
USING (
  user_id = auth.uid()  -- Owner can always see
  OR public.user_is_project_member(id)  -- Members can see
);

-- INSERT: Only for your own projects
CREATE POLICY "Allow project creation"
ON public.projects
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Owner OR editor member
CREATE POLICY "Allow project update"
ON public.projects
FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.user_can_edit_project(id)
)
WITH CHECK (
  user_id = auth.uid()
  OR public.user_can_edit_project(id)
);

-- DELETE: Only owner
CREATE POLICY "Allow project deletion"
ON public.projects
FOR DELETE
USING (user_id = auth.uid());

-- 3.2 PROJECT_MEMBERS TABLE
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- SELECT: See your own membership OR all members if you own the project
CREATE POLICY "Allow member access"
ON public.project_members
FOR SELECT
USING (
  user_id = auth.uid()  -- See your own membership
  OR public.user_owns_project(project_id)  -- Owner sees all members
);

-- INSERT: Only project owner can invite
CREATE POLICY "Allow member invitation"
ON public.project_members
FOR INSERT
WITH CHECK (public.user_owns_project(project_id));

-- UPDATE: Own membership OR owner of project
CREATE POLICY "Allow member update"
ON public.project_members
FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.user_owns_project(project_id)
)
WITH CHECK (
  user_id = auth.uid()
  OR public.user_owns_project(project_id)
);

-- DELETE: Only owner (but not owner role)
CREATE POLICY "Allow member removal"
ON public.project_members
FOR DELETE
USING (
  public.user_owns_project(project_id)
  AND role != 'owner'
);

-- 3.3 PROJECT_ITEMS TABLE
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

-- SELECT: If user has project access
CREATE POLICY "Allow item access"
ON public.project_items
FOR SELECT
USING (public.has_project_access(project_id, auth.uid()));

-- INSERT: If user can edit project
CREATE POLICY "Allow item creation"
ON public.project_items
FOR INSERT
WITH CHECK (public.user_can_edit_project(project_id));

-- UPDATE: If user can edit project
CREATE POLICY "Allow item update"
ON public.project_items
FOR UPDATE
USING (public.user_can_edit_project(project_id))
WITH CHECK (public.user_can_edit_project(project_id));

-- DELETE: If user can edit project
CREATE POLICY "Allow item deletion"
ON public.project_items
FOR DELETE
USING (public.user_can_edit_project(project_id));

-- =====================================================
-- STEP 4: FIX THE TRIGGER FOR AUTO-CREATING OWNER MEMBERSHIP
-- =====================================================

-- Recreate trigger function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO project_members (
    project_id,
    user_id,
    role,
    invited_by,
    status,
    accepted_at
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'owner',
    NEW.user_id,
    'active',
    NOW()
  )
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON public.projects;
CREATE TRIGGER create_owner_membership_trigger
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_owner_membership();

-- =====================================================
-- STEP 5: BACKFILL OWNER MEMBERSHIPS FOR EXISTING PROJECTS
-- =====================================================

-- Create owner membership for all existing projects that don't have one
INSERT INTO public.project_members (project_id, user_id, role, invited_by, status, accepted_at)
SELECT 
  p.id,
  p.user_id,
  'owner',
  p.user_id,
  'active',
  NOW()
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = p.id
  AND pm.user_id = p.user_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================

-- Show all policies on projects table
SELECT 
  'projects' as table_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY cmd;

-- Show all policies on project_members table
SELECT 
  'project_members' as table_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'project_members'
ORDER BY cmd;

-- Show all policies on project_items table
SELECT 
  'project_items' as table_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'project_items'
ORDER BY cmd;

-- Count projects and memberships
SELECT 
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM project_members WHERE role = 'owner') as owner_memberships;

-- =====================================================
-- ✅ FIX COMPLETE!
-- =====================================================
-- 
-- WHAT WAS FIXED:
-- 1. Removed circular RLS policies that caused infinite recursion
-- 2. Created SECURITY DEFINER functions to bypass RLS in policy checks
-- 3. Simplified policies to use these safe functions
-- 4. Fixed trigger to use SECURITY DEFINER
-- 5. Backfilled missing owner memberships
--
-- EXPECTED BEHAVIOR:
-- ✅ getProjects() - returns owned + shared projects
-- ✅ createProject() - creates project and owner membership
-- ✅ Project editing works for owners and editors
-- ✅ No more "infinite recursion" errors
--
-- TEST: Reload the page in browser after running this migration!
-- =====================================================
