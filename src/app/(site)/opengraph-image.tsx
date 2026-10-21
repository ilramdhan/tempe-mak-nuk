import { getSettings } from "@/features/settings/queries";
import { OG_CONTENT_TYPE, OG_SIZE, OG_TAGLINE, renderOg } from "@/lib/og";

export const alt = "Tempe Mak Nuk — Tiga bahan, tanpa jalan pintas.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  let name = "Tempe Mak Nuk";
  try {
    name = (await getSettings())["business.name"] || name;
  } catch {}
  return renderOg({
    eyebrow: "Tempe artisan",
    title: name,
    subtitle: OG_TAGLINE,
  });
}
