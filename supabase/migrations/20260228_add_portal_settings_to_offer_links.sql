-- Add portal_settings JSONB column to offer_links table
-- Stores per-link view preferences: showKnr, showRg, showColors

ALTER TABLE offer_links
  ADD COLUMN IF NOT EXISTS portal_settings JSONB DEFAULT '{"showKnr": false, "showRg": false, "showColors": false}'::jsonb;
