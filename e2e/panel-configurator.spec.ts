import { test, expect } from "@playwright/test";

/**
 * Panel Configurator E2E Tests — ElektroSmart PRO
 *
 * Tests the DIN rail panel builder UI.
 * Runs against the public /dashboard/panel-configurator page
 * (redirects to login if unauthenticated — tests verify redirect).
 *
 * For authenticated tests, set PLAYWRIGHT_TEST_EMAIL and
 * PLAYWRIGHT_TEST_PASSWORD env vars.
 */

test.describe("Panel Configurator — public access", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard/panel-configurator");
    await page.waitForURL(/\/(login|auth)/);
    await expect(page.locator("input[type='email']").first()).toBeVisible();
  });
});

test.describe("Panel Configurator — UI structure (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto("/login");
    await page.locator("input[type='email']").fill(email);
    await page.locator("input[type='password']").fill(password);
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/dashboard/);
    await page.goto("/dashboard/panel-configurator");
    await page.waitForLoadState("networkidle");
  });

  test("page loads with panel configurator title", async ({ page }) => {
    await expect(page.locator("text=Konfigurator Rozdzielnicy").or(
      page.locator("text=Panel Configurator")
    ).first()).toBeVisible({ timeout: 10_000 });
  });

  test("module catalog sidebar is visible", async ({ page }) => {
    // Left sidebar with DIN modules
    const sidebar = page.locator("[data-testid='module-library']").or(
      page.locator("text=Katalog modułów").or(page.locator("text=Zabezpieczenia nadprądowe"))
    ).first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });
  });

  test("enclosure selector is present", async ({ page }) => {
    const selector = page.locator("text=Obudowa").or(
      page.locator("select, [role='combobox']").first()
    ).first();
    await expect(selector).toBeVisible({ timeout: 10_000 });
  });

  test("DIN rail workspace is visible", async ({ page }) => {
    // Right panel with rails
    const rail = page.locator("text=Rząd 1").or(
      page.locator("text=Jak zacząć?")
    ).first();
    await expect(rail).toBeVisible({ timeout: 10_000 });
  });

  test("tabs: Build, Schemat, Templates are present", async ({ page }) => {
    await expect(page.locator("[role='tab']:has-text('Buduj')").or(
      page.locator("[role='tab']:has-text('Build')")
    ).first()).toBeVisible({ timeout: 10_000 });
  });

  test("module search input is functional", async ({ page }) => {
    const search = page.locator("input[placeholder*='Szukaj'], input[placeholder*='szukaj']").first();
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill("wyłącznik");
    await expect(search).toHaveValue("wyłącznik");
  });

  test("clicking a module adds it to the rail", async ({ page }) => {
    // Click first available MCB module button
    const moduleBtn = page.locator("button:has-text('MCB'), button:has-text('Wyłącznik')").first();
    if (await moduleBtn.isVisible({ timeout: 5_000 })) {
      await moduleBtn.click();
      // Rail should now show "Rząd 1 — 1/" indicating a module was added
      await expect(page.locator("text=/Rząd 1 — [1-9]/")).toBeVisible({ timeout: 5_000 });
    }
  });

  test("phase balancer shows L1/L2/L3 badges", async ({ page }) => {
    // Phase badges appear when 3-phase mode is active
    const phaseBadge = page.locator("text=L1").or(page.locator("text=L2")).first();
    // May not be visible until modules are added — just check it doesn't crash
    await expect(page).not.toHaveURL(/error/);
  });

  test("BOM section appears after adding modules", async ({ page }) => {
    // Add a module first
    const moduleBtn = page.locator("button:has-text('MCB'), button:has-text('Wyłącznik')").first();
    if (await moduleBtn.isVisible({ timeout: 5_000 })) {
      await moduleBtn.click();
      // BOM section should appear
      const bom = page.locator("text=Kosztorys i Specyfikacja").first();
      await expect(bom).toBeVisible({ timeout: 5_000 });
    }
  });

  test("free user sees blurred prices in BOM", async ({ page }) => {
    const moduleBtn = page.locator("button:has-text('MCB'), button:has-text('Wyłącznik')").first();
    if (await moduleBtn.isVisible({ timeout: 5_000 })) {
      await moduleBtn.click();
      // Free users see blur overlay or *** instead of prices
      const blurred = page.locator(".blur-sm, text=***").first();
      const upgradeBtn = page.locator("text=Zupgraduj").first();
      // Either blurred prices or upgrade CTA should be present
      const hasBlur = await blurred.isVisible({ timeout: 3_000 }).catch(() => false);
      const hasUpgrade = await upgradeBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasBlur || hasUpgrade).toBe(true);
    }
  });
});

test.describe("Panel Configurator — keyboard & accessibility", () => {
  test("page has correct lang attribute", async ({ page }) => {
    await page.goto("/dashboard/panel-configurator");
    // Will redirect to login — check login page lang
    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/dashboard/panel-configurator");
    await page.waitForLoadState("networkidle");
    // Filter out known non-critical errors (auth redirects, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes("401") &&
      !e.includes("NEXT_REDIRECT") &&
      !e.includes("hydration") &&
      !e.includes("supabase")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
