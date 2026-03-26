/**
 * iron-rule.test.ts — Unit tests for the Iron Rule (core architectural invariant)
 *
 * Iron Rule: regionModifier applies ONLY to labor prices at display time.
 *            Material prices are sovereign base values — never multiplied by regionModifier.
 *
 * These tests guard against regressions in calcRowPrices and calcProjectTotals.
 * Run: npx vitest run tests/iron-rule.test.ts
 */

import { describe, it, expect } from "vitest";
import { calcRowPrices, calcProjectTotals } from "@/lib/pricing-calculations";
import type { ProjectItem } from "@/lib/types/database";

// ─── Test fixture ─────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ProjectItem> = {}): ProjectItem {
  return {
    id: "test-item-1",
    project_id: "test-project-1",
    catalog_item_id: null,
    name: "Test Item",
    unit: "szt",
    quantity: 1,
    final_material_price: 100,
    final_labor_price: 50,
    sort_order: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const ADJ_NONE = 1.0;       // no adjustment
const REGION_MAZOWIECKIE = 1.12;  // +12% Mazowieckie modifier
const REGION_PODKARPACKIE = 0.88; // -12% Podkarpackie modifier

// ─── 1. Iron Rule #1 — Material is NEVER affected by regionModifier ───────────

describe("Iron Rule #1 — Material prices are sovereign (no regionModifier)", () => {
  it("material unit price is identical regardless of regionModifier", () => {
    const item = makeItem({ final_material_price: 100, final_labor_price: 50 });

    const withRegion = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    const noRegion   = calcRowPrices(item, ADJ_NONE, false, "all", 1.0);

    expect(withRegion.materialUnit).toBe(noRegion.materialUnit);
    expect(withRegion.materialUnit).toBe(100);
  });

  it("material total is identical for Mazowieckie vs Podkarpackie", () => {
    const item = makeItem({ quantity: 5, final_material_price: 200, final_labor_price: 80 });

    const mazowieckie  = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    const podkarpackie = calcRowPrices(item, ADJ_NONE, false, "all", REGION_PODKARPACKIE);

    expect(mazowieckie.materialTotal).toBe(podkarpackie.materialTotal);
    expect(mazowieckie.materialTotal).toBe(1000); // 200 × 5
  });

  it("materialUnitBase (Sacred Cell) is never affected by regionModifier", () => {
    const item = makeItem({ final_material_price: 150 });
    const prices = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    expect(prices.materialUnitBase).toBe(150);
  });
});

// ─── 2. Iron Rule #2 — Labor IS affected by regionModifier ───────────────────

describe("Iron Rule #2 — Labor prices include regionModifier", () => {
  it("labor unit price scales with regionModifier", () => {
    const item = makeItem({ final_material_price: 100, final_labor_price: 50 });

    const withRegion = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    const noRegion   = calcRowPrices(item, ADJ_NONE, false, "all", 1.0);

    expect(withRegion.laborUnit).toBeCloseTo(50 * REGION_MAZOWIECKIE, 4);
    expect(noRegion.laborUnit).toBe(50);
    expect(withRegion.laborUnit).not.toBe(noRegion.laborUnit);
  });

  it("labor total for Mazowieckie (1.12) is 12% higher than base", () => {
    const item = makeItem({ quantity: 4, final_material_price: 100, final_labor_price: 50 });
    const prices = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);

    expect(prices.laborTotal).toBeCloseTo(50 * 4 * REGION_MAZOWIECKIE, 2);
  });

  it("labor total for Podkarpackie (0.88) is 12% lower than base", () => {
    const item = makeItem({ quantity: 2, final_material_price: 100, final_labor_price: 60 });
    const prices = calcRowPrices(item, ADJ_NONE, false, "all", REGION_PODKARPACKIE);

    expect(prices.laborTotal).toBeCloseTo(60 * 2 * REGION_PODKARPACKIE, 2);
  });

  it("laborUnitBase (Sacred Cell) is always BASE — no regionModifier", () => {
    const item = makeItem({ final_labor_price: 80 });
    const prices = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    // Base cell shows raw value, total shows with region
    expect(prices.laborUnitBase).toBe(80);
    expect(prices.laborUnit).toBeCloseTo(80 * REGION_MAZOWIECKIE, 4);
  });
});

// ─── 3. Iron Rule #3 — Manual prices skip regionModifier ─────────────────────

