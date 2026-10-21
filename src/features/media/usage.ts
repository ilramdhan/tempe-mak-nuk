import "server-only";

import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  legalDocuments,
  pageSections,
  pages,
  posts,
  productMedia,
  products,
  recipes,
  settings,
  testimonials,
} from "@/db/schema";

export type MediaUsage = { kind: string; label: string };

/**
 * Where a media id is referenced (FK columns + JSON content: SEO OG image, rich text images,
 * recipe steps, page sections, settings). Used to warn before deleting. P5.8.
 */
export async function getMediaUsage(id: string): Promise<MediaUsage[]> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return [];
  const db = getDb();
  const like = `%${id}%`;
  const [prod, prodJson, postRows, recipeRows, testi, sections, legal, sets] = await Promise.all([
    db
      .select({ name: products.name })
      .from(productMedia)
      .innerJoin(products, eq(products.id, productMedia.productId))
      .where(eq(productMedia.mediaId, id)),
    db
      .select({ name: products.name })
      .from(products)
      .where(sql`(${products.seo}::text || coalesce(${products.description}::text, '')) like ${like}`),
    db
      .select({ title: posts.title })
      .from(posts)
      .where(
        sql`${posts.coverMediaId} = ${id} or (${posts.seo}::text || coalesce(${posts.content}::text, '')) like ${like}`,
      ),
    db
      .select({ title: recipes.title })
      .from(recipes)
      .where(
        sql`${recipes.coverMediaId} = ${id} or (${recipes.seo}::text || ${recipes.steps}::text || coalesce(${recipes.content}::text, '')) like ${like}`,
      ),
    db.select({ name: testimonials.name }).from(testimonials).where(eq(testimonials.mediaId, id)),
    db
      .select({ title: pages.title })
      .from(pages)
      .where(
        sql`${pages.seo}::text like ${like} or exists (select 1 from ${pageSections} where ${pageSections.pageId} = ${pages.id} and ${pageSections.data}::text like ${like})`,
      ),
    db
      .select({ title: legalDocuments.title })
      .from(legalDocuments)
      .where(sql`coalesce(${legalDocuments.content}::text, '') like ${like}`),
    db.select({ key: settings.key }).from(settings).where(sql`${settings.value}::text like ${like}`),
  ]);

  const out: MediaUsage[] = [];
  const seen = new Set<string>();
  const push = (kind: string, label: string) => {
    const k = `${kind}:${label}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ kind, label });
  };
  for (const r of [...prod, ...prodJson]) push("Produk", r.name);
  for (const r of postRows) push("Jurnal", r.title);
  for (const r of recipeRows) push("Resep", r.title);
  for (const r of testi) push("Testimoni", r.name);
  for (const r of sections) push("Halaman", r.title);
  for (const r of legal) push("Legal", r.title);
  for (const r of sets) push("Pengaturan", r.key);
  return out;
}
