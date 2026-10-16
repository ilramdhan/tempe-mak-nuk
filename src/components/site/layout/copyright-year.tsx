import { cacheLife } from "next/cache";

import { zonedParts } from "@/lib/dates";

/**
 * Current year (Asia/Jakarta). Read inside "use cache" so the value is captured in the
 * prerendered shell (no sync-IO prerender error) and refreshed daily.
 */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{zonedParts(new Date()).year}</>;
}
