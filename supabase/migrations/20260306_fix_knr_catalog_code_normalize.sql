-- Fix: normalize catalog_code in knr_norms
-- Problem: some records have catalog_code = "KNR 5-08 0201-01" instead of "KNR 5-08"
-- This happens when old uploaders stored the full KNR code in catalog_code field.

-- Step 1: preview what will be changed (run SELECT first to verify)
-- SELECT catalog_code, COUNT(*) FROM knr_norms
-- WHERE array_length(string_to_array(trim(catalog_code), ' '), 1) > 2
--   AND catalog_code ~ '^KNR\s+[0-9]+-[0-9]+\s+'
-- GROUP BY catalog_code ORDER BY catalog_code;

-- Step 2: normalize — keep only first 2 words ("KNR X-XX")
UPDATE knr_norms
SET
  catalog_code = split_part(catalog_code, ' ', 1) || ' ' || split_part(catalog_code, ' ', 2),
  updated_at   = now()
WHERE
  array_length(string_to_array(trim(catalog_code), ' '), 1) > 2
  AND catalog_code ~ '^KNR\s+[0-9]+-[0-9]+\s+';

-- Step 3: deduplicate — after normalization, some rows may now have identical
-- (catalog_code, table_number, column_number). Keep the latest updated_at row.
-- Run only if upsert constraint fails after step 2.
-- DELETE FROM knr_norms a
-- USING knr_norms b
-- WHERE a.id < b.id
--   AND a.catalog_code  = b.catalog_code
--   AND a.table_number  = b.table_number
--   AND a.column_number = b.column_number;
