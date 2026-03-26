-- =========================================
-- V4.0: ADD MISSING RPC FUNCTIONS FOR PROJECT MEMBERS
-- =========================================
-- These functions are needed for Server Actions to work
-- They bypass RLS using SECURITY DEFINER
-- Date: 2026-01-28

-- 1. Function to check if a user is already a member
-- Used in inviteProjectMember() to prevent duplicate invites
CREATE OR REPLACE FUNCTION public.check_existing_member(
  p_project_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  id UUID,
  status TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns the member record if exists
  -- Access control is done in the Server Action code
  RETURN QUERY
  SELECT pm.id, pm.status::TEXT
  FROM project_members pm
  WHERE pm.project_id = p_project_id
  AND pm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to get all members of a project
-- Used in getProjectMembers() to fetch the member list
CREATE OR REPLACE FUNCTION public.get_project_members_list(
  p_project_id UUID
)
RETURNS TABLE(
  id UUID,
  project_id UUID,
  user_id UUID,
  role TEXT,
  status TEXT,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns all members of the project
  -- Access control is done in the Server Action code
  RETURN QUERY
  SELECT 
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.role::TEXT,
    pm.status::TEXT,
    pm.invited_by,
    pm.invited_at,
    pm.accepted_at,
    pm.created_at,
    pm.updated_at
  FROM project_members pm
  WHERE pm.project_id = p_project_id
  ORDER BY pm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to get all project IDs for a user
-- Useful for checking user's project access
CREATE OR REPLACE FUNCTION public.get_user_project_ids(
  p_user_id UUID
)
RETURNS TABLE(project_id UUID)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pm.project_id
  FROM project_members pm
  WHERE pm.user_id = p_user_id
  AND pm.status = 'active'
  UNION
  SELECT p.id
  FROM projects p
  WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- VERIFICATION
-- =========================================
SELECT '✅ RPC функции для project_members созданы!' as status;

-- List all project member related functions
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN (
  'check_existing_member',
  'get_project_members_list',
  'get_user_project_ids',
  'has_project_access',
  'get_project_role',
  'create_owner_membership'
)
AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- =========================================
-- COMMENTS
-- =========================================
COMMENT ON FUNCTION public.check_existing_member IS 'V4.0: Check if user is already a project member (bypasses RLS)';
COMMENT ON FUNCTION public.get_project_members_list IS 'V4.0: Get all members of a project (bypasses RLS)';
COMMENT ON FUNCTION public.get_user_project_ids IS 'V4.0: Get all project IDs that user has access to';
