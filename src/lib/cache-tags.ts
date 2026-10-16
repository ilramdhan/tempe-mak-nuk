/**
 * Central registry of cache tags used by `cacheTag()` in features/*\/queries.ts and by
 * `updateTag()` / `revalidateTag()` in Server Actions and route handlers.
 * Keep tags short (Next limit: 256 chars) and never build them from untrusted input
 * without going through these helpers.
 */
export const tags = {
  settings: "settings",
  pages: "pages",
  page: (slug: string) => `page:${slug}`,
  redirects: "redirects",
  nav: "nav",
  announcements: "announcements",
  products: "products",
  product: (slug: string) => `product:${slug}`,
  /** Shapes, sizes and their links (order builder options). */
  productOptions: "product-options",
  posts: "posts",
  post: (slug: string) => `post:${slug}`,
  recipes: "recipes",
  recipe: (slug: string) => `recipe:${slug}`,
  categories: "categories",
  tags: "tags",
  faqs: "faqs",
  testimonials: "testimonials",
  slots: "slots",
  legal: "legal",
  legalDoc: (slug: string) => `legal:${slug}`,
  media: "media",
  mediaItem: (id: string) => `media:${id}`,
} as const;

export type CacheTag = string;
