import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { acceptConsent } from "./helpers";

const ROUTES = [
  "/",
  "/produk",
  "/custom-order",
  "/cara-pesan",
  "/faq",
  "/kontak",
  "/jurnal",
  "/resep",
  "/tentang",
  "/kemitraan",
  "/kebijakan-privasi",
];

/**
 * Allow-list for known serious/critical violations (route → rule ids). Empty since P7.2
 * fixed every P7.1 finding (see docs/qa.md). Run with E2E_AXE_STRICT=1 to ignore it.
 */
const KNOWN: Record<string, string[]> = {};
const STRICT = process.env.E2E_AXE_STRICT === "1";

for (const path of ROUTES) {
  test(`axe wcag2a/aa ${path}`, async ({ page, context, baseURL }, info) => {
    await acceptConsent(context, baseURL!);
    await page.goto(path, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes
        .slice(0, 3)
        .map((n) => `${n.target.join(" ")} :: ${n.html.slice(0, 140)}`),
    }));
    await info.attach("axe-summary", {
      body: JSON.stringify(summary, null, 2),
      contentType: "application/json",
    });
    if (summary.length) console.log(`AXE ${path}: ${JSON.stringify(summary)}`);
    const bad = results.violations.filter(
      (v) =>
        (v.impact === "serious" || v.impact === "critical") &&
        (STRICT || !KNOWN[path]?.includes(v.id)),
    );
    expect(bad.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`)).toEqual(
      [],
    );
  });
}
