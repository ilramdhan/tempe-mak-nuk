-- Custom migration: auto-create a profiles row for every new Supabase auth user.
-- First user ever → 'owner'; everyone after → 'editor' (owner manages roles in Admin → Pengguna).
-- NOTE: public sign-up should stay DISABLED in Supabase Auth settings; editors are invited.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_role public.user_role;
BEGIN
  -- Serialize concurrent first sign-ups so only one can become owner.
  PERFORM pg_advisory_xact_lock(hashtext('public.handle_new_auth_user'));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner') THEN
    new_role := 'editor';
  ELSE
    new_role := 'owner';
  END IF;

  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    new_role,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM public, anon, authenticated;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
--> statement-breakpoint
-- Table privileges. Supabase already grants these via default privileges; repeating them
-- keeps the migration self-contained. RLS (enabled on every table) is what restricts rows.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
--> statement-breakpoint
-- Defense in depth: anon never needs to write anything except wa_clicks.
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
--> statement-breakpoint
GRANT INSERT ON public.wa_clicks TO anon;
--> statement-breakpoint
-- audit_log is append-only from the server (postgres role); clients may only read (RLS: admins).
REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM anon, authenticated;
