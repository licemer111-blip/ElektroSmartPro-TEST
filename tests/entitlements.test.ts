/**
 * entitlements.test.ts — v2.1 trial + PRO entitlement logic.
 *
 * Pure unit tests for lib/auth/entitlements.ts. No DB, no mocks.
 * These lock the tier-resolution contract used by EVERY gate in the app
 * (AI quota, PDF watermark, project limit, UI badges).
 */

import { describe, it, expect } from "vitest";
import {
  TRIAL_DURATION_DAYS,
  isTrialActive,
  hasUsedTrial,
  getEffectiveIsPro,
  trialTimeRemainingMs,
  formatTrialRemaining,
  getEntitlementReason,
  type EntitlementProfile,
} from "@/lib/auth/entitlements";

// Fixed "now" for deterministic time-based tests.
// 2026-04-16T12:00:00Z (Europe/Warsaw is +02:00 → 14:00 local).
const NOW_MS = Date.parse("2026-04-16T12:00:00.000Z");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("TRIAL_DURATION_DAYS constant", () => {
  it("is exactly 7 — changing this changes the whole freemium model", () => {
    expect(TRIAL_DURATION_DAYS).toBe(7);
  });
});

describe("isTrialActive", () => {
  it("null / undefined profile → false", () => {
    expect(isTrialActive(null, NOW_MS)).toBe(false);
    expect(isTrialActive(undefined, NOW_MS)).toBe(false);
  });

  it("no trial_ends_at → false", () => {
    expect(isTrialActive({}, NOW_MS)).toBe(false);
    expect(isTrialActive({ trial_ends_at: null }, NOW_MS)).toBe(false);
  });

  it("trial_ends_at in the future → true", () => {
    const future = new Date(NOW_MS + 2 * MS_PER_DAY).toISOString();
    expect(isTrialActive({ trial_ends_at: future }, NOW_MS)).toBe(true);
  });

  it("trial_ends_at in the past → false", () => {
    const past = new Date(NOW_MS - 1 * MS_PER_DAY).toISOString();
    expect(isTrialActive({ trial_ends_at: past }, NOW_MS)).toBe(false);
  });

  it("trial_ends_at exactly now → false (strictly > now)", () => {
    const exactly = new Date(NOW_MS).toISOString();
    expect(isTrialActive({ trial_ends_at: exactly }, NOW_MS)).toBe(false);
  });

  it("malformed trial_ends_at → false (safe)", () => {
    expect(isTrialActive({ trial_ends_at: "not-a-date" }, NOW_MS)).toBe(false);
  });
});

describe("hasUsedTrial", () => {
  it("null / empty → false", () => {
    expect(hasUsedTrial(null)).toBe(false);
    expect(hasUsedTrial(undefined)).toBe(false);
    expect(hasUsedTrial({})).toBe(false);
    expect(hasUsedTrial({ trial_started_at: null })).toBe(false);
  });

  it("any non-null trial_started_at → true (active OR expired both count)", () => {
    expect(hasUsedTrial({ trial_started_at: "2026-04-10T00:00:00.000Z" })).toBe(true);
    expect(hasUsedTrial({ trial_started_at: "2025-01-01T00:00:00.000Z" })).toBe(true);
  });
});

describe("getEffectiveIsPro — THE gate used everywhere", () => {
  it("paid subscription → always PRO", () => {
    expect(getEffectiveIsPro({ is_pro: true }, NOW_MS)).toBe(true);
    // Even without trial fields
    expect(getEffectiveIsPro({ is_pro: true, trial_ends_at: null }, NOW_MS)).toBe(true);
    // Paid PRO with expired trial
    expect(
      getEffectiveIsPro(
        { is_pro: true, trial_ends_at: new Date(NOW_MS - MS_PER_DAY).toISOString() },
        NOW_MS,
      ),
    ).toBe(true);
  });

  it("not paid + active trial → effectively PRO", () => {
    const profile: EntitlementProfile = {
      is_pro: false,
      trial_started_at: "2026-04-12T12:00:00.000Z",
      trial_ends_at: new Date(NOW_MS + 2 * MS_PER_DAY).toISOString(),
    };
    expect(getEffectiveIsPro(profile, NOW_MS)).toBe(true);
  });

  it("not paid + expired trial → NOT PRO (critical abuse guard)", () => {
    const profile: EntitlementProfile = {
      is_pro: false,
      trial_started_at: "2026-04-01T00:00:00.000Z",
      trial_ends_at: "2026-04-08T00:00:00.000Z", // expired 8 days ago
    };
    expect(getEffectiveIsPro(profile, NOW_MS)).toBe(false);
  });

  it("not paid + never started trial → NOT PRO", () => {
    expect(getEffectiveIsPro({ is_pro: false }, NOW_MS)).toBe(false);
  });

  it("null / undefined → NOT PRO", () => {
    expect(getEffectiveIsPro(null, NOW_MS)).toBe(false);
    expect(getEffectiveIsPro(undefined, NOW_MS)).toBe(false);
  });
});

