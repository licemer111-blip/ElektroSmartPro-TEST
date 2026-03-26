-- ============================================================================
-- 🔄 Синхронизация RLS политик с тестовым проектом
-- ============================================================================
-- Дата: 2026-01-19
-- Проблема: В тестовом проекте работает, в продакшене не работает
-- Решение: Перенести политики из тестового проекта (upwctgdpuckreoquofiu)
-- ============================================================================

-- 1. CATALOG_ITEMS - В тестовом: "Authenticated users can view catalog items" (true)
-- В продакшене нужно использовать ту же логику
DROP POLICY IF EXISTS "Users can view global and own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Authenticated users can view catalog items" ON public.catalog_items;

-- Создаем политику как в тестовом: доступно всем авторизованным (true)
CREATE POLICY "Authenticated users can view catalog items"
  ON public.catalog_items FOR SELECT
  USING (true);

-- 2. CATALOG_CATEGORIES - В тестовом: "Authenticated users can view categories" (true)
DROP POLICY IF EXISTS "Public can view catalog categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Anyone can view catalog categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.catalog_categories;

-- Создаем политику как в тестовом
CREATE POLICY "Authenticated users can view categories"
  ON public.catalog_categories FOR SELECT
  USING (true);

-- 3. REGIONS - В тестовом: "Authenticated users can view regions" (true)
DROP POLICY IF EXISTS "Public can view regions" ON public.regions;
DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
DROP POLICY IF EXISTS "Authenticated users can view regions" ON public.regions;

-- Создаем политику как в тестовом
CREATE POLICY "Authenticated users can view regions"
  ON public.regions FOR SELECT
  USING (true);

-- 4. OBJECT_TYPES - В тестовом: "Authenticated users can view object types" (true)
DROP POLICY IF EXISTS "Public can view object types" ON public.object_types;
DROP POLICY IF EXISTS "Anyone can view object types" ON public.object_types;
DROP POLICY IF EXISTS "Authenticated users can view object types" ON public.object_types;

-- Создаем политику как в тестовом
CREATE POLICY "Authenticated users can view object types"
  ON public.object_types FOR SELECT
  USING (true);

-- 5. Убедимся что RLS включен на всех таблицах
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_types ENABLE ROW LEVEL SECURITY;

-- Комментарии
COMMENT ON POLICY "Authenticated users can view catalog items" ON public.catalog_items 
IS 'Позволяет всем авторизованным пользователям просматривать каталог (синхронизировано с тестовым проектом)';
COMMENT ON POLICY "Authenticated users can view categories" ON public.catalog_categories 
IS 'Позволяет всем авторизованным пользователям просматривать категории (синхронизировано с тестовым проектом)';
COMMENT ON POLICY "Authenticated users can view regions" ON public.regions 
IS 'Позволяет всем авторизованным пользователям просматривать регионы (синхронизировано с тестовым проектом)';
COMMENT ON POLICY "Authenticated users can view object types" ON public.object_types 
IS 'Позволяет всем авторизованным пользователям просматривать типы объектов (синхронизировано с тестовым проектом)';
