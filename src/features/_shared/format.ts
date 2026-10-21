const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 5000 → "Rp 5.000" (normal space, not NBSP, for predictable output). */
export function formatIdr(value: number): string {
  return idr.format(value).replace(/ /g, " ");
}

/** "Mulai dari Rp 5.000" or null when price is hidden/unknown. */
export function formatPriceFrom(
  value: number | null | undefined,
  show = true,
): string | null {
  return show && typeof value === "number"
    ? `Mulai dari ${formatIdr(value)}`
    : null;
}

export function formatMinutes(min: number | null | undefined): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} jam${m ? ` ${m} menit` : ""}` : `${m} menit`;
}
