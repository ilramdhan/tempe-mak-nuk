import { describe, expect, it } from "vitest";

import { findRedirectLoop, internalPath, normalizeFrom } from "./logic";

describe("redirect logic", () => {
  it("normalizes paths", () => {
    expect(normalizeFrom("/a/")).toBe("/a");
    expect(normalizeFrom("/")).toBe("/");
    expect(internalPath("/b?x=1#h")).toBe("/b");
    expect(internalPath("https://x.com")).toBeNull();
    expect(internalPath("//evil.com")).toBeNull();
  });
  it("detects direct and chained loops", () => {
    expect(findRedirectLoop([], { from: "/a", to: "/a" })).not.toBeNull();
    expect(findRedirectLoop([{ from: "/b", to: "/a" }], { from: "/a", to: "/b" })).not.toBeNull();
    expect(
      findRedirectLoop(
        [
          { from: "/b", to: "/c" },
          { from: "/c", to: "/a" },
        ],
        { from: "/a", to: "/b" },
      ),
    ).not.toBeNull();
  });
  it("allows safe chains and external targets", () => {
    expect(findRedirectLoop([{ from: "/b", to: "/c" }], { from: "/a", to: "/b" })).toBeNull();
    expect(findRedirectLoop([{ from: "/b", to: "/a" }], { from: "/a", to: "https://x.com" })).toBeNull();
  });
  it("candidate replaces the existing rule with the same from", () => {
    expect(findRedirectLoop([{ from: "/a", to: "/b" }, { from: "/b", to: "/a" }], { from: "/a", to: "/c" })).toBeNull();
  });
});
