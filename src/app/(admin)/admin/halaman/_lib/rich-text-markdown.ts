/**
 * Temporary bridge until Tiptap lands (P5.6): edit a Tiptap/ProseMirror doc as light markdown
 * in a <Textarea>. Supported: "## " / "### " headings, "- " bullets, "1. " ordered items,
 * "> " quotes, paragraphs (blank line), single newline = hard break, **bold**, *italic*,
 * [label](href). Anything else (images, code, other marks) is reported by `unsupportedNodes`
 * so the UI can warn before the doc is simplified.
 */
import type { TiptapDoc, TiptapMark, TiptapNode } from "@/lib/rich-text/schema";

const SUPPORTED_NODES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "text",
]);
const SUPPORTED_MARKS = new Set(["bold", "italic", "link"]);

// ── doc → markdown ───────────────────────────────────────────────────────
function inlineToMd(nodes: TiptapNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type === "hardBreak") return "\n";
      if (n.type !== "text" || typeof n.text !== "string")
        return inlineToMd(n.content);
      let t = n.text;
      const marks = n.marks ?? [];
      if (marks.some((m) => m.type === "italic")) t = `*${t}*`;
      if (marks.some((m) => m.type === "bold")) t = `**${t}**`;
      const link = marks.find((m) => m.type === "link");
      const href =
        typeof link?.attrs?.href === "string" ? link.attrs.href : null;
      if (href) t = `[${t}](${href})`;
      return t;
    })
    .join("");
}

function blockToMd(node: TiptapNode): string[] {
  switch (node.type) {
    case "heading": {
      const level =
        node.attrs?.level === 3 || node.attrs?.level === 4 ? "###" : "##";
      return [`${level} ${inlineToMd(node.content)}`];
    }
    case "bulletList":
    case "orderedList":
      return [
        (node.content ?? [])
          .map((li, i) => {
            const text = (li.content ?? [])
              .map((c) => inlineToMd(c.content))
              .join(" ");
            return `${node.type === "orderedList" ? `${i + 1}.` : "-"} ${text}`;
          })
          .join("\n"),
      ];
    case "blockquote":
      return [
        (node.content ?? [])
          .map((c) => `> ${inlineToMd(c.content)}`)
          .join("\n"),
      ];
    case "paragraph":
      return [inlineToMd(node.content)];
    default:
      return node.content ? node.content.flatMap(blockToMd) : [];
  }
}

export function docToMarkdown(doc: TiptapDoc | null | undefined): string {
  return (doc?.content ?? [])
    .flatMap(blockToMd)
    .filter((b) => b.trim() !== "")
    .join("\n\n");
}

// ── markdown → doc ───────────────────────────────────────────────────────
const INLINE_RE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+?)\]\(([^)\s]+?)\)/g;

function parseInline(src: string): TiptapNode[] {
  const out: TiptapNode[] = [];
  const lines = src.split("\n");
  lines.forEach((line, li) => {
    if (li > 0) out.push({ type: "hardBreak" });
    let last = 0;
    for (const m of line.matchAll(INLINE_RE)) {
      const idx = m.index ?? 0;
      if (idx > last) out.push({ type: "text", text: line.slice(last, idx) });
      let text: string;
      let marks: TiptapMark[];
      if (m[1] !== undefined) {
        // bold, possibly wrapping italic: ***x*** → **(*x*)**
        const inner = /^\*(.+)\*$/.exec(m[1]);
        text = inner ? inner[1]! : m[1];
        marks = inner
          ? [{ type: "bold" }, { type: "italic" }]
          : [{ type: "bold" }];
      } else if (m[2] !== undefined) {
        text = m[2];
        marks = [{ type: "italic" }];
      } else {
        const inner = parseInline(m[3]!);
        const href = m[4]!;
        for (const n of inner)
          if (n.type === "text")
            out.push({
              ...n,
              marks: [...(n.marks ?? []), { type: "link", attrs: { href } }],
            });
        last = idx + m[0].length;
        continue;
      }
      out.push({ type: "text", text, marks });
      last = idx + m[0].length;
    }
    if (last < line.length) out.push({ type: "text", text: line.slice(last) });
  });
  return out.filter((n) => n.type !== "text" || (n.text ?? "") !== "");
}

const para = (text: string): TiptapNode => {
  const content = parseInline(text);
  return content.length
    ? { type: "paragraph", content }
    : { type: "paragraph" };
};

export function markdownToDoc(src: string): TiptapDoc {
  const content: TiptapNode[] = [];
  const chunks = src
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((c) => c.replace(/^\n+|\s+$/g, ""))
    .filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const h = /^(#{2,4})\s+(.*)$/.exec(chunk);
    if (h && lines.length === 1) {
      content.push({
        type: "heading",
        attrs: { level: h[1]!.length === 2 ? 2 : 3 },
        content: parseInline(h[2]!),
      });
    } else if (lines.every((l) => /^[-*]\s+/.test(l))) {
      content.push({
        type: "bulletList",
        content: lines.map((l) => ({
          type: "listItem",
          content: [para(l.replace(/^[-*]\s+/, ""))],
        })),
      });
    } else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      content.push({
        type: "orderedList",
        content: lines.map((l) => ({
          type: "listItem",
          content: [para(l.replace(/^\d+[.)]\s+/, ""))],
        })),
      });
    } else if (lines.every((l) => /^>\s?/.test(l))) {
      content.push({
        type: "blockquote",
        content: lines.map((l) => para(l.replace(/^>\s?/, ""))),
      });
    } else {
      content.push(para(chunk));
    }
  }
  return { type: "doc", content };
}

/** Node/mark types in `doc` that the textarea bridge would drop (for a warning). */
export function unsupportedNodes(doc: TiptapDoc | null | undefined): string[] {
  const found = new Set<string>();
  const walk = (n: TiptapNode, depth: number) => {
    if (!n || typeof n !== "object" || depth > 40) return;
    if (!SUPPORTED_NODES.has(n.type)) found.add(n.type);
    for (const m of n.marks ?? [])
      if (!SUPPORTED_MARKS.has(m.type)) found.add(m.type);
    if (
      n.type === "heading" &&
      typeof n.attrs?.level === "number" &&
      n.attrs.level > 3
    )
      found.add("heading-4");
    for (const c of n.content ?? []) walk(c, depth + 1);
  };
  for (const n of doc?.content ?? []) walk(n, 0);
  return [...found];
}
