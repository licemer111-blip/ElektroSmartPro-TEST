-- ============================================================================
-- USER SURVEYS - In-app rating & feedback collection
-- ============================================================================

-- Create user_surveys table
CREATE TABLE IF NOT EXISTS public.user_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  favorite_feature text,
  improvement_suggestion text,
  would_recommend boolean,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_surveys_user_id ON public.user_surveys (user_id);
CREATE INDEX IF NOT EXISTS idx_user_surveys_created_at ON public.user_surveys (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_surveys_rating ON public.user_surveys (overall_rating);

-- Enable RLS
ALTER TABLE public.user_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own surveys
CREATE POLICY "Users can insert own surveys"
  ON public.user_surveys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own surveys
CREATE POLICY "Users can read own surveys"
  ON public.user_surveys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add last_survey_at column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_survey_at timestamp with time zone;
