-- =====================================================
-- COMPLETE FIX: Remove ALL auth.users references from RLS
-- Date: 2026-02-07
-- This migration fixes the "permission denied for table users" error
-- =====================================================

-- 1. Safe email getter using profiles table
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

-- 2. Check invitation (SECURITY DEFINER bypasses RLS)
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

-- 3. is_team_member (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_user_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = p_user_id
  );
END;
$$;

-- 4. is_team_admin (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_user_id AND role = 'admin' AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = p_user_id
  );
END;
$$;

-- 5. is_team_manager (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_user_id AND role IN ('admin', 'kierownik') AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = p_user_id
  );
END;
$$;

-- 6. can_accept_team_invitation
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
-- FIX team_invitations policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team owners can delete invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team managers can delete invitations" ON public.team_invitations;

CREATE POLICY "Users can view their invitations" ON public.team_invitations FOR SELECT
USING (LOWER(email) = public.get_my_email() OR invited_by = auth.uid() OR public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Team admins can create invitations" ON public.team_invitations FOR INSERT
WITH CHECK (invited_by = auth.uid() AND public.is_team_manager(team_id, auth.uid()));

CREATE POLICY "Users can update their invitations" ON public.team_invitations FOR UPDATE
USING (LOWER(email) = public.get_my_email()) WITH CHECK (LOWER(email) = public.get_my_email());

CREATE POLICY "Team managers can delete invitations" ON public.team_invitations FOR DELETE
USING (public.is_team_manager(team_id, auth.uid()));

-- =====================================================
-- FIX team_members policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can be added by admins or via invitation" ON public.team_members;
DROP POLICY IF EXISTS "Team members can be added" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;

CREATE POLICY "Users can view team members" ON public.team_members FOR SELECT
USING (user_id = auth.uid() OR public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can be added" ON public.team_members FOR INSERT
WITH CHECK (public.is_team_admin(team_id, auth.uid()) OR (user_id = auth.uid() AND public.can_accept_team_invitation(team_id)));

CREATE POLICY "Team admins can update members" ON public.team_members FOR UPDATE
USING (public.is_team_admin(team_id, auth.uid()) OR user_id = auth.uid())
WITH CHECK (public.is_team_admin(team_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Team admins can remove members" ON public.team_members FOR DELETE
USING (public.is_team_admin(team_id, auth.uid()) OR user_id = auth.uid());

-- =====================================================
-- FIX teams policies  
-- =====================================================
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
CREATE POLICY "Users can view teams they belong to" ON public.teams FOR SELECT
USING (owner_id = auth.uid() OR public.is_team_member(id, auth.uid()) OR public.has_team_invitation(id));

-- Done
SELECT 'RLS auth.users fix applied successfully' as status;
