/**
 * complexity-factor.test.ts
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * Phase 7 — Lock Quick Estimate ConditionalFields → complexity_factor mapping.
 *
 * Prevents silent regressions in:
 *   - Multiplier values per ceiling height tier (1.0 / 1.25 / 1.50)
 *   - Expert systems uplift (×1.35 if ANY of SSP-addr / KNX / PA / RACS)
 *   - Combined factor rounding (3 decimals to keep DB roundtrip stable)
 *   - Polish breakdown strings rendered by SummaryFinancialTotals tooltip
 *
 * The factor flows through: createQuickEstimateProject → projects.complexity_factor
 *   → ProjectTabContainer → calcRowPrices(complexityFactor)
 *   → ProjectSummary.calculateTotals — see row-summary-parity.test.ts for parity.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { computeComplexityFromContext } from "@/lib/pricing-complexity";
import type { ConditionalFields } from "@/lib/quick-estimate-config";

describe("computeComplexityFromContext — base cases", () => {
  it("returns 1.0 for null", () => {
    expect(computeComplexityFromContext(null)).toEqual({
      factor: 1.0, ceilingMult: 1.0, expertMult: 1.0, breakdown: [],
    });
  });

  it("returns 1.0 for undefined", () => {
    expect(computeComplexityFromContext(undefined)).toEqual({
      factor: 1.0, ceilingMult: 1.0, expertMult: 1.0, breakdown: [],
    });
  });

  it("returns 1.0 for empty object", () => {
    expect(computeComplexityFromContext({})).toEqual({
      factor: 1.0, ceilingMult: 1.0, expertMult: 1.0, breakdown: [],
    });
  });
});

describe("computeComplexityFromContext — ceiling height", () => {
  it("'low' → ×1.00", () => {
    const r = computeComplexityFromContext({ ceilingHeight: "low" });
    expect(r.ceilingMult).toBe(1.00);
    expect(r.factor).toBe(1.00);
    expect(r.breakdown).toEqual([]);
  });

  it("'medium' (3-6m) → ×1.25", () => {
    const r = computeComplexityFromContext({ ceilingHeight: "medium" });
    expect(r.ceilingMult).toBe(1.25);
    expect(r.factor).toBe(1.25);
    expect(r.breakdown[0]).toMatch(/3.6m.*1\.25/);
  });

  it("'high' (>6m) → ×1.50", () => {
    const r = computeComplexityFromContext({ ceilingHeight: "high" });
    expect(r.ceilingMult).toBe(1.50);
    expect(r.factor).toBe(1.50);
    expect(r.breakdown[0]).toMatch(/>6m.*1\.50/);
  });
});

describe("computeComplexityFromContext — expert systems", () => {
  it("none active → ×1.00", () => {
    const r = computeComplexityFromContext({});
    expect(r.expertMult).toBe(1.00);
  });

  it("SSP basic does NOT trigger expert (only addressable does)", () => {
    const r = computeComplexityFromContext({ sspComplexity: "basic" });
    expect(r.expertMult).toBe(1.00);
    expect(r.factor).toBe(1.00);
  });

  it("SSP addressable → ×1.35", () => {
    const r = computeComplexityFromContext({ sspComplexity: "addressable" });
    expect(r.expertMult).toBe(1.35);
    expect(r.factor).toBe(1.35);
    expect(r.breakdown[0]).toMatch(/SSP adresowalny/);
  });

  it("roomManagement (KNX) → ×1.35", () => {
    const r = computeComplexityFromContext({ roomManagement: true });
    expect(r.expertMult).toBe(1.35);
    expect(r.breakdown[0]).toMatch(/KNX.RCU/);
  });

  it("paSystem → ×1.35", () => {
    const r = computeComplexityFromContext({ paSystem: true });
    expect(r.expertMult).toBe(1.35);
    expect(r.breakdown[0]).toMatch(/PA/);
  });

  it("accessControl (RACS) → ×1.35", () => {
    const r = computeComplexityFromContext({ accessControl: true });
    expect(r.expertMult).toBe(1.35);
    expect(r.breakdown[0]).toMatch(/RACS/);
  });

  it("multiple expert systems → still ×1.35 (uplift is additive in tag list, not multiplier)", () => {
    const r = computeComplexityFromContext({
      sspComplexity: "addressable",
      roomManagement: true,
      paSystem: true,
      accessControl: true,
    });
    expect(r.expertMult).toBe(1.35);
    expect(r.breakdown[0]).toContain("SSP adresowalny");
    expect(r.breakdown[0]).toContain("KNX/RCU");
    expect(r.breakdown[0]).toContain("PA");
    expect(r.breakdown[0]).toContain("RACS");
  });
});

describe("computeComplexityFromContext — combined", () => {
  it("hala >6m + SSP addressable → 1.50 × 1.35 = 2.025", () => {
    const r = computeComplexityFromContext({
      ceilingHeight: "high",
      sspComplexity: "addressable",
    });
    expect(r.ceilingMult).toBe(1.50);
    expect(r.expertMult).toBe(1.35);
    expect(r.factor).toBe(2.025);
    expect(r.breakdown).toHaveLength(2);
  });

  it("hala 3-6m + KNX → 1.25 × 1.35 = 1.6875 (rounded to 1.688)", () => {
    const r = computeComplexityFromContext({
      ceilingHeight: "medium",
      roomManagement: true,
    });
    expect(r.factor).toBe(1.688);
    expect(r.breakdown).toHaveLength(2);
  });

  it("rounds to 3 decimals for DB roundtrip stability", () => {
    // 1.25 × 1.35 = 1.6875 exactly; should round to 1.688
    const r = computeComplexityFromContext({
      ceilingHeight: "medium",
      paSystem: true,
    });
    expect(r.factor.toString()).toMatch(/^1\.6\d\d?$/);
    expect(r.factor).toBe(1.688);
  });

  it("ignores non-multiplier fields (floors, evChargers, lanCategory)", () => {
    const ctx: ConditionalFields = {
      floors: 3,
      evChargers: 5,
      lanCategory: "cat6a",
      finishStandard: "luxury",
      installationType: "flush",
    };
    expect(computeComplexityFromContext(ctx).factor).toBe(1.0);
  });
});

describe("computeComplexityFromContext — Quick Estimate Wizard scenarios", () => {
  // These mirror the wizard's StepDetails.tsx UI choices. Each scenario locks
  // the user-facing label "Mnożnik kompleksowości: ×N" against the actual
  // multiplier applied to labor.

  it("hala produkcyjna 4m + SSP konwencjonalny + brak ekspertów → ×1.25", () => {
    expect(computeComplexityFromContext({
      ceilingHeight: "medium",
      sspComplexity: "basic",
    }).factor).toBe(1.25);
  });

  it("hala produkcyjna 8m + SSP adresowalny → ×2.025", () => {
    expect(computeComplexityFromContext({
      ceilingHeight: "high",
      sspComplexity: "addressable",
    }).factor).toBe(2.025);
  });

  it("hotel + RCU + PA + RACS (3 expert systems) → ×1.35 (still single uplift)", () => {
    expect(computeComplexityFromContext({
      roomManagement: true,
      paSystem: true,
      accessControl: true,
    }).factor).toBe(1.35);
  });

  it("typowy mieszkanie (no fields → no uplift) → ×1.00", () => {
    expect(computeComplexityFromContext({
      floors: 1,
      finishStandard: "standard",
      installationType: "flush",
    }).factor).toBe(1.00);
  });
});
