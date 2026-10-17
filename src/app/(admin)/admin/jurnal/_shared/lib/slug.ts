/** Title → URL slug matching `slugSchema` (a-z0-9 + single dashes, ≤ 120). */
export function slugify(input: string, max = 120): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/** Sanitise what the user types into the slug box (keeps a trailing dash while typing). */
export function cleanSlugInput(input: string, max = 120): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/g, "")
    .slice(0, max);
}
