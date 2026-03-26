-- ============================================================================
-- ДЕТАЛЬНАЯ ДИАГНОСТИКА ПРОИЗВОДИТЕЛЬНОСТИ ПОИСКА
-- ============================================================================
-- Тест производительности ВНУТРИ функций (не самих функций)
-- ============================================================================

-- 1. Тест базового full-text search (как внутри smart_search_catalog_with_category)
-- ============================================================================
EXPLAIN ANALYZE
SELECT 
  ci.id,
  ci.name,
  ci.description,
  ci.unit,
  ci.base_material_price,
  ci.base_labor_price,
  ci.type,
  ci.category_id,
  cc.name AS category_name,
  ci.sub_category,
  ci.market_comment,
  ts_rank(ci.search_vector, plainto_tsquery('simple', 'schneider')) AS score,
  'fulltext'::TEXT AS match_type
FROM catalog_items ci
LEFT JOIN catalog_categories cc ON ci.category_id = cc.id
WHERE 
  ci.search_vector @@ plainto_tsquery('simple', 'schneider')
  AND ci.is_active = true
ORDER BY 
  score DESC,
  ci.name ASC
LIMIT 20;

-- ============================================================================
-- АНАЛИЗ РЕЗУЛЬТАТОВ:
-- ============================================================================
-- 
-- ЧТО ИСКАТЬ В EXPLAIN ANALYZE:
-- 
-- ✅ ХОРОШО (быстро):
-- - "Bitmap Index Scan on catalog_items_search_vector_idx"
-- - "Index Scan using catalog_items_search_vector_idx"
-- - Execution Time < 50ms
-- 
-- ❌ ПЛОХО (медленно):
-- - "Seq Scan on catalog_items" (полное сканирование таблицы)
-- - Execution Time > 100ms
-- - "Rows Removed by Filter" > 1000
-- 
-- ============================================================================

-- 2. Проверка использования индексов (статистика)
-- ============================================================================
SELECT 
  schemaname,
  relname AS tablename,
  indexrelname AS index_name,
  idx_scan AS scans_count,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes 
WHERE relname = 'catalog_items'
  AND indexrelname LIKE '%search%'
ORDER BY idx_scan DESC;

-- 3. Тест с разными запросами
-- ============================================================================

-- Тест 1: Короткий запрос (должен быть быстрым)
EXPLAIN ANALYZE
SELECT * FROM smart_search_catalog_with_category('panel', 20);

-- Тест 2: Длинный запрос (может быть медленнее)
EXPLAIN ANALYZE
SELECT * FROM smart_search_catalog_with_category('wyłącznik automatyczny', 20);

-- Тест 3: Редкое слово (должен быть очень быстрым)
EXPLAIN ANALYZE
SELECT * FROM smart_search_catalog_with_category('schneider', 20);

-- 4. Сравнение с базовой функцией (без категории)
-- ============================================================================
EXPLAIN ANALYZE
SELECT * FROM smart_search_catalog('schneider', 20);

-- 5. Проверка настроек PostgreSQL
-- ============================================================================
SELECT 
  name,
  setting,
  unit,
  short_desc
FROM pg_settings 
WHERE name IN (
  'shared_buffers',
  'work_mem',
  'effective_cache_size',
  'random_page_cost'
)
ORDER BY name;

-- ============================================================================
-- ИНТЕРПРЕТАЦИЯ:
-- ============================================================================
-- 
-- Execution Time < 30ms:    ✅ ОТЛИЧНО
-- Execution Time 30-80ms:   ✅ ХОРОШО
-- Execution Time 80-150ms:  ⚠️ ПРИЕМЛЕМО
-- Execution Time > 150ms:   ❌ МЕДЛЕННО
-- 
-- Planning Time < 5ms:      ✅ Всегда должно быть
-- Planning Time > 10ms:     ⚠️ Проблемы со статистикой
-- 
-- Если "Function Scan":
-- - Это нормально для RPC функций
-- - Важно проверить ВНУТРЕННИЕ запросы (запрос #1 выше)
-- 
-- Если "Seq Scan":
-- - Индекс НЕ используется
-- - Нужно проверить существование индекса
-- - Может нужно REINDEX или VACUUM
-- 
-- Если "Index Scan" или "Bitmap Index Scan":
-- - Индекс используется ✅
-- - Производительность должна быть хорошей
-- 
-- ============================================================================
