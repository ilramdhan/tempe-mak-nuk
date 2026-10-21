import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

const MODULES = [
  "/admin",
  "/admin/produk",
  "/admin/resep",
  "/admin/jurnal",
  "/admin/faq",
  "/admin/halaman",
  "/admin/legal",
  "/admin/media",
  "/admin/navigasi",
  "/admin/pengaturan",
  "/admin/pengguna",
  "/admin/slot",
  "/admin/testimoni",
];

// Read-only on purpose: runs against the real remote DB.
test("login and navigate every admin module", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").first().fill(EMAIL!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(PASSWORD!);
  await page.getByRole("button", { name: /masuk/i }).first().click();
  await page.waitForURL(/\/admin/, { timeout: 60_000 });

  for (const path of MODULES) {
    const res = await page.goto(path, { waitUntil: "load" });
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1").first(), path).toBeVisible();
  }
});
