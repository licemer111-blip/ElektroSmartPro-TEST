-- ============================================================================
-- 🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ ВСЕХ RLS ПОЛИТИК
-- ============================================================================
-- Дата: 2026-01-19 22:00
-- Проблема: Некоторые политики используют роль {public}, что блокирует доступ
-- Решение: Все политики для авторизованных пользователей должны использовать {authenticated}
-- ============================================================================

-- 1. CATALOG_ITEMS - Исправление всех политик
DROP POLICY IF EXISTS "Users can insert own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can update own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can delete own catalog items" ON public.catalog_items;

-- SELECT (уже правильная, но пересоздаём для консистентности)
DROP POLICY IF EXISTS "Authenticated users can view catalog items" ON public.catalog_items;
CREATE POLICY "Authenticated users can view catalog items"
  ON public.catalog_items FOR SELECT
  TO authenticated
  USING (true);

-- INSERT
CREATE POLICY "Authenticated users can insert own catalog items"
  ON public.catalog_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Authenticated users can update own catalog items"
  ON public.catalog_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Authenticated users can delete own catalog items"
  ON public.catalog_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. PROFILES - Исправление всех политик
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- SELECT
CREATE POLICY "Authenticated users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- INSERT (важно: trigger создаёт профиль, но пользователь тоже должен иметь доступ)
CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE
CREATE POLICY "Authenticated users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. REGIONS - Публичное чтение для авторизованных
DROP POLICY IF EXISTS "Authenticated users can view regions" ON public.regions;
CREATE POLICY "Authenticated users can view regions"
  ON public.regions FOR SELECT
  TO authenticated
  USING (true);

-- 4. OBJECT_TYPES - Публичное чтение для авторизованных
DROP POLICY IF EXISTS "Authenticated users can view object types" ON public.object_types;
CREATE POLICY "Authenticated users can view object types"
  ON public.object_types FOR SELECT
  TO authenticated
  USING (true);

-- 5. CATALOG_CATEGORIES - Исправление для INSERT (если пользователи могут создавать)
-- Проверяем есть ли политика для INSERT
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.catalog_categories;
CREATE POLICY "Authenticated users can insert categories"
  ON public.catalog_categories FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Любой авторизованный может создать категорию

-- 6. PROJECTS - Убеждаемся что политики правильные
-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects; -- Дубликат

-- Создаём правильные политики
CREATE POLICY "Authenticated users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
