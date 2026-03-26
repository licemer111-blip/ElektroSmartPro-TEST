-- Migration: create analytics_events table for Blur funnel tracking
-- Apply to BOTH test (upwctgdpuckreoquofiu) and live (jbxveulddoznswyeihda)

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    text NOT NULL, -- 'blur_view' | 'upgrade_click' | 'pdf_blocked' | 'assembly_used'
  voivodeship   text,          -- region name from project (for geography stats)
  project_id    uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  assembly_id   uuid,          -- for 'assembly_used' events
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast admin queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type        ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user        ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created     ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_voivodeship ON public.analytics_events(voivodeship);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read all events"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
