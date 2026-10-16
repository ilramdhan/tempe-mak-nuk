import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "editor"]);
export const pageStatus = pgEnum("page_status", ["draft", "published"]);
/** Posts & recipes. `scheduled` rows become public once `published_at <= now()`. */
export const contentStatus = pgEnum("content_status", [
  "draft",
  "scheduled",
  "published",
]);
export const navLocation = pgEnum("nav_location", [
  "header",
  "footer_col1",
  "footer_col2",
  "footer_col3",
  "footer_col4",
  "legal",
  "social",
]);
export const productVariant = pgEnum("product_variant", [
  "classic",
  "skinless",
]);
export const categoryKind = pgEnum("category_kind", ["post", "recipe", "faq"]);
export const recipeDifficulty = pgEnum("recipe_difficulty", [
  "easy",
  "medium",
  "hard",
]);
/** `auto` = derive from capacity/booked; others are manual overrides. */
export const slotStatus = pgEnum("slot_status", [
  "auto",
  "open",
  "full",
  "closed",
]);
export const legalSlug = pgEnum("legal_slug", [
  "privacy",
  "terms",
  "cookies",
  "ordering",
]);
export const waClickKind = pgEnum("wa_click_kind", ["order", "general", "b2b"]);

export type UserRole = (typeof userRole.enumValues)[number];
export type PageStatus = (typeof pageStatus.enumValues)[number];
export type ContentStatus = (typeof contentStatus.enumValues)[number];
export type NavLocation = (typeof navLocation.enumValues)[number];
export type ProductVariant = (typeof productVariant.enumValues)[number];
export type CategoryKind = (typeof categoryKind.enumValues)[number];
export type RecipeDifficulty = (typeof recipeDifficulty.enumValues)[number];
export type SlotStatus = (typeof slotStatus.enumValues)[number];
export type LegalSlug = (typeof legalSlug.enumValues)[number];
export type WaClickKind = (typeof waClickKind.enumValues)[number];
