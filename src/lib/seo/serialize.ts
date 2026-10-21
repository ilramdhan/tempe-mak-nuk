/** Serialise JSON-LD safely for an inline <script> (no `</script>` breakout). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c"); // JSON.stringify already escapes U+2028/2029.
}
