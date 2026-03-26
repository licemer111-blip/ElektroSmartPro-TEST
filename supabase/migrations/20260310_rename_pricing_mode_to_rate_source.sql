-- ─── Migration: rename pricing_mode → rate_source ────────────────────────────
-- Replaces the deprecated 3-value pricing_mode (ekspert/rynkowy/manual) with
-- the clean 2-value RateSource (engine/manual) aligned with frontend types.
--
-- Mapping: ekspert → engine | rynkowy → engine | manual → manual
-- Run: Apply in Supabase Dashboard → SQL Editor

-- Step 1: Add new column with CHECK constraint
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rate_source text NOT NULL DEFAULT 'engine'
  CHECK (rate_source IN ('engine', 'manual'));

-- Step 2: Migrate existing data
-- Disable triggers to prevent auto-versioning trigger from firing with NULL auth.uid()
ALTER TABLE projects DISABLE TRIGGER USER;

UPDATE projects SET rate_source = CASE
  WHEN pricing_mode = 'manual' THEN 'manual'
  ELSE 'engine'
END
WHERE pricing_mode IS NOT NULL;

ALTER TABLE projects ENABLE TRIGGER USER;

-- Step 3: Drop old column
ALTER TABLE projects DROP COLUMN IF EXISTS pricing_mode;

-- Step 4: Migrate project_templates table (if pricing_mode column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_templates' AND column_name = 'pricing_mode'
  ) THEN
    ALTER TABLE project_templates RENAME COLUMN pricing_mode TO rate_source;
    UPDATE project_templates
      SET rate_source = 'engine'
      WHERE rate_source IN ('ekspert', 'rynkowy');
  END IF;
END $$;
