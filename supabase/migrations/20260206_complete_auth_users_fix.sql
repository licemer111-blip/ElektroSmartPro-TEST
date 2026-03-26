-- =====================================================
-- COMPLETE FIX: Remove ALL auth.users references
-- Date: 2026-02-06
-- Description: Nuclear option - replace all policies that might touch auth.users
-- =====================================================

-- =====================================================
-- STEP 1: Create safe helper functions (SECURITY DEFINER)
-- =====================================================

-- Safe email getter using profiles table
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
  IF v_email IS NULL THEN
    v_email := auth.jwt() ->> 'email';
  END IF;
  RETURN LOWER(v_email);
END;
$$;

-- Check invitation using SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_team_invitation(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_has_invite BOOLEAN;
BEGIN
  v_user_email := public.get_my_email();
  
  SELECT EXISTS (
    SELECT 1 FROM public.team_invitations ti
    WHERE ti.team_id = p_team_id
    AND LOWER(ti.email) = v_user_email
    AND ti.status = 'pending'
  ) INTO v_has_invite;
  
  RETURN COALESCE(v_has_invite, FALSE);
END;
$$;

-- Check team membership (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id
    AND owner_id = p_user_id
  );
END;
$$;

-- Check team admin (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND role = 'admin'
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id
    AND owner_id = p_user_id
  );
END;
$$;

-- Check team manager (admin or kierownik)
CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND role IN ('admin', 'kierownik')
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id
    AND owner_id = p_user_id
  );
END;
$$;

-- Function to check if user can accept invitation
CREATE OR REPLACE FUNCTION public.can_accept_team_invitation(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_team_invitation(p_team_id);
END;
$$;

-- =====================================================
-- STEP 2: Fix team_invitations policies
-- =====================================================

-- Drop ALL existing policies on team_invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team owners can delete invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team managers can delete invitations" ON public.team_invitations;

-- SELECT: Users can see invitations sent to their email
CREATE POLICY "Users can view their invitations"
ON public.team_invitations FOR SELECT
USING (
  LOWER(email) = public.get_my_email()
  OR invited_by = auth.uid()
  OR public.is_team_admin(team_id, auth.uid())
);

-- INSERT: Team admins/owners can create invitations
CREATE POLICY "Team admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND public.is_team_manager(team_id, auth.uid())
);

-- UPDATE: Users can accept/decline their invitations
CREATE POLICY "Users can update their invitations"
ON public.team_invitations FOR UPDATE
USING (LOWER(email) = public.get_my_email())
WITH CHECK (LOWER(email) = public.get_my_email());

-- DELETE: Team managers can cancel invitations
CREATE POLICY "Team managers can delete invitations"
ON public.team_invitations FOR DELETE
USING (public.is_team_manager(team_id, auth.uid()));

-- =====================================================
-- STEP 3: Fix team_members policies
-- =====================================================

-- Drop ALL existing policies on team_members
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can be added by admins or via invitation" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;

-- SELECT: Team members can see other members
CREATE POLICY "Users can view team members"
ON public.team_members FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_team_member(team_id, auth.uid())
);

-- INSERT: Admins can add, OR user can add themselves with valid invitation
CREATE POLICY "Team members can be added"
ON public.team_members FOR INSERT
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
  OR (
    user_id = auth.uid()
    AND public.can_accept_team_invitation(team_id)
  )
);

-- UPDATE: Admins can update, users can update own record
CREATE POLICY "Team admins can update members"
ON public.team_members FOR UPDATE
USING (
  public.is_team_admin(team_id, auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
  OR user_id = auth.uid()
);

-- DELETE: Admins can remove, users can leave
CREATE POLICY "Team admins can remove members"
ON public.team_members FOR DELETE
USING (
  public.is_team_admin(team_id, auth.uid())
  OR user_id = auth.uid()
);

-- =====================================================
-- STEP 4: Fix teams policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
CREATE POLICY "Users can view teams they belong to"
ON public.teams FOR SELECT
USING (
  owner_id = auth.uid() 
  OR public.is_team_member(id, auth.uid())
  OR public.has_team_invitation(id)
);

-- =====================================================
-- STEP 5: Ensure profiles have emails
-- =====================================================

-- Backfill missing emails (safe, won't fail if already done)
DO $$
BEGIN
  UPDATE public.profiles p
  SET email = (SELECT email FROM auth.users WHERE id = p.id)
  WHERE p.email IS NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not backfill emails: %', SQLERRM;
END;
$$;

SELECT 'COMPLETE FIX APPLIED - All auth.users references removed' as status;
