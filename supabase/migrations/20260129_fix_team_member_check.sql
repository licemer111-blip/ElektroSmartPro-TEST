-- =====================================================
-- FIX: is_team_member function should include team owner
-- =====================================================
-- The original function only checked team_members table,
-- but team owners might not be in that table.
-- Date: 2026-01-29

-- Fix is_team_member to also check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if user is in team_members table as active member
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND status = 'active'
  ) OR EXISTS (
    -- Also check if user is the team owner
    SELECT 1 FROM teams
    WHERE id = p_team_id
    AND owner_id = p_user_id
  );
$$;

-- Fix is_team_admin to also check if user is team owner (owner is always admin)
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if user is admin in team_members
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND status = 'active'
    AND role IN ('owner', 'admin')
  ) OR EXISTS (
    -- Team owner is always admin
    SELECT 1 FROM teams
    WHERE id = p_team_id
    AND owner_id = p_user_id
  );
$$;

SELECT 'Team member check functions fixed' as status;
