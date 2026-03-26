-- Migration: Add Favorites/Bookmarks for Catalog Items
-- Description: Allow users to mark catalog items as favorites

-- Create favorite_catalog_items table
CREATE TABLE IF NOT EXISTS public.favorite_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, catalog_item_id) -- One favorite per user per item
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorite_catalog_items_user_id ON public.favorite_catalog_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_catalog_items_catalog_item_id ON public.favorite_catalog_items(catalog_item_id);

-- Enable RLS
ALTER TABLE public.favorite_catalog_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorite_catalog_items;
CREATE POLICY "Users can view their own favorites"
  ON public.favorite_catalog_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorite_catalog_items;
CREATE POLICY "Users can add their own favorites"
  ON public.favorite_catalog_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorite_catalog_items;
CREATE POLICY "Users can remove their own favorites"
  ON public.favorite_catalog_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.favorite_catalog_items IS 'Stores user favorite/bookmarked catalog items';
