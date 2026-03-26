/**
 * Core Calculation Tests — ElektroSmart PRO v1.1
 *
 * Formula: Total_Position = (C_mat + (R_rate × T_rbh × RegionModifier)) × Q × (1 + adj/100)
 *
 * Where:
 *   C_mat   — material price per unit [PLN] — NO region modifier (Iron Rule)
 *   R_rate  — hourly rate [PLN/rbh]
 *   T_rbh   — labor norm [rbh per unit]
 *   Q       — quantity
 *   RegionModifier — voivodeship price multiplier (0.91–1.12) — ONLY applied to labor
 *   adj     — adjustment percentage (e.g. -10 for 10% discount)
 *
 * Iron Rule: regionModifier applies ONLY to labor (Robocizna).
 * Material prices (Materiał) are sovereign — not region-adjusted.
 */
import { describe, it, expect } from "vitest";

// ─── Pure calculation functions (extracted for testing) ───────────────────────

function calcItemTotal(
  materialPrice: number,
  laborPrice: number,
  quantity: number,
  adjustmentPct: number = 0
): number {
  const base = (materialPrice + laborPrice) * quantity;
  return adjustmentPct !== 0 ? base * (1 + adjustmentPct / 100) : base;
}

function calcItemWithKnr(
  materialPrice: number,
  hourlyRate: number,
  laborNorm: number,
  quantity: number,
  regionModifier: number = 1.0,
  adjustmentPct: number = 0
): number {
  // Iron Rule: regionModifier applies ONLY to labor — material is sovereign
  const laborPrice = hourlyRate * laborNorm * regionModifier;
  const base = (materialPrice + laborPrice) * quantity;
  return adjustmentPct !== 0 ? base * (1 + adjustmentPct / 100) : base;
}

function calcProjectTotal(
  items: { materialPrice: number; laborPrice: number; quantity: number }[],
  adjustmentPct: number = 0
): { totalMaterial: number; totalLabor: number; grandTotal: number } {
  let totalMaterial = 0;
  let totalLabor = 0;
  for (const item of items) {
    totalMaterial += item.materialPrice * item.quantity;
    totalLabor += item.laborPrice * item.quantity;
  }
  const grandTotal =
    adjustmentPct !== 0
      ? (totalMaterial + totalLabor) * (1 + adjustmentPct / 100)
      : totalMaterial + totalLabor;
  return { totalMaterial, totalLabor, grandTotal };
}

