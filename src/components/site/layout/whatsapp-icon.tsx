import type { SVGProps } from "react";

/** Line-style WhatsApp glyph (speech bubble + handset), currentColor, 24px grid. */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M3.5 20.5 4.8 16A8.5 8.5 0 1 1 8 19.2Z" />
      <path d="M9.2 8.6c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .5-.1.6l-.5.6a5.6 5.6 0 0 0 2.7 2.7l.6-.5c.2-.1.4-.2.6-.1l1.5.6c.2.1.4.3.4.5v.5c0 .3-.2.6-.5.8-.5.3-1.2.5-1.9.3a8 8 0 0 1-5.5-5.5c-.2-.7 0-1.4.3-1.9Z" />
    </svg>
  );
}
