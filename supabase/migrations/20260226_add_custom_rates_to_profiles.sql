-- ES-Engine 2.1: Add custom rates toggle and personal RBH rate to profiles
-- Priority 1 (Personal): use_custom_rates + custom_labor_rate
-- Formula: FinalRate = (use_custom_rates ? custom_labor_rate : admin_base_rate) × region_modifier

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS use_custom_rates boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_labor_rate numeric(10,2);

COMMENT ON COLUMN profiles.use_custom_rates IS 'ES-Engine 2.1: switch to use personal RBH rate instead of admin base rate';
COMMENT ON COLUMN profiles.custom_labor_rate IS 'ES-Engine 2.1: personal labor rate (PLN/rbh) — overrides admin base rate when use_custom_rates=true';
