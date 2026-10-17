/** Pure helpers for the Legal & Privasi admin (client-safe). */
import type { z } from "zod";

import type { ConsentConfig } from "@/features/settings/schema";
import { consentConfigSchema } from "@/features/settings/schema";

import { fromWibInput, toWibInput } from "../../jurnal/_shared/lib/publish";
import { idErrorMap } from "../../halaman/_lib/zod-id";

export type LegalSlugKey = "privacy" | "terms" | "cookies" | "ordering";
export type LegalStatus = "draft" | "published";

export const LEGAL_SLUG_LABEL: Record<LegalSlugKey, string> = {
  privacy: "Kebijakan Privasi",
  terms: "Syarat & Ketentuan",
  cookies: "Kebijakan Cookie",
  ordering: "Kebijakan Pemesanan",
};
export const LEGAL_SLUG_ORDER: LegalSlugKey[] = ["privacy", "terms", "cookies", "ordering"];
export const STATUS_LABEL: Record<LegalStatus, string> = { draft: "Draf", published: "Terbit" };

export type FieldErrors = Record<string, string>;

export type LegalRow = {
  id: string;
  slug: LegalSlugKey;
  title: string;
  version: number;
  status: LegalStatus;
  effectiveAt: string | null;
  updatedAt: string;
  sample: boolean;
};

/** The seed marks placeholder texts with this phrase; the notice stays until the owner removes it. */
export const SAMPLE_MARKER = "Dokumen contoh";

export function isSampleContent(content: unknown): boolean {
  if (!content) return false;
  try {
    return JSON.stringify(content).includes(SAMPLE_MARKER);
  } catch {
    return false;
  }
}

/** Next free version number for a slug (max + 1, starting at 1). */
export function nextVersion(versions: readonly number[]): number {
  return versions.reduce((max, v) => (v > max ? v : max), 0) + 1;
}

export function groupBySlug(rows: readonly LegalRow[]): { slug: LegalSlugKey; rows: LegalRow[] }[] {
  return LEGAL_SLUG_ORDER.map((slug) => ({
    slug,
    rows: rows.filter((r) => r.slug === slug).sort((a, b) => b.version - a.version),
  })).filter((g) => g.rows.length > 0);
}

export type DocContent = { type: "doc"; content?: unknown[] } | null;

export type DocDraft = {
  title: string;
  content: DocContent;
  /** "YYYY-MM-DDTHH:mm" WIB */
  effectiveAt: string;
  status: LegalStatus;
};

export const docDraftFrom = (d: { title: string; content: unknown; effectiveAt: Date | string | null; status: LegalStatus }): DocDraft => ({
  title: d.title,
  content: (d.content ?? null) as DocContent,
  effectiveAt: toWibInput(d.effectiveAt),
  status: d.status,
});

export const isDocDirty = (a: DocDraft, b: DocDraft) =>
  a.title !== b.title || a.effectiveAt !== b.effectiveAt || a.status !== b.status || JSON.stringify(a.content ?? null) !== JSON.stringify(b.content ?? null);

export function docToInput(slug: LegalSlugKey, version: number, d: DocDraft) {
  return { slug, version, title: d.title, content: d.content ?? null, status: d.status, effectiveAt: fromWibInput(d.effectiveAt) };
}

export function validateWith(schema: z.ZodType, input: unknown): FieldErrors {
  const res = schema.safeParse(input, { error: idErrorMap });
  if (res.success) return {};
  const out: FieldErrors = {};
  for (const i of res.error.issues) out[i.path.map(String).join(".") || "_form"] ??= i.message;
  return out;
}

export function fromServerErrors(fe: Record<string, string[]> | undefined): FieldErrors {
  return Object.fromEntries(Object.entries(fe ?? {}).map(([k, v]) => [k, v[0] ?? "Tidak valid"]));
}

export function validateDoc(draft: DocDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.title.trim()) errors.title = "Judul wajib diisi";
  else if (draft.title.length > 160) errors.title = "Maksimal 160 karakter";
  if (draft.effectiveAt.trim() && !fromWibInput(draft.effectiveAt)) errors.effectiveAt = "Format tanggal/jam tidak valid";
  return errors;
}

// ---- consent ----

/** Config to save. `reask` raises the version so visitors are asked again. */
export function buildConsentConfig(base: ConsentConfig, draft: ConsentConfig, reask: boolean): ConsentConfig {
  return { ...draft, version: reask ? base.version + 1 : base.version };
}

export const isConsentDirty = (a: ConsentConfig, b: ConsentConfig) => JSON.stringify(a) !== JSON.stringify(b);

export function validateConsent(config: ConsentConfig): FieldErrors {
  const errors = validateWith(consentConfigSchema, config);
  for (const [i, c] of config.categories.entries()) {
    if (c.required && !c.label.trim()) errors[`categories.${i}.label`] ??= "Wajib diisi";
  }
  return errors;
}
