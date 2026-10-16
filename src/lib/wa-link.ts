/**
 * WhatsApp click-to-chat links (https://wa.me/<number>?text=<encoded>).
 * Pure + isomorphic (usable from client components, e.g. the order builder).
 */

export type WaLine =
  | string
  | { label: string; value?: string | number | null; bullet?: boolean }
  | null
  | undefined
  | false;

export type WaMessage = {
  /** Opening line, e.g. "Halo Mak Nuk, saya ingin cek slot & PO:" */
  greeting?: string;
  /** Body lines. Labelled lines with empty values are skipped. */
  lines?: WaLine[];
  /** Closing line(s) appended after a blank line. */
  footer?: string | string[];
};

const BULLET = "•";
/** WhatsApp's practical URL text limit is ~65k; keep links well under typical URL limits. */
export const WA_MAX_TEXT = 4000;

/**
 * Normalise an Indonesian/international phone number to wa.me digits:
 * "+62 812-3456-7890" → "6281234567890", "0812…" → "62812…".
 * Returns null when the result is not a plausible number (8–15 digits, E.164).
 */
export function normalizeWaNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D+/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 13)
    digits = `62${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

function cleanText(value: string): string {
  // Normalise newlines, strip control chars except \n and \t, trim trailing spaces per line.
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n");
}

function renderLine(line: WaLine): string | null {
  if (line === null || line === undefined || line === false) return null;
  if (typeof line === "string") return cleanText(line);
  const value =
    line.value === null || line.value === undefined
      ? ""
      : cleanText(String(line.value)).trim();
  if (!value) return null;
  const text = `${cleanText(line.label).trim()}: ${value}`;
  return line.bullet === false ? text : `${BULLET} ${text}`;
}

/** Build the plain-text message (newline separated). */
export function buildWaMessage({ greeting, lines = [], footer }: WaMessage): string {
  const parts: string[] = [];
  if (greeting) parts.push(cleanText(greeting));
  for (const l of lines) {
    const r = renderLine(l);
    if (r !== null) parts.push(r);
  }
  const footers = (Array.isArray(footer) ? footer : footer ? [footer] : [])
    .map(cleanText)
    .filter((f) => f.trim().length > 0);
  if (footers.length) parts.push("", ...footers);
  let text = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length > WA_MAX_TEXT) {
    // Truncate on a code point boundary (never split surrogate pairs / emoji).
    text = `${Array.from(text).slice(0, WA_MAX_TEXT - 1).join("")}…`;
  }
  return text;
}

/**
 * Build a wa.me URL. `message` may be a prebuilt string or a structured message.
 * Uses encodeURIComponent (UTF-8, emoji-safe; newlines → %0A, spaces → %20).
 * Returns null if the number is invalid.
 */
export function buildWaLink(
  number: string | null | undefined,
  message?: string | WaMessage,
): string | null {
  const n = normalizeWaNumber(number);
  if (!n) return null;
  const text =
    typeof message === "string"
      ? cleanText(message).trim()
      : message
        ? buildWaMessage(message)
        : "";
  return text ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : `https://wa.me/${n}`;
}
