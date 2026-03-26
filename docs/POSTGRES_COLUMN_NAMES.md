# 📋 PostgreSQL System Views Column Names

Краткая справка по правильным именам колонок в системных представлениях PostgreSQL.

---

## ⚠️ **Частая ошибка:**

```sql
-- ❌ НЕПРАВИЛЬНО:
SELECT tablename, indexname 
FROM pg_stat_user_indexes;
-- ERROR: column "tablename" does not exist
-- ERROR: column "indexname" does not exist
```

---

## ✅ **Правильные имена колонок:**

### **pg_indexes** (информация об индексах)

```sql
SELECT 
  schemaname,      -- ✅ имя схемы
  tablename,       -- ✅ имя таблицы
  indexname,       -- ✅ имя индекса
  indexdef         -- ✅ определение индекса
FROM pg_indexes;
```

**Используется:** `tablename`, `indexname`

---

### **pg_stat_user_indexes** (статистика использования индексов)

```sql
SELECT 
  schemaname,      -- ✅ имя схемы
  relname,         -- ✅ имя таблицы (НЕ tablename!)
  indexrelname,    -- ✅ имя индекса (НЕ indexname!)
  idx_scan,        -- ✅ количество сканирований
  idx_tup_read,    -- ✅ прочитано строк
  idx_tup_fetch    -- ✅ получено строк
FROM pg_stat_user_indexes;
```

**Используется:** `relname`, `indexrelname` (НЕ `tablename`, `indexname`)

---

### **pg_stat_user_tables** (статистика использования таблиц)

```sql
SELECT 
  schemaname,      -- ✅ имя схемы
  relname,         -- ✅ имя таблицы (НЕ tablename!)
  seq_scan,        -- ✅ последовательные сканирования
  idx_scan,        -- ✅ индексные сканирования
  n_tup_ins,       -- ✅ вставлено строк
  n_tup_upd,       -- ✅ обновлено строк
  n_tup_del,       -- ✅ удалено строк
  n_dead_tup       -- ✅ мертвых строк
FROM pg_stat_user_tables;
```

**Используется:** `relname` (НЕ `tablename`)

---

## 🔄 **JOIN между представлениями:**

### **Правильный JOIN:**

```sql
-- ✅ ПРАВИЛЬНО:
SELECT 
  i.tablename,
  i.indexname,
  s.idx_scan
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s 
  ON i.indexname = s.indexrelname 
  AND i.tablename = s.relname     -- ← Правильно!
WHERE i.tablename = 'catalog_items';
```

### **Неправильный JOIN:**

```sql
-- ❌ НЕПРАВИЛЬНО:
SELECT 
  i.tablename,
  i.indexname,
  s.idx_scan
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s 
  ON i.indexname = s.indexname       -- ← ОШИБКА!
  AND i.tablename = s.tablename      -- ← ОШИБКА!
WHERE i.tablename = 'catalog_items';
```

---

## 📊 **Правильные запросы:**

### **1. Список всех индексов:**

```sql
-- Используй pg_indexes:
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'catalog_items'
ORDER BY indexname;
```

---

### **2. Статистика использования индексов:**

```sql
-- Используй pg_stat_user_indexes:
SELECT 
  schemaname,
  relname AS tablename,       -- ← Алиас для удобства
  indexrelname AS index_name, -- ← Алиас для удобства
  idx_scan AS scans_count,
  idx_tup_read AS tuples_read
FROM pg_stat_user_indexes 
WHERE relname = 'catalog_items'  -- ← relname, не tablename!
ORDER BY idx_scan DESC;
```

---

### **3. Комбинированный запрос:**

```sql
-- JOIN между pg_indexes и pg_stat_user_indexes:
SELECT 
  i.tablename,
  i.indexname,
  pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS size,
  s.idx_scan AS scans
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s 
  ON i.indexname = s.indexrelname 
  AND i.tablename = s.relname        -- ← Правильный JOIN
WHERE i.tablename = 'catalog_items'
ORDER BY s.idx_scan DESC NULLS LAST;
```

---

## 🔍 **Почему разные имена?**

### **Историческая причина:**

- `pg_indexes` — **высокоуровневое представление** для администраторов
  - Использует понятные имена: `tablename`, `indexname`
  
- `pg_stat_user_indexes` — **системная статистика** из pg_stat
  - Использует внутренние имена: `relname`, `indexrelname`
  - `rel` = "relation" (внутреннее имя для таблиц/индексов в PostgreSQL)

---

## 📋 **Шпаргалка:**

| Что нужно | Используй | Правильные колонки |
|-----------|-----------|-------------------|
| Список индексов | `pg_indexes` | `tablename`, `indexname` |
| Статистика индексов | `pg_stat_user_indexes` | `relname`, `indexrelname` |
| Статистика таблиц | `pg_stat_user_tables` | `relname` |
| Вакуум/автовакуум | `pg_stat_user_tables` | `relname` |

---

## ✅ **Правильная замена:**

```sql
-- ❌ БЫЛО (ошибка):
SELECT tablename, indexname 
FROM pg_stat_user_indexes 
WHERE tablename = 'my_table';

-- ✅ СТАЛО (правильно):
SELECT relname AS tablename, indexrelname AS index_name
FROM pg_stat_user_indexes 
WHERE relname = 'my_table';
```

---

## 🔧 **Исправленные файлы:**

В проекте исправлены следующие скрипты:
- ✅ `scripts/check_search_performance.sql`
- ✅ `scripts/check_indexes_detailed.sql`
- ✅ `scripts/test_search_performance_detailed.sql`

Все они теперь используют правильные имена колонок:
- `relname` вместо `tablename` в `pg_stat_user_indexes`
- `indexrelname` вместо `indexname` в `pg_stat_user_indexes`

---

## 💡 **Совет:**

Всегда используй **алиасы** для удобства:

```sql
SELECT 
  relname AS tablename,           -- Понятное имя
  indexrelname AS index_name,     -- Понятное имя
  idx_scan AS scans_count
FROM pg_stat_user_indexes;
```

Это делает запросы читаемыми и совместимыми с другими представлениями.

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
