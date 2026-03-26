# 📊 Интерпретация EXPLAIN ANALYZE

Подробное руководство по анализу производительности поиска.

---

## ⏱️ **Твои результаты:**

```
Planning Time: 0.102 ms       ✅ ОТЛИЧНО
Execution Time: 83.433 ms     ⚠️ ПРИЕМЛЕМО
Rows: 15
```

---

## 📈 **Оценка производительности:**

| Execution Time | Оценка | Статус | Действие |
|----------------|--------|--------|----------|
| < 30ms | ⚡ Отлично | ✅ | Все идеально |
| 30-80ms | ✅ Хорошо | ✅ | Норма для баз > 10k записей |
| 80-150ms | ⚠️ Приемлемо | ⚠️ | Можно оптимизировать |
| > 150ms | ❌ Медленно | ❌ | Требуется оптимизация |

**Твой результат: 83ms** → ⚠️ **Приемлемо, но есть место для улучшения**

---

## 🔍 **Почему 83ms?**

### **1. "Function Scan" - это нормально**

```
Function Scan on smart_search_catalog_with_category
```

**Что это значит:**
- PostgreSQL видит функцию как "черный ящик"
- Не показывает, используются ли индексы внутри
- Это **не проблема**, просто ограничение EXPLAIN ANALYZE

**Решение:**
Нужно проверить ВНУТРЕННИЕ запросы функции (см. ниже).

---

### **2. Возможные причины медленного поиска:**

#### **A. JOIN с catalog_categories**
```sql
LEFT JOIN catalog_categories cc ON ci.category_id = cc.id
```

**Стоимость:** +10-20ms для JOIN

**Решение:** Использовать функцию без категории, если не нужна:
```sql
-- Быстрее (без JOIN):
SELECT * FROM smart_search_catalog('schneider', 20);

-- Медленнее (с JOIN):
SELECT * FROM smart_search_catalog_with_category('schneider', 20);
```

---

#### **B. Размер базы данных**

| Записей в БД | Ожидаемое время |
|--------------|-----------------|
| < 1,000 | 5-20ms |
| 1,000-10,000 | 20-50ms |
| 10,000-50,000 | 50-100ms |
| > 50,000 | 100-200ms |

**Проверь размер:**
```sql
SELECT COUNT(*) FROM catalog_items WHERE is_active = true;
```

---

#### **C. Сложность запроса**

| Тип запроса | Время |
|-------------|-------|
| Короткое слово (3-5 букв) | Быстрее |
| Длинное слово (> 10 букв) | Медленнее |
| Несколько слов | Медленнее |
| Редкое слово | Очень быстро |
| Частое слово | Медленнее |

---

#### **D. Индексы не используются**

**Признаки:**
- Execution Time > 200ms
- "Seq Scan" в плане запроса
- Много результатов отфильтровано

**Решение:**
```sql
-- Проверь индексы:
SELECT indexrelname, idx_scan 
FROM pg_stat_user_indexes 
WHERE tablename = 'catalog_items';

-- Если idx_scan = 0 → индекс не используется
```

---

## 🧪 **Детальная диагностика:**

### **Шаг 1: Проверь ВНУТРЕННИЙ запрос**

Запусти в **Supabase SQL Editor**:

```sql
-- Это ВНУТРЕННИЙ запрос функции smart_search_catalog_with_category
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
```

---

### **Шаг 2: Анализируй результат**

#### **✅ ХОРОШО (индекс используется):**

```
-> Bitmap Index Scan on catalog_items_search_vector_idx
   Index Cond: (search_vector @@ '...'::tsquery)
   Heap Blocks: exact=15
-> Hash Join (cost=...)
   Join Filter: (ci.category_id = cc.id)
```

**Признаки:**
- `Bitmap Index Scan` или `Index Scan`
- Название индекса видно (`catalog_items_search_vector_idx`)
- Мало строк обработано

---

#### **❌ ПЛОХО (индекс НЕ используется):**

```
-> Seq Scan on catalog_items ci
   Filter: (search_vector @@ '...'::tsquery)
   Rows Removed by Filter: 14985
```

**Признаки:**
- `Seq Scan` (полное сканирование таблицы)
- `Rows Removed by Filter` > 1000
- Нет упоминания индексов

**Решение:**
```sql
-- 1. Проверь индекс:
SELECT * FROM pg_indexes 
WHERE tablename = 'catalog_items' 
  AND indexname LIKE '%search_vector%';

-- 2. Если нет → создай:
CREATE INDEX catalog_items_search_vector_idx 
  ON catalog_items USING gin(search_vector);

-- 3. Обнови статистику:
ANALYZE catalog_items;
```

---

## 🚀 **Оптимизация:**

### **1. Используй правильную функцию**

