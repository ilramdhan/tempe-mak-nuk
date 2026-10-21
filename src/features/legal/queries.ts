import "server-only";

import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { legalDocuments, type LegalSlug } from "@/db/schema";
import type { RichTextDoc } from "@/db/schema/seo";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

export type PublicLegalDocument = {
  slug: LegalSlug;
  title: string;
  content: RichTextDoc | null;
  version: number;
  effectiveAt: Date | null;
  updatedAt: Date;
};

/** Highest published version whose effective date has passed (or is unset). */
export async function getLegalDocument(
  slug: LegalSlug,
): Promise<PublicLegalDocument | null> {
  "use cache";
  cacheTag(tags.legal, tags.legalDoc(slug));
  return cachedRead("legal", "days", null, async (db) => {
    const [row] = await db
      .select({
        slug: legalDocuments.slug,
        title: legalDocuments.title,
        content: legalDocuments.content,
        version: legalDocuments.version,
        effectiveAt: legalDocuments.effectiveAt,
        updatedAt: legalDocuments.updatedAt,
      })
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.slug, slug),
          eq(legalDocuments.status, "published"),
          or(
            isNull(legalDocuments.effectiveAt),
            lte(legalDocuments.effectiveAt, sql`now()`),
          ),
        ),
      )
      .orderBy(desc(legalDocuments.version))
      .limit(1);
    return row ?? null;
  });
}
