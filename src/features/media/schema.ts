import { z } from "zod";

import { optionalText, requiredText } from "@/features/_shared/schema";

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** Metadata row for a file already uploaded to Supabase Storage (upload route = P5.x). */
export const mediaInputSchema = z.object({
  storagePath: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .regex(/^[a-zA-Z0-9/_.-]+$/, "Path tidak valid")
    .refine((p) => !p.includes(".."), "Path tidak valid"),
  url: z.url({ protocol: /^https?$/ }),
  alt: requiredText(300, "Teks alt"),
  width: z.coerce.number().int().min(1).max(20_000).nullish().transform((v) => v ?? null),
  height: z.coerce.number().int().min(1).max(20_000).nullish().transform((v) => v ?? null),
  mime: z.enum(MEDIA_MIME_TYPES).nullish().transform((v) => v ?? null),
  sizeBytes: z.coerce.number().int().min(0).max(MEDIA_MAX_BYTES).nullish().transform((v) => v ?? null),
  blurDataUrl: optionalText(4000).refine(
    (v) => v === null || v.startsWith("data:image/"),
    "Blur placeholder harus data:image/…",
  ),
});
export type MediaInput = z.input<typeof mediaInputSchema>;

export const mediaUpdateSchema = z.object({ alt: requiredText(300, "Teks alt") });
