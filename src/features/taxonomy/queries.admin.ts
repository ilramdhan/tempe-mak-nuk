import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  faqs,
  postTags,
  posts,
  recipes,
  tags,
  type CategoryKind,
} from "@/db/schema";
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

export type CategoryWithCount = Awaited<
  ReturnType<typeof listCategoriesWithCounts>
>[number];

/** All categories with the number of items (posts/recipes/FAQs) using each. */
export async function listCategoriesWithCounts() {
  await requireRole("editor", { onFail: "redirect" });
  const db = getDb();
  const [cats, p, r, f] = await Promise.all([
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.kind), asc(categories.sort)),
    db
      .select({ id: posts.categoryId, n: count() })
      .from(posts)
      .groupBy(posts.categoryId),
    db
      .select({ id: recipes.categoryId, n: count() })
      .from(recipes)
      .groupBy(recipes.categoryId),
    db
      .select({ id: faqs.categoryId, n: count() })
      .from(faqs)
      .groupBy(faqs.categoryId),
  ]);
  const used = new Map<string, number>();
  for (const row of [...p, ...r, ...f])
    if (row.id) used.set(row.id, (used.get(row.id) ?? 0) + row.n);
  return cats.map((c) => ({
    id: c.id,
    kind: c.kind,
    slug: c.slug,
    name: c.name,
    description: c.description,
    sort: c.sort,
    count: used.get(c.id) ?? 0,
  }));
}

/** Tags with the number of posts using each. */
export async function listTagsWithCounts() {
  await requireRole("editor", { onFail: "redirect" });
  const db = getDb();
  const [all, used] = await Promise.all([
    db.select().from(tags).orderBy(asc(tags.name)),
    db
      .select({ id: postTags.tagId, n: count() })
      .from(postTags)
      .groupBy(postTags.tagId),
  ]);
  const m = new Map(used.map((u) => [u.id, u.n]));
  return all.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    count: m.get(t.id) ?? 0,
  }));
}
