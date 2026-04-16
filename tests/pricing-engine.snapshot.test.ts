/**
 * pricing-engine.snapshot.test.ts
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * Snapshot baseline for the pricing engine (lib/pricing-calculations.ts).
 *
 * Purpose
 * ───────
 * These tests LOCK the numerical output of `calcRowPrices` and
 * `calcProjectTotals` for a curated set of real-world electrical items.
 *
 * How it works
 * ─────────────
 * Each case builds a ProjectItem + engine parameters, runs the calculation,
 * and asserts the result with `toMatchInlineSnapshot`. If any future change
 * to the engine changes the output, the snapshot diff will show exactly
 * which case shifted — and by how much. Re-baselining is intentional:
 *   npx vitest run tests/pricing-engine.snapshot.test.ts -u
 *
 * IMPORTANT: snapshots are the financial-correctness contract of the
 * application. Do NOT update them without a documented reason.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import type { ProjectItem } from "@/lib/types/database";
import {
  calcRowPrices,
  calcProjectTotals,
  VAT_RATES,
} from "@/lib/pricing-calculations";

// ─── Fixture helpers ─────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ProjectItem>): ProjectItem {
  return {
    id: overrides.id ?? "fixture-id",
    project_id: "fixture-project",
    catalog_item_id: null,
    name: overrides.name ?? "Fixture item",
    unit: overrides.unit ?? "szt",
    quantity: overrides.quantity ?? 1,
    sort_order: 0,
    created_at: "2026-04-16T12:00:00Z",
    ...overrides,
  } as ProjectItem;
}

/**
 * Default engine parameters matching the production defaults used by the
 * RESIDENTIAL sector on the Mazowieckie region (price_modifier=1.0).
 */
const DEFAULTS = {
  adjustmentMult: 1.0,
  materialsOwnedByCustomer: false,
  regionModifier: 1.0,
  matMarkupMult: 1.0,
  labMarkupMult: 1.0,
  complexityFactor: 1.0,
  knrMultiplier: 1.241, // Current KNR 2026 multiplier (see admin_settings)
};

// ─── Group A — calcRowPrices: typical residential positions ─────────────────

