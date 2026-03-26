-- ============================================================================
-- 🔒 Naprawa funkcji z mutable search_path (bezpieczeństwo)
-- ============================================================================
-- Data: 2026-01-19
-- Problem: Funkcje z mutable search_path są podatne na SQL injection
-- Rozwiązanie: Dodać SET search_path = public do wszystkich funkcji
-- ============================================================================

-- Usuwamy stare funkcje przed odtworzeniem
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_project_categories_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_assembly_categories_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.user_is_pro(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.auto_populate_catalog() CASCADE;
DROP FUNCTION IF EXISTS public.copy_catalog_items_for_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_catalog_items(UUID) CASCADE;

-- 1. Naprawa handle_updated_at
CREATE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Naprawa handle_new_user
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- 3. Naprawa update_project_categories_updated_at
CREATE FUNCTION public.update_project_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Naprawa update_assembly_categories_updated_at  
CREATE FUNCTION public.update_assembly_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. Naprawa user_is_pro
CREATE FUNCTION public.user_is_pro(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_pro = TRUE
  );
END;
$$;

-- 6. Naprawa auto_populate_catalog
CREATE FUNCTION public.auto_populate_catalog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.catalog_items (
    user_id,
    category_id,
    name,
    description,
    unit,
    base_labor_price,
    base_material_price,
    is_assembly_parent,
    is_active,
    sort_order
  )
  SELECT
    NEW.id,
    category_id,
    name,
    description,
    unit,
    base_labor_price,
    base_material_price,
    is_assembly_parent,
    is_active,
    sort_order
  FROM public.catalog_items
  WHERE user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- 7. Naprawa copy_catalog_items_for_user
CREATE FUNCTION public.copy_catalog_items_for_user(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  copied_count INTEGER;
BEGIN
  INSERT INTO public.catalog_items (
    user_id,
    category_id,
    name,
    description,
    unit,
    base_labor_price,
    base_material_price,
    is_assembly_parent,
    is_active,
    sort_order
  )
  SELECT
    target_user_id,
    category_id,
    name,
    description,
    unit,
    base_labor_price,
    base_material_price,
    is_assembly_parent,
    is_active,
    sort_order
  FROM public.catalog_items
  WHERE user_id IS NULL
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS copied_count = ROW_COUNT;
  RETURN copied_count;
END;
$$;

-- 8. Naprawa get_user_catalog_items
CREATE FUNCTION public.get_user_catalog_items(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  name TEXT,
  description TEXT,
  unit TEXT,
  base_labor_price NUMERIC,
  base_material_price NUMERIC,
  is_assembly_parent BOOLEAN,
  is_active BOOLEAN,
  sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.category_id,
    ci.name,
    ci.description,
    ci.unit,
    ci.base_labor_price,
    ci.base_material_price,
    ci.is_assembly_parent,
    ci.is_active,
    ci.sort_order
  FROM public.catalog_items ci
  WHERE ci.user_id = target_user_id OR ci.user_id IS NULL
  ORDER BY ci.sort_order, ci.name;
END;
$$;

-- Przywracamy wyzwalacze
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Komentarze
COMMENT ON FUNCTION public.handle_updated_at() IS 'Aktualizuje pole updated_at przy zmianie rekordu (naprawione bezpieczeństwo)';
COMMENT ON FUNCTION public.handle_new_user() IS 'Tworzy profil użytkownika przy rejestracji (naprawione bezpieczeństwo)';
COMMENT ON FUNCTION public.user_is_pro(UUID) IS 'Sprawdza status PRO użytkownika (naprawione bezpieczeństwo)';
COMMENT ON FUNCTION public.auto_populate_catalog() IS 'Automatycznie wypełnia katalog dla nowego użytkownika (naprawione bezpieczeństwo)';
COMMENT ON FUNCTION public.copy_catalog_items_for_user(UUID) IS 'Kopiuje globalne elementy katalogu dla użytkownika (naprawione bezpieczeństwo)';
COMMENT ON FUNCTION public.get_user_catalog_items(UUID) IS 'Pobiera elementy katalogu użytkownika (naprawione bezpieczeństwo)';
