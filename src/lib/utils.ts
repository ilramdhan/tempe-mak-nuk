/**
 * Minimal class-name joiner.
 *
 * TEMPORARY: clsx + tailwind-merge are not installed yet. P2.2 (shadcn init)
 * must replace this with shadcn's `cn()` (clsx + twMerge) — same signature,
 * so call sites do not change. Until then, conflicting utilities are NOT
 * merged: primitives put caller `className` last and avoid overlap.
 */
export type ClassValue =
  string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }
  return out.join(" ");
}
