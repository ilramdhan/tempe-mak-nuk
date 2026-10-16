import "server-only";

import { SETTING_KEY_LIST } from "@/db/schema/settings";
import { BLOCK_TYPES, type BlockType } from "@/features/pages/blocks";
import { listFaqsForAdmin } from "@/features/faqs/queries.admin";
import { listMediaForAdmin } from "@/features/media/queries.admin";
import {
  getPageForAdmin,
  listPagesForAdmin,
} from "@/features/pages/queries.admin";
import { listPostsForAdmin } from "@/features/posts/queries.admin";
import { listProductsForAdmin } from "@/features/products/queries.admin";
import { listRecipesForAdmin } from "@/features/recipes/queries.admin";
import { listCategoriesForAdmin } from "@/features/taxonomy/queries.admin";
import { listTestimonialsForAdmin } from "@/features/testimonials/queries.admin";

import type {
  BuilderOptions,
  EditorPage,
  PageListItem,
} from "../_components/types";

const isBlockType = (t: string): t is BlockType =>
  (BLOCK_TYPES as string[]).includes(t);
const clip = (s: string, n = 80) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/** Run a loader, falling back to `[]` (e.g. no DB in CI builds). */
async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[admin/halaman] ${label} failed:`, error);
    return [];
  }
}

export async function loadPageList(): Promise<PageListItem[]> {
  const pages = await safe("pages", listPagesForAdmin);
  const details = await Promise.all(
    pages.map((p) => getPageForAdmin(p.id).catch(() => null)),
  );
  return pages.map((p, i) => {
    const sections = details[i]?.sections ?? [];
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      updatedAt: p.updatedAt.toISOString(),
      sectionCount: sections.length,
      hiddenCount: sections.filter((s) => !s.visible).length,
      invalidCount: sections.filter((s) => !s.valid).length,
    };
  });
}

export async function loadEditorPage(id: string): Promise<EditorPage | null> {
  const page = await getPageForAdmin(id);
  if (!page) return null;
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
    seo: page.seo ?? {},
    updatedAt: page.updatedAt.toISOString(),
    sections: page.sections.map((s) => ({
      key: s.id,
      id: s.id,
      // Unknown types can't be edited by a form → shown as richText-less invalid entry.
      type: isBlockType(s.type) ? s.type : "richText",
      data: (s.data ?? {}) as Record<string, unknown>,
      visible: s.visible,
      issues: isBlockType(s.type)
        ? s.issues
        : [`Tipe blok tidak dikenal: ${s.type}`],
    })),
  };
}

export async function loadBuilderOptions(): Promise<BuilderOptions> {
  const [media, products, recipes, posts, categories, faqs, testimonials] =
    await Promise.all([
      safe("media", () => listMediaForAdmin({ limit: 200 })),
      safe("products", listProductsForAdmin),
      safe("recipes", () => listRecipesForAdmin()),
      safe("posts", () => listPostsForAdmin()),
      safe("categories", () => listCategoriesForAdmin()),
      safe("faqs", listFaqsForAdmin),
      safe("testimonials", listTestimonialsForAdmin),
    ]);
  return {
    media: media.map((m) => ({ id: m.id, url: m.url, alt: m.alt })),
    products: products.map((p) => ({
      value: p.slug,
      label: `${p.name}${p.isActive ? "" : " (nonaktif)"}`,
    })),
    recipes: recipes.map((r) => ({
      value: r.slug,
      label: `${r.title}${r.status === "published" ? "" : ` (${r.status})`}`,
    })),
    posts: posts.map((p) => ({
      value: p.slug,
      label: `${p.title}${p.status === "published" ? "" : ` (${p.status})`}`,
    })),
    faqCategories: categories
      .filter((c) => c.kind === "faq")
      .map((c) => ({ value: c.slug, label: c.name })),
    postCategories: categories
      .filter((c) => c.kind === "post")
      .map((c) => ({ value: c.slug, label: c.name })),
    faqs: faqs.map((f) => ({
      value: f.id,
      label: clip(f.question) + (f.visible ? "" : " (tersembunyi)"),
    })),
    testimonials: testimonials.map((t) => ({
      value: t.id,
      label: `${t.name}: “${clip(t.quote, 50)}”${t.isPlaceholder ? " (contoh)" : ""}`,
    })),
    settingKeys: SETTING_KEY_LIST.map((k) => ({ value: k, label: k })),
  };
}
