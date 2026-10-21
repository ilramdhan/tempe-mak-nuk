import { describe, expect, it } from "vitest";

import {
  FLOATING_WA_HIDDEN_ROUTES,
  isBannerShown,
  isFloatingWaTucked,
  isRouteHidden,
} from "../floating-whatsapp-visibility";

function fakeEl(attrs: string[]): Element {
  return { hasAttribute: (a: string) => attrs.includes(a) } as Element;
}

describe("isRouteHidden", () => {
  it("hides on /custom-order and /admin, incl. sub-paths", () => {
    for (const p of ["/custom-order", "/admin", "/admin/produk"]) {
      expect(isRouteHidden(p, FLOATING_WA_HIDDEN_ROUTES)).toBe(true);
    }
  });

  it("matches whole segments only", () => {
    expect(isRouteHidden("/administrasi", FLOATING_WA_HIDDEN_ROUTES)).toBe(
      false,
    );
    expect(isRouteHidden("/", FLOATING_WA_HIDDEN_ROUTES)).toBe(false);
    expect(isRouteHidden("/produk", FLOATING_WA_HIDDEN_ROUTES)).toBe(false);
  });
});

describe("isFloatingWaTucked", () => {
  it("tucks while footer or consent banner is visible", () => {
    expect(
      isFloatingWaTucked({ footerVisible: false, bannerVisible: false }),
    ).toBe(false);
    expect(
      isFloatingWaTucked({ footerVisible: true, bannerVisible: false }),
    ).toBe(true);
    expect(
      isFloatingWaTucked({ footerVisible: false, bannerVisible: true }),
    ).toBe(true);
  });
});

describe("isBannerShown", () => {
  it("treats missing, hidden and pending banners as not shown", () => {
    expect(isBannerShown(null)).toBe(false);
    expect(isBannerShown(fakeEl(["hidden"]))).toBe(false);
    expect(isBannerShown(fakeEl(["data-pending"]))).toBe(false);
    expect(isBannerShown(fakeEl([]))).toBe(true);
  });
});