describe("calcRowPrices — typical residential items", () => {
  it("Gniazdo 230V pojedyncze p/t — 10 szt @ 75 zł labor, 12 zł material", () => {
    const item = makeItem({
      name: "Gniazdo 230V pojedyncze p/t",
      unit: "szt",
      quantity: 10,
      final_material_price: 12,
      final_labor_price: 75,
    });
    const r = calcRowPrices(
      item,
      DEFAULTS.adjustmentMult,
      DEFAULTS.materialsOwnedByCustomer,
      "all",
      DEFAULTS.regionModifier,
      DEFAULTS.matMarkupMult,
      DEFAULTS.labMarkupMult,
      DEFAULTS.complexityFactor,
      DEFAULTS.knrMultiplier,
    );
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 930.75,
        "laborTotalBase": 750,
        "laborUnit": 93.075,
        "laborUnitBase": 75,
        "materialTotal": 120,
        "materialTotalBase": 120,
        "materialUnit": 12,
        "materialUnitBase": 12,
        "rowTotal": 1050.75,
      }
    `);
  });

  it("YDYp 3×2.5mm² — 120 mb @ 2.50 zł labor, 4.80 zł material", () => {
    const item = makeItem({
      name: "Przewód YDYp 3×2.5mm²",
      unit: "mb",
      quantity: 120,
      final_material_price: 4.8,
      final_labor_price: 2.5,
    });
    const r = calcRowPrices(
      item,
      DEFAULTS.adjustmentMult,
      DEFAULTS.materialsOwnedByCustomer,
      "all",
      DEFAULTS.regionModifier,
      DEFAULTS.matMarkupMult,
      DEFAULTS.labMarkupMult,
      DEFAULTS.complexityFactor,
      DEFAULTS.knrMultiplier,
    );
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 372.3,
        "laborTotalBase": 300,
        "laborUnit": 3.1025,
        "laborUnitBase": 2.5,
        "materialTotal": 576,
        "materialTotalBase": 576,
        "materialUnit": 4.8,
        "materialUnitBase": 4.8,
        "rowTotal": 948.3,
      }
    `);
  });

  it("Downlight LED (ceiling) — 24 szt @ 38 zł labor, 65 zł material", () => {
    const item = makeItem({
      name: "Downlight LED wpuszczany w sufit",
      unit: "szt",
      quantity: 24,
      final_material_price: 65,
      final_labor_price: 38,
    });
    const r = calcRowPrices(
      item,
      DEFAULTS.adjustmentMult,
      DEFAULTS.materialsOwnedByCustomer,
      "all",
      DEFAULTS.regionModifier,
      DEFAULTS.matMarkupMult,
      DEFAULTS.labMarkupMult,
      DEFAULTS.complexityFactor,
      DEFAULTS.knrMultiplier,
    );
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 1131.79,
        "laborTotalBase": 912,
        "laborUnit": 47.158,
        "laborUnitBase": 38,
        "materialTotal": 1560,
        "materialTotalBase": 1560,
        "materialUnit": 65,
        "materialUnitBase": 65,
        "rowTotal": 2691.79,
      }
    `);
  });
});

// ─── Group B — calcRowPrices: region modifier variations ────────────────────

describe("calcRowPrices — regional multipliers (Mazowieckie vs Lubelskie)", () => {
  const baseItem = makeItem({
    name: "Wyłącznik S1 p/t",
    unit: "szt",
    quantity: 8,
    final_material_price: 10,
    final_labor_price: 50,
  });

  it("Mazowieckie region_modifier=1.12 — labor up, material unchanged", () => {
    const r = calcRowPrices(baseItem, 1, false, "all", 1.12, 1, 1, 1, DEFAULTS.knrMultiplier);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 555.97,
        "laborTotalBase": 400,
        "laborUnit": 69.49600000000001,
        "laborUnitBase": 50,
        "materialTotal": 80,
        "materialTotalBase": 80,
        "materialUnit": 10,
        "materialUnitBase": 10,
        "rowTotal": 635.97,
      }
    `);
  });

  it("Lubelskie region_modifier=0.88 — labor down, material unchanged", () => {
    const r = calcRowPrices(baseItem, 1, false, "all", 0.88, 1, 1, 1, DEFAULTS.knrMultiplier);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 436.83,
        "laborTotalBase": 400,
        "laborUnit": 54.604000000000006,
        "laborUnitBase": 50,
        "materialTotal": 80,
        "materialTotalBase": 80,
        "materialUnit": 10,
        "materialUnitBase": 10,
        "rowTotal": 516.83,
      }
    `);
  });
});

// ─── Group C — calcRowPrices: manual rows skip region modifier ──────────────

describe("calcRowPrices — manual prices are sovereign (skip region)", () => {
  it("manual row on Mazowieckie x1.12 — region ignored, adjustment applies", () => {
    const item = makeItem({
      name: "Ręcznie wycenione — uruchomienie dziwnego urządzenia",
      unit: "kpl",
      quantity: 1,
      final_material_price: 200,
      final_labor_price: 800,
      confidence_level: "manual",
    });
    const r = calcRowPrices(item, 1.1, false, "all", 1.12, 1, 1, 1, DEFAULTS.knrMultiplier);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 1092.08,
        "laborTotalBase": 800,
        "laborUnit": 1092.0800000000002,
        "laborUnitBase": 800,
        "materialTotal": 220,
        "materialTotalBase": 200,
        "materialUnit": 220.00000000000003,
        "materialUnitBase": 200,
        "rowTotal": 1312.08,
      }
    `);
  });
});

// ─── Group D — calcRowPrices: ryczałt (lump-sum) positions ──────────────────

