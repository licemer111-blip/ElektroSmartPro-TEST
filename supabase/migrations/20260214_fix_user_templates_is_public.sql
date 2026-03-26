-- FIX: User templates marked as public incorrectly
-- All user-created templates should be private (is_public = false)
-- Only system/admin templates should be public

-- Set is_public = false for all templates created by regular users
UPDATE public.project_templates
SET is_public = false
WHERE is_public IS NULL OR is_public = true;

-- Add comment
COMMENT ON COLUMN public.project_templates.is_public IS 'User templates are private, only system templates are public';
