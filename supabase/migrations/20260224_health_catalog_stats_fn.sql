-- ============================================================
-- health_catalog_stats() — aggregate function for Health Monitor
-- Bypasses PostgREST 1000-row default limit by grouping on DB side
-- Returns one row per panel_category with counts and avg prices
-- ============================================================
CREATE OR REPLACE FUNCTION public.health_catalog_stats()
RETURNS TABLE (
  panel_category   TEXT,
  item_count       BIGINT,
  avg_mat          NUMERIC,
  avg_lab          NUMERIC,
  with_knr         BIGINT,
  verified_count   BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    panel_category,
    COUNT(*)                                                      AS item_count,
    COALESCE(AVG(NULLIF(base_material_price, 0)), 0)              AS avg_mat,
    COALESCE(AVG(NULLIF(base_labor_price, 0)), 0)                 AS avg_lab,
    COUNT(CASE WHEN knr_code IS NOT NULL THEN 1 END)              AS with_knr,
    COUNT(CASE WHEN catalog_confidence = 'verified' THEN 1 END)   AS verified_count
  FROM public.catalog_items
  WHERE is_active = true
    AND panel_category IS NOT NULL
  GROUP BY panel_category
  ORDER BY item_count DESC;
$$;

GRANT EXECUTE ON FUNCTION public.health_catalog_stats() TO anon, authenticated, service_role;
