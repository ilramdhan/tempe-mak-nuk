/**
 * Order builder form schema (Zod 4, client-side). Option ids are checked against the catalog
 * and the use date against the slot engine in `refineOrder` so errors land on the right field.
 */
import { z } from "zod";

import type { AvailabilityInput } from "@/features/slots/availability";
import { isDateKey } from "@/lib/dates";

import {
  findProduct,
  shapesForProduct,
  sizesForProduct,
  type OrderCatalog,
} from "./catalog";
import { checkUseDate } from "./date-rules";

/** No minimum order (brand USP). Upper bound is an input sanity cap, not a business rule. */
export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 5000;
export const NOTE_MAX = 500;

/** Purpose choices (UI copy, docs/brand.md audiences). "Lainnya" lets the user type freely. */
export const ORDER_PURPOSES = [
  "Rumah tangga",
  "Katering",
  "Warung / resto",
  "Reseller",
  "Acara / hajatan",
  "MPASI",
  "Lainnya",
] as const;
export type OrderPurpose = (typeof ORDER_PURPOSES)[number];

const trimmed = (max: number) =>
  z.string().trim().max(max, `Maksimal ${max} karakter.`);

export const orderFormSchema = z.object({
  productId: z.string().min(1, "Pilih varian dulu, ya."),
  shapeId: z.string().min(1, "Pilih bentuk dulu, ya."),
  sizeId: z.string().min(1, "Pilih ukuran dulu, ya."),
  quantity: z
    .number({ error: "Isi jumlahnya dulu, ya." })
    .int("Jumlah harus bilangan bulat.")
    .min(QUANTITY_MIN, "Isi jumlahnya dulu, ya.")
    .max(
      QUANTITY_MAX,
      `Untuk lebih dari ${QUANTITY_MAX} pcs, chat kami langsung via WhatsApp.`,
    ),
  useDate: z.string().refine(isDateKey, "Pilih tanggal pakai dulu, ya."),
  /** One of `delivery.areas` settings (free text fallback when none configured). */
  delivery: trimmed(120),
  purpose: z.union([z.enum(ORDER_PURPOSES), z.literal("")]),
  purposeOther: trimmed(80),
  note: trimmed(NOTE_MAX),
  name: trimmed(80).min(2, "Isi nama Anda, ya."),
  area: trimmed(80).min(2, "Isi area/kota Anda, ya."),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const EMPTY_ORDER: OrderFormValues = {
  productId: "",
  shapeId: "",
  sizeId: "",
  quantity: Number.NaN,
  useDate: "",
  delivery: "",
  purpose: "",
  purposeOther: "",
  note: "",
  name: "",
  area: "",
};

export type OrderContext = {
  catalog: OrderCatalog;
  availability: AvailabilityInput;
  /** `delivery.areas` from settings; when non-empty the choice is required. */
  deliveryOptions: readonly string[];
};

type Issue = { path: (keyof OrderFormValues)[]; message: string };

/** Cross-field checks that need the catalog / slot data. Pure; also used by the schema. */
export function orderIssues(
  values: OrderFormValues,
  ctx: OrderContext,
): Issue[] {
  const issues: Issue[] = [];
  const product = findProduct(ctx.catalog, values.productId);
  if (values.productId && !product)
    issues.push({
      path: ["productId"],
      message: "Varian tidak tersedia. Pilih yang lain.",
    });
  if (product) {
    if (
      values.shapeId &&
      !shapesForProduct(ctx.catalog, product.id).some(
        (s) => s.id === values.shapeId,
      )
    )
      issues.push({
        path: ["shapeId"],
        message: "Bentuk ini tidak tersedia untuk varian tersebut.",
      });
    if (
      values.sizeId &&
      !sizesForProduct(ctx.catalog, product.id).some(
        (s) => s.id === values.sizeId,
      )
    )
      issues.push({
        path: ["sizeId"],
        message: "Ukuran ini tidak tersedia untuk varian tersebut.",
      });
  }
  if (isDateKey(values.useDate)) {
    const check = checkUseDate(values.useDate, ctx.availability);
    if (!check.ok) issues.push({ path: ["useDate"], message: check.message });
  }
  if (
    ctx.deliveryOptions.length &&
    !ctx.deliveryOptions.includes(values.delivery)
  )
    issues.push({ path: ["delivery"], message: "Pilih cara ambil/kirim, ya." });
  if (values.purpose === "Lainnya" && !values.purposeOther.trim())
    issues.push({
      path: ["purposeOther"],
      message: "Ceritakan keperluannya singkat, ya.",
    });
  return issues;
}

/** Full schema bound to the current catalog + availability (use with zodResolver). */
export function createOrderSchema(ctx: OrderContext) {
  return orderFormSchema.superRefine((values, c) => {
    for (const issue of orderIssues(values, ctx)) {
      c.addIssue({ code: "custom", path: issue.path, message: issue.message });
    }
  });
}

/** Fields validated per builder step (for "Lanjut"). */
export const ORDER_STEPS = [
  {
    id: "produk",
    title: "Produk",
    fields: ["productId", "shapeId", "sizeId", "quantity"],
  },
  { id: "tanggal", title: "Tanggal", fields: ["useDate", "delivery"] },
  {
    id: "pemesan",
    title: "Data pemesan",
    fields: ["purpose", "purposeOther", "note", "name", "area"],
  },
  { id: "ringkasan", title: "Ringkasan", fields: [] },
] as const satisfies readonly {
  id: string;
  title: string;
  fields: (keyof OrderFormValues)[];
}[];
