-- =====================================================
-- FINAL FIX: Remove all auth.users references from RLS
-- Date: 2026-02-05
-- Description: Replaces direct auth.users queries with safe auth.jwt() calls
-- =====================================================

-- 1. Fix team_invitations policies
DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
CREATE POLICY "Users can view their invitations"
ON public.team_invitations FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
  OR invited_by = auth.uid()
  OR public.is_team_admin(team_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can update their invitations" ON public.team_invitations;
CREATE POLICY "Users can update their invitations"
ON public.team_invitations FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  email = (auth.jwt() ->> 'email')
);

-- 2. Fix has_team_invitation function (Double check)
CREATE OR REPLACE FUNCTION public.has_team_invitation(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_invitations ti
    WHERE ti.team_id = p_team_id
    AND ti.email = (auth.jwt() ->> 'email')
    AND ti.status = 'pending'
  );
END;
$$;

-- 3. Fix team_members INSERT policy (Double check)
DROP POLICY IF EXISTS "Team members can be added by admins or via invitation" ON public.team_members;
CREATE POLICY "Team members can be added by admins or via invitation"
ON public.team_members FOR INSERT
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
  OR (SELECT owner_id FROM teams WHERE id = team_id) = auth.uid()
  OR (
    user_id = auth.uid()
    AND public.has_team_invitation(team_id)
  )
);

SELECT 'All auth.users RLS issues fixed' as status;
