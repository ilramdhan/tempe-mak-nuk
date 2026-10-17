/**
 * Order → WhatsApp message (PROMPT §5.1 format). Pure; built on lib/wa-link.
 *
 *   Halo Mak Nuk, saya ingin cek slot & PO:
 *   • Varian: Tempe Original Tanpa Kulit
 *   • Bentuk/ukuran: Lembaran tipis (mendoan), Sedang (±250 g)
 *   • Jumlah: 40 pcs
 *   • Tanggal pakai: Selasa, 20 Okt 2026
 *   • Ambil/kirim: Ambil di tempat (gratis)
 *   • Keperluan: Katering
 *   • Catatan: …
 *   Nama: …  |  Area: …
 */
import { formatDateLong, isDateKey } from "@/lib/dates";
import { buildWaLink, buildWaMessage, type WaMessage } from "@/lib/wa-link";

import {
  findProduct,
  shapesForProduct,
  sizeLabel,
  sizesForProduct,
  type OrderCatalog,
} from "./catalog";
import type { OrderFormValues } from "./schema";

export const ORDER_GREETING = "Halo Mak Nuk, saya ingin cek slot & PO:";

export type OrderSummary = {
  product: string | null;
  shape: string | null;
  size: string | null;
  quantity: string | null;
  useDate: string | null;
  delivery: string | null;
  purpose: string | null;
  note: string | null;
  name: string | null;
  area: string | null;
};

const clean = (v: string | null | undefined) => {
  const t = v?.replace(/\s+/g, " ").trim();
  return t ? t : null;
};

/** Human-readable labels for every chosen value (null when empty). */
export function summarizeOrder(
  values: OrderFormValues,
  catalog: OrderCatalog,
): OrderSummary {
  const product = findProduct(catalog, values.productId);
  const shape = shapesForProduct(catalog, values.productId).find(
    (s) => s.id === values.shapeId,
  );
  const size = sizesForProduct(catalog, values.productId).find(
    (s) => s.id === values.sizeId,
  );
  const qty =
    Number.isFinite(values.quantity) && values.quantity > 0
      ? values.quantity
      : null;
  return {
    product: product?.name ?? null,
    shape: shape?.name ?? null,
    size: size ? sizeLabel(size) : null,
    quantity: qty ? `${new Intl.NumberFormat("id-ID").format(qty)} pcs` : null,
    useDate: isDateKey(values.useDate) ? formatDateLong(values.useDate) : null,
    delivery: clean(values.delivery),
    purpose:
      values.purpose === "Lainnya"
        ? (clean(values.purposeOther) ?? "Lainnya")
        : clean(values.purpose),
    // Notes keep line breaks (multi-line requests), only trimmed.
    note: values.note.trim() || null,
    name: clean(values.name),
    area: clean(values.area),
  };
}

export function orderWaMessage(summary: OrderSummary): WaMessage {
  const shapeSize = [summary.shape, summary.size].filter(Boolean).join(", ");
  const contact = [
    summary.name ? `Nama: ${summary.name}` : null,
    summary.area ? `Area: ${summary.area}` : null,
  ]
    .filter(Boolean)
    .join("  |  ");
  return {
    greeting: ORDER_GREETING,
    lines: [
      { label: "Varian", value: summary.product },
      { label: "Bentuk/ukuran", value: shapeSize },
      { label: "Jumlah", value: summary.quantity },
      { label: "Tanggal pakai", value: summary.useDate },
      { label: "Ambil/kirim", value: summary.delivery },
      { label: "Keperluan", value: summary.purpose },
      { label: "Catatan", value: summary.note },
      contact || null,
    ],
  };
}

export function buildOrderMessageText(
  values: OrderFormValues,
  catalog: OrderCatalog,
): string {
  return buildWaMessage(orderWaMessage(summarizeOrder(values, catalog)));
}

/** wa.me URL for the order, or null when the business WhatsApp number is not configured. */
export function buildOrderWaLink(
  waNumber: string | null | undefined,
  values: OrderFormValues,
  catalog: OrderCatalog,
): string | null {
  return buildWaLink(waNumber, orderWaMessage(summarizeOrder(values, catalog)));
}
