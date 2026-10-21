import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { MEDIA_BUCKET } from "./upload-rules";

/**
 * Supabase Storage writes for the media library (P5.8). Service role only — callers MUST have
 * checked `requireRole()` first. The bucket is public-read; there is no public insert policy.
 */
export async function putMediaObject(path: string, body: Buffer, contentType: string): Promise<string> {
  const storage = createAdminClient().storage.from(MEDIA_BUCKET);
  const { error } = await storage.upload(path, body, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal (logs instead of throwing — the DB row is the source of truth). */
export async function removeMediaObjects(paths: string[]): Promise<boolean> {
  if (!paths.length) return true;
  const { error } = await createAdminClient().storage.from(MEDIA_BUCKET).remove(paths);
  if (error) {
    console.error("[media] storage remove failed:", paths, error.message);
    return false;
  }
  return true;
}
