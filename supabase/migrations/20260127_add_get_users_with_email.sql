-- ============================================
-- Add RPC function to get users with email
-- ============================================
-- This function joins profiles with auth.users to get email addresses

-- Drop function if exists (for re-running migration)
DROP FUNCTION IF EXISTS get_users_with_email();

-- Create RPC function that returns profiles with email
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  company_name TEXT,
  is_pro BOOLEAN,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return profiles joined with auth.users email
  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    p.company_name,
    p.is_pro,
    p.role,
    p.created_at,
    p.updated_at
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
-- (function will check admin role internally)
GRANT EXECUTE ON FUNCTION get_users_with_email() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_users_with_email() IS 
'Admin-only function: Returns all user profiles with email addresses from auth.users';
