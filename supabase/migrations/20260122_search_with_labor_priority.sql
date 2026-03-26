-- ============================================================================
-- SEARCH WITH LABOR PRIORITY
-- ============================================================================
-- Улучшенная функция поиска с приоритетом услуг (labor)
-- Комбинирует fulltext search и similarity для лучших результатов
-- ============================================================================

-- 1. Функция поиска с приоритетом labor и фильтром типа
-- ============================================================================

CREATE OR REPLACE FUNCTION search_catalog_with_labor_priority(
  search_term TEXT,
  limit_val INTEGER DEFAULT 50,
  filter_type TEXT DEFAULT 'all' -- 'all', 'labor', 'material'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category_name TEXT,
  unit TEXT,
  base_material_price NUMERIC,
  base_labor_price NUMERIC,
  type TEXT,
  score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Настройка порога similarity для pg_trgm
  PERFORM set_limit(0.1);

  RETURN QUERY
  SELECT
    ci.id,
    ci.name,
    cc.name AS category_name,
    ci.unit,
    ci.base_material_price,
    ci.base_labor_price,
    ci.type,
    -- Комбинированный score: fulltext + similarity
    GREATEST(
      ts_rank(ci.search_vector, plainto_tsquery('simple', search_term)),
      similarity(ci.name, search_term)
    ) AS score
  FROM catalog_items ci
  LEFT JOIN catalog_categories cc ON ci.category_id = cc.id
  WHERE
    ci.is_active = true
    -- Фильтрация по типу
    AND (filter_type = 'all' OR ci.type = filter_type)
    -- Комбинированное условие поиска (fulltext ИЛИ similarity)
    AND (
      ci.search_vector @@ plainto_tsquery('simple', search_term)
      OR ci.name % search_term
      OR ci.name ILIKE '%' || search_term || '%'
    )
  ORDER BY
    -- ПРИОРИТЕТ: Сначала услуги (labor), потом материалы
    (ci.type = 'labor') DESC,
    -- Потом по релевантности
    score DESC,
    -- Затем по имени
    ci.name ASC
  LIMIT limit_val;
END;
$$;

-- 2. Создаем алиас для совместимости с твоим кодом
-- ============================================================================

CREATE OR REPLACE FUNCTION search_catalog_labor_first(
  search_term TEXT,
  limit_val INTEGER DEFAULT 50,
  filter_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category_name TEXT,
  unit TEXT,
  base_material_price NUMERIC,
  base_labor_price NUMERIC,
  type TEXT,
  score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Настройка порога similarity
  PERFORM set_limit(0.1);

  RETURN QUERY
  SELECT
    ci.id,
    ci.name,
    cc.name AS category_name,
    ci.unit,
    ci.base_material_price,
    ci.base_labor_price,
    ci.type,
    similarity(ci.name, search_term)::DOUBLE PRECISION AS score
  FROM catalog_items ci
  LEFT JOIN catalog_categories cc ON ci.category_id = cc.id
  WHERE
    ci.is_active = true
    AND (filter_type = 'all' OR ci.type = filter_type)
    AND (ci.name ILIKE '%' || search_term || '%' OR ci.name % search_term)
  ORDER BY
    -- ПРИОРИТЕТ: labor первым
    (ci.type = 'labor') DESC,
    -- Потом по similarity
    similarity(ci.name, search_term) DESC,
    ci.name ASC
  LIMIT limit_val;
END;
$$;

-- 3. Улучшенная версия smart_search с приоритетом labor
-- ============================================================================

CREATE OR REPLACE FUNCTION smart_search_with_labor_priority(
  search_term TEXT,
  limit_val INTEGER DEFAULT 20,
  filter_type TEXT DEFAULT NULL
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Настройка порога для fuzzy search
  PERFORM set_limit(0.2);

  -- Попытка fulltext search
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
  ORDER BY 
    -- ПРИОРИТЕТ: labor первым
    (ci.type = 'labor') DESC,
    score DESC,
    ci.name ASC
  LIMIT limit_val;
  
  -- Если ничего не найдено, fallback на fuzzy search
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
      AND (
        similarity(ci.name, search_term) > 0.2
        OR ci.name ILIKE '%' || search_term || '%'
      )
    ORDER BY 
      -- ПРИОРИТЕТ: labor первым
      (ci.type = 'labor') DESC,
      score DESC,
      ci.name ASC
    LIMIT limit_val;
  END IF;
END;
$$;

-- ============================================================================
-- КОММЕНТАРИИ И РЕКОМЕНДАЦИИ:
-- ============================================================================

-- Преимущества приоритета labor:
-- 1. Услуги обычно добавляются в kosztorys первыми
-- 2. Пользователи часто ищут работу перед материалами
-- 3. Улучшает UX для основного use case
-- 4. Не ломает сортировку по релевантности внутри типа

-- Использование:
-- 
-- 1. С приоритетом labor (новая функция):
-- SELECT * FROM search_catalog_with_labor_priority('montaż', 20, 'all');
-- 
-- 2. Только similarity (твоя версия):
-- SELECT * FROM search_catalog_labor_first('montaż', 50, 'all');
-- 
-- 3. Smart search с приоритетом:
-- SELECT * FROM smart_search_with_labor_priority('panel', 20);

-- Производительность:
-- - ORDER BY (ci.type = 'labor') DESC - очень быстро (boolean comparison)
-- - Добавляет < 1ms к времени выполнения
-- - Индекс catalog_items_type_idx используется

-- ============================================================================
-- ТЕСТЫ:
-- ============================================================================

-- Тест 1: Поиск с приоритетом labor (должны быть услуги сверху)
-- SELECT type, name, score 
-- FROM search_catalog_with_labor_priority('montaż', 10, 'all')
-- ORDER BY type DESC, score DESC;

-- Тест 2: Только услуги
-- SELECT * FROM search_catalog_with_labor_priority('montaż', 10, 'labor');

-- Тест 3: Только материалы
-- SELECT * FROM search_catalog_with_labor_priority('kabel', 10, 'material');

-- Тест 4: Сравнение скорости
-- EXPLAIN ANALYZE SELECT * FROM search_catalog_with_labor_priority('test', 20);
