-- =====================================================
-- FIX: Correct trigger to match table structure
-- =====================================================
-- Date: 2026-02-01
-- Issue: Trigger uses wrong column names (old_values/new_values don't exist)
-- Solution: Use correct column names from project_item_history table
-- =====================================================

-- First, change ON DELETE CASCADE to SET NULL for project_item_id
-- This allows history to persist after item deletion
ALTER TABLE public.project_item_history 
  DROP CONSTRAINT IF EXISTS project_item_history_project_item_id_fkey;

ALTER TABLE public.project_item_history
  ADD CONSTRAINT project_item_history_project_item_id_fkey
  FOREIGN KEY (project_item_id)
  REFERENCES public.project_items(id)
  ON DELETE SET NULL;

-- Make project_item_id nullable
ALTER TABLE public.project_item_history
  ALTER COLUMN project_item_id DROP NOT NULL;

-- Recreate the trigger function with correct column names
CREATE OR REPLACE FUNCTION log_project_item_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  changed_fields_array TEXT[] := '{}';
BEGIN
  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    INSERT INTO project_item_history (
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
      changed_fields
    ) VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      OLD.name,
      OLD.quantity,
      OLD.unit,
      OLD.material_price,
      OLD.labor_price,
      OLD.final_material_price,
      OLD.final_labor_price,
      ARRAY['deleted']
    );
    RETURN OLD;
  END IF;

  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_item_history (
      project_item_id,
      user_id,
      action,
      new_name,
      new_quantity,
      new_unit,
      new_material_price,
      new_labor_price,
      new_final_material_price,
      new_final_labor_price,
      changed_fields
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NEW.name,
      NEW.quantity,
      NEW.unit,
      NEW.material_price,
      NEW.labor_price,
      NEW.final_material_price,
      NEW.final_labor_price,
      ARRAY['created']
    );
    RETURN NEW;
  END IF;

  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Track which fields changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      changed_fields_array := array_append(changed_fields_array, 'name');
    END IF;
    IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
      changed_fields_array := array_append(changed_fields_array, 'quantity');
    END IF;
    IF OLD.material_price IS DISTINCT FROM NEW.material_price THEN
      changed_fields_array := array_append(changed_fields_array, 'material_price');
    END IF;
    IF OLD.labor_price IS DISTINCT FROM NEW.labor_price THEN
      changed_fields_array := array_append(changed_fields_array, 'labor_price');
    END IF;

    -- Only log if something actually changed
    IF array_length(changed_fields_array, 1) > 0 THEN
      INSERT INTO project_item_history (
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
        NEW.id,
        auth.uid(),
        'updated',
        OLD.name,
        OLD.quantity,
        OLD.unit,
        OLD.material_price,
        OLD.labor_price,
        OLD.final_material_price,
        OLD.final_labor_price,
        NEW.name,
        NEW.quantity,
        NEW.unit,
        NEW.material_price,
        NEW.labor_price,
        NEW.final_material_price,
        NEW.final_labor_price,
        changed_fields_array
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS project_items_history_trigger ON public.project_items;
CREATE TRIGGER project_items_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION log_project_item_change();

-- Verify
SELECT 'Trigger fixed with correct column names and SET NULL on delete!' as status;
