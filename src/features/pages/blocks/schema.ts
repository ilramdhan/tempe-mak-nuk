/**
 * Section block schemas (P3.3). Stored in `page_sections` as { type, data }.
 * Client-safe: the admin page builder (P5.3) imports these for forms + validation.
 *
 * Conventions:
 * - Optional text is `nullish` (seed + admin may send null).
 * - Images reference `media.id` (`{ mediaId, alt? }`) — renderers resolve via the media lookup,
 *   falling back to an art-directed placeholder when missing.
 * - Icons are lucide kebab-case names from a fixed allow-list (ICON_NAMES).
 */
import { z } from "zod";

import { hrefSchema, uuidSchema } from "@/features/_shared/schema";
import { richTextDocSchema } from "@/lib/rich-text/schema";
import { SETTING_KEY_LIST } from "@/db/schema/settings";

export const ICON_NAMES = [
  "alert-triangle",
  "award",
  "baby",
  "badge-check",
  "calendar",
  "chef-hat",
  "check",
  "clock",
  "droplets",
  "dumbbell",
  "eye",
  "hand",
  "heart-handshake",
  "home",
  "leaf",
  "map-pin",
  "message-circle",
  "package",
  "ruler",
  "shapes",
  "shield-check",
  "sparkles",
  "sprout",
  "square",
  "star",
  "truck",
  "utensils",
  "wheat",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const iconSchema = z.enum(ICON_NAMES);
/** Unknown icon names degrade to null instead of failing the whole block. */
const optIcon = iconSchema.nullish().catch(null).transform((v) => v ?? null);

export const ctaLinkSchema = z.object({
  label: text(60).min(1),
  href: hrefSchema,
});
export type CtaLink = z.infer<typeof ctaLinkSchema>;
const optCta = ctaLinkSchema.nullish().transform((v) => v ?? null);

export const blockImageSchema = z.object({
  mediaId: uuidSchema,
  alt: optText(300),
});
export type BlockImage = z.infer<typeof blockImageSchema>;
const optImage = blockImageSchema.nullish().transform((v) => v ?? null);

/** Shared section framing every block accepts. */
const frame = {
  /** In-page anchor id (a-z, 0-9, -). */
  anchor: z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,40}$/)
    .nullish()
    .transform((v) => v ?? null),
  tone: z.enum(["default", "surface", "primary", "inverse"]).nullish().transform((v) => v ?? null),
};

const heading = { eyebrow: optText(80), heading: optText(160), intro: optText(600) };

export const heroBlockSchema = z.object({
  ...frame,
  eyebrow: optText(80),
  headline: text(160).min(1),
  subheadline: optText(400),
  primaryCta: optCta,
  secondaryCta: optCta,
  image: optImage,
  /** split = text left / image right; center = centered text (no image). */
  layout: z.enum(["split", "center"]).default("split"),
});

export const richTextBlockSchema = z.object({
  ...frame,
  ...heading,
  content: richTextDocSchema,
  width: z.enum(["prose", "default"]).default("prose"),
});

export const featureGridBlockSchema = z.object({
  ...frame,
  ...heading,
  items: z
    .array(z.object({ icon: optIcon, title: text(100).min(1), body: optText(500) }))
    .min(1)
    .max(12),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).nullish().transform((v) => v ?? null),
});

export const compareBlockSchema = z
  .object({
    ...frame,
    ...heading,
    columns: z.array(text(80).min(1)).min(1).max(6),
    rows: z
      .array(z.object({ label: text(120).min(1), values: z.array(text(300)).max(6) }))
      .min(1)
      .max(40),
    note: optText(400),
  })
  .superRefine((v, ctx) => {
    v.rows.forEach((r, i) => {
      if (r.values.length !== v.columns.length)
        ctx.addIssue({
          code: "custom",
          path: ["rows", i, "values"],
          message: `Jumlah nilai (${r.values.length}) harus sama dengan jumlah kolom (${v.columns.length})`,
        });
    });
  });

