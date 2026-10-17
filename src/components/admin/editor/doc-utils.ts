/**
 * Pure helpers for the admin rich-text editor (no Tiptap imports → unit-testable in node).
 * The editor is limited to what `renderRichText` (src/lib/rich-text/render.tsx) renders.
 */
import { sanitizeHref, sanitizeImageSrc } from "@/lib/rich-text/render";
import type { TiptapDoc, TiptapNode } from "@/lib/rich-text/schema";

/** Node types the editor can produce (all rendered by `renderRichText`). */
export const EDITOR_NODE_TYPES = [
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "image",
] as const;

/** Mark types the editor can produce. */
export const EDITOR_MARK_TYPES = [
  "bold",
  "italic",
  "underline",
  "link",
] as const;

const NODE_LABEL: Record<string, string> = {
  codeBlock: "blok kode",
  horizontalRule: "garis pemisah",
  table: "tabel",
};

/**
 * Validate/normalise a link typed by the editor: http(s), root-relative (/…), anchors (#…),
 * query (?…). `www.example.com` gets `https://`. Returns `null` when not allowed.
 */
export function normalizeLinkHref(raw: string): string | null {
  const v = raw.trim();
  if (!v || v.length > 2000) return null;
  if (/^www\./i.test(v)) return normalizeLinkHref(`https://${v}`);
  if (/^https?:\/\//i.test(v)) {
    try {
      const url = new URL(v);
      if (!url.hostname || !url.hostname.includes(".")) return null;
    } catch {
      return null;
    }
    return sanitizeHref(v);
  }
  if (/^(\/(?!\/)|#|\?)/.test(v)) return /\s/.test(v) ? null : sanitizeHref(v);
  return null;
}

/** Image src typed by hand: http(s) or root-relative only (no data: URIs from the editor). */
export function normalizeImageSrc(raw: string): string | null {
  const v = raw.trim();
  if (!/^https?:\/\//i.test(v) && !/^\/(?!\/)/.test(v)) return null;
  return sanitizeImageSrc(v);
}

/** Node/mark types in a doc that the editor would drop (shown as a warning). */
export function unsupportedTypes(doc: TiptapDoc | null | undefined): string[] {
  const nodes = new Set<string>(EDITOR_NODE_TYPES);
  const marks = new Set<string>(EDITOR_MARK_TYPES);
  const found = new Set<string>();
  const walk = (n: TiptapNode, depth: number) => {
    if (!n || typeof n !== "object" || depth > 30) return;
    if (!nodes.has(n.type)) found.add(NODE_LABEL[n.type] ?? n.type);
    for (const m of n.marks ?? []) if (!marks.has(m.type)) found.add(m.type);
    n.content?.forEach((c) => walk(c, depth + 1));
  };
  doc?.content?.forEach((n) => walk(n, 0));
  return [...found];
}

/** True when the doc has no text and no images. */
export function isDocEmpty(doc: TiptapDoc | null | undefined): boolean {
  const walk = (n: TiptapNode, depth: number): boolean => {
    if (depth > 30) return true;
    if (n.type === "image") return false;
    if (n.type === "text" && n.text?.trim()) return false;
    return (n.content ?? []).every((c) => walk(c, depth + 1));
  };
  return (doc?.content ?? []).every((n) => walk(n, 0));
}

/**
 * Clean editor JSON for storage: drop null attrs, `null` for empty docs.
 * Keeps the shape accepted by `richTextDocSchema`.
 */
export function toStoredDoc(json: unknown): TiptapDoc | null {
  if (!json || typeof json !== "object") return null;
  const doc = json as TiptapDoc;
  if (doc.type !== "doc" || isDocEmpty(doc)) return null;
  const clean = (n: TiptapNode): TiptapNode => {
    const out: TiptapNode = { type: n.type };
    if (n.attrs) {
      const attrs = Object.fromEntries(
        Object.entries(n.attrs).filter(
          ([, v]) => v !== null && v !== undefined && v !== "",
        ),
      );
      if (Object.keys(attrs).length) out.attrs = attrs;
    }
    if (typeof n.text === "string") out.text = n.text;
    if (n.marks?.length)
      out.marks = n.marks.map((m) => {
        const attrs = m.attrs
          ? Object.fromEntries(
              Object.entries(m.attrs).filter(
                ([, v]) => v !== null && v !== undefined,
              ),
            )
          : undefined;
        return attrs && Object.keys(attrs).length
          ? { type: m.type, attrs }
          : { type: m.type };
      });
    if (n.content?.length) out.content = n.content.map(clean);
    return out;
  };
  const content = (doc.content ?? []).map(clean);
  // Drop trailing empty paragraphs (Tiptap's trailing node) so they don't count as edits.
  while (
    content.length &&
    content.at(-1)?.type === "paragraph" &&
    !content.at(-1)?.content?.length
  )
    content.pop();
  return { type: "doc", content };
}

/** Comparable string for two docs (null ≡ empty doc). */
export function docKey(doc: TiptapDoc | null | undefined): string {
  return JSON.stringify(toStoredDoc(doc) ?? null);
}
