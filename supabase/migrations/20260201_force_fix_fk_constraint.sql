-- =====================================================
-- FORCE FIX: Change FK constraint to SET NULL
-- =====================================================
-- Date: 2026-02-01
-- Issue: FK constraint still ON DELETE CASCADE
-- Error: Key is not present in table "project_items"
-- =====================================================

-- Step 1: Make project_item_id nullable first
ALTER TABLE public.project_item_history
  ALTER COLUMN project_item_id DROP NOT NULL;

-- Step 2: Drop the constraint (try all possible names)
DO $$ 
BEGIN
  -- Try to drop constraint with various possible names
  EXECUTE 'ALTER TABLE public.project_item_history DROP CONSTRAINT IF EXISTS project_item_history_project_item_id_fkey CASCADE';
  EXECUTE 'ALTER TABLE public.project_item_history DROP CONSTRAINT IF EXISTS project_item_history_project_item_id_fkey1 CASCADE';
  EXECUTE 'ALTER TABLE public.project_item_history DROP CONSTRAINT IF EXISTS fk_project_item CASCADE';
END $$;

-- Step 3: Add new constraint with SET NULL
ALTER TABLE public.project_item_history
  ADD CONSTRAINT project_item_history_project_item_id_fkey
  FOREIGN KEY (project_item_id)
  REFERENCES public.project_items(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Step 4: Verify the constraint
SELECT 
  conname as constraint_name,
  confdeltype as on_delete_action,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END as delete_action_name
FROM pg_constraint
WHERE conname LIKE '%project_item_history%'
AND contype = 'f';

-- Step 5: Update trigger to be SECURITY DEFINER
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

-- Recreate trigger
DROP TRIGGER IF EXISTS project_items_history_trigger ON public.project_items;
CREATE TRIGGER project_items_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION log_project_item_change();

-- Final verification
SELECT 'FK constraint should now be SET NULL (n):' as info;
SELECT 
  conname,
  confdeltype,
  CASE confdeltype
    WHEN 'n' THEN '✅ SET NULL - CORRECT!'
    WHEN 'c' THEN '❌ CASCADE - WRONG!'
    ELSE '⚠️ OTHER'
  END as status
FROM pg_constraint
WHERE conname = 'project_item_history_project_item_id_fkey';
