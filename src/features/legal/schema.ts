import { z } from "zod";

import { legalSlug, pageStatus } from "@/db/schema/enums";
import { dateTimeSchema, requiredText, richTextDocSchema } from "@/features/_shared/schema";

export const legalSlugSchema = z.enum(legalSlug.enumValues);

export const legalDocumentInputSchema = z.object({
  slug: legalSlugSchema,
  title: requiredText(160, "Judul"),
  content: richTextDocSchema.nullish().transform((v) => v ?? null),
  version: z.coerce.number().int().min(1).max(10_000).default(1),
  effectiveAt: dateTimeSchema,
  status: z.enum(pageStatus.enumValues).default("draft"),
});
export type LegalDocumentInput = z.input<typeof legalDocumentInputSchema>;
export type LegalDocumentData = z.output<typeof legalDocumentInputSchema>;

/** Public route segment ↔ legal slug. */
export const LEGAL_ROUTES = {
  privacy: "/kebijakan-privasi",
  terms: "/syarat-ketentuan",
  cookies: "/kebijakan-cookie",
  ordering: "/kebijakan-pemesanan",
} as const satisfies Record<z.infer<typeof legalSlugSchema>, string>;
