-- ============================================================================
-- PAYMENTS TABLE - Transaction History for Admin Finance Panel
-- ============================================================================
-- Purpose: Store all successful payment transactions for accounting and reporting
-- Date: 2026-01-14
-- ============================================================================

-- Drop existing table if exists (for clean re-run)
DROP TABLE IF EXISTS public.payments CASCADE;

-- ============================================================================
-- CREATE PAYMENTS TABLE
-- ============================================================================

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- User Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  
  -- Stripe References
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Payment Details
  amount_total INTEGER NOT NULL, -- Total amount in grosze (PLN cents) - includes VAT
  amount_net INTEGER NOT NULL,   -- Net amount in grosze (before VAT)
  amount_vat INTEGER NOT NULL,   -- VAT amount in grosze
  vat_rate INTEGER NOT NULL,     -- VAT rate percentage (8 or 23)
  currency TEXT DEFAULT 'pln' NOT NULL,
  
  -- Payment Status
  status TEXT DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for filtering by user
CREATE INDEX idx_payments_user_id ON public.payments(user_id);

-- Index for filtering by date (for reports)
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Index for filtering by status
CREATE INDEX idx_payments_status ON public.payments(status);

-- Index for Stripe references (for webhook lookups)
CREATE INDEX idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_invoice ON public.payments(stripe_invoice_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do anything (for webhooks and admin)
CREATE POLICY "Service role has full access"
  ON public.payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.payments IS 'Transaction history for all successful payments';
COMMENT ON COLUMN public.payments.amount_total IS 'Total amount in grosze (PLN cents) including VAT';
COMMENT ON COLUMN public.payments.amount_net IS 'Net amount in grosze before VAT';
COMMENT ON COLUMN public.payments.amount_vat IS 'VAT amount in grosze';
COMMENT ON COLUMN public.payments.vat_rate IS 'VAT rate percentage (8 or 23)';
