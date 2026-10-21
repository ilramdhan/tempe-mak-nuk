import { expect, test } from "@playwright/test";

import { acceptConsent } from "./helpers";

test("Order Builder produces a WhatsApp link with the order message", async ({
  page,
  context,
  baseURL,
}) => {
  await acceptConsent(context, baseURL!);
  await page.goto("/custom-order");
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {}
  });
  await page.reload();

  // Step 1: product
  const product = page.getByRole("radiogroup").first().getByRole("radio").first();
  await expect(product).toBeVisible();
  await product.click();
  const variantName = (
    await page.locator('label:has([role="radio"][aria-checked="true"])').first().innerText()
  ).split("\n")[0]!.trim();

  const groups = page.getByRole("radiogroup");
  await groups.nth(1).getByRole("radio").first().click(); // shape
  await groups.nth(2).getByRole("radio").first().click(); // size
  await page.getByLabel("Jumlah (pcs)").fill("40");
  await page.getByRole("button", { name: /Lanjut/ }).click();

  // Step 2: date + delivery
  const day = page
    .locator("button[data-day]:not([aria-disabled='true']):not([disabled])")
    .first();
  await expect(day).toBeVisible();
  await day.click();
  const delivery = page.getByRole("radio", { name: /./ }).first();
  const deliveryInput = page.locator("#order-delivery");
  if (await deliveryInput.count()) await deliveryInput.fill("Ambil sendiri");
  else if (!(await delivery.isChecked().catch(() => true))) await delivery.click();
  await page.getByRole("button", { name: /Lanjut/ }).click();

  // Step 3: customer
  await page.getByLabel("Catatan (opsional)").fill("Tanpa plastik, ya");
  await page.getByLabel("Nama", { exact: true }).fill("Budi E2E");
  await page.getByLabel(/Area/).fill("Klaten");
  await page.getByRole("button", { name: /Lanjut/ }).click();

  // Step 4: summary
  const send = page.getByRole("link", { name: /Kirim pesanan ke WhatsApp/ });
  await expect(send).toBeVisible();
  const href = (await send.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//);
  const url = new URL(href);
  const text = url.searchParams.get("text") ?? decodeURIComponent(url.search);
  expect(text).toContain("Halo Mak Nuk, saya ingin cek slot & PO:");
  expect(text).toContain(variantName);
  expect(text).toContain("40 pcs");
  expect(text).toContain("Tanpa plastik, ya");
  expect(text).toContain("Budi E2E");
  expect(text).toContain("Klaten");
  // properly encoded (no raw spaces/newlines)
  expect(href).not.toMatch(/\s/);
  expect(href).toContain("%0A");
});
