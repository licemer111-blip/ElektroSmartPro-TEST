-- =====================================================
-- FINAL FIX: Change trigger to BEFORE DELETE
-- =====================================================
-- Date: 2026-02-01
-- Issue: AFTER DELETE trigger tries to insert history after item is deleted
-- Solution: Use BEFORE DELETE so history is saved while item still exists
-- =====================================================

-- Step 1: Make project_item_id nullable (for old history records)
ALTER TABLE public.project_item_history
  ALTER COLUMN project_item_id DROP NOT NULL;

-- Step 2: Change FK to SET NULL (for safety, though not needed with BEFORE DELETE)
ALTER TABLE public.project_item_history 
  DROP CONSTRAINT IF EXISTS project_item_history_project_item_id_fkey CASCADE;

ALTER TABLE public.project_item_history
  ADD CONSTRAINT project_item_history_project_item_id_fkey
  FOREIGN KEY (project_item_id)
  REFERENCES public.project_items(id)
  ON DELETE SET NULL;

-- Step 3: Create trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_project_item_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  changed_fields_array TEXT[] := '{}';
BEGIN
  -- For DELETE operations (BEFORE DELETE)
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

-- Step 4: Recreate triggers (separate BEFORE and AFTER)
DROP TRIGGER IF EXISTS project_items_history_trigger ON public.project_items;
DROP TRIGGER IF EXISTS project_items_history_delete_trigger ON public.project_items;
DROP TRIGGER IF EXISTS project_items_history_insert_update_trigger ON public.project_items;

-- BEFORE DELETE trigger (logs before item is deleted)
CREATE TRIGGER project_items_history_delete_trigger
  BEFORE DELETE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION log_project_item_change();

-- AFTER INSERT OR UPDATE trigger (logs after changes are committed)
CREATE TRIGGER project_items_history_insert_update_trigger
  AFTER INSERT OR UPDATE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION log_project_item_change();

-- Step 5: Verify setup
SELECT '✅ Trigger recreated with BEFORE DELETE!' as status;

SELECT 
  'Trigger timing:' as info,
  tgname as trigger_name,
  CASE 
    WHEN tgtype::integer & 2 = 2 THEN 'BEFORE'
    WHEN tgtype::integer & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as timing,
  CASE 
    WHEN tgtype::integer & 4 = 4 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype::integer & 8 = 8 THEN 'DELETE '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype::integer & 16 = 16 THEN 'UPDATE '
    ELSE ''
  END as events
FROM pg_trigger
WHERE tgname = 'project_items_history_trigger';
