-- Migration: Update pricing_mode ENUM from economy/standard/premium → ekspert/rynkowy/manual
-- Apply to: TEST (upwctgdpuckreoquofiu) AND LIVE (jbxveulddoznswyeihda)
--
-- IMPORTANT: Run STEP 1 first, then STEP 2 separately (ADD VALUE cannot be used
-- in the same transaction as UPDATE on that enum column in PostgreSQL).

-- ═══ STEP 1: Add new enum values (run this first, alone) ═══
ALTER TYPE pricing_mode_enum ADD VALUE IF NOT EXISTS 'ekspert';
ALTER TYPE pricing_mode_enum ADD VALUE IF NOT EXISTS 'rynkowy';
ALTER TYPE pricing_mode_enum ADD VALUE IF NOT EXISTS 'manual';

-- ═══ STEP 2: Migrate data + update default (run after STEP 1 commits) ═══
-- Disable only the versioning trigger (DISABLE TRIGGER ALL fails on system triggers)
ALTER TABLE projects DISABLE TRIGGER project_auto_version_trigger;

UPDATE projects SET pricing_mode = 'ekspert'
  WHERE pricing_mode::text IN ('standard', 'premium');
UPDATE projects SET pricing_mode = 'rynkowy'
  WHERE pricing_mode::text = 'economy';

ALTER TABLE projects ALTER COLUMN pricing_mode SET DEFAULT 'ekspert';

ALTER TABLE projects ENABLE TRIGGER project_auto_version_trigger;

-- NOTE: Old enum values (economy/standard/premium) remain in the type but are unused.
-- They cannot be dropped without recreating the entire enum type.
