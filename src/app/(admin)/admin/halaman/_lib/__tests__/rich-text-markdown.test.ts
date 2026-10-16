import { describe, expect, it } from "vitest";

import { richTextDocSchema } from "@/lib/rich-text/schema";

import {
  docToMarkdown,
  markdownToDoc,
  unsupportedNodes,
} from "../rich-text-markdown";

const SAMPLE = [
  "## Judul bagian",
  "Paragraf dengan **tebal**, *miring*, dan [tautan](/produk).",
  "- satu\n- dua",
  "1. pertama\n2. kedua",
  "> kutipan",
  "baris satu\nbaris dua",
].join("\n\n");

describe("rich text ↔ markdown bridge", () => {
  it("parses markdown into a valid Tiptap doc", () => {
    const doc = markdownToDoc(SAMPLE);
    expect(richTextDocSchema.safeParse(doc).success).toBe(true);
    expect(doc.content?.map((n) => n.type)).toEqual([
      "heading",
      "paragraph",
      "bulletList",
      "orderedList",
      "blockquote",
      "paragraph",
    ]);
    const p = doc.content![1]!;
    expect(p.content).toContainEqual({
      type: "text",
      text: "tebal",
      marks: [{ type: "bold" }],
    });
    expect(p.content).toContainEqual({
      type: "text",
      text: "tautan",
      marks: [{ type: "link", attrs: { href: "/produk" } }],
    });
    expect(doc.content![5]!.content?.map((n) => n.type)).toEqual([
      "text",
      "hardBreak",
      "text",
    ]);
  });

  it("round-trips supported content", () => {
    expect(docToMarkdown(markdownToDoc(SAMPLE))).toBe(SAMPLE);
  });

  it("serialises heading level 3 and empty docs", () => {
    expect(docToMarkdown(markdownToDoc("### Kecil"))).toBe("### Kecil");
    expect(docToMarkdown({ type: "doc", content: [] })).toBe("");
    expect(markdownToDoc("")).toEqual({ type: "doc", content: [] });
  });

  it("reports unsupported nodes and marks", () => {
    expect(unsupportedNodes(markdownToDoc(SAMPLE))).toEqual([]);
    expect(
      unsupportedNodes({
        type: "doc",
        content: [
          { type: "image", attrs: { src: "x" } },
          {
            type: "paragraph",
            content: [{ type: "text", text: "c", marks: [{ type: "code" }] }],
          },
        ],
      }).sort(),
    ).toEqual(["code", "image"]);
  });
});
