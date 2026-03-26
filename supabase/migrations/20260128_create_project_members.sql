-- =====================================================
-- V4.0: CO-PILOT MODE - PROJECT MEMBERS (SHARING)
-- =====================================================
-- This migration creates the project_members table for real-time collaboration
-- Allows project owners to invite other users to view/edit estimates

-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'declined'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, user_id), -- One user can only be invited once per project
  CHECK (role IN ('owner', 'editor', 'viewer')),
  CHECK (status IN ('pending', 'active', 'declined'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON public.project_members(status);

-- Enable Row Level Security
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members
-- 1. Users can see memberships for their own projects (as owner)
DROP POLICY IF EXISTS "Users can view members of their projects" ON public.project_members;
CREATE POLICY "Users can view members of their projects"
ON public.project_members
FOR SELECT
USING (
  -- User is the project owner
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
  OR
  -- User is a member of the project
  user_id = auth.uid()
);

-- 2. Project owners can invite members
DROP POLICY IF EXISTS "Project owners can invite members" ON public.project_members;
CREATE POLICY "Project owners can invite members"
ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

-- 3. Project owners can update memberships
DROP POLICY IF EXISTS "Project owners can update members" ON public.project_members;
CREATE POLICY "Project owners can update members"
ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

-- 4. Members can update their own status (accept/decline)
DROP POLICY IF EXISTS "Members can update their own membership status" ON public.project_members;
CREATE POLICY "Members can update their own membership status"
ON public.project_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Project owners can delete members
DROP POLICY IF EXISTS "Project owners can remove members" ON public.project_members;
CREATE POLICY "Project owners can remove members"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id
    AND projects.user_id = auth.uid()
  )
);

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================
-- Enable Realtime for project_members table (idempotent)
DO $$
BEGIN
  -- Try to add table to publication
  -- If it already exists, catch the error and continue
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication, that's fine
    NULL;
  WHEN undefined_table THEN
    -- Table doesn't exist yet, that's fine
    NULL;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has access to project
CREATE OR REPLACE FUNCTION public.has_project_access(
  p_project_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    -- User is project owner
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND user_id = p_user_id
  ) OR EXISTS (
    -- User is an active member
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role in project
CREATE OR REPLACE FUNCTION public.get_project_role(
  p_project_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND user_id = p_user_id
  ) THEN
    RETURN 'owner';
  END IF;
  
  -- Check if user is member
  RETURN (
    SELECT role FROM public.project_members
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatically create owner membership when project is created
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (
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
  ON CONFLICT (project_id, user_id) DO NOTHING; -- Skip if already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create owner membership
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON public.projects;
CREATE TRIGGER create_owner_membership_trigger
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_owner_membership();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.project_members IS 'V4.0: Stores project collaboration members for Co-pilot Mode';
COMMENT ON COLUMN public.project_members.role IS 'owner: full access | editor: can edit | viewer: read-only';
COMMENT ON COLUMN public.project_members.status IS 'pending: invitation sent | active: accepted | declined: rejected';
