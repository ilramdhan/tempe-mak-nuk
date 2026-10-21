import { z } from "zod";

import { categoryKind } from "@/db/schema/enums";
import {
  optionalText,
  requiredText,
  slugSchema,
  sortSchema,
} from "@/features/_shared/schema";

export const categoryKindSchema = z.enum(categoryKind.enumValues);

export const categoryInputSchema = z.object({
  kind: categoryKindSchema,
  slug: slugSchema,
  name: requiredText(80, "Nama kategori"),
  description: optionalText(500),
  sort: sortSchema,
});
export type CategoryInput = z.input<typeof categoryInputSchema>;

export const tagInputSchema = z.object({
  slug: slugSchema,
  name: requiredText(60, "Nama tag"),
});
export type TagInput = z.input<typeof tagInputSchema>;
