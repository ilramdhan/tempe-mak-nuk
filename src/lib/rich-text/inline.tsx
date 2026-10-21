/**
 * Light markdown → React for short CMS text (FAQ answers, testimonial quotes):
 * **bold**, *italic*, [label](href), blank line = new paragraph, single newline = <br>.
 * No HTML is ever interpreted.
 */
import { Fragment, type ReactNode } from "react";

import { isExternalHref, sanitizeHref } from "./render";

const INLINE_RE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+?)\]\(([^)\s]+?)\)/g;

export function renderInline(
  src: string,
  opts: { internalHosts?: readonly string[] } = {},
): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of src.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(src.slice(last, idx));
    const key = `i${i++}`;
    if (m[1] !== undefined) out.push(<strong key={key}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<em key={key}>{m[2]}</em>);
    else {
      const href = sanitizeHref(m[4]);
      if (!href) out.push(m[3]);
      else if (isExternalHref(href, opts.internalHosts))
        out.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {m[3]}
          </a>,
        );
      else
        out.push(
          <a key={key} href={href}>
            {m[3]}
          </a>,
        );
    }
    last = idx + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export function renderLightMarkdown(
  src: string,
  opts: { internalHosts?: readonly string[] } = {},
): ReactNode {
  const paragraphs = src
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((p, pi) => (
    <p key={pi}>
      {p.split("\n").map((line, li) => (
        <Fragment key={li}>
          {li > 0 ? <br /> : null}
          {renderInline(line, opts)}
        </Fragment>
      ))}
    </p>
  ));
}
