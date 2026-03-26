-- Fix handle_new_user(event jsonb) webhook — was missing email field
-- Root cause: new users registered via Auth webhook got profiles.email = NULL
-- which caused "Użytkownik z tym adresem email nie istnieje" in invite flow

CREATE OR REPLACE FUNCTION public.handle_new_user(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id uuid;
  user_email text;
BEGIN
  user_id    := (event->>'user_id')::uuid;
  user_email := event->>'email';

  INSERT INTO public.profiles (
    id, email, is_pro, role, show_global_catalog, created_at, updated_at
  )
  VALUES (
    user_id, user_email, false, 'user', true, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = COALESCE(EXCLUDED.email, profiles.email),
        updated_at = NOW();

  RETURN event;
END;
$$;

-- Backfill all profiles that have email = NULL from auth.users
UPDATE public.profiles p
SET email      = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE au.id = p.id
  AND p.email IS NULL
  AND au.email IS NOT NULL;
