-- =====================================================
-- FIX: Add new roles to project_members constraint
-- =====================================================
-- Date: 2026-02-05
-- 
-- PROBLEM: CHECK constraint only allows 'owner', 'editor', 'viewer'
-- SOLUTION: Add 'kierownik', 'admin', 'elektryk' roles
-- =====================================================

-- Drop old constraint and add new with all roles
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE project_members ADD CONSTRAINT project_members_role_check 
  CHECK (role IN ('owner', 'editor', 'viewer', 'kierownik', 'admin', 'elektryk'));

-- Also update the user_can_edit_project function to include new roles
CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  -- Owner can always edit
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    -- Active members with edit permissions
    -- elektryk role is read-only, all other roles can edit
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role IN ('owner', 'editor', 'kierownik', 'admin')
  );
$$;

-- Verify
SELECT 'Roles constraint and function updated!' as status;
