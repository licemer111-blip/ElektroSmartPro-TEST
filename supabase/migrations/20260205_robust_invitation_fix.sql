-- =====================================================
-- ROBUST FIX: Team Invitation Acceptance
-- Date: 2026-02-05
-- Description: Uses profiles table instead of auth.jwt() for email matching
-- =====================================================

-- 1. Ensure has_team_invitation uses profiles for email
CREATE OR REPLACE FUNCTION public.has_team_invitation(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get email from profiles table (already synced with auth.users)
  SELECT email INTO v_user_email FROM public.profiles WHERE id = auth.uid();
  
  -- If email not found in profiles, try auth.jwt() as fallback
  IF v_user_email IS NULL THEN
    v_user_email := auth.jwt() ->> 'email';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM team_invitations ti
    WHERE ti.team_id = p_team_id
    AND ti.email = v_user_email
    AND ti.status = 'pending'
  );
END;
$$;

-- 2. Update team_invitations SELECT policy
DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
CREATE POLICY "Users can view their invitations"
ON public.team_invitations FOR SELECT
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR invited_by = auth.uid()
  OR public.is_team_admin(team_id, auth.uid())
);

-- 3. Update team_invitations UPDATE policy
DROP POLICY IF EXISTS "Users can update their invitations" ON public.team_invitations;
CREATE POLICY "Users can update their invitations"
ON public.team_invitations FOR UPDATE
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- 4. Backfill any missing emails in profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

SELECT 'Robust invitation fix applied' as status;
