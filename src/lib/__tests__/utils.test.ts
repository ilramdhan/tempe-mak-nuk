import { describe, expect, it } from "vitest";

import { cn } from "../utils";

describe("cn", () => {
  it("keeps custom font sizes next to text colours", () => {
    expect(cn("text-eyebrow", "text-muted-foreground")).toBe(
      "text-eyebrow text-muted-foreground",
    );
    expect(cn("text-h3 text-foreground", "text-accent-strong")).toBe(
      "text-h3 text-accent-strong",
    );
  });

  it("merges conflicting custom tokens", () => {
    expect(cn("text-h2", "text-h3")).toBe("text-h3");
    expect(cn("py-section", "py-section-tight")).toBe("py-section-tight");
    expect(cn("max-w-content", "max-w-measure")).toBe("max-w-measure");
  });
});
