import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { ImageProcessingError, processImage } from "../process-image";
import {
  altFromFilename,
  buildStoragePath,
  fitWithin,
  orientedSize,
  uploadAltSchema,
  validateDimensions,
  validateUploadFile,
} from "../upload-rules";
import { mediaInputSchema } from "../schema";

const MB = 1024 * 1024;

describe("validateUploadFile", () => {
  it("accepts allowed image types", () => {
    for (const type of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]) {
      expect(validateUploadFile({ type, size: 1000 })).toBeNull();
    }
  });
  it("rejects svg, unknown, empty and too large", () => {
    expect(validateUploadFile({ type: "image/svg+xml", size: 10 })).toMatch(
      /SVG/,
    );
    expect(
      validateUploadFile({ type: "image/png", size: 10, name: "x.svg" }),
    ).toMatch(/SVG/);
    expect(validateUploadFile({ type: "image/gif", size: 10 })).toMatch(
      /Format/,
    );
    expect(validateUploadFile({ type: "", size: 10 })).toMatch(/Format/);
    expect(validateUploadFile({ type: "image/png", size: 0 })).toMatch(
      /kosong/,
    );
    expect(validateUploadFile({ type: "image/png", size: 6 * MB })).toMatch(
      /melebihi/,
    );
  });
});

describe("dimensions", () => {
  it("validates limits", () => {
    expect(validateDimensions(800, 600)).toBeNull();
    expect(validateDimensions(undefined, 600)).toMatch(/tidak terbaca/);
    expect(validateDimensions(10, 600)).toMatch(/kecil/);
    expect(validateDimensions(13_000, 600)).toMatch(/besar/);
    expect(validateDimensions(10_000, 10_000)).toMatch(/besar/);
  });
  it("fits within max side without enlarging", () => {
    expect(fitWithin(4800, 2400)).toEqual({ width: 2400, height: 1200 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it("swaps for rotated EXIF orientations", () => {
    expect(orientedSize(100, 50, 6)).toEqual({ width: 50, height: 100 });
    expect(orientedSize(100, 50, 1)).toEqual({ width: 100, height: 50 });
  });
});

describe("naming", () => {
  it("builds a safe storage path accepted by mediaInputSchema", () => {
    const id = "3f2b8c1e-5d4a-4b7e-9c1d-2a3b4c5d6e7f";
    const path = buildStoragePath(id, new Date(Date.UTC(2026, 0, 5)));
    expect(path).toBe(`uploads/2026/01/${id}.webp`);
    expect(
      mediaInputSchema.safeParse({
        storagePath: path,
        url: "https://x.supabase.co/a.webp",
        alt: "Tempe",
      }).success,
    ).toBe(true);
    expect(() => buildStoragePath("../etc/passwd")).toThrow();
  });
  it("suggests alt from filename", () => {
    expect(altFromFilename("foto-tempe_goreng.JPG")).toBe("foto tempe goreng");
  });
  it("requires alt (pesan ID)", () => {
    const r = uploadAltSchema.safeParse({ alt: "   " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Teks alt wajib diisi");
  });
});

async function synth(
  width: number,
  height: number,
  format: "png" | "jpeg" | "webp",
  orientation?: number,
) {
  let img = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 150, b: 80 },
    },
  });
  if (orientation) img = img.withMetadata({ orientation });
  return img.toFormat(format).toBuffer();
}

describe("processImage (sharp)", () => {
  it("resizes large images to ≤2400 px WebP with LQIP", async () => {
    const out = await processImage(await synth(3000, 1500, "jpeg"));
    expect(out.mime).toBe("image/webp");
    expect(out.sourceMime).toBe("image/jpeg");
    expect(out.width).toBe(2400);
    expect(out.height).toBe(1200);
    expect(out.blurDataUrl.startsWith("data:image/webp;base64,")).toBe(true);
    expect(out.blurDataUrl.length).toBeLessThan(4000);
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
  });

  it("keeps small images and applies EXIF rotation", async () => {
    const out = await processImage(await synth(200, 100, "jpeg", 6));
    expect(out).toMatchObject({ width: 100, height: 200 });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.orientation ?? 1).toBe(1);
  });

  it("accepts png and webp", async () => {
    expect((await processImage(await synth(64, 64, "png"))).sourceMime).toBe(
      "image/png",
    );
    expect((await processImage(await synth(64, 64, "webp"))).sourceMime).toBe(
      "image/webp",
    );
  });

  it("rejects non-images, SVG and too-small images by content", async () => {
    await expect(
      processImage(Buffer.from("not an image at all")),
    ).rejects.toBeInstanceOf(ImageProcessingError);
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script/></svg>',
    );
    await expect(processImage(svg)).rejects.toThrow(
      /Format tidak didukung|bukan gambar/,
    );
    await expect(processImage(await synth(8, 8, "png"))).rejects.toThrow(
      /kecil/,
    );
  });

  it("rejects GIF even with an image extension", async () => {
    const gif = await sharp({
      create: { width: 32, height: 32, channels: 3, background: "#fff" },
    })
      .gif()
      .toBuffer();
    await expect(processImage(gif)).rejects.toThrow(/Format tidak didukung/);
  });
});
