-- ============================================================================
-- 💬 Live Chat: project_messages table for real-time text messaging
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_messages_project ON public.project_messages(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_messages_user ON public.project_messages(user_id);

-- RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: project owner or member
CREATE POLICY "Messages: read by project access"
  ON public.project_messages FOR SELECT TO authenticated
  USING (public.has_project_access(project_id, auth.uid()));

-- INSERT: project owner or member
CREATE POLICY "Messages: send by project access"
  ON public.project_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_project_access(project_id, auth.uid())
  );

-- DELETE: only own messages
CREATE POLICY "Messages: delete own"
  ON public.project_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
