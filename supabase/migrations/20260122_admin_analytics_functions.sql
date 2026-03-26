-- Admin Analytics: RPC Functions for analyzing user-generated data
-- Created: 2026-01-22

-- =====================================================
-- FUNCTION 1: Get Custom Items Analytics
-- Aggregates custom items (not linked to global catalog)
-- =====================================================
CREATE OR REPLACE FUNCTION get_custom_items_analytics()
RETURNS TABLE (
  item_name TEXT,
  usage_count BIGINT,
  avg_material_price NUMERIC,
  avg_labor_price NUMERIC,
  users_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    LOWER(TRIM(pi.name)) AS item_name,
    COUNT(pi.id) AS usage_count,
    ROUND(AVG(pi.final_material_price)::NUMERIC, 2) AS avg_material_price,
    ROUND(AVG(pi.final_labor_price)::NUMERIC, 2) AS avg_labor_price,
    COUNT(DISTINCT p.user_id) AS users_count
  FROM 
    public.project_items pi
  INNER JOIN 
    public.projects p ON pi.project_id = p.id
  WHERE 
    pi.catalog_item_id IS NULL  -- Only custom items (not linked to catalog)
    AND pi.name IS NOT NULL
    AND TRIM(pi.name) != ''
  GROUP BY 
    LOWER(TRIM(pi.name))
  HAVING 
    COUNT(pi.id) >= 2  -- Show items used at least twice
  ORDER BY 
    usage_count DESC
  LIMIT 100;
END;
$$;

-- =====================================================
-- FUNCTION 2: Get Price Deviation Analytics
-- Compare user prices with global catalog prices
-- =====================================================
CREATE OR REPLACE FUNCTION get_price_deviation_analytics()
RETURNS TABLE (
  catalog_id UUID,
  item_name TEXT,
  category_name TEXT,
  global_material_price NUMERIC,
  global_labor_price NUMERIC,
  user_avg_material_price NUMERIC,
  user_avg_labor_price NUMERIC,
  material_deviation_percent NUMERIC,
  labor_deviation_percent NUMERIC,
  usage_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id AS catalog_id,
    ci.name AS item_name,
    cc.name AS category_name,
    ci.base_material_price AS global_material_price,
    ci.base_labor_price AS global_labor_price,
    ROUND(AVG(pi.final_material_price)::NUMERIC, 2) AS user_avg_material_price,
    ROUND(AVG(pi.final_labor_price)::NUMERIC, 2) AS user_avg_labor_price,
    ROUND((((AVG(pi.final_material_price) - ci.base_material_price) / NULLIF(ci.base_material_price, 0)) * 100)::NUMERIC, 2) AS material_deviation_percent,
    ROUND((((AVG(pi.final_labor_price) - ci.base_labor_price) / NULLIF(ci.base_labor_price, 0)) * 100)::NUMERIC, 2) AS labor_deviation_percent,
    COUNT(pi.id) AS usage_count
  FROM 
    public.catalog_items ci
  INNER JOIN 
    public.catalog_categories cc ON ci.category_id = cc.id
  INNER JOIN 
    public.project_items pi ON pi.catalog_item_id = ci.id
  WHERE 
    ci.user_id IS NULL  -- Only global catalog items
    AND pi.final_material_price > 0
    AND pi.final_labor_price > 0
  GROUP BY 
    ci.id, ci.name, cc.name, ci.base_material_price, ci.base_labor_price
  HAVING 
    COUNT(pi.id) >= 3  -- At least 3 usages for statistical relevance
    AND (
      ABS((AVG(pi.final_material_price) - ci.base_material_price) / NULLIF(ci.base_material_price, 0)) > 0.10
      OR
      ABS((AVG(pi.final_labor_price) - ci.base_labor_price) / NULLIF(ci.base_labor_price, 0)) > 0.10
    )  -- Deviation > 10%
  ORDER BY 
    ABS(material_deviation_percent) + ABS(labor_deviation_percent) DESC
  LIMIT 100;
END;
$$;

-- Grant execute permissions to authenticated users (admin check is in app layer)
GRANT EXECUTE ON FUNCTION get_custom_items_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_price_deviation_analytics() TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Admin Analytics RPC Functions created successfully!';
END $$;
