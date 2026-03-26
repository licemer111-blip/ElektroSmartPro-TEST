-- Migration: Add Labor Time Support
-- Non-breaking additive change — all new columns are nullable or have defaults
-- Apply to BOTH: TEST (upwctgdpuckreoquofiu) and LIVE (jbxveulddoznswyeihda)

-- 1. project_items: labor norm (hours/unit) and total hours
ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS labor_norm float NULL,
  ADD COLUMN IF NOT EXISTS labor_hours_total float NULL;

-- 2. projects: default hourly rate (stawka r-g) + PDF toggle
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS default_hourly_rate decimal(10,2) NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS show_labor_hours_in_pdf boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN project_items.labor_norm IS 'KNR/AI norm: hours per unit (rbh/szt). Nullable — legacy items unaffected.';
COMMENT ON COLUMN project_items.labor_hours_total IS 'Calculated: quantity * labor_norm. Nullable — legacy items unaffected.';
COMMENT ON COLUMN projects.default_hourly_rate IS 'Hourly labor rate in PLN (stawka r-g). Used to calculate labor_price from labor_norm.';
COMMENT ON COLUMN projects.show_labor_hours_in_pdf IS 'If true, PDF includes Roboczogodziny column.';
