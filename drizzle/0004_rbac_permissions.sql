CREATE TABLE "role_permissions" (
	"role" "user_role" NOT NULL,
	"permission" text NOT NULL,
	"allowed" boolean NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_permission_pk" PRIMARY KEY("role","permission")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"allowed" boolean NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_permissions_user_id_permission_pk" PRIMARY KEY("user_id","permission")
);
--> statement-breakpoint
ALTER TABLE "user_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_permissions_updated_by_idx" ON "role_permissions" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "user_permissions_updated_by_idx" ON "user_permissions" USING btree ("updated_by");--> statement-breakpoint
CREATE POLICY "role_permissions_admin_read" ON "role_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "role_permissions_owner_all" ON "role_permissions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.has_role('owner'))) WITH CHECK ((select public.has_role('owner')));--> statement-breakpoint
CREATE POLICY "user_permissions_read_own_or_owner" ON "user_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "user_permissions"."user_id" or (select public.has_role('owner')));--> statement-breakpoint
CREATE POLICY "user_permissions_owner_all" ON "user_permissions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.has_role('owner'))) WITH CHECK ((select public.has_role('owner')));--> statement-breakpoint
-- P8.14: table privileges, consistent with 0002 (Supabase grants these via default privileges;
-- repeating them keeps plain-Postgres CI working). RLS restricts rows: owners write, admins read.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions, public.user_permissions TO authenticated, service_role;
--> statement-breakpoint
-- anon has no policy here (no rows visible); also drop write privileges as defense in depth.
REVOKE INSERT, UPDATE, DELETE ON public.role_permissions, public.user_permissions FROM anon;
