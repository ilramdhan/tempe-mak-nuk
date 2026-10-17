import { describe, expect, it } from "vitest";

import { renderRichText } from "@/lib/rich-text/render";
import type { TiptapDoc } from "@/lib/rich-text/schema";
import { richTextDocSchema } from "@/lib/rich-text/schema";

import {
  docKey,
  isDocEmpty,
  normalizeImageSrc,
  normalizeLinkHref,
  toStoredDoc,
  unsupportedTypes,
} from "../doc-utils";

describe("normalizeLinkHref", () => {
  it("accepts http(s), relative, anchors", () => {
    expect(normalizeLinkHref("https://wa.me/628123")).toBe(
      "https://wa.me/628123",
    );
    expect(normalizeLinkHref(" http://example.com/a ")).toBe(
      "http://example.com/a",
    );
    expect(normalizeLinkHref("/resep/tempe-mendoan")).toBe(
      "/resep/tempe-mendoan",
    );
    expect(normalizeLinkHref("#bahan")).toBe("#bahan");
  });
  it("adds https to www.", () => {
    expect(normalizeLinkHref("www.example.com")).toBe(
      "https://www.example.com",
    );
  });
  it("rejects dangerous or ambiguous hrefs", () => {
    expect(normalizeLinkHref("javascript:alert(1)")).toBeNull();
    expect(normalizeLinkHref("java\tscript:alert(1)")).toBeNull();
    expect(normalizeLinkHref("data:text/html,x")).toBeNull();
    expect(normalizeLinkHref("//evil.com")).toBeNull();
    expect(normalizeLinkHref("mailto:a@b.c")).toBeNull();
    expect(normalizeLinkHref("produk")).toBeNull();
    expect(normalizeLinkHref("https://localhost")).toBeNull();
    expect(normalizeLinkHref("/a b")).toBeNull();
    expect(normalizeLinkHref("")).toBeNull();
  });
});

describe("normalizeImageSrc", () => {
  it("allows http(s) and root-relative only", () => {
    expect(normalizeImageSrc("https://cdn.x/a.webp")).toBe(
      "https://cdn.x/a.webp",
    );
    expect(normalizeImageSrc("/images/a.jpg")).toBe("/images/a.jpg");
    expect(normalizeImageSrc("data:image/png;base64,AAAA")).toBeNull();
    expect(normalizeImageSrc("javascript:x")).toBeNull();
    expect(normalizeImageSrc("//cdn.x/a.jpg")).toBeNull();
  });
});

const sample: TiptapDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2, textAlign: null },
      content: [{ type: "text", text: "Bahan" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Lihat " },
        {
          type: "text",
          text: "resep",
          marks: [
            {
              type: "link",
              attrs: { href: "/resep", target: null, rel: null, class: null },
            },
            { type: "bold" },
          ],
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "/a.jpg",
        alt: "Tempe",
        title: null,
        mediaId: null,
        width: null,
        height: null,
      },
    },
    { type: "paragraph" },
  ],
};

describe("toStoredDoc", () => {
  it("strips null attrs and trailing empty paragraphs", () => {
    const out = toStoredDoc(sample)!;
    expect(out.content).toHaveLength(3);
    expect(out.content![0].attrs).toEqual({ level: 2 });
    expect(out.content![1].content![1].marks).toEqual([
      { type: "link", attrs: { href: "/resep" } },
      { type: "bold" },
    ]);
    expect(out.content![2].attrs).toEqual({ src: "/a.jpg", alt: "Tempe" });
    expect(richTextDocSchema.safeParse(out).success).toBe(true);
  });
  it("returns null for empty docs", () => {
    expect(
      toStoredDoc({ type: "doc", content: [{ type: "paragraph" }] }),
    ).toBeNull();
    expect(toStoredDoc(null)).toBeNull();
    expect(toStoredDoc({ type: "nope" })).toBeNull();
  });
  it("output renders with renderRichText", () => {
    const nodes = renderRichText(toStoredDoc(sample));
    expect(Array.isArray(nodes) && nodes.filter(Boolean)).toHaveLength(3);
  });
});

describe("isDocEmpty / docKey / unsupportedTypes", () => {
  it("detects emptiness", () => {
    expect(
      isDocEmpty({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "  " }] },
        ],
      }),
    ).toBe(true);
    expect(
      isDocEmpty({
        type: "doc",
        content: [{ type: "image", attrs: { src: "/a.jpg" } }],
      }),
    ).toBe(false);
  });
  it("treats null and empty doc as equal", () => {
    expect(docKey(null)).toBe(docKey({ type: "doc", content: [] }));
    expect(docKey(sample)).toBe(docKey(toStoredDoc(sample)));
  });
  it("lists nodes/marks the editor drops", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        { type: "codeBlock", content: [{ type: "text", text: "x" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "a", marks: [{ type: "strike" }] }],
        },
      ],
    };
    expect(unsupportedTypes(doc)).toEqual(["blok kode", "strike"]);
    expect(unsupportedTypes(sample)).toEqual([]);
  });
});
