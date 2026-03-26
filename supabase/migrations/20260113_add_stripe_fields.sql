-- ========================================
-- ADD STRIPE FIELDS TO PROFILES
-- ========================================
-- Task: Pre-Release Audit - Missing Stripe Fields
-- Date: 2026-01-13
-- ========================================

-- Step 1: Add stripe_customer_id column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Step 2: Add subscription_id column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Step 3: Create index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

-- Step 4: Create index for subscription ID
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id 
ON public.profiles(subscription_id);

-- Step 5: Add helpful comments
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for subscription management. Set by webhook after checkout.';
COMMENT ON COLUMN public.profiles.subscription_id IS 'Stripe subscription ID. Set by webhook, cleared on cancellation.';

-- ========================================
-- VERIFICATION
-- ========================================
-- Check that columns were added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('stripe_customer_id', 'subscription_id');
