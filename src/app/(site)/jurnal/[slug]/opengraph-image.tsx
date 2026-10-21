import { getPostBySlug, getPostSlugs } from "@/features/posts/queries";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Artikel jurnal Tempe Mak Nuk";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  try {
    const rows = await getPostSlugs();
    if (rows.length > 0) return rows.map(({ slug }) => ({ slug }));
  } catch {}
  return [{ slug: "_" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPostBySlug(slug).catch(() => null);
  return renderOg({
    eyebrow: "Jurnal",
    title: item?.title ?? "Jurnal",
    subtitle: item?.excerpt ?? null,
    coverUrl: item?.cover?.url ?? null,
  });
}
