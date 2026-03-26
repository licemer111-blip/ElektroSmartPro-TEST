-- Allow users to accept team invitations and add themselves to team_members
-- Migration: 20260205_fix_team_member_acceptance.sql

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;

-- Create helper function to check if user has valid invitation
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

-- Create new policy that allows BOTH admins AND invited users to insert
CREATE POLICY "Team members can be added by admins or via invitation"
ON public.team_members FOR INSERT
WITH CHECK (
  -- Admins can add members
  public.is_team_admin(team_id, auth.uid())
  OR (SELECT owner_id FROM teams WHERE id = team_id) = auth.uid()
  -- OR user can add themselves if they have a valid pending invitation
  OR (
    user_id = auth.uid()
    AND public.has_team_invitation(team_id)
  )
);

-- Add comment for documentation
COMMENT ON POLICY "Team members can be added by admins or via invitation" ON public.team_members IS
'Allows team admins/owners to add members, and allows users to add themselves when accepting a valid team invitation';
