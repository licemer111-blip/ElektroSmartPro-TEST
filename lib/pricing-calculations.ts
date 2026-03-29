// ============================================================
// pricing-calculations.ts — Pure pricing logic for EstimateTable
// ============================================================
// All functions are pure (no side effects) and unit-testable.
// Used by EstimateRow, EstimateFooter, and estimate-table.tsx.

import type { ProjectItem } from "@/lib/types/database";
import { roundPrice } from "@/hooks/use-global-settings";

// ─── VAT rates ────────────────────────────────────────────────────────────────
export const VAT_RATES = {
  standard: 0.23,   // 23% — B2B / commercial
  reduced: 0.08,    // 8%  — residential service + material
  zero: 0.00,
} as const;

export type VatRate = keyof typeof VAT_RATES;

// ─── Row-level calculations ───────────────────────────────────────────────────

export interface RowPrices {
  // ── "Sacred Cell" values — always Base Netto, no multipliers ──────────────
  materialUnitBase: number;  // raw material price per unit (netto, no adj/region)
  laborUnitBase: number;     // raw labor price per unit (netto, no adj/region)
  materialTotalBase: number; // materialUnitBase × quantity (shown in Material column)
  laborTotalBase: number;    // laborUnitBase × quantity (shown in Labor column)
  // ── "Smart Total" values — with multipliers, shown in Suma column ─────────
  materialUnit: number;   // unit material price (after adjustment, 0 if customer-owned)
  laborUnit: number;      // unit labor price (after adjustment + region)
  materialTotal: number;  // materialUnit × quantity
  laborTotal: number;     // laborUnit × quantity
  rowTotal: number;       // materialTotal + laborTotal (or filtered subset)
}

/**
 * Calculate all prices for a single row.
 *
 * Architecture: "Clean Table — Smart Total"
 *   - *Base values (materialUnitBase/laborUnitBase): always raw Base Netto.
 *     These are shown in the Cena Jednostkowa cells — never change on toggle.
 *   - *Total values (materialUnit/laborUnit): apply adjustmentMult + regionModifier.
 *     These feed the Suma column and Summary panel.
 *   - Manual prices: skip ALL multipliers (both base and total are the same raw value).
 *
 * @param item              ProjectItem
 * @param adjustmentMult    1 + adjustmentPercentage/100
 * @param materialsOwnedByCustomer  if true, material = 0
 * @param filterType        "all" | "materials" | "labor" — controls rowTotal
 * @param regionModifier    voivodeship price modifier (default 1.0)
 */
export function calcRowPrices(
  item: ProjectItem,
  adjustmentMult: number,
  materialsOwnedByCustomer: boolean,
  filterType: "all" | "materials" | "labor" = "all",
  regionModifier: number = 1.0,
  matMarkupMult: number = 1.0,  // v3.0: 1 + mat_markup_pct/100
  labMarkupMult: number = 1.0,  // v3.0: 1 + lab_markup_pct/100
  complexityFactor: number = 1.0, // v3.0: labor complexity multiplier at display time
): RowPrices {
  const rawMat = item.final_material_price ?? item.material_price ?? 0;
  const rawLab = item.final_labor_price ?? item.labor_price ?? 0;

  // Manual prices: skip regionModifier (price is sovereign/final for region)
  // but APPLY adjustmentMult — negocjacje is a project-level discount/markup for ALL rows.
  const isManual = item.confidence_level === "manual";
  const effectiveAdjMult = adjustmentMult; // negocjacje applies to manual too
  const effectiveRegionModifier = isManual ? 1.0 : regionModifier;

  // v3.0: Ryczałt — lump sum positions: total = unit price × 1 (quantity ignored in totals)
  const effectiveQty = item.is_lump_sum ? 1 : item.quantity;

  // Materiał Inwestora: per-row override — material is always 0, labor billed normally.
  // Takes precedence over stored prices but does NOT affect VAT/markup on labor.
  const suppressMaterial = materialsOwnedByCustomer || item.is_investor_material === true;

  // ── Base Netto (Sacred Cell) — no multipliers ──────────────────────────────
  const materialUnitBase = suppressMaterial ? 0 : rawMat;
  const laborUnitBase = rawLab;
  const materialTotalBase = roundPrice(materialUnitBase * effectiveQty);
  const laborTotalBase = roundPrice(laborUnitBase * effectiveQty);

  // ── Smart Total — with adjustment + region modifier + v3 markups ─────────────
  // roundPrice() applied ONLY to final totals — not to unit prices.
  // v3 order: base × matMarkup × adjMult (negocjacje)
  const materialUnit = suppressMaterial ? 0 : rawMat * matMarkupMult * effectiveAdjMult;
  const laborUnit = rawLab * labMarkupMult * complexityFactor * effectiveAdjMult * effectiveRegionModifier;
  const materialTotal = roundPrice(materialUnit * effectiveQty);
  const laborTotal = roundPrice(laborUnit * effectiveQty);

  const rowTotal =
    filterType === "materials"
      ? materialTotal
      : filterType === "labor"
        ? laborTotal
        : roundPrice(materialTotal + laborTotal);

  return {
    materialUnitBase, laborUnitBase, materialTotalBase, laborTotalBase,
    materialUnit, laborUnit, materialTotal, laborTotal, rowTotal,
  };
}

