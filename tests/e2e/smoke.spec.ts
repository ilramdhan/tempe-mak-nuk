import { expect, test } from "@playwright/test";

import {
  acceptConsent,
  collectConsoleErrors,
  detailLinks,
  STATIC_ROUTES,
} from "./helpers";

test.beforeEach(async ({ context, baseURL }) => {
  await acceptConsent(context, baseURL!);
});

async function check(page: import("@playwright/test").Page, path: string) {
  const errors = collectConsoleErrors(page);
  const res = await page.goto(path, { waitUntil: "load" });
  expect(res?.status(), path).toBe(200);
  await expect(page.locator("h1").first(), `${path} h1`).toBeVisible();
  await page.waitForTimeout(500);
  expect(errors, `${path} console errors`).toEqual([]);
}

for (const path of STATIC_ROUTES) {
  test(`smoke ${path}`, async ({ page }) => {
    await check(page, path);
  });
}

for (const base of ["/produk", "/jurnal", "/resep"]) {
  test(`smoke detail pages from ${base}`, async ({ page }) => {
    const links = await detailLinks(page, base, 3);
    test.skip(links.length === 0, `no detail links found on ${base}`);
    for (const l of links) await check(page, l);
  });
}

test("unknown route returns 404 page", async ({ page }) => {
  const res = await page.goto("/halaman-tidak-ada-xyz");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("unknown product slug shows not-found (noindex)", async ({ page }) => {
  // Known app behaviour: detail pages stream inside Suspense, so the HTTP status is already
  // 200 when notFound() fires. The page is a noindex not-found view (reported in STATE).
  const res = await page.goto("/produk/slug-tidak-ada-xyz");
  expect([200, 404]).toContain(res?.status());
  await expect(
    page.locator('meta[name="robots"][content*="noindex"]').first(),
  ).toBeAttached();
  await expect(page.locator("h1").first()).toHaveText(/sudah tidak ada/i);
});

test("meta endpoints respond", async ({ request }) => {
  for (const [p, type] of [
    ["/sitemap.xml", /xml/],
    ["/robots.txt", /text/],
    ["/manifest.webmanifest", /json/],
    ["/og-default.png", /image\/png/],
  ] as const) {
    const res = await request.get(p);
    expect(res.status(), p).toBe(200);
    expect(res.headers()["content-type"], p).toMatch(type);
  }
});
