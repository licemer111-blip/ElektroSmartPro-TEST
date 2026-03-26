-- =====================================================
-- TIME TRACKING SYSTEM
-- =====================================================
-- Track work hours on projects
-- Date: 2026-01-29

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Time data
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated or manual
  
  -- Description
  description TEXT,
  
  -- Status
  is_running BOOLEAN DEFAULT FALSE, -- Timer is active
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_started ON public.time_entries(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_running ON public.time_entries(user_id, is_running) WHERE is_running = TRUE;

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can view own time entries
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
CREATE POLICY "Users can view own time entries"
ON public.time_entries FOR SELECT
USING (user_id = auth.uid());

-- Team managers can view team time entries
DROP POLICY IF EXISTS "Managers can view team time entries" ON public.time_entries;
CREATE POLICY "Managers can view team time entries"
ON public.time_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.team_id IS NOT NULL
    AND public.is_team_manager(p.team_id, auth.uid())
  )
);

-- Users can create own time entries
DROP POLICY IF EXISTS "Users can create time entries" ON public.time_entries;
CREATE POLICY "Users can create time entries"
ON public.time_entries FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update own time entries
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
CREATE POLICY "Users can update own time entries"
ON public.time_entries FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete own time entries
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.time_entries;
CREATE POLICY "Users can delete own time entries"
ON public.time_entries FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate duration when entry is stopped
CREATE OR REPLACE FUNCTION public.calculate_time_entry_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_time_entry_duration ON public.time_entries;
CREATE TRIGGER calculate_time_entry_duration
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.calculate_time_entry_duration();

-- Get total time for project
CREATE OR REPLACE FUNCTION public.get_project_total_time(p_project_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN duration_minutes IS NOT NULL THEN duration_minutes
      WHEN ended_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
      ELSE 0
    END
  )::INTEGER, 0)
  FROM time_entries
  WHERE project_id = p_project_id;
$$;

-- Get total time for user in period
CREATE OR REPLACE FUNCTION public.get_user_total_time(
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN duration_minutes IS NOT NULL THEN duration_minutes
      WHEN ended_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
      ELSE 0
    END
  )::INTEGER, 0)
  FROM time_entries
  WHERE user_id = p_user_id
  AND started_at >= p_start_date
  AND started_at < p_end_date + INTERVAL '1 day';
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Time tracking system created' as status;
