-- ============================================================
-- project_items: consolidate 2 policies per op → 1 (ALL + cmd-specific → single)
-- profiles: wrap auth.uid()
-- project_members: consolidate 2 UPDATE → 1, wrap auth.uid()
-- ============================================================

-- project_items SELECT: owner/member (has_project_access) OR team member
DROP POLICY IF EXISTS "Team members can manage project items" ON project_items;
DROP POLICY IF EXISTS "View project items" ON project_items;
DROP POLICY IF EXISTS "Allow item access" ON project_items;

CREATE POLICY "project_items_select" ON project_items FOR SELECT
  USING (
    has_project_access(project_id, (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_items.project_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Insert project items" ON project_items;
DROP POLICY IF EXISTS "Allow item creation" ON project_items;

CREATE POLICY "project_items_insert" ON project_items FOR INSERT
  WITH CHECK (
    user_can_edit_project(project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_items.project_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Update project items" ON project_items;
DROP POLICY IF EXISTS "Allow item update" ON project_items;

CREATE POLICY "project_items_update" ON project_items FOR UPDATE
  USING (
    user_can_edit_project(project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_items.project_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
  )
  WITH CHECK (
    user_can_edit_project(project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_items.project_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Delete project items" ON project_items;
DROP POLICY IF EXISTS "Allow item deletion" ON project_items;

CREATE POLICY "project_items_delete" ON project_items FOR DELETE
  USING (
    user_can_edit_project(project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE p.id = project_items.project_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
  );

-- profiles: (select auth.uid()) for plan caching
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- project_members: consolidate 2 UPDATE → 1
DROP POLICY IF EXISTS "Allow member access" ON project_members;
CREATE POLICY "project_members_select" ON project_members FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Allow member update" ON project_members;
DROP POLICY IF EXISTS "Project owners can update members" ON project_members;

CREATE POLICY "project_members_update" ON project_members FOR UPDATE
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );
