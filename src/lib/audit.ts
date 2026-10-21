import "server-only";

import { getDb, type Database } from "@/db/client";
import { auditLog } from "@/db/schema";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "reorder"
  | "publish"
  | "unpublish"
  | (string & {});

export type AuditEntry = {
  actorId: string | null;
  action: AuditAction;
  /** Table / domain, e.g. "products", "settings". */
  entity: string;
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
};

const MAX_DIFF_CHARS = 20_000;
const REDACT = /pass(word)?|secret|token|key$/i;

function sanitizeDiff(diff: Record<string, unknown> | null | undefined) {
  if (!diff) return null;
  const clean = JSON.parse(
    JSON.stringify(diff, (k, v) =>
      k && REDACT.test(k) && typeof v === "string" ? "[redacted]" : v,
    ),
  ) as Record<string, unknown>;
  const s = JSON.stringify(clean);
  return s.length > MAX_DIFF_CHARS
    ? { truncated: true, keys: Object.keys(clean) }
    : clean;
}

/**
 * Append to audit_log. Pass a transaction handle to write atomically with the change.
 * Never throws: an audit failure is logged but does not fail the user's save.
 */
export async function writeAudit(
  entry: AuditEntry,
  db: Pick<Database, "insert"> = getDb(),
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorId: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      diff: sanitizeDiff(entry.diff),
    });
  } catch (error) {
    console.error(
      "[audit] failed to write entry",
      entry.entity,
      entry.action,
      error,
    );
  }
}
