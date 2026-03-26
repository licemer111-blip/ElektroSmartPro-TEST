-- ============================================================================
-- FEEDBACK SYSTEM - User Feedback Collection
-- ============================================================================
-- Purpose: Allow users (and guests) to submit bug reports, feature requests,
--          and contact messages. Admins can read via Service Role.
-- Date: 2026-01-11
-- ============================================================================

-- Drop existing table if exists (for clean re-run)
drop table if exists public.feedback cascade;

-- ============================================================================
-- CREATE FEEDBACK TABLE
-- ============================================================================

create table public.feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- User ID (nullable for guest submissions)
  user_id uuid references auth.users(id) on delete set null,
  
  -- Feedback Type
  type text not null check (type in ('bug', 'feature', 'contact')),
  
  -- Message Content
  message text not null,
  
  -- Optional Contact Email (for response)
  contact_email text,
  
  -- Status Tracking
  status text default 'new' check (status in ('new', 'read', 'archived')),
  
  -- Metadata (JSON for flexible data storage)
  -- Example: { "page_url": "/dashboard/projects/123", "browser": "Chrome", "error_code": "500" }
  metadata jsonb default '{}'::jsonb
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for filtering by status (admin dashboard)
create index idx_feedback_status on public.feedback(status);

-- Index for filtering by type
create index idx_feedback_type on public.feedback(type);

-- Index for filtering by user (if needed)
create index idx_feedback_user_id on public.feedback(user_id);

-- Index for sorting by creation date (most recent first)
create index idx_feedback_created_at on public.feedback(created_at desc);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.feedback enable row level security;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy 1: Anyone can INSERT feedback (including anonymous users)
-- This allows guests to submit bug reports without authentication
create policy "Anyone can insert feedback"
on public.feedback
for insert
with check (true);

-- Policy 2: Users can READ their own feedback (optional - for "My Feedback" page)
create policy "Users can read their own feedback"
on public.feedback
for select
using (auth.uid() = user_id);

-- Policy 3: No UPDATE/DELETE for regular users (only admins via Service Role)
-- Admins will use Supabase Service Role to manage feedback (bypass RLS)

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

comment on table public.feedback is 'User feedback collection: bug reports, feature requests, contact messages';
comment on column public.feedback.user_id is 'User ID (nullable for guest submissions)';
comment on column public.feedback.type is 'Feedback type: bug, feature, or contact';
comment on column public.feedback.message is 'User message content';
comment on column public.feedback.contact_email is 'Optional email for response (if user wants follow-up)';
comment on column public.feedback.status is 'Admin status tracking: new, read, archived';
comment on column public.feedback.metadata is 'JSON metadata: page URL, browser info, error details, etc.';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample feedback for testing:
/*
insert into public.feedback (type, message, contact_email, metadata) values
  ('bug', 'Nie mogę zapisać projektu - wyskakuje błąd 500', 'user@example.com', '{"page_url": "/dashboard/projects/123", "browser": "Chrome"}'),
  ('feature', 'Proszę dodać eksport do Excel', 'user2@example.com', '{"page_url": "/dashboard/catalog"}'),
  ('contact', 'Pytanie o cennik wersji PRO', 'user3@example.com', '{}');
*/
