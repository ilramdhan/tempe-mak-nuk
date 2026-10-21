import { getRecipeBySlug, getRecipeSlugs } from "@/features/recipes/queries";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Resep Tempe Mak Nuk";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  try {
    const rows = await getRecipeSlugs();
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
  const item = await getRecipeBySlug(slug).catch(() => null);
  return renderOg({
    eyebrow: "Resep",
    title: item?.title ?? "Resep",
    subtitle: item?.excerpt ?? null,
    coverUrl: item?.cover?.url ?? null,
  });
}
