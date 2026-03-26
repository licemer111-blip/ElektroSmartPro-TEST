-- =====================================================
-- Add ability to hide global catalog items per user
-- User can hide items they don't need without deleting them
-- =====================================================

-- Create table for hidden items
CREATE TABLE IF NOT EXISTS public.hidden_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure user can't hide same item twice
  UNIQUE(user_id, catalog_item_id)
);

-- Add indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_hidden_catalog_items_user_id 
ON public.hidden_catalog_items(user_id);

CREATE INDEX IF NOT EXISTS idx_hidden_catalog_items_catalog_item_id 
ON public.hidden_catalog_items(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_hidden_catalog_items_user_catalog 
ON public.hidden_catalog_items(user_id, catalog_item_id);

-- Add comments
COMMENT ON TABLE public.hidden_catalog_items IS 
'Tracks which global catalog items each user has hidden. Hidden items are not shown in catalog or market.';

COMMENT ON COLUMN public.hidden_catalog_items.user_id IS 
'User who hid this item';

COMMENT ON COLUMN public.hidden_catalog_items.catalog_item_id IS 
'The catalog item that was hidden';

COMMENT ON COLUMN public.hidden_catalog_items.hidden_at IS 
'When the item was hidden';

-- Enable RLS
ALTER TABLE public.hidden_catalog_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Users can view own hidden items" ON public.hidden_catalog_items;
DROP POLICY IF EXISTS "Users can hide items" ON public.hidden_catalog_items;
DROP POLICY IF EXISTS "Users can unhide items" ON public.hidden_catalog_items;

-- RLS Policies: Users can only see/modify their own hidden items
CREATE POLICY "Users can view own hidden items"
  ON public.hidden_catalog_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can hide items"
  ON public.hidden_catalog_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide items"
  ON public.hidden_catalog_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- SUCCESS: Users can now hide/unhide global catalog items
-- =====================================================
