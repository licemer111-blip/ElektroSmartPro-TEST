-- Final batch: (select auth.uid()) + multiple permissive consolidation
-- Tables: project_messages, feedback, payments, project_categories, price_history_log,
-- catalog_assemblies(LIVE only), es_dictionary, knowledge_base_meta, ai_usage_stats,
-- analytics_events, billing_events, catalog_audit_logs, favorite/hidden catalog items,
-- activity_log, activity_logs, project_invoice_items/invoices, subscription_invoices, teams

-- project_messages
DROP POLICY IF EXISTS "Messages: read by project access" ON project_messages;
DROP POLICY IF EXISTS "Messages: send by project access" ON project_messages;
DROP POLICY IF EXISTS "Messages: delete own" ON project_messages;
CREATE POLICY "project_messages_select" ON project_messages FOR SELECT USING (has_project_access(project_id, (SELECT auth.uid())));
CREATE POLICY "project_messages_insert" ON project_messages FOR INSERT WITH CHECK ((user_id = (SELECT auth.uid())) AND has_project_access(project_id, (SELECT auth.uid())));
CREATE POLICY "project_messages_delete" ON project_messages FOR DELETE USING (user_id = (SELECT auth.uid()));

-- feedback, payments
DROP POLICY IF EXISTS "Users can read their own feedback" ON feedback;
CREATE POLICY "feedback_select" ON feedback FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- project_categories
DROP POLICY IF EXISTS "Users can view their own project categories" ON project_categories;
DROP POLICY IF EXISTS "Users can create their own project categories" ON project_categories;
DROP POLICY IF EXISTS "Users can update their own project categories" ON project_categories;
DROP POLICY IF EXISTS "Users can delete their own project categories" ON project_categories;
CREATE POLICY "project_categories_select" ON project_categories FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "project_categories_insert" ON project_categories FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "project_categories_update" ON project_categories FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "project_categories_delete" ON project_categories FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- price_history_log
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON price_history_log;
CREATE POLICY "price_history_log_insert" ON price_history_log FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- catalog_assemblies: remove redundant SELECT (ALL true already covers it) — LIVE only
DROP POLICY IF EXISTS "catalog_assemblies_select" ON catalog_assemblies;

-- es_dictionary: consolidate ALL + SELECT → per-op
DROP POLICY IF EXISTS "es_dictionary_user_manage" ON es_dictionary;
DROP POLICY IF EXISTS "es_dictionary_authenticated_read" ON es_dictionary;
CREATE POLICY "es_dictionary_select" ON es_dictionary FOR SELECT USING (user_id IS NULL OR user_id = (SELECT auth.uid()));
CREATE POLICY "es_dictionary_insert" ON es_dictionary FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "es_dictionary_update" ON es_dictionary FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "es_dictionary_delete" ON es_dictionary FOR DELETE USING (user_id = (SELECT auth.uid()));

-- knowledge_base_meta: consolidate duplicate SELECT
DROP POLICY IF EXISTS "User owns their KB files" ON knowledge_base_meta;
DROP POLICY IF EXISTS "Global KB readable by all" ON knowledge_base_meta;
CREATE POLICY "knowledge_base_meta_select" ON knowledge_base_meta FOR SELECT USING (user_id IS NULL OR user_id = (SELECT auth.uid()));
CREATE POLICY "knowledge_base_meta_manage" ON knowledge_base_meta FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "knowledge_base_meta_update" ON knowledge_base_meta FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "knowledge_base_meta_delete" ON knowledge_base_meta FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ai_usage_stats, analytics_events, billing_events, catalog_audit_logs
DROP POLICY IF EXISTS "Users can read own ai_usage_stats" ON ai_usage_stats;
CREATE POLICY "ai_usage_stats_select" ON ai_usage_stats FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can log their own events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can read all events" ON analytics_events;
CREATE POLICY "analytics_events_insert" ON analytics_events FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "analytics_events_select" ON analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS "admins_can_read_billing_events" ON billing_events;
CREATE POLICY "billing_events_select" ON billing_events FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can read audit logs" ON catalog_audit_logs;
CREATE POLICY "catalog_audit_logs_select" ON catalog_audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- favorite/hidden catalog items
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorite_catalog_items;
DROP POLICY IF EXISTS "Users can add their own favorites" ON favorite_catalog_items;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON favorite_catalog_items;
CREATE POLICY "favorite_catalog_items_select" ON favorite_catalog_items FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "favorite_catalog_items_insert" ON favorite_catalog_items FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "favorite_catalog_items_delete" ON favorite_catalog_items FOR DELETE USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own hidden items" ON hidden_catalog_items;
DROP POLICY IF EXISTS "Users can hide items" ON hidden_catalog_items;
DROP POLICY IF EXISTS "Users can unhide items" ON hidden_catalog_items;
CREATE POLICY "hidden_catalog_items_select" ON hidden_catalog_items FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "hidden_catalog_items_insert" ON hidden_catalog_items FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "hidden_catalog_items_delete" ON hidden_catalog_items FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- activity_log, activity_logs
DROP POLICY IF EXISTS "Users can view activity for accessible projects" ON activity_log;
DROP POLICY IF EXISTS "Users can insert activity for accessible projects" ON activity_log;
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid()) UNION SELECT project_id FROM project_members WHERE user_id = (SELECT auth.uid()) AND status = 'active'));
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT WITH CHECK ((user_id = (SELECT auth.uid())) AND (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid()) UNION SELECT project_id FROM project_members WHERE user_id = (SELECT auth.uid()) AND status = 'active')));
DROP POLICY IF EXISTS "Users can log own actions" ON activity_logs;
DROP POLICY IF EXISTS "Users can view relevant activity" ON activity_logs;
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT USING ((user_id = (SELECT auth.uid())) OR ((project_id IS NOT NULL) AND has_project_access(project_id, (SELECT auth.uid()))));

-- project invoices
DROP POLICY IF EXISTS "Users can view own invoice items" ON project_invoice_items;
DROP POLICY IF EXISTS "Users can create own invoice items" ON project_invoice_items;
CREATE POLICY "project_invoice_items_select" ON project_invoice_items FOR SELECT USING (EXISTS (SELECT 1 FROM project_invoices WHERE id = project_invoice_items.invoice_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "project_invoice_items_insert" ON project_invoice_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM project_invoices WHERE id = project_invoice_items.invoice_id AND user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "Users can view own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can create own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can update own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can delete own project invoices" ON project_invoices;
CREATE POLICY "project_invoices_select" ON project_invoices FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "project_invoices_insert" ON project_invoices FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "project_invoices_update" ON project_invoices FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "project_invoices_delete" ON project_invoices FOR DELETE USING (((SELECT auth.uid()) = user_id) AND (status = 'draft'));
DROP POLICY IF EXISTS "Users can view own subscription invoices" ON subscription_invoices;
CREATE POLICY "subscription_invoices_select" ON subscription_invoices FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- teams
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;
CREATE POLICY "teams_select" ON teams FOR SELECT USING ((owner_id = (SELECT auth.uid())) OR is_team_member(id, (SELECT auth.uid())) OR has_team_invitation(id));
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (owner_id = (SELECT auth.uid()));
