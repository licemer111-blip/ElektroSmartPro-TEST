-- Add per-row assembly overrides (e.g. changed cable length or device price)
ALTER TABLE project_items ADD COLUMN IF NOT EXISTS assembly_overrides JSONB DEFAULT NULL;

COMMENT ON COLUMN project_items.assembly_overrides IS
  'Per-item overrides for smart assembly templates. JSON map: { [itemLabel]: { qtyMultiplier?, materialPricePerUnit?, rbhPerUnit? } }';
