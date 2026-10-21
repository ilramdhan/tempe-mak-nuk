import { getProductBySlug, getProductSlugs } from "@/features/products/queries";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Produk Tempe Mak Nuk";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  try {
    const rows = await getProductSlugs();
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
  const item = await getProductBySlug(slug).catch(() => null);
  return renderOg({
    eyebrow: "Produk",
    title: item?.name ?? "Produk",
    subtitle: item?.short ?? null,
    coverUrl: item?.cover?.url ?? null,
  });
}
