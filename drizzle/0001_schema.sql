CREATE TYPE "public"."category_kind" AS ENUM('post', 'recipe', 'faq');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."legal_slug" AS ENUM('privacy', 'terms', 'cookies', 'ordering');--> statement-breakpoint
CREATE TYPE "public"."nav_location" AS ENUM('header', 'footer_col1', 'footer_col2', 'footer_col3', 'footer_col4', 'legal', 'social');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."product_variant" AS ENUM('classic', 'skinless');--> statement-breakpoint
CREATE TYPE "public"."recipe_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('auto', 'open', 'full', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."wa_click_kind" AS ENUM('order', 'general', 'b2b');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'editor' NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"group" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"href" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "nav_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" "nav_location" NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"parent_id" uuid,
	"sort" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nav_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "page_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"permanent" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "redirects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_path" text NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"width" integer,
	"height" integer,
	"mime" text,
	"size_bytes" integer,
	"blur_data_url" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "nutrition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"per_grams" integer DEFAULT 100 NOT NULL,
	"energy_kcal" numeric(7, 2),
	"protein_g" numeric(7, 2),
	"fat_g" numeric(7, 2),
	"carbs_g" numeric(7, 2),
	"fiber_g" numeric(7, 2),
	"calcium_mg" numeric(7, 2),
	"iron_mg" numeric(7, 2),
	"source" text NOT NULL,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nutrition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_media" (
	"product_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_media_product_id_media_id_pk" PRIMARY KEY("product_id","media_id")
);
--> statement-breakpoint
ALTER TABLE "product_media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_shape_links" (
	"product_id" uuid NOT NULL,
	"shape_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_shape_links_product_id_shape_id_pk" PRIMARY KEY("product_id","shape_id")
);
--> statement-breakpoint
ALTER TABLE "product_shape_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_shapes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_shapes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_size_links" (
	"product_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"price" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_size_links_product_id_size_id_pk" PRIMARY KEY("product_id","size_id")
);
--> statement-breakpoint
ALTER TABLE "product_size_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_sizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"weight_grams" integer,
	"dims" text,
	"price" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_sizes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short" text,
	"description" jsonb,
	"variant" "product_variant" NOT NULL,
	"price_from" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "category_kind" NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category_id" uuid,
	"sort" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "post_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" jsonb,
	"cover_media_id" uuid,
	"category_id" uuid,
	"author_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"reading_minutes" smallint,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" jsonb,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prep_minutes" smallint,
	"cook_minutes" smallint,
	"servings" smallint,
	"difficulty" "recipe_difficulty",
	"product_id" uuid,
	"category_id" uuid,
	"cover_media_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"city" text,
	"quote" text NOT NULL,
	"rating" smallint,
	"media_id" uuid,
	"verified" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_placeholder" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "holidays" (
	"date" date PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holidays" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "slot_days" (
	"date" date PRIMARY KEY NOT NULL,
	"capacity" integer,
	"booked" integer DEFAULT 0 NOT NULL,
	"status" "slot_status" DEFAULT 'auto' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slot_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" "legal_slug" NOT NULL,
	"title" text NOT NULL,
	"content" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"effective_at" timestamp with time zone,
	"status" "page_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wa_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"variant" text,
	"kind" "wa_click_kind" DEFAULT 'general' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wa_clicks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nav_items" ADD CONSTRAINT "nav_items_parent_id_nav_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nav_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition" ADD CONSTRAINT "nutrition_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_shape_links" ADD CONSTRAINT "product_shape_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_shape_links" ADD CONSTRAINT "product_shape_links_shape_id_product_shapes_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."product_shapes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_links" ADD CONSTRAINT "product_size_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_links" ADD CONSTRAINT "product_size_links_size_id_product_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."product_sizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "settings_group_idx" ON "settings" USING btree ("group");--> statement-breakpoint
