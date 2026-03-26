-- Migration: Add deadline field to projects
-- Description: Allow users to set a completion deadline for projects

-- Add deadline column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add index for faster deadline queries
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON public.projects(deadline);

-- Add comment
COMMENT ON COLUMN public.projects.deadline IS 'Project completion deadline/due date';
