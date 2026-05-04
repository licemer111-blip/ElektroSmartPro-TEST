/**
 * row-summary-parity.test.ts
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * Phase 6 regression guard.
 *
 * Locks the invariant: Σ(row laborTotal in EstimateTable) === ProjectSummary.laborTotal
 * even when narzut (matMarkupMult / labMarkupMult) is active.
 *
 * Pre-fix bug: EstimateRow.tsx called calcRowPrices with hardcoded 1.0 for
 * matMarkupMult / labMarkupMult / complexityFactor. ProjectSummary applied them.
 * Result: at e.g. lab_markup_pct=20%, table cells were 20% smaller than
 * summary contribution → user saw "Σ row totals ≠ SUMA NETTO".
 *
 * Fix: ProjectTabContainer now threads matMarkupMult / labMarkupMult / complexityFactor
 * through EstimateTable → EstimateRow → calcRowPrices. They MUST equal the values
 * used in ProjectSummary.calculateTotals.
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { calcRowPrices } from "@/lib/pricing-calculations";
import type { ProjectItem } from "@/lib/types/database";

function makeItem(partial: Partial<ProjectItem>): ProjectItem {
  return {
    id: "test-item",
    project_id: "p",
    name: "Generic item",
    unit: "szt",
    quantity: 1,
    sort_order: 0,
    created_at: "2026-05-04T19:00:00Z",
    catalog_item_id: null,
    is_assembly_child: false,
    parent_assembly_id: null,
    final_material_price: 0,
    final_labor_price: 0,
    confidence_level: "estimated",
    ...partial,
  } as ProjectItem;
}

/**
 * Replicates the labor side of project-summary.tsx::calculateTotals for ONE non-manual item.
 * Used to verify row laborTotal == summary contribution.
 */
function summaryLaborContribution(
  item: ProjectItem,
  adjustmentMult: number,
  regionModifier: number,
  labMarkupMult: number,
  knrMultiplier: number,
): number {
  const effectiveLaborPrice = item.final_labor_price ?? item.labor_price ?? 0;
  const isManual = item.confidence_level === "manual";
  const effectiveRegion = isManual ? 1.0 : regionModifier;
  // baseLaborTotal accumulator in project-summary.tsx
  const baseLaborTotal = effectiveLaborPrice * item.quantity * effectiveRegion * labMarkupMult * knrMultiplier;
  // Final laborTotal = baseLaborTotal × adjustmentMult
  return baseLaborTotal * adjustmentMult;
}

function summaryMaterialContribution(
  item: ProjectItem,
  adjustmentMult: number,
  matMarkupMult: number,
  materialsOwnedByCustomer: boolean,
): number {
  if (materialsOwnedByCustomer) return 0;
  const effectiveMatPrice = item.final_material_price ?? item.material_price ?? 0;
  const baseMaterialTotal = effectiveMatPrice * item.quantity * matMarkupMult;
  return baseMaterialTotal * adjustmentMult;
}

