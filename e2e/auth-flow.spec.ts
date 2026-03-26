import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("redirects unauthenticated user from dashboard to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login page
    await page.waitForURL(/\/(login|auth)/);
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
  });

  test("login form validates empty fields", async ({ page }) => {
    await page.goto("/login");
    // Try submitting empty form
    const submitButton = page.locator("button[type='submit']").first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should show validation or stay on login page
      await expect(page).toHaveURL(/login/);
    }
  });

  test("login form accepts email input", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });
});
