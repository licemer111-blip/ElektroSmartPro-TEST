-- ═══════════════════════════════════════════════════════════════════════════
-- canonical_l0_overrides — runtime overrides for L0 Canonical KNR Reference
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: allow admins to tune canonical KNR norms (labor_norm, material_price,
-- knr_code) without recompiling/deploying. Hardcoded reference in
-- lib/services/canonical-knr-l0.ts remains the source of truth for regex
-- patterns; this table layers admin-edited values on top at runtime.
--
-- Override key: entry_description (string match against
-- CanonicalL0Entry.description — unique per array entry).
-- Disabling: set `disabled = true` to skip an entry entirely (falls through
-- to next pattern or downstream L1/L2/L3 layers).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.canonical_l0_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Natural key: matches CanonicalL0Entry.description exactly (case-sensitive)
  entry_description text UNIQUE NOT NULL,
  -- Override fields (NULL = keep hardcoded value)
  labor_norm_override     numeric(8,4) CHECK (labor_norm_override IS NULL OR labor_norm_override >= 0),
  material_price_override numeric(10,2) CHECK (material_price_override IS NULL OR material_price_override >= 0),
  knr_code_override       text,
  -- Soft-disable: skip this entry during pattern matching
  disabled        boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_canonical_l0_overrides_disabled
  ON public.canonical_l0_overrides (disabled) WHERE disabled = false;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.canonical_l0_overrides_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_canonical_l0_overrides_updated_at ON public.canonical_l0_overrides;
CREATE TRIGGER trg_canonical_l0_overrides_updated_at
  BEFORE UPDATE ON public.canonical_l0_overrides
  FOR EACH ROW EXECUTE FUNCTION public.canonical_l0_overrides_set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Read: any authenticated user (so server-side findCanonicalL0Async works
--       inside user contexts — no admin-client gymnastics).
-- Write: admins only (profiles.role = 'admin').
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.canonical_l0_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "canonical_l0_overrides_select_authenticated"
  ON public.canonical_l0_overrides;
CREATE POLICY "canonical_l0_overrides_select_authenticated"
  ON public.canonical_l0_overrides
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "canonical_l0_overrides_admin_write"
  ON public.canonical_l0_overrides;
CREATE POLICY "canonical_l0_overrides_admin_write"
  ON public.canonical_l0_overrides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

COMMENT ON TABLE public.canonical_l0_overrides IS
  'v2.7.2 — admin-editable overrides for L0 Canonical KNR Reference. '
  'Layered on top of hardcoded array in lib/services/canonical-knr-l0.ts at runtime.';
COMMENT ON COLUMN public.canonical_l0_overrides.entry_description IS
  'Natural key — must match CanonicalL0Entry.description exactly.';
COMMENT ON COLUMN public.canonical_l0_overrides.disabled IS
  'When true, the matching hardcoded entry is skipped during pattern matching.';
