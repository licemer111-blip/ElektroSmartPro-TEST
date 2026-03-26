-- ============================================================================
-- 🔧 Исправление ролей в политиках на {authenticated}
-- ============================================================================
-- Дата: 2026-01-19
-- Проблема: Политики используют роль {public}, а должны использовать {authenticated}
-- Решение: Пересоздать политики с правильной ролью как в тестовом проекте
-- ============================================================================

-- 1. CATALOG_ITEMS
DROP POLICY IF EXISTS "Authenticated users can view catalog items" ON public.catalog_items;
CREATE POLICY "Authenticated users can view catalog items"
  ON public.catalog_items FOR SELECT
  TO authenticated
  USING (true);

-- 2. CATALOG_CATEGORIES
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.catalog_categories;
CREATE POLICY "Authenticated users can view categories"
  ON public.catalog_categories FOR SELECT
  TO authenticated
  USING (true);

-- 3. REGIONS
DROP POLICY IF EXISTS "Authenticated users can view regions" ON public.regions;
CREATE POLICY "Authenticated users can view regions"
  ON public.regions FOR SELECT
  TO authenticated
  USING (true);

-- 4. OBJECT_TYPES
DROP POLICY IF EXISTS "Authenticated users can view object types" ON public.object_types;
CREATE POLICY "Authenticated users can view object types"
  ON public.object_types FOR SELECT
  TO authenticated
  USING (true);

-- 5. PROFILES - тоже обновить для соответствия
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 6. PROJECTS - тоже обновить для соответствия
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Комментарии
COMMENT ON POLICY "Authenticated users can view catalog items" ON public.catalog_items 
IS 'Позволяет авторизованным пользователям просматривать каталог (роль: authenticated)';
COMMENT ON POLICY "Authenticated users can view categories" ON public.catalog_categories 
IS 'Позволяет авторизованным пользователям просматривать категории (роль: authenticated)';
COMMENT ON POLICY "Authenticated users can view regions" ON public.regions 
IS 'Позволяет авторизованным пользователям просматривать регионы (роль: authenticated)';
COMMENT ON POLICY "Authenticated users can view object types" ON public.object_types 
IS 'Позволяет авторизованным пользователям просматривать типы объектов (роль: authenticated)';
