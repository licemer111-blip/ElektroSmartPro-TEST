-- ========================================
-- ADD DEFAULT REGION TO PROFILES
-- ========================================
-- Task: Add user's default/preferred region for pre-filling new projects
-- Date: 2026-01-13
-- ========================================

-- Step 1: Add default_region_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_region_id UUID REFERENCES public.regions(id);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_default_region 
ON public.profiles(default_region_id);

-- Step 3: Add helpful comment
COMMENT ON COLUMN public.profiles.default_region_id IS 'User''s preferred region (voivodeship) for pre-filling new projects. NULL if not set.';

-- ========================================
-- VERIFICATION
-- ========================================
-- Check that column was added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name = 'default_region_id';
