-- ============================================================
-- Performance: fix auth_rls_initplan + multiple_permissive_policies
-- Tables: panel_configurations, team_invitations, team_members, time_entries
-- Applied to LIVE with get_my_email(); TEST uses current_setting fallback
-- ============================================================

-- panel_configurations: wrap auth.uid() -> (select auth.uid())
DROP POLICY IF EXISTS "Users can view own panel configs" ON panel_configurations;
DROP POLICY IF EXISTS "Users can insert own panel configs" ON panel_configurations;
DROP POLICY IF EXISTS "Users can update own panel configs" ON panel_configurations;
DROP POLICY IF EXISTS "Users can delete own panel configs" ON panel_configurations;

CREATE POLICY "panel_configurations_select" ON panel_configurations FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "panel_configurations_insert" ON panel_configurations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "panel_configurations_update" ON panel_configurations FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "panel_configurations_delete" ON panel_configurations FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- team_invitations: consolidate duplicate SELECT/UPDATE/INSERT/DELETE
DROP POLICY IF EXISTS "Users can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can view invitations" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_select" ON team_invitations;

CREATE POLICY "team_invitations_select" ON team_invitations FOR SELECT
  USING (
    (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'))
    OR (invited_by = (SELECT auth.uid()))
    OR is_team_admin(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_update" ON team_invitations;

CREATE POLICY "team_invitations_update" ON team_invitations FOR UPDATE
  USING (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'))
  WITH CHECK (email = ((current_setting('request.jwt.claims', true))::json ->> 'email'));

DROP POLICY IF EXISTS "Users can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team admins can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert" ON team_invitations;

CREATE POLICY "team_invitations_insert" ON team_invitations FOR INSERT
  WITH CHECK (invited_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team managers can delete invitations" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_delete" ON team_invitations;

CREATE POLICY "team_invitations_delete" ON team_invitations FOR DELETE
  USING (
    (invited_by = (SELECT auth.uid()))
    OR is_team_manager(team_id, (SELECT auth.uid()))
  );

-- team_members: fix auth.uid() in all policies
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members FOR SELECT
  USING (
    (user_id = (SELECT auth.uid()))
    OR is_team_member(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Team admins can update members" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update" ON team_members FOR UPDATE
  USING (is_team_admin(team_id, (SELECT auth.uid())) OR (user_id = (SELECT auth.uid())))
  WITH CHECK (is_team_admin(team_id, (SELECT auth.uid())) OR (user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Team admins can remove members" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members FOR DELETE
  USING (is_team_admin(team_id, (SELECT auth.uid())) OR (user_id = (SELECT auth.uid())));

-- time_entries: consolidate 2 SELECT -> 1, fix auth.uid()
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Managers can view team time entries" ON time_entries;
DROP POLICY IF EXISTS "time_entries_select" ON time_entries;

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT
  USING (
    (user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = time_entries.project_id
        AND p.team_id IS NOT NULL
        AND is_team_manager(p.team_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can create time entries" ON time_entries;
DROP POLICY IF EXISTS "time_entries_insert" ON time_entries;
CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "time_entries_update" ON time_entries;
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own time entries" ON time_entries;
DROP POLICY IF EXISTS "time_entries_delete" ON time_entries;
CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE
  USING (user_id = (SELECT auth.uid()));
