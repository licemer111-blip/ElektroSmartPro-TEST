-- ─── Drop unused indexes (idx_scan = 0) — Batch 1 ────────────────────────────
-- Tables: audit/analytics/payments/billing/ai-stats/profiles/history
-- KEPT: team_*, project_members_*, catalog_items_*, knr_norms_*, notifications_*, clients_*

-- Analytics events
DROP INDEX IF EXISTS public.idx_analytics_events_project_id;
DROP INDEX IF EXISTS public.idx_analytics_events_user;
DROP INDEX IF EXISTS public.idx_analytics_events_created;
DROP INDEX IF EXISTS public.idx_analytics_events_voivodeship;

-- Pricing audit log
DROP INDEX IF EXISTS public.idx_pricing_audit_log_created_at;
DROP INDEX IF EXISTS public.idx_pricing_audit_log_project_id;
DROP INDEX IF EXISTS public.idx_pricing_audit_log_match_level;

-- Activity logs
DROP INDEX IF EXISTS public.idx_activity_log_user_id;
DROP INDEX IF EXISTS public.idx_activity_log_created_at;
DROP INDEX IF EXISTS public.idx_activity_log_type;
DROP INDEX IF EXISTS public.idx_activity_logs_action_type;
DROP INDEX IF EXISTS public.idx_activity_logs_created_at;

-- AI usage tracking
DROP INDEX IF EXISTS public.ai_usage_user_id_idx;
DROP INDEX IF EXISTS public.ai_usage_created_at_idx;
DROP INDEX IF EXISTS public.ai_usage_feature_idx;
DROP INDEX IF EXISTS public.idx_ai_usage_project_id;
DROP INDEX IF EXISTS public.idx_ai_usage_stats_user;

-- Payments & billing
DROP INDEX IF EXISTS public.idx_payments_created_at;
DROP INDEX IF EXISTS public.idx_payments_stripe_payment_intent;
DROP INDEX IF EXISTS public.idx_payments_stripe_invoice;
DROP INDEX IF EXISTS public.billing_events_status_idx;
DROP INDEX IF EXISTS public.subscription_invoices_status_idx;

-- Profile secondary indexes (redundant / unused)
DROP INDEX IF EXISTS public.idx_profiles_stripe_customer_id;
DROP INDEX IF EXISTS public.idx_profiles_subscription_id;
DROP INDEX IF EXISTS public.idx_profiles_is_pro;
DROP INDEX IF EXISTS public.idx_profiles_settings;
DROP INDEX IF EXISTS public.idx_profiles_default_region;
DROP INDEX IF EXISTS public.idx_profiles_team_id;

-- Email logs
DROP INDEX IF EXISTS public.idx_email_logs_status;
DROP INDEX IF EXISTS public.idx_email_logs_sent_at;

-- User surveys & feedback
DROP INDEX IF EXISTS public.idx_user_surveys_user_id;
DROP INDEX IF EXISTS public.idx_user_surveys_rating;
DROP INDEX IF EXISTS public.idx_feedback_type;

-- Quick quotes & push subscriptions
DROP INDEX IF EXISTS public.idx_quick_quotes_user_id;
DROP INDEX IF EXISTS public.idx_push_subscriptions_created_at;

-- Append-only history / log tables
DROP INDEX IF EXISTS public.idx_project_item_history_user;
DROP INDEX IF EXISTS public.idx_price_history_log_created_by;
DROP INDEX IF EXISTS public.idx_project_versions_created_by;
DROP INDEX IF EXISTS public.idx_project_versions_created;
DROP INDEX IF EXISTS public.idx_project_version_items_version;
DROP INDEX IF EXISTS public.idx_project_checkpoints_user_id;
