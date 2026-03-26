-- =====================================================
-- FIX: Make history trigger SECURITY DEFINER
-- =====================================================
-- Date: 2026-02-01
-- Issue: Trigger can't write to project_item_history due to RLS
-- Solution: Make trigger function SECURITY DEFINER to bypass RLS
-- =====================================================

-- Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_project_item_change()
RETURNS TRIGGER
SECURITY DEFINER  -- This bypasses RLS!
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  changes TEXT[] := '{}';
  old_values JSONB;
  new_values JSONB;
BEGIN
  -- For DELETE operations, use OLD values
  IF TG_OP = 'DELETE' THEN
    INSERT INTO project_item_history (
      project_item_id,
      user_id,
      action,
      old_values,
      new_values,
      changes
    ) VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      row_to_json(OLD)::jsonb,
      NULL,
      ARRAY['Item deleted']
    );
    RETURN OLD;
  END IF;

  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_item_history (
      project_item_id,
      user_id,
      action,
      old_values,
      new_values,
      changes
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NULL,
      row_to_json(NEW)::jsonb,
      ARRAY['Item created']
    );
    RETURN NEW;
  END IF;

  -- For UPDATE operations, track changes
  IF TG_OP = 'UPDATE' THEN
    -- Track what changed
    IF OLD.name != NEW.name THEN
      changes := array_append(changes, 'name');
    END IF;
    IF OLD.quantity != NEW.quantity THEN
      changes := array_append(changes, 'quantity');
    END IF;
    IF OLD.material_price != NEW.material_price THEN
      changes := array_append(changes, 'material_price');
    END IF;
    IF OLD.labor_price != NEW.labor_price THEN
      changes := array_append(changes, 'labor_price');
    END IF;

    INSERT INTO project_item_history (
      project_item_id,
      user_id,
      action,
      old_values,
      new_values,
      changes
    ) VALUES (
      NEW.id,
      auth.uid(),
      'updated',
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
      changes
    );
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

-- Verify the function is SECURITY DEFINER
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc 
WHERE proname = 'log_project_item_change';

-- Test message
SELECT 'Trigger function updated with SECURITY DEFINER - should bypass RLS now!' as status;
