-- catalog_items: consolidate 2 policies per op → 1 each (TEST + LIVE)

DROP POLICY IF EXISTS "Users can view catalog items with team access" ON catalog_items;
DROP POLICY IF EXISTS "Users can view all catalog items" ON catalog_items;
CREATE POLICY "catalog_items_select" ON catalog_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Users can insert their own catalog items" ON catalog_items;
CREATE POLICY "catalog_items_insert" ON catalog_items FOR INSERT
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR (user_id IS NULL)
    OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Users can update catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Users can update their own catalog items" ON catalog_items;
CREATE POLICY "catalog_items_update" ON catalog_items FOR UPDATE
  USING (
    (user_id = (SELECT auth.uid()))
    OR (user_id IS NULL)
    OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid())))
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR (user_id IS NULL)
    OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Users can delete catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Users can delete their own catalog items" ON catalog_items;
CREATE POLICY "catalog_items_delete" ON catalog_items FOR DELETE
  USING (
    (user_id = (SELECT auth.uid()))
    OR (user_id IS NULL)
    OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid())))
  );
