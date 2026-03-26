# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ МЕДЛЕННОГО ПОИСКА

## 🚨 **3 шага для ускорения поиска:**

---

### **ШАГ 1: Примени оптимизацию (5 мин)**

1. Открой **Supabase SQL Editor**
2. Скопируй файл: `supabase/migrations/20260122_optimize_search_indexes.sql`
3. Вставь в SQL Editor
4. Нажми **RUN**

**Что это делает:**
- ✅ Создает GIN индексы для fast search
- ✅ Оптимизирует статистику
- ✅ Обновляет статистику планировщика (ANALYZE)

**Дополнительно (опционально):**
- После создания индексов запусти `scripts/vacuum_catalog.sql` (см. инструкцию в файле)

---

### **ШАГ 2: Проверь результат**

Выполни в SQL Editor:

```sql
-- Проверка индексов
SELECT indexname FROM pg_indexes 
WHERE tablename = 'catalog_items';
```

**Должно быть минимум 2 индекса:**
- `catalog_items_search_vector_idx`
- `catalog_items_name_trgm_idx`

---

### **ШАГ 3: Тест поиска**

```sql
-- Тест производительности
EXPLAIN ANALYZE
SELECT * FROM search_catalog('test', 20);
```

**Смотри на "Execution Time":**
- ✅ < 50ms - Отлично!
- ⚠️ 50-150ms - Нормально
- ❌ > 150ms - Смотри дополнительные решения ниже

---

## 🔧 **Дополнительные решения:**

### **Если все еще медленно:**

**Вариант A: Увеличь debounce в коде**

Открой файл с компонентом поиска и измени:

```tsx
const search = useCatalogSearch({
  debounceMs: 500, // Было 300, стало 500
  minQueryLength: 3, // Искать от 3 символов
  limit: 10, // Меньше результатов = быстрее
});
```

**Вариант B: Обнови статистику**

```sql
VACUUM ANALYZE catalog_items;
```

**Вариант C: Пересоздай индексы**

```sql
-- Удали старые
DROP INDEX IF EXISTS catalog_items_search_vector_idx;
DROP INDEX IF EXISTS catalog_items_name_trgm_idx;

-- Создай заново
CREATE INDEX catalog_items_search_vector_idx 
  ON catalog_items USING gin(search_vector);

CREATE INDEX catalog_items_name_trgm_idx 
  ON catalog_items USING gin(name gin_trgm_ops);

-- Обнови статистику
VACUUM ANALYZE catalog_items;
```

---

## 📊 **Диагностика:**

Если нужна подробная диагностика:

```bash
# В Supabase SQL Editor выполни:
scripts/check_search_performance.sql
```

---

## 🆘 **Если ничего не помогает:**

1. Проверь количество записей:
   ```sql
   SELECT COUNT(*) FROM catalog_items;
   ```
   
2. Если > 50,000 записей:
   - Увеличь `debounceMs` до 800ms
   - Уменьши `limit` до 5-10
   - Увеличь `minQueryLength` до 3-4

3. Проверь Supabase план:
   - Free plan имеет ограничения
   - Рассмотри Pro plan для больших БД

---

## ✅ **После оптимизации:**

Поиск должен работать за **5-50ms** для большинства запросов.

---

📖 **Подробнее:** [`docs/SEARCH_PERFORMANCE.md`](SEARCH_PERFORMANCE.md)

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
