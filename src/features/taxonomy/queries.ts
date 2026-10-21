import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { categories, tags as tagTable, type CategoryKind } from "@/db/schema";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort: number;
};

/** Categories of one kind (post | recipe | faq), by sort. */
export async function getCategories(
  kind: CategoryKind,
): Promise<PublicCategory[]> {
  "use cache";
  cacheTag(tags.categories);
  return cachedRead(`categories:${kind}`, "days", [], (db) =>
    db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        sort: categories.sort,
      })
      .from(categories)
      .where(eq(categories.kind, kind))
      .orderBy(asc(categories.sort), asc(categories.name)),
  );
}

export async function getCategory(
  kind: CategoryKind,
  slug: string,
): Promise<PublicCategory | null> {
  return (await getCategories(kind)).find((c) => c.slug === slug) ?? null;
}

export async function getTags(): Promise<
  { id: string; slug: string; name: string }[]
> {
  "use cache";
  cacheTag(tags.tags);
  return cachedRead("tags", "days", [], (db) =>
    db
      .select({ id: tagTable.id, slug: tagTable.slug, name: tagTable.name })
      .from(tagTable)
      .orderBy(asc(tagTable.name)),
  );
}
