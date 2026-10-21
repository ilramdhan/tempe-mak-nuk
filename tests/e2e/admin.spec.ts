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

test("FAQ CRUD smoke (create, list, edit, delete if owner)", async ({
  page,
}) => {
  const title = `E2E ${Date.now()}`;
  const edited = `${title} edit`;

  await page.goto("/login");
  await page.getByLabel("Email").first().fill(EMAIL!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(PASSWORD!);
  await page.getByRole("button", { name: /masuk/i }).first().click();
  await page.waitForURL(/\/admin/, { timeout: 60_000 });

  await page.goto("/admin/faq");
  await page.getByRole("button", { name: /FAQ baru/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Pertanyaan *").fill(title);
  await dialog.getByLabel("Jawaban *").fill("Jawaban uji E2E.");
  // Keep it hidden from the public site.
  await dialog.getByLabel("Tampilkan di situs").uncheck();
  await dialog.getByRole("button", { name: "Simpan" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(title, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Edit FAQ ${title}` }).click();
  await dialog.getByLabel("Pertanyaan *").fill(edited);
  await dialog.getByRole("button", { name: "Simpan" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(edited, { exact: true })).toBeVisible();

  // Delete is owner-only; editors leave the hidden row behind.
  const del = page.getByRole("button", { name: `Hapus FAQ ${edited}` });
  if ((await del.count()) === 0) {
    console.warn(`No delete permission; left hidden FAQ "${edited}" behind.`);
    return;
  }
  page.once("dialog", (d) => void d.accept());
  await del.click();
  await expect(page.getByText(edited, { exact: true })).toHaveCount(0);
});
