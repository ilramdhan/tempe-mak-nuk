/**
 * Publish-date handling for posts & recipes. The admin types wall-clock time in WIB
 * (Asia/Jakarta) via `<input type="datetime-local">` ("YYYY-MM-DDTHH:mm"), independent of
 * the browser's own timezone.
 */
import { formatDate, formatTime, zonedDateTime, zonedParts } from "@/lib/dates";

export type ContentStatus = "draft" | "scheduled" | "published";

const LOCAL_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Instant → "YYYY-MM-DDTHH:mm" in WIB (for datetime-local inputs). */
export function toWibInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const p = zonedParts(d);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM-DDTHH:mm" (WIB) → instant; `null` when empty/invalid. */
export function fromWibInput(value: string | null | undefined): Date | null {
  const m = LOCAL_RE.exec((value ?? "").trim());
  if (!m) return null;
  try {
    return zonedDateTime(m[1], m[2]);
  } catch {
    return null;
  }
}

/** "17 Oktober 2026 15.00 WIB" */
export function formatWib(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${formatDate(d)} ${formatTime(d)} WIB`;
}

/** Status as seen by visitors (mirrors `isLiveSql`). */
export type Visibility = "draft" | "scheduled" | "live";

export function visibilityOf(
  status: ContentStatus,
  publishedAt: Date | string | null | undefined,
  now: Date = new Date(),
): Visibility {
  if (status === "draft") return "draft";
  if (!publishedAt) return status === "published" ? "live" : "scheduled";
  const t = new Date(publishedAt).getTime();
  return t <= now.getTime() ? "live" : "scheduled";
}

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  draft: "Draf",
  scheduled: "Terjadwal",
  live: "Terbit",
};

/**
 * Client-side publish checks (server re-validates "scheduled needs a date").
 * Returns an error for the `publishedAt` field, or a non-blocking warning.
 */
export function checkPublish(
  status: ContentStatus,
  input: string,
  now: Date = new Date(),
): { error?: string; warning?: string } {
  const raw = input.trim();
  const date = fromWibInput(raw);
  if (raw && !date) return { error: "Format tanggal/jam tidak valid" };
  if (status === "scheduled") {
    if (!date) return { error: "Tanggal terbit wajib diisi untuk jadwal" };
    if (date.getTime() <= now.getTime())
      return {
        warning:
          "Waktu jadwal sudah lewat — konten akan langsung tampil setelah disimpan.",
      };
  }
  if (status === "published" && date && date.getTime() > now.getTime())
    return {
      warning:
        "Tanggal terbit di masa depan: konten baru tampil pada waktu tsb. (sama seperti dijadwalkan).",
    };
  return {};
}

/**
 * `publishedAt` to send to the server. Draft keeps the date (if any) so re-publishing keeps
 * the original date; published without a date → server sets now.
 */
export function publishedAtForSave(input: string): string | null {
  const d = fromWibInput(input);
  return d ? d.toISOString() : null;
}
