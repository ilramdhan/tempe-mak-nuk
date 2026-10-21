import { and, gt, inArray, lte, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";

import { getDb } from "@/db/client";
import { legalDocuments, posts, recipes } from "@/db/schema";
import { tags } from "@/lib/cache-tags";

import { isAuthorizedCronRequest } from "../_lib/auth";
import { parseWindowMinutes } from "./window";

const noStore = { "Cache-Control": "no-store" };

/**
 * Vercel Cron: scheduled posts/recipes/legal docs whose publish/effective time passed within
 * the lookback window get their cache tags expired so they appear on time. Idempotent.
 * Scheduled daily (Vercel Hobby) with a 25 h window so late or jittered runs never miss an item.
 */
export async function GET(request: Request) {
  await connection();

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "cron secret not configured" },
      { status: 500, headers: noStore },
    );
  }
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return Response.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: noStore },
    );
  }

  const windowMin = parseWindowMinutes(
    new URL(request.url).searchParams.get("window"),
  );
  const since = sql`now() - make_interval(mins => ${windowMin})`;

  try {
    const db = getDb();
    const [p, r, l] = await Promise.all([
      db
        .select({ slug: posts.slug })
        .from(posts)
        .where(
          and(
            inArray(posts.status, ["published", "scheduled"]),
            gt(posts.publishedAt, since as never),
            lte(posts.publishedAt, sql`now()` as never),
          ),
        ),
      db
        .select({ slug: recipes.slug })
        .from(recipes)
        .where(
          and(
            inArray(recipes.status, ["published", "scheduled"]),
            gt(recipes.publishedAt, since as never),
            lte(recipes.publishedAt, sql`now()` as never),
          ),
        ),
      db
        .select({ slug: legalDocuments.slug })
        .from(legalDocuments)
        .where(
          and(
            gt(legalDocuments.effectiveAt, since as never),
            lte(legalDocuments.effectiveAt, sql`now()` as never),
          ),
        ),
    ]);

    const expired = new Set<string>();
    if (p.length) {
      expired.add(tags.posts);
      p.forEach((x) => expired.add(tags.post(x.slug)));
    }
    if (r.length) {
      expired.add(tags.recipes);
      r.forEach((x) => expired.add(tags.recipe(x.slug)));
    }
    if (l.length) {
      expired.add(tags.legal);
      l.forEach((x) => expired.add(tags.legalDoc(x.slug)));
    }
    for (const t of expired) revalidateTag(t, "max");

    return Response.json(
      { ok: true, windowMinutes: windowMin, revalidated: [...expired] },
      { headers: noStore },
    );
  } catch (err) {
    console.error("[cron/publish] failed:", err);
    return Response.json(
      { ok: false, error: "failed" },
      { status: 503, headers: noStore },
    );
  }
}
