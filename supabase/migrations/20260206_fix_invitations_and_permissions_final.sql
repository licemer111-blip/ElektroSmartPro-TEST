-- =====================================================
-- FINAL FIX V2: Team Invitations, Permissions & RLS
-- Date: 2026-02-06
-- =====================================================

-- 1. Helper: Safe Email Get
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_email, auth.jwt() ->> 'email');
END;
$$;

-- 2. Helper: Check Invitation (Case-Insensitive)
CREATE OR REPLACE FUNCTION public.has_team_invitation(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  v_user_email := LOWER(public.get_my_email());
  RETURN EXISTS (
    SELECT 1 FROM team_invitations ti
    WHERE ti.team_id = p_team_id
    AND LOWER(ti.email) = v_user_email
    AND ti.status = 'pending'
  );
END;
$$;

-- 3. FIX: Allow users to SEE the team they are invited to (Fixes "Unknown Team")
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
CREATE POLICY "Users can view teams they belong to"
ON public.teams FOR SELECT
USING (
  owner_id = auth.uid() 
  OR public.is_team_member(id, auth.uid())
  OR public.has_team_invitation(id) -- <--- CRITICAL ADDITION
);

-- 4. FIX: Allow users to JOIN the team (Insert themselves into team_members)
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can be added by admins or via invitation" ON public.team_members;

CREATE POLICY "Team members can be added by admins or via invitation"
ON public.team_members FOR INSERT
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
  OR (SELECT owner_id FROM teams WHERE id = team_id) = auth.uid()
  OR (
    user_id = auth.uid()
    AND public.has_team_invitation(team_id) -- <--- CRITICAL ADDITION
  )
);

-- 5. Fix Invitations Table RLS (View/Update own)
DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
CREATE POLICY "Users can view their invitations"
ON public.team_invitations FOR SELECT
USING (
  LOWER(email) = LOWER(public.get_my_email())
  OR invited_by = auth.uid()
  OR public.is_team_admin(team_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can update their invitations" ON public.team_invitations;
CREATE POLICY "Users can update their invitations"
ON public.team_invitations FOR UPDATE
USING (LOWER(email) = LOWER(public.get_my_email()))
WITH CHECK (LOWER(email) = LOWER(public.get_my_email()));

-- 6. Fix team_invitations INSERT policy (use profiles instead of auth.users)
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
CREATE POLICY "Team admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
    OR public.is_team_admin(team_id, auth.uid())
  )
);

-- 7. Restore Project Edit Permissions for Team Managers
CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Owner
  IF EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND user_id = auth.uid()) THEN RETURN TRUE; END IF;
  
  -- Member
  IF EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role IN ('owner', 'editor', 'kierownik', 'admin')
  ) THEN RETURN TRUE; END IF;

  -- Team Manager
  SELECT team_id INTO v_team_id FROM projects WHERE id = p_project_id;
  IF v_team_id IS NOT NULL THEN
    RETURN public.is_team_manager(v_team_id, auth.uid());
  END IF;

  RETURN FALSE;
END;
$$;

SELECT 'FIXED: Unknown Team issue & Join Permissions' as status;
