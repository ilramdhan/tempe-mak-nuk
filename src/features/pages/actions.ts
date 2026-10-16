"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { pages, pageSections, redirects } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { applyOrder } from "@/features/_shared/reorder";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { blockSchema, pageSectionInputSchema, type BlockInput, type PageSectionInput } from "./blocks/schema";
import {
  pageInputSchema,
  redirectInputSchema,
  sectionReorderSchema,
  sectionVisibilitySchema,
  type PageInput,
  type RedirectInput,
} from "./schema";

const idSchema = z.object({ id: uuidSchema });

// ── Pages ────────────────────────────────────────────────────────────────
export async function createPage(input: PageInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: pageInputSchema,
    input,
    entity: "pages",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(pages).values(data).returning({ id: pages.id });
      return { result: row, entityId: row.id, tags: [tags.pages, tags.page(data.slug)] };
    },
  });
}

export async function updatePage(id: string, input: PageInput): Promise<ActionResult> {
  return adminAction({
    schema: pageInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "pages",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const [prev] = await tx.select({ slug: pages.slug }).from(pages).where(eq(pages.id, id)).limit(1);
      if (!prev) return fail("Halaman tidak ditemukan.");
      await tx.update(pages).set(data).where(eq(pages.id, id));
      return { result: undefined, entityId: id, tags: [tags.pages, tags.page(prev.slug), tags.page(data.slug)] };
    },
  });
}

export async function deletePage(id: string): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: idSchema,
    input: { id },
    entity: "pages",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(pages).where(eq(pages.id, id)).returning({ slug: pages.slug });
      if (!row) return fail("Halaman tidak ditemukan.");
      return { result: undefined, entityId: id, diff: row, tags: [tags.pages, tags.page(row.slug)] };
    },
  });
}

// ── Sections ─────────────────────────────────────────────────────────────

export async function createSection(input: PageSectionInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: pageSectionInputSchema,
    input,
    entity: "page_sections",
    action: "create",
    run: async (data, { tx }) => {
      const [page] = await tx.select({ slug: pages.slug }).from(pages).where(eq(pages.id, data.pageId)).limit(1);
      if (!page) return fail("Halaman tidak ditemukan.");
      const [row] = await tx
        .insert(pageSections)
        .values({ pageId: data.pageId, type: data.type, data: data.data as Record<string, unknown>, sort: data.sort, visible: data.visible })
        .returning({ id: pageSections.id });
      return { result: row, entityId: row.id, tags: [tags.page(page.slug)] };
    },
  });
}

/** Replace a section's block (type + data). */
export async function updateSection(id: string, block: BlockInput): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ id: uuidSchema }).and(blockSchema),
    input: { ...block, id },
    entity: "page_sections",
    action: "update",
    run: async ({ id, type, data }, { tx }) => {
      const [row] = await tx
        .update(pageSections)
        .set({ type, data: data as Record<string, unknown> })
        .where(eq(pageSections.id, id))
        .returning({ pageId: pageSections.pageId });
      if (!row) return fail("Section tidak ditemukan.");
      const [page] = await tx.select({ slug: pages.slug }).from(pages).where(eq(pages.id, row.pageId)).limit(1);
      return { result: undefined, entityId: id, tags: [page && tags.page(page.slug)] };
    },
  });
}

export async function setSectionVisibility(id: string, visible: boolean): Promise<ActionResult> {
  return adminAction({
    schema: sectionVisibilitySchema,
    input: { id, visible },
    entity: "page_sections",
    action: "update",
    run: async ({ id, visible }, { tx }) => {
      const [row] = await tx.update(pageSections).set({ visible }).where(eq(pageSections.id, id)).returning({ pageId: pageSections.pageId });
      if (!row) return fail("Section tidak ditemukan.");
      const [page] = await tx.select({ slug: pages.slug }).from(pages).where(eq(pages.id, row.pageId)).limit(1);
      return { result: undefined, entityId: id, tags: [page && tags.page(page.slug)] };
    },
  });
}

export async function deleteSection(id: string): Promise<ActionResult> {
  return adminAction({
    schema: idSchema,
    input: { id },
    entity: "page_sections",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(pageSections).where(eq(pageSections.id, id)).returning({ pageId: pageSections.pageId, type: pageSections.type, data: pageSections.data });
      if (!row) return fail("Section tidak ditemukan.");
      const [page] = await tx.select({ slug: pages.slug }).from(pages).where(eq(pages.id, row.pageId)).limit(1);
      return { result: undefined, entityId: id, diff: { type: row.type, data: row.data }, tags: [page && tags.page(page.slug)] };
    },
  });
}

export async function reorderSections(pageId: string, ids: string[]): Promise<ActionResult> {
  return adminAction({
    schema: sectionReorderSchema,
    input: { pageId, ids },
    entity: "page_sections",
    action: "reorder",
    run: async ({ pageId, ids }, { tx }) => {
      const [page] = await tx.select({ slug: pages.slug }).from(pages).where(eq(pages.id, pageId)).limit(1);
      if (!page) return fail("Halaman tidak ditemukan.");
      await applyOrder(tx, pageSections, pageSections.id, pageSections.sort, ids, and(sql`page_id = ${pageId}::uuid`));
      return { result: undefined, entityId: pageId, tags: [tags.page(page.slug)] };
    },
  });
}

// ── Redirects ────────────────────────────────────────────────────────────
export async function upsertRedirect(input: RedirectInput): Promise<ActionResult> {
  return adminAction({
    schema: redirectInputSchema,
    input,
    entity: "redirects",
    action: "update",
    run: async (data, { tx }) => {
      await tx.insert(redirects).values(data).onConflictDoUpdate({ target: redirects.from, set: { to: data.to, permanent: data.permanent } });
      return { result: undefined, entityId: data.from, tags: [tags.redirects] };
    },
  });
}

export async function deleteRedirect(id: string): Promise<ActionResult> {
  return adminAction({
    schema: idSchema,
    input: { id },
    entity: "redirects",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const rows = await tx.delete(redirects).where(eq(redirects.id, id)).returning({ id: redirects.id });
      if (!rows.length) return fail("Redirect tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.redirects] };
    },
  });
}
