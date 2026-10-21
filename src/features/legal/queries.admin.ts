import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { legalDocuments } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function listLegalDocumentsForAdmin() {
  await requireRole("owner", { onFail: "redirect" });
  return getDb()
    .select()
    .from(legalDocuments)
    .orderBy(asc(legalDocuments.slug), desc(legalDocuments.version));
}

export async function getLegalDocumentForAdmin(id: string) {
  await requireRole("owner", { onFail: "redirect" });
  const [row] = await getDb()
    .select()
    .from(legalDocuments)
    .where(eq(legalDocuments.id, id))
    .limit(1);
  return row ?? null;
}
