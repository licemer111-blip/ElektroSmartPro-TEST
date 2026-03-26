-- Migration: Add knr_code and knr_source to project_items
-- Purpose: Enable full KNR traceability — the "invisible thread" linking
--          user settings, ES-Engine, and final PDF estimate.
-- Iron Rule: knr_code belongs to Robocizna but is stored per-item.
--            Region modifier NEVER changes knr_code — only the final price.

ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS knr_code text,
  ADD COLUMN IF NOT EXISTS knr_source text
    CHECK (knr_source IN ('user_knr', 'system_knr', 'ai_estimation', 'catalog'));

COMMENT ON COLUMN project_items.knr_code IS
  'KNR position code (e.g. KNR 5-08 0401-03) — linked to Robocizna; does NOT change with region';
COMMENT ON COLUMN project_items.knr_source IS
  'Source of KNR code: user_knr (L1 Expert), system_knr (L2 System), ai_estimation (L3 AI★), catalog (from catalog_items)';
