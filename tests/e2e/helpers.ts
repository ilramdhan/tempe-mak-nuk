import type { BrowserContext, Page } from "@playwright/test";

export const CONSENT_COOKIE = "tmn_consent";

/** Pre-accept consent (all categories) so the banner never covers the page. */
export async function acceptConsent(context: BrowserContext, baseURL: string) {
  const record = { version: 1, categories: ["necessary"], ts: Date.now() };
  await context.addCookies([
    {
      name: CONSENT_COOKIE,
      value: encodeURIComponent(JSON.stringify(record)),
      url: baseURL,
    },
  ]);
}

export async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

/** Console errors worth failing on (ignore noisy third-party/network-blocked items). */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Failed to load resource/i.test(t)) return;
    errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

export const STATIC_ROUTES = [
  "/",
  "/produk",
  "/jurnal",
  "/resep",
  "/cara-pesan",
  "/custom-order",
  "/faq",
  "/halal-kualitas",
  "/kemitraan",
  "/kontak",
  "/manfaat-tempe",
  "/proses",
  "/tentang",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
  "/kebijakan-cookie",
  "/kebijakan-pemesanan",
] as const;

/** Collect detail slugs from a listing page's links, e.g. /produk/<slug>. */
export async function detailLinks(page: Page, base: string, max = 3) {
  await page.goto(base);
  const hrefs = await page
    .locator(`a[href^="${base}/"]`)
    .evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
  return [...new Set(hrefs)]
    .filter((h) => /^\/[a-z-]+\/[^/?#]+$/.test(h) && !h.includes("kategori"))
    .slice(0, max);
}
