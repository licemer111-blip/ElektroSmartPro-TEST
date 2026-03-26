-- =====================================================
-- FIX: Repair Profiles Schema
-- Date: 2026-02-05
-- Description: Add all missing columns from Profile interface to profiles table
-- =====================================================

-- 1. Add missing text and numeric columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS regon TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS infakt_api_key TEXT,
ADD COLUMN IF NOT EXISTS show_global_catalog BOOLEAN DEFAULT TRUE;

-- 2. Add foreign key columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'default_region_id') THEN
    ALTER TABLE public.profiles ADD COLUMN default_region_id UUID REFERENCES public.regions(id);
  END IF;
END $$;

-- 3. Sync full_name from email as a fallback
UPDATE public.profiles
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL AND email IS NOT NULL;

-- 4. Add comments
COMMENT ON COLUMN public.profiles.full_name IS 'User full name/display name';
COMMENT ON COLUMN public.profiles.avatar_url IS 'User profile picture URL';
COMMENT ON COLUMN public.profiles.max_projects IS 'Maximum number of projects allowed on current plan';
COMMENT ON COLUMN public.profiles.role IS 'System role (admin/user)';

SELECT 'Profiles schema synchronized with TypeScript interface' as status;
