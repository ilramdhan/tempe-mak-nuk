import { z } from "zod";

import { pageStatus } from "@/db/schema/enums";
import {
  hrefSchema,
  requiredText,
  seoSchema,
  uuidSchema,
} from "@/features/_shared/schema";

import { isReservedPageSlug, PAGE_SLUG_RE } from "./slugs";

export {
  blockSchema,
  pageSectionSchema,
  pageSectionInputSchema,
  BLOCK_SCHEMAS,
  BLOCK_TYPES,
  parseBlock,
  type Block,
  type BlockInput,
  type BlockType,
  type BlockData,
  type BlockDataMap,
  type RenderableBlock,
  type PageSectionInput,
} from "./blocks/schema";

/**
 * Page slugs: one kebab-case segment ("home" = beranda). Slugs of code-owned routes
 * (jurnal, resep, admin, api, legal, …) are rejected — such a page could never be reached.
 */
export const pageSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(PAGE_SLUG_RE, "Slug hanya huruf kecil, angka, dan tanda hubung")
  .refine(
    (v) => !isReservedPageSlug(v),
    "Slug ini dipakai rute bawaan situs. Pilih slug lain.",
  );

export const pageInputSchema = z.object({
  slug: pageSlugSchema,
  title: requiredText(160, "Judul"),
  seo: seoSchema,
  status: z.enum(pageStatus.enumValues).default("draft"),
});
export type PageInput = z.input<typeof pageInputSchema>;

export const sectionReorderSchema = z.object({
  pageId: uuidSchema,
  ids: z.array(uuidSchema).min(1).max(200),
});

export const sectionVisibilitySchema = z.object({
  id: uuidSchema,
  visible: z.boolean(),
});

export const redirectInputSchema = z
  .object({
    from: z
      .string()
      .trim()
      .min(2)
      .max(300)
      .regex(
        /^\/(?!\/)[^\s?#]*$/,
        "Harus path internal diawali / (tanpa query)",
      ),
    to: hrefSchema,
    permanent: z.boolean().default(true),
  })
  .refine((v) => v.from !== v.to, {
    path: ["to"],
    message: "Tujuan tidak boleh sama",
  });
export type RedirectInput = z.input<typeof redirectInputSchema>;
