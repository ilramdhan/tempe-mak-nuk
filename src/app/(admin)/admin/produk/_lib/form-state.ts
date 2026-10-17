import {
  productInputSchema,
  type ProductInput,
} from "@/features/products/schema";
import type { TiptapDoc } from "@/lib/rich-text/schema";

export type ProductDraft = {
  slug: string;
  name: string;
  short: string;
  description: TiptapDoc | null;
  variant: "classic" | "skinless";
  priceFrom: string;
  isActive: boolean;
  sort: string;
  seoTitle: string;
  seoDescription: string;
  seoOgImageId: string | null;
  noindex: boolean;
  shapeIds: string[];
  sizes: { sizeId: string; price: string }[];
  mediaIds: string[];
};

export type FieldErrors = Record<string, string>;

export const emptyDraft = (): ProductDraft => ({
  slug: "",
  name: "",
  short: "",
  description: null,
  variant: "classic",
  priceFrom: "",
  isActive: true,
  sort: "0",
  seoTitle: "",
  seoDescription: "",
  seoOgImageId: null,
  noindex: false,
  shapeIds: [],
  sizes: [],
  mediaIds: [],
});

const numOrNull = (s: string): number | null => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t.replace(/[.\s]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
};

export function autoSlug(t: string): string {
  return t
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function toProductInput(d: ProductDraft): ProductInput {
  return {
    slug: d.slug,
    name: d.name,
    short: d.short,
    description: d.description,
    variant: d.variant,
    priceFrom: numOrNull(d.priceFrom),
    isActive: d.isActive,
    sort: numOrNull(d.sort) ?? 0,
    seo: {
      title: d.seoTitle,
      description: d.seoDescription,
      ogImageId: d.seoOgImageId,
      noindex: d.noindex,
    },
    shapeIds: d.shapeIds,
    sizes: d.sizes.map((s) => ({
      sizeId: s.sizeId,
      price: numOrNull(s.price),
    })),
    mediaIds: d.mediaIds,
  };
}

/** Client-side validation with the same Zod schema the server uses. */
export function validateDraft(d: ProductDraft): FieldErrors {
  const res = productInputSchema.safeParse(toProductInput(d));
  if (res.success) return {};
  const out: FieldErrors = {};
  for (const i of res.error.issues) {
    const key = i.path.length ? i.path.join(".") : "_form";
    out[key] ??= i.message;
  }
  return out;
}

export function mapServerErrors(
  fieldErrors: Record<string, string[]> | undefined,
): FieldErrors {
  return Object.fromEntries(
    Object.entries(fieldErrors ?? {}).map(([k, v]) => [k, v[0] ?? ""]),
  );
}

export function isDirty(a: ProductDraft, b: ProductDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function move<T>(list: readonly T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  )
    return list as T[];
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

/** Gizi number field: "" -> null. */
export function parseNutrient(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
}
