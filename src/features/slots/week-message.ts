import type { DayAvailability } from "./availability";

export type WeekMessage = { id: string; text: string };

/** Pure: announcement text from the next days' availability. */
export function weekSlotMessage(days: readonly DayAvailability[]): WeekMessage {
  const orderable = days.filter((d) => d.orderable);
  if (orderable.length === 0) {
    return {
      id: "slot-full",
      text: "Slot minggu ini penuh — PO untuk minggu depan",
    };
  }
  const remaining = orderable.reduce((n, d) => n + d.remaining, 0);
  if (orderable.some((d) => d.status === "nearly")) {
    return {
      id: "slot-nearly",
      text: `Slot minggu ini tinggal ${remaining} — cek tanggal pakai Anda`,
    };
  }
  return {
    id: "slot-open",
    text: "Slot minggu ini masih tersedia — cek tanggal pakai Anda",
  };
}
