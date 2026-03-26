# 🔍 Диагностика поиска

Подробное руководство по проверке и оптимизации поиска в каталоге.

---

## 📋 **Быстрая диагностика (3 минуты):**

### **Шаг 1: Проверь индексы**

```sql
-- Все индексы на catalog_items
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'catalog_items'
ORDER BY indexname;
```

**Должны быть:**
- ✅ `catalog_items_search_vector_idx` (GIN для full-text)
- ✅ `catalog_items_name_trgm_idx` (GIN для fuzzy)
- ✅ `catalog_items_active_type_idx` (B-tree для фильтров)
- ✅ `catalog_items_category_active_idx` (B-tree для категорий)

---

### **Шаг 2: Проверь использование индексов**

```sql
-- Статистика использования индексов
SELECT 
  schemaname,
  tablename,
  indexrelname AS index_name,
  idx_scan AS scans_count,
  idx_tup_read AS tuples_read
FROM pg_stat_user_indexes 
WHERE tablename = 'catalog_items'
ORDER BY idx_scan DESC;
```

**Интерпретация:**
- `scans_count = 0` → Индекс НЕ используется ❌
- `scans_count > 100` → Индекс работает ✅

---

### **Шаг 3: Тест производительности**

```sql
-- Базовый поиск (должен занимать < 50ms)
EXPLAIN ANALYZE
SELECT * FROM search_catalog('schneider', 20);
```

**Смотри на:**
- `Planning Time` — должно быть < 5ms
- `Execution Time` — должно быть < 50ms
- `Index Scan` в плане — индекс используется ✅
- `Seq Scan` в плане — индекс НЕ используется ❌

---

## 🛠️ **Полная диагностика:**

### **1. Запусти полный скрипт проверки:**

```bash
# В Supabase SQL Editor:
scripts/check_search_performance.sql
```

**Или вручную:**

```sql
-- Размер таблицы и индексов
SELECT 
  pg_size_pretty(pg_total_relation_size('catalog_items')) as total_size,
  pg_size_pretty(pg_table_size('catalog_items')) as table_size,
  pg_size_pretty(pg_indexes_size('catalog_items')) as indexes_size;

-- Количество записей
SELECT 
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE is_active = true) as active_items,
  COUNT(*) FILTER (WHERE type = 'material') as materials,
  COUNT(*) FILTER (WHERE type = 'labor') as labor_services
FROM catalog_items;

-- Проверка VACUUM
SELECT 
  schemaname,
  relname,
  last_autovacuum,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE relname = 'catalog_items';
```

---

### **2. Детальная проверка индексов:**

```bash
# В Supabase SQL Editor:
scripts/check_indexes_detailed.sql
```

**Показывает:**
- ✅ Размер каждого индекса
- ✅ Сколько раз индекс использовался
- ✅ Неиспользуемые индексы (которые можно удалить)
- ✅ Эффективность каждого индекса

---

## 🔧 **Исправление проблем:**

### **Проблема 1: Индексов нет**

```bash
# Примени миграцию:
supabase/migrations/20260122_optimize_search_indexes.sql
```

---

### **Проблема 2: Индексы не используются**

```sql
-- Обнови статистику:
ANALYZE catalog_items;

-- Если не помогло, увеличь статистику:
ALTER TABLE catalog_items ALTER COLUMN name SET STATISTICS 1000;
ALTER TABLE catalog_items ALTER COLUMN search_vector SET STATISTICS 1000;
ANALYZE catalog_items;
```

---

### **Проблема 3: Много мертвых строк (dead_tuples)**

```sql
-- Проверь:
SELECT n_dead_tup 
FROM pg_stat_user_tables 
WHERE relname = 'catalog_items';
```

**Если > 1000:**

```sql
-- Запусти VACUUM (НЕ в миграции!):
VACUUM ANALYZE catalog_items;
```

Или подожди `autovacuum` (работает автоматически).

---

### **Проблема 4: Дублирующиеся функции**

```sql
-- Проверь дубликаты:
SELECT proname, count(*) 
FROM pg_proc 
WHERE proname LIKE '%search_catalog%'
GROUP BY proname
HAVING count(*) > 1;
```

