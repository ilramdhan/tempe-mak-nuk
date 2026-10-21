import "server-only";

import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { cacheTag } from "next/cache";

import type { Database } from "@/db/client";
import {
  categories,
  media,
  posts,
  postTags,
  profiles,
  tags as tagTable,
} from "@/db/schema";
import type { RichTextDoc, SeoMeta } from "@/db/schema/seo";
import { cachedRead } from "@/features/_shared/db";
import { isLiveSql } from "@/features/_shared/live";
import type { PublicMedia } from "@/features/media/queries";
import { tags } from "@/lib/cache-tags";

export type CategoryRef = { id: string; slug: string; name: string };

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  readingMinutes: number | null;
  category: CategoryRef | null;
  cover: PublicMedia | null;
};

export type PostDetail = PostSummary & {
  content: RichTextDoc | null;
  seo: SeoMeta;
  updatedAt: Date;
  author: { name: string | null } | null;
  tags: { slug: string; name: string }[];
};

const live = isLiveSql(posts.status, posts.publishedAt);

const summaryCols = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  publishedAt: posts.publishedAt,
  readingMinutes: posts.readingMinutes,
  categoryId: categories.id,
  categorySlug: categories.slug,
  categoryName: categories.name,
  coverId: media.id,
  coverUrl: media.url,
  coverAlt: media.alt,
  coverWidth: media.width,
  coverHeight: media.height,
  coverBlur: media.blurDataUrl,
};

type SummaryRow = {
  [K in keyof typeof summaryCols]: (typeof summaryCols)[K]["_"]["data"] | null;
};

function toSummary(r: SummaryRow): PostSummary {
  return {
    id: r.id!,
    slug: r.slug!,
    title: r.title!,
    excerpt: r.excerpt,
    publishedAt: r.publishedAt,
    readingMinutes: r.readingMinutes,
    category: r.categoryId
      ? { id: r.categoryId, slug: r.categorySlug!, name: r.categoryName! }
      : null,
    cover: r.coverId
      ? {
          id: r.coverId,
          url: r.coverUrl!,
          alt: r.coverAlt!,
          width: r.coverWidth,
          height: r.coverHeight,
          blurDataUrl: r.coverBlur,
        }
      : null,
  };
}

function summaryQuery(db: Database) {
  return db
    .select(summaryCols)
    .from(posts)
    .leftJoin(categories, eq(categories.id, posts.categoryId))
    .leftJoin(media, eq(media.id, posts.coverMediaId));
}

/** Live posts, newest first. Optional category slug filter. */
export async function getPosts(
  opts: { category?: string | null; limit?: number } = {},
): Promise<PostSummary[]> {
  "use cache";
  cacheTag(tags.posts);
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  return cachedRead("posts", "hours", [], async (db) => {
    const rows = await summaryQuery(db)
      .where(
        opts.category ? and(live, eq(categories.slug, opts.category)) : live,
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    return rows.map(toSummary);
  });
}

/** Specific posts by slug, in the given order (non-live skipped). */
export async function getPostsBySlugs(
  slugs: readonly string[],
): Promise<PostSummary[]> {
  if (!slugs.length) return [];
  const list = await getPostsBySlugsCached([...slugs]);
  const bySlug = new Map(list.map((p) => [p.slug, p]));
  return slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is PostSummary => Boolean(p));
}

async function getPostsBySlugsCached(slugs: string[]): Promise<PostSummary[]> {
  "use cache";
  cacheTag(tags.posts, ...slugs.slice(0, 50).map(tags.post));
  return cachedRead("posts-by-slug", "hours", [], async (db) =>
    (await summaryQuery(db).where(and(live, inArray(posts.slug, slugs)))).map(
      toSummary,
    ),
  );
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheTag(tags.posts, tags.post(slug));
  return cachedRead("post", "hours", null, async (db) => {
    const [row] = await db
      .select({
        ...summaryCols,
        content: posts.content,
        seo: posts.seo,
        updatedAt: posts.updatedAt,
        authorName: profiles.displayName,
        authorId: posts.authorId,
      })
      .from(posts)
      .leftJoin(categories, eq(categories.id, posts.categoryId))
      .leftJoin(media, eq(media.id, posts.coverMediaId))
      .leftJoin(profiles, eq(profiles.id, posts.authorId))
      .where(and(live, eq(posts.slug, slug)))
      .limit(1);
    if (!row) return null;
    const tagRows = await db
      .select({ slug: tagTable.slug, name: tagTable.name })
      .from(postTags)
      .innerJoin(tagTable, eq(tagTable.id, postTags.tagId))
      .where(eq(postTags.postId, row.id))
      .orderBy(asc(tagTable.name));
    return {
      ...toSummary(row),
      content: row.content,
      seo: row.seo,
      updatedAt: row.updatedAt,
      author: row.authorId ? { name: row.authorName } : null,
      tags: tagRows,
    };
  });
}

/** Same-category posts first, then newest, excluding the current one. */
export async function getRelatedPosts(
  slug: string,
  limit = 3,
): Promise<PostSummary[]> {
  "use cache";
  cacheTag(tags.posts);
  return cachedRead("related-posts", "hours", [], async (db) => {
    const [cur] = await db
      .select({ categoryId: posts.categoryId })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    const rows = await summaryQuery(db)
      .where(and(live, ne(posts.slug, slug)))
      .orderBy(desc(posts.publishedAt))
      .limit(30);
    const list = rows.map(toSummary);
    const same = cur?.categoryId
      ? list.filter((p) => p.category?.id === cur.categoryId)
      : [];
    const rest = list.filter((p) => !same.includes(p));
    return [...same, ...rest].slice(0, limit);
  });
}

export async function getPostSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  "use cache";
  cacheTag(tags.posts);
  return cachedRead("post-slugs", "hours", [], (db) =>
    db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(live)
      .orderBy(desc(posts.publishedAt)),
  );
}

/** Sitemap rows: live posts with their noindex flag. */
export async function listPostsForSitemap(): Promise<
  { slug: string; updatedAt: Date; noindex: boolean }[]
> {
  "use cache";
  cacheTag(tags.posts);
  return cachedRead("posts-sitemap", "hours", [], async (db) =>
    (
      await db
        .select({
          slug: posts.slug,
          updatedAt: posts.updatedAt,
          seo: posts.seo,
        })
        .from(posts)
        .where(live)
        .orderBy(desc(posts.publishedAt))
    ).map((r) => ({
      slug: r.slug,
      updatedAt: r.updatedAt,
      noindex: r.seo?.noindex === true,
    })),
  );
}
