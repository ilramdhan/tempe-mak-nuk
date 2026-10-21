"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { media } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { uuidSchema } from "@/features/_shared/schema";
import { AuthError, requireRole } from "@/lib/auth/require-role";
import { tags } from "@/lib/cache-tags";

import { listMediaForAdmin } from "./queries.admin";
import { removeMediaObjects } from "./storage";
import { getMediaUsage, type MediaUsage } from "./usage";

/** Serializable media row for the library grid and MediaPicker. */
export type MediaLibraryItem = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  blurDataUrl: string | null;
  createdAt: string;
};

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(24),
  offset: z.number().int().min(0).max(100_000).default(0),
});

/** Editor+: paginated search for the MediaPicker / library. */
export async function searchMediaLibrary(
  input: z.input<typeof searchSchema>,
): Promise<ActionResult<{ items: MediaLibraryItem[]; hasMore: boolean }>> {
  try {
    await requireRole("editor");
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message);
    throw e;
  }
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return fail("Pencarian tidak valid.");
  const { q, limit, offset } = parsed.data;
  try {
    const rows = await listMediaForAdmin({ q, limit: limit + 1, offset });
    return {
      ok: true,
      data: { items: rows.slice(0, limit).map(toLibraryItem), hasMore: rows.length > limit },
    };
  } catch (error) {
    console.error("[media] search failed:", error);
    return fail("Gagal memuat media.");
  }
}

/** Editor+: one item by id (MediaPicker preview of the current value). */
export async function getMediaLibraryItem(id: string): Promise<ActionResult<MediaLibraryItem | null>> {
  try {
    await requireRole("editor");
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message);
    throw e;
  }
  if (!uuidSchema.safeParse(id).success) return { ok: true, data: null };
  try {
    const [row] = await getDb().select().from(media).where(eq(media.id, id)).limit(1);
    return { ok: true, data: row ? toLibraryItem(row) : null };
  } catch (error) {
    console.error("[media] get failed:", error);
    return fail("Gagal memuat media.");
  }
}

/** Editor+: where is this media used (warning before delete). */
export async function getMediaUsageAction(id: string): Promise<ActionResult<MediaUsage[]>> {
  try {
    await requireRole("editor");
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message);
    throw e;
  }
  if (!uuidSchema.safeParse(id).success) return fail("ID tidak valid");
  try {
    return { ok: true, data: await getMediaUsage(id) };
  } catch (error) {
    console.error("[media] usage failed:", error);
    return fail("Gagal memeriksa pemakaian media.");
  }
}

/**
 * Owner-only: delete the DB row (FKs set null / product gallery cascades) and the Storage
 * object. JSON references (rich text, sections, SEO) are left dangling and render as missing.
 */
export async function deleteMediaAndFile(id: string): Promise<ActionResult<{ storageRemoved: boolean }>> {
  const res = await adminAction({
    role: "owner",
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "media",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(media).where(eq(media.id, id)).returning({ storagePath: media.storagePath });
      if (!row) return fail("Media tidak ditemukan.");
      return {
        result: row,
        entityId: id,
        tags: [tags.media, tags.mediaItem(id), tags.products, tags.posts, tags.recipes, tags.testimonials, tags.pages],
      };
    },
  });
  if (!res.ok) return res;
  const storageRemoved = await removeMediaObjects([res.data.storagePath]);
  return { ok: true, data: { storageRemoved } };
}

function toLibraryItem(r: Awaited<ReturnType<typeof listMediaForAdmin>>[number]): MediaLibraryItem {
  return {
    id: r.id,
    url: r.url,
    alt: r.alt,
    width: r.width,
    height: r.height,
    sizeBytes: r.sizeBytes,
    blurDataUrl: r.blurDataUrl,
    createdAt: r.createdAt.toISOString(),
  };
}
