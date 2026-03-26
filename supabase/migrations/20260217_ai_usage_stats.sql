-- Per-function AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_name)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_user ON ai_usage_stats(user_id);

-- RLS
ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats
CREATE POLICY "Users can read own ai_usage_stats"
  ON ai_usage_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Service role handles inserts/updates via supabaseAdmin
