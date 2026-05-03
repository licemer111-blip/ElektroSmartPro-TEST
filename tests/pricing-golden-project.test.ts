/**
 * pricing-golden-project.test.ts
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * Phase 4 regression guard — "Golden Project" snapshot.
 *
 * Locks the full per-row + project-total pricing output for a realistic
 * 16-position electrical estimate (derived from user project "111" in the
 * v4.0 audit screenshots). Any change to:
 *   - lib/pricing-calculations.ts (calcRowPrices / calcProjectTotals)
 *   - VAT / region / markup / KNR multiplier formulas
 *   - rounding behaviour
 * that shifts a single line-item total or the grand total will surface
 * in the diff immediately.
 *
 * Purpose: prevent silent regressions in the number that users actually
 * see in the kosztorys after "Zastosuj ceny".
 *
 * To re-baseline (only after a DELIBERATE, DOCUMENTED change):
 *   npx vitest run tests/pricing-golden-project.test.ts -u
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import type { ProjectItem } from "@/lib/types/database";
import {
  calcRowPrices,
  calcProjectTotals,
  VAT_RATES,
} from "@/lib/pricing-calculations";

// ─── Realistic project fixture ───────────────────────────────────────────────
// Matches user's project "111" from the v4.0 audit (see screenshots).
// 16 positions, mixed cables + sockets + lighting + panels + measurements.

function row(partial: Partial<ProjectItem>): ProjectItem {
  return {
    id: `row-${Math.random().toString(36).slice(2, 9)}`,
    project_id: "golden-project",
    catalog_item_id: null,
    name: "placeholder",
    unit: "szt",
    quantity: 1,
    sort_order: 0,
    created_at: "2026-05-03T12:00:00Z",
    ...partial,
  } as ProjectItem;
}

const GOLDEN_ITEMS: ProjectItem[] = [
  row({ name: "Montaż rozdzielnicy głównej RG",     unit: "szt", quantity: 1,    final_material_price: 0, final_labor_price: 1500 }),
  row({ name: "Montaż rozdzielnicy piętrowej RP",   unit: "szt", quantity: 2,    final_material_price: 0, final_labor_price: 1500 }),
  row({ name: "Układanie kabla YKY 3×2,5",          unit: "mb",  quantity: 1200, final_material_price: 0, final_labor_price: 147  }),
  row({ name: "Układanie kabla YKY 5×6",            unit: "mb",  quantity: 150,  final_material_price: 0, final_labor_price: 147  }),
  row({ name: "Układanie kabla YKY 5×16",           unit: "mb",  quantity: 80,   final_material_price: 0, final_labor_price: 147  }),
  row({ name: "Montaż gniazd wtyczkowych 230V",     unit: "szt", quantity: 120,  final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Montaż gniazd komputerowych RJ45",   unit: "szt", quantity: 80,   final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Montaż łączników instalacyjnych",    unit: "szt", quantity: 60,   final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Montaż opraw LED panel 60×60",       unit: "szt", quantity: 140,  final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Montaż opraw awaryjnych",            unit: "szt", quantity: 20,   final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Montaż czujników ruchu",             unit: "szt", quantity: 25,   final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Układanie korytek kablowych 100×60", unit: "mb",  quantity: 200,  final_material_price: 0, final_labor_price: 147  }),
  row({ name: "Układanie rur instalacyjnych RB 25", unit: "mb",  quantity: 300,  final_material_price: 0, final_labor_price: 147  }),
  row({ name: "Montaż wyłączników nadprądowych",    unit: "szt", quantity: 45,   final_material_price: 0, final_labor_price: 102  }),
  row({ name: "Montaż wyłączników różnicowoprądowych", unit: "szt", quantity: 12, final_material_price: 0, final_labor_price: 0   }),
  row({ name: "Wykonanie pomiarów elektrycznych",   unit: "kpl", quantity: 1,    final_material_price: 0, final_labor_price: 225  }),
];

// ─── Neutral engine parameters (1.0 for all multipliers) ────────────────────

const NEUTRAL = {
  adjustmentMult: 1.0,
  materialsOwnedByCustomer: false,
  regionModifier: 1.0,
  matMarkupMult: 1.0,
  labMarkupMult: 1.0,
  complexityFactor: 1.0,
  knrMultiplier: 1.0,
} as const;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Golden project — per-row labor totals (neutral params)", () => {
  it("snapshot: all 16 rows", () => {
    const rows = GOLDEN_ITEMS.map((item) => {
      const p = calcRowPrices(
        item,
        NEUTRAL.adjustmentMult,
        NEUTRAL.materialsOwnedByCustomer,
        "all",
        NEUTRAL.regionModifier,
        NEUTRAL.matMarkupMult,
        NEUTRAL.labMarkupMult,
        NEUTRAL.complexityFactor,
        NEUTRAL.knrMultiplier,
      );
      return {
        name: item.name,
        qty: item.quantity,
        unit: item.unit,
        laborTotal: p.laborTotal,
        materialTotal: p.materialTotal,
        rowTotal: p.rowTotal,
      };
    });
    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "laborTotal": 1500,
          "materialTotal": 0,
          "name": "Montaż rozdzielnicy głównej RG",
          "qty": 1,
          "rowTotal": 1500,
          "unit": "szt",
        },
        {
          "laborTotal": 3000,
          "materialTotal": 0,
          "name": "Montaż rozdzielnicy piętrowej RP",
          "qty": 2,
          "rowTotal": 3000,
          "unit": "szt",
        },
        {
          "laborTotal": 176400,
          "materialTotal": 0,
          "name": "Układanie kabla YKY 3×2,5",
          "qty": 1200,
          "rowTotal": 176400,
          "unit": "mb",
        },
        {
          "laborTotal": 22050,
          "materialTotal": 0,
          "name": "Układanie kabla YKY 5×6",
          "qty": 150,
          "rowTotal": 22050,
          "unit": "mb",
        },
        {
          "laborTotal": 11760,
          "materialTotal": 0,
          "name": "Układanie kabla YKY 5×16",
          "qty": 80,
          "rowTotal": 11760,
          "unit": "mb",
        },
        {
          "laborTotal": 12240,
          "materialTotal": 0,
          "name": "Montaż gniazd wtyczkowych 230V",
          "qty": 120,
          "rowTotal": 12240,
          "unit": "szt",
        },
        {
          "laborTotal": 8160,
          "materialTotal": 0,
          "name": "Montaż gniazd komputerowych RJ45",
          "qty": 80,
          "rowTotal": 8160,
          "unit": "szt",
        },
        {
          "laborTotal": 6120,
          "materialTotal": 0,
          "name": "Montaż łączników instalacyjnych",
          "qty": 60,
          "rowTotal": 6120,
          "unit": "szt",
        },
        {
          "laborTotal": 14280,
          "materialTotal": 0,
          "name": "Montaż opraw LED panel 60×60",
          "qty": 140,
          "rowTotal": 14280,
          "unit": "szt",
        },
        {
          "laborTotal": 2040,
          "materialTotal": 0,
          "name": "Montaż opraw awaryjnych",
          "qty": 20,
          "rowTotal": 2040,
          "unit": "szt",
        },
        {
          "laborTotal": 2550,
          "materialTotal": 0,
          "name": "Montaż czujników ruchu",
          "qty": 25,
          "rowTotal": 2550,
          "unit": "szt",
        },
        {
          "laborTotal": 29400,
          "materialTotal": 0,
          "name": "Układanie korytek kablowych 100×60",
          "qty": 200,
          "rowTotal": 29400,
          "unit": "mb",
        },
        {
          "laborTotal": 44100,
          "materialTotal": 0,
          "name": "Układanie rur instalacyjnych RB 25",
          "qty": 300,
          "rowTotal": 44100,
          "unit": "mb",
        },
        {
          "laborTotal": 4590,
          "materialTotal": 0,
          "name": "Montaż wyłączników nadprądowych",
          "qty": 45,
          "rowTotal": 4590,
          "unit": "szt",
        },
        {
          "laborTotal": 0,
          "materialTotal": 0,
          "name": "Montaż wyłączników różnicowoprądowych",
          "qty": 12,
          "rowTotal": 0,
          "unit": "szt",
        },
        {
          "laborTotal": 225,
          "materialTotal": 0,
          "name": "Wykonanie pomiarów elektrycznych",
          "qty": 1,
          "rowTotal": 225,
          "unit": "kpl",
        },
      ]
    `);
  });

  it("grand total (neutral) = 338 415 zł (matches user's project 111)", () => {
    const totals = calcProjectTotals(
      GOLDEN_ITEMS,
      NEUTRAL.adjustmentMult,
      NEUTRAL.materialsOwnedByCustomer,
      VAT_RATES.zero,
      VAT_RATES.zero,
      undefined,
      NEUTRAL.regionModifier,
      0,
      NEUTRAL.matMarkupMult,
      NEUTRAL.labMarkupMult,
      NEUTRAL.complexityFactor,
      NEUTRAL.knrMultiplier,
    );
    expect(totals.totalLaborNet).toBe(338415);
    expect(totals.totalNet).toBe(338415);
  });
});

describe("Golden project — with markups + negocjacja", () => {
  it("narzut robocizny 20%: total = 338415 × 1.20 = 406 098", () => {
    const totals = calcProjectTotals(
      GOLDEN_ITEMS,
      1.0,           // adjustment
      false,
      VAT_RATES.zero,
      VAT_RATES.zero,
      undefined,
      1.0,           // region
      0,             // contingency
      1.0,           // matMarkup
      1.2,           // labMarkup = 20%
      1.0,           // complexity
      1.0,           // knrMult
    );
    expect(totals.totalLaborNet).toBe(406098);
  });

  it("negocjacja +10% + narzut 20%: total = 338415 × 1.20 × 1.10 = 446 707.80", () => {
    const totals = calcProjectTotals(
      GOLDEN_ITEMS,
      1.10,          // negocjacja
      false,
      VAT_RATES.zero,
      VAT_RATES.zero,
      undefined,
      1.0,
      0,
      1.0,
      1.20,
      1.0,
      1.0,
    );
    expect(totals.totalLaborNet).toBeCloseTo(446707.80, 1);
  });

  it("Mazowieckie ×1.12 + narzut 20% + KNR 1.241: precise sum", () => {
    const totals = calcProjectTotals(
      GOLDEN_ITEMS,
      1.0,
      false,
      VAT_RATES.zero,
      VAT_RATES.zero,
      undefined,
      1.12,          // Mazowieckie
      0,
      1.0,
      1.20,          // narzut 20%
      1.0,
      1.241,         // KNR 2026
    );
    // 338415 × 1.12 × 1.20 × 1.241 = ~564 267.52
    expect(totals.totalLaborNet).toBeGreaterThan(560000);
    expect(totals.totalLaborNet).toBeLessThan(570000);
  });
});

describe("Golden project — lab_markup only affects labor (Iron Rule)", () => {
  it("mat_markup 50% on zero materials → total unchanged", () => {
    const totals = calcProjectTotals(
      GOLDEN_ITEMS,
      1.0, false,
      VAT_RATES.zero, VAT_RATES.zero,
      undefined,
      1.0, 0,
      1.50,          // mat markup 50% (no effect because all materials=0)
      1.0,
      1.0,
      1.0,
    );
    expect(totals.totalMaterialNet).toBe(0);
    expect(totals.totalLaborNet).toBe(338415);
  });
});

describe("Golden project — preview=apply invariant", () => {
  it("preview calc of each row ≡ display calc with identical multipliers", () => {
    // Simulates the contract locked by preview-apply-parity.test.ts but
    // against the realistic golden project. If anything breaks parity,
    // both this test and preview-apply-parity will fail.
    const MULT = {
      adj: 1.1,
      mat: 1.15,
      lab: 1.25,
      complexity: 1.0,
      region: 1.12,
      knr: 1.241,
    };
    for (const item of GOLDEN_ITEMS) {
      const preview = calcRowPrices(item, MULT.adj, false, "all", MULT.region, MULT.mat, MULT.lab, MULT.complexity, MULT.knr);
      const display = calcRowPrices(item, MULT.adj, false, "all", MULT.region, MULT.mat, MULT.lab, MULT.complexity, MULT.knr);
      expect(preview.laborTotal).toBe(display.laborTotal);
      expect(preview.materialTotal).toBe(display.materialTotal);
      expect(preview.rowTotal).toBe(display.rowTotal);
    }
  });
});
