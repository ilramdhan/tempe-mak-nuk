import { z } from "zod";

import { contentStatus } from "@/db/schema/enums";
import {
  dateTimeSchema,
  optionalText,
  requiredText,
  richTextDocSchema,
  seoSchema,
  slugSchema,
  uuidSchema,
} from "@/features/_shared/schema";

export const contentStatusSchema = z.enum(contentStatus.enumValues);

const withPublishRule = <
  T extends { status: string; publishedAt: Date | null },
>(
  v: T,
  ctx: z.RefinementCtx,
) => {
  if (v.status === "scheduled" && !v.publishedAt) {
    ctx.addIssue({
      code: "custom",
      path: ["publishedAt"],
      message: "Tanggal terbit wajib diisi untuk jadwal",
    });
  }
};

export const postInputSchema = z
  .object({
    slug: slugSchema,
    title: requiredText(160, "Judul"),
    excerpt: optionalText(400),
    content: richTextDocSchema.nullish().transform((v) => v ?? null),
    coverMediaId: uuidSchema.nullish().transform((v) => v ?? null),
    categoryId: uuidSchema.nullish().transform((v) => v ?? null),
    authorId: uuidSchema.nullish().transform((v) => v ?? null),
    status: contentStatusSchema.default("draft"),
    publishedAt: dateTimeSchema,
    readingMinutes: z.coerce
      .number()
      .int()
      .min(1)
      .max(600)
      .nullish()
      .transform((v) => v ?? null),
    seo: seoSchema,
    tagIds: z.array(uuidSchema).max(30).optional(),
  })
  .superRefine(withPublishRule);
export type PostInput = z.input<typeof postInputSchema>;
export type PostData = z.output<typeof postInputSchema>;

export { withPublishRule };
