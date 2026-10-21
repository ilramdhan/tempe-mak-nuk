import type { MetadataRoute } from "next";

import { LEGAL_ROUTES } from "@/features/legal/schema";
import { listLegalForSitemap } from "@/features/legal/queries";
import { listCmsPagesForSitemap } from "@/features/pages/queries";
import { listPostsForSitemap } from "@/features/posts/queries";
import { listProductsForSitemap } from "@/features/products/queries";
import { listRecipesForSitemap } from "@/features/recipes/queries";
import { getSettings } from "@/features/settings/queries";
import { getCategories } from "@/features/taxonomy/queries";

/** Static public routes. /admin, /api, /dev, /auth, /login are excluded; /custom-order is a conversion page so it is included. */
const STATIC_ROUTES = [
  "/",
  "/produk",
  "/custom-order",
  "/cara-pesan",
  "/kemitraan",
  "/proses",
  "/manfaat-tempe",
  "/halal-kualitas",
  "/tentang",
  "/resep",
  "/jurnal",
  "/faq",
  "/kontak",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    settings["site.url"] ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
  const abs = (p: string) => (p === "/" ? base : `${base}${p}`);

  const [products0, posts0, recipes0, postCats, legal, cms] = await Promise.all(
    [
      listProductsForSitemap(),
      listPostsForSitemap(),
      listRecipesForSitemap(),
      getCategories("post"),
      listLegalForSitemap(),
      listCmsPagesForSitemap(),
    ],
  );
  const indexable = <T extends { noindex: boolean }>(xs: T[]) =>
    xs.filter((x) => !x.noindex);
  const products = indexable(products0);
  const posts = indexable(posts0);
  const recipes = indexable(recipes0);

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((p) => ({
    url: abs(p),
    changeFrequency: p === "/" || p === "/jurnal" ? "weekly" : "monthly",
    priority: p === "/" ? 1 : 0.7,
  }));
  for (const x of legal)
    entries.push({
      url: abs(LEGAL_ROUTES[x.slug]),
      lastModified: x.updatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    });
  for (const x of indexable(cms))
    entries.push({
      url: abs(`/${x.slug}`),
      lastModified: x.updatedAt,
      priority: 0.5,
    });
  for (const x of products)
    entries.push({
      url: abs(`/produk/${x.slug}`),
      lastModified: x.updatedAt,
      priority: 0.9,
    });
  for (const x of posts)
    entries.push({
      url: abs(`/jurnal/${x.slug}`),
      lastModified: x.updatedAt,
      priority: 0.6,
    });
  for (const x of recipes)
    entries.push({
      url: abs(`/resep/${x.slug}`),
      lastModified: x.updatedAt,
      priority: 0.6,
    });
  for (const c of postCats)
    entries.push({ url: abs(`/jurnal/kategori/${c.slug}`), priority: 0.4 });
  return entries;
}
