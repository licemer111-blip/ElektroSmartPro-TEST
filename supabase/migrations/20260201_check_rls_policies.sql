-- =====================================================
-- CHECK: Verify RLS policies are correctly applied
-- =====================================================

-- 1. Check all policies on project_items table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'project_items'
ORDER BY cmd, policyname;

-- 2. Check if helper function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc 
WHERE proname = 'user_can_edit_project';

-- 3. Test the function with current user
SELECT 
  'Testing user_can_edit_project function' as test,
  auth.uid() as current_user_id;

-- 4. Check RLS is enabled on project_items
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'project_items';

-- 5. Try to see what happens when we try to delete (simulation)
-- This will show if there are any permission issues
EXPLAIN (VERBOSE, COSTS OFF)
DELETE FROM project_items 
WHERE id = '00000000-0000-0000-0000-000000000000';
