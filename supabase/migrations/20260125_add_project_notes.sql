-- Add notes field to projects table
-- This allows users to add general notes/comments to entire projects

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.projects.notes IS 'General notes or comments for the entire project';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added notes column to projects table';
END $$;
