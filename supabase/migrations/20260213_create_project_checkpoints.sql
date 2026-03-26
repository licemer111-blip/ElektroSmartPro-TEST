-- ============================================================================
-- ✅ Custom Checkpoints for project work checklist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','accepted')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_checkpoints_project ON public.project_checkpoints(project_id, sort_order);

-- RLS
ALTER TABLE public.project_checkpoints ENABLE ROW LEVEL SECURITY;

-- SELECT: project owner or member
CREATE POLICY "Checkpoints: read by project access"
  ON public.project_checkpoints FOR SELECT TO authenticated
  USING (public.has_project_access(project_id, auth.uid()));

-- INSERT: project owner or member
CREATE POLICY "Checkpoints: create by project access"
  ON public.project_checkpoints FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_project_access(project_id, auth.uid())
  );

-- UPDATE: project owner or member
CREATE POLICY "Checkpoints: update by project access"
  ON public.project_checkpoints FOR UPDATE TO authenticated
  USING (public.has_project_access(project_id, auth.uid()));

-- DELETE: project owner or member
CREATE POLICY "Checkpoints: delete by project access"
  ON public.project_checkpoints FOR DELETE TO authenticated
  USING (public.has_project_access(project_id, auth.uid()));
