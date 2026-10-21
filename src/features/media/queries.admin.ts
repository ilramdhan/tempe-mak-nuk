import "server-only";

import { desc, ilike, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { media } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function listMediaForAdmin(
  opts: { q?: string; limit?: number; offset?: number } = {},
) {
  await requireRole("editor", { onFail: "redirect" });
  const q = opts.q?.trim();
  return getDb()
    .select()
    .from(media)
    .where(
      q
        ? or(ilike(media.alt, `%${q}%`), ilike(media.storagePath, `%${q}%`))
        : undefined,
    )
    .orderBy(desc(media.createdAt))
    .limit(Math.min(opts.limit ?? 60, 200))
    .offset(opts.offset ?? 0);
}