describe("Phase 6 — row-cell totals match ProjectSummary contributions (with multipliers)", () => {
  const SCENARIOS = [
    { name: "no multipliers", adj: 1.0, region: 1.0, mat: 1.0, lab: 1.0, complex: 1.0, knr: 1.0 },
    { name: "narzut 20% / 10%", adj: 1.0, region: 1.0, mat: 1.10, lab: 1.20, complex: 1.0, knr: 1.0 },
    { name: "KNR 2026 active", adj: 1.0, region: 1.0, mat: 1.0, lab: 1.0, complex: 1.0, knr: 1.5 },
    { name: "negocjacja +5%", adj: 1.05, region: 1.0, mat: 1.0, lab: 1.0, complex: 1.0, knr: 1.0 },
    { name: "Mazowieckie region 1.12", adj: 1.0, region: 1.12, mat: 1.0, lab: 1.0, complex: 1.0, knr: 1.0 },
    { name: "ALL stacked (real prod scenario)", adj: 1.05, region: 1.12, mat: 1.10, lab: 1.20, complex: 1.0, knr: 1.5 },
  ];

  const ITEMS: ProjectItem[] = [
    makeItem({ id: "a", name: "Cable YKY 3×2,5", unit: "mb", quantity: 1200, final_labor_price: 33, final_material_price: 6.5 }),
    makeItem({ id: "b", name: "Gniazdo 230V",     unit: "szt", quantity: 25,  final_labor_price: 102, final_material_price: 22 }),
    makeItem({ id: "c", name: "Łącznik",          unit: "szt", quantity: 60,  final_labor_price: 75,  final_material_price: 15 }),
    makeItem({ id: "d", name: "Rozdzielnica RG",  unit: "szt", quantity: 1,   final_labor_price: 1500, final_material_price: 2000 }),
  ];

  SCENARIOS.forEach((sc) => {
    it(`${sc.name}: Σ row labor (cells) == Σ summary labor`, () => {
      let rowLaborSum = 0;
      let summaryLaborSum = 0;

      for (const item of ITEMS) {
        const row = calcRowPrices(
          item,
          sc.adj,
          /* materialsOwnedByCustomer */ false,
          "all",
          sc.region,
          sc.mat,
          sc.lab,
          sc.complex,
          sc.knr,
        );
        rowLaborSum += row.laborTotal;
        summaryLaborSum += summaryLaborContribution(item, sc.adj, sc.region, sc.lab, sc.knr);
      }

      // Allow up to 1 zł rounding tolerance across 4 items × 2-pass rounding.
      expect(Math.abs(rowLaborSum - summaryLaborSum)).toBeLessThan(1);
    });

    it(`${sc.name}: Σ row material (cells) == Σ summary material`, () => {
      let rowMatSum = 0;
      let summaryMatSum = 0;

      for (const item of ITEMS) {
        const row = calcRowPrices(
          item,
          sc.adj,
          false,
          "all",
          sc.region,
          sc.mat,
          sc.lab,
          sc.complex,
          sc.knr,
        );
        rowMatSum += row.materialTotal;
        summaryMatSum += summaryMaterialContribution(item, sc.adj, sc.mat, false);
      }

      expect(Math.abs(rowMatSum - summaryMatSum)).toBeLessThan(1);
    });
  });

  it("Bug repro: with hardcoded 1.0 markups (pre-fix) vs real labMarkupMult=1.20, row was 20% smaller", () => {
    const item = ITEMS[0]; // cable 33 zł × 1200 mb
    const PRE_FIX = calcRowPrices(item, 1.0, false, "all", 1.0, /* mat */ 1.0, /* lab */ 1.0, 1.0, 1.0);
    const POST_FIX = calcRowPrices(item, 1.0, false, "all", 1.0, /* mat */ 1.10, /* lab */ 1.20, 1.0, 1.0);
    const summaryAt20pct = summaryLaborContribution(item, 1.0, 1.0, 1.20, 1.0);

    // Pre-fix: row labor = 33 × 1200 × 1.0 = 39 600.
    expect(PRE_FIX.laborTotal).toBe(39_600);
    // Summary at +20% narzut: 33 × 1200 × 1.20 = 47 520.
    expect(summaryAt20pct).toBe(47_520);
    // Post-fix: row matches summary.
    expect(POST_FIX.laborTotal).toBe(47_520);
    // Confirms the gap that motivated this regression test.
    expect(summaryAt20pct - PRE_FIX.laborTotal).toBe(7_920);
  });
});

describe("Phase 6 — Industrial ROZDZIELNICA labor norm bumped 28→40 rbh", () => {
  it("INDUSTRIAL ROZDZIELNICA template totalRBH reflects the bumped norm", async () => {
    const { expandToAssembly, detectSector } = await import("@/lib/ai/smart-mapping-engine");
    const expansion = expandToAssembly(
      "Montaż rozdzielnicy hala produkcyjna",
      1,                            // 1 szt
      "INDUSTRIAL",
      100,                          // 100 zł/rbh
      1.0,                          // knr multiplier (test-isolated)
    );
    expect(expansion.triggered).toBe(true);
    if (expansion.triggered) {
      // 40 rbh (single labor item; all material items have rbhPerUnit = 0)
      expect(expansion.totalRBH).toBe(40);
      expect(expansion.totalLaborPLN).toBe(4000);
      // Sanity: residential and commercial templates stay UNDER industrial
      const res = expandToAssembly("Montaż rozdzielnicy mieszkanie", 1, "RESIDENTIAL", 100, 1.0);
      const com = expandToAssembly("Montaż rozdzielnicy biuro", 1, "COMMERCIAL", 100, 1.0);
      if (res.triggered && com.triggered) {
        expect(res.totalRBH).toBeLessThan(expansion.totalRBH);
        expect(com.totalRBH).toBeLessThan(expansion.totalRBH);
      }
      // Suppress unused warning
      void detectSector;
    }
  });
});
