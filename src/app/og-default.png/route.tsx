import Image from "../(site)/opengraph-image";

/**
 * Stable URL for the global OG image. The `opengraph-image` file route gets a hashed path,
 * so pages without their own OG file point here via `buildMetadata` (DEFAULT_OG_IMAGE).
 * Outside /api so robots.txt does not block social crawlers.
 */
export async function GET() {
  return Image();
}
