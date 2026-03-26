-- Add negotiation columns to offer_links for two-way client-contractor negotiation
-- proposed_changes: JSONB storing client's proposed edits (prices/quantities)
-- contractor_response: JSONB storing contractor's response (accept/reject/counter)
-- negotiation_round: integer tracking back-and-forth count

ALTER TABLE offer_links ADD COLUMN IF NOT EXISTS proposed_changes jsonb DEFAULT NULL;
ALTER TABLE offer_links ADD COLUMN IF NOT EXISTS contractor_response jsonb DEFAULT NULL;
ALTER TABLE offer_links ADD COLUMN IF NOT EXISTS negotiation_round integer DEFAULT 0;

COMMENT ON COLUMN offer_links.proposed_changes IS 'Client proposed edits: { items: { [itemId]: { quantity?, materialPrice?, laborPrice? } }, comment?, submittedAt? }';
COMMENT ON COLUMN offer_links.contractor_response IS 'Contractor response to proposal: { action: accept|reject|counter, items?: {...}, comment?, respondedAt? }';
COMMENT ON COLUMN offer_links.negotiation_round IS 'Number of negotiation rounds (0 = no negotiation)';
