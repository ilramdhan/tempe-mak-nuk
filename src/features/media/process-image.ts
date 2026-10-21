/**
 * sharp pipeline for uploads (P5.8). Server-only in practice (native module); kept free of the
 * `server-only` import so it can be unit-tested with synthetic buffers.
 *
 * Steps: decode header (magic bytes — the declared MIME is not trusted) → dimension limits →
 * auto-rotate by EXIF → resize to ≤ OUTPUT_MAX_SIDE → WebP (metadata stripped) + tiny LQIP.
 */
import sharp, { type Metadata } from "sharp";

import {
  OUTPUT_MAX_SIDE,
  validateDimensions,
  type UploadMime,
} from "./upload-rules";

/** sharp `format` → MIME (only formats we accept). */
const FORMAT_MIME: Record<string, UploadMime> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heif: "image/avif", // libheif reports AVIF as "heif"; compression tells which
};

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export type ProcessedImage = {
  buffer: Buffer;
  mime: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  blurDataUrl: string;
  sourceMime: UploadMime;
};

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  let meta: Metadata;
  try {
    meta = await sharp(input, {
      failOn: "error",
      limitInputPixels: 60_000_000,
    }).metadata();
  } catch {
    throw new ImageProcessingError(
      "Berkas bukan gambar yang valid atau rusak.",
    );
  }
  const sourceMime = meta.format ? FORMAT_MIME[meta.format] : undefined;
  if (!sourceMime || (meta.format === "heif" && meta.compression !== "av1")) {
    throw new ImageProcessingError(
      "Format tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.",
    );
  }
  if ((meta.pages ?? 1) > 1)
    throw new ImageProcessingError("Gambar animasi tidak didukung.");
  const dimError = validateDimensions(meta.width, meta.height);
  if (dimError) throw new ImageProcessingError(dimError);

  try {
    const base = sharp(input, { failOn: "error", limitInputPixels: 60_000_000 })
      .rotate()
      .resize({
        width: OUTPUT_MAX_SIDE,
        height: OUTPUT_MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      });

    // sharp strips metadata by default (no keepMetadata/withMetadata call).
    const { data, info } = await base
      .clone()
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const lqip = await sharp(data)
      .resize(16, 16, { fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();

    return {
      buffer: data,
      mime: "image/webp",
      width: info.width,
      height: info.height,
      sizeBytes: info.size,
      blurDataUrl: `data:image/webp;base64,${lqip.toString("base64")}`,
      sourceMime,
    };
  } catch {
    throw new ImageProcessingError("Gagal memproses gambar. Coba berkas lain.");
  }
}
