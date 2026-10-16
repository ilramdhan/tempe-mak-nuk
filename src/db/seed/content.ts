import { eq, sql } from "drizzle-orm";

import { categories, postTags, posts, recipes, tags } from "../schema";
import { POSTS } from "./posts-data";
import { RECIPES } from "./recipes-data";
import { doc, readingMinutes, type Tx } from "./rich";

const POST_CATS = [
  ["tips-tempe", "Tips Tempe", "Panduan memilih, menyimpan, dan mengolah tempe."],
  ["gizi-tempe", "Gizi Tempe", "Gizi tempe dengan rujukan sumber resmi, tanpa klaim medis."],
  ["cerita-dapur", "Cerita Dapur", "Proses, sejarah, dan cerita dari dapur Mak Nuk."],
  ["katering", "Katering", "Ide dan panduan untuk katering, restoran, dan acara."],
] as const;
const RECIPE_CATS = [
  ["gorengan", "Gorengan", "Camilan dan lauk yang digoreng."],
  ["lauk-nasi", "Lauk Nasi", "Lauk harian dan nasi kotak."],
  ["mpasi", "MPASI", "Olahan lembut untuk MPASI (informasi umum)."],
] as const;
const RECIPE_CAT_OF: Record<string, string> = {
  "tempe-mendoan": "gorengan",
  "tempe-bacem": "lauk-nasi",
  "orek-tempe-kering": "lauk-nasi",
  "sambal-goreng-tempe": "lauk-nasi",
  "tim-tempe-mpasi": "mpasi",
  "tempe-penyet": "lauk-nasi",
};
const titleCase = (s: string) =>
  s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export async function seedContent(tx: Tx, productIds: Record<string, string>) {
  // categories (post + recipe). FAQ categories are seeded in faqs.ts.
  const catRows = [
    ...POST_CATS.map(([slug, name, description], sort) => ({ kind: "post" as const, slug, name, description, sort })),
    ...RECIPE_CATS.map(([slug, name, description], sort) => ({ kind: "recipe" as const, slug, name, description, sort })),
  ];
  const cats = await tx
    .insert(categories)
    .values(catRows)
    .onConflictDoUpdate({
      target: [categories.kind, categories.slug],
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        sort: sql`excluded.sort`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: categories.id, kind: categories.kind, slug: categories.slug });
  const catId = (kind: string, slug: string) =>
    cats.find((c) => c.kind === kind && c.slug === slug)!.id;

  const tagSlugs = [...new Set(POSTS.flatMap((p) => p.tags))];
  const tagRows = await tx
    .insert(tags)
    .values(tagSlugs.map((slug) => ({ slug, name: titleCase(slug) })))
    .onConflictDoUpdate({ target: tags.slug, set: { name: sql`excluded.name`, updatedAt: sql`now()` } })
    .returning({ id: tags.id, slug: tags.slug });

  let published = 0;
  for (const p of POSTS) {
    const isPub = p.status === "published";
    if (isPub) published++;
    const publishedAt = isPub
      ? new Date(Date.now() - (p.daysAgo ?? 0) * 86_400_000)
      : null;
    const base = {
      title: p.title,
      excerpt: p.excerpt,
      content: doc(p.blocks),
      categoryId: catId("post", p.category),
      status: p.status,
      readingMinutes: readingMinutes(p.blocks),
      seo: { title: p.seoTitle, description: p.seoDescription },
    };
    const [row] = await tx
      .insert(posts)
      .values({ slug: p.slug, publishedAt, ...base })
      .onConflictDoUpdate({
        target: posts.slug,
        // keep the original publish date on re-runs so the seed stays stable
        set: { ...base, updatedAt: sql`now()` },
      })
      .returning({ id: posts.id });
    await tx.delete(postTags).where(eq(postTags.postId, row.id));
    await tx.insert(postTags).values(
      p.tags.map((t) => ({ postId: row.id, tagId: tagRows.find((r) => r.slug === t)!.id })),
    );
  }

  for (const [i, r] of RECIPES.entries()) {
    const content = doc([...r.intro, "## Tips", ...r.tips.map((t) => `- ${t}`)]);
    const base = {
      title: r.title,
      excerpt: r.excerpt,
      content,
      ingredients: r.ingredients,
      steps: r.steps.map((text) => ({ text })),
      prepMinutes: r.prep,
      cookMinutes: r.cook,
      servings: r.servings,
      difficulty: r.difficulty,
      productId: productIds[r.product],
      categoryId: catId("recipe", RECIPE_CAT_OF[r.slug]),
      status: "published" as const,
      seo: { title: r.seoTitle, description: r.seoDescription },
    };
    await tx
      .insert(recipes)
      .values({ slug: r.slug, publishedAt: new Date(Date.now() - (i + 1) * 3 * 86_400_000), ...base })
      .onConflictDoUpdate({ target: recipes.slug, set: { ...base, updatedAt: sql`now()` } });
  }
  return { categories: catRows.length, tags: tagRows.length, posts: POSTS.length, postsPublished: published, recipes: RECIPES.length };
}
