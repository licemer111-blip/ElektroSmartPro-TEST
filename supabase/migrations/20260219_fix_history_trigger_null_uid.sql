-- ============================================================================
-- FIX: History trigger fails when auth.uid() is NULL (Server Actions context)
-- ============================================================================
-- Problem: log_project_item_change() calls auth.uid() which returns NULL in
--          Server Action context (SSR Supabase client). The INSERT into
--          project_item_history then violates RLS policy, rolling back the
--          entire UPDATE on project_items silently (error is swallowed by
--          the SECURITY DEFINER context but the transaction is aborted).
-- Solution: Wrap history INSERT in a NULL check — skip logging if no auth ctx.
-- ============================================================================

CREATE OR REPLACE FUNCTION log_project_item_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  changes TEXT[] := '{}';
  current_uid UUID;
BEGIN
  -- Get current user — may be NULL in server-side contexts
  current_uid := auth.uid();

  -- If no auth context, still perform the DML but skip history logging
  IF current_uid IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO project_item_history (
      project_item_id, user_id, action, old_values, new_values, changes
    ) VALUES (
      OLD.id, current_uid, 'deleted',
      row_to_json(OLD)::jsonb, NULL, ARRAY['Item deleted']
    );
    RETURN OLD;
  END IF;

  -- INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_item_history (
      project_item_id, user_id, action, old_values, new_values, changes
    ) VALUES (
      NEW.id, current_uid, 'created',
      NULL, row_to_json(NEW)::jsonb, ARRAY['Item created']
    );
    RETURN NEW;
  END IF;

  -- UPDATE
  IF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      changes := array_append(changes, 'name');
    END IF;
    IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
      changes := array_append(changes, 'quantity');
    END IF;
    IF OLD.material_price IS DISTINCT FROM NEW.material_price THEN
      changes := array_append(changes, 'material_price');
    END IF;
    IF OLD.labor_price IS DISTINCT FROM NEW.labor_price THEN
      changes := array_append(changes, 'labor_price');
    END IF;

    INSERT INTO project_item_history (
      project_item_id, user_id, action, old_values, new_values, changes
    ) VALUES (
      NEW.id, current_uid, 'updated',
      row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, changes
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger (no change needed, just ensure it's current)
DROP TRIGGER IF EXISTS project_items_history_trigger ON public.project_items;
CREATE TRIGGER project_items_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.project_items
  FOR EACH ROW EXECUTE FUNCTION log_project_item_change();
