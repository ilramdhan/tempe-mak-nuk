/**
 * Safety guard for `pnpm db:seed`: the seed upserts and overwrites real data,
 * so it refuses to run against a non-local database unless explicitly allowed.
 */
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

export function assertSeedTarget(
  url: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): void {
  if (env.SEED_ALLOW_REMOTE === "1") return;

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // Never echo the raw URL: it may contain a password.
    throw new Error("[seed] Refusing to run: database URL is not parseable.");
  }
  host = host.replace(/^\[|\]$/g, "");

  // Bare service names (e.g. `postgres`, `db`) have no dot: docker/CI networks.
  const isLocal = LOCAL_HOSTS.has(host) || (host !== "" && !host.includes("."));
  if (isLocal) return;

  throw new Error(
    `[seed] Refusing to seed non-local database host "${host}". ` +
      `The seed overwrites existing data. If this is intentional, rerun with SEED_ALLOW_REMOTE=1.`,
  );
}
