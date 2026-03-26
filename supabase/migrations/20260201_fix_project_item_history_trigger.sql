-- ============================================================================
-- 🔧 Исправление триггера логирования изменений позиций
-- ============================================================================
-- Дата: 2026-02-01
-- Исправляет ошибки:
-- 1. "record old_record is not assigned yet" при INSERT
-- 2. "null value in column user_id" - auth.uid() возвращает NULL в триггере
-- ============================================================================

-- Сначала делаем user_id опциональным в таблице истории
ALTER TABLE public.project_item_history 
  ALTER COLUMN user_id DROP NOT NULL;

-- Исправленная функция для логирования изменений позиций
CREATE OR REPLACE FUNCTION log_project_item_change()
RETURNS TRIGGER AS $$
DECLARE
  changes TEXT[] := '{}';
  v_user_id UUID;
  v_project_user_id UUID;
BEGIN
  -- Пытаемся получить user_id из разных источников
  v_user_id := auth.uid();
  
  -- Если auth.uid() NULL, пытаемся получить владельца проекта
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_project_user_id
    FROM public.projects
    WHERE id = COALESCE(NEW.project_id, OLD.project_id)
    LIMIT 1;
    
    v_user_id := v_project_user_id;
  END IF;

  -- Определяем какие поля изменились (только для UPDATE)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      changes := array_append(changes, 'name');
    END IF;
    IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
      changes := array_append(changes, 'quantity');
    END IF;
    IF OLD.unit IS DISTINCT FROM NEW.unit THEN
      changes := array_append(changes, 'unit');
    END IF;
    IF OLD.material_price IS DISTINCT FROM NEW.material_price THEN
      changes := array_append(changes, 'material_price');
    END IF;
    IF OLD.labor_price IS DISTINCT FROM NEW.labor_price THEN
      changes := array_append(changes, 'labor_price');
    END IF;
    IF OLD.final_material_price IS DISTINCT FROM NEW.final_material_price THEN
      changes := array_append(changes, 'final_material_price');
    END IF;
    IF OLD.final_labor_price IS DISTINCT FROM NEW.final_labor_price THEN
      changes := array_append(changes, 'final_labor_price');
    END IF;
  END IF;

  -- Записываем в историю
  INSERT INTO public.project_item_history (
    project_item_id,
    user_id,
    action,
    old_name,
    old_quantity,
    old_unit,
    old_material_price,
    old_labor_price,
    old_final_material_price,
    old_final_labor_price,
    new_name,
    new_quantity,
    new_unit,
    new_material_price,
    new_labor_price,
    new_final_material_price,
    new_final_labor_price,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    v_user_id,
    -- Преобразуем TG_OP в правильный формат для constraint
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    -- Старые значения (только для UPDATE и DELETE)
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.name ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.quantity ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.unit ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.material_price ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.labor_price ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.final_material_price ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.final_labor_price ELSE NULL END,
    -- Новые значения (только для INSERT и UPDATE)
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.name ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.quantity ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.unit ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.material_price ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.labor_price ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.final_material_price ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.final_labor_price ELSE NULL END,
    changes
  );

  -- Возвращаем результат для триггера
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================================================
