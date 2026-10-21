import "server-only";

import { revalidateTag } from "next/cache";

import { getDb } from "@/db/client";
import { media } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/auth/require-role";
import { tags } from "@/lib/cache-tags";

import { processImage } from "./process-image";
import { mediaInputSchema } from "./schema";
import { putMediaObject, removeMediaObjects } from "./storage";
import { buildStoragePath } from "./upload-rules";

export type UploadedMedia = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  sizeBytes: number;
  blurDataUrl: string;
  createdAt: string;
};

/**
 * Process → store → insert one upload (P5.8). Route-handler context: uses
 * `revalidateTag(tag, "max")` (updateTag is Server-Action-only). Caller has done requireRole.
 * Throws ImageProcessingError (user-facing message) or generic errors.
 */
export async function storeUpload(
  buffer: Buffer,
  alt: string,
  user: SessionUser,
): Promise<UploadedMedia> {
  const img = await processImage(buffer);
  const id = crypto.randomUUID();
  const storagePath = buildStoragePath(id);
  const url = await putMediaObject(storagePath, img.buffer, img.mime);

  const data = mediaInputSchema.parse({
    storagePath,
    url,
    alt,
    width: img.width,
    height: img.height,
    mime: img.mime,
    sizeBytes: img.sizeBytes,
    blurDataUrl: img.blurDataUrl,
  });

  let row: { id: string; createdAt: Date };
  try {
    [row] = await getDb()
      .insert(media)
      .values({ ...data, id, createdBy: user.id })
      .returning({ id: media.id, createdAt: media.createdAt });
  } catch (error) {
    await removeMediaObjects([storagePath]); // don't leave orphans
    throw error;
  }

  await writeAudit({
    actorId: user.id,
    action: "create",
    entity: "media",
    entityId: row.id,
    diff: {
      storagePath,
      alt,
      width: img.width,
      height: img.height,
      sizeBytes: img.sizeBytes,
    },
  });
  revalidateTag(tags.media, "max");

  return {
    id: row.id,
    url,
    alt: data.alt,
    width: img.width,
    height: img.height,
    sizeBytes: img.sizeBytes,
    blurDataUrl: img.blurDataUrl,
    createdAt: row.createdAt.toISOString(),
  };
}
