-- ============================================================================
-- ОПТИМИЗАЦИЯ ИНДЕКСОВ ДЛЯ ПОИСКА
-- ============================================================================
-- Дополнительные индексы для ускорения поиска
-- ============================================================================

-- 1. Убедись, что основные индексы существуют
-- ============================================================================

-- GIN индекс для full-text search (если еще нет)
CREATE INDEX IF NOT EXISTS catalog_items_search_vector_idx 
  ON catalog_items USING gin(search_vector);

-- GIN индекс для fuzzy search (если еще нет)
CREATE INDEX IF NOT EXISTS catalog_items_name_trgm_idx 
  ON catalog_items USING gin(name gin_trgm_ops);

-- 2. Дополнительные индексы для фильтрации
-- ============================================================================

-- Составной индекс для частого запроса: is_active + type
CREATE INDEX IF NOT EXISTS catalog_items_active_type_idx 
  ON catalog_items(is_active, type) 
  WHERE is_active = true;

-- Индекс для категории (с условием is_active)
CREATE INDEX IF NOT EXISTS catalog_items_category_active_idx 
  ON catalog_items(category_id, is_active) 
  WHERE is_active = true;

-- Индекс для сортировки по имени
CREATE INDEX IF NOT EXISTS catalog_items_name_idx 
  ON catalog_items(name) 
  WHERE is_active = true;

-- 3. Составные индексы для частых запросов
-- ============================================================================

-- Для запросов с фильтром по type и category_id
CREATE INDEX IF NOT EXISTS catalog_items_type_category_idx 
  ON catalog_items(type, category_id, is_active) 
  WHERE is_active = true;

-- 4. Обновление статистики для лучшего планирования запросов
-- ============================================================================

-- Увеличиваем статистику для колонки name (для лучшего планирования)
ALTER TABLE catalog_items ALTER COLUMN name SET STATISTICS 1000;

-- Увеличиваем статистику для search_vector
ALTER TABLE catalog_items ALTER COLUMN search_vector SET STATISTICS 1000;

-- 5. ANALYZE (обновление статистики)
-- ============================================================================

-- Обновление статистики планировщика запросов
-- ВАЖНО: VACUUM нужно запускать отдельно (см. scripts/vacuum_catalog.sql)
ANALYZE catalog_items;

-- 6. Оптимизация RPC функций (если нужно)
-- ============================================================================

-- Оптимизированная версия search_catalog с LIMIT pushdown
CREATE OR REPLACE FUNCTION search_catalog_optimized(
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
BEGIN
  -- Прямой RETURN QUERY без DECLARE (быстрее)
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
    ts_rank(ci.search_vector, plainto_tsquery('simple', search_term)) AS score
  FROM catalog_items ci
  WHERE 
    ci.is_active = true
    AND ci.search_vector @@ plainto_tsquery('simple', search_term)
    AND (filter_type IS NULL OR ci.type = filter_type)
    AND (filter_category_id IS NULL OR ci.category_id = filter_category_id)
  ORDER BY 
    ts_rank(ci.search_vector, plainto_tsquery('simple', search_term)) DESC,
    ci.name ASC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ТЕСТИРОВАНИЕ:
-- ============================================================================

-- 1. Проверь индексы:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'catalog_items';

-- 2. Тест производительности:
-- EXPLAIN ANALYZE SELECT * FROM search_catalog('schneider', 20);

-- 3. Проверь использование индексов:
-- SELECT * FROM pg_stat_user_indexes WHERE tablename = 'catalog_items';

-- ============================================================================
-- ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:
-- ============================================================================
-- - Поиск должен выполняться за 5-50ms (зависит от размера БД)
-- - GIN индекс должен использоваться в EXPLAIN ANALYZE
-- - Если база большая (>100k записей), время может быть до 100ms
-- ============================================================================
