import "server-only";

import type { z } from "zod";

import { getDb, type Database } from "@/db/client";
import { writeAudit, type AuditAction } from "@/lib/audit";
import { userCan } from "@/lib/auth/permissions";
import {
  AuthError,
  requireRole,
  type AdminRole,
  type SessionUser,
} from "@/lib/auth/require-role";

import {
  fail,
  handleActionError,
  parseInput,
  type ActionResult,
} from "./action";
import { expireTags } from "./revalidate";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type AdminActionOutcome<R> = {
  result: R;
  entityId?: string | null;
  /** Audit diff (defaults to the parsed input). */
  diff?: Record<string, unknown> | null;
  /** Cache tags to expire (updateTag) after commit. */
  tags: (string | null | undefined | false)[];
};

/**
 * Standard admin mutation pipeline:
 *   requireRole("editor") + permission `<entity>.<action>` (dynamic RBAC, P8.14) → Zod parse → transaction(run) → audit_log → updateTag(tags) → ActionResult.
 * Returns `{ ok:false }` for auth / validation / DB errors; redirect/notFound are re-thrown.
 */
export async function adminAction<S extends z.ZodType, R>(opts: {
  /**
   * Minimum role at the call site. For keys in the permission registry the registry default +
   * owner-managed overrides decide; `role` only acts as a hard floor when it is STRICTER than the
   * registry default (e.g. owner-only settings groups). For unknown keys it is the rule (default
   * "editor").
   */
  role?: AdminRole;
  schema: S;
  input: unknown;
  entity: string;
  action: AuditAction;
  run: (
    data: z.output<S>,
    ctx: { tx: Tx; user: SessionUser },
  ) => Promise<AdminActionOutcome<R> | ActionResult<never>>;
}): Promise<ActionResult<R>> {
  let user: SessionUser;
  try {
    user = await requireRole("editor");
    const permission = `${opts.entity}.${opts.action}`;
    if (!(await userCan(user, permission, opts.role ?? "editor")))
      throw new AuthError("forbidden");
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message);
    return handleActionError(error, `${opts.entity}.${opts.action}:auth`);
  }

  const parsed = parseInput(opts.schema, opts.input);
  if (!parsed.success) return parsed.result;

  try {
    const outcome = await getDb().transaction((tx) =>
      opts.run(parsed.data, { tx, user }),
    );
    if ("ok" in outcome) return outcome;
    await writeAudit({
      actorId: user.id,
      action: opts.action,
      entity: opts.entity,
      entityId: outcome.entityId ?? null,
      diff:
        outcome.diff !== undefined
          ? outcome.diff
          : (parsed.data as Record<string, unknown> | null),
    });
    expireTags(...outcome.tags);
    return { ok: true, data: outcome.result };
  } catch (error) {
    return handleActionError(error, `${opts.entity}.${opts.action}`);
  }
}
