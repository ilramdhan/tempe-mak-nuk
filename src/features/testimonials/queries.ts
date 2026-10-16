import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { media, testimonials } from "@/db/schema";
import { cachedRead } from "@/features/_shared/db";
import type { PublicMedia } from "@/features/media/queries";
import { tags } from "@/lib/cache-tags";

export type PublicTestimonial = {
  id: string;
  name: string;
  role: string | null;
  city: string | null;
  quote: string;
  rating: number | null;
  verified: boolean;
  /** UI must label placeholders (e.g. "Contoh testimoni"). */
  isPlaceholder: boolean;
  photo: PublicMedia | null;
};

export async function getTestimonials(): Promise<PublicTestimonial[]> {
  "use cache";
  cacheTag(tags.testimonials);
  return cachedRead("testimonials", "days", [], async (db) => {
    const rows = await db
      .select({
        id: testimonials.id,
        name: testimonials.name,
        role: testimonials.role,
        city: testimonials.city,
        quote: testimonials.quote,
        rating: testimonials.rating,
        verified: testimonials.verified,
        isPlaceholder: testimonials.isPlaceholder,
        mId: media.id,
        mUrl: media.url,
        mAlt: media.alt,
        mW: media.width,
        mH: media.height,
        mBlur: media.blurDataUrl,
      })
      .from(testimonials)
      .leftJoin(media, eq(media.id, testimonials.mediaId))
      .where(eq(testimonials.visible, true))
      .orderBy(asc(testimonials.sort));
    return rows.map(({ mId, mUrl, mAlt, mW, mH, mBlur, ...t }) => ({
      ...t,
      photo: mId ? { id: mId, url: mUrl!, alt: mAlt!, width: mW, height: mH, blurDataUrl: mBlur } : null,
    }));
  });
}

/** By ids (given order) or first `limit` by sort. */
export async function queryTestimonials(q: { ids?: readonly string[] | null; limit?: number | null } = {}) {
  const all = await getTestimonials();
  if (q.ids?.length) {
    const byId = new Map(all.map((t) => [t.id, t]));
    return q.ids.map((id) => byId.get(id)).filter((t): t is PublicTestimonial => Boolean(t));
  }
  return q.limit ? all.slice(0, q.limit) : all;
}
