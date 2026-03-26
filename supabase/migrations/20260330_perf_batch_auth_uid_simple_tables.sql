-- Batch: wrap auth.uid() → (select auth.uid()) for 16 simple own-row tables
-- Fixes auth_rls_initplan WARN across all remaining simple tables

-- clients
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (user_id = (SELECT auth.uid()));

-- invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "invoices_delete" ON invoices FOR DELETE USING (user_id = (SELECT auth.uid()));

-- invoice_items (via invoices join)
DROP POLICY IF EXISTS "Users can view items of their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can create items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can update items of their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete items of their invoices" ON invoice_items;
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE USING (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE USING (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND user_id = (SELECT auth.uid())));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (user_id = (SELECT auth.uid()));

-- offer_links
DROP POLICY IF EXISTS "Users can manage their own offer links" ON offer_links;
CREATE POLICY "offer_links_manage" ON offer_links FOR ALL USING (user_id = (SELECT auth.uid()));

-- project_photos
DROP POLICY IF EXISTS "Users can view own photos" ON project_photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON project_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON project_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON project_photos;
CREATE POLICY "project_photos_select" ON project_photos FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "project_photos_insert" ON project_photos FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "project_photos_update" ON project_photos FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "project_photos_delete" ON project_photos FOR DELETE USING (user_id = (SELECT auth.uid()));

-- project_templates
DROP POLICY IF EXISTS "Users can view own templates" ON project_templates;
DROP POLICY IF EXISTS "Users can create templates" ON project_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON project_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON project_templates;
CREATE POLICY "project_templates_select" ON project_templates FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "project_templates_insert" ON project_templates FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "project_templates_update" ON project_templates FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "project_templates_delete" ON project_templates FOR DELETE USING (user_id = (SELECT auth.uid()));

-- quick_quotes
DROP POLICY IF EXISTS "Users can manage their own quick quotes" ON quick_quotes;
CREATE POLICY "quick_quotes_manage" ON quick_quotes FOR ALL USING (user_id = (SELECT auth.uid()));

-- push_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select" ON push_subscriptions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE USING (user_id = (SELECT auth.uid()));

-- measurement_protocols
DROP POLICY IF EXISTS "Users can view own protocols" ON measurement_protocols;
DROP POLICY IF EXISTS "Users can insert own protocols" ON measurement_protocols;
DROP POLICY IF EXISTS "Users can update own protocols" ON measurement_protocols;
DROP POLICY IF EXISTS "Users can delete own protocols" ON measurement_protocols;
CREATE POLICY "measurement_protocols_select" ON measurement_protocols FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "measurement_protocols_insert" ON measurement_protocols FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "measurement_protocols_update" ON measurement_protocols FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "measurement_protocols_delete" ON measurement_protocols FOR DELETE USING (user_id = (SELECT auth.uid()));

-- measurement_entries: no user_id — join via protocol_id
DROP POLICY IF EXISTS "Users can view own entries" ON measurement_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON measurement_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON measurement_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON measurement_entries;
CREATE POLICY "measurement_entries_select" ON measurement_entries FOR SELECT USING (EXISTS (SELECT 1 FROM measurement_protocols WHERE id = measurement_entries.protocol_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "measurement_entries_insert" ON measurement_entries FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM measurement_protocols WHERE id = measurement_entries.protocol_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "measurement_entries_update" ON measurement_entries FOR UPDATE USING (EXISTS (SELECT 1 FROM measurement_protocols WHERE id = measurement_entries.protocol_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "measurement_entries_delete" ON measurement_entries FOR DELETE USING (EXISTS (SELECT 1 FROM measurement_protocols WHERE id = measurement_entries.protocol_id AND user_id = (SELECT auth.uid())));

-- email_logs
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can insert their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can delete their own email logs" ON email_logs;
CREATE POLICY "email_logs_select" ON email_logs FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "email_logs_insert" ON email_logs FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "email_logs_delete" ON email_logs FOR DELETE USING (user_id = (SELECT auth.uid()));

-- portfolio_items
DROP POLICY IF EXISTS "Users can manage own portfolio" ON portfolio_items;
CREATE POLICY "portfolio_items_manage" ON portfolio_items FOR ALL USING (user_id = (SELECT auth.uid()));

-- project_tags
DROP POLICY IF EXISTS "Users can manage own tags" ON project_tags;
CREATE POLICY "project_tags_manage" ON project_tags FOR ALL USING (user_id = (SELECT auth.uid()));

-- project_tag_assignments: no user_id — access via project ownership
DROP POLICY IF EXISTS "Users can manage own project tags" ON project_tag_assignments;
CREATE POLICY "project_tag_assignments_manage" ON project_tag_assignments FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));

-- user_surveys
DROP POLICY IF EXISTS "Users can read own surveys" ON user_surveys;
DROP POLICY IF EXISTS "Users can insert own surveys" ON user_surveys;
CREATE POLICY "user_surveys_select" ON user_surveys FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_surveys_insert" ON user_surveys FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
