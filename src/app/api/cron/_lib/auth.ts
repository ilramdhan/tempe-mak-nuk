import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time check of `Authorization: Bearer <secret>`.
 * Both sides are SHA-256 hashed first so lengths match and no length info leaks.
 * Returns false when the secret is missing/empty (fail closed).
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !authorizationHeader) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  if (!match) return false;
  const provided = createHash("sha256").update(match[1]).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(provided, expected);
}
