import { describe, expect, it } from "vitest";

import {
  checkUseDate,
  createOrderSchema,
  orderWindowEnd,
  productIdFromSlug,
  shapesForProduct,
  sizeLabel,
  sizesForProduct,
} from "@/features/orders";
import {
  parseDraft,
  serializeDraft,
  DRAFT_MAX_AGE_MS,
} from "@/features/orders/draft";
import {
  buildOrderMessageText,
  buildOrderWaLink,
  ORDER_GREETING,
} from "@/features/orders/message";

import {
  availability,
  catalog,
  deliveryOptions,
  validOrder,
  wib,
} from "./fixtures";

describe("catalog", () => {
  it("restricts shapes/sizes to product links and applies price override", () => {
    expect(shapesForProduct(catalog, "p-klasik").map((s) => s.id)).toEqual([
      "s-balok",
      "s-lembar",
    ]);
    const sizes = sizesForProduct(catalog, "p-klasik");
    expect(sizes.map((s) => [s.id, s.price])).toEqual([
      ["z-sedang", 7000],
      ["z-besar", 9000],
    ]);
  });

  it("falls back to every active option when a product has no links", () => {
    expect(shapesForProduct(catalog, "p-original")).toHaveLength(3);
    expect(sizesForProduct(catalog, "p-original")).toHaveLength(3);
    expect(shapesForProduct(catalog, "nope")).toEqual([]);
  });

  it("resolves ?produk=<slug> only for known products", () => {
    expect(productIdFromSlug(catalog, "tempe-klasik")).toBe("p-klasik");
    expect(productIdFromSlug(catalog, ["tempe-original-tanpa-kulit"])).toBe(
      "p-original",
    );
    expect(productIdFromSlug(catalog, "tempe-palsu")).toBeNull();
    expect(productIdFromSlug(catalog, undefined)).toBeNull();
  });

  it("labels sizes without repeating dims", () => {
    expect(sizeLabel({ name: "Sedang", dims: "±250 g" })).toBe(
      "Sedang (±250 g)",
    );
    expect(sizeLabel({ name: "Custom dimensi", dims: null })).toBe(
      "Custom dimensi",
    );
    expect(sizeLabel({ name: "Kecil ±100 g", dims: "±100 g" })).toBe(
      "Kecil ±100 g",
    );
  });
});

