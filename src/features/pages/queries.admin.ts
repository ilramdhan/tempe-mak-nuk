import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { pages, pageSections, redirects } from "@/db/schema";

import { blockSchema } from "./blocks/schema";

export async function listPagesForAdmin() {
  return getDb().select().from(pages).orderBy(asc(pages.slug));
}

/** Page (any status) + ALL sections (incl. hidden) with validation status per section. */
export async function getPageForAdmin(id: string) {
  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return null;
  const rows = await db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.sort));
  return {
    ...page,
    sections: rows.map((s) => {
      const res = blockSchema.safeParse({ type: s.type, data: s.data });
      return { ...s, valid: res.success, issues: res.success ? [] : res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
    }),
  };
}

export async function listRedirectsForAdmin() {
  return getDb().select().from(redirects).orderBy(asc(redirects.from));
}
