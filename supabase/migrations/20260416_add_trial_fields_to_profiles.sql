-- v2.1 Freemium model: 7-day free PRO trial (no credit card required).
--
-- profiles.trial_started_at: timestamp when user clicked "Start Free Trial".
--   NULL = never started trial. Set ONCE — trial is one-shot per account.
-- profiles.trial_ends_at: trial_started_at + 7 days. Pre-computed for fast
--   index-friendly comparisons in entitlement checks.
--
-- After trial_ends_at < now() → user reverts to FREE tier automatically (no
-- billing, no card was collected). AI quota (5/mo) + max 3 projects apply.
-- During trial → treated as effectively PRO (unlimited AI, clean PDF, etc.)
-- via lib/auth/entitlements.ts → getEffectiveIsPro(profile).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS trial_ends_at    timestamptz NULL;

COMMENT ON COLUMN public.profiles.trial_started_at IS
  'v2.1: when user activated the 7-day free PRO trial (one-shot per account). NULL = never activated. See lib/auth/entitlements.ts.';
COMMENT ON COLUMN public.profiles.trial_ends_at IS
  'v2.1: trial_started_at + 7 days. Used by getEffectiveIsPro() to grant PRO entitlements during trial window.';

CREATE INDEX IF NOT EXISTS idx_profiles_active_trial
  ON public.profiles (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;
