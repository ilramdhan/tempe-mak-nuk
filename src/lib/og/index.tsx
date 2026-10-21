import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { getSettings } from "@/features/settings/queries";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

/** Tagline hero terkunci (PROMPT.md §6). */
export const OG_TAGLINE = "Tiga bahan, tanpa jalan pintas.";

const C = {
  paper: "#FAF7F2",
  surface: "#F1EBDF",
  ink: "#1E1B16",
  muted: "#6B6458",
  leaf: "#2F4A2C",
  gold: "#B7792B",
  goldStrong: "#8F5A1A",
};

async function loadFont() {
  try {
    return await readFile(
      path.join(process.cwd(), "src/lib/og/fonts/fraunces-600.woff"),
    );
  } catch {
    return null;
  }
}

/** Cover box rendered at 340×340 in the card → 2× for crispness. */
const COVER_PX = 680;
/** Raster types accepted from storage; uploads are WebP since P5.8 (satori itself only takes png/jpeg). */
const COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * Fetch cover and re-encode to a square JPEG data URI via sharp (WebP/AVIF → JPEG, so satori can
 * draw it; also shrinks the payload). Node runtime only. Null on any failure.
 */
async function loadCover(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!COVER_TYPES.has(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 3_000_000) return null;
    const { default: sharp } = await import("sharp");
    const jpeg = await sharp(buf, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(COVER_PX, COVER_PX, { fit: "cover" })
      .flatten({ background: C.paper })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

async function brandName(): Promise<string> {
  try {
    return (await getSettings())["business.name"] || "Tempe Mak Nuk";
  } catch {
    return "Tempe Mak Nuk";
  }
}

export type OgInput = {
  /** Eyebrow, mis. "Produk", "Jurnal", "Resep". */
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  coverUrl?: string | null;
};

export async function renderOg({
  eyebrow,
  title,
  subtitle,
  coverUrl,
}: OgInput): Promise<ImageResponse> {
  const [name, fontData, cover] = await Promise.all([
    brandName(),
    loadFont(),
    loadCover(coverUrl),
  ]);
  const display = fontData ? "Fraunces" : "Geist";
  const t = truncate(title, cover ? 70 : 90);
  const size = t.length > 60 ? 54 : t.length > 36 ? 64 : 76;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: C.paper,
        color: C.ink,
        fontFamily: "Geist",
        position: "relative",
      }}
    >
      {/* tekstur ringan: pita kedelai + garis ragi */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 16,
          background: C.leaf,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 0,
          bottom: 0,
          width: 4,
          background: C.gold,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120,
          bottom: -160,
          width: 420,
          height: 420,
          borderRadius: 420,
          background: C.surface,
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          padding: "56px 64px 52px 84px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 8,
              background: C.leaf,
              color: C.paper,
              fontFamily: display,
              fontSize: 30,
            }}
          >
            T
          </div>
          <div
            style={{
              fontFamily: display,
              fontSize: 32,
              color: C.leaf,
              display: "flex",
            }}
          >
            {name}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 20,
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: C.goldStrong,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontFamily: display,
                fontSize: size,
                lineHeight: 1.1,
                color: C.ink,
              }}
            >
              {t}
            </div>
            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: C.muted,
                }}
              >
                {truncate(subtitle, 110)}
              </div>
            ) : null}
          </div>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              src={cover}
              width={340}
              height={340}
              style={{
                width: 340,
                height: 340,
                objectFit: "cover",
                borderRadius: 16,
                border: "6px solid #FEFCF9",
              }}
            />
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: C.muted,
          }}
        >
          <div style={{ display: "flex" }}>{OG_TAGLINE}</div>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: fontData
        ? [{ name: "Fraunces", data: fontData, weight: 600, style: "normal" }]
        : undefined,
    },
  );
}
