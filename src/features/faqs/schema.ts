import { z } from "zod";

import {
  requiredText,
  sortSchema,
  uuidSchema,
} from "@/features/_shared/schema";

export const faqInputSchema = z.object({
  question: requiredText(300, "Pertanyaan"),
  /** Plain text / light markdown (**bold**, [link](/x), line breaks). */
  answer: requiredText(4000, "Jawaban"),
  categoryId: uuidSchema.nullish().transform((v) => v ?? null),
  sort: sortSchema,
  visible: z.boolean().default(true),
  showOnHome: z.boolean().default(false),
});
export type FaqInput = z.input<typeof faqInputSchema>;
export type FaqData = z.output<typeof faqInputSchema>;
