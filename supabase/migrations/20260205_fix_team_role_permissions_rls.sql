-- =====================================================
-- FIX RLS FOR team_role_permissions TABLE
-- =====================================================
-- This is a reference table with role permissions matrix
-- All authenticated users should be able to READ it
-- Only service_role can modify it (via migrations)
-- =====================================================

-- 1. Enable RLS on the table
ALTER TABLE public.team_role_permissions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read role permissions" ON public.team_role_permissions;
DROP POLICY IF EXISTS "team_role_permissions_select" ON public.team_role_permissions;

-- 3. Create SELECT policy for all authenticated users
-- This is a reference table - everyone needs to read role definitions
CREATE POLICY "Anyone can read role permissions"
ON public.team_role_permissions
FOR SELECT
TO authenticated
USING (true);

-- 4. No INSERT/UPDATE/DELETE policies = only service_role can modify
-- This is intentional - role permissions are managed via migrations only

-- 5. Also allow anon to read (for public documentation/help pages if needed)
DROP POLICY IF EXISTS "Anon can read role permissions" ON public.team_role_permissions;
CREATE POLICY "Anon can read role permissions"
ON public.team_role_permissions
FOR SELECT
TO anon
USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After applying this migration, verify with:
-- SELECT * FROM public.team_role_permissions;
-- Should return 3 rows (admin, kierownik, elektryk)
