import { z } from "zod";

import {
  optionalText,
  requiredText,
  sortSchema,
  uuidSchema,
} from "@/features/_shared/schema";

export const testimonialInputSchema = z.object({
  name: requiredText(80, "Nama"),
  role: optionalText(80),
  city: optionalText(80),
  quote: requiredText(1000, "Testimoni"),
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .nullish()
    .transform((v) => v ?? null),
  mediaId: uuidSchema.nullish().transform((v) => v ?? null),
  verified: z.boolean().default(false),
  visible: z.boolean().default(true),
  sort: sortSchema,
  isPlaceholder: z.boolean().default(true),
});
export type TestimonialInput = z.input<typeof testimonialInputSchema>;
export type TestimonialData = z.output<typeof testimonialInputSchema>;
