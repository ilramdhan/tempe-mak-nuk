import "server-only";

import { updateTag } from "next/cache";

/**
 * Expire cache tags after an admin write. Uses `updateTag` (Next 16: Server-Action-only,
 * read-your-own-writes — the next request blocks on fresh data instead of serving stale).
 * Route handlers/webhooks must use `revalidateTag(tag, "max")` instead.
 */
export function expireTags(...tagList: (string | null | undefined | false)[]): void {
  for (const t of new Set(tagList.filter((x): x is string => Boolean(x)))) updateTag(t);
}
