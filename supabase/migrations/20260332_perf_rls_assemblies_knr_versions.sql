-- (select auth.uid()) for user_assemblies, assembly_categories, project_checkpoints,
-- knr_norms, knr_to_materials, regional_coefficients, ai_usage, pricing_audit_log,
-- project_item_history, project_versions, project_version_items

-- user_assemblies
DROP POLICY IF EXISTS "Users can view assemblies with team access" ON user_assemblies;
DROP POLICY IF EXISTS "Users can insert assemblies" ON user_assemblies;
DROP POLICY IF EXISTS "Users can update assemblies" ON user_assemblies;
DROP POLICY IF EXISTS "Users can delete assemblies" ON user_assemblies;
CREATE POLICY "user_assemblies_select" ON user_assemblies FOR SELECT USING ((user_id = (SELECT auth.uid())) OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_view_team_data(team_id, (SELECT auth.uid()))));
CREATE POLICY "user_assemblies_insert" ON user_assemblies FOR INSERT WITH CHECK ((user_id = (SELECT auth.uid())) AND ((visibility = 'personal') OR (visibility IS NULL) OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid())))));
CREATE POLICY "user_assemblies_update" ON user_assemblies FOR UPDATE USING ((user_id = (SELECT auth.uid())) OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid())))) WITH CHECK ((user_id = (SELECT auth.uid())) OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid()))));
CREATE POLICY "user_assemblies_delete" ON user_assemblies FOR DELETE USING ((user_id = (SELECT auth.uid())) OR ((visibility = 'team') AND (team_id IS NOT NULL) AND can_edit_team_data(team_id, (SELECT auth.uid()))));

-- user_assembly_items
DROP POLICY IF EXISTS "Users can view assembly items with team access" ON user_assembly_items;
DROP POLICY IF EXISTS "Users can insert assembly items" ON user_assembly_items;
DROP POLICY IF EXISTS "Users can update assembly items" ON user_assembly_items;
DROP POLICY IF EXISTS "Users can delete assembly items" ON user_assembly_items;
CREATE POLICY "user_assembly_items_select" ON user_assembly_items FOR SELECT USING (EXISTS (SELECT 1 FROM user_assemblies ua WHERE ua.id = user_assembly_items.assembly_id AND ((ua.user_id = (SELECT auth.uid())) OR ((ua.visibility = 'team') AND (ua.team_id IS NOT NULL) AND can_view_team_data(ua.team_id, (SELECT auth.uid()))))));
CREATE POLICY "user_assembly_items_insert" ON user_assembly_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_assemblies ua WHERE ua.id = user_assembly_items.assembly_id AND ((ua.user_id = (SELECT auth.uid())) OR ((ua.visibility = 'team') AND (ua.team_id IS NOT NULL) AND can_edit_team_data(ua.team_id, (SELECT auth.uid()))))));
CREATE POLICY "user_assembly_items_update" ON user_assembly_items FOR UPDATE USING (EXISTS (SELECT 1 FROM user_assemblies ua WHERE ua.id = user_assembly_items.assembly_id AND ((ua.user_id = (SELECT auth.uid())) OR ((ua.visibility = 'team') AND (ua.team_id IS NOT NULL) AND can_edit_team_data(ua.team_id, (SELECT auth.uid()))))));
CREATE POLICY "user_assembly_items_delete" ON user_assembly_items FOR DELETE USING (EXISTS (SELECT 1 FROM user_assemblies ua WHERE ua.id = user_assembly_items.assembly_id AND ((ua.user_id = (SELECT auth.uid())) OR ((ua.visibility = 'team') AND (ua.team_id IS NOT NULL) AND can_edit_team_data(ua.team_id, (SELECT auth.uid()))))));

-- assembly_categories
DROP POLICY IF EXISTS "Users can view their own assembly categories" ON assembly_categories;
DROP POLICY IF EXISTS "Users can create their own assembly categories" ON assembly_categories;
DROP POLICY IF EXISTS "Users can update their own assembly categories" ON assembly_categories;
DROP POLICY IF EXISTS "Users can delete their own assembly categories" ON assembly_categories;
CREATE POLICY "assembly_categories_select" ON assembly_categories FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "assembly_categories_insert" ON assembly_categories FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "assembly_categories_update" ON assembly_categories FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "assembly_categories_delete" ON assembly_categories FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- project_checkpoints
DROP POLICY IF EXISTS "Checkpoints: read by project access" ON project_checkpoints;
DROP POLICY IF EXISTS "Checkpoints: create by project access" ON project_checkpoints;
DROP POLICY IF EXISTS "Checkpoints: update by project access" ON project_checkpoints;
DROP POLICY IF EXISTS "Checkpoints: delete by project access" ON project_checkpoints;
CREATE POLICY "project_checkpoints_select" ON project_checkpoints FOR SELECT USING (has_project_access(project_id, (SELECT auth.uid())));
CREATE POLICY "project_checkpoints_insert" ON project_checkpoints FOR INSERT WITH CHECK ((user_id = (SELECT auth.uid())) AND has_project_access(project_id, (SELECT auth.uid())));
CREATE POLICY "project_checkpoints_update" ON project_checkpoints FOR UPDATE USING (has_project_access(project_id, (SELECT auth.uid())));
CREATE POLICY "project_checkpoints_delete" ON project_checkpoints FOR DELETE USING (has_project_access(project_id, (SELECT auth.uid())));

