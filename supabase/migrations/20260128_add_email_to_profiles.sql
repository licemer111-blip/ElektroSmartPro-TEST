-- =====================================================
-- ADD EMAIL COLUMN TO PROFILES
-- =====================================================
-- This adds email column to profiles table for easier user lookup

-- Add email column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Create function to sync email from auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile with email from auth.users
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email on user creation
DROP TRIGGER IF EXISTS sync_profile_email_on_create ON auth.users;
CREATE TRIGGER sync_profile_email_on_create
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email();

-- Create trigger to sync email on user update
DROP TRIGGER IF EXISTS sync_profile_email_on_update ON auth.users;
CREATE TRIGGER sync_profile_email_on_update
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_profile_email();

-- Backfill existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.email IS 'User email synced from auth.users for easier lookups';
