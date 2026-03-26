-- billing_events: Audit trail for all Stripe webhook events (DB-First pattern)
-- Status: 'pending' → 'success' | 'failed' | 'skipped'
CREATE TABLE IF NOT EXISTS billing_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  text        NOT NULL,
  event_type       text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  user_id          uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_object_id text,
  infakt_invoice_id text,
  error_message    text,
  payload          jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_events_stripe_event_id_key
  ON billing_events (stripe_event_id);

CREATE INDEX IF NOT EXISTS billing_events_status_idx
  ON billing_events (status);

CREATE INDEX IF NOT EXISTS billing_events_user_id_idx
  ON billing_events (user_id);

CREATE OR REPLACE FUNCTION update_billing_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_events_updated_at_trigger ON billing_events;
CREATE TRIGGER billing_events_updated_at_trigger
  BEFORE UPDATE ON billing_events
  FOR EACH ROW EXECUTE FUNCTION update_billing_events_updated_at();

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_read_billing_events"
  ON billing_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
