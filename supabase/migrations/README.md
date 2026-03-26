# 📊 Supabase Migrations - ElektroSmart PRO

## 🎯 Быстрый старт

### Для НОВОЙ базы данных:
```sql
-- Запустите в Supabase SQL Editor:
-- 1. Сначала включите расширение pg_trgm для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Затем запустите MASTER_SCHEMA_v4.sql
```

### Для СУЩЕСТВУЮЩЕЙ базы данных:
```sql
-- Запустите FIX_ALL_ISSUES.sql для исправления всех проблем
```

---

## 📁 Структура файлов

### Основные файлы (используйте эти):

| Файл | Описание |
|------|----------|
| `20260131_MASTER_SCHEMA_v4.sql` | **Полная схема БД v4.0** - для новых проектов |
| `20260131_FIX_ALL_ISSUES.sql` | **Исправления** - для существующих БД |
| `FULL_SETUP.sql` | Старая версия схемы (deprecated) |

### Каталог (seed data):

| Файл | Описание |
|------|----------|
| `CATALOG_EXPANSION_2026.sql` | Основной каталог позиций |
| `CATALOG_EXPANSION_2026_PART2-4.sql` | Дополнительные позиции |

---

## 🗄️ Таблицы базы данных

### Основные (Core):
- `profiles` - Профили пользователей
- `regions` - 16 воеводств Польши
- `object_types` - Типы объектов (VAT 8/23%)

### Проекты:
- `projects` - Проекты коштorysów
- `project_items` - Позиции в проектах
- `project_members` - Участники (командная работа)
- `project_categories` - Категории проектов
- `project_tags` - Теги
- `project_templates` - Шаблоны

### Каталог:
- `catalog_categories` - Категории каталога
- `catalog_items` - Позиции каталога (1300+)
- `hidden_catalog_items` - Скрытые позиции
- `favorite_catalog_items` - Избранное

### Сборки:
- `user_assemblies` - Пользовательские сборки
- `user_assembly_items` - Позиции в сборках
- `assembly_categories` - Категории сборок
- `kits` - Готовые наборы
- `kit_items` - Позиции в наборах

### CRM:
- `clients` - Клиенты

### Команды:
- `teams` - Команды
- `team_members` - Участники
- `team_invitations` - Приглашения
- `team_messages` - Чат

### Платежи:
- `payments` - Платежи Stripe
- `subscription_invoices` - Фактуры подписки
- `project_invoices` - Фактуры проектов

### Дополнительные:
- `feedback` - Обратная связь
- `time_entries` - Учёт времени
- `activity_logs` - Лента активности
- `ai_usage` - Использование AI
- `email_logs` - Логи email
- `push_subscriptions` - Push уведомления

---

## 🔒 RLS Политики

Все таблицы защищены Row Level Security:

- **profiles**: Только свой профиль
- **projects**: Свои + где участник команды
- **catalog_items**: Глобальные + свои + командные
- **teams**: Владелец + участники

---

## 📈 Индексы

Оптимизированы для:
- Поиск по user_id (все таблицы)
- Полнотекстовый поиск в каталоге (pg_trgm)
- Сортировка по дате
- Фильтрация по статусу

---

## 🔧 Триггеры

1. **handle_new_user** - Автосоздание профиля при регистрации
2. **handle_updated_at** - Автообновление updated_at

---

## 📝 Порядок миграций

Если запускаете вручную, соблюдайте порядок:

1. `20260131_MASTER_SCHEMA_v4.sql` (или `FULL_SETUP.sql`)
2. `CATALOG_EXPANSION_2026.sql`
3. `CATALOG_EXPANSION_2026_PART2.sql`
4. `CATALOG_EXPANSION_2026_PART3.sql`
5. `CATALOG_EXPANSION_2026_PART4.sql`

---

## ⚠️ Важно

- **Всегда делайте backup** перед запуском миграций
- **Не удаляйте** старые миграции - они нужны для истории
- **Проверяйте логи** после каждой миграции

---

## 📊 Статистика схемы v4.0

- **Таблиц**: 35+
- **Индексов**: 50+
- **RLS политик**: 40+
- **Триггеров**: 12+
- **Функций**: 5+

---

*Последнее обновление: 2026-01-31*
