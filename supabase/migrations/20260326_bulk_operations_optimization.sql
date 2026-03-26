-- =====================================================
-- BULK OPERATIONS OPTIMIZATION
-- CPU Usage Reduction for Vercel
-- =====================================================

-- Function 1: Bulk update item prices
-- Replaces N individual UPDATE queries with single RPC call
CREATE OR REPLACE FUNCTION update_item_prices_bulk(
  items_data JSONB,
  p_project_id UUID
) RETURNS VOID AS $$
DECLARE
  item_record RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Security check: ensure user owns the project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User does not own this project';
  END IF;

  -- Bulk update using jsonb_to_recordset for performance
  FOR item_record IN 
    SELECT * FROM jsonb_to_recordset(items_data) AS t(
      id TEXT,
      material_price NUMERIC,
      labor_price NUMERIC,
      final_material_price NUMERIC,
      final_labor_price NUMERIC
    )
  LOOP
    UPDATE project_items 
    SET 
      material_price = item_record.material_price,
      labor_price = item_record.labor_price,
      final_material_price = item_record.final_material_price,
      final_labor_price = item_record.final_labor_price,
      confidence_level = NULL,
      updated_at = NOW()
    WHERE 
      id = item_record.id::UUID 
      AND project_id = p_project_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Bulk update sort order
-- Replaces N individual UPDATE queries with single RPC call
CREATE OR REPLACE FUNCTION update_sort_order_bulk(
  items_data JSONB,
  p_project_id UUID
) RETURNS VOID AS $$
DECLARE
  item_record RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Security check: ensure user owns the project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User does not own this project';
  END IF;

  -- Bulk update using jsonb_to_recordset for performance
  FOR item_record IN 
    SELECT * FROM jsonb_to_recordset(items_data) AS t(
      id TEXT,
      sort_order INTEGER
    )
  LOOP
    UPDATE project_items 
    SET 
      sort_order = item_record.sort_order,
      updated_at = NOW()
    WHERE 
      id = item_record.id::UUID 
      AND project_id = p_project_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Bulk insert project items (for import operations)
CREATE OR REPLACE FUNCTION insert_project_items_bulk(
  items_data JSONB,
  p_project_id UUID
) RETURNS VOID AS $$
DECLARE
  item_record RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Security check: ensure user owns the project
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User does not own this project';
  END IF;

  -- Check if project is not locked
  IF EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND status = 'final'
  ) THEN
    RAISE EXCEPTION 'Project is locked. Cannot import items.';
  END IF;

  -- Bulk insert using jsonb_to_recordset for performance
  INSERT INTO project_items (
    project_id,
    name,
    unit,
    quantity,
    final_material_price,
    final_labor_price,
    catalog_item_id,
    section,
    knr_code,
    knr_source,
    labor_norm,
    labor_hours_total,
    sort_order,
    is_custom,
    created_at,
    updated_at
  )
  SELECT 
    p_project_id,
    item_record.name,
    item_record.unit,
    item_record.quantity,
    item_record.final_material_price,
    item_record.final_labor_price,
    item_record.catalog_item_id,
    item_record.section,
    item_record.knr_code,
    item_record.knr_source,
    item_record.labor_norm,
    item_record.labor_hours_total,
    item_record.sort_order,
    COALESCE(item_record.is_custom, true),
    NOW(),
    NOW()
  FROM jsonb_to_recordset(items_data) AS t(
    name TEXT,
    unit TEXT,
    quantity NUMERIC,
    final_material_price NUMERIC,
    final_labor_price NUMERIC,
    catalog_item_id UUID,
    section TEXT,
    knr_code TEXT,
    knr_source TEXT,
    labor_norm NUMERIC,
    labor_hours_total NUMERIC,
    sort_order INTEGER,
    is_custom BOOLEAN
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERFORMANCE INDEXES (if not exists)
-- =====================================================

-- Index for bulk operations performance
CREATE INDEX IF NOT EXISTS idx_project_items_project_id_sort 
ON project_items(project_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_project_items_project_id_updated 
ON project_items(project_id, updated_at);

-- Index for user assemblies bulk operations
CREATE INDEX IF NOT EXISTS idx_user_assemblies_user_id_category 
ON user_assemblies(user_id, category_id);

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_item_prices_bulk TO authenticated;
GRANT EXECUTE ON FUNCTION update_sort_order_bulk TO authenticated;
GRANT EXECUTE ON FUNCTION insert_project_items_bulk TO authenticated;