**Если есть дубликаты:**

```bash
# Примени исправление:
supabase/migrations/20260122_fix_duplicate_functions.sql
```

---

## 📊 **Интерпретация EXPLAIN ANALYZE:**

### **Хороший план (быстрый):**

```
Limit  (cost=12.34..56.78 rows=20 width=100) (actual time=0.123..0.456 rows=20 loops=1)
  ->  Bitmap Index Scan on catalog_items_search_vector_idx
        Index Cond: (search_vector @@ plainto_tsquery(...))
        Heap Blocks: exact=20
Planning Time: 1.234 ms
Execution Time: 0.789 ms  ← ОТЛИЧНО!
```

✅ **Используется индекс**  
✅ **Execution Time < 50ms**  
✅ **Planning Time < 5ms**

---

### **Плохой план (медленный):**

```
Seq Scan on catalog_items  (cost=0.00..10000.00 rows=5000 width=100) (actual time=0.012..456.789 rows=5000 loops=1)
  Filter: (search_vector @@ plainto_tsquery(...))
  Rows Removed by Filter: 95000
Planning Time: 2.345 ms
Execution Time: 678.901 ms  ← МЕДЛЕННО!
```

❌ **Seq Scan (полное сканирование таблицы)**  
❌ **Execution Time > 500ms**  
❌ **Rows Removed: 95000 (читает всю таблицу)**

**Решение:** Создать или пересоздать индекс.

---

## 🎯 **Контрольный список:**

### **Для быстрого поиска нужно:**

- [x] GIN индекс на `search_vector` существует
- [x] GIN индекс на `name` (trigram) существует
- [x] B-tree индексы на `type` и `category_id` существуют
- [x] Индексы используются (`idx_scan > 0`)
- [x] `ANALYZE` выполнен (статистика актуальна)
- [x] `dead_tuples` < 1000
- [x] Нет дублирующихся функций
- [x] `EXPLAIN ANALYZE` показывает Index Scan
- [x] Execution Time < 50ms

---

## 📚 **Связанные файлы:**

### **Скрипты диагностики:**
- 🔍 `scripts/check_search_performance.sql` — Быстрая проверка
- 🔍 `scripts/check_indexes_detailed.sql` — Детальный анализ
- 🔍 `scripts/check_duplicate_functions.sql` — Проверка дубликатов

### **Миграции:**
- 🔧 `supabase/migrations/20260122_optimize_search_indexes.sql` — Создание индексов
- 🔧 `supabase/migrations/20260122_fix_duplicate_functions.sql` — Исправление дубликатов

### **Документация:**
- 📖 `docs/SEARCH_PERFORMANCE.md` — Полное руководство
- 📖 `docs/QUICK_SEARCH_FIX.md` — Быстрое решение
- 📖 `docs/FIX_DUPLICATE_FUNCTIONS.md` — Исправление функций

---

## ⚡ **Частые ошибки:**

### **1. `column "indexname" does not exist`**

```sql
-- ❌ НЕПРАВИЛЬНО:
SELECT indexname FROM pg_stat_user_indexes;

-- ✅ ПРАВИЛЬНО:
SELECT indexrelname AS index_name FROM pg_stat_user_indexes;
```

---

### **2. `function search_catalog is not unique`**

```sql
-- Исправление:
-- supabase/migrations/20260122_fix_duplicate_functions.sql
```

---

### **3. `VACUUM cannot run inside a transaction block`**

```sql
-- ❌ НЕПРАВИЛЬНО (в миграции):
BEGIN;
VACUUM ANALYZE catalog_items;
COMMIT;

-- ✅ ПРАВИЛЬНО (отдельно в SQL Editor):
VACUUM ANALYZE catalog_items;

-- ✅ ИЛИ в миграции:
ANALYZE catalog_items;  -- без VACUUM
```

---

**Версия:** 1.1  
**Дата:** 22 stycznia 2026  
**Обновлено:** Исправлена ошибка с именем колонки `indexname`
