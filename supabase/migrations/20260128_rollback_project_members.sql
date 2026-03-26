-- =====================================================
-- V4.0: ROLLBACK - PROJECT MEMBERS
-- =====================================================
-- Use this file to rollback the project_members migration if needed
-- WARNING: This will delete ALL project membership data!

-- Drop trigger first
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON public.projects;

-- Drop functions
DROP FUNCTION IF EXISTS public.create_owner_membership();
DROP FUNCTION IF EXISTS public.get_project_role(UUID, UUID);
DROP FUNCTION IF EXISTS public.has_project_access(UUID, UUID);

-- Remove from realtime publication (optional, but clean)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.project_members;

-- Drop table (CASCADE will drop all foreign keys)
DROP TABLE IF EXISTS public.project_members CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify rollback was successful:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_members';
-- Should return 0 rows