-- knr_norms
DROP POLICY IF EXISTS "knr_norms_insert_admin" ON knr_norms;
DROP POLICY IF EXISTS "knr_norms_update_admin" ON knr_norms;
DROP POLICY IF EXISTS "knr_norms_delete_admin" ON knr_norms;
CREATE POLICY "knr_norms_insert_admin" ON knr_norms FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "knr_norms_update_admin" ON knr_norms FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "knr_norms_delete_admin" ON knr_norms FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- knr_to_materials
DROP POLICY IF EXISTS "knr_to_materials_insert_admin" ON knr_to_materials;
DROP POLICY IF EXISTS "knr_to_materials_update_admin" ON knr_to_materials;
DROP POLICY IF EXISTS "knr_to_materials_delete_admin" ON knr_to_materials;
CREATE POLICY "knr_to_materials_insert_admin" ON knr_to_materials FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "knr_to_materials_update_admin" ON knr_to_materials FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "knr_to_materials_delete_admin" ON knr_to_materials FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- regional_coefficients
DROP POLICY IF EXISTS "regional_coefficients_insert_admin" ON regional_coefficients;
DROP POLICY IF EXISTS "regional_coefficients_update_admin" ON regional_coefficients;
CREATE POLICY "regional_coefficients_insert_admin" ON regional_coefficients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "regional_coefficients_update_admin" ON regional_coefficients FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- ai_usage
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_usage;
CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- pricing_audit_log
DROP POLICY IF EXISTS "Users see own audit log" ON pricing_audit_log;
CREATE POLICY "pricing_audit_log_select" ON pricing_audit_log FOR SELECT USING (user_id = (SELECT auth.uid()));

-- project_item_history
DROP POLICY IF EXISTS "project_item_history_insert" ON project_item_history;
DROP POLICY IF EXISTS "project_item_history_select" ON project_item_history;
CREATE POLICY "project_item_history_insert" ON project_item_history FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "project_item_history_select" ON project_item_history FOR SELECT USING (EXISTS (SELECT 1 FROM project_items pi JOIN projects p ON p.id = pi.project_id WHERE pi.id = project_item_history.project_item_id AND ((p.user_id = (SELECT auth.uid())) OR (p.team_id IN (SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active')) OR (EXISTS (SELECT 1 FROM project_members WHERE project_id = p.id AND user_id = (SELECT auth.uid()))))));

-- project_versions
DROP POLICY IF EXISTS "project_versions_insert" ON project_versions;
DROP POLICY IF EXISTS "project_versions_select" ON project_versions;
CREATE POLICY "project_versions_insert" ON project_versions FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY "project_versions_select" ON project_versions FOR SELECT USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_versions.project_id AND ((p.user_id = (SELECT auth.uid())) OR (p.team_id IN (SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active')) OR (EXISTS (SELECT 1 FROM project_members WHERE project_id = p.id AND user_id = (SELECT auth.uid()))))));

-- project_version_items
DROP POLICY IF EXISTS "project_version_items_insert" ON project_version_items;
DROP POLICY IF EXISTS "project_version_items_select" ON project_version_items;
CREATE POLICY "project_version_items_insert" ON project_version_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM project_versions pv JOIN projects p ON p.id = pv.project_id WHERE pv.id = project_version_items.version_id AND p.user_id = (SELECT auth.uid())));
CREATE POLICY "project_version_items_select" ON project_version_items FOR SELECT USING (EXISTS (SELECT 1 FROM project_versions pv JOIN projects p ON p.id = pv.project_id WHERE pv.id = project_version_items.version_id AND ((p.user_id = (SELECT auth.uid())) OR (p.team_id IN (SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid()) AND status = 'active')) OR (EXISTS (SELECT 1 FROM project_members WHERE project_id = p.id AND user_id = (SELECT auth.uid()))))));
