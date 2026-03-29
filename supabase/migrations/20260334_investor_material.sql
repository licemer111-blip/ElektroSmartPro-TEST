-- ─────────────────────────────────────────────────────────────────────────────
-- Materiał Inwestora — Investor-supplied material concept
-- ─────────────────────────────────────────────────────────────────────────────
-- is_investor_material (project_items): per-row flag — material cost = 0,
--   charged as labor-only. Client supplies the fixture/fitting themselves.
-- default_investor_material (es_dictionary): Brain auto-flag for known
--   investor-supplied item types (e.g. oprawy, armatura).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Columns ────────────────────────────────────────────────────────────────
ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS is_investor_material BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE es_dictionary
  ADD COLUMN IF NOT EXISTS default_investor_material BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Re-create insert_project_items_bulk with is_investor_material ──────────
CREATE OR REPLACE FUNCTION insert_project_items_bulk(
  items_data  JSONB,
  p_project_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User does not own this project';
  END IF;

  IF EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND status = 'final'
  ) THEN
    RAISE EXCEPTION 'Project is locked. Cannot import items.';
  END IF;

  INSERT INTO project_items (
    project_id, name, unit, quantity,
    final_material_price, final_labor_price,
    catalog_item_id, section,
    knr_code, knr_source, labor_norm, labor_hours_total,
    sort_order, is_custom, is_investor_material,
    created_at, updated_at
  )
  SELECT
    p_project_id,
    t.name,
    t.unit,
    t.quantity,
    t.final_material_price,
    t.final_labor_price,
    t.catalog_item_id,
    t.section,
    t.knr_code,
    t.knr_source,
    t.labor_norm,
    t.labor_hours_total,
    t.sort_order,
    COALESCE(t.is_custom, true),
    COALESCE(t.is_investor_material, false),
    NOW(),
    NOW()
  FROM jsonb_to_recordset(items_data) AS t(
    name                 TEXT,
    unit                 TEXT,
    quantity             NUMERIC,
    final_material_price NUMERIC,
    final_labor_price    NUMERIC,
    catalog_item_id      UUID,
    section              TEXT,
    knr_code             TEXT,
    knr_source           TEXT,
    labor_norm           NUMERIC,
    labor_hours_total    NUMERIC,
    sort_order           INTEGER,
    is_custom            BOOLEAN,
    is_investor_material BOOLEAN
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION insert_project_items_bulk TO authenticated;

-- ── 3. Re-create match_dictionary_semantic with default_investor_material ─────
CREATE OR REPLACE FUNCTION match_dictionary_semantic(
  query_embedding  vector(1536),
  match_threshold  float   DEFAULT 0.70,
  match_count      int     DEFAULT 10
)
RETURNS TABLE (
  id                        uuid,
  keyword                   text,
  keyword_normalized        text,
  knr_ref                   text,
  label                     text,
  type                      es_dictionary_entry_type,
  is_composite              boolean,
  composite_refs            jsonb,
  labor_norm_rbh            numeric,
  unit                      text,
  category                  text,
  confidence_weight         numeric,
  user_id                   uuid,
  keyword_encodes_surface   boolean,
  default_investor_material boolean,
  similarity                float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id, d.keyword, d.keyword_normalized, d.knr_ref, d.label, d.type,
    d.is_composite, d.composite_refs, d.labor_norm_rbh, d.unit, d.category,
    d.confidence_weight, d.user_id, d.keyword_encodes_surface,
    d.default_investor_material,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM es_dictionary d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) >= match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 4. Re-create match_dictionary_semantic_filtered ───────────────────────────
CREATE OR REPLACE FUNCTION match_dictionary_semantic_filtered(
  query_embedding  vector(1536),
  match_threshold  float                    DEFAULT 0.70,
  match_count      int                      DEFAULT 10,
  filter_type      es_dictionary_entry_type DEFAULT NULL,
  filter_category  text                     DEFAULT NULL
)
RETURNS TABLE (
  id                        uuid,
  keyword                   text,
  keyword_normalized        text,
  knr_ref                   text,
  label                     text,
  type                      es_dictionary_entry_type,
  is_composite              boolean,
  composite_refs            jsonb,
  labor_norm_rbh            numeric,
  unit                      text,
  category                  text,
  confidence_weight         numeric,
  user_id                   uuid,
  keyword_encodes_surface   boolean,
  default_investor_material boolean,
  similarity                float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id, d.keyword, d.keyword_normalized, d.knr_ref, d.label, d.type,
    d.is_composite, d.composite_refs, d.labor_norm_rbh, d.unit, d.category,
    d.confidence_weight, d.user_id, d.keyword_encodes_surface,
    d.default_investor_material,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM es_dictionary d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) >= match_threshold
    AND (filter_type IS NULL OR d.type = filter_type)
    AND (filter_category IS NULL OR d.category = filter_category)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_dictionary_semantic(vector, float, int)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_dictionary_semantic_filtered(vector, float, int, es_dictionary_entry_type, text)
  TO authenticated, service_role;
