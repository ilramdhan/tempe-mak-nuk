"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { uuidSchema } from "@/features/_shared/schema";
import { requireRole } from "@/lib/auth/require-role";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

import { checkRoleChange } from "./logic";

const roleSchema = z.object({ id: uuidSchema, role: z.enum(["owner", "editor"]) });

/** Owner-only: change a user's role. Blocks self-demotion and demoting the last owner. */
export async function setUserRole(input: z.input<typeof roleSchema>): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: roleSchema,
    input,
    entity: "profiles",
    action: "update",
    run: async (data, { tx, user }) => {
      const owners = await tx.select({ id: profiles.id }).from(profiles).where(eq(profiles.role, "owner")).for("update");
      const [target] = await tx.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, data.id));
      if (!target) return fail("Pengguna tidak ditemukan.");
      const problem = checkRoleChange({
        actorId: user.id,
        targetId: data.id,
        currentRole: target.role,
        newRole: data.role,
        ownerCount: owners.length,
      });
      if (problem) return fail(problem);
      await tx.update(profiles).set({ role: data.role }).where(eq(profiles.id, data.id));
      return { result: undefined, entityId: data.id, diff: { from: target.role, to: data.role }, tags: [] };
    },
  });
}

const inviteSchema = z.object({ email: z.email("Email tidak valid").max(200).transform((v) => v.toLowerCase()) });

/**
 * Owner-only: invite by email via Supabase Auth admin (service role, server-only). The invited user
 * gets an explicit `editor` profile here — the auth trigger grants no access to new users (0003).
 */
export async function inviteUser(input: z.input<typeof inviteSchema>): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireRole("owner");
  } catch {
    return fail("Hanya pemilik yang dapat mengundang pengguna.");
  }
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("Email tidak valid.", { email: [parsed.error.issues[0]?.message ?? "Email tidak valid"] });
  try {
    const { data, error } = await createAdminClient().auth.admin.inviteUserByEmail(parsed.data.email);
    if (error) return fail(error.message.includes("already") ? "Email sudah terdaftar." : "Gagal mengirim undangan.");
    if (data.user?.id) {
      await getDb().insert(profiles).values({ id: data.user.id, role: "editor", displayName: parsed.data.email.split("@")[0] }).onConflictDoNothing();
    }
    await writeAudit({ actorId: actor.id, action: "create", entity: "profiles", entityId: data.user?.id ?? null, diff: { invited: parsed.data.email } });
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[action] users.invite failed:", e);
    return fail("Gagal mengirim undangan.");
  }
}
