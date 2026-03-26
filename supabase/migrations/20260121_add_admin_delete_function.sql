-- Migration: Add admin function to delete ALL catalog items (bypasses RLS)
-- Date: 2026-01-21
-- Purpose: Allow full catalog reset through UI button

-- ============================================================================
-- FUNCTION: admin_delete_all_catalog_items()
-- This function bypasses RLS and deletes ALL catalog items (global + user)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_all_catalog_items()
RETURNS TABLE(deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count bigint;
BEGIN
  -- Count items before deletion
  SELECT COUNT(*) INTO item_count FROM public.catalog_items;
  
  -- STEP 1: Unlink all project_items from catalog_items (set catalog_item_id to NULL)
  -- This preserves user projects but detaches them from old catalog
  UPDATE public.project_items 
  SET catalog_item_id = NULL 
  WHERE catalog_item_id IS NOT NULL;
  
  -- STEP 2: Delete ALL catalog items (global + user items) - bypasses RLS
  DELETE FROM public.catalog_items;
  
  -- Return count
  RETURN QUERY SELECT item_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_all_catalog_items() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.admin_delete_all_catalog_items() IS 
'Deletes ALL catalog items (global + user). Bypasses RLS. Use for full database reset only.';
