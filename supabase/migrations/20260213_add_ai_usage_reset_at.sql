-- Add monthly reset timestamp for AI usage counter
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_usage_reset_at timestamptz;
