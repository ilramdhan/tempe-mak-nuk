import { z } from "zod";

import { waClickKind } from "@/db/schema/enums";

/** Public, anonymous click event. Strings are short identifiers — never free text / PII. */
const ident = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(/^[a-zA-Z0-9/_:.-]+$/, "Hanya huruf, angka, / _ : . -");

export const waClickInputSchema = z.object({
  /** Where the click happened, e.g. "header", "home:hero", "/produk/tempe-klasik". */
  source: ident(200),
  kind: z.enum(waClickKind.enumValues).default("general"),
  /** Product variant slug or CTA variant id. */
  variant: ident(100)
    .nullish()
    .transform((v) => v ?? null),
});
export type WaClickInput = z.input<typeof waClickInputSchema>;
