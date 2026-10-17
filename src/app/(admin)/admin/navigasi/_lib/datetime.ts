/** Date -> value for <input type="datetime-local"> in the browser's local zone. */
export function toLocalInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** datetime-local value -> ISO string (or null when empty/invalid). */
export function fromLocalInput(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type AnnouncementStatus = "inactive" | "scheduled" | "live" | "expired";

export function announcementStatus(
  a: { active: boolean; startsAt: string | null; endsAt: string | null },
  now: number,
): AnnouncementStatus {
  if (!a.active) return "inactive";
  if (a.startsAt && new Date(a.startsAt).getTime() > now) return "scheduled";
  if (a.endsAt && new Date(a.endsAt).getTime() <= now) return "expired";
  return "live";
}
