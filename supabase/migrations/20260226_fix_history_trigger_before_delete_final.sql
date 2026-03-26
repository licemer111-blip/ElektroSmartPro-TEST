-- ============================================================================
-- FINAL FIX: project_item_history trigger must be BEFORE DELETE (not AFTER)
-- Root cause: old AFTER DELETE trigger tries to INSERT history with project_item_id
--             that was already deleted → FK violation (code 23503)
-- Solution:
--   1. Drop ALL existing triggers on project_items (any timing/event combination)
--   2. Recreate FK with ON DELETE SET NULL
--   3. Recreate trigger as BEFORE DELETE SECURITY DEFINER
-- ============================================================================

-- Step 1: Drop all existing triggers on project_items to start clean
DROP TRIGGER IF EXISTS log_project_item_change_trigger ON public.project_items;
DROP TRIGGER IF EXISTS project_item_history_trigger ON public.project_items;
DROP TRIGGER IF EXISTS log_project_item_change ON public.project_items;
DROP TRIGGER IF EXISTS trg_project_item_history ON public.project_items;

-- Step 2: Ensure FK is ON DELETE SET NULL (so old history rows don't block delete)
ALTER TABLE public.project_item_history
  ALTER COLUMN project_item_id DROP NOT NULL;

ALTER TABLE public.project_item_history
  DROP CONSTRAINT IF EXISTS project_item_history_project_item_id_fkey CASCADE;

ALTER TABLE public.project_item_history
  ADD CONSTRAINT project_item_history_project_item_id_fkey
  FOREIGN KEY (project_item_id)
  REFERENCES public.project_items(id)
  ON DELETE SET NULL;

-- Step 3: Ensure user_id is nullable (Server Actions use service role → auth.uid() = NULL)
ALTER TABLE public.project_item_history
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Recreate trigger function (SECURITY DEFINER, handles NULL auth.uid())
CREATE OR REPLACE FUNCTION log_project_item_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  changed_fields_array TEXT[] := '{}';
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- BEFORE DELETE: item still exists in project_items → FK is valid
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
      v_user_id,
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
      v_user_id,
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
    IF OLD.final_material_price IS DISTINCT FROM NEW.final_material_price THEN
      changed_fields_array := array_append(changed_fields_array, 'final_material_price');
    END IF;
    IF OLD.final_labor_price IS DISTINCT FROM NEW.final_labor_price THEN
      changed_fields_array := array_append(changed_fields_array, 'final_labor_price');
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
        v_user_id,
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

-- Step 5: Attach trigger — BEFORE for DELETE (critical!), AFTER for INSERT/UPDATE
CREATE TRIGGER log_project_item_change_trigger
  BEFORE DELETE
  ON public.project_items
  FOR EACH ROW
  EXECUTE FUNCTION log_project_item_change();

CREATE TRIGGER log_project_item_change_trigger_ins_upd
  AFTER INSERT OR UPDATE
  ON public.project_items
  FOR EACH ROW
  EXECUTE FUNCTION log_project_item_change();

-- Verify
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  'OK' as status
FROM information_schema.triggers
WHERE event_object_table = 'project_items'
  AND trigger_schema = 'public'
ORDER BY trigger_name, event_manipulation;
