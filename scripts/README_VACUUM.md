# ⚠️ Как запустить VACUUM

## Проблема:

`VACUUM` не может выполняться внутри транзакционного блока, поэтому его **НЕЛЬЗЯ** запускать в обычных миграциях.

---

## ✅ **Правильный способ запуска:**

### **Вариант 1: Через psql (если есть доступ)**

```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" -c "VACUUM ANALYZE catalog_items;"
```

### **Вариант 2: Через Supabase SQL Editor**

**ВАЖНО:** В Supabase SQL Editor команды выполняются в транзакции, поэтому VACUUM может не работать.

**Решение:** Используй только `ANALYZE`:

```sql
-- Вместо VACUUM ANALYZE используй только ANALYZE
ANALYZE catalog_items;
```

`ANALYZE` обновляет статистику для планировщика запросов и **работает в транзакциях**.

### **Вариант 3: Автоматический autovacuum**

PostgreSQL (и Supabase) автоматически запускают `autovacuum` в фоне. Проверь, когда последний раз он запускался:

```sql
SELECT 
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname = 'catalog_items';
```

**Если `last_autovacuum` был недавно (< 24 часов), ручной VACUUM не нужен.**

---

## 🎯 **Что делать:**

### **Шаг 1: Примени миграцию (БЕЗ VACUUM)**

```sql
-- Выполни в SQL Editor:
-- supabase/migrations/20260122_optimize_search_indexes.sql
-- Эта миграция создает индексы и выполняет ANALYZE (без VACUUM)
```

### **Шаг 2: Проверь autovacuum**

```sql
SELECT 
  last_autovacuum,
  n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE relname = 'catalog_items';
```

**Если:**
- `last_autovacuum` был недавно → VACUUM не нужен
- `dead_tuples` < 1000 → VACUUM не нужен
- `dead_tuples` > 1000 → Подожди autovacuum или используй Вариант 4

### **Шаг 3: (Опционально) Ручной VACUUM**

Если `autovacuum` не запускается и `dead_tuples` много:

**Вариант A:** Используй `pgAdmin` или другой клиент (не в транзакции)

**Вариант B:** Попроси Supabase Support запустить VACUUM

**Вариант C:** Подожди автоматический `autovacuum` (обычно запускается каждые несколько часов)

---

## 📊 **Когда нужен VACUUM:**

- ✅ После массового удаления записей (>1000)
- ✅ После массового обновления (>10,000)
- ✅ Если `dead_tuples` > 10% от общего количества записей
- ❌ После создания индексов (не обязательно)
- ❌ Если база только что создана (не нужен)

---

## 🚀 **Для оптимизации поиска достаточно:**

1. ✅ Создать индексы (миграция `20260122_optimize_search_indexes.sql`)
2. ✅ Запустить `ANALYZE` (включено в миграцию)
3. ⏳ Подождать автоматический `autovacuum` (если нужен)

**VACUUM не критичен для производительности поиска!**  
**Главное - это индексы и ANALYZE.**

---

## 📚 **Дополнительно:**

- [PostgreSQL VACUUM Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [Supabase Database Maintenance](https://supabase.com/docs/guides/database/database-performance)

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
