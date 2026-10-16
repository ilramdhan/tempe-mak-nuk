import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { legalDocuments } from "@/db/schema";

export async function listLegalDocumentsForAdmin() {
  return getDb().select().from(legalDocuments).orderBy(asc(legalDocuments.slug), desc(legalDocuments.version));
}

export async function getLegalDocumentForAdmin(id: string) {
  const [row] = await getDb().select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
  return row ?? null;
}
