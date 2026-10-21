import { expect, test } from "@playwright/test";

for (const path of ["/admin", "/admin/produk"]) {
  test(`anonymous ${path} redirects to /login`, async ({ page }) => {
    await page.goto(path);
    await page.waitForURL(/\/login/);
    expect(new URL(page.url()).pathname).toBe("/login");
    await expect(page.getByLabel("Email").first()).toBeVisible();
    await expect(
      page.getByLabel("Kata sandi", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /masuk/i }).first(),
    ).toBeVisible();
  });
}

test("/login is noindex", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
