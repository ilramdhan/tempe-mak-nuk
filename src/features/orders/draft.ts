/**
 * Order draft persistence (localStorage, best-effort). Parsing is pure/testable; storage access
 * is wrapped in try/catch (private mode, blocked storage, SSR).
 */
import { z } from "zod";

import { EMPTY_ORDER, ORDER_PURPOSES, type OrderFormValues } from "./schema";

export const DRAFT_KEY = "tmn:order-draft:v1";
/** Drafts older than this are discarded (use dates will have passed anyway). */
export const DRAFT_MAX_AGE_MS = 14 * 86_400_000;

const draftSchema = z.object({
  savedAt: z.number(),
  values: z
    .object({
      productId: z.string(),
      shapeId: z.string(),
      sizeId: z.string(),
      quantity: z.number().nullable(),
      useDate: z.string(),
      delivery: z.string(),
      purpose: z.string(),
      purposeOther: z.string(),
      note: z.string(),
      name: z.string(),
      area: z.string(),
    })
    .partial(),
});

type StoredDraft = z.infer<typeof draftSchema>;

/** Serialize (NaN quantity → null so JSON keeps it). */
export function serializeDraft(
  values: OrderFormValues,
  now = Date.now(),
): string {
  const draft: StoredDraft = {
    savedAt: now,
    values: {
      ...values,
      quantity: Number.isFinite(values.quantity) ? values.quantity : null,
    },
  };
  return JSON.stringify(draft);
}

/** Parse a stored draft; returns null for missing/corrupt/expired data. */
export function parseDraft(
  raw: string | null,
  now = Date.now(),
): Partial<OrderFormValues> | null {
  if (!raw) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const res = draftSchema.safeParse(json);
  if (!res.success || now - res.data.savedAt > DRAFT_MAX_AGE_MS) return null;
  const { quantity, purpose, ...rest } = res.data.values;
  const out: Partial<OrderFormValues> = { ...rest };
  if (typeof quantity === "number") out.quantity = quantity;
  if (
    purpose !== undefined &&
    (ORDER_PURPOSES as readonly string[]).includes(purpose)
  )
    out.purpose = purpose as OrderFormValues["purpose"];
  return out;
}

export function loadDraft(): Partial<OrderFormValues> | null {
  try {
    return parseDraft(window.localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
}

export function saveDraft(values: OrderFormValues): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, serializeDraft(values));
  } catch {
    /* storage unavailable — draft is optional */
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export { EMPTY_ORDER };
