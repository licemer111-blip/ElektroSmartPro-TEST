-- =====================================================
-- TEAM CHAT
-- =====================================================
-- Simple real-time chat for teams
-- Date: 2026-01-29

-- Create team_messages table
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Optional: reference to project being discussed
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_messages_team ON public.team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created ON public.team_messages(team_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for team_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Team members can view team messages
DROP POLICY IF EXISTS "Team members can view messages" ON public.team_messages;
CREATE POLICY "Team members can view messages"
ON public.team_messages FOR SELECT
USING (public.is_team_member(team_id, auth.uid()));

-- Team members can send messages
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_messages;
CREATE POLICY "Team members can send messages"
ON public.team_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND public.is_team_member(team_id, auth.uid())
);

-- Users can update own messages (edit)
DROP POLICY IF EXISTS "Users can edit own messages" ON public.team_messages;
CREATE POLICY "Users can edit own messages"
ON public.team_messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.team_messages;
CREATE POLICY "Users can delete own messages"
ON public.team_messages FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Team chat created' as status;
