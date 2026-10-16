"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { legalDocuments } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { legalDocumentInputSchema, type LegalDocumentInput } from "./schema";

/** Legal texts are owner-only. Create a new version rather than editing a published one. */
export async function createLegalDocument(input: LegalDocumentInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    role: "owner",
    schema: legalDocumentInputSchema,
    input,
    entity: "legal_documents",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(legalDocuments).values(data).returning({ id: legalDocuments.id });
      return { result: row, entityId: row.id, diff: { ...data, content: undefined }, tags: [tags.legal, tags.legalDoc(data.slug)] };
    },
  });
}

export async function updateLegalDocument(id: string, input: LegalDocumentInput): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: legalDocumentInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "legal_documents",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const [prev] = await tx.select({ slug: legalDocuments.slug }).from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
      if (!prev) return fail("Dokumen tidak ditemukan.");
      await tx.update(legalDocuments).set(data).where(eq(legalDocuments.id, id));
      return {
        result: undefined,
        entityId: id,
        diff: { ...data, content: undefined },
        tags: [tags.legal, tags.legalDoc(prev.slug), tags.legalDoc(data.slug)],
      };
    },
  });
}

export async function deleteLegalDocument(id: string): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "legal_documents",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(legalDocuments).where(eq(legalDocuments.id, id)).returning({ slug: legalDocuments.slug, version: legalDocuments.version });
      if (!row) return fail("Dokumen tidak ditemukan.");
      return { result: undefined, entityId: id, diff: row, tags: [tags.legal, tags.legalDoc(row.slug)] };
    },
  });
}
