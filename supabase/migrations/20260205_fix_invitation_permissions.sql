-- =====================================================
-- FIX TEAM INVITATION PERMISSIONS
-- =====================================================
-- Date: 2026-02-05
-- Description: Allow team managers and admins (not just owners) to create invitations

-- Drop restrictive policy
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;

-- Create new policy using is_team_manager function
-- This allows Owners, Admins, and Managers (Kierownik) to invite
CREATE POLICY "Team admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND public.is_team_manager(team_id, auth.uid())
);

-- Also fix DELETE policy to allow canceling invitations
DROP POLICY IF EXISTS "Team owners can delete invitations" ON public.team_invitations;
CREATE POLICY "Team managers can delete invitations"
ON public.team_invitations FOR DELETE
USING (
  public.is_team_manager(team_id, auth.uid())
);

SELECT 'Team invitation permissions updated' as status;
