/** Shared form helpers for the Jurnal & Resep editors (client-safe, pure). */
import type { z } from "zod";

import { idErrorMap } from "../../../halaman/_lib/zod-id";

/** "field.path" → first message. `_form` = not tied to a field. */
export type FieldErrors = Record<string, string>;

export function collectIssues(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}

/** Validate with Indonesian messages; `{}` when valid. */
export function validateWith(schema: z.ZodType, input: unknown): FieldErrors {
  const res = schema.safeParse(input, { error: idErrorMap });
  return res.success ? {} : collectIssues(res.error.issues);
}

/** Server `fieldErrors` (string[] per key) → first message per key. */
export function fromServerErrors(
  fieldErrors: Record<string, string[]> | undefined,
): FieldErrors {
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(fieldErrors ?? {}))
    out[k] = v[0] ?? "Tidak valid";
  return out;
}

/** Errors whose key is `prefix` or below it (e.g. "ingredients.2"). */
export function errorsUnder(errors: FieldErrors, prefix: string): string[] {
  return Object.entries(errors)
    .filter(([k]) => k === prefix || k.startsWith(`${prefix}.`))
    .map(([, v]) => v);
}

export type SeoDraft = {
  title: string;
  description: string;
  ogImageId: string | null;
  noindex: boolean;
};

export const emptySeo = (): SeoDraft => ({
  title: "",
  description: "",
  ogImageId: null,
  noindex: false,
});

export function seoFromDb(
  seo:
    | {
        title?: string;
        description?: string;
        ogImageId?: string | null;
        noindex?: boolean;
      }
    | null
    | undefined,
): SeoDraft {
  return {
    title: seo?.title ?? "",
    description: seo?.description ?? "",
    ogImageId: seo?.ogImageId ?? null,
    noindex: seo?.noindex ?? false,
  };
}

const emptyToUndefined = (v: string) => (v.trim() === "" ? undefined : v);

export function seoToInput(seo: SeoDraft) {
  return {
    title: emptyToUndefined(seo.title),
    description: emptyToUndefined(seo.description),
    ogImageId: seo.ogImageId || null,
    noindex: seo.noindex || undefined,
  };
}

/** "12" → 12, "" → null (schema coerces & range-checks). */
export function numberOrNull(v: string): number | string | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : t;
}

export const numberToInput = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n);

/** Stable JSON for dirty checks (object key order independent). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        )
      : v,
  );
}
