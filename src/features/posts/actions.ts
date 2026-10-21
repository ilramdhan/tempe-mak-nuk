"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { posts, postTags } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";
import { richTextToPlainText } from "@/lib/rich-text/render";

import { postInputSchema, type PostData, type PostInput } from "./schema";

function estimateMinutes(d: PostData): number | null {
  if (d.readingMinutes) return d.readingMinutes;
  if (!d.content) return null;
  const words = richTextToPlainText(d.content)
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function columns(d: PostData) {
  return {
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    content: d.content,
    coverMediaId: d.coverMediaId,
    categoryId: d.categoryId,
    authorId: d.authorId,
    status: d.status,
    // Publishing without a date publishes now.
    publishedAt:
      d.status === "published" && !d.publishedAt ? new Date() : d.publishedAt,
    readingMinutes: estimateMinutes(d),
    seo: d.seo,
  };
}

export async function createPost(
  input: PostInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return adminAction({
    schema: postInputSchema,
    input,
    entity: "posts",
    action: "create",
    run: async (data, { tx, user }) => {
      const [row] = await tx
        .insert(posts)
        .values({ ...columns(data), authorId: data.authorId ?? user.id })
        .returning({ id: posts.id, slug: posts.slug });
      if (data.tagIds?.length)
        await tx
          .insert(postTags)
          .values(data.tagIds.map((tagId) => ({ postId: row.id, tagId })));
      return {
        result: row,
        entityId: row.id,
        diff: { ...data, content: undefined },
        tags: [tags.posts, tags.post(row.slug)],
      };
    },
  });
}

export async function updatePost(
  id: string,
  input: PostInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return adminAction({
    schema: z.intersection(postInputSchema, z.object({ id: uuidSchema })),
    input: { ...input, id },
    entity: "posts",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const [prev] = await tx
        .select({ slug: posts.slug })
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);
      if (!prev) return fail("Artikel tidak ditemukan.");
      const [row] = await tx
        .update(posts)
        .set(columns(data))
        .where(eq(posts.id, id))
        .returning({ id: posts.id, slug: posts.slug });
      if (data.tagIds) {
        await tx.delete(postTags).where(eq(postTags.postId, id));
        if (data.tagIds.length)
          await tx
            .insert(postTags)
            .values(data.tagIds.map((tagId) => ({ postId: id, tagId })));
      }
      return {
        result: row,
        entityId: id,
        diff: { ...data, content: undefined },
        tags: [tags.posts, tags.post(prev.slug), tags.post(row.slug)],
      };
    },
  });
}

export async function deletePost(id: string): Promise<ActionResult> {
  return adminAction({
    // P8.14: owner-only by default; the owner may grant `posts.delete` via /admin/akses.
    role: "owner",
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "posts",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx
        .delete(posts)
        .where(eq(posts.id, id))
        .returning({ slug: posts.slug, title: posts.title });
      if (!row) return fail("Artikel tidak ditemukan.");
      return {
        result: undefined,
        entityId: id,
        diff: row,
        tags: [tags.posts, tags.post(row.slug)],
      };
    },
  });
}

/** Quick status change (publish now / unpublish / schedule). */
export async function setPostStatus(
  id: string,
  status: "draft" | "published" | "scheduled",
  publishedAt?: Date | string | null,
): Promise<ActionResult> {
  return adminAction({
    schema: z
      .object({
        id: uuidSchema,
        status: z.enum(["draft", "published", "scheduled"]),
        publishedAt: z.coerce.date().nullish(),
      })
      .refine((v) => v.status !== "scheduled" || v.publishedAt, {
        path: ["publishedAt"],
        message: "Tanggal terbit wajib diisi",
      }),
    input: { id, status, publishedAt },
    entity: "posts",
    action: status === "draft" ? "unpublish" : "publish",
    run: async ({ id, status, publishedAt }, { tx }) => {
      const [row] = await tx
        .update(posts)
        .set({
          status,
          ...(status !== "draft"
            ? {
                publishedAt:
                  publishedAt ?? sql`coalesce(${posts.publishedAt}, now())`,
              }
            : {}),
        })
        .where(eq(posts.id, id))
        .returning({ slug: posts.slug });
      if (!row) return fail("Artikel tidak ditemukan.");
      return {
        result: undefined,
        entityId: id,
        tags: [tags.posts, tags.post(row.slug)],
      };
    },
  });
}
