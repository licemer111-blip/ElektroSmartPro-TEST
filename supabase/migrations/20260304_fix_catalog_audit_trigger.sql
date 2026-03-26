-- ============================================================
-- Fix: fn_catalog_items_audit — skip user-owned items + safe EXCEPTION
-- Root cause: trigger had no WHEN clause, fired on ALL rows.
-- Original intent (comment): "tylko globalne — user_id IS NULL"
-- When DELETE was called on a user-owned item, the trigger fired
-- and any INSERT failure into catalog_audit_logs rolled back the
-- entire DELETE, surfacing as "Nie udało się usunąć pozycji".
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_catalog_items_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op           audit_operation;
  v_name         TEXT;
  v_item_user_id UUID;
BEGIN
  -- ── Guard: only audit GLOBAL items (user_id IS NULL) ──────────────────
  -- User-owned items are not audited — return early to never block DML.
  IF TG_OP = 'DELETE' THEN
    v_item_user_id := OLD.user_id;
  ELSE
    v_item_user_id := NEW.user_id;
  END IF;

  IF v_item_user_id IS NOT NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  -- ──────────────────────────────────────────────────────────────────────

  IF    TG_OP = 'INSERT' THEN v_op := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN v_op := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN v_op := 'DELETE';
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_name := OLD.name;
  ELSE
    v_name := NEW.name;
  END IF;

  -- ── EXCEPTION block: audit failures must NEVER block user DML ─────────
  BEGIN
    INSERT INTO public.catalog_audit_logs (
      operation,
      item_id,
      item_name,
      changed_by,
      old_mat_price, new_mat_price,
      old_lab_price, new_lab_price,
      old_conf_level, new_conf_level,
      old_trend, new_trend,
      old_data, new_data
    ) VALUES (
      v_op,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      v_name,
      auth.uid(),
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN OLD.base_material_price ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT','UPDATE')  THEN NEW.base_material_price ELSE NULL END,
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN OLD.base_labor_price    ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT','UPDATE')  THEN NEW.base_labor_price    ELSE NULL END,
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN OLD.confidence_level::TEXT ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT','UPDATE')  THEN NEW.confidence_level::TEXT ELSE NULL END,
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN OLD.price_trend::TEXT ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT','UPDATE')  THEN NEW.price_trend::TEXT ELSE NULL END,
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT','UPDATE')  THEN to_jsonb(NEW) ELSE NULL END
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently swallow audit errors — never let them roll back user actions
    NULL;
  END;
  -- ──────────────────────────────────────────────────────────────────────

  RETURN COALESCE(NEW, OLD);
END;
$$;
