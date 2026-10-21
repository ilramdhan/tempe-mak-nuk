"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { redirects } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { hrefSchema, uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { findRedirectLoop, normalizeFrom } from "./logic";

const saveSchema = z
  .object({
    id: uuidSchema.nullish(),
    from: z
      .string()
      .trim()
      .min(2, "Path asal wajib diisi")
      .max(300)
      .regex(
        /^\/(?!\/)[^\s?#]*$/,
        "Harus path internal diawali / (tanpa query)",
      )
      .refine(
        (v) => !v.startsWith("/admin") && !v.startsWith("/api"),
        "Path /admin dan /api tidak boleh dialihkan",
      ),
    to: hrefSchema,
    permanent: z.boolean().default(true),
  })
  .refine((v) => normalizeFrom(v.from) !== v.to, {
    path: ["to"],
    message: "Tujuan tidak boleh sama dengan asal",
  });
export type RedirectSaveInput = z.input<typeof saveSchema>;

/** Owner-only: create/update a redirect (loop-checked). */
export async function saveRedirect(
  input: RedirectSaveInput,
): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    role: "owner",
    schema: saveSchema,
    input,
    entity: "redirects",
    action: input?.id ? "update" : "create",
    run: async (data, { tx }) => {
      const from = normalizeFrom(data.from);
      const all = await tx
        .select({ id: redirects.id, from: redirects.from, to: redirects.to })
        .from(redirects);
      const others = all.filter((r) => r.id !== data.id);
      const dup = others.find((r) => normalizeFrom(r.from) === from);
      if (dup)
        return fail("Path asal sudah punya redirect.", {
          from: ["Sudah dipakai"],
        });
      const loop = findRedirectLoop(others, { from, to: data.to });
      if (loop) return fail(loop, { to: [loop] });
      const values = { from, to: data.to, permanent: data.permanent };
      if (data.id) {
        const rows = await tx
          .update(redirects)
          .set(values)
          .where(eq(redirects.id, data.id))
          .returning({ id: redirects.id });
        if (!rows.length) return fail("Redirect tidak ditemukan.");
        return {
          result: { id: rows[0].id },
          entityId: rows[0].id,
          diff: values,
          tags: [tags.redirects],
        };
      }
      const [row] = await tx
        .insert(redirects)
        .values(values)
        .returning({ id: redirects.id });
      return {
        result: { id: row.id },
        entityId: row.id,
        diff: values,
        tags: [tags.redirects],
      };
    },
  });
}

/** Owner-only: delete a redirect by id. */
export async function removeRedirect(id: string): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "redirects",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const rows = await tx
        .delete(redirects)
        .where(eq(redirects.id, id))
        .returning({ id: redirects.id });
      if (!rows.length) return fail("Redirect tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.redirects] };
    },
  });
}
