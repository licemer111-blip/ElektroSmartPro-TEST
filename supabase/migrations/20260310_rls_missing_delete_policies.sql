-- ════════════════════════════════════════════════════════════════════════════
-- 20260310_rls_missing_delete_policies.sql
-- ElektroSmart PRO — RLS audit: dodanie brakujących polityk DELETE
--
-- Kontekst:
--   knr_norms i knr_to_materials miały polityki SELECT/INSERT/UPDATE dla admina,
--   ale brakowało DELETE. Admin używa supabaseAdmin (service role) do usuwania,
--   więc funkcjonalnie działało, ale brak jawnej polityki DELETE jest luką audytową.
--
-- Iron Rule: tylko admin (role='admin') może usuwać normy KNR.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── knr_norms: DELETE tylko dla admina ──────────────────────────────────────

DROP POLICY IF EXISTS "knr_norms_delete_admin" ON knr_norms;
CREATE POLICY "knr_norms_delete_admin"
  ON knr_norms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ─── knr_to_materials: UPDATE + DELETE tylko dla admina ──────────────────────

DROP POLICY IF EXISTS "knr_to_materials_update_admin" ON knr_to_materials;
CREATE POLICY "knr_to_materials_update_admin"
  ON knr_to_materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "knr_to_materials_delete_admin" ON knr_to_materials;
CREATE POLICY "knr_to_materials_delete_admin"
  ON knr_to_materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ─── analytics_events: явный запрет UPDATE i DELETE dla wszystkich ────────────
-- Zdarzenia analityczne są niemutowalne — brak polityk = blokada (RLS domyślnie),
-- ale dodajemy jawne polityki dla przejrzystości audytu.

DROP POLICY IF EXISTS "analytics_events_no_update" ON analytics_events;
CREATE POLICY "analytics_events_no_update"
  ON analytics_events FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "analytics_events_no_delete" ON analytics_events;
CREATE POLICY "analytics_events_no_delete"
  ON analytics_events FOR DELETE
  USING (false);
