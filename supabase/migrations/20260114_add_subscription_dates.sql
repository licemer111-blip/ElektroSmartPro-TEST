-- ========================================
-- ADD SUBSCRIPTION DATE FIELDS TO PROFILES
-- ========================================
-- Task: Display subscription dates on subscription page
-- Date: 2026-01-14
-- ========================================

-- Step 1: Add current_period_start column (when subscription started/last renewed)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

-- Step 2: Add current_period_end column (when subscription expires/renews)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Step 3: Add cancel_at_period_end column (did user cancel auto-renewal?)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Step 4: Add helpful comments
COMMENT ON COLUMN public.profiles.current_period_start IS 'Start date of current subscription period. Set by Stripe webhook.';
COMMENT ON COLUMN public.profiles.current_period_end IS 'End date of current subscription period (renewal/expiry date). Set by Stripe webhook.';
COMMENT ON COLUMN public.profiles.cancel_at_period_end IS 'Whether subscription is set to cancel at period end. Set by Stripe webhook.';

-- ========================================
-- VERIFICATION
-- ========================================
-- Check that columns were added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('current_period_start', 'current_period_end', 'cancel_at_period_end');
