import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { adminAll, publicRead } from "./_shared";
import { profiles } from "./profiles";

/**
 * Key/value site settings. Every key from docs/business.md is listed in SETTINGS_KEYS
 * (seeded by P3.5, validated by the Zod map in src/features/settings/schema.ts).
 *
 * `group` drives the admin UI tabs AND visibility: rows in group `private` are never
 * readable by anon/authenticated (RLS) — use it for anything that must stay server-side.
 *
 * Cookie consent config (PROMPT §5.4) lives in the settings key `consent.config`
 * (group `consent`) rather than a separate table: it is a single document
 * { version, bannerText, categories[{ key, label, description, required }] } that the
 * public banner reads alongside other settings. Bumping `version` re-prompts visitors.
 */
export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    group: text("group").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    updatedBy: uuid("updated_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("settings_group_idx").on(t.group),
    index("settings_updated_by_idx").on(t.updatedBy),
    publicRead(sql`${t.group} <> 'private'`),
    adminAll(),
  ],
);

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

/** Value kinds the settings Zod map (features/settings/schema.ts) must implement. */
export type SettingValueKind =
  | "string"
  | "text"
  | "url"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "int"
  | "number"
  | "boolean"
  | "int[]"
  | "string[]"
  | "json";

type SettingDef = {
  group: SettingGroup;
  kind: SettingValueKind;
  note?: string;
};

export const SETTING_GROUPS = [
  "business",
  "contact",
  "address",
  "geo",
  "maps",
  "halal",
  "legal",
  "hours",
  "order",
  "pricing",
  "delivery",
  "payment",
  "social",
  "site",
  "seo",
  "cta",
  "consent",
  "private",
] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

/** Canonical list of settings keys (docs/business.md + admin "Pengaturan" / §5.4). */
export const SETTINGS_KEYS = {
  "business.name": { group: "business", kind: "string" },
  "business.legalName": { group: "business", kind: "string" },
  "business.foundedYear": { group: "business", kind: "int" },
  "business.owner": { group: "business", kind: "string" },
  "contact.whatsapp": {
    group: "contact",
    kind: "phone",
    note: "digits only, e.g. 6281234567890 (wa.me)",
  },
  "contact.whatsappDisplay": { group: "contact", kind: "string" },
  "contact.email": { group: "contact", kind: "email" },
  "contact.phone": { group: "contact", kind: "string" },
  "address.street": { group: "address", kind: "string" },
  "address.village": { group: "address", kind: "string" },
  "address.district": { group: "address", kind: "string" },
  "address.city": { group: "address", kind: "string" },
  "address.province": { group: "address", kind: "string" },
  "address.postalCode": { group: "address", kind: "string" },
  "address.country": {
    group: "address",
    kind: "string",
    note: "ISO 3166-1 alpha-2",
  },
  "geo.lat": { group: "geo", kind: "number" },
  "geo.lng": { group: "geo", kind: "number" },
  "maps.url": { group: "maps", kind: "url" },
  "maps.embedUrl": { group: "maps", kind: "url" },
  "halal.number": { group: "halal", kind: "string" },
  "halal.issuer": { group: "halal", kind: "string" },
  "halal.issuedAt": { group: "halal", kind: "date", note: "YYYY-MM-DD" },
  "halal.verifyUrl": { group: "halal", kind: "url" },
  "legal.nib": { group: "legal", kind: "string" },
  "legal.pirt": { group: "legal", kind: "string" },
  hours: {
    group: "hours",
    kind: "json",
    note: "{ summary: string, days?: [...] } — free text summary required",
  },
  "order.leadDays": { group: "order", kind: "int" },
  "order.cutoffTime": {
    group: "order",
    kind: "time",
    note: "HH:mm, Asia/Jakarta",
  },
  "order.slotsPerDay": {
    group: "order",
    kind: "int",
    note: "default capacity when slot_days.capacity is null",
  },
  "order.nearlyFullThreshold": { group: "order", kind: "int" },
  "order.closedWeekdays": {
    group: "order",
    kind: "int[]",
    note: "0=Sunday … 6=Saturday",
  },
  "pricing.show": { group: "pricing", kind: "boolean" },
  "delivery.areas": { group: "delivery", kind: "string[]" },
  "payment.methods": { group: "payment", kind: "string[]" },
  "social.instagram": { group: "social", kind: "url" },
  "social.tiktok": { group: "social", kind: "url" },
  "social.facebook": { group: "social", kind: "url" },
  "social.youtube": { group: "social", kind: "url" },
  "social.googleBusiness": { group: "social", kind: "url" },
  "site.url": { group: "site", kind: "url" },
  "site.locale": { group: "site", kind: "string" },
  "seo.defaultTitle": { group: "seo", kind: "string" },
  "seo.titleTemplate": {
    group: "seo",
    kind: "string",
    note: "e.g. %s · Tempe Mak Nuk",
  },
  "seo.defaultDescription": { group: "seo", kind: "text" },
  "seo.defaultOgImageId": {
    group: "seo",
    kind: "string",
    note: "media.id (uuid) or empty",
  },
  "cta.primaryLabel": { group: "cta", kind: "string" },
  "cta.primaryHref": { group: "cta", kind: "string" },
  "cta.waFloatEnabled": { group: "cta", kind: "boolean" },
  "cta.waFloatMessage": { group: "cta", kind: "text" },
  "consent.config": {
    group: "consent",
    kind: "json",
    note: "{ version, bannerText, categories[] } — see comment above",
  },
} as const satisfies Record<string, SettingDef>;

export type SettingKey = keyof typeof SETTINGS_KEYS;
export const SETTING_KEY_LIST = Object.keys(SETTINGS_KEYS) as SettingKey[];
