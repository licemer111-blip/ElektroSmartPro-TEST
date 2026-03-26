-- ============================================================================
-- 🔒 Naprawa wszystkich polityk RLS dla katalogu
-- ============================================================================
-- Data: 2026-01-19
-- Problem: Wszystkie zapytania do katalogu otrzymują 403 (permission denied)
-- Rozwiązanie: Naprawić polityki RLS dla wszystkich tabel używanych na stronie katalogu
-- ============================================================================

-- 1. CATALOG_CATEGORIES - Powinny być dostępne dla wszystkich (publiczny katalog)
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Anyone can view catalog categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Public can view catalog categories" ON public.catalog_categories;

-- Создаем публичную политику для просмотра категорий
CREATE POLICY "Public can view catalog categories"
  ON public.catalog_categories FOR SELECT
  USING (true);

-- 2. CATALOG_ITEMS - Проверяем что политика правильная
-- Уже исправлена в предыдущей миграции, но убедимся
DROP POLICY IF EXISTS "Users can view own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view their own catalog items" ON public.catalog_items;

-- Создаем правильную политику если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'catalog_items' 
    AND policyname = 'Users can view global and own catalog items'
  ) THEN
    CREATE POLICY "Users can view global and own catalog items"
      ON public.catalog_items FOR SELECT
      USING (user_id IS NULL OR auth.uid() = user_id);
  END IF;
END $$;

-- 3. REGIONS - Должны быть доступны всем
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
DROP POLICY IF EXISTS "Public can view regions" ON public.regions;

-- Создаем публичную политику для просмотра регионов
CREATE POLICY "Public can view regions"
  ON public.regions FOR SELECT
  USING (true);

-- 4. OBJECT_TYPES - Должны быть доступны всем
ALTER TABLE public.object_types ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Anyone can view object types" ON public.object_types;
DROP POLICY IF EXISTS "Public can view object types" ON public.object_types;

-- Создаем публичную политику для просмотра типов объектов
CREATE POLICY "Public can view object types"
  ON public.object_types FOR SELECT
  USING (true);

-- 5. PROFILES - Проверяем что политики правильные
-- Убедимся что RLS включен
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Проверяем что политика для просмотра существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- 6. PROJECTS - Проверяем что политики правильные
-- Убедимся что RLS включен
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Проверяем что политика для просмотра существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND policyname = 'Users can view own projects'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Users can view own projects"
      ON public.projects FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Комментарии
COMMENT ON POLICY "Public can view catalog categories" ON public.catalog_categories 
IS 'Позволяет всем пользователям (включая неавторизованных) просматривать категории каталога';
COMMENT ON POLICY "Public can view regions" ON public.regions 
IS 'Позволяет всем пользователям (включая неавторизованных) просматривать регионы';
COMMENT ON POLICY "Public can view object types" ON public.object_types 
IS 'Позволяет всем пользователям (включая неавторизованных) просматривать типы объектов';
