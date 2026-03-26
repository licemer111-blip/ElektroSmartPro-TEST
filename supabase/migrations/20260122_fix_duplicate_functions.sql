-- ============================================================================
-- FIX DUPLICATE FUNCTIONS
-- ============================================================================
-- Удаление дублирующихся функций поиска
-- ============================================================================

-- 1. Удалить все старые версии search_catalog
-- ============================================================================

DROP FUNCTION IF EXISTS search_catalog(text, integer);
DROP FUNCTION IF EXISTS search_catalog(text, integer, text);
DROP FUNCTION IF EXISTS search_catalog(text, integer, text, uuid);

-- 2. Пересоздать правильную версию (из основной миграции)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_catalog(
  search_term TEXT,
  limit_val INTEGER DEFAULT 20,
  filter_type TEXT DEFAULT NULL,
  filter_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  unit TEXT,
  base_material_price NUMERIC,
  base_labor_price NUMERIC,
  type TEXT,
  category_id UUID,
  sub_category TEXT,
  market_comment TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  price_trend TEXT,
  confidence_level TEXT,
  score REAL
) AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- Convert search term to tsquery
  search_query := plainto_tsquery('simple', search_term);
  
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.description,
    ci.unit,
    ci.base_material_price,
    ci.base_labor_price,
    ci.type,
    ci.category_id,
    ci.sub_category,
    ci.market_comment,
    ci.price_min,
    ci.price_max,
    ci.price_trend,
    ci.confidence_level,
    ts_rank(ci.search_vector, search_query) AS score
  FROM catalog_items ci
  WHERE 
    ci.search_vector @@ search_query
    AND ci.is_active = true
    AND (filter_type IS NULL OR ci.type = filter_type)
    AND (filter_category_id IS NULL OR ci.category_id = filter_category_id)
  ORDER BY 
    score DESC,
    ci.name ASC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Удалить дубликаты других функций (если есть)
-- ============================================================================

DROP FUNCTION IF EXISTS fuzzy_search_catalog(text, integer);
DROP FUNCTION IF EXISTS fuzzy_search_catalog(text, integer, real);

-- Пересоздать fuzzy_search_catalog
CREATE OR REPLACE FUNCTION fuzzy_search_catalog(
  search_term TEXT,
  limit_val INTEGER DEFAULT 20,
  similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  unit TEXT,
  base_material_price NUMERIC,
  base_labor_price NUMERIC,
  type TEXT,
  category_id UUID,
  sub_category TEXT,
  market_comment TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.description,
    ci.unit,
    ci.base_material_price,
    ci.base_labor_price,
    ci.type,
    ci.category_id,
    ci.sub_category,
    ci.market_comment,
    similarity(ci.name, search_term) AS similarity_score
  FROM catalog_items ci
  WHERE 
    ci.is_active = true
    AND (
      similarity(ci.name, search_term) > similarity_threshold
      OR ci.name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    similarity_score DESC,
    ci.name ASC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Удалить дубликаты smart_search_catalog
-- ============================================================================

DROP FUNCTION IF EXISTS smart_search_catalog(text, integer);
DROP FUNCTION IF EXISTS smart_search_catalog(text, integer, text);
DROP FUNCTION IF EXISTS smart_search_catalog(text, integer, text, uuid);

-- Пересоздать smart_search_catalog
CREATE OR REPLACE FUNCTION smart_search_catalog(
  search_term TEXT,
  limit_val INTEGER DEFAULT 20,
  filter_type TEXT DEFAULT NULL,
  filter_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  unit TEXT,
  base_material_price NUMERIC,
  base_labor_price NUMERIC,
  type TEXT,
  category_id UUID,
  sub_category TEXT,
  market_comment TEXT,
  score REAL,
  match_type TEXT
) AS $$
BEGIN
  -- First try full-text search
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.description,
    ci.unit,
    ci.base_material_price,
    ci.base_labor_price,
    ci.type,
    ci.category_id,
    ci.sub_category,
    ci.market_comment,
    ts_rank(ci.search_vector, plainto_tsquery('simple', search_term)) AS score,
    'fulltext'::TEXT AS match_type
  FROM catalog_items ci
  WHERE 
    ci.search_vector @@ plainto_tsquery('simple', search_term)
    AND ci.is_active = true
    AND (filter_type IS NULL OR ci.type = filter_type)
    AND (filter_category_id IS NULL OR ci.category_id = filter_category_id)
  ORDER BY 
    score DESC,
    ci.name ASC
  LIMIT limit_val;
  
  -- If no results, fallback to fuzzy search
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      ci.id,
      ci.name,
      ci.description,
      ci.unit,
      ci.base_material_price,
      ci.base_labor_price,
      ci.type,
      ci.category_id,
      ci.sub_category,
      ci.market_comment,
      similarity(ci.name, search_term) AS score,
      'fuzzy'::TEXT AS match_type
    FROM catalog_items ci
    WHERE 
      ci.is_active = true
      AND (filter_type IS NULL OR ci.type = filter_type)
      AND (filter_category_id IS NULL OR ci.category_id = filter_category_id)
      AND (
        similarity(ci.name, search_term) > 0.2
        OR ci.name ILIKE '%' || search_term || '%'
      )
    ORDER BY 
      score DESC,
      ci.name ASC
    LIMIT limit_val;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ПРОВЕРКА:
-- ============================================================================

-- Проверь, что функции больше не дублируются:
-- SELECT proname, count(*) 
-- FROM pg_proc 
-- WHERE proname LIKE '%search_catalog%'
-- GROUP BY proname
-- HAVING count(*) > 1;

-- Тест функций:
-- SELECT * FROM search_catalog('test', 10);
-- SELECT * FROM smart_search_catalog('test', 10);
-- SELECT * FROM fuzzy_search_catalog('test', 10);
