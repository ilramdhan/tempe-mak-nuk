/**
 * "Tips Tempe" stays as is; "Cerita Dapur" → "Cerita Dapur Tempe".
 * Category names may already contain "tempe", so never append it blindly.
 */
export function categoryTopic(name: string): string {
  const trimmed = name.trim();
  return /\btempe\b/i.test(trimmed) ? trimmed : `${trimmed} Tempe`;
}
