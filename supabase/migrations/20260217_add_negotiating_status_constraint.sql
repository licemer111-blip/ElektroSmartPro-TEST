-- Add 'negotiating' to the offer_links status check constraint
ALTER TABLE offer_links DROP CONSTRAINT IF EXISTS offer_links_status_check;
ALTER TABLE offer_links ADD CONSTRAINT offer_links_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'viewed'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'negotiating'::text]));
