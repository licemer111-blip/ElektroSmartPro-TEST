-- ============================================================
-- Performance: consolidate RLS policies + wrap auth.uid() + FK indexes
-- Fixes: auth_rls_initplan WARN + multiple_permissive_policies WARN
-- ============================================================

-- 1. projects: consolidate 3 SELECT → 1, 2 UPDATE → 1, wrap auth.uid()
DROP POLICY IF EXISTS "Allow project access" ON projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Team members can view team projects" ON projects;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    (user_id = (SELECT auth.uid()))
    OR user_is_project_member(id)
    OR (team_id IS NOT NULL AND is_team_member(team_id, (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Allow project update" ON projects;
DROP POLICY IF EXISTS "Team managers can update team projects" ON projects;

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (
    (user_id = (SELECT auth.uid()))
    OR user_can_edit_project(id)
    OR (team_id IS NOT NULL AND is_team_manager(team_id, (SELECT auth.uid())))
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR user_can_edit_project(id)
    OR (team_id IS NOT NULL AND is_team_manager(team_id, (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Allow project creation" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow project deletion" ON projects;
CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- 2. item_comments: wrap auth.uid() in all policies
DROP POLICY IF EXISTS "item_comments_delete" ON item_comments;
CREATE POLICY "item_comments_delete" ON item_comments FOR DELETE
  USING (
    (user_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      JOIN team_members tm ON tm.team_id = p.team_id
      WHERE pi.id = item_comments.project_item_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = ANY (ARRAY['admin','kierownik'])
        AND tm.status = 'active'
    ))
  );

DROP POLICY IF EXISTS "item_comments_select" ON item_comments;
CREATE POLICY "item_comments_select" ON item_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      WHERE pi.id = item_comments.project_item_id
        AND (
          p.user_id = (SELECT auth.uid())
          OR p.team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = (SELECT auth.uid()) AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM project_members
            WHERE project_id = p.id AND user_id = (SELECT auth.uid())
          )
        )
    )
  );

DROP POLICY IF EXISTS "item_comments_insert" ON item_comments;
CREATE POLICY "item_comments_insert" ON item_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      WHERE pi.id = item_comments.project_item_id
        AND (
          p.user_id = (SELECT auth.uid())
          OR p.team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = (SELECT auth.uid()) AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM project_members
            WHERE project_id = p.id AND user_id = (SELECT auth.uid())
          )
        )
    )
  );

DROP POLICY IF EXISTS "item_comments_update" ON item_comments;
CREATE POLICY "item_comments_update" ON item_comments FOR UPDATE
  USING (
    (user_id = (SELECT auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      JOIN team_members tm ON tm.team_id = p.team_id
      WHERE pi.id = item_comments.project_item_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = ANY (ARRAY['admin','kierownik'])
        AND tm.status = 'active'
    ))
  );

-- 3. Missing FK covering indexes
CREATE INDEX IF NOT EXISTS idx_project_invoice_items_project_item_id
  ON project_invoice_items (project_item_id);

CREATE INDEX IF NOT EXISTS idx_project_templates_object_type_id
  ON project_templates (object_type_id);

CREATE INDEX IF NOT EXISTS idx_project_templates_region_id
  ON project_templates (region_id);

CREATE INDEX IF NOT EXISTS idx_project_versions_created_by
  ON project_versions (created_by);

CREATE INDEX IF NOT EXISTS idx_quick_quotes_user_id
  ON quick_quotes (user_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by
  ON team_invitations (invited_by);

CREATE INDEX IF NOT EXISTS idx_team_members_invited_by
  ON team_members (invited_by);

CREATE INDEX IF NOT EXISTS idx_team_messages_project_id
  ON team_messages (project_id);

CREATE INDEX IF NOT EXISTS idx_team_messages_user_id
  ON team_messages (user_id);
