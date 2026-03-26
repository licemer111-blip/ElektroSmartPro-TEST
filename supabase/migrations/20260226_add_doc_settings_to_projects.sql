-- Migration: Add document output settings to projects
-- Purpose: "Pult zarządzania 5-w-1" — centralny panel sterowania dokumentami
-- Iron Rule: These flags control PDF/Portal OUTPUT only — internal editor always shows full data.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS show_knr                boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS brutto_mode             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expert_coloring         boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_labor_hours_in_pdf boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pdf_notes               text;

COMMENT ON COLUMN projects.show_knr IS
  'PDF/Portal: show KNR code prefix before item name (e.g. [KNR 5-08 0401-03])';
COMMENT ON COLUMN projects.brutto_mode IS
  'PDF/Portal: display prices as Brutto (with VAT) instead of Netto';
COMMENT ON COLUMN projects.expert_coloring IS
  'PDF: use expert color coding — green=labor, orange=materials/assemblies';