describe("Iron Rule #3 — Manual confidence_level skips regionModifier", () => {
  it("manual item labor is NOT affected by regionModifier", () => {
    const item = makeItem({
      final_labor_price: 100,
      confidence_level: "manual",
    });

    const withRegion = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    const noRegion   = calcRowPrices(item, ADJ_NONE, false, "all", 1.0);

    expect(withRegion.laborUnit).toBe(noRegion.laborUnit);
    expect(withRegion.laborUnit).toBe(100);
  });

  it("manual item material is NOT affected by regionModifier (material never is)", () => {
    const item = makeItem({
      final_material_price: 200,
      confidence_level: "manual",
    });

    const prices = calcRowPrices(item, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    expect(prices.materialUnit).toBe(200);
  });

  it("non-manual item IS affected; manual item of same base is NOT", () => {
    const base = makeItem({ final_labor_price: 100 });
    const manual = makeItem({ final_labor_price: 100, confidence_level: "manual" });

    const baseP   = calcRowPrices(base,   ADJ_NONE, false, "all", REGION_MAZOWIECKIE);
    const manualP = calcRowPrices(manual, ADJ_NONE, false, "all", REGION_MAZOWIECKIE);

    expect(baseP.laborUnit).toBeCloseTo(100 * REGION_MAZOWIECKIE, 4);
    expect(manualP.laborUnit).toBe(100);
  });
});

// ─── 4. adjustmentMult applies to BOTH material and labor ────────────────────

describe("adjustmentMult applies to both material and labor", () => {
  it("+15% adjustment increases both material and labor", () => {
    const item = makeItem({ final_material_price: 100, final_labor_price: 60 });
    const adj = 1.15;

    const prices = calcRowPrices(item, adj, false, "all", 1.0);

    expect(prices.materialUnit).toBeCloseTo(100 * adj, 4);
    expect(prices.laborUnit).toBeCloseTo(60 * adj, 4);
  });

  it("adjustmentMult and regionModifier are independent multipliers on labor", () => {
    const item = makeItem({ final_material_price: 100, final_labor_price: 60 });
    const adj = 1.10;
    const region = 1.12;

    const prices = calcRowPrices(item, adj, false, "all", region);

    expect(prices.laborUnit).toBeCloseTo(60 * adj * region, 4);
    expect(prices.materialUnit).toBeCloseTo(100 * adj, 4); // material: no region
  });
});

// ─── 5. materialsOwnedByCustomer zeroes out material ─────────────────────────

describe("materialsOwnedByCustomer zeroes material, labor unchanged", () => {
  it("customer-owned: material = 0, labor = unchanged", () => {
    const item = makeItem({ final_material_price: 200, final_labor_price: 80 });

    const prices = calcRowPrices(item, ADJ_NONE, true, "all", REGION_MAZOWIECKIE);

    expect(prices.materialUnit).toBe(0);
    expect(prices.materialTotal).toBe(0);
    expect(prices.laborUnit).toBeCloseTo(80 * REGION_MAZOWIECKIE, 4);
  });
});

// ─── 6. calcProjectTotals — Iron Rule at project level ───────────────────────

describe("calcProjectTotals — Iron Rule at project level", () => {
  it("totalMaterialNet is identical for different regions", () => {
    const items = [
      makeItem({ quantity: 2, final_material_price: 100, final_labor_price: 40 }),
      makeItem({ id: "2", quantity: 3, final_material_price: 50, final_labor_price: 20 }),
    ];

    const mazowieckie  = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.08, undefined, REGION_MAZOWIECKIE);
    const podkarpackie = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.08, undefined, REGION_PODKARPACKIE);

    // Material totals MUST be equal (Iron Rule)
    expect(mazowieckie.totalMaterialNet).toBe(podkarpackie.totalMaterialNet);
    expect(mazowieckie.totalMaterialNet).toBe(2 * 100 + 3 * 50); // 350
  });

  it("totalLaborNet differs by regionModifier factor", () => {
    const items = [makeItem({ quantity: 1, final_material_price: 0, final_labor_price: 100 })];

    const maz = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.08, undefined, REGION_MAZOWIECKIE);
    const pod = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.08, undefined, REGION_PODKARPACKIE);

    expect(maz.totalLaborNet).toBeCloseTo(100 * REGION_MAZOWIECKIE, 2);
    expect(pod.totalLaborNet).toBeCloseTo(100 * REGION_PODKARPACKIE, 2);
    expect(maz.totalLaborNet).not.toBe(pod.totalLaborNet);
  });

  it("default regionModifier=1.0 gives same result as explicit 1.0", () => {
    const items = [makeItem({ final_material_price: 200, final_labor_price: 80 })];

    const defaultRegion  = calcProjectTotals(items, ADJ_NONE, false);
    const explicitRegion = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.08, undefined, 1.0);

    expect(defaultRegion.totalMaterialNet).toBe(explicitRegion.totalMaterialNet);
    expect(defaultRegion.totalLaborNet).toBe(explicitRegion.totalLaborNet);
  });
});

// ─── 7. VAT Guard — 8% vs 23% ────────────────────────────────────────────────

describe("VAT Guard — correct rates applied per type", () => {
  it("residential (8% VAT) gives lower gross than commercial (23% VAT)", () => {
    const items = [makeItem({ final_material_price: 1000, final_labor_price: 500 })];

    const residential = calcProjectTotals(items, ADJ_NONE, false, 0.08, 0.08);
    const commercial  = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.23);

    expect(residential.totalGross).toBeLessThan(commercial.totalGross);
    expect(residential.totalNet).toBe(commercial.totalNet); // Net is same, VAT differs
  });

  it("VAT on material and labor are independent", () => {
    const items = [makeItem({ final_material_price: 1000, final_labor_price: 1000 })];

    const mixed = calcProjectTotals(items, ADJ_NONE, false, 0.23, 0.08);

    expect(mixed.vatMaterial).toBeCloseTo(1000 * 0.23, 2);
    expect(mixed.vatLabor).toBeCloseTo(1000 * 0.08, 2);
  });
});