// ─── Project-level totals ─────────────────────────────────────────────────────

export interface ProjectTotals {
  totalMaterialNet: number;   // Σ material (netto)
  totalLaborNet: number;      // Σ robocizna (netto)
  totalNet: number;           // totalMaterialNet + totalLaborNet
  contingencyAmount: number;  // v3.0: rezerwa budżetowa amount
  totalNetWithContingency: number; // v3.0: totalNet + contingency
  vatMaterial: number;        // VAT on material (on totalNet+contingency)
  vatLabor: number;           // VAT on labor (on totalNet+contingency)
  totalVat: number;           // vatMaterial + vatLabor
  totalGross: number;         // totalNetWithContingency + totalVat
  marginAmount: number;       // totalNet - costBase (if costBase provided)
  marginPercent: number;      // marginAmount / costBase * 100
}

/**
 * Compute project-level totals with VAT.
 * Formula: Total_gross = Σ (Price_net × (1 + VAT))
 *
 * @param items                 All project items (top-level + children)
 * @param adjustmentMult        1 + adjustmentPercentage/100
 * @param materialsOwnedByCustomer
 * @param vatRateMaterial       VAT rate for materials (default 0.23)
 * @param vatRateLabor          VAT rate for labor (default 0.08)
 * @param costBase              Optional cost base for margin calculation
 */
export function calcProjectTotals(
  items: ProjectItem[],
  adjustmentMult: number,
  materialsOwnedByCustomer: boolean,
  vatRateMaterial: number = VAT_RATES.standard,
  vatRateLabor: number = VAT_RATES.reduced,
  costBase?: number,
  regionModifier: number = 1.0,
  contingencyPct: number = 0,        // v3.0: rezerwa budżetowa %
  matMarkupMult: number = 1.0,       // v3.0: 1 + mat_markup_pct/100
  labMarkupMult: number = 1.0,       // v3.0: 1 + lab_markup_pct/100
  complexityFactor: number = 1.0,    // v3.0: labor complexity multiplier
): ProjectTotals {
  let totalMaterialNet = 0;
  let totalLaborNet = 0;

  for (const item of items) {
    const { materialTotal, laborTotal } = calcRowPrices(
      item,
      adjustmentMult,
      materialsOwnedByCustomer,
      "all",
      regionModifier,
      matMarkupMult,
      labMarkupMult,
      complexityFactor,
    );
    totalMaterialNet += materialTotal;
    totalLaborNet += laborTotal;
  }

  const totalNet = totalMaterialNet + totalLaborNet;

  // v3.0: Rezerwa budżetowa — applied BEFORE VAT
  const contingencyAmount = roundPrice(totalNet * (contingencyPct / 100));
  const totalNetWithContingency = totalNet + contingencyAmount;

  // VAT applied proportionally to the contingency-adjusted total
  const matShare = totalNet > 0 ? totalMaterialNet / totalNet : 0.5;
  const labShare = totalNet > 0 ? totalLaborNet   / totalNet : 0.5;
  const vatMaterial = totalNetWithContingency * matShare * vatRateMaterial;
  const vatLabor    = totalNetWithContingency * labShare * vatRateLabor;
  const totalVat = vatMaterial + vatLabor;
  const totalGross = totalNetWithContingency + totalVat;

  const base = costBase ?? 0;
  const marginAmount = base > 0 ? totalNet - base : 0;
  const marginPercent = base > 0 ? (marginAmount / base) * 100 : 0;

  return {
    totalMaterialNet,
    totalLaborNet,
    totalNet,
    contingencyAmount,
    totalNetWithContingency,
    vatMaterial,
    vatLabor,
    totalVat,
    totalGross,
    marginAmount,
    marginPercent,
  };
}

