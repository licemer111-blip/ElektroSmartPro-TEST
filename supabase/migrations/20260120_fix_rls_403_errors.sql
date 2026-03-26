-- ============================================================
-- FIX: 403 Forbidden errors on profiles and object_types
-- ============================================================
-- Issue: RLS disabled on reference tables but policies exist
-- Issue: Conflicting SELECT policies on profiles table
-- Solution: Disable RLS on reference tables, fix profiles policies
-- ============================================================

-- ============================================================
-- STEP 1: Disable RLS on reference tables (they are public)
-- ============================================================

-- These tables are read-only reference data, no RLS needed
ALTER TABLE public.object_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories DISABLE ROW LEVEL SECURITY;

-- Drop all policies from these tables since RLS is disabled
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.object_types;
DROP POLICY IF EXISTS "Authenticated users can view object types" ON public.object_types;
DROP POLICY IF EXISTS "Authenticated users can view regions" ON public.regions;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.catalog_categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.catalog_categories;

-- ============================================================
-- STEP 2: Fix profiles table - remove conflicting SELECT policies
-- ============================================================

-- Keep RLS enabled on profiles (it contains sensitive data)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop the restrictive policy that only allows viewing own profile
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;

-- Keep the permissive policy that allows authenticated users to view all profiles
-- (needed for displaying user info in project lists, etc.)
-- This policy already exists: "Allow select for authenticated"

-- Ensure other CRUD policies remain:
-- - "Authenticated users can insert own profile"
-- - "Authenticated users can update own profile"

-- ============================================================
-- STEP 3: Verify catalog_items policies (these are correct)
-- ============================================================

-- catalog_items should have RLS enabled with these policies:
-- 1. Allow select for authenticated (already exists)
-- 2. Users can manage their own custom items (already exists)

-- Ensure RLS is enabled
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Add anon access for public pages (optional but recommended)
-- ============================================================

-- Allow anonymous users to view reference data for landing pages
-- This enables Server Components to work without authentication

CREATE POLICY IF NOT EXISTS "Public can view object types"
  ON public.object_types
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view regions"
  ON public.regions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view catalog categories"
  ON public.catalog_categories
  FOR SELECT
  TO public
  USING (true);

-- But wait - we disabled RLS on these tables above!
-- Let's re-enable it with proper anon policies

ALTER TABLE public.object_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICATION QUERIES (commented out - run manually if needed)
-- ============================================================

/*
-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'object_types', 'regions', 'catalog_categories')
ORDER BY tablename;

-- Check policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'object_types', 'regions', 'catalog_categories')
ORDER BY tablename, policyname;
*/

-- ============================================================
-- SUMMARY
-- ============================================================
-- ✅ object_types: RLS enabled, public SELECT access
-- ✅ regions: RLS enabled, public SELECT access
-- ✅ catalog_categories: RLS enabled, public SELECT access
-- ✅ profiles: RLS enabled, authenticated can view all (for user info display)
-- ✅ catalog_items: RLS enabled, authenticated can view all, users can manage own
-- ============================================================
