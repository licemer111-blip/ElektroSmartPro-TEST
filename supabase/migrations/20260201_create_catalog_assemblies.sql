-- ============================================================================
-- 📦 Создание таблицы catalog_assemblies для zestawов
-- ============================================================================
-- Дата: 2026-02-01
-- Создает таблицу для связей zestawов с их компонентами
-- ============================================================================

-- Таблица для связей zestawов (сборок) с их компонентами
CREATE TABLE IF NOT EXISTS public.catalog_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  child_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parent_item_id, child_item_id)
);

-- Включаем RLS
ALTER TABLE public.catalog_assemblies ENABLE ROW LEVEL SECURITY;

-- RLS политики - все могут читать, только authenticated могут изменять
CREATE POLICY "catalog_assemblies_select" ON public.catalog_assemblies 
  FOR SELECT TO public USING (true);

CREATE POLICY "catalog_assemblies_all" ON public.catalog_assemblies 
  FOR ALL TO authenticated USING (true);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_catalog_assemblies_parent ON public.catalog_assemblies(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_catalog_assemblies_child ON public.catalog_assemblies(child_item_id);

-- ============================================================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================================================
