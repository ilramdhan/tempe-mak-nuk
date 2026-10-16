/**
 * Zod building blocks shared by every feature schema (client-safe: no server imports).
 */
import { z } from "zod";

import { richTextDocSchema } from "@/lib/rich-text/schema";

export { richTextDocSchema };

export const uuidSchema = z.uuid({ error: "ID tidak valid" });

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug wajib diisi")
  .max(120, "Slug maksimal 120 karakter")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung");

/** Trimmed text; empty string → null. */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .nullish()
    .transform((v) => (v ? v : null));

export const requiredText = (max = 200, label = "Kolom ini") =>
  z.string().trim().min(1, `${label} wajib diisi`).max(max, `Maksimal ${max} karakter`);

/** Internal path ("/produk", "#faq") or absolute http(s)/mailto/tel/wa.me URL. */
export const hrefSchema = z
  .string()
  .trim()
  .min(1, "Tautan wajib diisi")
  .max(500)
  .refine(
    (v) => /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(v),
    "Tautan harus diawali /, #, https://, mailto: atau tel:",
  );

export const sortSchema = z.coerce.number().int().min(0).max(100_000).default(0);

export const seoSchema = z
  .object({
    title: z.string().trim().max(70, "Judul SEO maksimal 70 karakter").optional(),
    description: z.string().trim().max(170, "Deskripsi SEO maksimal 170 karakter").optional(),
    ogImageId: uuidSchema.nullish(),
    noindex: z.boolean().optional(),
  })
  .default({});

export const nullableIntSchema = (min = 0, max = 1_000_000_000) =>
  z.coerce.number().int().min(min).max(max).nullish().transform((v) => v ?? null);

/** Accepts Date | ISO string | null. */
export const dateTimeSchema = z.coerce.date().nullish().transform((v) => v ?? null);

export const idParamSchema = z.object({ id: uuidSchema });
export const reorderSchema = z.object({ ids: z.array(uuidSchema).min(1).max(500) });

export type IdParam = z.infer<typeof idParamSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
