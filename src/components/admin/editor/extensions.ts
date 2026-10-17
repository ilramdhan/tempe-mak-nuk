import type { Extensions } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

import { normalizeLinkHref } from "./doc-utils";

/**
 * Image node + `mediaId` attr (resolved by `renderRichText` via `media` map). The stored
 * `src` is a fallback/preview URL; alt is required by the insert dialog.
 */
export const MediaImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-media-id"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.mediaId ? { "data-media-id": String(attrs.mediaId) } : {},
      },
    };
  },
}).configure({ inline: false, allowBase64: false });

/**
 * Only nodes/marks that `renderRichText` renders (see doc-utils EDITOR_*_TYPES). Anything
 * else pasted in is dropped by the schema.
 */
export function buildExtensions(placeholder?: string): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      code: false,
      codeBlock: false,
      strike: false,
      horizontalRule: false,
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: { target: null, rel: null, class: null },
        isAllowedUri: (url) => normalizeLinkHref(url) !== null,
        shouldAutoLink: (url) =>
          /^https?:\/\//i.test(url) || /^www\./i.test(url),
      },
    }),
    MediaImage,
    Placeholder.configure({ placeholder: placeholder ?? "Tulis di sini…" }),
  ];
}
