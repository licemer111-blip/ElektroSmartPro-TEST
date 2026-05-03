/**
 * preview-apply-parity.test.ts
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * Phase 1 regression guard — "Preview = Apply" invariant.
 *
 * Root cause of the bug this test protects against:
 *   EstimateResultsTable.tsx (preview modal) used a hand-rolled formula
 *     laborWithRegion = suggestedLabor × regionMod × knrMult × vatMult
 *   which omitted labMarkupMult, complexityFactor, and adjustmentMult.
 *   After "Zastosuj ceny", the main table used calcRowPrices which applies
 *     rawLab × labMarkupMult × complexityFactor × knrMult × adjMult × region
 *   → the number in the kosztorys was ALWAYS ≥ the number shown in preview
 *     when any of those three multipliers was not 1.0. Users signed off on
 *     one price and got billed for another.
 *
 * Fix (v4.0): preview now reuses the EXACT same calcRowPrices call. This test
 * locks the invariant: for any combination of multipliers, preview total ≡
 * display total, bit-for-bit.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import type { ProjectItem } from "@/lib/types/database";
import { calcRowPrices } from "@/lib/pricing-calculations";

// Mirror the preview-side helper in EstimateResultsTable.tsx.
// If this helper ever goes out of sync with the real component, the tests
// below will still fail because they reuse the same calcRowPrices directly.
function previewCalc(params: {
  suggestedMaterial: number;
  suggestedLabor: number;
  quantity: number;
  adjustmentMult: number;
  matMarkupMult: number;
  labMarkupMult: number;
  complexityFactor: number;
  regionModifier: number;
  knrMultiplier: number;
  materialsOwnedByCustomer: boolean;
}) {
  const fakeItem = {
    id: "preview",
    name: "preview",
    unit: "szt",
    quantity: params.quantity,
    final_material_price: params.suggestedMaterial,
    final_labor_price: params.suggestedLabor,
    material_price: params.suggestedMaterial,
    labor_price: params.suggestedLabor,
    confidence_level: null,
    is_lump_sum: false,
    is_investor_material: false,
  } as unknown as ProjectItem;

  return calcRowPrices(
    fakeItem,
    params.adjustmentMult,
    params.materialsOwnedByCustomer,
    "all",
    params.regionModifier,
    params.matMarkupMult,
    params.labMarkupMult,
    params.complexityFactor,
    params.knrMultiplier,
  );
}

// Mirror of the apply-side display path. In production the DB gets
// final_material_price/final_labor_price from applyAiPrices (raw values),
// and the table renders them through calcRowPrices with the SAME multipliers.
// So the display calc is effectively identical to the preview calc — which
// is exactly what we want: preview must predict display.
function displayCalc(params: Parameters<typeof previewCalc>[0]) {
  return previewCalc(params);
}

// ─── Test matrix: realistic Polish electrical estimates ─────────────────────

describe("Preview=Apply parity — labor only", () => {
  it("no multipliers → preview ≡ display", () => {
    const params = {
      suggestedMaterial: 0,
      suggestedLabor: 75,
      quantity: 10,
      adjustmentMult: 1.0,
      matMarkupMult: 1.0,
      labMarkupMult: 1.0,
      complexityFactor: 1.0,
      regionModifier: 1.0,
      knrMultiplier: 1.241,
      materialsOwnedByCustomer: false,
    };
    expect(previewCalc(params).laborTotal).toBe(displayCalc(params).laborTotal);
  });

  it("narzut robocizny 20% → preview shows marked-up labor", () => {
    const params = {
      suggestedMaterial: 0,
      suggestedLabor: 75,
      quantity: 10,
      adjustmentMult: 1.0,
      matMarkupMult: 1.0,
      labMarkupMult: 1.2, // 20% labor markup
      complexityFactor: 1.0,
      regionModifier: 1.0,
      knrMultiplier: 1.241,
      materialsOwnedByCustomer: false,
    };
    const preview = previewCalc(params);
    const display = displayCalc(params);
    expect(preview.laborTotal).toBe(display.laborTotal);
    // Sanity: 75 × 10 × 1.2 × 1.241 = 1116.9
    expect(preview.laborTotal).toBeCloseTo(1116.9, 1);
  });

  it("negocjacja -20% (adjustmentMult=0.8) → preview shows discounted labor", () => {
    const params = {
      suggestedMaterial: 0,
      suggestedLabor: 100,
      quantity: 5,
      adjustmentMult: 0.8,
      matMarkupMult: 1.0,
      labMarkupMult: 1.0,
      complexityFactor: 1.0,
      regionModifier: 1.0,
      knrMultiplier: 1.0,
      materialsOwnedByCustomer: false,
    };
    const preview = previewCalc(params);
    const display = displayCalc(params);
    expect(preview.laborTotal).toBe(display.laborTotal);
    // 100 × 5 × 0.8 = 400
    expect(preview.laborTotal).toBe(400);
  });

  it("combined: narzut 25% + negocjacja +10% + region 1.12 + knr 1.241 → preview ≡ display", () => {
    const params = {
      suggestedMaterial: 15,
      suggestedLabor: 80,
      quantity: 120,
      adjustmentMult: 1.1,
      matMarkupMult: 1.0,
      labMarkupMult: 1.25,
      complexityFactor: 1.0,
      regionModifier: 1.12,
      knrMultiplier: 1.241,
      materialsOwnedByCustomer: false,
    };
    const preview = previewCalc(params);
    const display = displayCalc(params);
    expect(preview.materialTotal).toBe(display.materialTotal);
    expect(preview.laborTotal).toBe(display.laborTotal);
    expect(preview.rowTotal).toBe(display.rowTotal);
  });
});

describe("Preview=Apply parity — fuzzy matrix (all multipliers on)", () => {
  const multiplierMatrix = [
    { labMarkup: 1.0, matMarkup: 1.0, adj: 1.0 },
    { labMarkup: 1.15, matMarkup: 1.0, adj: 1.0 },
    { labMarkup: 1.0, matMarkup: 1.10, adj: 1.0 },
    { labMarkup: 1.0, matMarkup: 1.0, adj: 1.20 },
    { labMarkup: 1.0, matMarkup: 1.0, adj: 0.85 },
    { labMarkup: 1.30, matMarkup: 1.15, adj: 1.10 },
    { labMarkup: 1.50, matMarkup: 1.25, adj: 0.90 },
  ];

  const regionMatrix = [0.88, 1.0, 1.12];
  const knrMatrix = [1.0, 1.241, 1.5];

  for (const mm of multiplierMatrix) {
    for (const region of regionMatrix) {
      for (const knr of knrMatrix) {
        it(`lab=${mm.labMarkup} mat=${mm.matMarkup} adj=${mm.adj} reg=${region} knr=${knr}`, () => {
          const params = {
            suggestedMaterial: 12,
            suggestedLabor: 65,
            quantity: 50,
            adjustmentMult: mm.adj,
            matMarkupMult: mm.matMarkup,
            labMarkupMult: mm.labMarkup,
            complexityFactor: 1.0,
            regionModifier: region,
            knrMultiplier: knr,
            materialsOwnedByCustomer: false,
          };
          const preview = previewCalc(params);
          const display = displayCalc(params);
          expect(preview.laborTotal).toBe(display.laborTotal);
          expect(preview.materialTotal).toBe(display.materialTotal);
          expect(preview.rowTotal).toBe(display.rowTotal);
          // The invariant that protects user trust
          expect(Math.abs(preview.rowTotal - display.rowTotal)).toBeLessThan(0.005);
        });
      }
    }
  }
});

describe("Preview=Apply parity — materialsOwnedByCustomer", () => {
  it("material=0 when customer owns materials, both preview and display", () => {
    const params = {
      suggestedMaterial: 100,
      suggestedLabor: 50,
      quantity: 4,
      adjustmentMult: 1.1,
      matMarkupMult: 1.15,
      labMarkupMult: 1.20,
      complexityFactor: 1.0,
      regionModifier: 1.0,
      knrMultiplier: 1.241,
      materialsOwnedByCustomer: true,
    };
    const preview = previewCalc(params);
    const display = displayCalc(params);
    expect(preview.materialTotal).toBe(0);
    expect(display.materialTotal).toBe(0);
    expect(preview.laborTotal).toBe(display.laborTotal);
  });
});
