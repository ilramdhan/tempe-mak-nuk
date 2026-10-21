import { test } from "@playwright/test";

import { acceptConsent, setTheme } from "./helpers";

const ROUTES: [string, string][] = [
  ["/", "beranda"],
  ["/produk", "produk"],
  ["/custom-order", "custom-order"],
  ["/cara-pesan", "cara-pesan"],
  ["/kemitraan", "kemitraan"],
  ["/proses", "proses"],
  ["/tentang", "tentang"],
  ["/jurnal", "jurnal"],
  ["/resep", "resep"],
  ["/faq", "faq"],
  ["/kontak", "kontak"],
];
const WIDTHS = [375, 768, 1440] as const;
const THEMES = ["light", "dark"] as const;

// Output: test-results/screenshots/<route>-<width>-<theme>.png (gitignored)
for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`screenshots ${width} ${theme}`, async ({ browser, baseURL }) => {
      test.setTimeout(300_000);
      const context = await browser.newContext({
        viewport: { width, height: width === 1440 ? 900 : 800 },
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      await acceptConsent(context, baseURL!);
      const page = await context.newPage();
      await setTheme(page, theme);
      for (const [path, name] of ROUTES) {
        await page.goto(path, { waitUntil: "load" });
        // trigger lazy/scroll-reveal content
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `test-results/screenshots/${name}-${width}-${theme}.png`,
          fullPage: true,
        });
      }
      await context.close();
    });
  }
}
