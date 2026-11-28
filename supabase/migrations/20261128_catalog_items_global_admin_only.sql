-- Global catalog rows (user_id IS NULL) are the shared price list.
-- A normal account may read them and keep a personal copy.
-- Only an admin may insert, change, or delete those shared rows.

DROP POLICY IF EXISTS "catalog_items_insert" ON catalog_items;
CREATE POLICY "catalog_items_insert" ON catalog_items FOR INSERT
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
      )
    )
    OR (
      (visibility = 'team')
      AND (team_id IS NOT NULL)
      AND can_edit_team_data(team_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "catalog_items_update" ON catalog_items;
CREATE POLICY "catalog_items_update" ON catalog_items FOR UPDATE
  USING (
    (user_id = (SELECT auth.uid()))
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
      )
    )
    OR (
      (visibility = 'team')
      AND (team_id IS NOT NULL)
      AND can_edit_team_data(team_id, (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
      )
    )
    OR (
      (visibility = 'team')
      AND (team_id IS NOT NULL)
      AND can_edit_team_data(team_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "catalog_items_delete" ON catalog_items;
CREATE POLICY "catalog_items_delete" ON catalog_items FOR DELETE
  USING (
    (user_id = (SELECT auth.uid()))
    OR (
      user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
      )
    )
    OR (
      (visibility = 'team')
      AND (team_id IS NOT NULL)
      AND can_edit_team_data(team_id, (SELECT auth.uid()))
    )
  );
