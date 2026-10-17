"use client";

import type { OrderSummary } from "../message";

const ROWS: { key: keyof OrderSummary; label: string }[] = [
  { key: "product", label: "Varian" },
  { key: "shape", label: "Bentuk" },
  { key: "size", label: "Ukuran" },
  { key: "quantity", label: "Jumlah" },
  { key: "useDate", label: "Tanggal pakai" },
  { key: "delivery", label: "Ambil/kirim" },
  { key: "purpose", label: "Keperluan" },
  { key: "note", label: "Catatan" },
  { key: "name", label: "Nama" },
  { key: "area", label: "Area" },
];

/** Definition list of the current choices (empty values shown as "—"). */
export function OrderSummaryList({
  summary,
  compact = false,
}: {
  summary: OrderSummary;
  compact?: boolean;
}) {
  const rows = compact ? ROWS.slice(0, 5) : ROWS;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(({ key, label }) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium break-words whitespace-pre-line tabular-nums">
            {summary[key] ?? (
              <span className="font-normal text-muted-foreground">—</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Exact text that will be sent (so nothing surprises the user in WhatsApp). */
export function OrderMessagePreview({ text }: { text: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm text-muted-foreground">
        Pratinjau pesan WhatsApp
      </figcaption>
      <pre className="rounded-lg border border-border bg-surface p-4 font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
        {text}
      </pre>
    </figure>
  );
}