describe("calcRowPrices — lump-sum (is_lump_sum) ignores quantity in totals", () => {
  it("ryczałt qty=5 still totals as 1 unit × price", () => {
    const item = makeItem({
      name: "Wymiana rozdzielnicy — ryczałt",
      unit: "kpl",
      quantity: 5, // quantity should be ignored
      final_material_price: 1200,
      final_labor_price: 3500,
      is_lump_sum: true,
    });
    const r = calcRowPrices(item, 1, false, "all", 1, 1, 1, 1, DEFAULTS.knrMultiplier);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 4343.5,
        "laborTotalBase": 3500,
        "laborUnit": 4343.5,
        "laborUnitBase": 3500,
        "materialTotal": 1200,
        "materialTotalBase": 1200,
        "materialUnit": 1200,
        "materialUnitBase": 1200,
        "rowTotal": 5543.5,
      }
    `);
  });
});

// ─── Group E — calcRowPrices: investor material + materialsOwnedByCustomer ──

describe("calcRowPrices — materials supplied by investor", () => {
  it("is_investor_material=true — material zeroed out, labor unchanged", () => {
    const item = makeItem({
      name: "Montaż oprawy (materiał inwestora)",
      unit: "szt",
      quantity: 12,
      final_material_price: 99,
      final_labor_price: 40,
      is_investor_material: true,
    });
    const r = calcRowPrices(item, 1, false, "all", 1, 1, 1, 1, DEFAULTS.knrMultiplier);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 595.68,
        "laborTotalBase": 480,
        "laborUnit": 49.64,
        "laborUnitBase": 40,
        "materialTotal": 0,
        "materialTotalBase": 0,
        "materialUnit": 0,
        "materialUnitBase": 0,
        "rowTotal": 595.68,
      }
    `);
  });

  it("materialsOwnedByCustomer=true — project-level override", () => {
    const item = makeItem({
      name: "Montaż gniazd",
      unit: "szt",
      quantity: 20,
      final_material_price: 15,
      final_labor_price: 72,
    });
    const r = calcRowPrices(item, 1, /*materialsOwnedByCustomer*/ true, "all", 1, 1, 1, 1, DEFAULTS.knrMultiplier);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 1787.04,
        "laborTotalBase": 1440,
        "laborUnit": 89.352,
        "laborUnitBase": 72,
        "materialTotal": 0,
        "materialTotalBase": 0,
        "materialUnit": 0,
        "materialUnitBase": 0,
        "rowTotal": 1787.04,
      }
    `);
  });
});

// ─── Group F — calcRowPrices: v3.0 markups + complexity + KNR multiplier ────

describe("calcRowPrices — v3.0 markups chain", () => {
  it("mat_markup=15%, lab_markup=20%, complexity=1.3, KNR=1.241, region=1.12", () => {
    const item = makeItem({
      name: "Szafa serwerowa — montaż + konfiguracja",
      unit: "kpl",
      quantity: 1,
      final_material_price: 800,
      final_labor_price: 2000,
    });
    const r = calcRowPrices(
      item,
      /*adjustmentMult*/ 1.0,
      false,
      "all",
      /*region*/ 1.12,
      /*matMarkup*/ 1.15,
      /*labMarkup*/ 1.20,
      /*complexity*/ 1.3,
      /*knr*/ 1.241,
    );
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 4336.55,
        "laborTotalBase": 2000,
        "laborUnit": 4336.550400000001,
        "laborUnitBase": 2000,
        "materialTotal": 920,
        "materialTotalBase": 800,
        "materialUnit": 919.9999999999999,
        "materialUnitBase": 800,
        "rowTotal": 5256.55,
      }
    `);
  });

  it("adjustmentMult=0.9 (10% discount) applied on top of markups", () => {
    const item = makeItem({
      name: "Kabel YKY 5×6mm²",
      unit: "mb",
      quantity: 50,
      final_material_price: 18,
      final_labor_price: 7,
    });
    const r = calcRowPrices(
      item,
      /*adjustmentMult*/ 0.9,
      false,
      "all",
      1.0,
      1.1,
      1.1,
      1.0,
      1.241,
    );
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 430.01,
        "laborTotalBase": 350,
        "laborUnit": 8.600130000000002,
        "laborUnitBase": 7,
        "materialTotal": 891,
        "materialTotalBase": 900,
        "materialUnit": 17.82,
        "materialUnitBase": 18,
        "rowTotal": 1321.01,
      }
    `);
  });
});

// ─── Group G — calcRowPrices: filterType variations ─────────────────────────

describe("calcRowPrices — filter modes", () => {
  const item = makeItem({
    name: "Gniazdo + montaż",
    unit: "szt",
    quantity: 10,
    final_material_price: 20,
    final_labor_price: 60,
  });
  const common = [1, false] as const;
  const tail = [1, 1, 1, 1, 1] as const;

  it("filter=all → rowTotal = material + labor", () => {
    const r = calcRowPrices(item, ...common, "all", ...tail);
    expect(r.rowTotal).toMatchInlineSnapshot(`800`);
  });

  it("filter=materials → rowTotal = material only", () => {
    const r = calcRowPrices(item, ...common, "materials", ...tail);
    expect(r.rowTotal).toMatchInlineSnapshot(`200`);
  });

  it("filter=labor → rowTotal = labor only", () => {
    const r = calcRowPrices(item, ...common, "labor", ...tail);
    expect(r.rowTotal).toMatchInlineSnapshot(`600`);
  });
});

// ─── Group H — calcRowPrices: edge cases ─────────────────────────────────────

describe("calcRowPrices — edge cases", () => {
  it("quantity=0 → all totals zero", () => {
    const item = makeItem({ quantity: 0, final_material_price: 100, final_labor_price: 100 });
    const r = calcRowPrices(item, 1, false, "all", 1, 1, 1, 1, 1);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 0,
        "laborTotalBase": 0,
        "laborUnit": 100,
        "laborUnitBase": 100,
        "materialTotal": 0,
        "materialTotalBase": 0,
        "materialUnit": 100,
        "materialUnitBase": 100,
        "rowTotal": 0,
      }
    `);
  });

  it("both prices 0 → all zeros, no NaN/Infinity", () => {
    const item = makeItem({ quantity: 5 });
    const r = calcRowPrices(item, 1, false, "all", 1.12, 1, 1, 1, 1.241);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 0,
        "laborTotalBase": 0,
        "laborUnit": 0,
        "laborUnitBase": 0,
        "materialTotal": 0,
        "materialTotalBase": 0,
        "materialUnit": 0,
        "materialUnitBase": 0,
        "rowTotal": 0,
      }
    `);
  });

  it("base price fallback chain (material_price, labor_price) when *_final not set", () => {
    const item = makeItem({
      name: "Fallback test",
      unit: "szt",
      quantity: 3,
      material_price: 10, // no final_material_price
      labor_price: 20,    // no final_labor_price
    });
    const r = calcRowPrices(item, 1, false, "all", 1, 1, 1, 1, 1);
    expect(r).toMatchInlineSnapshot(`
      {
        "laborTotal": 60,
        "laborTotalBase": 60,
        "laborUnit": 20,
        "laborUnitBase": 20,
        "materialTotal": 30,
        "materialTotalBase": 30,
        "materialUnit": 10,
        "materialUnitBase": 10,
        "rowTotal": 90,
      }
    `);
  });

  it("final price overrides base price when both are set", () => {
    const item = makeItem({
      name: "Override test",
      unit: "szt",
      quantity: 1,
      material_price: 10,
      labor_price: 20,
      final_material_price: 15, // takes precedence
      final_labor_price: 25,    // takes precedence
    });
    const r = calcRowPrices(item, 1, false, "all", 1, 1, 1, 1, 1);
    expect(r.materialUnit).toMatchInlineSnapshot(`15`);
    expect(r.laborUnit).toMatchInlineSnapshot(`25`);
  });
});

// ─── Group I — calcProjectTotals: aggregated VAT and contingency ────────────

describe("calcProjectTotals — residential mieszkanie 60 m² fixture", () => {
  /** Realistic 60 m² apartment snippet: cables + outlets + panel */
  const items: ProjectItem[] = [
    makeItem({
      id: "i1",
      name: "Przewód YDYp 3×2.5mm²",
      unit: "mb",
      quantity: 180,
      final_material_price: 4.8,
      final_labor_price: 2.5,
    }),
    makeItem({
      id: "i2",
      name: "Gniazdo 230V p/t",
      unit: "szt",
      quantity: 22,
      final_material_price: 12,
      final_labor_price: 75,
    }),
    makeItem({
      id: "i3",
      name: "Rozdzielnica modułowa 24-mod p/t",
      unit: "szt",
      quantity: 1,
      final_material_price: 450,
      final_labor_price: 354,
    }),
    makeItem({
      id: "i4",
      name: "MCB 1P B16",
      unit: "szt",
      quantity: 8,
      final_material_price: 32,
      final_labor_price: 42,
    }),
  ];

  it("Mazowieckie (1.12), KNR=1.241, VAT 8% mieszkaniowy", () => {
    const totals = calcProjectTotals(
      items,
      /*adjustmentMult*/ 1.0,
      /*matOwnedByClient*/ false,
      /*vatMaterial*/ VAT_RATES.reduced, // 8%
      /*vatLabor*/ VAT_RATES.reduced,    // 8%
      /*costBase*/ undefined,
      /*regionMod*/ 1.12,
      /*contingencyPct*/ 0,
      /*matMarkup*/ 1.0,
      /*labMarkup*/ 1.0,
      /*complexity*/ 1.0,
      /*knrMult*/ 1.241,
    );
    // Lock the whole shape — any numerical drift will show up.
    expect(totals).toMatchInlineSnapshot(`
      {
        "contingencyAmount": 0,
        "marginAmount": 0,
        "marginPercent": 0,
        "totalGross": 6168.8196,
        "totalLaborNet": 3877.87,
        "totalMaterialNet": 1834,
        "totalNet": 5711.87,
        "totalNetWithContingency": 5711.87,
        "totalVat": 456.94960000000003,
        "vatLabor": 310.2296,
        "vatMaterial": 146.72,
      }
    `);
  });

  it("contingency 10% adds to net BEFORE VAT", () => {
    const totals = calcProjectTotals(
      items,
      1.0, false,
      VAT_RATES.reduced, VAT_RATES.reduced,
      undefined,
      1.12,
      /*contingencyPct*/ 10,
      1.0, 1.0, 1.0, 1.241,
    );
    // contingency = 10% * totalNet; gross grows accordingly.
    expect(totals).toMatchInlineSnapshot(`
      {
        "contingencyAmount": 571.19,
        "marginAmount": 0,
        "marginPercent": 0,
        "totalGross": 6785.7047999999995,
        "totalLaborNet": 3877.87,
        "totalMaterialNet": 1834,
        "totalNet": 5711.87,
        "totalNetWithContingency": 6283.0599999999995,
        "totalVat": 502.6447999999999,
        "vatLabor": 341.2527229394226,
        "vatMaterial": 161.39207706057735,
      }
    `);
  });

  it("B2B mixed VAT (mat 23%, labor 8%) should be higher than pure 8%", () => {
    const totals = calcProjectTotals(
      items, 1.0, false,
      /*matVAT*/ VAT_RATES.standard, // 23%
      /*labVAT*/ VAT_RATES.reduced,  // 8%
      undefined,
      1.0,
      0,
      1.0, 1.0, 1.0, 1.0,
    );
    expect(totals).toMatchInlineSnapshot(`
      {
        "contingencyAmount": 0,
        "marginAmount": 0,
        "marginPercent": 0,
        "totalGross": 5269.02,
        "totalLaborNet": 2790,
        "totalMaterialNet": 1834,
        "totalNet": 4624,
        "totalNetWithContingency": 4624,
        "totalVat": 645.02,
        "vatLabor": 223.19999999999996,
        "vatMaterial": 421.82,
      }
    `);
  });

  it("margin calculation vs costBase=5000", () => {
    const totals = calcProjectTotals(
      items, 1.0, false,
      VAT_RATES.reduced, VAT_RATES.reduced,
      /*costBase*/ 5000,
      1.0, 0, 1.0, 1.0, 1.0, 1.0,
    );
    // marginAmount = totalNet - costBase
    expect({
      totalNet: totals.totalNet,
      marginAmount: totals.marginAmount,
      marginPercent: totals.marginPercent,
    }).toMatchInlineSnapshot(`
      {
        "marginAmount": -376,
        "marginPercent": -7.5200000000000005,
        "totalNet": 4624,
      }
    `);
  });
});

// ─── Group J — VAT_RATES integrity ──────────────────────────────────────────

describe("VAT_RATES — constants are locked", () => {
  it("standard, reduced, zero are 0.23/0.08/0.00", () => {
    expect(VAT_RATES).toMatchInlineSnapshot(`
      {
        "reduced": 0.08,
        "standard": 0.23,
        "zero": 0,
      }
    `);
  });
});
