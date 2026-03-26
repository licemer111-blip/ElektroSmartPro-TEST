-- AI Usage Tracking System
-- Tracks AI feature usage per user for rate limiting and analytics

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- 'smart_assistant', 'categorization', 'price_check'
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- optional, for context
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  tokens_used INTEGER, -- for cost tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS ai_usage_user_month_idx ON ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_feature_idx ON ai_usage(feature);

-- RLS Policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own AI usage"
  ON ai_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend can insert (server actions)
CREATE POLICY "Service role can insert AI usage"
  ON ai_usage
  FOR INSERT
  WITH CHECK (true); -- Server actions use service role

-- Create function to get monthly usage count
CREATE OR REPLACE FUNCTION get_monthly_ai_usage(
  p_user_id UUID,
  p_feature TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO usage_count
  FROM ai_usage
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND (p_feature IS NULL OR feature = p_feature)
    AND success = true;
  
  RETURN usage_count;
END;
$$;

-- Create function to get user's AI usage stats
CREATE OR REPLACE FUNCTION get_ai_usage_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'current_month', json_build_object(
      'smart_assistant', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND feature = 'smart_assistant'
          AND created_at >= DATE_TRUNC('month', NOW())
          AND success = true
      ),
      'categorization', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND feature = 'categorization'
          AND created_at >= DATE_TRUNC('month', NOW())
          AND success = true
      ),
      'price_check', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND feature = 'price_check'
          AND created_at >= DATE_TRUNC('month', NOW())
          AND success = true
      ),
      'total', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND created_at >= DATE_TRUNC('month', NOW())
          AND success = true
      )
    ),
    'all_time', json_build_object(
      'smart_assistant', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND feature = 'smart_assistant'
          AND success = true
      ),
      'categorization', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND feature = 'categorization'
          AND success = true
      ),
      'price_check', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND feature = 'price_check'
          AND success = true
      ),
      'total', (
        SELECT COUNT(*) FROM ai_usage 
        WHERE user_id = p_user_id 
          AND success = true
      )
    ),
    'last_used', (
      SELECT MAX(created_at) FROM ai_usage 
      WHERE user_id = p_user_id AND success = true
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_monthly_ai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_usage_stats TO authenticated;

-- Comments
COMMENT ON TABLE ai_usage IS 'Tracks AI feature usage for rate limiting and analytics';
COMMENT ON COLUMN ai_usage.feature IS 'Type of AI feature: smart_assistant, categorization, price_check';
COMMENT ON COLUMN ai_usage.tokens_used IS 'OpenAI tokens consumed (for cost tracking)';
COMMENT ON FUNCTION get_monthly_ai_usage IS 'Returns count of AI requests for current month';
COMMENT ON FUNCTION get_ai_usage_stats IS 'Returns comprehensive AI usage statistics for a user';
