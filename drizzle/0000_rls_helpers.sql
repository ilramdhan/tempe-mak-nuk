-- Custom migration (drizzle-kit generate --custom): RLS helper functions.
-- Runs BEFORE the tables exist, so the bodies are plpgsql (table references are
-- resolved at call time, not at CREATE time). SECURITY DEFINER lets policies read
-- public.profiles without recursing into its own RLS. search_path='' → every
-- identifier is schema-qualified.

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = required_role
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('owner', 'editor')
  );
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.has_role(text) FROM public;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.has_role(text) TO anon, authenticated, service_role;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
