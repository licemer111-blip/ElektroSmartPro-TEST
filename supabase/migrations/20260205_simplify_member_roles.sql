-- =====================================================
-- SIMPLIFIED ROLES: Only owner and editor
-- =====================================================
-- Date: 2026-02-05
-- 
-- SIMPLIFIED SYSTEM:
-- - owner = project creator (full control)
-- - editor = invited collaborator (can edit)
-- 
-- No more viewer, kierownik, admin, elektryk roles
-- If you invite someone - you trust them to edit!
-- =====================================================

-- Update constraint to allow only owner and editor
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE project_members ADD CONSTRAINT project_members_role_check 
  CHECK (role IN ('owner', 'editor'));

-- Convert all existing non-owner roles to 'editor'
UPDATE project_members 
SET role = 'editor' 
WHERE role NOT IN ('owner', 'editor');

-- Update the permission check function - simple: owner or editor can edit
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
    -- Any active member (editor) can edit
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role = 'editor'
  );
$$;

-- Verify
SELECT 'Roles simplified to owner/editor only!' as status;
