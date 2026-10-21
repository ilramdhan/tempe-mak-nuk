/**
 * Idempotently create / update the public-read Supabase Storage bucket `media` (P5.8).
 * Writes happen only server-side via the service role (upload route) — no public insert policy.
 *
 * Usage: pnpm tsx --env-file=.env scripts/dev/ensure-media-bucket.mts
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "media";
const options = {
  public: true,
  // Stored files are re-encoded WebP (≤ ~1 MB typical); 5 MB cap mirrors the upload limit.
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/webp", "image/jpeg", "image/png", "image/avif"],
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const existing = await supabase.storage.getBucket(BUCKET);
if (existing.data) {
  const { error } = await supabase.storage.updateBucket(BUCKET, options);
  if (error) throw error;
  console.log(`Bucket "${BUCKET}" sudah ada — opsi diperbarui.`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, options);
  if (error) throw error;
  console.log(`Bucket "${BUCKET}" dibuat.`);
}

const { data, error } = await supabase.storage.getBucket(BUCKET);
if (error) throw error;
console.log(
  JSON.stringify(
    {
      id: data.id,
      public: data.public,
      file_size_limit: data.file_size_limit,
      allowed_mime_types: data.allowed_mime_types,
    },
    null,
    2,
  ),
);
