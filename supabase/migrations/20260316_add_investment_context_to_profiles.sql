-- Sprint v1.2: Add investment_context to profiles
-- Stores user's free-text investment description for ES-Engine AI context
-- e.g. "Inteligentny dom KNX, villa 400m², fotowoltaika 10kWp"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS investment_context TEXT DEFAULT NULL;
COMMENT ON COLUMN profiles.investment_context IS 'User investment context for ES-Engine AI matching. Saved from KNR Calculator settings page.';
