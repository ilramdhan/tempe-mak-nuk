/**
 * Typed settings values. One Zod validator per key in SETTINGS_KEYS (src/db/schema/settings.ts),
 * derived from its `kind`, with richer schemas for structured (json) and constrained keys.
 * Client-safe (admin forms import it).
 */
import { z } from "zod";

import {
  SETTING_KEY_LIST,
  SETTINGS_KEYS,
  type SettingKey,
  type SettingValueKind,
} from "@/db/schema/settings";

const emptyOr = <T extends z.ZodType>(s: T) => z.union([z.literal(""), s]);

const KIND_SCHEMAS = {
  string: z.string().trim().max(300),
  text: z.string().trim().max(2000),
  url: emptyOr(z.url({ protocol: /^https?$/ })),
  email: emptyOr(z.email()),
  phone: emptyOr(z.string().regex(/^[1-9]\d{7,14}$/, "Hanya angka, format internasional (62…)")),
  date: emptyOr(z.iso.date()),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:mm"),
  int: z.number().int(),
  number: z.number(),
  boolean: z.boolean(),
  "int[]": z.array(z.number().int()),
  "string[]": z.array(z.string().trim().min(1).max(300)).max(50),
  json: z.unknown(),
} as const satisfies Record<SettingValueKind, z.ZodType>;

type KindSchemas = typeof KIND_SCHEMAS;

export const hoursSchema = z.object({
  summary: z.string().trim().max(300),
  days: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        open: KIND_SCHEMAS.time,
        close: KIND_SCHEMAS.time,
      }),
    )
    .max(7)
    .optional(),
});
export type Hours = z.infer<typeof hoursSchema>;

export const consentCategorySchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_-]{0,30}$/),
  label: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500),
  required: z.boolean(),
});
export const consentConfigSchema = z.object({
  version: z.number().int().min(1),
  bannerText: z.string().trim().max(1000),
  categories: z.array(consentCategorySchema).min(1).max(10),
});
export type ConsentConfig = z.infer<typeof consentConfigSchema>;

/** Keys whose validator is stricter than their kind's default. */
const OVERRIDES = {
  hours: hoursSchema,
  "consent.config": consentConfigSchema,
  "order.leadDays": z.number().int().min(0).max(60),
  "order.slotsPerDay": z.number().int().min(0).max(1000),
  "order.nearlyFullThreshold": z.number().int().min(0).max(1000),
  "order.closedWeekdays": z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .transform((a) => [...new Set(a)].sort()),
  "business.foundedYear": z.number().int().min(1900).max(2100),
  "geo.lat": z.number().min(-90).max(90),
  "geo.lng": z.number().min(-180).max(180),
  "address.country": z.string().regex(/^[A-Z]{2}$/),
  "seo.defaultOgImageId": emptyOr(z.uuid()),
} satisfies Partial<Record<SettingKey, z.ZodType>>;

type Overrides = typeof OVERRIDES;
type SchemaFor<K extends SettingKey> = K extends keyof Overrides
  ? Overrides[K]
  : KindSchemas[(typeof SETTINGS_KEYS)[K]["kind"]];

export type SettingSchemas = { [K in SettingKey]: SchemaFor<K> };

/** Per-key validators. */
export const settingSchemas = Object.fromEntries(
  SETTING_KEY_LIST.map((key) => [
    key,
    (OVERRIDES as Partial<Record<SettingKey, z.ZodType>>)[key] ??
      KIND_SCHEMAS[SETTINGS_KEYS[key].kind],
  ]),
) as SettingSchemas;

/** Whole settings object (every key required) — used by seed + admin bulk save. */
export const settingsSchema = z.object(settingSchemas);
export type Settings = z.output<typeof settingsSchema>;
export type SettingValue<K extends SettingKey> = Settings[K];

/**
 * Fallback values used when a row is missing/invalid or the DB is unavailable (CI build).
 * Business-critical rules use docs/business.md defaults; contact/identity fields stay empty
 * so nothing fake leaks into production if settings were never seeded.
 */
