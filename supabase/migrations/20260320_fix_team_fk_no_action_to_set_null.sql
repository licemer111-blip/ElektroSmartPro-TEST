-- Fix FK constraints that blocked user deletion from Supabase Auth Dashboard
-- team_invitations.invited_by and team_members.invited_by had NO ACTION
-- which caused "Failed to delete user: Database error deleting user"

ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_invited_by_fkey;
ALTER TABLE public.team_invitations
  ADD CONSTRAINT team_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_invited_by_fkey;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
