/**
 * Tiptap JSON → React elements, server-side and without dangerouslySetInnerHTML.
 * Every node/mark type is allow-listed; unknown ones are dropped (their text children kept
 * where safe). URLs are sanitized (http/https/mailto/tel/relative only).
 *
 * Wrap the output in <Prose> for typography.
 */
import { Fragment, type ReactNode } from "react";

import type { TiptapDoc, TiptapMark, TiptapNode } from "./schema";

export type RichTextMedia = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

export type RenderRichTextOptions = {
  /** Resolve `image` nodes that carry `attrs.mediaId`. */
  media?: ReadonlyMap<string, RichTextMedia> | Record<string, RichTextMedia>;
  /** Hostnames treated as internal links (no target/rel). */
  internalHosts?: readonly string[];
  /** Shift heading levels (e.g. 1 → h2 becomes h3). Result clamped to 2–4. */
  headingOffset?: number;
  /** Generate `id` slugs on headings (for TOC). Default true. */
  headingIds?: boolean;
};

const MAX_DEPTH = 30;

/** Returns a safe href or null. */
export function sanitizeHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const href = raw.trim();
  if (!href || href.length > 2000) return null;
  // Strip whitespace/control chars browsers ignore inside schemes ("java\tscript:").
  const compact = href.replace(/[\u0000- \u007F]/g, "").toLowerCase();
  if (/^(\/(?!\/)|#|\?)/.test(compact)) return href;
  if (/^(https?:|mailto:|tel:)/.test(compact)) return href;
  if (!/^[a-z][a-z0-9+.-]*:/.test(compact) && !compact.startsWith("//"))
    return href; // relative "foo/bar"
  return null;
}

/** Safe image src: https/http, root-relative, or data:image (raster only). */
export function sanitizeImageSrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const src = raw.trim();
  if (/^https?:\/\//i.test(src) || /^\/(?!\/)/.test(src)) return src;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(src)) return src;
  return null;
}

export function isExternalHref(
  href: string,
  internalHosts: readonly string[] = [],
): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return !internalHosts.some((h) => h.replace(/^www\./, "") === host);
  } catch {
    return true;
  }
}

