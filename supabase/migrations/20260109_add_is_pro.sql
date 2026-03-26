-- ========================================
-- ADD is_pro COLUMN - Demo Mode Logic
-- ========================================
-- Master Blueprint Rule #1: "The Trap"
-- Free users can create estimates but CANNOT see prices
-- ========================================

-- Step 1: Add is_pro column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Add is_pro to existing profiles (all start as free)
UPDATE public.profiles 
SET is_pro = false 
WHERE is_pro IS NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles(is_pro);

-- Step 4: Add project_limit column for free tier restriction
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1 NOT NULL;

-- Step 5: Update existing profiles to have limit of 1
UPDATE public.profiles 
SET max_projects = 1 
WHERE is_pro = false;

-- Step 6: Add helpful comments
COMMENT ON COLUMN public.profiles.is_pro IS 'PRO subscription status. FALSE = Demo Mode (prices blurred), TRUE = Full access';
COMMENT ON COLUMN public.profiles.max_projects IS 'Maximum active projects allowed. Free tier = 1, Pro = unlimited (999)';

-- ========================================
-- OPTIONAL: Helper function to check PRO status
-- ========================================
CREATE OR REPLACE FUNCTION public.user_is_pro()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_pro 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) IS TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION
-- ========================================
-- Check all profiles:
-- SELECT id, company_name, is_pro, max_projects FROM public.profiles;

-- Check current user:
-- SELECT user_is_pro();
