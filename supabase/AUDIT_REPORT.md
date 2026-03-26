# Аудит Supabase (Live-версия / production)

**Проект:** `jbxveulddoznswyeihda` (из `.env.local` / `.env.supabase`) — **это Live (продакшен)**  
**Дата:** 2026-02-06

---

## Сводка

| Метрика | Значение |
|--------|----------|
| **Таблиц в `public`** | **39** |
| **Всего колонок** | 469 |
| **Дубликаты таблиц** | 1 пара (см. ниже) |
| **Таблицы из миграций, которых нет в БД** | 5 |

---

## 1. Дубликат / лишняя таблица

- **`activity_log`** (7 колонок) и **`activity_logs`** (7 колонок) — по сути одно и то же.
- В коде используется **`activity_logs`** (миграция `20260129_activity_feed.sql`).
- **`activity_log`** похожа на старую/альтернативную версию — можно считать лишней и при желании удалить после проверки, что нигде не используется.

---

## 2. Таблицы, которые есть в миграциях, но отсутствуют в БД

Эти таблицы создаются миграциями, но в текущей базе их **нет** (миграции могли не применяться или откатываться):

| Таблица | Миграция | Назначение |
|---------|----------|------------|
| `project_item_history` | `20260131_add_project_versioning.sql` | История изменений позиций проекта |
| `project_versions` | `20260131_add_project_versioning.sql` | Версии проекта |
| `project_version_items` | `20260131_add_project_versioning.sql` | Позиции в версиях |
| `item_comments` | `20260131_add_item_comments.sql` | Комментарии к позициям |
| `catalog_assemblies` | `20260201_create_catalog_assemblies.sql` | Сборки в каталоге |

**Итого:** 5 таблиц.  
Если их добавить в Live-БД: 39 + 5 = **44 таблицы**.  
В тест-версии Supabase (45 таблиц) эти миграции, видимо, применены, плюс возможен другой учёт — отсюда **45 vs 39**.

---

## 3. Полный список таблиц в БД (39)

```
activity_log          activity_logs       ai_usage
assembly_categories   catalog_categories  catalog_items
clients               email_logs           favorite_catalog_items
feedback              hidden_catalog_items invoice_items
invoices              kit_items            kits
object_types          payments             price_history_log
profiles              project_categories   project_invoice_items
project_invoices      project_items        project_members
project_tag_assignments  project_tags      project_templates
projects              push_subscriptions   regions
subscription_invoices team_invitations     team_members
team_messages         team_role_permissions teams
time_entries          user_assemblies     user_assembly_items
```

---

## 4. Сравнение с тест-версией (45 vs 39)

Здесь описана **Live-версия** (39 таблиц). Чтобы сравнить с тест-версией Supabase (где у тебя 45 таблиц):

1. Нужен **Project ID** второго проекта (или его URL, например `https://xxxxx.supabase.co`).
2. Либо добавь второй проект в `.env` (например `SUPABASE_PROJECT_ID_TEST` / `SUPABASE_PROJECT_ID_PROD`) и напиши, какой ключ к какому окружению относится.

После этого можно:
- выгрузить список таблиц и колонок из второго проекта,
- сравнить с этим отчётом и выписать точные отличия (какие таблицы только там, какие только здесь, какие совпадают по имени, но отличаются по колонкам).

---

## 5. Рекомендации

1. **Решить про `activity_log`:** либо удалить, если не используется, либо явно задокументировать отличие от `activity_logs`.
2. **Недостающие таблицы:** если версионирование проектов, комментарии к позициям и сборки каталога нужны — применить миграции `20260131_add_project_versioning.sql`, `20260131_add_item_comments.sql`, `20260201_create_catalog_assemblies.sql` к Live-БД (или перенести их в одну общую миграцию и применить её).
3. **Синхронизация тест vs Live:** после сравнения с тест-проектом Supabase (45 таблиц) — либо довести Live до того же набора миграций, либо описать, какие отличия намеренные.