// ─── Narzuty (KNR surcharges) ─────────────────────────────────────────────────

export interface NarzutyParams {
  kpPercent: number;  // Koszty Pośrednie — % of labor
  zPercent: number;   // Zysk — % of (labor + Kp)
  kzPercent: number;  // Koszty Zakupu — % of materials
}

export interface NarzutyTotals {
  kpAmount: number;
  zAmount: number;
  kzAmount: number;
  totalNarzuty: number;
}

/**
 * Compute Polish KNR narzuty (surcharges) from net labor and material totals.
 * Formula:
 *   Kp = kpPercent% × R
 *   Z  = zPercent%  × (R + Kp)
 *   Kz = kzPercent% × M
 *   totalNarzuty = Kp + Z + Kz
 */
export function calcNarzuty(
  laborNet: number,
  materialNet: number,
  params: NarzutyParams,
): NarzutyTotals {
  const kpAmount = laborNet * (params.kpPercent / 100);
  const zAmount = (laborNet + kpAmount) * (params.zPercent / 100);
  const kzAmount = materialNet * (params.kzPercent / 100);
  return {
    kpAmount: roundPrice(kpAmount),
    zAmount: roundPrice(zAmount),
    kzAmount: roundPrice(kzAmount),
    totalNarzuty: roundPrice(kpAmount + zAmount + kzAmount),
  };
}

// ─── Section subtotals ────────────────────────────────────────────────────────

/**
 * Calculate subtotal for a section group (top-level items + their children).
 * All v3.0 multipliers must be passed in to match calcProjectTotals output.
 */
export function calcSectionSubtotal(
  sectionTopItems: ProjectItem[],
  childrenMap: Map<string, ProjectItem[]>,
  adjustmentMult: number,
  materialsOwnedByCustomer: boolean,
  regionModifier: number = 1.0,
  matMarkupMult: number = 1.0,    // v3.0: 1 + mat_markup_pct/100
  labMarkupMult: number = 1.0,    // v3.0: 1 + lab_markup_pct/100
  complexityFactor: number = 1.0, // v3.0: labor complexity multiplier
): number {
  let subtotal = 0;
  for (const item of sectionTopItems) {
    const children = childrenMap.get(item.id) || [];
    if (children.length > 0) {
      for (const child of children) {
        const { rowTotal } = calcRowPrices(child, adjustmentMult, materialsOwnedByCustomer, "all", regionModifier, matMarkupMult, labMarkupMult, complexityFactor);
        subtotal += rowTotal;
      }
    } else {
      const { rowTotal } = calcRowPrices(item, adjustmentMult, materialsOwnedByCustomer, "all", regionModifier, matMarkupMult, labMarkupMult, complexityFactor);
      subtotal += rowTotal;
    }
  }
  return subtotal;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a price to 2 decimal places string */
export function formatPrice(value: number): string {
  return value.toFixed(2);
}

/** Format price in Polish locale with currency */
export function formatPricePL(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " zł";
}