describe("checkUseDate — lead time & cutoff (Asia/Jakarta)", () => {
  it("Tuesday is orderable until Friday 15:00 WIB", () => {
    const ok = checkUseDate(
      "2026-10-20",
      availability(wib("2026-10-16T14:59")),
    );
    expect(ok.ok).toBe(true);
    expect(ok.message).toBe(
      "Untuk dipakai Selasa, 20 Okt 2026, pesan paling lambat Jumat, 16 Okt 2026 pukul 15.00 WIB.",
    );
  });

  it("rejects after the 15:00 cutoff and suggests the earliest date", () => {
    const late = checkUseDate(
      "2026-10-20",
      availability(wib("2026-10-16T15:01")),
    );
    expect(late.ok).toBe(false);
    expect(late.day?.status).toBe("past-cutoff");
    // Earliest after Fri 15:01: Wed 21 (deadline Sat 17 15:00).
    expect(late.message).toBe(
      "Tanggal ini sudah lewat batas pesan. Pilih tanggal mulai Rabu, 21 Okt 2026.",
    );
  });

  it("uses Jakarta time, not the server zone (08:00 UTC = 15:00 WIB)", () => {
    expect(
      checkUseDate("2026-10-20", availability(new Date("2026-10-16T07:59:59Z")))
        .ok,
    ).toBe(true);
    expect(
      checkUseDate("2026-10-20", availability(new Date("2026-10-16T08:00:01Z")))
        .ok,
    ).toBe(false);
  });

  it("rejects today and past dates", () => {
    const now = wib("2026-10-16T08:00");
    expect(checkUseDate("2026-10-16", availability(now)).ok).toBe(false);
    expect(checkUseDate("2026-10-01", availability(now)).ok).toBe(false);
  });

  it("rejects closed weekdays (Sunday)", () => {
    const res = checkUseDate(
      "2026-10-25",
      availability(wib("2026-10-16T08:00")),
    );
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/^Produksi libur di tanggal ini\./);
  });

  it("rejects holidays with their label", () => {
    const res = checkUseDate(
      "2026-10-21",
      availability(wib("2026-10-16T08:00"), {
        holidays: [{ date: "2026-10-21", label: "Libur Nasional" }],
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/^Libur: Libur Nasional di tanggal ini\./);
  });

  it("rejects full days (capacity) and accepts nearly-full ones", () => {
    const now = wib("2026-10-16T08:00");
    const full = checkUseDate(
      "2026-10-21",
      availability(now, {
        overrides: [
          { date: "2026-10-21", capacity: null, booked: 8, status: "auto" },
        ],
      }),
    );
    expect(full.ok).toBe(false);
    expect(full.day?.status).toBe("full");
    expect(full.message).toMatch(
      /^Slot tanggal ini sudah terisi\. Coba tanggal lain\./,
    );

    const nearly = checkUseDate(
      "2026-10-21",
      availability(now, {
        overrides: [
          { date: "2026-10-21", capacity: null, booked: 6, status: "auto" },
        ],
      }),
    );
    expect(nearly.ok).toBe(true);
    expect(nearly.day?.status).toBe("nearly");
  });

  it("rejects dates beyond the booking window", () => {
    const now = wib("2026-10-16T08:00");
    const end = orderWindowEnd(now, 30);
    expect(end).toBe("2026-11-14");
    expect(checkUseDate("2026-11-14", availability(now), 30).ok).toBe(true);
    expect(checkUseDate("2026-11-16", availability(now), 30).ok).toBe(false);
  });

  it("requires a valid date", () => {
    expect(checkUseDate("", availability(new Date())).message).toBe(
      "Pilih tanggal pakai dulu, ya.",
    );
    expect(checkUseDate("2026-02-30", availability(new Date())).ok).toBe(false);
  });
});

describe("createOrderSchema", () => {
  const ctx = {
    catalog,
    availability: availability(wib("2026-10-16T08:00")),
    deliveryOptions,
  };
  const schema = createOrderSchema(ctx);
  const errorsOf = (v: unknown) => {
    const r = schema.safeParse(v);
    return r.success
      ? {}
      : Object.fromEntries(
          r.error.issues.map((i) => [String(i.path[0]), i.message]),
        );
  };

  it("accepts a complete order", () => {
    expect(schema.safeParse(validOrder).success).toBe(true);
  });

  it("enforces quantity bounds with brand copy", () => {
    expect(errorsOf({ ...validOrder, quantity: Number.NaN }).quantity).toBe(
      "Isi jumlahnya dulu, ya.",
    );
    expect(errorsOf({ ...validOrder, quantity: 0 }).quantity).toBe(
      "Isi jumlahnya dulu, ya.",
    );
    expect(errorsOf({ ...validOrder, quantity: 2.5 }).quantity).toBe(
      "Jumlah harus bilangan bulat.",
    );
    expect(errorsOf({ ...validOrder, quantity: 5001 }).quantity).toMatch(
      /via WhatsApp/,
    );
    expect(schema.safeParse({ ...validOrder, quantity: 1 }).success).toBe(true);
  });

  it("rejects shapes/sizes not linked to the product", () => {
    const e = errorsOf({
      ...validOrder,
      productId: "p-klasik",
      shapeId: "s-dadu",
      sizeId: "z-custom",
    });
    expect(e.shapeId).toMatch(/tidak tersedia/);
    expect(e.sizeId).toMatch(/tidak tersedia/);
  });

  it("validates use date via the slot engine", () => {
    expect(errorsOf({ ...validOrder, useDate: "2026-10-18" }).useDate).toMatch(
      /Produksi libur/,
    );
  });

  it("requires a delivery option when configured, free otherwise", () => {
    expect(errorsOf({ ...validOrder, delivery: "Mars" }).delivery).toBe(
      "Pilih cara ambil/kirim, ya.",
    );
    const free = createOrderSchema({ ...ctx, deliveryOptions: [] });
    expect(free.safeParse({ ...validOrder, delivery: "" }).success).toBe(true);
  });

  it("requires purposeOther when purpose is Lainnya, and name/area", () => {
    const e = errorsOf({
      ...validOrder,
      purpose: "Lainnya",
      purposeOther: " ",
      name: "",
      area: "x",
    });
    expect(e.purposeOther).toBeDefined();
    expect(e.name).toBe("Isi nama Anda, ya.");
    expect(e.area).toBe("Isi area/kota Anda, ya.");
  });
});

describe("WhatsApp message", () => {
  it("formats the order in the PROMPT §5.1 layout", () => {
    expect(buildOrderMessageText(validOrder, catalog)).toBe(
      [
        ORDER_GREETING,
        "• Varian: Tempe Original Tanpa Kulit",
        "• Bentuk/ukuran: Lembaran tipis (mendoan), Sedang (±250 g)",
        "• Jumlah: 40 pcs",
        "• Tanggal pakai: Selasa, 20 Okt 2026",
        "• Ambil/kirim: Ambil di tempat (gratis)",
        "• Keperluan: Katering",
        "• Catatan: Tolong dibungkus daun.",
        "Nama: Budi  |  Area: Klaten",
      ].join("\n"),
    );
  });

  it("skips empty optional lines and uses purposeOther", () => {
    const text = buildOrderMessageText(
      {
        ...validOrder,
        note: "  ",
        delivery: "",
        purpose: "Lainnya",
        purposeOther: "Arisan",
        quantity: 1200,
      },
      catalog,
    );
    expect(text).not.toMatch(/Catatan|Ambil\/kirim/);
    expect(text).toMatch(/• Keperluan: Arisan/);
    expect(text).toMatch(/• Jumlah: 1\.200 pcs/);
  });

  it("builds a valid wa.me URL that decodes back to the message", () => {
    const url = buildOrderWaLink("+62 812-3456-7890", validOrder, catalog);
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe("https://wa.me/6281234567890");
    expect(parsed.searchParams.get("text")).toBe(
      buildOrderMessageText(validOrder, catalog),
    );
  });

  it("returns null without a configured number", () => {
    expect(buildOrderWaLink("", validOrder, catalog)).toBeNull();
  });
});

describe("draft", () => {
  it("round-trips values (NaN quantity survives as empty)", () => {
    const now = 1_000_000;
    const back = parseDraft(
      serializeDraft({ ...validOrder, quantity: Number.NaN }, now),
      now,
    );
    expect(back).toMatchObject({ productId: "p-original", name: "Budi" });
    expect(back?.quantity).toBeUndefined();
    expect(parseDraft(serializeDraft(validOrder, now), now)?.quantity).toBe(40);
  });

  it("ignores corrupt, foreign or expired drafts", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("{not json")).toBeNull();
    expect(parseDraft(JSON.stringify({ foo: 1 }))).toBeNull();
    expect(
      parseDraft(serializeDraft(validOrder, 0), DRAFT_MAX_AGE_MS + 1),
    ).toBeNull();
  });

  it("drops unknown purposes", () => {
    const raw = JSON.stringify({ savedAt: 0, values: { purpose: "Hack" } });
    expect(parseDraft(raw, 0)?.purpose).toBeUndefined();
  });
});
