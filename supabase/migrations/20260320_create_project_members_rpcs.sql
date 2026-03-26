-- ============================================================
-- Create missing RPC functions for project members management
-- Required by members-actions.ts (getProjectMembers, inviteProjectMember)
-- ============================================================

-- 1. get_project_members_list: returns all members of a project (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_project_members_list(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  role TEXT,
  status TEXT,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.role,
    pm.status,
    pm.invited_by,
    pm.invited_at,
    pm.accepted_at,
    pm.updated_at
  FROM public.project_members pm
  WHERE pm.project_id = p_project_id
  ORDER BY pm.invited_at ASC;
END;
$$;

-- 2. check_existing_member: checks if a user is already a member of a project
CREATE OR REPLACE FUNCTION public.check_existing_member(p_project_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  status TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.status,
    pm.role
  FROM public.project_members pm
  WHERE pm.project_id = p_project_id
    AND pm.user_id = p_user_id
  LIMIT 1;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_members_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_existing_member(UUID, UUID) TO authenticated;
