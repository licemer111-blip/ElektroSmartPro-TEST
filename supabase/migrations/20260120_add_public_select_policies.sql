-- ============================================================
-- ADD PUBLIC SELECT ACCESS to catalog_items and profiles
-- ============================================================
-- Issue: Server Components getting 403 because tables lack public policies
-- Solution: Add PUBLIC SELECT policies for anonymous access
-- ============================================================

-- catalog_items: Add PUBLIC SELECT
DROP POLICY IF EXISTS "Public can view catalog items" ON public.catalog_items;
CREATE POLICY "Public can view catalog items"
  ON public.catalog_items
  FOR SELECT
  TO public
  USING (true);

-- profiles: Add PUBLIC SELECT for basic info display
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
CREATE POLICY "Public can view basic profile info"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICATION
-- ============================================================

/*
-- Check that policies are created:
SELECT tablename, policyname, roles::text, qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('catalog_items', 'profiles')
AND cmd = 'SELECT'
ORDER BY tablename;

-- Expected output:
-- catalog_items | Allow select for authenticated   | {authenticated} | true
-- catalog_items | Authenticated users can view...  | {authenticated} | true
-- catalog_items | Public can view catalog items    | {public}        | true
-- profiles      | Allow select for authenticated   | {authenticated} | true
-- profiles      | Public can view basic profile...| {public}        | true
*/

-- ============================================================
-- ✅ DONE
-- ============================================================
