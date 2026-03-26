# ⚡ Оптимизация производительности поиска

Руководство по диагностике и решению проблем с медленным поиском.

---

## 🔍 **Диагностика проблемы:**

### **Шаг 1: Проверь индексы**

В Supabase SQL Editor выполни:

```sql
-- Проверка индексов
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'catalog_items';
```

**Ожидаемые индексы:**
- `catalog_items_search_vector_idx` (GIN для full-text search)
- `catalog_items_name_trgm_idx` (GIN для fuzzy search)
- `catalog_items_active_type_idx` (для фильтрации)
- `catalog_items_category_active_idx` (для категорий)

**Если индексов нет** → Примени миграцию (см. Шаг 2)

---

### **Шаг 2: Примени оптимизацию**

В Supabase SQL Editor выполни:

```sql
-- Файл: supabase/migrations/20260122_optimize_search_indexes.sql
-- Скопируй весь код из файла и выполни
```

Эта миграция создаст:
- ✅ Все необходимые индексы
- ✅ Оптимизирует статистику
- ✅ Выполнит VACUUM ANALYZE

---

### **Шаг 3: Проверь количество данных**

```sql
-- Количество записей
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active
FROM catalog_items;
```

**Ожидаемая производительность:**
- < 1,000 записей: **5-15ms**
- 1,000 - 10,000: **10-30ms**
- 10,000 - 50,000: **20-100ms**
- > 50,000: **50-200ms**

---

### **Шаг 4: Тест производительности**

```sql
-- Тест с EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM search_catalog('schneider', 20);
```

**Что проверить:**
1. **Используется ли GIN индекс?**
   - Должно быть: `Bitmap Index Scan on catalog_items_search_vector_idx`
   - ❌ Плохо: `Seq Scan on catalog_items` (полное сканирование таблицы)

2. **Execution Time:**
   - ✅ Хорошо: < 50ms
   - ⚠️ Средне: 50-150ms
   - ❌ Плохо: > 150ms

---

## 🚀 **Решения:**

### **Проблема 1: Индексы не существуют**

**Решение:**
```sql
-- В Supabase SQL Editor выполни миграцию:
-- supabase/migrations/20260122_optimize_search_indexes.sql
```

---

### **Проблема 2: Индексы существуют, но не используются**

**Решение 1:** Обновить статистику
```sql
-- ANALYZE можно запустить в SQL Editor
ANALYZE catalog_items;

-- VACUUM нужно запускать отдельно (см. scripts/vacuum_catalog.sql)
```

**Решение 2:** Пересоздать индексы
```sql
-- Удалить старые индексы
DROP INDEX IF EXISTS catalog_items_search_vector_idx;
DROP INDEX IF EXISTS catalog_items_name_trgm_idx;

-- Создать заново
CREATE INDEX catalog_items_search_vector_idx 
  ON catalog_items USING gin(search_vector);

CREATE INDEX catalog_items_name_trgm_idx 
  ON catalog_items USING gin(name gin_trgm_ops);

-- Обновить статистику
VACUUM ANALYZE catalog_items;
```

---

### **Проблема 3: Много данных (>50k записей)**

**Решение 1:** Увеличить debounce
```tsx
// В компоненте или хуке
const search = useCatalogSearch({
  debounceMs: 500, // Было 300ms, стало 500ms
});
```

**Решение 2:** Увеличить minQueryLength
```tsx
const search = useCatalogSearch({
  minQueryLength: 3, // Искать от 3 символов вместо 2
});
```

**Решение 3:** Ограничить результаты
```tsx
const search = useCatalogSearch({
  limit: 10, // Было 20, стало 10
});
```

---

### **Проблема 4: Медленная сеть / удаленная база**

**Решение:** Оптимизировать клиентскую часть

```tsx
// Увеличить debounce для медленных соединений
const search = useCatalogSearch({
  debounceMs: 800, // Больше задержка = меньше запросов
  limit: 10,       // Меньше данных = быстрее загрузка
});
```

---

### **Проблема 5: Поиск в компоненте без debounce**

**Неправильно:**
```tsx
// ❌ Поиск на каждом нажатии клавиши
const handleChange = async (e) => {
  const results = await searchCatalog(e.target.value);
  setResults(results);
};
```

**Правильно:**
```tsx
// ✅ Используй хук с debounce
const { query, setQuery, results } = useSmartSearchWithCategory();

<input 
  value={query} 
  onChange={(e) => setQuery(e.target.value)} 
/>
```

---

## 📊 **Мониторинг производительности:**

### **Встроенный скрипт диагностики:**

```bash
# В Supabase SQL Editor выполни:
scripts/check_search_performance.sql
```

Этот скрипт покажет:
- ✅ Список индексов
- ✅ Размер таблицы
- ✅ Статистику использования индексов
- ✅ План выполнения запросов

---

## 🔧 **Продвинутая оптимизация:**

### **1. Партиционирование (для очень больших БД)**

Если у тебя > 100,000 записей:

```sql
-- Разделить таблицу на партиции по типу
CREATE TABLE catalog_items_materials 
  PARTITION OF catalog_items FOR VALUES IN ('material');

CREATE TABLE catalog_items_labor 
  PARTITION OF catalog_items FOR VALUES IN ('labor');
```

### **2. Кэширование на стороне клиента**

```tsx
// Кэшировать результаты поиска
const cache = new Map<string, CatalogSearchResult[]>();

const searchWithCache = async (query: string) => {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const results = await searchCatalog(query);
  cache.set(query, results);
  return results;
};
```

### **3. Использовать CDN для статических данных**

Если категории и другие справочники не меняются часто:
- Экспортируй их в JSON
- Загружай с CDN
- Фильтруй на клиенте

---

## ✅ **Checklist оптимизации:**

- [ ] Применена миграция `20260122_fulltext_search_catalog.sql`
- [ ] Применена миграция `20260122_optimize_search_indexes.sql`
- [ ] Выполнено `VACUUM ANALYZE catalog_items`
- [ ] Индексы используются (проверено через EXPLAIN ANALYZE)
- [ ] Debounce настроен (300-500ms)
- [ ] minQueryLength = 2-3 символа
- [ ] Limit = 10-20 результатов
- [ ] Компоненты используют хук `useCatalogSearch`

---

## 🆘 **Если ничего не помогло:**

### **Вариант 1: Логирование производительности**

Добавь в RPC функцию:

```sql
CREATE OR REPLACE FUNCTION search_catalog_debug(...)
RETURNS TABLE (...) AS $$
BEGIN
  RAISE NOTICE 'Search started at %', clock_timestamp();
  
  RETURN QUERY
  SELECT ...;
  
  RAISE NOTICE 'Search completed at %', clock_timestamp();
END;
$$ LANGUAGE plpgsql;
```

### **Вариант 2: Проверь лимиты Supabase**

- Free plan: Ограничение на размер БД и запросы
- Проверь Dashboard → Database → Performance

### **Вариант 3: Используй read replicas**

Для Pro плана Supabase:
- Создай read replica для поиска
- Направляй поисковые запросы на replica

---

## 📚 **Дополнительные ресурсы:**

- 📄 `scripts/check_search_performance.sql` - Диагностика
- 📄 `supabase/migrations/20260122_optimize_search_indexes.sql` - Оптимизация
- 📖 [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- 📖 [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
