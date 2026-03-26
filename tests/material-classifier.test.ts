/**
 * tests/material-classifier.test.ts
 * ─────────────────────────────────────────────────────────────────
 * Golden Standard tests for Material Brain & Muscle (v1.0).
 * All tests use pure functions — no DB, no server imports.
 *
 * Test groups:
 *   MC-1  Unit Normalization (6 cases)
 *   MC-2  Waste Factor  (4 cases)
 *   MC-3  Spec Extraction  (5 cases)
 *   MC-4  Smart VAT (4 cases)
 *   MC-5  calculateMaterialTotal — full formula (5 cases)
 *   MC-6  Material Bridge — scaleMaterialBill (6 cases)
 *   Regression Lock (4 cases)
 */

import { describe, it, expect } from "vitest";
import {
  classifyMaterial,
  calculateMaterialTotal,
  extractMaterialSpec,
  normalizeMatUnit,
  resolveVatRate,
  CABLE_WASTE_FACTOR,
  CONSUMABLE_WASTE_FACTOR,
  DEFAULT_WASTE_FACTOR,
  DEFAULT_MATERIAL_MARGIN_PCT,
  VAT_RESIDENTIAL,
  VAT_COMMERCIAL,
  type MaterialPriceContext,
} from "@/lib/services/material-classifier";

import {
  getMaterialBill,
  scaleMaterialBill,
  getExpectedCategories,
} from "@/lib/config/material-bill-bridge";

// ─────────────────────────────────────────────────────────────────
// MC-1: Unit Normalization
// ─────────────────────────────────────────────────────────────────

describe("MC-1: Unit Normalization", () => {
  it("Cable YDYp → forced unit 'mb'", () => {
    const p = classifyMaterial("Przewód YDYp 3x2.5");
    expect(p.forcedUnit).toBe("mb");
    expect(p.category).toBe("CABLE");
  });

  it("Hager B16 → forced unit 'szt'", () => {
    const p = classifyMaterial("Hager B16 wyłącznik nadmiarowy");
    expect(p.forcedUnit).toBe("szt");
    expect(p.category).toBe("BREAKER");
  });

  it("Puszka podtynkowa → forced unit 'szt'", () => {
    const p = classifyMaterial("Puszka podtynkowa Ø60");
    expect(p.forcedUnit).toBe("szt");
    expect(p.category).toBe("BOX");
  });

  it("Gips szpachlowy → forced unit 'kg'", () => {
    const p = classifyMaterial("Gips szpachlowy Knauf 25kg");
    expect(p.forcedUnit).toBe("kg");
    expect(p.category).toBe("PLASTER");
  });

  it("Gniazdo 230V → forced unit 'szt'", () => {
    const p = classifyMaterial("Gniazdo podtynkowe 230V IP44");
    expect(p.forcedUnit).toBe("szt");
    expect(p.category).toBe("SOCKET");
  });

  it("Kołek rozporowy → forced unit 'op' (hardware)", () => {
    const p = classifyMaterial("Kołek rozporowy fi8×40");
    expect(p.forcedUnit).toBe("op");
    expect(p.category).toBe("HARDWARE");
  });
});

// ─────────────────────────────────────────────────────────────────
// MC-2: Waste Factor
// ─────────────────────────────────────────────────────────────────

describe("MC-2: Waste Factor", () => {
  it("Cable → waste factor 1.10 (10%)", () => {
    const p = classifyMaterial("Kabel YKY 5x2.5");
    expect(p.wasteFactor).toBe(CABLE_WASTE_FACTOR);
    expect(p.wasteFactor).toBe(1.10);
  });

  it("Gips → waste factor 1.05 (5% for consumables)", () => {
    const p = classifyMaterial("Gips szpachlowy");
    expect(p.wasteFactor).toBe(CONSUMABLE_WASTE_FACTOR);
    expect(p.wasteFactor).toBe(1.05);
  });

  it("MCB breaker → NO waste (1.00)", () => {
    const p = classifyMaterial("Wyłącznik B16 MCB 1P");
    expect(p.wasteFactor).toBe(DEFAULT_WASTE_FACTOR);
    expect(p.wasteFactor).toBe(1.00);
  });

  it("Puszka → NO waste (1.00)", () => {
    const p = classifyMaterial("Puszka IP65 hermetyczna");
    expect(p.wasteFactor).toBe(DEFAULT_WASTE_FACTOR);
    expect(p.wasteFactor).toBe(1.00);
  });
});

// ─────────────────────────────────────────────────────────────────
// MC-3: Spec Extraction
// ─────────────────────────────────────────────────────────────────