export const SETTINGS_DEFAULTS: Settings = {
  "business.name": "Tempe Mak Nuk",
  "business.legalName": "",
  "business.foundedYear": 2001,
  "business.owner": "",
  "contact.whatsapp": "",
  "contact.whatsappDisplay": "",
  "contact.email": "",
  "contact.phone": "",
  "address.street": "",
  "address.village": "",
  "address.district": "",
  "address.city": "",
  "address.province": "",
  "address.postalCode": "",
  "address.country": "ID",
  "geo.lat": 0,
  "geo.lng": 0,
  "maps.url": "",
  "maps.embedUrl": "",
  "halal.number": "",
  "halal.issuer": "",
  "halal.issuedAt": "",
  "halal.verifyUrl": "",
  "legal.nib": "",
  "legal.pirt": "",
  hours: { summary: "" },
  "order.leadDays": 4,
  "order.cutoffTime": "15:00",
  "order.slotsPerDay": 8,
  "order.nearlyFullThreshold": 2,
  "order.closedWeekdays": [0],
  "pricing.show": false,
  "delivery.areas": [],
  "payment.methods": [],
  "social.instagram": "",
  "social.tiktok": "",
  "social.facebook": "",
  "social.youtube": "",
  "social.googleBusiness": "",
  "site.url": "",
  "site.locale": "id-ID",
  "seo.defaultTitle": "Tempe Mak Nuk",
  "seo.titleTemplate": "%s — Tempe Mak Nuk",
  "seo.defaultDescription": "",
  "seo.defaultOgImageId": "",
  "cta.primaryLabel": "Cek slot via WhatsApp",
  "cta.primaryHref": "/custom-order",
  "cta.waFloatEnabled": true,
  "cta.waFloatMessage": "Halo Mak Nuk, saya ingin bertanya.",
  "consent.config": {
    version: 1,
    bannerText:
      "Kami memakai cookie wajib agar situs berjalan, dan cookie opsional hanya jika Anda setuju.",
    categories: [
      { key: "necessary", label: "Wajib", description: "Diperlukan agar situs berfungsi.", required: true },
      { key: "analytics", label: "Analitik", description: "Statistik penggunaan agregat.", required: false },
      { key: "marketing", label: "Pemasaran", description: "Pengukuran iklan.", required: false },
    ],
  },
};

/** Validate one raw DB value; returns the default on failure. */
export function parseSettingValue<K extends SettingKey>(
  key: K,
  raw: unknown,
): { value: Settings[K]; ok: boolean } {
  const res = (settingSchemas[key] as unknown as z.ZodType<Settings[K]>).safeParse(raw);
  return res.success
    ? { value: res.data, ok: true }
    : { value: SETTINGS_DEFAULTS[key], ok: false };
}

/** Merge raw rows (key → value) over defaults, validating each key. Unknown keys are ignored. */
export function mergeSettings(rows: Iterable<{ key: string; value: unknown }>): {
  settings: Settings;
  invalidKeys: SettingKey[];
} {
  const settings: Record<string, unknown> = { ...SETTINGS_DEFAULTS };
  const invalidKeys: SettingKey[] = [];
  for (const row of rows) {
    if (!(row.key in SETTINGS_KEYS)) continue;
    const key = row.key as SettingKey;
    const { value, ok } = parseSettingValue(key, row.value);
    settings[key] = value;
    if (!ok) invalidKeys.push(key);
  }
  return { settings: settings as Settings, invalidKeys };
}

/** Admin write: a partial update of any subset of keys. */
export const settingsUpdateSchema = settingsSchema.partial();
export type SettingsUpdate = z.input<typeof settingsUpdateSchema>;

/** Order rules slice consumed by features/slots/availability. */
export function orderRulesFromSettings(s: Settings) {
  return {
    leadDays: s["order.leadDays"],
    cutoffTime: s["order.cutoffTime"],
    closedWeekdays: s["order.closedWeekdays"],
    slotsPerDay: s["order.slotsPerDay"],
    nearlyFullThreshold: s["order.nearlyFullThreshold"],
  };
}

/** Keys safe to send to the browser (group ≠ private). */
export const PUBLIC_SETTING_KEYS = SETTING_KEY_LIST.filter(
  (k) => (SETTINGS_KEYS[k].group as string) !== "private",
);
