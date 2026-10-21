-- Custom migration (P7.3 security): new auth users get NO admin access by default.
-- Before: every auth user after the first got an 'editor' profile → with Supabase public sign-up
-- enabled, anyone could self-register into the admin. Now the trigger only bootstraps the very
-- first user as 'owner'; everyone else gets no profile row (requireRole → "no-access").
-- Editors are granted access explicitly: `inviteUser` (owner-only) inserts the 'editor' profile.
--
-- NOTE: existing profiles are NOT changed. Owner must review Admin → Pengguna (and Supabase Auth
-- users) for unknown accounts created while sign-up was open, and disable public sign-up.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Serialize concurrent first sign-ups so only one can become owner.
  PERFORM pg_advisory_xact_lock(hashtext('public.handle_new_auth_user'));
  IF EXISTS (SELECT 1 FROM public.profiles) THEN
    RETURN NEW; -- not the bootstrap user: no profile, no admin access
  END IF;

  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'owner',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM public, anon, authenticated;
