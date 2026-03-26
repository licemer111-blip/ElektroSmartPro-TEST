-- ========================================
-- FIX: Ensure is_pro defaults to FALSE
-- ========================================
-- Task 1.6.0: Fix Default PRO Status & Restore Project Limits
-- Issue: New users getting PRO status automatically
-- ========================================

-- Step 1: Ensure column defaults are correct
ALTER TABLE public.profiles 
ALTER COLUMN is_pro SET DEFAULT false;

ALTER TABLE public.profiles 
ALTER COLUMN max_projects SET DEFAULT 1;

-- Step 2: Fix any existing NULL values
UPDATE public.profiles 
SET is_pro = false 
WHERE is_pro IS NULL;

UPDATE public.profiles 
SET max_projects = 1 
WHERE max_projects IS NULL OR max_projects = 0;

-- Step 3: Fix any users who incorrectly got PRO status
-- (Keep only intentionally set PRO users, reset others to free)
-- IMPORTANT: This will reset ALL users to free tier
-- If you have real PRO users, comment out this line or modify the WHERE clause
UPDATE public.profiles 
SET is_pro = false, max_projects = 1
WHERE is_pro = true 
  AND created_at > NOW() - INTERVAL '7 days';  -- Only reset recent accounts

-- Step 4: Update the trigger function to explicitly set defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with explicit defaults for new user
  INSERT INTO public.profiles (id, is_pro, max_projects, created_at, updated_at)
  VALUES (
    NEW.id, 
    false,  -- Explicitly set to free tier
    1,      -- Explicitly set to 1 project limit
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Verify the setup
DO $$
DECLARE
  total_users INTEGER;
  free_users INTEGER;
  pro_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO free_users FROM public.profiles WHERE is_pro = false;
  SELECT COUNT(*) INTO pro_users FROM public.profiles WHERE is_pro = true;
  
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '   Total profiles: %', total_users;
  RAISE NOTICE '   Free tier users: %', free_users;
  RAISE NOTICE '   PRO users: %', pro_users;
  RAISE NOTICE '   Default is_pro: false';
  RAISE NOTICE '   Default max_projects: 1';
END $$;

-- Step 6: Add constraint to ensure is_pro is never NULL
ALTER TABLE public.profiles 
ALTER COLUMN is_pro SET NOT NULL;

ALTER TABLE public.profiles 
ALTER COLUMN max_projects SET NOT NULL;

-- Step 7: Add helpful comments
COMMENT ON COLUMN public.profiles.is_pro IS 'PRO subscription status. FALSE = Demo Mode (1 project, prices blurred), TRUE = Full access (unlimited projects)';
COMMENT ON COLUMN public.profiles.max_projects IS 'Maximum active projects. Demo = 1, PRO = 999. Enforced in UI logic.';

-- ========================================
-- VERIFICATION QUERIES (Run manually)
-- ========================================
-- Check all profiles:
-- SELECT id, email, is_pro, max_projects, created_at 
-- FROM public.profiles 
-- JOIN auth.users ON profiles.id = users.id
-- ORDER BY created_at DESC;

-- Check trigger function:
-- SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
