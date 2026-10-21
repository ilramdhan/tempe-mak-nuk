import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { posts, postTags, type ContentStatus } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

/** Admin list incl. drafts/scheduled (no content column). */
export async function listPostsForAdmin(opts: { status?: ContentStatus } = {}) {
  await requireRole("editor", { onFail: "redirect" });
  return getDb()
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(opts.status ? eq(posts.status, opts.status) : undefined)
    .orderBy(desc(posts.updatedAt));
}

export async function getPostForAdmin(id: string) {
  await requireRole("editor", { onFail: "redirect" });
  const db = getDb();
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return null;
  const t = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, id))
    .orderBy(asc(postTags.tagId));
  return { ...post, tagIds: t.map((x) => x.tagId) };
}

export async function countDraftPosts(): Promise<number> {
  await requireRole("editor", { onFail: "redirect" });
  return getDb().$count(posts, eq(posts.status, "draft"));
}
