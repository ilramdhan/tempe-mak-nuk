import type { MetadataRoute } from "next";

import { getSettings } from "@/features/settings/queries";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  const name = s["business.name"] || "Tempe Mak Nuk";
  return {
    name,
    short_name: "Mak Nuk",
    description:
      "Tempe handmade dari Klaten sejak 2001. Tanpa pengawet, bersertifikat halal.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "id",
    background_color: "#FAF7F2",
    theme_color: "#2F4A2C",
    // PNGs rendered from public/brand/favicon.svg (sharp); maskable has a 10% safe-zone pad.
    icons: [
      {
        src: "/brand/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
