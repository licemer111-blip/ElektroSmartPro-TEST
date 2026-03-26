-- ============================================================
-- admin_settings: Global benchmarks + AI directives
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service_role can read/write (admin actions use supabaseAdmin)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- No public access — accessed only via service_role (supabaseAdmin)
CREATE POLICY "admin_settings_no_public_access"
  ON public.admin_settings FOR ALL
  USING (false);

-- Seed defaults
INSERT INTO public.admin_settings (key, value) VALUES
  ('global_benchmarks', '{
    "market_rbh_rate": 75,
    "material_inflation_multiplier": 1.05
  }'::jsonb),
  ('expert_directives', '{
    "directives": ""
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.admin_settings IS 'Global admin configuration: benchmarks, AI directives. Read/write only via supabaseAdmin.';
COMMENT ON COLUMN public.admin_settings.key IS 'Unique setting key: global_benchmarks | expert_directives';
COMMENT ON COLUMN public.admin_settings.value IS 'JSONB payload for the setting';
