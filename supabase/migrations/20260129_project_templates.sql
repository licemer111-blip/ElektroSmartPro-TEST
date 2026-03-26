-- =====================================================
-- PROJECT TEMPLATES
-- =====================================================
-- Allows users to save project configurations as templates
-- and create new projects from templates
-- Date: 2026-01-29

-- Drop existing table if corrupted (safe - templates can be recreated)
DROP TABLE IF EXISTS public.project_templates CASCADE;

-- Create project_templates table
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template data (copied from project)
  region_id UUID REFERENCES public.regions(id),
  object_type_id UUID REFERENCES public.object_types(id),
  vat_rate INTEGER DEFAULT 23,
  pricing_mode TEXT DEFAULT 'standard',
  
  -- Template items stored as JSONB
  items JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_templates_user_id ON public.project_templates(user_id);
CREATE INDEX idx_project_templates_public ON public.project_templates(is_public) WHERE is_public = TRUE;

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own templates" ON public.project_templates;
CREATE POLICY "Users can view own templates"
ON public.project_templates FOR SELECT
USING (user_id = auth.uid() OR is_public = TRUE);

DROP POLICY IF EXISTS "Users can create templates" ON public.project_templates;
CREATE POLICY "Users can create templates"
ON public.project_templates FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own templates" ON public.project_templates;
CREATE POLICY "Users can update own templates"
ON public.project_templates FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own templates" ON public.project_templates;
CREATE POLICY "Users can delete own templates"
ON public.project_templates FOR DELETE
USING (user_id = auth.uid());

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.project_templates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'project_templates table created' as status;
