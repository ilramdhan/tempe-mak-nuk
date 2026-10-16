import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  collectMediaIds,
  extractHeadings,
  renderRichText,
  richTextToPlainText,
  sanitizeHref,
} from "@/lib/rich-text/render";
import { richTextDocSchema, type TiptapDoc } from "@/lib/rich-text/schema";

const html = (doc: unknown, opts?: Parameters<typeof renderRichText>[1]) =>
  renderToStaticMarkup(<>{renderRichText(doc as TiptapDoc, opts)}</>);

const t = (text: string, marks?: { type: string; attrs?: Record<string, unknown> }[]) => ({
  type: "text",
  text,
  marks,
});

describe("renderRichText", () => {
  it("renders paragraphs, headings (clamped 2–4, with ids), lists, quote, hr, br", () => {
    const out = html({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [t("Judul Utama")] },
        { type: "heading", attrs: { level: 3 }, content: [t("Sub")] },
        { type: "heading", attrs: { level: 6 }, content: [t("Sub")] },
        { type: "paragraph", content: [t("a"), { type: "hardBreak" }, t("b")] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [t("x")] }] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [t("y")] }] }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [t("q")] }] },
        { type: "horizontalRule" },
        { type: "paragraph" },
      ],
    });
    expect(out).toBe(
      '<h2 id="judul-utama">Judul Utama</h2><h3 id="sub">Sub</h3><h4 id="sub-2">Sub</h4>' +
        "<p>a<br/>b</p><ul><li><p>x</p></li></ul><ol start=\"3\"><li><p>y</p></li></ol>" +
        "<blockquote><p>q</p></blockquote><hr/>",
    );
  });

  it("applies marks with link outermost; external links get noopener", () => {
    const out = html(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              t("ext", [{ type: "link", attrs: { href: "https://bpjph.halal.go.id" } }, { type: "bold" }]),
              t(" "),
              t("int", [{ type: "link", attrs: { href: "/cara-pesan" } }, { type: "italic" }]),
              t(" "),
              t("own", [{ type: "link", attrs: { href: "https://www.tempemaknuk.com/x" } }]),
              t("c", [{ type: "code" }]),
            ],
          },
        ],
      },
      { internalHosts: ["tempemaknuk.com"] },
    );
    expect(out).toContain('<a href="https://bpjph.halal.go.id" target="_blank" rel="noopener noreferrer"><strong>ext</strong></a>');
    expect(out).toContain('<a href="/cara-pesan"><em>int</em></a>');
    expect(out).toContain('<a href="https://www.tempemaknuk.com/x">own</a>');
    expect(out).toContain("<code>c</code>");
  });

  it("drops dangerous links but keeps text", () => {
    const out = html({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            t("a", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]),
            t("b", [{ type: "link", attrs: { href: " JaVa\tScRiPt:alert(1)" } }]),
            t("c", [{ type: "link", attrs: { href: "data:text/html,<x>" } }]),
            t("d", [{ type: "link", attrs: { href: "//evil.com" } }]),
          ],
        },
      ],
    });
    expect(out).toBe("<p>abcd</p>");
  });

  it("escapes text (no HTML injection) and ignores unknown nodes/marks", () => {
    const out = html({
      type: "doc",
      content: [
        { type: "paragraph", content: [t("<script>alert(1)</script>", [{ type: "evil" }])] },
        { type: "iframe", attrs: { src: "https://x" } },
        { type: "rawHtml", text: "<b>x</b>" },
      ],
    });
    expect(out).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });

  it("renders images from media lookup or src, rejects unsafe src", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const out = html(
      {
        type: "doc",
        content: [
          { type: "image", attrs: { mediaId: id } },
          { type: "image", attrs: { src: "https://cdn.example.com/a.webp", alt: "Tempe", title: "Keterangan" } },
          { type: "image", attrs: { src: "javascript:alert(1)" } },
          { type: "image", attrs: { mediaId: "missing" } },
        ],
      },
      { media: { [id]: { url: "https://s.supabase.co/storage/v1/x.webp", alt: "Alt media", width: 800, height: 600 } } },
    );
    expect(out).toContain('src="https://s.supabase.co/storage/v1/x.webp" alt="Alt media" width="800" height="600"');
    expect(out).toContain('<figcaption>Keterangan</figcaption>');
    expect(out.match(/<img/g)).toHaveLength(2);
  });

  it("never throws on malformed input", () => {
    expect(html(null)).toBe("");
    expect(html({ type: "doc" })).toBe("");
    expect(html({ type: "doc", content: [null, 1, "x", { type: "paragraph", content: "nope" }] })).toBe("");
    // deep nesting is cut off
    let deep: Record<string, unknown> = t("deep");
    for (let i = 0; i < 100; i++) deep = { type: "blockquote", content: [deep] };
    expect(() => html({ type: "doc", content: [deep] })).not.toThrow();
  });
});

describe("helpers", () => {
  const doc: TiptapDoc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Kenapa PO?" }] },
      { type: "paragraph", content: [{ type: "text", text: "Karena " }, { type: "text", text: "fermentasi", marks: [{ type: "bold" }] }] },
      { type: "image", attrs: { mediaId: "m1" } },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Kenapa PO?" }] },
    ],
  };

  it("extractHeadings mirrors renderer ids", () => {
    expect(extractHeadings(doc)).toEqual([
      { id: "kenapa-po", text: "Kenapa PO?", level: 2 },
      { id: "kenapa-po-2", text: "Kenapa PO?", level: 2 },
    ]);
  });

  it("plain text + media ids", () => {
    expect(richTextToPlainText(doc)).toBe("Kenapa PO?\nKarena fermentasi\nKenapa PO?");
    expect(collectMediaIds(doc)).toEqual(["m1"]);
  });

  it("sanitizeHref", () => {
    expect(sanitizeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
    expect(sanitizeHref("#faq")).toBe("#faq");
    expect(sanitizeHref("vbscript:x")).toBeNull();
    expect(sanitizeHref(42)).toBeNull();
  });

  it("schema validates docs", () => {
    expect(richTextDocSchema.safeParse(doc).success).toBe(true);
    expect(richTextDocSchema.safeParse({ type: "paragraph" }).success).toBe(false);
  });
});

import { renderLightMarkdown } from "@/lib/rich-text/inline";

describe("renderLightMarkdown", () => {
  it("renders bold/italic/links/paragraphs/br and escapes html", () => {
    const out = renderToStaticMarkup(
      <>{renderLightMarkdown("Halo **Mak** *Nuk* <b>x</b>\nbaris [cara](/cara-pesan)\n\n[ext](https://x.com) [bad](javascript:void0)")}</>,
    );
    expect(out).toBe(
      '<p>Halo <strong>Mak</strong> <em>Nuk</em> &lt;b&gt;x&lt;/b&gt;<br/>baris <a href="/cara-pesan">cara</a></p>' +
        '<p><a href="https://x.com" target="_blank" rel="noopener noreferrer">ext</a> bad</p>',
    );
  });
});
