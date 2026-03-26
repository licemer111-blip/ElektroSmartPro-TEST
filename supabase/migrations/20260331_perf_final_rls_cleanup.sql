-- Final RLS cleanup: catalog_categories, kits, kit_items, offer_links, portfolio_items, profiles

-- catalog_categories: consolidate 2 SELECT -> 1 (true), wrap auth.uid()
DROP POLICY IF EXISTS "Anyone can view global catalog categories" ON catalog_categories;
DROP POLICY IF EXISTS "Public can view catalog_categories" ON catalog_categories;
CREATE POLICY "catalog_categories_select" ON catalog_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create their own catalog categories" ON catalog_categories;
CREATE POLICY "catalog_categories_insert" ON catalog_categories FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can update their own catalog categories" ON catalog_categories;
CREATE POLICY "catalog_categories_update" ON catalog_categories FOR UPDATE USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete their own catalog categories" ON catalog_categories;
CREATE POLICY "catalog_categories_delete" ON catalog_categories FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- kits: wrap auth.uid() in admin EXISTS check
DROP POLICY IF EXISTS "Only admins can insert kits" ON kits;
DROP POLICY IF EXISTS "Only admins can update kits" ON kits;
DROP POLICY IF EXISTS "Only admins can delete kits" ON kits;
CREATE POLICY "kits_insert" ON kits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "kits_update" ON kits FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "kits_delete" ON kits FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- kit_items: wrap auth.uid()
DROP POLICY IF EXISTS "Only admins can insert kit items" ON kit_items;
DROP POLICY IF EXISTS "Only admins can update kit items" ON kit_items;
DROP POLICY IF EXISTS "Only admins can delete kit items" ON kit_items;
CREATE POLICY "kit_items_insert" ON kit_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "kit_items_update" ON kit_items FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "kit_items_delete" ON kit_items FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- offer_links: split ALL into per-op to avoid conflict with token policies
DROP POLICY IF EXISTS "offer_links_manage" ON offer_links;
CREATE POLICY "offer_links_insert" ON offer_links FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "offer_links_delete" ON offer_links FOR DELETE USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Client can update offer status via token" ON offer_links;
CREATE POLICY "offer_links_update" ON offer_links FOR UPDATE
  USING (true)
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR (status = ANY (ARRAY['viewed','accepted','rejected']))
  );

-- portfolio_items: consolidate SELECT (owner + public), split ALL per-op
DROP POLICY IF EXISTS "portfolio_items_manage" ON portfolio_items;
DROP POLICY IF EXISTS "Public portfolio items are viewable" ON portfolio_items;
CREATE POLICY "portfolio_items_select" ON portfolio_items FOR SELECT
  USING ((user_id = (SELECT auth.uid())) OR (is_public = true));
CREATE POLICY "portfolio_items_insert" ON portfolio_items FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "portfolio_items_update" ON portfolio_items FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "portfolio_items_delete" ON portfolio_items FOR DELETE USING (user_id = (SELECT auth.uid()));

-- profiles: consolidate 3 SELECT -> 1 (true — all authenticated users can read profiles for team/collab display)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
