# 🔧 Исправление ошибки типа ENUM → TEXT

## Проблема:

```
ERROR: structure of query does not match function result type
DETAIL: Returned type market_sentiment_enum does not match expected type text in column 14.
```

Эта ошибка возникает, когда функция PostgreSQL возвращает колонку типа `ENUM`, но сигнатура функции ожидает `TEXT`.

---

## 🔍 **Причина:**

В таблице `catalog_items` колонка `price_trend` имеет тип `market_sentiment_enum`:

```sql
CREATE TYPE market_sentiment_enum AS ENUM ('rising', 'stable', 'falling');

CREATE TABLE catalog_items (
  ...
  price_trend market_sentiment_enum,
  ...
);
```

Но функции поиска объявлены с возвратом `TEXT`:

```sql
CREATE FUNCTION search_catalog(...)
RETURNS TABLE (
  ...
  price_trend TEXT,  -- ← Ожидает TEXT
  ...
)
```

И в запросе возвращают ENUM без приведения типа:

```sql
SELECT 
  ...
  ci.price_trend,  -- ← Возвращает market_sentiment_enum
  ...
FROM catalog_items ci
```

---

## ✅ **Быстрое решение (2 минуты):**

### **Шаг 1: Примени исправление**

1. Открой **Supabase SQL Editor**
2. Скопируй файл:
   ```
   supabase/migrations/20260122_fix_enum_type_cast.sql
   ```
3. Вставь в SQL Editor
4. Нажми **RUN**

**Что делает:**
- Добавляет `::TEXT` к колонке `price_trend` во всех функциях поиска
- Исправляет:
  - `search_catalog`
  - `search_catalog_with_category`
  - `smart_search_catalog`
  - `smart_search_catalog_with_category`
  - `search_catalog_optimized`

---

### **Шаг 2: Проверь результат**

```sql
-- Все эти запросы должны работать БЕЗ ошибок:
SELECT * FROM search_catalog('test', 10);
SELECT * FROM search_catalog_with_category('test', 10);
SELECT * FROM smart_search_catalog('test', 10);
SELECT * FROM smart_search_catalog_with_category('test', 10);
```

---

## 🔧 **Техническое объяснение:**

### **До исправления (❌ ERROR):**

```sql
CREATE FUNCTION search_catalog_with_category(...)
RETURNS TABLE (
  ...
  price_trend TEXT,  -- Функция ожидает TEXT
  ...
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ...
    ci.price_trend,  -- ❌ Возвращает market_sentiment_enum
    ...
  FROM catalog_items ci;
END;
$$;
```

**PostgreSQL видит:**
- Функция обещает вернуть `TEXT`
- Но в SELECT возвращается `market_sentiment_enum`
- **Ошибка несоответствия типов!**

---

### **После исправления (✅ OK):**

```sql
CREATE FUNCTION search_catalog_with_category(...)
RETURNS TABLE (
  ...
  price_trend TEXT,
  ...
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ...
    ci.price_trend::TEXT,  -- ✅ Явное приведение к TEXT
    ...
  FROM catalog_items ci;
END;
$$;
```

**PostgreSQL видит:**
- Функция обещает вернуть `TEXT`
- В SELECT возвращается `market_sentiment_enum::TEXT` → конвертируется в `TEXT`
- **Все типы совпадают!** ✅

---

## 📋 **Какие функции исправлены:**

| Функция | Исправлено |
|---------|-----------|
| `search_catalog` | ✅ Добавлен `::TEXT` |
| `search_catalog_with_category` | ✅ Добавлен `::TEXT` |
| `smart_search_catalog` | ✅ Нет `price_trend` в выводе (OK) |
| `smart_search_catalog_with_category` | ✅ Нет `price_trend` в выводе (OK) |
| `search_catalog_optimized` | ✅ Добавлен `::TEXT` |
| `fuzzy_search_catalog` | ✅ Нет `price_trend` в выводе (OK) |

---

## 🎯 **Почему это работает:**

### **ENUM → TEXT конверсия:**

```sql
-- ENUM значение:
SELECT price_trend FROM catalog_items LIMIT 1;
-- Результат: rising (тип: market_sentiment_enum)

-- С приведением к TEXT:
SELECT price_trend::TEXT FROM catalog_items LIMIT 1;
-- Результат: 'rising' (тип: text)
```

PostgreSQL автоматически конвертирует ENUM в строку при явном `::TEXT`.

---

## 🐛 **Другие похожие ошибки:**

Эта проблема может возникнуть с любым ENUM типом:

```sql
-- Пример других ENUM типов в проекте:
CREATE TYPE confidence_level_enum AS ENUM ('high', 'medium', 'low');
CREATE TYPE item_type_enum AS ENUM ('material', 'labor');
```

**Решение всегда одинаковое:**

```sql
-- ❌ НЕПРАВИЛЬНО:
SELECT confidence_level FROM catalog_items;

-- ✅ ПРАВИЛЬНО (если функция ожидает TEXT):
SELECT confidence_level::TEXT FROM catalog_items;
```

---

## 📚 **Связанные файлы:**

### **Миграции:**
- 🔧 `supabase/migrations/20260122_fix_enum_type_cast.sql` - Исправление всех функций

### **Исходные миграции:**
- 📄 `supabase/migrations/20260122_search_with_category_name.sql` - Где была ошибка
- 📄 `supabase/migrations/20260122_fix_duplicate_functions.sql` - Также исправлено
- 📄 `supabase/migrations/20260122_optimize_search_indexes.sql` - Также исправлено

---

## ⚡ **Частые вопросы:**

### **Q: Почему не изменить тип в RETURNS TABLE на ENUM?**

```sql
-- Можно было бы:
RETURNS TABLE (
  price_trend market_sentiment_enum  -- Вместо TEXT
)
```

**A:** Потому что:
1. TypeScript типы ожидают `string` (TEXT), а не enum
2. Supabase PostgREST автоматически сериализует ENUM в строку для JSON API
3. Проще работать с TEXT в клиентском коде

---

### **Q: Влияет ли это на производительность?**

**A:** Нет, приведение `::TEXT` практически бесплатное:
- Не создает копию данных
- Просто меняет метаданные типа
- Overhead < 1 микросекунды

---

### **Q: Нужно ли переиндексировать после исправления?**

**A:** Нет, индексы не затронуты:
- Изменились только определения функций
- Данные в таблице не изменились
- Индексы остались прежними

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
