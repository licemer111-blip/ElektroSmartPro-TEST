import { test, expect, type Page } from "@playwright/test";

/**
 * Performance Budget E2E Tests — ElektroSmart PRO
 *
 * Enforces maximum load times for critical pages.
 * Tests use Navigation Timing API for precise measurement.
 *
 * Budgets (production SLA):
 *   - Public pages (login, homepage):  < 3 000 ms
 *   - Dashboard pages:                 < 5 000 ms
 *   - Heavy pages (AI Lab, catalog):   < 7 000 ms
 *
 * Run: npx playwright test e2e/performance.spec.ts
 */

// ─── Budgets ──────────────────────────────────────────────────────────────────

const BUDGET = {
  public:    3_000,
  dashboard: 5_000,
  heavy:     7_000,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await page.locator("button[type='submit']").click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

/**
 * Measure full page load time using Navigation Timing API.
 * Returns domContentLoadedEventEnd - navigationStart (ms).
 */
async function measurePageLoad(page: Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const elapsed = Date.now() - start;

  // Also collect Navigation Timing for more precise measurement
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return null;
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadComplete: nav.loadEventEnd - nav.startTime,
      ttfb: nav.responseStart - nav.requestStart,
    };
  });

  // Use wall-clock time as the primary metric (includes SSR + hydration)
  return timing?.loadComplete || elapsed;
}

/**
 * Measure Largest Contentful Paint (LCP) — key Web Vital.
 * Returns LCP in ms, or -1 if not available.
 */
async function measureLCP(page: Page): Promise<number> {
  return page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let lcp = -1;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          lcp = entries[entries.length - 1].startTime;
        }
      });
      try {
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        resolve(-1);
        return;
      }
      // Give LCP observer 3s to fire
      setTimeout(() => {
        observer.disconnect();
        resolve(lcp);
      }, 3_000);
    });
  });
}

// ─── 1. Public pages ──────────────────────────────────────────────────────────

test.describe("Performance — Public pages", () => {
  test(`login page loads under ${BUDGET.public}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/login");
    expect(duration).toBeLessThan(BUDGET.public);
  });

  test(`homepage loads under ${BUDGET.public}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/");
    expect(duration).toBeLessThan(BUDGET.public);
  });

  test("login page TTFB under 800ms", async ({ page }) => {
    await page.goto("/login");
    const ttfb = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return nav ? nav.responseStart - nav.requestStart : -1;
    });
    if (ttfb > 0) {
      expect(ttfb).toBeLessThan(800);
    }
  });
});

// ─── 2. Dashboard pages (authenticated) ──────────────────────────────────────

test.describe("Performance — Dashboard pages (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();
    await loginAs(page, email, password);
  });

  test(`projects list loads under ${BUDGET.dashboard}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/projects");
    expect(duration).toBeLessThan(BUDGET.dashboard);
  });

  test(`clients page loads under ${BUDGET.dashboard}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/clients");
    expect(duration).toBeLessThan(BUDGET.dashboard);
  });

  test(`catalog page loads under ${BUDGET.dashboard}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/catalog");
    expect(duration).toBeLessThan(BUDGET.dashboard);
  });

  test(`settings page loads under ${BUDGET.dashboard}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/settings");
    expect(duration).toBeLessThan(BUDGET.dashboard);
  });

  test(`analytics page loads under ${BUDGET.dashboard}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/analytics");
    expect(duration).toBeLessThan(BUDGET.dashboard);
  });
});

// ─── 3. Heavy pages ───────────────────────────────────────────────────────────

test.describe("Performance — Heavy pages (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
    if (!email || !password) return test.skip();
    await loginAs(page, email, password);
  });

  test(`AI Lab loads under ${BUDGET.heavy}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/ai-lab");
    expect(duration).toBeLessThan(BUDGET.heavy);
  });

  test(`assemblies page loads under ${BUDGET.heavy}ms`, async ({ page }) => {
    const duration = await measurePageLoad(page, "/dashboard/assemblies");
    expect(duration).toBeLessThan(BUDGET.heavy);
  });
});

// ─── 4. Web Vitals — LCP ─────────────────────────────────────────────────────

test.describe("Web Vitals — LCP", () => {
  test("login page LCP under 2500ms (Google 'Good' threshold)", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const lcp = await measureLCP(page);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2_500);
    }
  });

  test("homepage LCP under 2500ms", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const lcp = await measureLCP(page);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2_500);
    }
  });
});

// ─── 5. Bundle — no huge resources ───────────────────────────────────────────

test.describe("Performance — Resource size budget", () => {
  test("no single JS chunk over 1MB on login page", async ({ page }) => {
    const oversizedChunks: string[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      const contentType = response.headers()["content-type"] ?? "";
      if (!contentType.includes("javascript")) return;

      try {
        const body = await response.body();
        if (body.length > 1_024 * 1_024) {
          oversizedChunks.push(`${url} (${(body.length / 1024).toFixed(0)}KB)`);
        }
      } catch {
        // Response already consumed — skip
      }
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    expect(oversizedChunks).toHaveLength(0);
  });

  test("total JS transfer on login page under 3MB", async ({ page }) => {
    let totalJsBytes = 0;

    page.on("response", async (response) => {
      const contentType = response.headers()["content-type"] ?? "";
      if (!contentType.includes("javascript")) return;
      try {
        const body = await response.body();
        totalJsBytes += body.length;
      } catch {
        // ignore
      }
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const totalMB = totalJsBytes / (1024 * 1024);
    expect(totalMB).toBeLessThan(3);
  });
});
