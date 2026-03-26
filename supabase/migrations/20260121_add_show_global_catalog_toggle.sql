-- =====================================================
-- Add global catalog visibility toggle
-- Allows users to show/hide global catalog (2000+ items)
-- =====================================================

-- Add column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_global_catalog BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.profiles.show_global_catalog IS 
'When TRUE, user sees global catalog (2000+ items). When FALSE, user sees only their own items.';

-- Update existing users to show global catalog by default (for migration)
-- New users will have FALSE by default
UPDATE public.profiles
SET show_global_catalog = true
WHERE show_global_catalog IS NULL;
