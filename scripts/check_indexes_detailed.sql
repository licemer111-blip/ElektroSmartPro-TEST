-- ============================================================================
-- ДЕТАЛЬНАЯ ПРОВЕРКА ИНДЕКСОВ
-- ============================================================================
-- Более подробная информация об индексах и их использовании
-- ============================================================================

-- 1. ВСЕ ИНДЕКСЫ НА catalog_items (с размером)
-- ============================================================================
SELECT 
  i.schemaname,
  i.tablename,
  i.indexname AS index_name,
  pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS index_size,
  i.indexdef AS definition
FROM pg_indexes i
WHERE i.tablename = 'catalog_items'
ORDER BY pg_relation_size(i.indexname::regclass) DESC;

-- 2. СТАТИСТИКА ИСПОЛЬЗОВАНИЯ ИНДЕКСОВ
-- ============================================================================
SELECT 
  schemaname,
  relname AS tablename,
  indexrelname AS index_name,
  idx_scan AS scans_count,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW USAGE'
    ELSE 'ACTIVE'
  END AS usage_status
FROM pg_stat_user_indexes 
WHERE relname = 'catalog_items'
ORDER BY idx_scan DESC;

-- 3. НЕИСПОЛЬЗУЕМЫЕ ИНДЕКСЫ (которые можно удалить)
-- ============================================================================
SELECT 
  schemaname,
  relname AS tablename,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS scans_count
FROM pg_stat_user_indexes 
WHERE relname = 'catalog_items'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'  -- Исключаем primary key
ORDER BY pg_relation_size(indexrelid) DESC;

-- 4. ИНДЕКСЫ GIN (для полнотекстового поиска)
-- ============================================================================
SELECT 
  i.indexname AS index_name,
  pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS size,
  s.idx_scan AS scans,
  i.indexdef AS definition
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s 
  ON i.indexname = s.indexrelname 
  AND i.tablename = s.relname
WHERE i.tablename = 'catalog_items'
  AND i.indexdef LIKE '%gin%'
ORDER BY s.idx_scan DESC NULLS LAST;

-- 5. ПРОВЕРКА BLOAT (раздутие индексов)
-- ============================================================================
SELECT 
  schemaname,
  relname AS tablename,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS current_size,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  CASE 
    WHEN idx_scan > 0 THEN round((idx_tup_read::numeric / idx_scan), 2)
    ELSE 0
  END AS avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE relname = 'catalog_items'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 6. ОБЩАЯ СТАТИСТИКА
-- ============================================================================
SELECT 
  'Total indexes' AS metric,
  COUNT(*)::text AS value
FROM pg_indexes 
WHERE tablename = 'catalog_items'

UNION ALL

SELECT 
  'GIN indexes' AS metric,
  COUNT(*)::text AS value
FROM pg_indexes 
WHERE tablename = 'catalog_items'
  AND indexdef LIKE '%gin%'

UNION ALL

SELECT 
  'Unused indexes' AS metric,
  COUNT(*)::text AS value
FROM pg_stat_user_indexes 
WHERE relname = 'catalog_items'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'

UNION ALL

SELECT 
  'Total indexes size' AS metric,
  pg_size_pretty(pg_indexes_size('catalog_items')) AS value;

-- ============================================================================
-- ИНТЕРПРЕТАЦИЯ РЕЗУЛЬТАТОВ:
-- ============================================================================
-- 
-- USAGE_STATUS:
-- - UNUSED: Индекс никогда не использовался → можно удалить
-- - LOW USAGE: Редко используется (< 100 сканирований) → проверить необходимость
-- - ACTIVE: Активно используется → оставить
--
-- SCANS_COUNT:
-- - 0: Индекс не используется
-- - 1-100: Низкое использование
-- - >100: Нормальное использование
-- - >1000: Активное использование
--
-- AVG_TUPLES_PER_SCAN:
-- - Низкое значение (1-10): Индекс эффективен, сканирует мало строк
-- - Высокое значение (>100): Индекс может быть неэффективен
--
-- ============================================================================
