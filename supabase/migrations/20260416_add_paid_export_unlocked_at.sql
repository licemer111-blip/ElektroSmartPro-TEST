-- v2.0 Pay-per-Export: one-time 29 zł unlock for a single clean PDF export.
-- When set (non-null), the NEXT PDF export for this project is generated without
-- the "DEMO" watermark. After consumption, the column is reset to NULL by the
-- PDF route. Stripe webhook sets it to now() on payment success.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS paid_export_unlocked_at timestamptz NULL;

COMMENT ON COLUMN public.projects.paid_export_unlocked_at IS
  'v2.0 Pay-per-Export: timestamp when a one-time clean PDF unlock was purchased via Stripe (29 zł). NULL after the next PDF export consumes the unlock. See /api/billing/pay-per-export and stripe webhook handler.';
