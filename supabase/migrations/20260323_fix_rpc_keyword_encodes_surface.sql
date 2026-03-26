-- Fix: es_dictionary_fuzzy_match and es_dictionary_token_match RPC functions
-- were missing keyword_encodes_surface in their SELECT clause.
-- This caused the field to default to FALSE in matching-engine.ts even when
-- the DB row has keyword_encodes_surface = TRUE (e.g. "bruzda w ytong").
-- Result: surface modifier ×2.50 was applied on top of already-Ytong-specific norms
-- → "Bruzdowanie w materiale miękkim (Ytong)" priced at 45 PLN/mb (2× concrete = wrong).
-- After fix: keyword_encodes_surface = TRUE is correctly propagated → surface mod = 1.0
-- → Ytong bruzdowanie ~18 PLN/mb < concrete ~24 PLN/mb (physically correct).

DROP FUNCTION IF EXISTS es_dictionary_fuzzy_match(text, float, int);
DROP FUNCTION IF EXISTS es_dictionary_token_match(text, float, int);

CREATE FUNCTION es_dictionary_fuzzy_match(
  p_input text,
  p_threshold float DEFAULT 0.45,
  p_limit int DEFAULT 3
)
RETURNS TABLE (
  id uuid, knr_ref text, label text, type text,
  is_composite boolean, composite_refs jsonb,
  labor_norm_rbh numeric, unit text, category text,
  confidence_weight numeric, keyword_encodes_surface boolean, sim float
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    id, knr_ref, label, type, is_composite, composite_refs,
    labor_norm_rbh, unit, category, confidence_weight,
    COALESCE(keyword_encodes_surface, false) AS keyword_encodes_surface,
    similarity(keyword_normalized, p_input) AS sim
  FROM es_dictionary
  WHERE
    similarity(keyword_normalized, p_input) > p_threshold
    AND (user_id IS NULL OR user_id = auth.uid())
  ORDER BY
    (user_id IS NOT NULL) DESC,
    sim DESC
  LIMIT p_limit;
$$;

CREATE FUNCTION es_dictionary_token_match(
  p_input text,
  p_threshold float DEFAULT 0.40,
  p_limit int DEFAULT 3
)
RETURNS TABLE (
  id uuid, knr_ref text, label text, type text,
  is_composite boolean, composite_refs jsonb,
  labor_norm_rbh numeric, unit text, category text,
  confidence_weight numeric, keyword_encodes_surface boolean, sim float
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    id, knr_ref, label, type, is_composite, composite_refs,
    labor_norm_rbh, unit, category, confidence_weight,
    COALESCE(keyword_encodes_surface, false) AS keyword_encodes_surface,
    word_similarity(keyword_normalized, p_input) AS sim
  FROM es_dictionary
  WHERE
    word_similarity(keyword_normalized, p_input) > p_threshold
    AND (user_id IS NULL OR user_id = auth.uid())
  ORDER BY
    (user_id IS NOT NULL) DESC,
    sim DESC
  LIMIT p_limit;
$$;
