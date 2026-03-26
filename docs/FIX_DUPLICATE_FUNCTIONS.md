# 🔧 Исправление дублирующихся функций

## Проблема:

```
ERROR: function search_catalog(unknown, integer) is not unique
```

Эта ошибка означает, что в базе данных есть несколько функций с одинаковым именем `search_catalog`, и PostgreSQL не может определить, какую использовать.

---

## ✅ **Быстрое решение (2 минуты):**

### **Шаг 1: Примени исправление**

1. Открой **Supabase SQL Editor**
2. Скопируй файл:
   ```
   supabase/migrations/20260122_fix_duplicate_functions.sql
   ```
3. Вставь в SQL Editor
4. Нажми **RUN**

**Что делает:**
- Удаляет все старые версии функций
- Создает правильные версии заново
- Исправляет дубликаты для всех search функций

---

### **Шаг 2: Проверь результат**

```sql
-- Проверка дубликатов (должен вернуть 0 строк)
SELECT proname, count(*) 
FROM pg_proc 
WHERE proname LIKE '%search_catalog%'
GROUP BY proname
HAVING count(*) > 1;
```

**Если запрос вернул 0 строк** → Все исправлено! ✅

---

### **Шаг 3: Тест поиска**

```sql
-- Теперь это должно работать БЕЗ ошибок:
SELECT * FROM search_catalog('schneider', 20);
SELECT * FROM smart_search_catalog('panel', 15);
SELECT * FROM search_catalog_with_category('gniazdo', 10);
```

---

## 🔍 **Почему возникла проблема:**

Возможные причины:
1. Миграция применялась несколько раз
2. Функции создавались вручную с разными параметрами
3. Старая версия миграции конфликтует с новой

**Решение:** Удалить все версии и создать заново с правильными параметрами.

---

## 📋 **Диагностика (опционально):**

### **Проверить, какие функции существуют:**

```sql
-- Выполни в SQL Editor:
-- scripts/check_duplicate_functions.sql
```

Или вручную:

```sql
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE '%search_catalog%'
ORDER BY proname;
```

---

## 🎯 **Результат после исправления:**

✅ Только одна версия каждой функции  
✅ Правильные параметры со значениями по умолчанию  
✅ Поиск работает без ошибок  
✅ TypeScript типы совпадают с SQL функциями  

---

## 📚 **Связанные файлы:**

- 🔧 `supabase/migrations/20260122_fix_duplicate_functions.sql` - Исправление
- 🔍 `scripts/check_duplicate_functions.sql` - Диагностика
- 📖 `supabase/migrations/20260122_fulltext_search_catalog.sql` - Основная миграция

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
