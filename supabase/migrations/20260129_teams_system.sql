-- =====================================================
-- TEAMS / WORKSPACE SYSTEM
-- =====================================================
-- Multi-user workspace with role-based access
-- Roles: admin (owner), kierownik (manager), elektryk (worker)
-- Date: 2026-01-29

-- =====================================================
-- 1. TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Team settings
  max_members INTEGER DEFAULT 10,
  logo_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);

-- =====================================================
-- 2. TEAM MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role: admin (full access), kierownik (manager), elektryk (worker)
  role TEXT NOT NULL DEFAULT 'elektryk' CHECK (role IN ('admin', 'kierownik', 'elektryk')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT team_members_unique UNIQUE (team_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

-- =====================================================
-- 3. ADD team_id TO PROJECTS
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.projects 
    ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_team ON public.projects(team_id);

-- =====================================================
-- 4. ENABLE RLS
-- =====================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND status = 'active'
  );
$$;

-- Check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND role = 'admin'
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

-- Check if user is team admin or kierownik (manager)
CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND role IN ('admin', 'kierownik')
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

-- Get user's team role
CREATE OR REPLACE FUNCTION public.get_team_role(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM team_members 
     WHERE team_id = p_team_id AND user_id = p_user_id AND status = 'active'),
    CASE WHEN EXISTS (SELECT 1 FROM teams WHERE id = p_team_id AND owner_id = p_user_id)
         THEN 'admin' ELSE NULL END
  );
$$;

-- Get user's primary team
CREATE OR REPLACE FUNCTION public.get_user_team(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id FROM teams WHERE owner_id = p_user_id LIMIT 1),
    (SELECT team_id FROM team_members WHERE user_id = p_user_id AND status = 'active' ORDER BY joined_at LIMIT 1)
  );
$$;

-- =====================================================
-- 6. RLS POLICIES FOR TEAMS
-- =====================================================
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
CREATE POLICY "Users can view teams they belong to"
ON public.teams FOR SELECT
USING (
  owner_id = auth.uid() 
  OR public.is_team_member(id, auth.uid())
);

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
CREATE POLICY "Team owners can update their teams"
ON public.teams FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
CREATE POLICY "Team owners can delete their teams"
ON public.teams FOR DELETE
USING (owner_id = auth.uid());

-- =====================================================
-- 7. RLS POLICIES FOR TEAM MEMBERS
-- =====================================================
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
CREATE POLICY "Users can view team members"
ON public.team_members FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_team_member(team_id, auth.uid())
);

DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
CREATE POLICY "Team admins can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
  OR (SELECT owner_id FROM teams WHERE id = team_id) = auth.uid()
);

DROP POLICY IF EXISTS "Team admins can update members" ON public.team_members;
CREATE POLICY "Team admins can update members"
ON public.team_members FOR UPDATE
USING (
  public.is_team_admin(team_id, auth.uid())
  OR user_id = auth.uid() -- Users can update own membership (e.g., accept invite)
)
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;
CREATE POLICY "Team admins can remove members"
ON public.team_members FOR DELETE
USING (
  public.is_team_admin(team_id, auth.uid())
  OR user_id = auth.uid() -- Users can leave team
);

-- =====================================================
-- 8. TRIGGER: Auto-add owner as admin member
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_team_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'admin', 'active', NOW())
  ON CONFLICT (team_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_team_owner_membership ON public.teams;
CREATE TRIGGER create_team_owner_membership
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.create_team_owner_membership();

-- =====================================================
-- 9. ROLE PERMISSIONS MATRIX
-- =====================================================
-- Store role permissions for reference
CREATE TABLE IF NOT EXISTS public.team_role_permissions (
  role TEXT PRIMARY KEY,
  can_manage_team BOOLEAN DEFAULT FALSE,
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_create_projects BOOLEAN DEFAULT FALSE,
  can_edit_all_projects BOOLEAN DEFAULT FALSE,
  can_delete_projects BOOLEAN DEFAULT FALSE,
  can_view_reports BOOLEAN DEFAULT FALSE,
  can_manage_catalog BOOLEAN DEFAULT FALSE,
  description_pl TEXT
);

-- Insert default permissions
INSERT INTO public.team_role_permissions (role, can_manage_team, can_manage_members, can_create_projects, can_edit_all_projects, can_delete_projects, can_view_reports, can_manage_catalog, description_pl)
VALUES 
  ('admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'Administrator - pełny dostęp'),
  ('kierownik', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, 'Kierownik - zarządzanie projektami i zespołem'),
  ('elektryk', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 'Elektryk - praca nad przypisanymi projektami')
ON CONFLICT (role) DO NOTHING;

-- =====================================================
-- 10. UPDATE PROJECTS RLS FOR TEAM ACCESS
-- =====================================================
-- Add policy for team project access
DROP POLICY IF EXISTS "Team members can view team projects" ON public.projects;
CREATE POLICY "Team members can view team projects"
ON public.projects FOR SELECT
USING (
  user_id = auth.uid()
  OR public.user_is_project_member(id)
  OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()))
);

-- Team managers can edit team projects
DROP POLICY IF EXISTS "Team managers can update team projects" ON public.projects;
CREATE POLICY "Team managers can update team projects"
ON public.projects FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.user_can_edit_project(id)
  OR (team_id IS NOT NULL AND public.is_team_manager(team_id, auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
  OR public.user_can_edit_project(id)
  OR (team_id IS NOT NULL AND public.is_team_manager(team_id, auth.uid()))
);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Teams system created successfully' as status;
