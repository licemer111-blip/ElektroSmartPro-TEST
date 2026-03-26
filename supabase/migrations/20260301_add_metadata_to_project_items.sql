-- ═══════════════════════════════════════════════════════════════════
-- 20260301_add_metadata_to_project_items.sql
-- Step 1: Add metadata JSONB column to project_items
-- Step 2: Migrate _r: / _qf: prefixes from notes → metadata
-- Step 3: Strip system prefixes from notes field
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add metadata column if it doesn't exist
ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_project_items_metadata
  ON project_items USING GIN (metadata);

-- 2. Data migration: parse notes field and populate metadata
--    _r:<recipe_key>         → metadata.recipe_key
--    _qf:<factor>:<comp_id>  → metadata.qty_factor + metadata.component_id
UPDATE project_items
SET metadata = CASE
  -- Parent assembly: notes starts with _r:
  WHEN notes LIKE '_r:%' THEN
    jsonb_build_object(
      'recipe_key',
      split_part(
        -- Take the _r: token (could be anywhere in notes separated by |)
        regexp_replace(notes, '.*(_r:[^|]+).*', '\1'),
        '_r:', 2
      )
    )
  -- Child component: notes starts with _qf:
  WHEN notes LIKE '_qf:%' THEN
    jsonb_build_object(
      'qty_factor',
      (split_part(regexp_replace(notes, '.*(_qf:[^|]+).*', '\1'), ':', 2))::numeric,
      'component_id',
      split_part(regexp_replace(notes, '.*(_qf:[^|]+).*', '\1'), ':', 3)
    )
  ELSE metadata
END
WHERE notes IS NOT NULL
  AND (notes LIKE '_r:%' OR notes LIKE '_qf:%');

-- 3. Strip system prefixes from notes (clean up)
--    Keep any human-readable text after | separator (if present)
UPDATE project_items
SET notes = CASE
  -- notes = "_r:key" or "_qf:f:id" with nothing after → set to NULL
  WHEN notes ~ '^(_r:|_qf:)[^\|]+$' THEN NULL
  -- notes = "_r:key|human text" → keep only the human text part
  WHEN notes ~ '^(_r:|_qf:)[^\|]+\|(.+)$' THEN
    regexp_replace(notes, '^(_r:|_qf:)[^\|]+\|', '')
  ELSE notes
END
WHERE notes IS NOT NULL
  AND (notes LIKE '_r:%' OR notes LIKE '_qf:%');

-- 4. Verify migration (run as sanity check)
-- SELECT
--   COUNT(*) FILTER (WHERE metadata->>'recipe_key' IS NOT NULL) AS parents_migrated,
--   COUNT(*) FILTER (WHERE metadata->>'qty_factor' IS NOT NULL) AS children_migrated,
--   COUNT(*) FILTER (WHERE notes LIKE '_r:%' OR notes LIKE '_qf:%') AS still_has_prefix
-- FROM project_items;
