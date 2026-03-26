-- Sprint v1.2+ — Project-level KNR pricing overrides
-- Global defaults live in profiles.coeff_height/difficulty/surface.
-- This column allows per-project overrides (project > global).

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS pricing_overrides JSONB DEFAULT NULL;

COMMENT ON COLUMN projects.pricing_overrides IS
  'Project-level KNR multiplier overrides (Sprint v1.2+). NULL = use global profile settings.
   Schema: {"coeff_height": bool, "coeff_difficulty": bool, "coeff_surface": bool}
   Merge rule: project override (non-null) wins over profile defaults.';
