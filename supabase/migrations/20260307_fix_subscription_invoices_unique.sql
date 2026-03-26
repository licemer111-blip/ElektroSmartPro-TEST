-- DB-level idempotency guard against race conditions (parallel serverless invocations)
-- Two simultaneous webhook events can both pass the app-level check before either writes to DB
-- A UNIQUE constraint on stripe_invoice_id guarantees only one INSERT succeeds at DB level

-- Drop duplicate rows first (keep the earliest one)
DELETE FROM subscription_invoices a
USING subscription_invoices b
WHERE a.stripe_invoice_id = b.stripe_invoice_id
  AND a.created_at > b.created_at;

-- Add UNIQUE constraint if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscription_invoices_stripe_invoice_id_key'
  ) THEN
    ALTER TABLE subscription_invoices
      ADD CONSTRAINT subscription_invoices_stripe_invoice_id_key
      UNIQUE (stripe_invoice_id);
  END IF;
END $$;
