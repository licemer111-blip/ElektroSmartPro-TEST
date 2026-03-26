-- =====================================================
-- MIGRATION: Add Admin Role to Profiles
-- Date: 2026-01-21
-- Description: Adds role column for admin access control
-- =====================================================

-- Add role column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add comment
COMMENT ON COLUMN public.profiles.role IS 
'User role: "user" (default) or "admin" (full access to admin panel)';

-- Add index for fast admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles(role) WHERE role = 'admin';

-- =====================================================
-- ADMIN USER SETUP INSTRUCTIONS
-- =====================================================

-- 1. Find your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Set yourself as admin (REPLACE the UUID with your actual user ID):
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'YOUR-USER-ID-HERE';

-- Example:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = '4eef3223-cfc0-430c-b9f2-879c771e2ad5';

-- 3. Verify:
-- SELECT id, email, role FROM public.profiles WHERE role = 'admin';

-- =====================================================
-- RLS POLICY (Optional - for extra security)
-- =====================================================

-- Create policy to allow admins to view all profiles
DO $$ BEGIN
  CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      role = 'admin' OR 
      auth.uid() = id
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- SUCCESS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Admin role column added to profiles!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Find your user ID from auth.users';
  RAISE NOTICE '   2. Run: UPDATE profiles SET role = ''admin'' WHERE id = ''YOUR-ID'';';
  RAISE NOTICE '   3. Verify admin access works';
END $$;
