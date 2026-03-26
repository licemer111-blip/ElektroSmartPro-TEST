# 🔧 Решение проблем ElektroSmart PRO

## ❌ "Не работает" - Диагностика

Если проект не запускается или не работает, следуйте этому руководству.

---

## 🔍 ШАГ 1: Проверка .env.local

### Проблема: Файл .env.local отсутствует или не заполнен

**Признаки:**
- Ошибка: `NEXT_PUBLIC_SUPABASE_URL is not defined`
- Ошибка: `SUPABASE_SERVICE_ROLE_KEY is not defined`
- Приложение не запускается

**Решение:**

1. **Создайте .env.local:**
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.local.example .env.local
   
   # Или вручную скопируйте содержимое .env.local.example в новый файл .env.local
   ```

2. **Получите SERVICE_ROLE_KEY:**
   - Откройте: https://supabase.com/dashboard/project/vwwcqapzlnzfwxbfytvi/settings/api
   - Найдите секцию **"Project API keys"**
   - Скопируйте **`service_role`** ключ
   - Откройте `.env.local`
   - Найдите строку: `SUPABASE_SERVICE_ROLE_KEY=ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ`
   - Замените `ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ` на скопированный ключ

3. **Сохраните файл и перезапустите:**
   ```bash
   npm run dev
   ```

---

## 🔍 ШАГ 2: Проверка зависимостей

### Проблема: node_modules отсутствует

**Признаки:**
- Ошибка: `Cannot find module '@supabase/supabase-js'`
- Ошибка: `Module not found`

**Решение:**

```bash
# Удалите старые зависимости
rm -rf node_modules package-lock.json

# Установите заново
npm install
```

---

## 🔍 ШАГ 3: Проверка Node.js

### Проблема: Node.js не установлен или старая версия

**Признаки:**
- Ошибка: `'node' is not recognized`
- Ошибка: `Unsupported Node.js version`

**Решение:**

1. **Проверьте версию:**
   ```bash
   node --version
   # Должно быть: v18.0.0 или выше
   ```

2. **Если Node.js не установлен:**
   - Скачайте с https://nodejs.org
   - Установите версию 18+ (LTS)
   - Перезапустите терминал

---

## 🔍 ШАГ 4: Проверка подключения к Supabase

### Проблема: Не удается подключиться к базе данных

**Признаки:**
- Ошибка: `Failed to fetch`
- Ошибка: `Network error`
- Каталог пустой
- Данные не загружаются

**Решение:**

1. **Проверьте переменные в .env.local:**
   ```bash
   # Откройте .env.local и проверьте:
   NEXT_PUBLIC_SUPABASE_URL=https://vwwcqapzlnzfwxbfytvi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

2. **Проверьте доступность Supabase:**
   - Откройте в браузере: https://vwwcqapzlnzfwxbfytvi.supabase.co
   - Должен открыться Supabase API

3. **Перезапустите сервер разработки:**
   ```bash
   # Остановите сервер (Ctrl+C)
   # Запустите снова
   npm run dev
   ```

---

## 🔍 ШАГ 5: Проверка базы данных

### Проблема: Таблицы отсутствуют или пустые

**Признаки:**
- Каталог пустой
- Регионы не загружаются
- Ошибка: `relation "catalog_items" does not exist`

**Решение:**

1. **Проверьте данные в Supabase:**
   - Откройте: https://supabase.com/dashboard/project/vwwcqapzlnzfwxbfytvi/editor
   - Проверьте таблицы:
     - `regions` - должно быть 16 записей
     - `object_types` - должно быть 15 записей
     - `catalog_categories` - должно быть 16 записей
     - `catalog_items` - должно быть 80 записей (user_id IS NULL)

2. **Если данные отсутствуют:**
   - Откройте SQL Editor в Supabase
   - Запустите скрипт: `supabase/migrations/FULL_SETUP.sql`

---

## 🔍 ШАГ 6: Проверка регистрации

### Проблема: Профиль не создается при регистрации

**Признаки:**
- После регистрации профиль пустой
- Ошибка: `profile not found`
- Нельзя создать проект

**Решение:**

1. **Проверьте триггер в Supabase:**
   ```sql
   -- Выполните в Supabase SQL Editor:
   SELECT tgname, tgrelid::regclass, tgenabled
   FROM pg_trigger
   WHERE tgname = 'on_auth_user_created';
   ```

2. **Если триггер отсутствует, создайте его:**
   ```sql
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION handle_new_user();
   ```

---

## 🔍 ШАГ 7: Очистка кэша

### Проблема: Изменения не применяются

**Признаки:**
- Старые значения переменных
- Кэш не обновляется

**Решение:**

```bash
# Удалите кэш Next.js
rm -rf .next

# Перезапустите сервер
npm run dev
```

---

## 🚀 Быстрая диагностика

Запустите скрипт диагностики:

```bash
# Windows (PowerShell)
.\diagnose.ps1
```

Скрипт проверит:
- ✅ Наличие .env.local
- ✅ Заполнение переменных окружения
- ✅ Установку Node.js
- ✅ Наличие node_modules
- ✅ Настройку Supabase

---

## 📋 Чеклист "Не работает"

- [ ] `.env.local` создан?
- [ ] `SUPABASE_SERVICE_ROLE_KEY` заполнен?
- [ ] `NEXT_PUBLIC_SUPABASE_URL` правильный?
- [ ] `node_modules` установлен? (`npm install`)
- [ ] Node.js 18+ установлен? (`node --version`)
- [ ] База данных заполнена? (16 регионов, 80 элементов каталога)
- [ ] Триггер `on_auth_user_created` работает?
- [ ] Кэш очищен? (`rm -rf .next`)

---

## 🆘 Если ничего не помогло

1. **Проверьте логи ошибок:**
   ```bash
   npm run dev
   # Смотрите ошибки в консоли
   ```

2. **Проверьте браузер:**
   - Откройте DevTools (F12)
   - Вкладка Console - какие ошибки?
   - Вкладка Network - какие запросы падают?

3. **Полный сброс:**
   ```bash
   # Удалите все кэши и зависимости
   rm -rf .next node_modules package-lock.json
   
   # Переустановите
   npm install
   
   # Очистите .env.local и создайте заново
   # Получите ключи из Supabase Dashboard
   
   # Запустите
   npm run dev
   ```

---

## 📞 Контакты

Если проблема не решена:
1. Проверьте логи в консоли браузера (F12 → Console)
2. Проверьте логи в терминале где запущен `npm run dev`
3. Убедитесь что все переменные в `.env.local` заполнены

---

**Последнее обновление:** 2026-01-19
