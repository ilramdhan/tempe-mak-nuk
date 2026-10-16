import { describe, expect, it } from "vitest";

import {
  ADMIN_NAV,
  isNavItemActive,
  navForRole,
} from "@/components/admin/shell/nav";

const hrefs = (role: Parameters<typeof navForRole>[0]) =>
  navForRole(role).flatMap((g) => g.items.map((i) => i.href));

describe("admin nav", () => {
  it("covers every Fase 5 module", () => {
    expect(hrefs("owner")).toEqual([
      "/admin",
      "/admin/halaman",
      "/admin/produk",
      "/admin/slot",
      "/admin/jurnal",
      "/admin/resep",
      "/admin/faq",
      "/admin/testimoni",
      "/admin/navigasi",
      "/admin/media",
      "/admin/pengaturan",
      "/admin/pengguna",
      "/admin/legal",
    ]);
  });

  it("hides owner-only items from editors", () => {
    const editor = hrefs("editor");
    expect(editor).not.toContain("/admin/pengguna");
    expect(editor).not.toContain("/admin/legal");
    expect(editor).toContain("/admin/pengaturan");
  });

  it("shows nothing without a role and drops empty groups", () => {
    expect(navForRole(null)).toEqual([]);
    const ownerOnly = [{ label: "X", items: [{ ...ADMIN_NAV[2].items[1] }] }];
    expect(navForRole("editor", ownerOnly)).toEqual([]);
  });

  it("matches active items", () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/produk")).toBe(false);
    expect(isNavItemActive("/admin/produk", "/admin/produk/12")).toBe(true);
    expect(isNavItemActive("/admin/produk", "/admin/produkx")).toBe(false);
    expect(isNavItemActive("/admin/faq", null)).toBe(false);
  });
});
