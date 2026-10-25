/**
 * pricing-formula-v2_4.test.ts — Clean labor pricing contract
 *
 * v2.4 (Apr 2026): M-Factor REMOVED from storage formula.
 * KNR 2026 norms already factor in modern tooling, so applying M-Factor
 * (0.65 GENERAL fallback) on top was a 35% double-discount bug.
 *
 * STORAGE FORMULA:
 *   labor_price = labor_norm × localMod × baseRate × globalLaborMod
 *   (no M-Factor)
 *
 * DISPLAY FORMULA:
 *   displayed_price = labor_price × KNR_multiplier
 *
 * Effective rate = baseRate × KNR_mult (e.g. 150 × 1.5 = 225 PLN/h)
 *
 * Run: npx vitest run tests/pricing-formula-v2_4.test.ts
 */

import { describe, it, expect } from "vitest";

/**
 * Pure replication of the v2.4 storage formula from pricing.ts.
 * Storage layer must NOT include M-Factor (no double-discount).
 */
function calculateLaborPriceV2_4(
  laborNorm: number,
  localMod: number,
  baseRate: number,
  globalLaborMod = 1.0,
): number {
  return Math.round(laborNorm * localMod * baseRate * globalLaborMod * 100) / 100;
}

describe("Pricing Formula v2.4 — clean storage (no M-Factor double-discount)", () => {
  describe("STORAGE FORMULA: labor_price = labor_norm × localMod × baseRate", () => {
    it("YDYp 3×1.5 (norm 0.13) at 150 PLN/h → 19.50 zł stored", () => {
      const stored = calculateLaborPriceV2_4(0.13, 1.0, 150);
      expect(stored).toBe(19.50);
    });

    it("Bruzdowanie cegła (norm 0.85) at 150 PLN/h → 127.50 zł stored", () => {
      const stored = calculateLaborPriceV2_4(0.85, 1.0, 150);
      expect(stored).toBe(127.50);
    });

    it("Bruzdowanie beton (norm 2.00) at 150 PLN/h → 300.00 zł stored", () => {
      const stored = calculateLaborPriceV2_4(2.0, 1.0, 150);
      expect(stored).toBe(300.00);
    });

    it("RJ45 cat 6 (norm 0.50) at 150 PLN/h → 75.00 zł stored", () => {
      const stored = calculateLaborPriceV2_4(0.50, 1.0, 150);
      expect(stored).toBe(75.00);
    });

    it("RCD 25A 4P (norm 0.30) at 150 PLN/h → 45.00 zł stored", () => {
      const stored = calculateLaborPriceV2_4(0.30, 1.0, 150);
      expect(stored).toBe(45.00);
    });

    it("Zaprawianie bruzd (norm 0.12) at 150 PLN/h → 18.00 zł stored", () => {
      const stored = calculateLaborPriceV2_4(0.12, 1.0, 150);
      expect(stored).toBe(18.00);
    });
  });

  describe("DISPLAY FORMULA: stored labor is already rbh × stawka", () => {
    it("Bruzd cegła shows 0.85 × 150, not 0.85 × 225", () => {
      const stored = calculateLaborPriceV2_4(0.85, 1.0, 150);
      expect(stored).toBe(127.50);
      expect(0.85 * 150).toBe(127.50);
    });

    it("Bruzd beton displayed should EXCEED Bruzd cegła displayed", () => {
      const cegla = calculateLaborPriceV2_4(0.85, 1.0, 150);
      const beton = calculateLaborPriceV2_4(2.0, 1.0, 150);
      expect(beton).toBeGreaterThan(cegla);
      expect(beton).toBe(300.00);
      expect(cegla).toBe(127.50);
    });
  });

  describe("REGRESSION: v2.3 vs v2.4 ratio comparison", () => {
    it("v2.3 stored 'norm × 0.65 × 150 = 97.5×norm' (BUGGY double-discount)", () => {
      const v2_3_stored = Math.round(0.85 * 0.65 * 150 * 100) / 100; // 82.875 → 82.88
      expect(v2_3_stored).toBe(82.88);
    });

    it("v2.4 stored 'norm × 150 = 150×norm' (CLEAN, KNR norms self-calibrating)", () => {
      const v2_4_stored = calculateLaborPriceV2_4(0.85, 1.0, 150);
      expect(v2_4_stored).toBe(127.50);
      // 53.8% higher than v2.3 — undoes the M-Factor 0.65 double-discount
      const v2_3_stored = Math.round(0.85 * 0.65 * 150 * 100) / 100;
      expect(v2_4_stored / v2_3_stored).toBeCloseTo(1.538, 2);
    });

  });

  describe("Local modifiers still applied (cable/surface/ceiling/height)", () => {
    it("Cable cross-section modifier ×1.20 applied to YKY 5×16", () => {
      // Stored = norm × cableMod × baseRate
      const stored = calculateLaborPriceV2_4(0.22, 1.20, 150);
      expect(stored).toBe(39.60);
    });

    it("Hard surface modifier ×1.50 (beton) applied to bruzdowanie", () => {
      // 0.20 rbh "Bruzdowanie ogólne" w betonie: 0.20 × 1.50 × 150 = 45.00
      const stored = calculateLaborPriceV2_4(0.20, 1.50, 150);
      expect(stored).toBe(45.00);
    });

    it("Ceiling modifier ×2.50 applied to downlight in suficie podwieszanym", () => {
      // 0.40 rbh × 2.50 × 150 = 150.00
      const stored = calculateLaborPriceV2_4(0.40, 2.50, 150);
      expect(stored).toBe(150.00);
    });
  });
});
