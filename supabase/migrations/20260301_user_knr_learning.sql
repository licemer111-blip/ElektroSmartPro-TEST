-- ═══════════════════════════════════════════════════════════════════
-- 20260301_user_knr_learning.sql
-- ES-Engine Auto-Learning: Personal dictionary entries per user.
-- NULL user_id = global seed entry.
-- Non-null user_id = user's private learned mapping (priority over global).
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add user_id column
ALTER TABLE es_dictionary
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Indexes for fast user lookups
CREATE INDEX IF NOT EXISTS idx_es_dictionary_user_id
  ON es_dictionary (user_id)
  WHERE user_id IS NOT NULL;

-- Partial unique: each user can have only one entry per normalized keyword
CREATE UNIQUE INDEX IF NOT EXISTS idx_es_dictionary_user_keyword_unique
  ON es_dictionary (keyword_normalized, user_id)
  WHERE user_id IS NOT NULL;

-- 3. Update RLS policies ─────────────────────────────────────────────

-- Authenticated users see global entries + their own personal entries
DROP POLICY IF EXISTS "es_dictionary_authenticated_read" ON es_dictionary;
CREATE POLICY "es_dictionary_authenticated_read"
  ON es_dictionary FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can manage (INSERT/UPDATE/DELETE) only their own entries
DROP POLICY IF EXISTS "es_dictionary_user_manage" ON es_dictionary;
CREATE POLICY "es_dictionary_user_manage"
  ON es_dictionary FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role retains full access (seed / maintenance)
DROP POLICY IF EXISTS "es_dictionary_service_all" ON es_dictionary;
CREATE POLICY "es_dictionary_service_all"
  ON es_dictionary FOR ALL
  TO service_role
  USING (true);

-- 4. Recreate fuzzy_match RPC — user entries ranked first ──────────────

DROP FUNCTION IF EXISTS es_dictionary_fuzzy_match(text, float, int);

CREATE FUNCTION es_dictionary_fuzzy_match(
  p_input     text,
  p_threshold float DEFAULT 0.45,
  p_limit     int   DEFAULT 5
)
RETURNS TABLE (
  id                uuid,
  knr_ref           text,
  label             text,
  type              text,
  is_composite      boolean,
  composite_refs    jsonb,
  labor_norm_rbh    numeric,
  unit              text,
  category          text,
  confidence_weight numeric,
  sim               float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, knr_ref, label, type, is_composite, composite_refs,
    labor_norm_rbh, unit, category, confidence_weight,
    similarity(keyword_normalized, p_input) AS sim
  FROM es_dictionary
  WHERE
    similarity(keyword_normalized, p_input) > p_threshold
    AND (user_id IS NULL OR user_id = auth.uid())
  ORDER BY
    (user_id IS NOT NULL) DESC,  -- user's own entries ranked first
    sim DESC
  LIMIT p_limit;
$$;

-- 5. Recreate token_match RPC — user entries ranked first ─────────────

DROP FUNCTION IF EXISTS es_dictionary_token_match(text, float, int);

CREATE FUNCTION es_dictionary_token_match(
  p_input     text,
  p_threshold float DEFAULT 0.40,
  p_limit     int   DEFAULT 5
)
RETURNS TABLE (
  id                uuid,
  knr_ref           text,
  label             text,
  type              text,
  is_composite      boolean,
  composite_refs    jsonb,
  labor_norm_rbh    numeric,
  unit              text,
  category          text,
  confidence_weight numeric,
  sim               float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, knr_ref, label, type, is_composite, composite_refs,
    labor_norm_rbh, unit, category, confidence_weight,
    word_similarity(keyword_normalized, p_input) AS sim
  FROM es_dictionary
  WHERE
    word_similarity(keyword_normalized, p_input) > p_threshold
    AND (user_id IS NULL OR user_id = auth.uid())
  ORDER BY
    (user_id IS NOT NULL) DESC,  -- user's own entries ranked first
    sim DESC
  LIMIT p_limit;
$$;
