-- =====================================================
-- TEAM INVITATIONS TABLE
-- =====================================================
-- Allows team owners to invite new members via email
-- Date: 2026-01-29

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'elektryk',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON public.team_invitations(team_id);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can see invitations sent to their email
DROP POLICY IF EXISTS "Users can view their invitations" ON public.team_invitations;
CREATE POLICY "Users can view their invitations"
ON public.team_invitations FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR invited_by = auth.uid()
  OR EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
);

-- Team admins can create invitations
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
CREATE POLICY "Team admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
);

-- Users can update invitations sent to them (accept/decline)
DROP POLICY IF EXISTS "Users can update their invitations" ON public.team_invitations;
CREATE POLICY "Users can update their invitations"
ON public.team_invitations FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Team owners can delete invitations
DROP POLICY IF EXISTS "Team owners can delete invitations" ON public.team_invitations;
CREATE POLICY "Team owners can delete invitations"
ON public.team_invitations FOR DELETE
USING (
  EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
);

SELECT 'Team invitations table created' as status;
