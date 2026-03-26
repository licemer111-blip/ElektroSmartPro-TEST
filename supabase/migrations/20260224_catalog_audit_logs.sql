-- ============================================================
-- ElektroSmart PRO — Catalog Audit Logs
-- Cel: Śledzenie wszystkich zmian w catalog_items przez admina
-- Tabela: catalog_audit_logs
-- Trigger: catalog_items_audit_trigger
-- ============================================================

-- 1. Typ operacji
DO $$ BEGIN
  CREATE TYPE audit_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabela logów
CREATE TABLE IF NOT EXISTS public.catalog_audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation      audit_operation NOT NULL,
  item_id        UUID NOT NULL,
  item_name      TEXT NOT NULL DEFAULT '',
  changed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Snapshot pól które zmieniamy najczęściej
  old_mat_price  NUMERIC(10,2),
  new_mat_price  NUMERIC(10,2),
  old_lab_price  NUMERIC(10,2),
  new_lab_price  NUMERIC(10,2),
  old_conf_level TEXT,
  new_conf_level TEXT,
  old_trend      TEXT,
  new_trend      TEXT,

  -- JSON diff dla pełnego audytu
  old_data       JSONB,
  new_data       JSONB,

  -- Opcjonalny komentarz (np. z AI batch)
  note           TEXT
);

-- 3. Indeksy
CREATE INDEX IF NOT EXISTS idx_catalog_audit_item_id
  ON public.catalog_audit_logs (item_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalog_audit_changed_by
  ON public.catalog_audit_logs (changed_by, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalog_audit_changed_at
  ON public.catalog_audit_logs (changed_at DESC);

-- 4. RLS — tylko admini mogą czytać
ALTER TABLE public.catalog_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.catalog_audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.catalog_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- System/trigger może pisać bez RLS
DROP POLICY IF EXISTS "System can insert audit logs" ON public.catalog_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.catalog_audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- 5. Funkcja trigger
CREATE OR REPLACE FUNCTION public.fn_catalog_items_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op    audit_operation;
  v_name  TEXT;
BEGIN
  IF    TG_OP = 'INSERT' THEN v_op := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN v_op := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN v_op := 'DELETE';
  END IF;

  -- Nazwa pozycji
  IF TG_OP = 'DELETE' THEN
    v_name := OLD.name;
  ELSE
    v_name := NEW.name;
  END IF;

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

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Attach trigger do catalog_items (tylko globalne — user_id IS NULL)
DROP TRIGGER IF EXISTS catalog_items_audit_trigger ON public.catalog_items;
CREATE TRIGGER catalog_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_catalog_items_audit();

-- 7. Helper: ostatnie N logów z JOIN na item
CREATE OR REPLACE FUNCTION public.get_catalog_audit_logs(
  p_limit  INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_item_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id             UUID,
  operation      TEXT,
  item_id        UUID,
  item_name      TEXT,
  changed_by     UUID,
  changed_at     TIMESTAMPTZ,
  old_mat_price  NUMERIC,
  new_mat_price  NUMERIC,
  old_lab_price  NUMERIC,
  new_lab_price  NUMERIC,
  old_conf_level TEXT,
  new_conf_level TEXT,
  old_trend      TEXT,
  new_trend      TEXT,
  note           TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id, l.operation::TEXT, l.item_id, l.item_name,
    l.changed_by, l.changed_at,
    l.old_mat_price, l.new_mat_price,
    l.old_lab_price, l.new_lab_price,
    l.old_conf_level, l.new_conf_level,
    l.old_trend, l.new_trend,
    l.note
  FROM public.catalog_audit_logs l
  WHERE (p_item_id IS NULL OR l.item_id = p_item_id)
  ORDER BY l.changed_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;
