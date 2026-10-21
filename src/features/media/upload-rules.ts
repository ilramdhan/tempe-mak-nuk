/**
 * Pure upload rules shared by the upload route, the media library UI and the MediaPicker
 * (client-safe: no server imports). P5.8.
 */
import { z } from "zod";

import { requiredText } from "@/features/_shared/schema";

import { MEDIA_MAX_BYTES, MEDIA_MIME_TYPES } from "./schema";

export const MEDIA_BUCKET = "media";
/** Accepted upload MIME types (SVG deliberately excluded: script/XSS vector). */
export const UPLOAD_MIME_TYPES = MEDIA_MIME_TYPES;
export const UPLOAD_MAX_BYTES = MEDIA_MAX_BYTES;
/** `accept` attribute for <input type="file">. */
export const UPLOAD_ACCEPT = UPLOAD_MIME_TYPES.join(",");
/** Longest side of the stored WebP. */
export const OUTPUT_MAX_SIDE = 2400;
/** Input dimension limits (decoded pixels). */
export const INPUT_MIN_SIDE = 16;
export const INPUT_MAX_SIDE = 12_000;
export const INPUT_MAX_PIXELS = 50_000_000;

export type UploadMime = (typeof UPLOAD_MIME_TYPES)[number];

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function isUploadMime(type: string): type is UploadMime {
  return (UPLOAD_MIME_TYPES as readonly string[]).includes(type.toLowerCase());
}

/** Check declared type + size (cheap; done on the client and again on the server). */
export function validateUploadFile(file: { type: string; size: number; name?: string }): string | null {
  const type = (file.type || "").toLowerCase();
  if (type === "image/svg+xml" || /\.svg$/i.test(file.name ?? "")) return "Berkas SVG tidak diizinkan.";
  if (!isUploadMime(type)) return "Format tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.";
  if (file.size <= 0) return "Berkas kosong.";
  if (file.size > UPLOAD_MAX_BYTES) {
    return `Ukuran berkas ${formatBytes(file.size)} melebihi batas ${formatBytes(UPLOAD_MAX_BYTES)}.`;
  }
  return null;
}

/** Check decoded dimensions (after sharp reads the header). */
export function validateDimensions(width: number | undefined, height: number | undefined): string | null {
  if (!width || !height) return "Dimensi gambar tidak terbaca.";
  if (width < INPUT_MIN_SIDE || height < INPUT_MIN_SIDE) {
    return `Gambar terlalu kecil (minimal ${INPUT_MIN_SIDE}×${INPUT_MIN_SIDE} px).`;
  }
  if (width > INPUT_MAX_SIDE || height > INPUT_MAX_SIDE || width * height > INPUT_MAX_PIXELS) {
    return `Gambar terlalu besar (maksimal ${INPUT_MAX_SIDE} px per sisi / ${INPUT_MAX_PIXELS / 1_000_000} MP).`;
  }
  return null;
}

/** Fit (w,h) inside a `max`×`max` box without enlarging. */
export function fitWithin(width: number, height: number, max = OUTPUT_MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** EXIF orientations 5–8 swap width/height after auto-rotate. */
export function orientedSize(width: number, height: number, orientation?: number) {
  return orientation && orientation >= 5 ? { width: height, height: width } : { width, height };
}

/**
 * Safe, unguessable storage path `uploads/YYYY/MM/<uuid>.webp` (never derived from the
 * user's filename). Matches `mediaInputSchema.storagePath`.
 */
export function buildStoragePath(id: string, date = new Date()): string {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("invalid id");
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${y}/${m}/${id.toLowerCase()}.webp`;
}

/** Suggest alt text from a filename ("foto-tempe_goreng.jpg" → "foto tempe goreng"). */
export function altFromFilename(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export const uploadAltSchema = z.object({ alt: requiredText(300, "Teks alt") });
