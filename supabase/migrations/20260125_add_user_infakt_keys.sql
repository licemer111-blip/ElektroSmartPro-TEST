-- Add InFakt API key support for each user
-- Each user connects their own InFakt account

-- Add infakt_api_key column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS infakt_api_key TEXT;

COMMENT ON COLUMN profiles.infakt_api_key IS 'User InFakt API key for invoice generation (encrypted in production)';

-- Note: In production, this should be encrypted or stored in a secure vault
-- For now, we'll store it as TEXT, but consider using pgcrypto for encryption