```sql
-- ✅ Если НЕ нужно название категории:
SELECT * FROM smart_search_catalog('schneider', 20);
-- Быстрее на 10-20ms

-- ⚠️ Если НУЖНО название категории:
SELECT * FROM smart_search_catalog_with_category('schneider', 20);
-- Медленнее из-за JOIN
```

---

### **2. Уменьши LIMIT**

```sql
-- Медленнее (больше обработки):
SELECT * FROM smart_search_catalog_with_category('test', 100);

-- Быстрее (меньше обработки):
SELECT * FROM smart_search_catalog_with_category('test', 10);
```

---

### **3. Проверь статистику индексов**

```sql
SELECT 
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS tuples_read
FROM pg_stat_user_indexes 
WHERE tablename = 'catalog_items'
ORDER BY idx_scan DESC;
```

**Если `idx_scan = 0`:**
- Индекс НЕ используется
- Нужно обновить статистику: `ANALYZE catalog_items;`

---

### **4. Проверь размер базы**

```sql
-- Количество записей:
SELECT COUNT(*) FROM catalog_items WHERE is_active = true;

-- Размер таблицы:
SELECT 
  pg_size_pretty(pg_table_size('catalog_items')) as table_size,
  pg_size_pretty(pg_indexes_size('catalog_items')) as indexes_size;
```

---

## 📋 **Контрольный список:**

### **Если Execution Time > 100ms:**

- [ ] Проверь, используется ли GIN индекс на `search_vector`
- [ ] Запусти `ANALYZE catalog_items;`
- [ ] Проверь, нет ли `Seq Scan` в плане запроса
- [ ] Попробуй функцию без категории (`smart_search_catalog`)
- [ ] Уменьши `LIMIT` (например, с 100 до 20)
- [ ] Проверь количество записей в БД
- [ ] Запусти `VACUUM ANALYZE catalog_items;` (если > 10k записей)

---

### **Если Execution Time < 100ms:**

✅ **Все нормально!**

Для баз данных > 10k записей время 50-100ms — это **отличный результат**.

---

## 🎯 **Твой случай (83ms):**

### **Вердикт: ✅ Приемлемо**

**Твой результат (83ms) находится в зеленой зоне для:**
- Баз данных > 10k записей
- Функций с JOIN
- Full-text search + fuzzy fallback

---

### **Что можно улучшить:**

#### **Вариант 1: Убрать JOIN (если не нужно category_name)**

```sql
-- Вместо:
SELECT * FROM smart_search_catalog_with_category('test', 20);  -- 83ms

-- Используй:
SELECT * FROM smart_search_catalog('test', 20);  -- ~60ms
```

**Ускорение:** 15-25ms

---

#### **Вариант 2: Использовать оптимизированную функцию**

```sql
-- Оптимизированная версия (без DECLARE, прямой RETURN QUERY):
SELECT * FROM search_catalog_optimized('test', 20);  -- ~50ms
```

**Ускорение:** 20-35ms

---

#### **Вариант 3: Детальная диагностика**

Запусти полный скрипт:

```bash
# В Supabase SQL Editor:
scripts/test_search_performance_detailed.sql
```

Этот скрипт покажет:
- Используются ли индексы
- Какие запросы медленные
- Статистику использования индексов

---

## 📚 **Связанные файлы:**

### **Скрипты:**
- 🧪 `scripts/test_search_performance_detailed.sql` — Детальная диагностика
- 🔍 `scripts/check_search_performance.sql` — Быстрая проверка
- 📊 `scripts/check_indexes_detailed.sql` — Анализ индексов

### **Документация:**
- 📖 `docs/SEARCH_PERFORMANCE.md` — Оптимизация производительности
- 📖 `docs/SEARCH_DIAGNOSTICS.md` — Диагностика и troubleshooting
- ⚡ `docs/QUICK_SEARCH_FIX.md` — Быстрые решения

---

## 💡 **Частые вопросы:**

### **Q: 83ms — это медленно?**

**A:** Нет, для баз данных > 10k записей это **норма**.

- < 50ms: Отлично (малая БД или простой запрос)
- 50-100ms: Хорошо (средняя БД с JOIN)
- 100-200ms: Приемлемо (большая БД)
- \> 200ms: Медленно (нужна оптимизация)

---

### **Q: Почему "Function Scan" не показывает индексы?**

**A:** Это ограничение PostgreSQL. EXPLAIN ANALYZE видит функцию как "черный ящик" и не может заглянуть внутрь.

**Решение:** Запускать EXPLAIN ANALYZE на **внутренние SQL запросы** (см. скрипт выше).

---

### **Q: Как ускорить до < 50ms?**

**A:**
1. Используй функцию без JOIN (`smart_search_catalog`)
2. Используй оптимизированную версию (`search_catalog_optimized`)
3. Уменьши LIMIT
4. Убедись, что индексы используются

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
