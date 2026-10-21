import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { categories, tags, type CategoryKind } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function listCategoriesForAdmin(kind?: CategoryKind) {
  await requireRole("editor", { onFail: "redirect" });
  return getDb()
    .select()
    .from(categories)
    .where(kind ? eq(categories.kind, kind) : undefined)
    .orderBy(asc(categories.kind), asc(categories.sort));
}

export async function listTagsForAdmin() {
  await requireRole("editor", { onFail: "redirect" });
  return getDb().select().from(tags).orderBy(asc(tags.name));
}
