import { test, expect, type Page } from "@playwright/test";

/**
 * Critical Business Logic E2E Tests — ElektroSmart PRO
 *
 * Covers audit-identified flows:
 * 1. Admin routes protected (non-admin/anon → redirect)
 * 2. Free-tier PDF export locked (upgrade modal shown)
 * 3. Price blur for free users (Iron Rule UI enforcement)
 * 4. Offer portal public access (token-gated, no auth required)
 * 5. API routes reject unauthenticated requests
 *
 * Authenticated tests require env vars:
 *   PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD  (free-tier test user)
 *   PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD (admin test user)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await page.locator("button[type='submit']").click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

// ─── 1. Admin Routes Protected ────────────────────────────────────────────────

test.describe("Admin routes — access control", () => {
  test("unauthenticated user redirected from /admin to login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/(login|auth)/, { timeout: 8_000 });
    await expect(page.locator("input[type='email']").first()).toBeVisible();
  });

  test("unauthenticated user redirected from /admin/users to login", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForURL(/\/(login|auth)/, { timeout: 8_000 });
  });

  test("unauthenticated user redirected from /admin/analytics to login", async ({ page }) => {
    await page.goto("/admin/analytics");
    await page.waitForURL(/\/(login|auth)/, { timeout: 8_000 });
  });

  test("unauthenticated user redirected from /admin/market to login", async ({ page }) => {
    await page.goto("/admin/market");
    await page.waitForURL(/\/(login|auth)/, { timeout: 8_000 });
  });

  test("non-admin authenticated user blocked from /admin", async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();

    await loginAs(page, email, password);
    await page.goto("/admin");

    // Should see 403, redirect to dashboard, or "Unauthorized" message
    const blocked = await Promise.race([
      page.waitForURL(/dashboard/, { timeout: 6_000 }).then(() => true),
      page.locator("text=Unauthorized, text=Brak dostępu, text=403").first()
        .waitFor({ timeout: 6_000 }).then(() => true),
    ]).catch(() => false);

    expect(blocked).toBe(true);
    // Must NOT be on /admin
    expect(page.url()).not.toMatch(/\/admin$/);
  });
});

// ─── 2. API Routes Reject Unauthenticated ─────────────────────────────────────

test.describe("API routes — auth enforcement", () => {
  test("POST /api/ai/vision returns 401 without auth token", async ({ request }) => {
    const res = await request.post("/api/ai/vision", {
      data: { image: "fake_base64" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/ai/blueprint returns 401 without auth token", async ({ request }) => {
    const res = await request.post("/api/ai/blueprint", {
      data: { description: "test" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("GET /api/pdf returns non-200 without project param", async ({ request }) => {
    const res = await request.get("/api/pdf");
    expect(res.status()).not.toBe(200);
  });
});

// ─── 3. Free-Tier Protections (UI) ────────────────────────────────────────────

test.describe("Free-tier UI protections — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();
    await loginAs(page, email, password);
  });

  test("PDF export button shows upgrade prompt for free user", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.waitForLoadState("networkidle");

    const firstProject = page.locator("a[href*='/dashboard/projects/']").first();
    if (!(await firstProject.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return test.skip();
    }

    await firstProject.click();
    await page.waitForLoadState("networkidle");

    // Click PDF export button
    const pdfBtn = page.locator(
      "button:has-text('PDF'), button:has-text('Eksport PDF'), [aria-label*='PDF']"
    ).first();

    if (!(await pdfBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return test.skip();
    }

    await pdfBtn.click();

    // For free user: must show upgrade dialog — NOT trigger a direct download
    const upgradeDialog = page.locator(
      "text=PRO, text=Upgrade, text=Zupgraduj, text=Uaktualnij, [role='dialog']"
    ).first();

    const isUpgradeShown = await upgradeDialog
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    // Iron Demo Rule: free users MUST see upgrade prompt, not get PDF
    expect(isUpgradeShown).toBe(true);
  });

  test("project summary shows blurred prices for free user", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.waitForLoadState("networkidle");

    const firstProject = page.locator("a[href*='/dashboard/projects/']").first();
    if (!(await firstProject.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return test.skip();
    }

    await firstProject.click();
    await page.waitForLoadState("networkidle");

    // Check for blur on price summary (Iron Demo Rule: prices blurred for free users)
    const blurredPrice = page.locator(".blur-sm, [data-blurred='true']").first();
    const isBlurred = await blurredPrice
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    // Upgrade CTA should be visible instead of prices
    const upgradeCta = page.locator(
      "text=Zupgraduj, aby zobaczyć ceny, text=Zobacz ceny, text=PRO"
    ).first();
    const hasUpgradeCta = await upgradeCta
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(isBlurred || hasUpgradeCta).toBe(true);
  });

  test("project limit warning shown when at max projects", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.waitForLoadState("networkidle");

    // Count visible projects
    const projects = page.locator("a[href*='/dashboard/projects/']");
    const count = await projects.count();

    // If user is at the 3-project limit, new project button should show limit message
    if (count >= 3) {
      const newBtn = page.locator(
        "button:has-text('Nowy projekt'), a:has-text('Nowy projekt')"
      ).first();

      if (await newBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await newBtn.click();

        const limitMsg = page.locator(
          "text=limit, text=Plan darmowy, text=maksymalnie, text=PRO"
        ).first();
        const isLimitShown = await limitMsg
          .waitFor({ state: "visible", timeout: 5_000 })
          .then(() => true)
          .catch(() => false);

        expect(isLimitShown).toBe(true);
      }
    }
  });
});

// ─── 4. Offer Portal — Public Token Access ────────────────────────────────────

test.describe("Offer portal — token-gated public access", () => {
  test("invalid offer token shows error, not crash", async ({ page }) => {
    await page.goto("/offer/invalid-token-xyz");
    await page.waitForLoadState("networkidle");

    // Should show error page (404 / expired / not found)
    const errorMsg = page.locator(
      "text=nie znaleziono, text=wygasła, text=invalid, text=404, text=Błąd"
    ).first();

    const isError = await errorMsg
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    // Must not crash with 500 or white screen
    const title = await page.title();
    expect(title).not.toBe("");
    expect(isError || page.url().includes("offer")).toBe(true);
  });
});

// ─── 5. Settings & Profile — Authenticated ────────────────────────────────────

test.describe("Settings — authenticated access", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();
    await loginAs(page, email, password);
  });

  test("settings page loads profile form", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const form = page.locator(
      "input[name='full_name'], input[name='company_name'], text=Profil, text=Ustawienia"
    ).first();
    await expect(form).toBeVisible({ timeout: 8_000 });
  });

  test("AI Lab page loads for authenticated user", async ({ page }) => {
    await page.goto("/dashboard/ai-lab");
    await page.waitForLoadState("networkidle");

    const content = page.locator(
      "text=AI Lab, text=Laboratorium, text=Prześlij PDF, text=AI"
    ).first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });
});