describe("MC-3: Spec Extraction", () => {
  it("YDYp 3x2.5 → spec '3x2.5'", () => {
    const spec = extractMaterialSpec("Przewód YDYp 3x2.5");
    expect(spec).toBe("3x2.5");
  });

  it("Hager B16 → spec 'B16'", () => {
    const spec = extractMaterialSpec("Hager B16 wyłącznik");
    expect(spec).toBe("B16");
  });

  it("MCB 3P 32A → spec '3P 32A' or '32A'", () => {
    const spec = extractMaterialSpec("Wyłącznik MCB 3P 32A B-char");
    expect(spec).toBeTruthy();
    expect(spec?.includes("32") || spec?.includes("3P")).toBe(true);
  });

  it("Puszka Ø60 → spec 'Ø60'", () => {
    const spec = extractMaterialSpec("Puszka podtynkowa Ø60");
    expect(spec).toBe("Ø60");
  });

  it("Generic item with no spec → null", () => {
    const spec = extractMaterialSpec("Zaprawa cementowa szybkowiążąca");
    expect(spec).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// MC-4: Smart VAT (Polish specifics)
// ─────────────────────────────────────────────────────────────────

describe("MC-4: Smart VAT (Polish specifics)", () => {
  it("Mieszkanie/Dom → VAT 8%", () => {
    const vat = resolveVatRate(8, "Mieszkanie / Dom (VAT 8/23%)");
    expect(vat).toBe(8);
  });

  it("Biuro/Sklep → VAT 23%", () => {
    const vat = resolveVatRate(23, "Biuro / Sklep (VAT 23%)");
    expect(vat).toBe(23);
  });

  it("Explicit vat_rate=8 without object_type → 8%", () => {
    const vat = resolveVatRate(8, null);
    expect(vat).toBe(8);
  });

  it("Object type name 'Przemysł/Hala' → 23%", () => {
    const vat = resolveVatRate(23, "Przemysł / Hala (VAT 23%)");
    expect(vat).toBe(23);
  });
});

// ─────────────────────────────────────────────────────────────────
// MC-5: calculateMaterialTotal — full formula verification
// ─────────────────────────────────────────────────────────────────

describe("MC-5: calculateMaterialTotal — formula verification", () => {

  it("Cable 8mb, 9.50 PLN/mb, waste 1.10, margin 15%, VAT 8% — residential pump", () => {
    const ctx: MaterialPriceContext = {
      qty: 8, basePrice: 9.50, wasteFactor: 1.10, vatRate: 8, marginPct: 15,
    };
    const t = calculateMaterialTotal(ctx);
    // subtotal = 8 × 9.50 = 76.00
    expect(t.subtotal).toBe(76.00);
    // withWaste = 76.00 × 1.10 = 83.60
    expect(t.withWaste).toBe(83.60);
    // totalNet = 83.60 × 1.15 = 96.14
    expect(t.totalNet).toBe(96.14);
    // totalGross = 96.14 × 1.08 = 103.83
    expect(t.totalGross).toBe(103.83);
    // vatAmount = 103.83 - 96.14 = 7.69
    expect(t.vatAmount).toBe(7.69);
    // breakdown must contain margin and VAT tags
    expect(t.breakdown).toContain("marża15%");
    expect(t.breakdown).toContain("VAT8%");
    expect(t.breakdown).toContain("odpad");
  });

  it("MCB 1szt, 38 PLN, no waste, margin 15%, VAT 23% — commercial", () => {
    const ctx: MaterialPriceContext = {
      qty: 1, basePrice: 38.00, wasteFactor: 1.00, vatRate: 23, marginPct: 15,
    };
    const t = calculateMaterialTotal(ctx);
    // subtotal = 38.00
    expect(t.subtotal).toBe(38.00);
    // withWaste = 38.00 (no waste)
    expect(t.withWaste).toBe(38.00);
    // totalNet = 38.00 × 1.15 = 43.70
    expect(t.totalNet).toBe(43.70);
    // totalGross = 43.70 × 1.23 = 53.75
    expect(t.totalGross).toBe(53.75);
    // No waste tag in breakdown
    expect(t.breakdown).not.toContain("odpad");
    expect(t.breakdown).toContain("VAT23%");
  });

  it("Zero margin means totalNet = withWaste (pass-through pricing)", () => {
    const ctx: MaterialPriceContext = {
      qty: 5, basePrice: 10.00, wasteFactor: 1.00, vatRate: 23, marginPct: 0,
    };
    const t = calculateMaterialTotal(ctx);
    expect(t.withWaste).toBe(50.00);
    expect(t.totalNet).toBe(50.00);
  });

  it("Default constants: margin 15, VAT residential 8", () => {
    expect(DEFAULT_MATERIAL_MARGIN_PCT).toBe(15);
    expect(VAT_RESIDENTIAL).toBe(8);
    expect(VAT_COMMERCIAL).toBe(23);
  });

  it("Gips 10kg, 1.20 PLN/kg, waste 1.05, margin 15%, VAT 8%", () => {
    const ctx: MaterialPriceContext = {
      qty: 10, basePrice: 1.20, wasteFactor: 1.05, vatRate: 8, marginPct: 15,
    };
    const t = calculateMaterialTotal(ctx);
    // subtotal = 12.00
    expect(t.subtotal).toBe(12.00);
    // withWaste = 12.00 × 1.05 = 12.60
    expect(t.withWaste).toBe(12.60);
    // totalNet = 12.60 × 1.15 = 14.49
    expect(t.totalNet).toBe(14.49);
    // totalGross = 14.49 × 1.08 = 15.65
    expect(t.totalGross).toBe(15.65);
  });
});

// ─────────────────────────────────────────────────────────────────
// MC-6: Material Bridge — LaborIntent → MaterialBill
// ─────────────────────────────────────────────────────────────────

describe("MC-6: Material Bridge — scaleMaterialBill", () => {

  it("HEAVY_CONNECTION has a bill", () => {
    const bill = getMaterialBill("HEAVY_CONNECTION");
    expect(bill).not.toBeNull();
    expect(bill!.items.length).toBeGreaterThanOrEqual(3);
  });

  it("HEAVY_CONNECTION bill contains: cable, breaker, box", () => {
    const cats = getExpectedCategories("HEAVY_CONNECTION");
    expect(cats).toContain("CABLE");
    expect(cats).toContain("BREAKER");
    expect(cats).toContain("BOX");
  });

  it("Pompa: HEAVY_CONNECTION × 1 unit → cable scaled to 10mb (YKY 5×6)", () => {
    const scaled = scaleMaterialBill("HEAVY_CONNECTION", 1);
    const cable = scaled.find((s) => s.item.category === "CABLE");
    expect(cable).toBeDefined();
    expect(cable!.scaledQty).toBe(10); // 10mb × 1 unit (typowa trasa do pompy ciepła)
  });

  it("Pompa × 3 units → cable scaled to 30mb", () => {
    const scaled = scaleMaterialBill("HEAVY_CONNECTION", 3);
    const cable = scaled.find((s) => s.item.category === "CABLE");
    expect(cable!.scaledQty).toBe(30); // 10mb × 3
  });

  it("HARD_CONSTRUCTION bill contains plaster (for groove repair)", () => {
    const cats = getExpectedCategories("HARD_CONSTRUCTION");
    expect(cats).toContain("PLASTER");
  });

  it("GENERAL intent → no bill (null)", () => {
    const bill = getMaterialBill("GENERAL");
    expect(bill).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// Regression Lock
// ─────────────────────────────────────────────────────────────────

describe("Regression Lock — Material Brain", () => {

  it("CABLE_WASTE_FACTOR constant = 1.10 (never change without test update)", () => {
    expect(CABLE_WASTE_FACTOR).toBe(1.10);
  });

  it("normalizeMatUnit: CABLE → mb, PLASTER → kg, BREAKER → szt, HARDWARE → op", () => {
    expect(normalizeMatUnit("CABLE")).toBe("mb");
    expect(normalizeMatUnit("PLASTER")).toBe("kg");
    expect(normalizeMatUnit("BREAKER")).toBe("szt");
    expect(normalizeMatUnit("HARDWARE")).toBe("op");
  });

  it("classifyMaterial('YKY 5x6') → CABLE category (pump power cable)", () => {
    const p = classifyMaterial("Kabel YKY 5x6 mm2");
    expect(p.category).toBe("CABLE");
    expect(p.forcedUnit).toBe("mb");
    expect(p.wasteFactor).toBe(1.10);
  });

  it("VAT formula: totalGross = totalNet × (1 + vat/100) strictly", () => {
    const ctx: MaterialPriceContext = {
      qty: 1, basePrice: 100, wasteFactor: 1.0, vatRate: 23, marginPct: 0,
    };
    const t = calculateMaterialTotal(ctx);
    expect(t.totalGross).toBe(Math.round(100 * 1.23 * 100) / 100);
    expect(t.vatAmount).toBe(Math.round(t.totalGross * 100 - t.totalNet * 100) / 100);
  });
});
