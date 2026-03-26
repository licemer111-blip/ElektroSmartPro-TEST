-- Fix RLS policies that had WITH CHECK (true) — tighten to actual ownership checks

-- project_item_history: restrict INSERT to the owner (user_id = auth.uid())
DROP POLICY IF EXISTS "project_item_history_insert" ON project_item_history;
CREATE POLICY "project_item_history_insert" ON project_item_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- project_versions: restrict INSERT to project creator
DROP POLICY IF EXISTS "project_versions_insert" ON project_versions;
CREATE POLICY "project_versions_insert" ON project_versions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- project_version_items: restrict INSERT via version → project ownership
DROP POLICY IF EXISTS "project_version_items_insert" ON project_version_items;
CREATE POLICY "project_version_items_insert" ON project_version_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_versions pv
      JOIN projects p ON p.id = pv.project_id
      WHERE pv.id = project_version_items.version_id
        AND p.user_id = auth.uid()
    )
  );

-- price_history_log: require authenticated session (non-null uid)
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON price_history_log;
CREATE POLICY "Authenticated users can insert price history" ON price_history_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
