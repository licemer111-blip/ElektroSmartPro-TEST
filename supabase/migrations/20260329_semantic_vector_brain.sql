-- ============================================================
-- ES-Engine: Semantic Vector Brain — Phase 1 (Data Layer)
-- Adds pgvector embeddings to es_dictionary for semantic search.
-- Model: text-embedding-3-small (OpenAI) — 1536 dimensions.
-- ============================================================

-- ── 1. Enable pgvector extension ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. Add embedding column ───────────────────────────────────────────────────
-- NULL until generate-embeddings.ts runs. Never set NOT NULL — new rows
-- inserted by seed scripts start as NULL and are back-filled asynchronously.
ALTER TABLE es_dictionary
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ── 3. HNSW index for fast cosine-distance search ────────────────────────────
-- HNSW is preferred over IVFFlat at this scale (~10k rows):
--   • No training phase (IVFFlat requires lists = sqrt(n) and VACUUM)
--   • Better recall at low-k queries  (typical k=5..20)
--   • m=16  → 16 connections per layer (default, good recall/speed tradeoff)
--   • ef_construction=64 → build-time search depth (default, fine for 10k)
-- Index only covers rows where embedding IS NOT NULL to avoid wasted blocks.
CREATE INDEX IF NOT EXISTS es_dictionary_embedding_hnsw_idx
  ON es_dictionary USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── 4. RPC: match_dictionary_semantic ────────────────────────────────────────
-- Semantic nearest-neighbour search via cosine similarity.
-- Called by the future semantic matching layer in lib/es-engine.ts.
--
-- Parameters:
--   query_embedding  vector(1536)  — embedding of the user's query text
--   match_threshold  float         — minimum cosine similarity [0..1], default 0.70
--   match_count      int           — max rows to return, default 10
--
-- Returns all standard es_dictionary columns + similarity score (0..1).
-- Only rows where embedding IS NOT NULL are considered.
CREATE OR REPLACE FUNCTION match_dictionary_semantic(
  query_embedding  vector(1536),
  match_threshold  float   DEFAULT 0.70,
  match_count      int     DEFAULT 10
)
RETURNS TABLE (
  id                 uuid,
  keyword            text,
  keyword_normalized text,
  knr_ref            text,
  label              text,
  type               es_dictionary_entry_type,
  is_composite       boolean,
  composite_refs     jsonb,
  labor_norm_rbh     numeric,
  unit               text,
  category           text,
  confidence_weight  numeric,
  similarity         float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    keyword,
    keyword_normalized,
    knr_ref,
    label,
    type,
    is_composite,
    composite_refs,
    labor_norm_rbh,
    unit,
    category,
    confidence_weight,
    -- cosine distance (<=>): 0 = identical, 2 = opposite
    -- convert to cosine similarity: 1 − distance ∈ [−1..1]
    (1 - (embedding <=> query_embedding))::float AS similarity
  FROM es_dictionary
  WHERE
    embedding IS NOT NULL
    AND (1 - (embedding <=> query_embedding)) >= match_threshold
  ORDER BY embedding <=> query_embedding   -- ascending distance = descending similarity
  LIMIT match_count;
$$;

-- ── 5. RPC: match_dictionary_semantic_filtered ───────────────────────────────
-- Variant of the above that restricts results to a specific entry type
-- (e.g. 'robocizna' or 'material') and/or category.
-- Useful for precision queries in the hybrid matching pipeline.
CREATE OR REPLACE FUNCTION match_dictionary_semantic_filtered(
  query_embedding  vector(1536),
  match_threshold  float                    DEFAULT 0.70,
  match_count      int                      DEFAULT 10,
  filter_type      es_dictionary_entry_type DEFAULT NULL,
  filter_category  text                     DEFAULT NULL
)
RETURNS TABLE (
  id                 uuid,
  keyword            text,
  keyword_normalized text,
  knr_ref            text,
  label              text,
  type               es_dictionary_entry_type,
  is_composite       boolean,
  composite_refs     jsonb,
  labor_norm_rbh     numeric,
  unit               text,
  category           text,
  confidence_weight  numeric,
  similarity         float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    keyword,
    keyword_normalized,
    knr_ref,
    label,
    type,
    is_composite,
    composite_refs,
    labor_norm_rbh,
    unit,
    category,
    confidence_weight,
    (1 - (embedding <=> query_embedding))::float AS similarity
  FROM es_dictionary
  WHERE
    embedding IS NOT NULL
    AND (1 - (embedding <=> query_embedding)) >= match_threshold
    AND (filter_type IS NULL     OR type     = filter_type)
    AND (filter_category IS NULL OR category = filter_category)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 6. SECURITY: grant RPC access to authenticated + service roles ────────────
GRANT EXECUTE ON FUNCTION match_dictionary_semantic(vector, float, int)
  TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION match_dictionary_semantic_filtered(vector, float, int, es_dictionary_entry_type, text)
  TO authenticated, service_role;

-- ── 7. Helper: count embedding coverage for monitoring ───────────────────────
CREATE OR REPLACE FUNCTION es_dictionary_embedding_stats()
RETURNS TABLE (
  total_rows      bigint,
  embedded_rows   bigint,
  missing_rows    bigint,
  coverage_pct    numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)                                                AS total_rows,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL)          AS embedded_rows,
    COUNT(*) FILTER (WHERE embedding IS NULL)              AS missing_rows,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0),
      1
    )                                                      AS coverage_pct
  FROM es_dictionary;
$$;

GRANT EXECUTE ON FUNCTION es_dictionary_embedding_stats()
  TO authenticated, service_role;

-- ── 8. Comment ────────────────────────────────────────────────────────────────
COMMENT ON COLUMN es_dictionary.embedding IS
  'OpenAI text-embedding-3-small (1536-dim) of: keyword_normalized + label + category. '
  'Generated by scripts/generate-embeddings.ts. NULL = not yet embedded.';

COMMENT ON FUNCTION match_dictionary_semantic IS
  'Semantic nearest-neighbour search in es_dictionary via cosine similarity. '
  'Powers ES-Engine L1.5 (Semantic) matching layer. '
  'Complement to existing es_dictionary_fuzzy_match (pg_trgm L2).';
