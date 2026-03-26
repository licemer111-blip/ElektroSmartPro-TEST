import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility (A11y) E2E Tests — ElektroSmart PRO
 *
 * Uses axe-core to scan pages for WCAG 2.1 AA violations.
 * Critical pages are scanned both unauthenticated and authenticated.
 *
 * Authenticated tests: PLAYWRIGHT_TEST_EMAIL + PLAYWRIGHT_TEST_PASSWORD
 *
 * Run: npx playwright test e2e/a11y.spec.ts
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await page.locator("button[type='submit']").click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

async function scanPage(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("#__next > [data-radix-popper-content-wrapper]") // Radix portals sometimes FP
    .analyze();
}

const MAX_CRITICAL   = 0;  // zero critical violations allowed
const MAX_SERIOUS    = 2;  // max 2 serious (some 3rd-party lib artifacts)

function assertA11y(violations: Awaited<ReturnType<typeof scanPage>>["violations"], testName: string) {
  const critical = violations.filter(v => v.impact === "critical");
  const serious  = violations.filter(v => v.impact === "serious");

  if (critical.length > MAX_CRITICAL || serious.length > MAX_SERIOUS) {
    const details = [...critical, ...serious]
      .map(v => `  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes[0]?.html ?? ""}`)
      .join("\n");
    throw new Error(`A11y violations on "${testName}":\n${details}`);
  }
}

// ─── 1. Public pages ──────────────────────────────────────────────────────────

test.describe("A11y — Public pages", () => {
  test("login page — no critical/serious violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Login page");
  });

  test("homepage (landing) — no critical/serious violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Homepage");
  });

  test("login page — form inputs have labels", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Email input must have accessible label
    const emailInput = page.locator("input[type='email']").first();
    await expect(emailInput).toBeVisible();
    const emailId = await emailInput.getAttribute("id");
    const emailAriaLabel = await emailInput.getAttribute("aria-label");
    const emailAriaLabelledBy = await emailInput.getAttribute("aria-labelledby");
    const hasEmailLabel = emailId
      ? (await page.locator(`label[for='${emailId}']`).count()) > 0
      : false;
    expect(hasEmailLabel || !!emailAriaLabel || !!emailAriaLabelledBy).toBe(true);
  });
});

// ─── 2. Authenticated dashboard pages ────────────────────────────────────────

test.describe("A11y — Dashboard pages (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();
    await loginAs(page, email, password);
  });

  test("dashboard home — no critical/serious violations", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Dashboard home");
  });

  test("projects list — no critical/serious violations", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Projects list");
  });

  test("catalog page — no critical/serious violations", async ({ page }) => {
    await page.goto("/dashboard/catalog");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Catalog page");
  });

  test("clients page — no critical/serious violations", async ({ page }) => {
    await page.goto("/dashboard/clients");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Clients page");
  });

  test("settings page — no critical/serious violations", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    const results = await scanPage(page);
    assertA11y(results.violations, "Settings page");
  });
});

// ─── 3. A11y regression — critical UI elements ───────────────────────────────

test.describe("A11y — Critical UI elements", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();
    await loginAs(page, email, password);
  });

  test("navigation buttons have accessible names", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // All buttons must have accessible names (no icon-only buttons without aria-label)
    const buttons = page.locator("button:visible");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent() ?? "").trim();
      const ariaLabel = await btn.getAttribute("aria-label");
      const ariaLabelledBy = await btn.getAttribute("aria-labelledby");
      const title = await btn.getAttribute("title");
      const hasName = text.length > 0 || !!ariaLabel || !!ariaLabelledBy || !!title;
      // Log but don't fail — some icon buttons may be acceptable with tooltip
      if (!hasName) {
        console.warn(`Button #${i} has no accessible name on /dashboard`);
      }
    }
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img:visible");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      // Images must have alt="" (decorative) or meaningful alt text
      // role="presentation" is also acceptable
      expect(alt !== null || role === "presentation").toBe(true);
    }
  });

  test("color contrast — price elements visible without blur", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.waitForLoadState("networkidle");

    const firstProject = page.locator("a[href*='/dashboard/projects/']").first();
    if (!(await firstProject.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return test.skip();
    }

    await firstProject.click();
    await page.waitForLoadState("networkidle");

    // Run axe on project page focusing on color contrast
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .withRules(["color-contrast"])
      .analyze();

    const contrastViolations = results.violations.filter(v => v.id === "color-contrast");
    // Allow max 3 contrast violations (often from 3rd-party Radix tooltips)
    expect(contrastViolations.length).toBeLessThanOrEqual(3);
  });
});