CREATE INDEX "settings_updated_by_idx" ON "settings" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "announcements_active_window_idx" ON "announcements" USING btree ("active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "nav_items_location_sort_idx" ON "nav_items" USING btree ("location","sort");--> statement-breakpoint
CREATE INDEX "nav_items_parent_idx" ON "nav_items" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "page_sections_page_sort_idx" ON "page_sections" USING btree ("page_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_key" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "redirects_from_key" ON "redirects" USING btree ("from");--> statement-breakpoint
CREATE UNIQUE INDEX "media_storage_path_key" ON "media" USING btree ("storage_path");--> statement-breakpoint
CREATE INDEX "media_created_by_idx" ON "media" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_product_per_grams_key" ON "nutrition" USING btree ("product_id","per_grams");--> statement-breakpoint
CREATE INDEX "product_media_media_idx" ON "product_media" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "product_media_product_sort_idx" ON "product_media" USING btree ("product_id","sort");--> statement-breakpoint
CREATE INDEX "product_shape_links_shape_idx" ON "product_shape_links" USING btree ("shape_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_shapes_slug_key" ON "product_shapes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_shapes_sort_idx" ON "product_shapes" USING btree ("sort");--> statement-breakpoint
CREATE INDEX "product_size_links_size_idx" ON "product_size_links" USING btree ("size_id");--> statement-breakpoint
CREATE INDEX "product_sizes_sort_idx" ON "product_sizes" USING btree ("sort");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_key" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_active_sort_idx" ON "products" USING btree ("is_active","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_kind_slug_key" ON "categories" USING btree ("kind","slug");--> statement-breakpoint
CREATE INDEX "categories_kind_sort_idx" ON "categories" USING btree ("kind","sort");--> statement-breakpoint
CREATE INDEX "faqs_category_sort_idx" ON "faqs" USING btree ("category_id","sort");--> statement-breakpoint
CREATE INDEX "faqs_visible_sort_idx" ON "faqs" USING btree ("visible","sort");--> statement-breakpoint
CREATE INDEX "post_tags_tag_idx" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_key" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_published_at_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "posts_cover_media_idx" ON "posts" USING btree ("cover_media_id");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "recipes_status_published_at_idx" ON "recipes" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "recipes_product_idx" ON "recipes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "recipes_category_idx" ON "recipes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "recipes_cover_media_idx" ON "recipes" USING btree ("cover_media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "testimonials_visible_sort_idx" ON "testimonials" USING btree ("visible","sort");--> statement-breakpoint
CREATE INDEX "testimonials_media_idx" ON "testimonials" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_slug_version_key" ON "legal_documents" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "legal_documents_status_idx" ON "legal_documents" USING btree ("status","effective_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wa_clicks_created_at_idx" ON "wa_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wa_clicks_kind_created_at_idx" ON "wa_clicks" USING btree ("kind","created_at");--> statement-breakpoint
CREATE POLICY "profiles_read_own_or_admin" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = id or (select public.is_admin()));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id and (select public.has_role(role::text)));--> statement-breakpoint
CREATE POLICY "profiles_owner_all" ON "profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.has_role('owner'))) WITH CHECK ((select public.has_role('owner')));--> statement-breakpoint
CREATE POLICY "public_read" ON "settings" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("settings"."group" <> 'private');--> statement-breakpoint
CREATE POLICY "admin_all" ON "settings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "announcements" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("announcements"."active" and ("announcements"."starts_at" is null or "announcements"."starts_at" <= now()) and ("announcements"."ends_at" is null or "announcements"."ends_at" > now()));--> statement-breakpoint
CREATE POLICY "admin_all" ON "announcements" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "nav_items" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("nav_items"."visible");--> statement-breakpoint
CREATE POLICY "admin_all" ON "nav_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "page_sections" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("page_sections"."visible" and exists (select 1 from public.pages p where p.id = "page_sections"."page_id" and p.status = 'published'));--> statement-breakpoint
CREATE POLICY "admin_all" ON "page_sections" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "pages" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("pages"."status" = 'published');--> statement-breakpoint
CREATE POLICY "admin_all" ON "pages" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "redirects" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all" ON "redirects" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "media" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all" ON "media" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "nutrition" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from public.products p where p.id = "nutrition"."product_id" and p.is_active));--> statement-breakpoint
CREATE POLICY "admin_all" ON "nutrition" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "product_media" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from public.products p where p.id = "product_media"."product_id" and p.is_active));--> statement-breakpoint
CREATE POLICY "admin_all" ON "product_media" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "product_shape_links" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from public.products p where p.id = "product_shape_links"."product_id" and p.is_active));--> statement-breakpoint
CREATE POLICY "admin_all" ON "product_shape_links" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "product_shapes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("product_shapes"."active");--> statement-breakpoint
CREATE POLICY "admin_all" ON "product_shapes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "product_size_links" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from public.products p where p.id = "product_size_links"."product_id" and p.is_active));--> statement-breakpoint
CREATE POLICY "admin_all" ON "product_size_links" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "product_sizes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("product_sizes"."active");--> statement-breakpoint
CREATE POLICY "admin_all" ON "product_sizes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "products" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("products"."is_active");--> statement-breakpoint
CREATE POLICY "admin_all" ON "products" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all" ON "categories" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "faqs" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("faqs"."visible");--> statement-breakpoint
CREATE POLICY "admin_all" ON "faqs" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "post_tags" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from public.posts p where p.id = "post_tags"."post_id" and p.status in ('published', 'scheduled') and p.published_at is not null and p.published_at <= now()));--> statement-breakpoint
CREATE POLICY "admin_all" ON "post_tags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "posts" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("posts"."status" in ('published', 'scheduled') and "posts"."published_at" is not null and "posts"."published_at" <= now());--> statement-breakpoint
CREATE POLICY "admin_all" ON "posts" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "recipes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("recipes"."status" in ('published', 'scheduled') and "recipes"."published_at" is not null and "recipes"."published_at" <= now());--> statement-breakpoint
CREATE POLICY "admin_all" ON "recipes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "tags" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all" ON "tags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "testimonials" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("testimonials"."visible");--> statement-breakpoint
CREATE POLICY "admin_all" ON "testimonials" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "holidays" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all" ON "holidays" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "slot_days" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all" ON "slot_days" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "public_read" ON "legal_documents" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("legal_documents"."status" = 'published');--> statement-breakpoint
CREATE POLICY "admin_all" ON "legal_documents" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "audit_log_admin_select" ON "audit_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "wa_clicks_public_insert" ON "wa_clicks" AS PERMISSIVE FOR INSERT TO "anon", "authenticated" WITH CHECK (char_length("wa_clicks"."source") between 1 and 200 and ("wa_clicks"."variant" is null or char_length("wa_clicks"."variant") <= 100));--> statement-breakpoint
CREATE POLICY "admin_all" ON "wa_clicks" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));