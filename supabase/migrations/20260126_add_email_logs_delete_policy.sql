-- Migration: Add DELETE policy for email_logs
-- Description: Allow users to delete their own email log entries

-- RLS Policy: Users can delete their own email logs
DROP POLICY IF EXISTS "Users can delete their own email logs" ON public.email_logs;
CREATE POLICY "Users can delete their own email logs"
  ON public.email_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON POLICY "Users can delete their own email logs" ON public.email_logs IS 'Users can delete email log entries they created';
