import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { categories, faqs } from "@/db/schema";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  showOnHome: boolean;
  sort: number;
  category: { slug: string; name: string; sort: number } | null;
};

export type FaqGroup = {
  slug: string | null;
  name: string;
  items: PublicFaq[];
};

/** All visible FAQs, ordered by category sort then FAQ sort. */
export async function getFaqs(): Promise<PublicFaq[]> {
  "use cache";
  cacheTag(tags.faqs, tags.categories);
  return cachedRead("faqs", "days", [], async (db) => {
    const rows = await db
      .select({
        id: faqs.id,
        question: faqs.question,
        answer: faqs.answer,
        showOnHome: faqs.showOnHome,
        sort: faqs.sort,
        catSlug: categories.slug,
        catName: categories.name,
        catSort: categories.sort,
      })
      .from(faqs)
      .leftJoin(
        categories,
        and(eq(categories.id, faqs.categoryId), eq(categories.kind, "faq")),
      )
      .where(eq(faqs.visible, true))
      .orderBy(asc(categories.sort), asc(faqs.sort));
    return rows.map(({ catSlug, catName, catSort, ...f }) => ({
      ...f,
      category: catSlug
        ? { slug: catSlug, name: catName!, sort: catSort! }
        : null,
    }));
  });
}

export type FaqQuery = {
  source?: "home" | "all" | null;
  category?: string | null;
  ids?: readonly string[] | null;
  limit?: number | null;
};

/** Filter FAQs for blocks / pages. Precedence: ids → category → source (home|all). */
export async function queryFaqs(q: FaqQuery = {}): Promise<PublicFaq[]> {
  const all = await getFaqs();
  let list: PublicFaq[];
  if (q.ids?.length) {
    const byId = new Map(all.map((f) => [f.id, f]));
    list = q.ids
      .map((id) => byId.get(id))
      .filter((f): f is PublicFaq => Boolean(f));
  } else if (q.category)
    list = all.filter((f) => f.category?.slug === q.category);
  else if (q.source === "home") list = all.filter((f) => f.showOnHome);
  else list = all;
  return q.limit ? list.slice(0, q.limit) : list;
}

export function groupFaqs(list: readonly PublicFaq[]): FaqGroup[] {
  const groups = new Map<string, FaqGroup>();
  for (const f of list) {
    const key = f.category?.slug ?? "_";
    let g = groups.get(key);
    if (!g) {
      g = {
        slug: f.category?.slug ?? null,
        name: f.category?.name ?? "Lainnya",
        items: [],
      };
      groups.set(key, g);
    }
    g.items.push(f);
  }
  return [...groups.values()];
}

/** For FAQPage JSON-LD: strip light markdown to plain text. */
export function faqAnswerPlainText(answer: string): string {
  return answer
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .trim();
}

/** FAQs shown on a product page: the "produk" + "penyimpanan" categories (faqs have no product link). */
export async function getProductFaqs(limit = 6): Promise<PublicFaq[]> {
  const all = await getFaqs();
  return all
    .filter(
      (f) =>
        f.category?.slug === "produk" || f.category?.slug === "penyimpanan",
    )
    .slice(0, limit);
}
