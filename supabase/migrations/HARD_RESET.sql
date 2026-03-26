-- ============================================================================
-- 🔥 HARD RESET - Полная очистка базы данных
-- ============================================================================
-- ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные без возможности восстановления!
-- Используй только если нужно начать с чистого листа
-- ============================================================================

-- Отключаем RLS на всех таблицах (чтобы можно было удалить)
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalog_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalog_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_assemblies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_assembly_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assembly_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.object_types DISABLE ROW LEVEL SECURITY;

-- Удаляем все таблицы (CASCADE удалит все зависимости)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.user_assembly_items CASCADE;
DROP TABLE IF EXISTS public.user_assemblies CASCADE;
DROP TABLE IF EXISTS public.assembly_categories CASCADE;
DROP TABLE IF EXISTS public.project_categories CASCADE;
DROP TABLE IF EXISTS public.project_items CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.catalog_items CASCADE;
DROP TABLE IF EXISTS public.catalog_categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.object_types CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;

-- Удаляем все функции
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Очищаем все политики RLS (на случай если остались)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own profile" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own projects" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own projects" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own projects" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own projects" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own project items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own project items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own project items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own project items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own catalog items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view global and own catalog items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own catalog items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own catalog items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own catalog items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view catalog categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own assemblies" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own assemblies" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own assemblies" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own assemblies" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own assembly items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own assembly items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own assembly items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own assembly items" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own assembly categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own assembly categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own assembly categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own assembly categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own project categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own project categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own project categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own project categories" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert feedback" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own feedback" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own payments" ON public.' || r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- ✅ HARD RESET ЗАВЕРШЁН
-- ============================================================================
-- База данных полностью очищена.
-- Теперь запусти FULL_SETUP.sql для настройки с нуля.
-- ============================================================================
