import { z } from "zod";

/**
 * Environment validation.
 *
 * - `getClientEnv()` — only `NEXT_PUBLIC_*` values; safe in client components.
 * - `getServerEnv()` — everything (secrets included); throws if called in the browser.
 *
 * Both are lazy and cached so `next build` can run without a real Supabase project.
 * Set `SKIP_ENV_VALIDATION=1` (CI builds) to bypass validation entirely; values are
 * then passed through unchecked and may be `undefined` at runtime.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().transform((v) => v.replace(/\/+$/, "")),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = clientSchema.extend({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url().optional(),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),
  REVALIDATE_SECRET: z
    .string()
    .min(16, "REVALIDATE_SECRET must be at least 16 characters"),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

type EnvSource = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  constructor(scope: "server" | "client", issues: string) {
    super(
      `Invalid ${scope} environment variables:\n${issues}\n` +
        "Check your .env.local against .env.example (set SKIP_ENV_VALIDATION=1 to bypass during CI builds).",
    );
    this.name = "EnvValidationError";
  }
}

export function isEnvValidationSkipped(
  source: EnvSource = process.env,
): boolean {
  const v = source.SKIP_ENV_VALIDATION;
  return v === "1" || v === "true";
}

/** Treat empty strings as missing (`.env` files often contain `KEY=`). */
function normalize(source: EnvSource): EnvSource {
  const out: EnvSource = {};
  for (const [k, v] of Object.entries(source))
    out[k] = v === "" ? undefined : v;
  return out;
}

function parseWith<S extends z.ZodType>(
  schema: S,
  scope: "server" | "client",
  source: EnvSource,
): z.infer<S> {
  if (isEnvValidationSkipped(source)) return normalize(source) as z.infer<S>;
  const result = schema.safeParse(normalize(source));
  if (!result.success)
    throw new EnvValidationError(scope, z.prettifyError(result.error));
  return result.data;
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  return parseWith(serverSchema, "server", source);
}

export function parseClientEnv(source: EnvSource): ClientEnv {
  return parseWith(clientSchema, "client", source);
}

let serverCache: ServerEnv | undefined;
let clientCache: ClientEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() must not be called in the browser.");
  }
  serverCache ??= parseServerEnv(process.env);
  return serverCache;
}

export function getClientEnv(): ClientEnv {
  // NEXT_PUBLIC_* must be referenced literally so Next.js inlines them in client bundles.
  clientCache ??= parseClientEnv({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  });
  return clientCache;
}

/** Test helper: drop cached values so the next getter call re-reads `process.env`. */
export function resetEnvCache(): void {
  serverCache = undefined;
  clientCache = undefined;
}
