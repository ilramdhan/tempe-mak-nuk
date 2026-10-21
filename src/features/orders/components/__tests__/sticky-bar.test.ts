import { describe, expect, it } from "vitest";

import { isStickyBarHidden } from "../sticky-bar";

describe("isStickyBarHidden", () => {
  it("hides the mobile bar until the builder is in view", () => {
    expect(isStickyBarHidden({ mobile: true, builderInView: false })).toBe(
      true,
    );
    expect(isStickyBarHidden({ mobile: true, builderInView: true })).toBe(
      false,
    );
  });

  it("never hides the inline desktop bar", () => {
    expect(isStickyBarHidden({ mobile: false, builderInView: false })).toBe(
      false,
    );
    expect(isStickyBarHidden({ mobile: false, builderInView: true })).toBe(
      false,
    );
  });
});