describe("trialTimeRemainingMs", () => {
  it("active trial → positive ms", () => {
    const profile: EntitlementProfile = {
      trial_ends_at: new Date(NOW_MS + 3 * MS_PER_DAY).toISOString(),
    };
    expect(trialTimeRemainingMs(profile, NOW_MS)).toBe(3 * MS_PER_DAY);
  });

  it("expired → 0 (clamped)", () => {
    const profile: EntitlementProfile = {
      trial_ends_at: new Date(NOW_MS - MS_PER_DAY).toISOString(),
    };
    expect(trialTimeRemainingMs(profile, NOW_MS)).toBe(0);
  });

  it("no trial → 0", () => {
    expect(trialTimeRemainingMs(null, NOW_MS)).toBe(0);
    expect(trialTimeRemainingMs({}, NOW_MS)).toBe(0);
  });
});

describe("formatTrialRemaining — Polish locale", () => {
  it("> 1 day → 'X dni Y godz.'", () => {
    const endsAt = new Date(NOW_MS + 3 * MS_PER_DAY + 5 * 60 * 60 * 1000).toISOString();
    expect(formatTrialRemaining({ trial_ends_at: endsAt }, NOW_MS)).toBe("3 dni 5 godz.");
  });

  it("< 1 day, > 1 hour → 'X godz. Y min'", () => {
    const endsAt = new Date(NOW_MS + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString();
    expect(formatTrialRemaining({ trial_ends_at: endsAt }, NOW_MS)).toBe("2 godz. 15 min");
  });

  it("< 1 hour → 'X min'", () => {
    const endsAt = new Date(NOW_MS + 35 * 60 * 1000).toISOString();
    expect(formatTrialRemaining({ trial_ends_at: endsAt }, NOW_MS)).toBe("35 min");
  });

  it("expired → empty string (UI skips rendering)", () => {
    const endsAt = new Date(NOW_MS - 10 * 60 * 1000).toISOString();
    expect(formatTrialRemaining({ trial_ends_at: endsAt }, NOW_MS)).toBe("");
  });

  it("no profile → empty", () => {
    expect(formatTrialRemaining(null, NOW_MS)).toBe("");
  });
});

describe("getEntitlementReason", () => {
  it("paid PRO → 'paid'", () => {
    expect(getEntitlementReason({ is_pro: true }, NOW_MS)).toBe("paid");
  });

  it("active trial → 'trial'", () => {
    const profile: EntitlementProfile = {
      is_pro: false,
      trial_ends_at: new Date(NOW_MS + MS_PER_DAY).toISOString(),
    };
    expect(getEntitlementReason(profile, NOW_MS)).toBe("trial");
  });

  it("expired trial → 'free'", () => {
    const profile: EntitlementProfile = {
      is_pro: false,
      trial_started_at: "2026-04-01T00:00:00.000Z",
      trial_ends_at: "2026-04-08T00:00:00.000Z",
    };
    expect(getEntitlementReason(profile, NOW_MS)).toBe("free");
  });

  it("never trialed + not paid → 'free'", () => {
    expect(getEntitlementReason({ is_pro: false }, NOW_MS)).toBe("free");
  });

  it("paid PRO + expired trial → 'paid' (paid wins)", () => {
    const profile: EntitlementProfile = {
      is_pro: true,
      trial_started_at: "2026-04-01T00:00:00.000Z",
      trial_ends_at: "2026-04-08T00:00:00.000Z",
    };
    expect(getEntitlementReason(profile, NOW_MS)).toBe("paid");
  });
});

describe("7-day trial end-to-end contract", () => {
  it("activation timeline: day 0 → active; day 6 → active; day 7 → expired", () => {
    const activationMs = NOW_MS;
    const endsAt = new Date(activationMs + 7 * MS_PER_DAY).toISOString();
    const profile: EntitlementProfile = {
      is_pro: false,
      trial_started_at: new Date(activationMs).toISOString(),
      trial_ends_at: endsAt,
    };

    // Day 0 (just activated)
    expect(getEffectiveIsPro(profile, activationMs)).toBe(true);
    // Day 3 (mid-trial)
    expect(getEffectiveIsPro(profile, activationMs + 3 * MS_PER_DAY)).toBe(true);
    // Day 6 (last full day)
    expect(getEffectiveIsPro(profile, activationMs + 6 * MS_PER_DAY)).toBe(true);
    // Day 7 (trial ended — boundary)
    expect(getEffectiveIsPro(profile, activationMs + 7 * MS_PER_DAY)).toBe(false);
    // Day 8 (expired)
    expect(getEffectiveIsPro(profile, activationMs + 8 * MS_PER_DAY)).toBe(false);

    // hasUsedTrial stays true forever after activation (prevents re-activation)
    expect(hasUsedTrial(profile)).toBe(true);
  });
});
