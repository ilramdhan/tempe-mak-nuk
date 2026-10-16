import { describe, expect, it } from "vitest";

import { buildWaLink, buildWaMessage, normalizeWaNumber, WA_MAX_TEXT } from "@/lib/wa-link";

describe("normalizeWaNumber", () => {
  it.each([
    ["6281234567890", "6281234567890"],
    ["+62 812-3456-7890", "6281234567890"],
    ["081234567890", "6281234567890"],
    ["81234567890", "6281234567890"],
    ["0062 812 3456 7890", "6281234567890"],
  ])("%s → %s", (input, out) => expect(normalizeWaNumber(input)).toBe(out));

  it.each(["", null, undefined, "abc", "123", "0000000000000000000"])(
    "rejects %s",
    (input) => expect(normalizeWaNumber(input as string)).toBeNull(),
  );
});

describe("buildWaMessage", () => {
  it("formats greeting, bullets, skips empty values, adds footer", () => {
    const text = buildWaMessage({
      greeting: "Halo Mak Nuk, saya ingin cek slot & PO:",
      lines: [
        { label: "Varian", value: "Tempe Original Tanpa Kulit" },
        { label: "Jumlah", value: 40 },
        { label: "Catatan", value: "   " },
        { label: "Keperluan", value: null },
        false,
        "Nama: Budi  |  Area: Klaten",
      ],
      footer: "Terima kasih 🙏",
    });
    expect(text).toBe(
      [
        "Halo Mak Nuk, saya ingin cek slot & PO:",
        "• Varian: Tempe Original Tanpa Kulit",
        "• Jumlah: 40",
        "Nama: Budi  |  Area: Klaten",
        "",
        "Terima kasih 🙏",
      ].join("\n"),
    );
  });

  it("normalises CRLF and strips control chars", () => {
    expect(buildWaMessage({ lines: ["a\r\nb\u0007c"] })).toBe("a\nbc");
  });

  it("supports non-bulleted labelled lines", () => {
    expect(buildWaMessage({ lines: [{ label: "Nama", value: "Ani", bullet: false }] })).toBe(
      "Nama: Ani",
    );
  });

  it("truncates long text without splitting emoji", () => {
    const text = buildWaMessage({ lines: ["😀".repeat(WA_MAX_TEXT + 10)] });
    expect(Array.from(text).length).toBe(WA_MAX_TEXT);
    expect(text.endsWith("…")).toBe(true);
    expect(text).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });
});

describe("buildWaLink", () => {
  it("returns null for invalid number", () => {
    expect(buildWaLink("12", "hi")).toBeNull();
  });

  it("omits text when empty", () => {
    expect(buildWaLink("6281234567890")).toBe("https://wa.me/6281234567890");
    expect(buildWaLink("6281234567890", "  ")).toBe("https://wa.me/6281234567890");
  });

  it("encodes newlines, spaces, &, ?, # and emoji", () => {
    const url = buildWaLink("6281234567890", "Halo & salam?\n#1 🌱 • ×")!;
    expect(url).toBe(
      "https://wa.me/6281234567890?text=Halo%20%26%20salam%3F%0A%231%20%F0%9F%8C%B1%20%E2%80%A2%20%C3%97",
    );
    const text = new URL(url).searchParams.get("text");
    expect(text).toBe("Halo & salam?\n#1 🌱 • ×");
  });

  it("round-trips a structured message", () => {
    const msg = {
      greeting: "Halo Mak Nuk:",
      lines: [{ label: "Bentuk/ukuran", value: "Lembaran tipis, 10×15 cm" }],
    };
    const url = buildWaLink("+62 812-3456-7890", msg)!;
    expect(new URL(url).searchParams.get("text")).toBe(buildWaMessage(msg));
  });
});
