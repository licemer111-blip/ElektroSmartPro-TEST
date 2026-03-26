-- ============================================================
-- ES-Engine: Semantic Mapping & Normalization System
-- Table: es_dictionary  (KNR keyword → code mapping)
-- Extensions: pg_trgm (fuzzy search) + unaccent (Polish diacritics)
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Enum type for entry classification
DO $$ BEGIN
  CREATE TYPE es_dictionary_entry_type AS ENUM ('material', 'robocizna', 'zestaw');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Main dictionary table
CREATE TABLE IF NOT EXISTS es_dictionary (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source keyword (raw, as installer writes it)
  keyword            text        NOT NULL,

  -- Pre-normalized keyword: lowercase + unaccent + stripped units
  -- Filled by trigger automatically on INSERT / UPDATE
  keyword_normalized text        NOT NULL DEFAULT '',

  -- Target KNR code (e.g. "KNR 5-04 0301-01")
  knr_ref            text        NOT NULL,

  -- Human-readable label for the KNR position
  label              text,

  -- How should the engine treat this entry
  type               es_dictionary_entry_type NOT NULL DEFAULT 'robocizna',

  -- If true → entry represents a smart assembly (Zestaw)
  -- composite_refs contains the breakdown into individual KNR codes
  is_composite       boolean     NOT NULL DEFAULT false,
  composite_refs     jsonb,

  -- Labor norm (rbh per unit) — used in ES-Engine calculations
  labor_norm_rbh     numeric(10, 4),

  -- Default unit (szt / mb / kpl / 100mb)
  unit               text        NOT NULL DEFAULT 'szt',

  -- Grouping category for UI and reporting
  category           text,

  -- Multiplier for confidence score (0.5 = weaker hint, 1.5 = very reliable)
  confidence_weight  numeric(3, 2) NOT NULL DEFAULT 1.0,

  -- Timestamps
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes
-- Unique normalized keyword (prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS es_dictionary_keyword_normalized_idx
  ON es_dictionary (keyword_normalized);

-- GIN trigram index for similarity() searches (Phase 2)
CREATE INDEX IF NOT EXISTS es_dictionary_trgm_idx
  ON es_dictionary USING GIN (keyword_normalized gin_trgm_ops);

-- B-tree indexes for filter queries
CREATE INDEX IF NOT EXISTS es_dictionary_type_idx      ON es_dictionary (type);
CREATE INDEX IF NOT EXISTS es_dictionary_knr_ref_idx   ON es_dictionary (knr_ref);
CREATE INDEX IF NOT EXISTS es_dictionary_category_idx  ON es_dictionary (category);

-- 5. Auto-normalize trigger: fills keyword_normalized on INSERT / UPDATE
CREATE OR REPLACE FUNCTION es_dictionary_normalize()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.keyword_normalized :=
    -- strip leading/trailing whitespace and collapse multiple spaces
    regexp_replace(
      -- lowercase
      lower(
        -- remove Polish + other diacritics via unaccent
        unaccent(NEW.keyword)
      ),
      '\s+', ' ', 'g'
    );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_es_dictionary_normalize ON es_dictionary;
CREATE TRIGGER trg_es_dictionary_normalize
  BEFORE INSERT OR UPDATE OF keyword
  ON es_dictionary
  FOR EACH ROW EXECUTE FUNCTION es_dictionary_normalize();

-- 6. RPC function: Fuzzy match via pg_trgm similarity
-- Returns top-N matches above similarity threshold, ordered by score DESC
CREATE OR REPLACE FUNCTION es_dictionary_fuzzy_match(
  p_input      text,
  p_threshold  float DEFAULT 0.45,
  p_limit      int   DEFAULT 5
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
  sim                float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, keyword, keyword_normalized, knr_ref, label, type,
    is_composite, composite_refs, labor_norm_rbh, unit, category,
    confidence_weight,
    similarity(keyword_normalized, p_input) AS sim
  FROM es_dictionary
  WHERE similarity(keyword_normalized, p_input) > p_threshold
  ORDER BY sim DESC
  LIMIT p_limit;
$$;

-- 7. RPC function: Word-set containment match (handles multi-word queries)
-- Useful when pg_trgm similarity is too strict for short keywords in long strings
CREATE OR REPLACE FUNCTION es_dictionary_token_match(
  p_input      text,
  p_threshold  float DEFAULT 0.40,
  p_limit      int   DEFAULT 3
)
RETURNS TABLE (
  id                 uuid,
  knr_ref            text,
  label              text,
  type               es_dictionary_entry_type,
  is_composite       boolean,
  composite_refs     jsonb,
  labor_norm_rbh     numeric,
  unit               text,
  category           text,
  confidence_weight  numeric,
  sim                float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, knr_ref, label, type, is_composite, composite_refs,
    labor_norm_rbh, unit, category, confidence_weight,
    word_similarity(keyword_normalized, p_input) AS sim
  FROM es_dictionary
  WHERE word_similarity(keyword_normalized, p_input) > p_threshold
  ORDER BY sim DESC
  LIMIT p_limit;
$$;

-- 8. Row Level Security
ALTER TABLE es_dictionary ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (needed for matching in server actions)
DROP POLICY IF EXISTS "es_dictionary_authenticated_read" ON es_dictionary;
CREATE POLICY "es_dictionary_authenticated_read"
  ON es_dictionary FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access (admin seed / maintenance)
DROP POLICY IF EXISTS "es_dictionary_service_all" ON es_dictionary;
CREATE POLICY "es_dictionary_service_all"
  ON es_dictionary FOR ALL
  TO service_role
  USING (true);

-- Comment
COMMENT ON TABLE es_dictionary IS
  'ES-Engine semantic dictionary: maps Polish installer slang → KNR codes. '
  'Powers 4-phase matching: Exact → Fuzzy(pg_trgm) → Regex → LLM fallback.';
