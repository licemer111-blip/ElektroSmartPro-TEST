-- ============================================================================
-- FIX: project_item_history trigger fails when auth.uid() is NULL
-- Root cause: Server Actions run with service role — auth.uid() = NULL
-- This causes NOT NULL violation on user_id column → INSERT rollback
-- Solution: Make user_id nullable + use COALESCE in trigger
-- ============================================================================

-- Step 1: Make user_id nullable (was NOT NULL)
ALTER TABLE public.project_item_history
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop FK to auth.users (nullable FK needs no change, but re-add safely)
ALTER TABLE public.project_item_history
  DROP CONSTRAINT IF EXISTS project_item_history_user_id_fkey;

ALTER TABLE public.project_item_history
  ADD CONSTRAINT project_item_history_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Step 3: Replace trigger function — use COALESCE so NULL auth.uid() doesn't crash
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
  -- auth.uid() can be NULL when called from Server Actions (service role context)
  v_user_id := auth.uid();

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

SELECT '✅ History trigger fixed: user_id now nullable, auth.uid() NULL no longer crashes INSERT' as status;
