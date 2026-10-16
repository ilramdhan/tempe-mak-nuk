/**
 * Pre-paint inline script (see Next docs "Preventing flash before hydration").
 * `text/plain` on the client so React doesn't warn/re-execute; the server copy
 * runs once during HTML parsing. CSP allows 'unsafe-inline' (next.config).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
