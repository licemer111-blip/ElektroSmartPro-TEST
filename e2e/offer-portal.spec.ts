import { test, expect } from "@playwright/test";

test.describe("Client offer portal", () => {
  test("invalid token shows error page", async ({ page }) => {
    await page.goto("/offer/invalid-token-12345");
    // Page shows "Nie znaleziono oferty" or error from getOfferByToken
    const errorText = page.getByText(/Nie znaleziono oferty|wygasł|Sprawdź poprawność/i).first();
    await expect(errorText).toBeVisible({ timeout: 15_000 });
  });

  test("offer page does not crash on invalid token", async ({ page }) => {
    const response = await page.goto("/offer/invalid-token-12345");
    // Page should render (200) - not a 500 server error
    expect(response?.status()).toBeLessThan(500);
  });
});
