"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { media } from "@/db/schema";
import { fail } from "@/features/_shared/action";
import type { ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { mediaInputSchema, mediaUpdateSchema, type MediaInput } from "./schema";

/**
 * Register an uploaded file's metadata. The actual upload (MIME/size validation, resize to WebP,
 * Supabase Storage write via service role) is done by the upload route in P5.x.
 */
export async function createMedia(input: MediaInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: mediaInputSchema,
    input,
    entity: "media",
    action: "create",
    run: async (data, { tx, user }) => {
      const [row] = await tx.insert(media).values({ ...data, createdBy: user.id }).returning({ id: media.id });
      return { result: row, entityId: row.id, tags: [tags.media] };
    },
  });
}

export async function updateMediaAlt(id: string, input: { alt: string }): Promise<ActionResult> {
  return adminAction({
    schema: mediaUpdateSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "media",
    action: "update",
    run: async ({ id, alt }, { tx }) => {
      const rows = await tx.update(media).set({ alt }).where(eq(media.id, id)).returning({ id: media.id });
      if (!rows.length) return fail("Media tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.media, tags.mediaItem(id)] };
    },
  });
}

/** Deletes the DB row (FKs set null / cascade). Storage object removal happens in P5.x route. */
export async function deleteMedia(id: string): Promise<ActionResult<{ storagePath: string }>> {
  return adminAction({
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "media",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(media).where(eq(media.id, id)).returning({ storagePath: media.storagePath });
      if (!row) return fail("Media tidak ditemukan.");
      // Media can appear anywhere (covers, galleries, blocks) — expire content lists too.
      return {
        result: row,
        entityId: id,
        tags: [tags.media, tags.mediaItem(id), tags.products, tags.posts, tags.recipes, tags.testimonials, tags.pages],
      };
    },
  });
}