export const stepsBlockSchema = z.object({
  ...frame,
  ...heading,
  items: z
    .array(z.object({ title: text(120).min(1), body: optText(600), icon: optIcon }))
    .min(1)
    .max(12),
  cta: optCta,
});

export const statsBlockSchema = z.object({
  ...frame,
  ...heading,
  items: z
    .array(
      z.object({
        value: text(20).min(1),
        unit: optText(20),
        label: text(80).min(1),
      }),
    )
    .min(1)
    .max(12),
  /** Citation shown under the stats (mandatory for nutrition claims). */
  source: optText(300),
});

export const ctaBlockSchema = z.object({
  ...frame,
  eyebrow: optText(80),
  headline: text(160).min(1),
  body: optText(500),
  primary: optCta,
  secondary: optCta,
});

export const faqListBlockSchema = z.object({
  ...frame,
  ...heading,
  /** "home" = FAQs flagged show_on_home, "all" = every visible FAQ (grouped by category). */
  source: z.enum(["home", "all"]).nullish().transform((v) => v ?? null),
  /** FAQ category slug (categories.kind = 'faq'). Takes precedence over `source`. */
  category: z
    .string()
    .regex(/^[a-z0-9-]{1,120}$/)
    .nullish()
    .transform((v) => v ?? null),
  ids: z.array(uuidSchema).max(50).nullish().transform((v) => v ?? null),
  limit: z.number().int().min(1).max(100).nullish().transform((v) => v ?? null),
  searchable: z.boolean().default(false),
  cta: optCta,
});

export const testimonialListBlockSchema = z.object({
  ...frame,
  ...heading,
  ids: z.array(uuidSchema).max(30).nullish().transform((v) => v ?? null),
  limit: z.number().int().min(1).max(30).default(3),
  cta: optCta,
});

