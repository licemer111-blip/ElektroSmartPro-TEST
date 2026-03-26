-- =====================================================
-- PROJECT ARCHIVE, TAGS & COLORS
-- =====================================================
-- Adds:
-- 1. Archive status for projects
-- 2. Tags/Labels for projects
-- 3. Color coding for projects
-- Date: 2026-01-29

-- =====================================================
-- 1. ADD ARCHIVE STATUS
-- =====================================================
-- Add status column if not exists (draft, final, archived)
DO $$ 
BEGIN
  -- Check if status column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
END $$;

-- Ensure status constraint allows 'archived'
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'final', 'archived'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- =====================================================
-- 2. ADD TAGS/LABELS
-- =====================================================
-- Create tags table
CREATE TABLE IF NOT EXISTS public.project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_tags_user_name_unique UNIQUE (user_id, name)
);

-- Create junction table for project-tag relationship
CREATE TABLE IF NOT EXISTS public.project_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.project_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_tag_unique UNIQUE (project_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_tags_user ON public.project_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tag_assignments_project ON public.project_tag_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tag_assignments_tag ON public.project_tag_assignments(tag_id);

-- RLS for project_tags
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tags" ON public.project_tags;
CREATE POLICY "Users can manage own tags"
ON public.project_tags FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS for project_tag_assignments
ALTER TABLE public.project_tag_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own project tags" ON public.project_tag_assignments;
CREATE POLICY "Users can manage own project tags"
ON public.project_tag_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- =====================================================
-- 3. ADD PROJECT COLOR
-- =====================================================
-- Add color column to projects
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'color'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN color TEXT DEFAULT NULL;
  END IF;
END $$;

-- =====================================================
-- 4. SEED DEFAULT TAGS
-- =====================================================
-- Note: Tags will be created per-user, not globally
-- But we can create a function to seed initial tags for new users

CREATE OR REPLACE FUNCTION public.seed_default_tags_for_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO project_tags (user_id, name, color) VALUES
    (p_user_id, 'Pilne', '#ef4444'),      -- Red
    (p_user_id, 'VIP', '#f59e0b'),         -- Amber
    (p_user_id, 'W realizacji', '#3b82f6'), -- Blue
    (p_user_id, 'Zakończone', '#22c55e')   -- Green
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Archive, Tags & Colors migration complete' as status;
