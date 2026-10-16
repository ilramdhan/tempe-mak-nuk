import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "../schema";
import type { RichTextDoc } from "../schema/seo";

export type SeedDb = PostgresJsDatabase<typeof schema>;
/** Transaction handle passed to every seed step. */
export type Tx = Parameters<Parameters<SeedDb["transaction"]>[0]>[0];

type Node = Record<string, unknown>;

/** Inline markup: **bold**, [text](href). */
function inline(src: string): Node[] {
  const out: Node[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ type: "text", text: src.slice(last, m.index) });
    if (m[1] !== undefined) {
      out.push({ type: "text", text: m[1], marks: [{ type: "bold" }] });
    } else {
      out.push({
        type: "text",
        text: m[2],
        marks: [{ type: "link", attrs: { href: m[3] } }],
      });
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ type: "text", text: src.slice(last) });
  return out;
}

const para = (t: string): Node => ({ type: "paragraph", content: inline(t) });

/**
 * Tiny markdown-ish DSL -> Tiptap JSON. One entry per block:
 * "## H2", "### H3", "- bullet" (consecutive = one list), "1. step" (consecutive = ordered list),
 * "> quote", anything else = paragraph.
 */
export function doc(blocks: string[]): RichTextDoc {
  const content: Node[] = [];
  let list: { kind: "bulletList" | "orderedList"; items: Node[] } | null = null;
  const flush = () => {
    if (list) content.push({ type: list.kind, content: list.items });
    list = null;
  };
  for (const b of blocks) {
    const li = (txt: string, kind: "bulletList" | "orderedList") => {
      if (!list || list.kind !== kind) {
        flush();
        list = { kind, items: [] };
      }
      list.items.push({ type: "listItem", content: [para(txt)] });
    };
    if (b.startsWith("### ")) {
      flush();
      content.push({ type: "heading", attrs: { level: 3 }, content: inline(b.slice(4)) });
    } else if (b.startsWith("## ")) {
      flush();
      content.push({ type: "heading", attrs: { level: 2 }, content: inline(b.slice(3)) });
    } else if (b.startsWith("- ")) li(b.slice(2), "bulletList");
    else if (/^\d+\. /.test(b)) li(b.replace(/^\d+\. /, ""), "orderedList");
    else if (b.startsWith("> ")) {
      flush();
      content.push({ type: "blockquote", content: [para(b.slice(2))] });
    } else {
      flush();
      content.push(para(b));
    }
  }
  flush();
  return { type: "doc", content };
}

export function wordCount(blocks: string[]): number {
  return blocks
    .join(" ")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .split(/\s+/)
    .filter(Boolean).length;
}

export const readingMinutes = (blocks: string[]) =>
  Math.max(1, Math.round(wordCount(blocks) / 200));

/** Jakarta-local today (YYYY-MM-DD) shifted by n days. */
export function jakartaDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 7 * 3600_000);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().slice(0, 10);
}

import { createHash } from "node:crypto";

/** Deterministic UUID from a natural key, so tables without a unique natural key can upsert on id. */
export function stableId(key: string): string {
  const h = createHash("sha1").update(`tempe-mak-nuk:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
