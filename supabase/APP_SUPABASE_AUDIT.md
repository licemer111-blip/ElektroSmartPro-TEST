# Аудит: какой Supabase использует приложение

**Дата:** 2026-02-06

---

## 1. Какой аккаунт Supabase использует приложение

Приложение подключается **только к одному** проекту Supabase:

| Где задаётся | Значение |
|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` (.env.local) | `https://jbxveulddoznswyeihda.supabase.co` |
| `SUPABASE_PROJECT_ID` (.env.supabase) | `jbxveulddoznswyeihda` |
| Клиент | `utils/supabase/client.ts` |
| Сервер | `utils/supabase/server.ts` |
| Middleware | `middleware.ts` |
| Скрипты | все указывают на `jbxveulddoznswyeihda` |

**Итог:** в репозитории настроен **один** Supabase — **Live** (`jbxveulddoznswyeihda`).  
Второй проект (тест с 45 таблицами) в коде **не задан**.

---

## 2. По количеству таблиц: какой «правильный»

| Окружение | Таблиц | Проект |
|-----------|--------|--------|
| **Live** (то, к чему подключено приложение) | **39** | `jbxveulddoznswyeihda` |
| **Тест** (у тебя в дашборде Supabase) | **45** | другой ref, в приложении не настроен |

По числу таблиц **полнее** тот, где **45 таблиц** (тест).  
В Live не хватает таблиц, которые есть в миграциях и которые использует код (см. ниже).

---

## 3. Критично: код ожидает таблицы, которых нет в Live

В коде приложения используются таблицы, которых **нет** в текущей Live-БД (39 таблиц):

| Таблица | Где используется |
|---------|-------------------|
| `project_versions` | `components/project/project-history.tsx` |
| `project_item_history` | `components/project/project-history.tsx`, `app/dashboard/projects/[id]/stats-actions.ts` |
| `item_comments` | `components/project/item-comments.tsx`, `comment-actions.ts`, `stats-actions.ts` |
| `catalog_assemblies` | `app/dashboard/projects/[id]/actions.ts` |

Значит:

- **«Правильный» по схеме** — тот Supabase, где есть эти таблицы (тот, где 45 таблиц, т.е. тест).
- **Текущий Live** (39 таблиц) — **неполный**: в нём нет таблиц, которые уже использует приложение. При работе с историей проекта, комментариями к позициям и сборками каталога возможны ошибки.

---

## 4. Рекомендация

1. **Считать эталоном схему с 45 таблицами** (тест) — в ней есть всё, что ожидает код.
2. **Привести Live к той же схеме:** применить к Live недостающие миграции:
   - `20260131_add_project_versioning.sql` (project_item_history, project_versions, project_version_items)
   - `20260131_add_item_comments.sql` (item_comments)
   - `20260201_create_catalog_assemblies.sql` (catalog_assemblies)
3. Дубликат `activity_log` / `activity_logs`: в коде используется только `activity_logs`; таблицу `activity_log` в Live при желании можно удалить после проверки, что нигде не используется.

После применения этих миграций к Live количество таблиц там станет таким же, как в «правильном» Supabase (45), и приложение будет соответствовать базе.
