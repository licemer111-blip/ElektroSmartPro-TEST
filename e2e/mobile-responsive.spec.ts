import { test, expect } from "@playwright/test";

test.describe("Mobile responsiveness", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test("homepage is readable on mobile", async ({ page }) => {
    await page.goto("/");
    // No horizontal scroll
    const body = page.locator("body");
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(376);
  });

  test("login page fits mobile viewport", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    await expect(emailInput).toBeVisible();
    const inputBox = await emailInput.boundingBox();
    // Input should not overflow viewport
    expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(376);
  });

  test("404 page is responsive", async ({ page }) => {
    await page.goto("/xyz-not-found");
    await expect(page.locator("text=404")).toBeVisible();
    // Buttons should be visible and clickable
    const buttons = page.locator("a, button").filter({ hasText: /Dashboard|główna/i });
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
