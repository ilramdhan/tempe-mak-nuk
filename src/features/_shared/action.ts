import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { AuthError } from "@/lib/auth/require-role";

/** Uniform Server Action result for admin forms (react-hook-form / useActionState). */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; error?: undefined; fieldErrors?: undefined }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: undefined;
    };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function fromZodError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fail("Periksa kembali isian yang ditandai.", fieldErrors);
}

/** Parse with Zod or return a typed failure. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
):
  | { success: true; data: z.output<S> }
  | { success: false; result: ActionResult<never> } {
  const res = schema.safeParse(input);
  return res.success
    ? { success: true, data: res.data }
    : { success: false, result: fromZodError(res.error) };
}

type PgError = { code?: string; constraint_name?: string; cause?: unknown };

function pgCode(error: unknown): PgError | null {
  let e: unknown = error;
  for (let i = 0; i < 3 && e && typeof e === "object"; i++) {
    if (typeof (e as PgError).code === "string") return e as PgError;
    e = (e as PgError).cause;
  }
  return null;
}

/**
 * Convert thrown errors into ActionResult. Next control-flow errors (redirect/notFound) and
 * auth failures are re-thrown so the framework / caller handles them.
 */
export function handleActionError(
  error: unknown,
  context: string,
): ActionResult<never> {
  unstable_rethrow(error);
  if (error instanceof AuthError) throw error;
  const pg = pgCode(error);
  if (pg?.code === "23505")
    return fail("Data dengan nilai yang sama sudah ada (mis. slug).", {
      slug: ["Sudah dipakai"],
    });
  if (pg?.code === "23503")
    return fail("Data masih dipakai atau referensinya tidak ditemukan.");
  console.error(`[action] ${context} failed:`, error);
  return fail("Terjadi kesalahan. Coba lagi.");
}