export function slugifyHeading(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Plain text of a node tree (TOC, reading time, excerpts, JSON-LD). */
export function richTextToPlainText(
  node: TiptapDoc | TiptapNode | null | undefined,
): string {
  const out: string[] = [];
  const walk = (n: TiptapNode, depth: number) => {
    if (depth > MAX_DEPTH || !n || typeof n !== "object") return;
    if (n.type === "text" && typeof n.text === "string") out.push(n.text);
    else if (n.type === "hardBreak") out.push("\n");
    if (Array.isArray(n.content)) n.content.forEach((c) => walk(c, depth + 1));
    if (["paragraph", "heading", "listItem", "blockquote"].includes(n.type))
      out.push("\n");
  };
  if (node) walk(node as TiptapNode, 0);
  return out
    .join("")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export type RichTextHeading = { id: string; text: string; level: 2 | 3 | 4 };

function clampLevel(raw: unknown, offset: number): 2 | 3 | 4 {
  const n =
    typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 2;
  return Math.min(4, Math.max(2, n + offset)) as 2 | 3 | 4;
}

/** Headings (with the same ids the renderer emits) for a table of contents. */
export function extractHeadings(
  doc: TiptapDoc | null | undefined,
  options: Pick<RenderRichTextOptions, "headingOffset"> = {},
): RichTextHeading[] {
  const seen = new Map<string, number>();
  const out: RichTextHeading[] = [];
  for (const n of doc?.content ?? []) {
    if (n?.type !== "heading") continue;
    const text = richTextToPlainText(n);
    if (!text) continue;
    out.push({
      id: uniqueId(slugifyHeading(text), seen),
      text,
      level: clampLevel(n.attrs?.level, options.headingOffset ?? 0),
    });
  }
  return out;
}

function uniqueId(base: string, seen: Map<string, number>): string {
  const b = base || "bagian";
  const count = seen.get(b) ?? 0;
  seen.set(b, count + 1);
  return count === 0 ? b : `${b}-${count + 1}`;
}

type Ctx = {
  media: (id: string) => RichTextMedia | undefined;
  internalHosts: readonly string[];
  headingOffset: number;
  headingIds: boolean;
  seenIds: Map<string, number>;
};

function renderMarks(
  text: ReactNode,
  marks: TiptapMark[] | undefined,
  ctx: Ctx,
  key: string,
): ReactNode {
  if (!Array.isArray(marks) || marks.length === 0) return text;
  // Apply link outermost so styling marks nest inside the anchor.
  const ordered = [...marks].sort(
    (a, b) => (a.type === "link" ? 1 : 0) - (b.type === "link" ? 1 : 0),
  );
  let out = text;
  ordered.forEach((m, i) => {
    const k = `${key}-m${i}`;
    switch (m?.type) {
      case "bold":
        out = <strong key={k}>{out}</strong>;
        break;
      case "italic":
        out = <em key={k}>{out}</em>;
        break;
      case "code":
        out = <code key={k}>{out}</code>;
        break;
      case "strike":
        out = <s key={k}>{out}</s>;
        break;
      case "underline":
        out = <u key={k}>{out}</u>;
        break;
      case "link": {
        const href = sanitizeHref(m.attrs?.href);
        if (!href) break;
        out = isExternalHref(href, ctx.internalHosts) ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">
            {out}
          </a>
        ) : (
          <a key={k} href={href}>
            {out}
          </a>
        );
        break;
      }
      default:
        break;
    }
  });
  return out;
}

function renderChildren(
  node: TiptapNode,
  ctx: Ctx,
  depth: number,
  key: string,
): ReactNode[] {
  if (!Array.isArray(node.content)) return [];
  return node.content.map((c, i) =>
    renderNode(c, ctx, depth + 1, `${key}.${i}`),
  );
}

function renderImage(node: TiptapNode, ctx: Ctx, key: string): ReactNode {
  const attrs = node.attrs ?? {};
  const mediaId = typeof attrs.mediaId === "string" ? attrs.mediaId : null;
  const m = mediaId ? ctx.media(mediaId) : undefined;
  const src = sanitizeImageSrc(m?.url ?? attrs.src);
  if (!src) return null;
  const alt = (typeof attrs.alt === "string" && attrs.alt) || m?.alt || "";
  const caption =
    typeof attrs.title === "string" && attrs.title ? attrs.title : null;
  const width =
    m?.width ?? (typeof attrs.width === "number" ? attrs.width : undefined);
  const height =
    m?.height ?? (typeof attrs.height === "number" ? attrs.height : undefined);
  // Plain <img>: CMS images come from Supabase Storage, already resized/WebP at upload (P5.x).
  // eslint-disable-next-line @next/next/no-img-element
  const img = (
    <img
      src={src}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      loading="lazy"
      decoding="async"
    />
  );
  return (
    <figure key={key}>
      {img}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function renderNode(
  node: TiptapNode,
  ctx: Ctx,
  depth: number,
  key: string,
): ReactNode {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return null;
  switch (node.type) {
    case "text": {
      if (typeof node.text !== "string" || node.text === "") return null;
      return (
        <Fragment key={key}>
          {renderMarks(node.text, node.marks, ctx, key)}
        </Fragment>
      );
    }
    case "paragraph": {
      const children = renderChildren(node, ctx, depth, key);
      return children.length ? <p key={key}>{children}</p> : null;
    }
    case "heading": {
      const level = clampLevel(node.attrs?.level, ctx.headingOffset);
      const Tag = `h${level}` as const;
      const text = richTextToPlainText(node);
      const id =
        ctx.headingIds && text
          ? uniqueId(slugifyHeading(text), ctx.seenIds)
          : undefined;
      return (
        <Tag key={key} id={id}>
          {renderChildren(node, ctx, depth, key)}
        </Tag>
      );
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node, ctx, depth, key)}</ul>;
    case "orderedList": {
      const start = node.attrs?.start;
      return (
        <ol
          key={key}
          start={typeof start === "number" && start !== 1 ? start : undefined}
        >
          {renderChildren(node, ctx, depth, key)}
        </ol>
      );
    }
    case "listItem":
      return <li key={key}>{renderChildren(node, ctx, depth, key)}</li>;
    case "blockquote":
      return (
        <blockquote key={key}>
          {renderChildren(node, ctx, depth, key)}
        </blockquote>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return renderImage(node, ctx, key);
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{richTextToPlainText(node)}</code>
        </pre>
      );
    default:
      return null;
  }
}

/** Render a Tiptap document to React nodes. Never throws on malformed input. */
export function renderRichText(
  doc: TiptapDoc | { type?: unknown; content?: unknown } | null | undefined,
  options: RenderRichTextOptions = {},
): ReactNode {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content))
    return null;
  const media = options.media;
  const lookup =
    media instanceof Map
      ? (id: string) => media.get(id)
      : media
        ? (id: string) =>
            Object.hasOwn(media, id)
              ? (media as Record<string, RichTextMedia>)[id]
              : undefined
        : () => undefined;
  const ctx: Ctx = {
    media: lookup,
    internalHosts: options.internalHosts ?? [],
    headingOffset: options.headingOffset ?? 0,
    headingIds: options.headingIds ?? true,
    seenIds: new Map(),
  };
  return (doc.content as TiptapNode[]).map((n, i) =>
    renderNode(n, ctx, 0, `n${i}`),
  );
}

/** Collect media ids referenced by image nodes (to batch-load them before rendering). */
export function collectMediaIds(doc: TiptapDoc | null | undefined): string[] {
  const ids = new Set<string>();
  const walk = (n: TiptapNode, depth: number) => {
    if (!n || depth > MAX_DEPTH) return;
    if (n.type === "image" && typeof n.attrs?.mediaId === "string")
      ids.add(n.attrs.mediaId);
    n.content?.forEach((c) => walk(c, depth + 1));
  };
  doc?.content?.forEach((n) => walk(n, 0));
  return [...ids];
}