export const galleryBlockSchema = z.object({
  ...frame,
  ...heading,
  items: z
    .array(z.object({ mediaId: uuidSchema, alt: optText(300), caption: optText(200) }))
    .max(40),
  /** Shown when there are no items yet (e.g. "Foto menyusul"). */
  note: optText(300),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export const productTeaserBlockSchema = z.object({
  ...frame,
  ...heading,
  /** Empty/omitted = all active products by sort. */
  productSlugs: z.array(z.string().regex(/^[a-z0-9-]{1,120}$/)).max(12).nullish().transform((v) => v ?? null),
  ctaLabel: optText(60),
  cta: optCta,
});

export const slotCalendarPreviewBlockSchema = z.object({
  ...frame,
  ...heading,
  days: z.number().int().min(7).max(60).default(14),
  cta: optCta,
});

export const recipeTeaserBlockSchema = z.object({
  ...frame,
  ...heading,
  slugs: z.array(z.string().regex(/^[a-z0-9-]{1,120}$/)).max(12).nullish().transform((v) => v ?? null),
  limit: z.number().int().min(1).max(12).default(3),
  cta: optCta,
});

export const postTeaserBlockSchema = z.object({
  ...frame,
  ...heading,
  slugs: z.array(z.string().regex(/^[a-z0-9-]{1,120}$/)).max(12).nullish().transform((v) => v ?? null),
  /** Category slug filter (categories.kind = 'post'). */
  category: z.string().regex(/^[a-z0-9-]{1,120}$/).nullish().transform((v) => v ?? null),
  limit: z.number().int().min(1).max(12).default(3),
  cta: optCta,
});

export const trustStripBlockSchema = z.object({
  ...frame,
  items: z.array(z.object({ icon: optIcon, label: text(80).min(1) })).min(1).max(8),
});

export const logoStripBlockSchema = z.object({
  ...frame,
  ...heading,
  items: z
    .array(z.object({ mediaId: uuidSchema.nullish().transform((v) => v ?? null), label: text(80).min(1), href: hrefSchema.nullish().transform((v) => v ?? null) }))
    .min(1)
    .max(16),
});

export const settingKeySchema = z.enum(SETTING_KEY_LIST as [string, ...string[]]);

export const splitBlockSchema = z.object({
  ...frame,
  eyebrow: optText(80),
  heading: optText(160),
  body: optText(2000),
  /** Optional rich body (wins over `body`). */
  content: richTextDocSchema.nullish().transform((v) => v ?? null),
  /** Label + value pulled live from settings (e.g. halal.number). */
  facts: z
    .array(z.object({ label: text(60).min(1), settingKey: settingKeySchema }))
    .max(12)
    .default([]),
  cta: optCta,
  image: optImage,
  imagePosition: z.enum(["left", "right"]).default("right"),
  /** Show Google Maps embed (settings maps.embedUrl) in place of the image. */
  map: z.boolean().default(false),
});

export const BLOCK_SCHEMAS = {
  hero: heroBlockSchema,
  richText: richTextBlockSchema,
  featureGrid: featureGridBlockSchema,
  compare: compareBlockSchema,
  steps: stepsBlockSchema,
  stats: statsBlockSchema,
  cta: ctaBlockSchema,
  faqList: faqListBlockSchema,
  testimonialList: testimonialListBlockSchema,
  gallery: galleryBlockSchema,
  productTeaser: productTeaserBlockSchema,
  slotCalendarPreview: slotCalendarPreviewBlockSchema,
  recipeTeaser: recipeTeaserBlockSchema,
  postTeaser: postTeaserBlockSchema,
  trustStrip: trustStripBlockSchema,
  logoStrip: logoStripBlockSchema,
  split: splitBlockSchema,
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;
export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS) as BlockType[];
export type BlockDataMap = { [K in BlockType]: z.output<(typeof BLOCK_SCHEMAS)[K]> };
export type BlockInputMap = { [K in BlockType]: z.input<(typeof BLOCK_SCHEMAS)[K]> };
export type BlockData<K extends BlockType = BlockType> = BlockDataMap[K];

/** Discriminated union over `{ type, data }` (the page_sections row shape). */
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), data: heroBlockSchema }),
  z.object({ type: z.literal("richText"), data: richTextBlockSchema }),
  z.object({ type: z.literal("featureGrid"), data: featureGridBlockSchema }),
  z.object({ type: z.literal("compare"), data: compareBlockSchema }),
  z.object({ type: z.literal("steps"), data: stepsBlockSchema }),
  z.object({ type: z.literal("stats"), data: statsBlockSchema }),
  z.object({ type: z.literal("cta"), data: ctaBlockSchema }),
  z.object({ type: z.literal("faqList"), data: faqListBlockSchema }),
  z.object({ type: z.literal("testimonialList"), data: testimonialListBlockSchema }),
  z.object({ type: z.literal("gallery"), data: galleryBlockSchema }),
  z.object({ type: z.literal("productTeaser"), data: productTeaserBlockSchema }),
  z.object({ type: z.literal("slotCalendarPreview"), data: slotCalendarPreviewBlockSchema }),
  z.object({ type: z.literal("recipeTeaser"), data: recipeTeaserBlockSchema }),
  z.object({ type: z.literal("postTeaser"), data: postTeaserBlockSchema }),
  z.object({ type: z.literal("trustStrip"), data: trustStripBlockSchema }),
  z.object({ type: z.literal("logoStrip"), data: logoStripBlockSchema }),
  z.object({ type: z.literal("split"), data: splitBlockSchema }),
]);
export type Block = z.output<typeof blockSchema>;
export type BlockInput = z.input<typeof blockSchema>;

/** Alias (seed/admin naming). */
export const pageSectionSchema = blockSchema;

/** A block as rendered: validated data + row metadata. */
export type RenderableBlock = Block & { id: string };

/** Admin write for one section row. */
export const pageSectionInputSchema = z
  .object({
    pageId: uuidSchema,
    sort: z.coerce.number().int().min(0).max(10_000).default(0),
    visible: z.boolean().default(true),
  })
  .and(blockSchema);
export type PageSectionInput = z.input<typeof pageSectionInputSchema>;

export function parseBlock(type: string, data: unknown) {
  return blockSchema.safeParse({ type, data });
}
