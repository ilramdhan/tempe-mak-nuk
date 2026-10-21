import "server-only";

import { inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { media } from "@/db/schema";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

export type PublicMedia = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
};

const columns = {
  id: media.id,
  url: media.url,
  alt: media.alt,
  width: media.width,
  height: media.height,
  blurDataUrl: media.blurDataUrl,
};

/** Batch-load media by id → record keyed by id (serializable; missing ids are absent). */
export async function getMediaByIds(
  ids: readonly (string | null | undefined)[],
): Promise<Record<string, PublicMedia>> {
  const unique = [
    ...new Set(
      ids.filter(
        (x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x),
      ),
    ),
  ].sort();
  if (unique.length === 0) return {};
  return getMediaByIdsCached(unique);
}

async function getMediaByIdsCached(
  ids: string[],
): Promise<Record<string, PublicMedia>> {
  "use cache";
  cacheTag(tags.media, ...ids.slice(0, 100).map(tags.mediaItem));
  return cachedRead("media", "days", {}, async (db) => {
    const rows = await db
      .select(columns)
      .from(media)
      .where(inArray(media.id, ids));
    return Object.fromEntries(rows.map((r) => [r.id, r]));
  });
}

export async function getMedia(
  id: string | null | undefined,
): Promise<PublicMedia | null> {
  if (!id) return null;
  return (await getMediaByIds([id]))[id] ?? null;
}
