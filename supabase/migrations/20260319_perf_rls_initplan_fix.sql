-- ─── Fix RLS initplan: replace auth.uid() with (select auth.uid()) ─────────────
-- Prevents re-evaluation of auth.uid() for every row, improving query performance.
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ── offer_links ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "offer_links_update" ON public.offer_links;
CREATE POLICY "offer_links_update"
  ON public.offer_links
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── team_messages ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can delete own messages" ON public.team_messages;
CREATE POLICY "Users can delete own messages"
  ON public.team_messages
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can edit own messages" ON public.team_messages;
CREATE POLICY "Users can edit own messages"
  ON public.team_messages
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Team members can send messages" ON public.team_messages;
CREATE POLICY "Team members can send messages"
  ON public.team_messages
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = team_messages.team_id
          AND team_members.user_id = (SELECT auth.uid())
          AND team_members.status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = team_messages.team_id
          AND teams.owner_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Team members can view messages" ON public.team_messages;
CREATE POLICY "Team members can view messages"
  ON public.team_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_messages.team_id
        AND team_members.user_id = (SELECT auth.uid())
        AND team_members.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_messages.team_id
        AND teams.owner_id = (SELECT auth.uid())
    )
  );
