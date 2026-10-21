import { tags } from "@/lib/cache-tags";

/** Cache tags of the content lists that embed a media item, keyed by `getMediaUsage` kind. */
const TAGS_BY_KIND: Record<string, string[]> = {
  Produk: [tags.products],
  Jurnal: [tags.posts],
  Resep: [tags.recipes],
  Testimoni: [tags.testimonials],
  Halaman: [tags.pages],
  Legal: [tags.legal],
  Pengaturan: [tags.settings],
};

/** Pure: media tags + tags of every entity kind that uses the media. */
export function tagsForMediaUsage(
  id: string,
  usage: readonly { kind: string }[],
): string[] {
  const out = new Set<string>([tags.media, tags.mediaItem(id)]);
  for (const u of usage) for (const t of TAGS_BY_KIND[u.kind] ?? []) out.add(t);
  return [...out];
}
