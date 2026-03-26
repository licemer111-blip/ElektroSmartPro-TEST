-- ============================================
-- TASK 1.4.4: Update Object Type Labels with VAT Rates
-- ============================================
-- This migration updates object type names to explicitly show VAT rates
-- for better UX consistency in the "Create Project" modal.
--
-- Changes:
-- - "Mieszkanie" → "Mieszkanie / Dom (VAT 8/23%)"
-- - "Dom Jednorodzinny" → removed (merged with Mieszkanie)
-- - "Biuro" → "Biuro / Lokale (VAT 23%)"
-- - "Lokal Usługowy" → removed (merged with Biuro)
-- - Added "Przemysł / Hala (VAT 23%)"
-- ============================================

-- Update existing object types with VAT rates in labels
UPDATE object_types
SET name = 'Mieszkanie / Dom (VAT 8/23%)'
WHERE slug = 'mieszkanie';

UPDATE object_types
SET name = 'Biuro / Lokale (VAT 23%)'
WHERE slug = 'biuro';

-- Remove duplicate types (Dom Jednorodzinny and Lokal Usługowy)
-- These are now covered by the merged categories above
DELETE FROM object_types
WHERE slug IN ('dom-jednorodzinny', 'lokal-uslugowy');

-- Add industrial/warehouse type if it doesn't exist
INSERT INTO object_types (name, slug, default_vat_rate)
VALUES ('Przemysł / Hala (VAT 23%)', 'przemysl-hala', 23)
ON CONFLICT (slug) DO UPDATE
SET name = 'Przemysł / Hala (VAT 23%)';

-- Verify the changes
SELECT id, name, slug, default_vat_rate 
FROM object_types 
ORDER BY name;
