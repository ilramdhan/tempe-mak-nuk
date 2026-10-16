"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { testimonials } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { applyOrder } from "@/features/_shared/reorder";
import { reorderSchema, uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { testimonialInputSchema, type TestimonialInput } from "./schema";

export async function createTestimonial(input: TestimonialInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: testimonialInputSchema,
    input,
    entity: "testimonials",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(testimonials).values(data).returning({ id: testimonials.id });
      return { result: row, entityId: row.id, tags: [tags.testimonials] };
    },
  });
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<ActionResult> {
  return adminAction({
    schema: testimonialInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "testimonials",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx.update(testimonials).set(data).where(eq(testimonials.id, id)).returning({ id: testimonials.id });
      if (!rows.length) return fail("Testimoni tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.testimonials] };
    },
  });
}

/** Toggle `visible` / `verified` quickly from the list. */
export async function setTestimonialFlags(id: string, flags: { visible?: boolean; verified?: boolean }): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema, visible: z.boolean().optional(), verified: z.boolean().optional() }),
    input: { id, ...flags },
    entity: "testimonials",
    action: "update",
    run: async ({ id, ...set }, { tx }) => {
      if (set.visible === undefined && set.verified === undefined) return fail("Tidak ada perubahan.");
      const rows = await tx.update(testimonials).set(set).where(eq(testimonials.id, id)).returning({ id: testimonials.id });
      if (!rows.length) return fail("Testimoni tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.testimonials] };
    },
  });
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "testimonials",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(testimonials).where(eq(testimonials.id, id)).returning({ name: testimonials.name });
      if (!row) return fail("Testimoni tidak ditemukan.");
      return { result: undefined, entityId: id, diff: row, tags: [tags.testimonials] };
    },
  });
}

export async function reorderTestimonials(ids: string[]): Promise<ActionResult> {
  return adminAction({
    schema: reorderSchema,
    input: { ids },
    entity: "testimonials",
    action: "reorder",
    run: async ({ ids }, { tx }) => {
      await applyOrder(tx, testimonials, testimonials.id, testimonials.sort, ids);
      return { result: undefined, tags: [tags.testimonials] };
    },
  });
}
