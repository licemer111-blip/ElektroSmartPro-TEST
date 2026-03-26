-- ========================================
-- FIX DEFAULT REGION TYPE (UUID -> TEXT)
-- ========================================
-- Task: Change default_region_id from UUID to TEXT
-- Date: 2026-01-16
-- Reason: We store region names as strings (e.g., "mazowieckie"), not UUIDs
-- ========================================

-- Step 1: Drop the foreign key constraint (if exists)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_default_region_id_fkey;

-- Step 2: Drop the index
DROP INDEX IF EXISTS idx_profiles_default_region;

-- Step 3: Change column type from UUID to TEXT
ALTER TABLE public.profiles 
ALTER COLUMN default_region_id TYPE TEXT USING default_region_id::TEXT;

-- Step 4: Recreate index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_default_region 
ON public.profiles(default_region_id);

-- Step 5: Update comment
COMMENT ON COLUMN public.profiles.default_region_id IS 'User''s preferred region (voivodeship) as string ID (e.g., "mazowieckie"). NULL if not set.';

-- ========================================
-- VERIFICATION
-- ========================================
-- Check that column type was changed:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name = 'default_region_id';
-- Expected: data_type = 'text'
