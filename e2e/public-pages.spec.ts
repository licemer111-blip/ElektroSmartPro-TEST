import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ElektroSmart/i);
  });

  test("homepage has CTA button", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("a[href='/login'], a[href='/register'], button:has-text('Rozpocznij')").first();
    await expect(cta).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
  });

  test("404 page shows Polish message", async ({ page }) => {
    await page.goto("/non-existent-page-12345");
    await expect(page.locator("text=404")).toBeVisible();
    await expect(page.locator("text=Strona nie została znaleziona")).toBeVisible();
  });

  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/polityka-prywatnosci");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/regulamin");
    await expect(page.locator("h1")).toBeVisible();
  });
});
