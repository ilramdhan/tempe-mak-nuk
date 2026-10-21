import { expect, test } from "@playwright/test";

const MISSING = [
  "/produk/tidak-ada-xyz",
  "/jurnal/tidak-ada-xyz",
  "/resep/tidak-ada-xyz",
  "/jurnal/kategori/tidak-ada-xyz",
  "/halaman-tidak-ada-xyz",
];

const KNOWN = [
  "/produk/tempe-klasik",
  "/jurnal/cara-menyimpan-tempe-tanpa-pengawet",
  "/resep/tempe-mendoan",
];

for (const path of MISSING) {
  test(`unknown ${path} returns 404 with noindex`, async ({
    page,
    request,
  }) => {
    const api = await request.get(path);
    expect(api.status()).toBe(404);

    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.getByText("404", { exact: true }).first()).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
}

for (const path of KNOWN) {
  test(`known ${path} returns 200`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
  });
}

test("/favicon.ico returns 200", async ({ request }) => {
  const res = await request.get("/favicon.ico");
  expect(res.status()).toBe(200);
});
