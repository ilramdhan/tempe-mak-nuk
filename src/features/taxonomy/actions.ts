"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { categories, tags as tagTable, type CategoryKind } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { applyOrder } from "@/features/_shared/reorder";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import {
  categoryInputSchema,
  categoryKindSchema,
  tagInputSchema,
  type CategoryInput,
  type TagInput,
} from "./schema";

const KIND_TAGS: Record<CategoryKind, string[]> = {
  post: [tags.posts],
  recipe: [tags.recipes],
  faq: [tags.faqs],
};

export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: categoryInputSchema,
    input,
    entity: "categories",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx
        .insert(categories)
        .values(data)
        .returning({ id: categories.id });
      return {
        result: row,
        entityId: row.id,
        tags: [tags.categories, ...KIND_TAGS[data.kind]],
      };
    },
  });
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  return adminAction({
    schema: categoryInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "categories",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning({ id: categories.id });
      if (!rows.length) return fail("Kategori tidak ditemukan.");
      return {
        result: undefined,
        entityId: id,
        tags: [tags.categories, ...KIND_TAGS[data.kind]],
      };
    },
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "categories",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx
        .delete(categories)
        .where(eq(categories.id, id))
        .returning({ kind: categories.kind });
      if (!row) return fail("Kategori tidak ditemukan.");
      return {
        result: undefined,
        entityId: id,
        tags: [tags.categories, ...KIND_TAGS[row.kind]],
      };
    },
  });
}

export async function reorderCategories(
  kind: CategoryKind,
  ids: string[],
): Promise<ActionResult> {
  return adminAction({
    schema: z.object({
      kind: categoryKindSchema,
      ids: z.array(uuidSchema).min(1).max(200),
    }),
    input: { kind, ids },
    entity: "categories",
    action: "reorder",
    run: async ({ kind, ids }, { tx }) => {
      await applyOrder(
        tx,
        categories,
        categories.id,
        categories.sort,
        ids,
        and(eq(categories.kind, kind)),
      );
      return { result: undefined, tags: [tags.categories, ...KIND_TAGS[kind]] };
    },
  });
}

export async function createTag(
  input: TagInput,
): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: tagInputSchema,
    input,
    entity: "tags",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx
        .insert(tagTable)
        .values(data)
        .returning({ id: tagTable.id });
      return { result: row, entityId: row.id, tags: [tags.tags] };
    },
  });
}

export async function deleteTag(id: string): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "tags",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const rows = await tx
        .delete(tagTable)
        .where(eq(tagTable.id, id))
        .returning({ id: tagTable.id });
      if (!rows.length) return fail("Tag tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.tags, tags.posts] };
    },
  });
}
