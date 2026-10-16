"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { faqs } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { applyOrder } from "@/features/_shared/reorder";
import { reorderSchema, uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { faqInputSchema, type FaqInput } from "./schema";

export async function createFaq(input: FaqInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: faqInputSchema,
    input,
    entity: "faqs",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(faqs).values(data).returning({ id: faqs.id });
      return { result: row, entityId: row.id, tags: [tags.faqs] };
    },
  });
}

export async function updateFaq(id: string, input: FaqInput): Promise<ActionResult> {
  return adminAction({
    schema: faqInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "faqs",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx.update(faqs).set(data).where(eq(faqs.id, id)).returning({ id: faqs.id });
      if (!rows.length) return fail("FAQ tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.faqs] };
    },
  });
}

export async function setFaqVisibility(id: string, visible: boolean): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema, visible: z.boolean() }),
    input: { id, visible },
    entity: "faqs",
    action: "update",
    run: async ({ id, visible }, { tx }) => {
      const rows = await tx.update(faqs).set({ visible }).where(eq(faqs.id, id)).returning({ id: faqs.id });
      if (!rows.length) return fail("FAQ tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.faqs] };
    },
  });
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "faqs",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(faqs).where(eq(faqs.id, id)).returning({ question: faqs.question });
      if (!row) return fail("FAQ tidak ditemukan.");
      return { result: undefined, entityId: id, diff: row, tags: [tags.faqs] };
    },
  });
}

/** Drag-and-drop order (ids in new order; typically within one category). */
export async function reorderFaqs(ids: string[]): Promise<ActionResult> {
  return adminAction({
    schema: reorderSchema,
    input: { ids },
    entity: "faqs",
    action: "reorder",
    run: async ({ ids }, { tx }) => {
      await applyOrder(tx, faqs, faqs.id, faqs.sort, ids);
      return { result: undefined, tags: [tags.faqs] };
    },
  });
}
