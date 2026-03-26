-- ============================================================================
-- ДИАГНОСТИКА ПРОИЗВОДИТЕЛЬНОСТИ ПОИСКА
-- ============================================================================
-- Скрипт для проверки индексов, статистики и производительности
-- ============================================================================

-- 1. ПРОВЕРКА СУЩЕСТВОВАНИЯ ИНДЕКСОВ
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'catalog_items'
ORDER BY indexname;

-- 2. ПРОВЕРКА РАЗМЕРА ТАБЛИЦЫ И ИНДЕКСОВ
-- ============================================================================
SELECT 
  pg_size_pretty(pg_total_relation_size('catalog_items')) as total_size,
  pg_size_pretty(pg_table_size('catalog_items')) as table_size,
  pg_size_pretty(pg_indexes_size('catalog_items')) as indexes_size;

-- 3. КОЛИЧЕСТВО ЗАПИСЕЙ
-- ============================================================================
SELECT 
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE is_active = true) as active_items,
  COUNT(*) FILTER (WHERE type = 'material') as materials,
  COUNT(*) FILTER (WHERE type = 'labor') as labor_services,
  COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as items_with_search_vector
FROM catalog_items;

-- 4. ПРОВЕРКА СУЩЕСТВОВАНИЯ ФУНКЦИЙ
-- ============================================================================
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition_preview
FROM pg_proc 
WHERE proname IN (
  'search_catalog',
  'fuzzy_search_catalog',
  'smart_search_catalog',
  'search_catalog_with_category',
  'smart_search_catalog_with_category'
)
ORDER BY proname;

-- 5. ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ ПОИСКА (базовый)
-- ============================================================================
EXPLAIN ANALYZE
SELECT * FROM search_catalog('schneider', 20);

-- 6. ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ С КАТЕГОРИЕЙ
-- ============================================================================
EXPLAIN ANALYZE
SELECT * FROM search_catalog_with_category('schneider', 20);

-- 7. ПРОВЕРКА СТАТИСТИКИ ИСПОЛЬЗОВАНИЯ ИНДЕКСОВ
-- ============================================================================
SELECT 
  schemaname,
  relname AS tablename,
  indexrelname as index_name,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE relname = 'catalog_items'
ORDER BY idx_scan DESC;

-- 8. ПРОВЕРКА VACUUM И ANALYZE
-- ============================================================================
SELECT 
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE relname = 'catalog_items';

-- ============================================================================
-- РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ:
-- ============================================================================

-- Если индексов нет, выполни:
-- CREATE INDEX IF NOT EXISTS catalog_items_search_vector_idx 
--   ON catalog_items USING gin(search_vector);

-- CREATE INDEX IF NOT EXISTS catalog_items_name_trgm_idx 
--   ON catalog_items USING gin(name gin_trgm_ops);

-- CREATE INDEX IF NOT EXISTS catalog_items_type_idx 
--   ON catalog_items(type) WHERE is_active = true;

-- CREATE INDEX IF NOT EXISTS catalog_items_category_idx 
--   ON catalog_items(category_id) WHERE is_active = true;

-- Если данных много (>10k записей), выполни:
-- VACUUM ANALYZE catalog_items;

-- Если поиск все равно медленный, увеличь статистику:
-- ALTER TABLE catalog_items ALTER COLUMN name SET STATISTICS 1000;
-- ALTER TABLE catalog_items ALTER COLUMN search_vector SET STATISTICS 1000;
-- ANALYZE catalog_items;
