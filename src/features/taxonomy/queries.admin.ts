import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { categories, tags, type CategoryKind } from "@/db/schema";

export async function listCategoriesForAdmin(kind?: CategoryKind) {
  return getDb()
    .select()
    .from(categories)
    .where(kind ? eq(categories.kind, kind) : undefined)
    .orderBy(asc(categories.kind), asc(categories.sort));
}

export async function listTagsForAdmin() {
  return getDb().select().from(tags).orderBy(asc(tags.name));
}
