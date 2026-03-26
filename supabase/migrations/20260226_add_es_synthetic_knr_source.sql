-- Add 'es_synthetic' to knr_source CHECK constraint
-- ES-Engine synthetic codes: KNR-ES, KNR 5-06+ES, KNR 5-09+ES etc.

ALTER TABLE project_items
  DROP CONSTRAINT IF EXISTS project_items_knr_source_check;

ALTER TABLE project_items
  ADD CONSTRAINT project_items_knr_source_check
  CHECK (knr_source IN ('user_knr', 'system_knr', 'ai_estimation', 'catalog', 'es_synthetic'));

COMMENT ON COLUMN project_items.knr_source IS
  'Source of KNR code: user_knr (L1 Expert), system_knr (L2 System), ai_estimation (L3 AI), catalog (from catalog_items), es_synthetic (ES-Engine synthetic code)';
