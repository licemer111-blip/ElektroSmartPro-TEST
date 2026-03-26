-- ============================================================================
-- 🔒 Исправление RLS политик для продакшена
-- ============================================================================
-- Дата: 2026-01-19
-- Проблема: Пользователи не могут видеть глобальный каталог (403 ошибки)
-- Решение: Исправить политику для catalog_items чтобы разрешить просмотр глобальных элементов
-- ============================================================================

-- 1. Исправление политики для catalog_items (КРИТИЧНО!)
-- Удаляем старую неправильную политику
DROP POLICY IF EXISTS "Users can view own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view their own catalog items" ON public.catalog_items;

-- Создаем правильную политику: разрешает глобальные (user_id IS NULL) И собственные
CREATE POLICY "Users can view global and own catalog items"
  ON public.catalog_items FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Комментарий
COMMENT ON POLICY "Users can view global and own catalog items" ON public.catalog_items 
IS 'Позволяет пользователям видеть глобальный каталог (user_id IS NULL) и свои собственные элементы';