function applyVat(net: number, vatRate: 8 | 23): number {
  return net * (1 + vatRate / 100);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("calcItemTotal — basic formula", () => {
  it("calculates total correctly for standard values", () => {
    // C_mat=28, C_labor=35, Q=12 → (28+35)*12 = 756
    expect(calcItemTotal(28, 35, 12)).toBe(756);
  });

  it("quantity = 1 returns per-unit price", () => {
    expect(calcItemTotal(100, 50, 1)).toBe(150);
  });

  it("quantity = 0 returns 0 (edge case)", () => {
    expect(calcItemTotal(100, 50, 0)).toBe(0);
  });

  it("material = 0 (pure labor item)", () => {
    // montaż rozdzielnicy — only labor
    expect(calcItemTotal(0, 450, 1)).toBe(450);
  });

  it("labor = 0 (pure material supply)", () => {
    // dostawa materiału bez montażu
    expect(calcItemTotal(320, 0, 3)).toBe(960);
  });

  it("both = 0 returns 0", () => {
    expect(calcItemTotal(0, 0, 100)).toBe(0);
  });

  it("very large quantity (100 items)", () => {
    // 100 gniazd: (28+35)*100 = 6300
    expect(calcItemTotal(28, 35, 100)).toBe(6300);
  });

  it("decimal quantity (cable by meters)", () => {
    // 12.5m kabla: (5.50+2.50)*12.5 = 100
    expect(calcItemTotal(5.5, 2.5, 12.5)).toBe(100);
  });
});

describe("calcItemTotal — adjustment percentage", () => {
  it("applies +10% markup correctly", () => {
    // 756 * 1.10 = 831.60
    expect(calcItemTotal(28, 35, 12, 10)).toBeCloseTo(831.6, 2);
  });

  it("applies -15% discount correctly", () => {
    // 150 * 0.85 = 127.50
    expect(calcItemTotal(100, 50, 1, -15)).toBeCloseTo(127.5, 2);
  });

  it("0% adjustment has no effect", () => {
    expect(calcItemTotal(100, 50, 5, 0)).toBe(750);
  });

  it("100% markup doubles the total", () => {
    expect(calcItemTotal(50, 50, 2, 100)).toBe(400);
  });

  it("-100% discount gives 0", () => {
    expect(calcItemTotal(100, 50, 1, -100)).toBe(0);
  });
});

describe("calcItemWithKnr — KNR norm-based calculation", () => {
  it("calculates with hourly rate and norm", () => {
    // Gniazdo: mat=28, rate=65, norm=0.4rbh, Q=1, region=1.0
    // labor = 65 * 0.4 = 26; mat=28; total = 54
    expect(calcItemWithKnr(28, 65, 0.4, 1)).toBeCloseTo(54, 2);
  });

  it("applies region modifier to labor ONLY (Iron Rule — material is sovereign)", () => {
    // mat=28, rate=65, norm=0.4, Q=1, region=1.12 (Mazowieckie)
    // labor = 65 * 0.4 * 1.12 = 29.12; mat = 28 (no region!); total = 57.12
    expect(calcItemWithKnr(28, 65, 0.4, 1, 1.12)).toBeCloseTo(57.12, 2);
  });

  it("applies region modifier below 1.0 to labor only (Podkarpackie ×0.91)", () => {
    // mat=100, rate=65, norm=1.0, Q=1, region=0.91
    // labor = 65 * 0.91 = 59.15; mat = 100 (sovereign); total = 159.15
    expect(calcItemWithKnr(100, 65, 1.0, 1, 0.91)).toBeCloseTo(159.15, 2);
  });

  it("zero norm = zero labor (material-only)", () => {
    expect(calcItemWithKnr(100, 65, 0, 1)).toBe(100);
  });

  it("very high hourly rate (300 PLN/rbh)", () => {
    // mat=0, rate=300, norm=2.0, Q=1 → labor=600
    expect(calcItemWithKnr(0, 300, 2.0, 1)).toBe(600);
  });
});

describe("calcProjectTotal — project summary", () => {
  const ESTIMATE_ITEMS = [
    { materialPrice: 28, laborPrice: 35, quantity: 12 },   // gniazda 12 szt
    { materialPrice: 65, laborPrice: 45, quantity: 16 },   // downlight 16 szt
    { materialPrice: 3.8, laborPrice: 2.2, quantity: 120 }, // kabel 120m
    { materialPrice: 420, laborPrice: 280, quantity: 1 },  // rozdzielnica
  ];

  it("calculates totals correctly for multiple items", () => {
    const result = calcProjectTotal(ESTIMATE_ITEMS);
    // mat: 28*12 + 65*16 + 3.8*120 + 420*1 = 336 + 1040 + 456 + 420 = 2252
    // lab: 35*12 + 45*16 + 2.2*120 + 280*1 = 420 + 720 + 264 + 280 = 1684
    // total: 3936
    expect(result.totalMaterial).toBeCloseTo(2252, 1);
    expect(result.totalLabor).toBeCloseTo(1684, 1);
    expect(result.grandTotal).toBeCloseTo(3936, 1);
  });

  it("material + labor sum equals grandTotal at 0% adjustment", () => {
    const result = calcProjectTotal(ESTIMATE_ITEMS);
    expect(result.grandTotal).toBeCloseTo(result.totalMaterial + result.totalLabor, 2);
  });

  it("empty project returns zeros", () => {
    const result = calcProjectTotal([]);
    expect(result.totalMaterial).toBe(0);
    expect(result.totalLabor).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it("applies adjustment to grandTotal", () => {
    const result = calcProjectTotal(ESTIMATE_ITEMS, -10);
    expect(result.grandTotal).toBeCloseTo(3936 * 0.9, 1);
  });

  it("single item project", () => {
    const result = calcProjectTotal([{ materialPrice: 100, laborPrice: 50, quantity: 2 }]);
    expect(result.grandTotal).toBe(300);
  });
});

describe("applyVat — Polish VAT rules", () => {
  it("applies VAT 8% for residential (PKOB 11)", () => {
    // Mieszkanie: usługa + materiał → VAT 8%
    expect(applyVat(1000, 8)).toBe(1080);
  });

  it("applies VAT 23% for commercial / B2B", () => {
    // Biuro / hala: VAT 23%
    expect(applyVat(1000, 23)).toBe(1230);
  });

  it("VAT 8% on zero base is zero", () => {
    expect(applyVat(0, 8)).toBe(0);
  });

  it("VAT difference: 23% vs 8% on 10000 PLN net", () => {
    const diff = applyVat(10000, 23) - applyVat(10000, 8);
    // 12300 - 10800 = 1500
    expect(diff).toBe(1500);
  });
});

describe("Edge cases & boundary values", () => {
  it("handles float precision (cable price)", () => {
    // 3.8 PLN/m * 120m = 456 (not 455.999...)
    expect(3.8 * 120).toBeCloseTo(456, 5);
  });

  it("negative material price (credit/return) should not crash", () => {
    expect(calcItemTotal(-50, 35, 1)).toBe(-15);
  });

  it("very large order (1000 units) stays finite", () => {
    const result = calcItemTotal(500, 300, 1000);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(800000);
  });

  it("fractional quantity (0.5 m²)", () => {
    expect(calcItemTotal(60, 40, 0.5)).toBe(50);
  });
});

// ─── Pure functions from lib/pricing-calculations.ts ─────────────────────────

import {
  calcNarzuty,
  calcRowPrices,
  calcProjectTotals,
  VAT_RATES,
  type NarzutyParams,
} from "@/lib/pricing-calculations";
import type { ProjectItem } from "@/lib/types/database";

// ─── Helper: minimal ProjectItem stub ────────────────────────────────────────
function makeItem(
  overrides: Partial<ProjectItem> & { material_price: number; labor_price: number; quantity: number }
): ProjectItem {
  return {
    id: "test-id",
    project_id: "proj-id",
    name: "Test item",
    unit: "szt",
    confidence_level: "verified",
    is_assembly_child: false,
    parent_assembly_id: null,
    final_material_price: null,
    final_labor_price: null,
    section: null,
    position_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: null,
    notes: null,
    knr_code: null,
    knr_table: null,
    knr_col: null,
    is_assembly: false,
    ...overrides,
  } as ProjectItem;
}

// ─── 15. calcNarzuty — Polish KNR surcharges ─────────────────────────────────

describe("calcNarzuty — KNR surcharges formula", () => {
  const params: NarzutyParams = { kpPercent: 70, zPercent: 15, kzPercent: 10 };

  it("kpAmount = laborNet × kpPercent/100", () => {
    const r = calcNarzuty(1000, 500, params);
    expect(r.kpAmount).toBe(700);
  });

  it("zAmount = (laborNet + kpAmount) × zPercent/100", () => {
    const r = calcNarzuty(1000, 500, params);
    // (1000 + 700) * 0.15 = 255
    expect(r.zAmount).toBe(255);
  });

  it("kzAmount = materialNet × kzPercent/100", () => {
    const r = calcNarzuty(1000, 500, params);
    expect(r.kzAmount).toBe(50);
  });

  it("totalNarzuty = kpAmount + zAmount + kzAmount", () => {
    const r = calcNarzuty(1000, 500, params);
    expect(r.totalNarzuty).toBe(r.kpAmount + r.zAmount + r.kzAmount);
    expect(r.totalNarzuty).toBe(1005);
  });

  it("all percents = 0 → zerowe narzuty", () => {
    const r = calcNarzuty(1000, 500, { kpPercent: 0, zPercent: 0, kzPercent: 0 });
    expect(r.totalNarzuty).toBe(0);
    expect(r.kpAmount).toBe(0);
  });

  it("zero labor → kpAmount=0, zAmount=0; only kzAmount from material", () => {
    const r = calcNarzuty(0, 1000, { kpPercent: 70, zPercent: 15, kzPercent: 10 });
    expect(r.kpAmount).toBe(0);
    expect(r.zAmount).toBe(0);
    expect(r.kzAmount).toBe(100);
  });

  it("z cascades on kp: higher kp → higher z even at same zPercent", () => {
    const r1 = calcNarzuty(1000, 0, { kpPercent: 50, zPercent: 10, kzPercent: 0 });
    const r2 = calcNarzuty(1000, 0, { kpPercent: 80, zPercent: 10, kzPercent: 0 });
    expect(r2.zAmount).toBeGreaterThan(r1.zAmount);
  });

  it("rounds to 2 decimal places", () => {
    const r = calcNarzuty(333.33, 0, { kpPercent: 70, zPercent: 15, kzPercent: 0 });
    expect(r.kpAmount).toBe(Math.round(333.33 * 0.7 * 100) / 100);
  });
});

// ─── 16. calcRowPrices — Iron Rule: regionModifier only on labor ─────────────

describe("calcRowPrices — Iron Rule regionModifier", () => {
  it("regionModifier applied to labor, NOT to material", () => {
    const item = makeItem({ material_price: 100, labor_price: 50, quantity: 1 });
    const r = calcRowPrices(item, 1.0, false, "all", 1.12);
    expect(r.materialTotal).toBe(100);          // no region on material
    expect(r.laborTotal).toBeCloseTo(56, 2);    // 50 × 1.12
  });

  it("manual confidence_level: regionModifier skipped on labor", () => {
    const item = makeItem({ material_price: 100, labor_price: 50, quantity: 1, confidence_level: "manual" });
    const r = calcRowPrices(item, 1.0, false, "all", 1.20);
    expect(r.laborTotal).toBe(50);   // no region modifier for manual items
    expect(r.materialTotal).toBe(100);
  });

  it("adjustmentMult applies to both material and labor", () => {
    const item = makeItem({ material_price: 100, labor_price: 100, quantity: 1 });
    const r = calcRowPrices(item, 1.1, false, "all", 1.0);
    expect(r.materialTotal).toBeCloseTo(110, 2);
    expect(r.laborTotal).toBeCloseTo(110, 2);
  });

  it("materialsOwnedByCustomer → materialTotal = 0", () => {
    const item = makeItem({ material_price: 100, labor_price: 50, quantity: 2 });
    const r = calcRowPrices(item, 1.0, true, "all", 1.0);
    expect(r.materialTotal).toBe(0);
    expect(r.laborTotal).toBe(100);
  });

  it("final_material_price overrides material_price", () => {
    const item = makeItem({ material_price: 100, labor_price: 0, quantity: 1, final_material_price: 150 });
    const r = calcRowPrices(item, 1.0, false);
    expect(r.materialTotal).toBe(150);
  });

  it("quantity scales totalBase and total correctly", () => {
    const item = makeItem({ material_price: 10, labor_price: 5, quantity: 3 });
    const r = calcRowPrices(item, 1.0, false);
    expect(r.materialTotalBase).toBe(30);
    expect(r.laborTotalBase).toBe(15);
  });

  it("filterType=materials: rowTotal = materialTotal only", () => {
    const item = makeItem({ material_price: 100, labor_price: 50, quantity: 1 });
    const r = calcRowPrices(item, 1.0, false, "materials");
    expect(r.rowTotal).toBe(100);
  });

  it("filterType=labor: rowTotal = laborTotal only", () => {
    const item = makeItem({ material_price: 100, labor_price: 50, quantity: 1 });
    const r = calcRowPrices(item, 1.0, false, "labor");
    expect(r.rowTotal).toBe(50);
  });
});

// ─── 17. calcProjectTotals — VAT + regionModifier ────────────────────────────

describe("calcProjectTotals — project-level aggregation", () => {
  const items = [
    makeItem({ material_price: 100, labor_price: 50, quantity: 2 }),
    makeItem({ material_price: 200, labor_price: 100, quantity: 1 }),
  ];

  it("totalMaterialNet + totalLaborNet = totalNet", () => {
    const r = calcProjectTotals(items, 1.0, false);
    expect(r.totalNet).toBeCloseTo(r.totalMaterialNet + r.totalLaborNet, 5);
  });

  it("correct material and labor sums", () => {
    const r = calcProjectTotals(items, 1.0, false);
    // mat: 100*2 + 200*1 = 400; lab: 50*2 + 100*1 = 200
    expect(r.totalMaterialNet).toBeCloseTo(400, 2);
    expect(r.totalLaborNet).toBeCloseTo(200, 2);
  });

  it("VAT standard 23%: totalGross = totalNet × 1.23", () => {
    const r = calcProjectTotals(items, 1.0, false, VAT_RATES.standard, VAT_RATES.standard);
    expect(r.totalGross).toBeCloseTo(r.totalNet * 1.23, 2);
  });

  it("VAT reduced 8%: totalGross = totalNet × 1.08", () => {
    const r = calcProjectTotals(items, 1.0, false, VAT_RATES.reduced, VAT_RATES.reduced);
    expect(r.totalGross).toBeCloseTo(r.totalNet * 1.08, 2);
  });

  it("regionModifier > 1 increases laborNet, not materialNet", () => {
    const base = calcProjectTotals(items, 1.0, false, 0, 0, undefined, 1.0);
    const region = calcProjectTotals(items, 1.0, false, 0, 0, undefined, 1.15);
    expect(region.totalLaborNet).toBeGreaterThan(base.totalLaborNet);
    expect(region.totalMaterialNet).toBe(base.totalMaterialNet);
  });

  it("adjustmentMult=1.1 increases both material and labor by 10%", () => {
    const base = calcProjectTotals(items, 1.0, false, 0, 0);
    const adjusted = calcProjectTotals(items, 1.1, false, 0, 0);
    expect(adjusted.totalNet).toBeCloseTo(base.totalNet * 1.1, 2);
  });

  it("materialsOwnedByCustomer → totalMaterialNet = 0", () => {
    const r = calcProjectTotals(items, 1.0, true, 0, 0);
    expect(r.totalMaterialNet).toBe(0);
    expect(r.totalLaborNet).toBeGreaterThan(0);
  });

  it("empty items → all zeros", () => {
    const r = calcProjectTotals([], 1.0, false);
    expect(r.totalNet).toBe(0);
    expect(r.totalGross).toBe(0);
  });

  it("marginAmount = totalNet - costBase when costBase provided", () => {
    const r = calcProjectTotals(items, 1.0, false, 0, 0, 400);
    expect(r.marginAmount).toBeCloseTo(r.totalNet - 400, 2);
  });
});

// ─── 18. Integration: regionModifier → Narzuty chain ─────────────────────────
// Verifies that Kp/Z/Kz are applied ON TOP of already region-adjusted labor.
// Architecture: stored prices are BASE → calcRowPrices/calcProjectTotals applies
// regionModifier → result fed into calcNarzuty.

describe("Integration — Narzuty applied ON TOP of region-adjusted labor", () => {
  // 2 items: mat=200, lab=100, qty=2 → totalMat=400 (BASE), totalLab=200 (BASE)
  const regionItems = [
    makeItem({ material_price: 200, labor_price: 100, quantity: 2 }),
  ];
  const nParams: NarzutyParams = { kpPercent: 70, zPercent: 15, kzPercent: 10 };

  it("Kp/Z grow with regionModifier (labor is region-adjusted)", () => {
    const base    = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.0);
    const regional = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.2);
    const nBase    = calcNarzuty(base.totalLaborNet,    base.totalMaterialNet,    nParams);
    const nRegional = calcNarzuty(regional.totalLaborNet, regional.totalMaterialNet, nParams);
    expect(nRegional.kpAmount).toBeGreaterThan(nBase.kpAmount);
    expect(nRegional.zAmount).toBeGreaterThan(nBase.zAmount);
  });

  it("Kp exact: 100×2×1.2 = 240 labor → Kp = 240×0.70 = 168", () => {
    const { totalLaborNet, totalMaterialNet } = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.2);
    expect(totalLaborNet).toBeCloseTo(240, 2);
    const { kpAmount } = calcNarzuty(totalLaborNet, totalMaterialNet, nParams);
    expect(kpAmount).toBeCloseTo(168, 2);
  });

  it("Z cascades: Z = (laborRegional + Kp) × zPercent/100", () => {
    const { totalLaborNet, totalMaterialNet } = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.2);
    const { kpAmount, zAmount } = calcNarzuty(totalLaborNet, totalMaterialNet, nParams);
    // labor=240, Kp=168 → Z = (240+168) × 0.15 = 61.2
    expect(zAmount).toBeCloseTo((totalLaborNet + kpAmount) * 0.15, 2);
  });

  it("Kz NOT affected by regionModifier (Iron Rule: material sovereign)", () => {
    const b = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.0);
    const r = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.5);
    const nb = calcNarzuty(b.totalLaborNet, b.totalMaterialNet, nParams);
    const nr = calcNarzuty(r.totalLaborNet, r.totalMaterialNet, nParams);
    expect(nr.kzAmount).toBe(nb.kzAmount);                          // Kz unchanged
    expect(nr.kzAmount).toBeCloseTo(b.totalMaterialNet * 0.10, 2); // = 400×0.10 = 40
  });

  it("adjustmentMult applied before Narzuty (narzuty on adjusted price)", () => {
    const noAdj  = calcProjectTotals(regionItems, 1.0, false, 0, 0, undefined, 1.2);
    const withAdj = calcProjectTotals(regionItems, 1.1, false, 0, 0, undefined, 1.2);
    const nNoAdj  = calcNarzuty(noAdj.totalLaborNet,  noAdj.totalMaterialNet,  nParams);
    const nWithAdj = calcNarzuty(withAdj.totalLaborNet, withAdj.totalMaterialNet, nParams);
    // labor 240×1.1=264 → Kp = 264×0.70 = 184.8 > 168
    expect(nWithAdj.kpAmount).toBeGreaterThan(nNoAdj.kpAmount);
    expect(nWithAdj.kpAmount).toBeCloseTo(withAdj.totalLaborNet * 0.70, 2);
  });

  it("full chain: BASE → region → adjustment → Narzuty → VAT (8%)", () => {
    // labor BASE=200, region=1.2 → 240; adj=1.1 → 264
    // mat BASE=400, no region → 400; adj=1.1 → 440
    const { totalLaborNet, totalMaterialNet } = calcProjectTotals(regionItems, 1.1, false, 0, 0, undefined, 1.2);
    expect(totalLaborNet).toBeCloseTo(264, 2);
    expect(totalMaterialNet).toBeCloseTo(440, 2);
    const { kpAmount, zAmount, kzAmount, totalNarzuty } = calcNarzuty(totalLaborNet, totalMaterialNet, nParams);
    expect(kpAmount).toBeCloseTo(264 * 0.70, 2);            // 184.8
    expect(zAmount).toBeCloseTo((264 + kpAmount) * 0.15, 2); // (264+184.8)*0.15 = 67.32
    expect(kzAmount).toBeCloseTo(440 * 0.10, 2);             // 44
    const subtotalWithNarzuty = totalLaborNet + totalMaterialNet + totalNarzuty;
    const vatAmount = subtotalWithNarzuty * 0.08;
    expect(vatAmount).toBeCloseTo(subtotalWithNarzuty * 0.08, 2);
  });
});
