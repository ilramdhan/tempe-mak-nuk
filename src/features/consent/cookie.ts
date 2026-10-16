/** Pure cookie/consent logic (no DOM) — unit tested. */
export const CONSENT_COOKIE = "tmn_consent";
export const CONSENT_MAX_AGE_DAYS = 180;

export type ConsentRecord = {
  version: number;
  /** Category keys the visitor allowed (always includes required ones). */
  categories: string[];
  ts: number;
};

export type ConsentCategoryDef = { key: string; required: boolean };

export function serializeConsent(record: ConsentRecord): string {
  return encodeURIComponent(JSON.stringify(record));
}

export function parseConsent(
  raw: string | null | undefined,
): ConsentRecord | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(decodeURIComponent(raw));
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    if (typeof o.version !== "number" || !Number.isInteger(o.version))
      return null;
    if (
      !Array.isArray(o.categories) ||
      !o.categories.every((c) => typeof c === "string")
    )
      return null;
    if (typeof o.ts !== "number") return null;
    return {
      version: o.version,
      categories: o.categories as string[],
      ts: o.ts,
    };
  } catch {
    return null;
  }
}

export function readCookieValue(
  cookieHeader: string,
  name = CONSENT_COOKIE,
): string | null {
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function buildCookieString(
  record: ConsentRecord,
  secure: boolean,
): string {
  return `${CONSENT_COOKIE}=${serializeConsent(record)}; Path=/; Max-Age=${CONSENT_MAX_AGE_DAYS * 86400}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** A stored decision is valid only when its version matches the current config version. */
export function isConsentCurrent(
  record: ConsentRecord | null,
  configVersion: number,
): record is ConsentRecord {
  return record !== null && record.version === configVersion;
}

/** Normalise a selection: only known keys, required always on. */
export function normalizeCategories(
  selected: Iterable<string>,
  defs: ConsentCategoryDef[],
): string[] {
  const set = new Set(selected);
  return defs.filter((d) => d.required || set.has(d.key)).map((d) => d.key);
}

export const acceptAll = (defs: ConsentCategoryDef[]) => defs.map((d) => d.key);
export const rejectOptional = (defs: ConsentCategoryDef[]) =>
  defs.filter((d) => d.required).map((d) => d.key);

export function hasConsent(
  record: ConsentRecord | null,
  configVersion: number,
  category: string,
): boolean {
  return (
    isConsentCurrent(record, configVersion) &&
    record.categories.includes(category)
  );
}
