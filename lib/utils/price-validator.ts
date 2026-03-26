/**
 * price-validator.ts
 * Server-side / shared utility for AI-generated price sanity checks.
 * Provides:
 *   - clampPrice()    — clamps hallucinated material/labor prices to market ceilings
 *   - LABOR_UNIT_FALLBACK — minimum labor prices per unit
 *   - KNR_LABOR_FALLBACK_MAP — regex-based KNR code lookup for labor items
 */

// ─── Market price ceilings (Polska 2026 NETTO) ────────────────────────────────
export const MATERIAL_PRICE_CEILING: Array<{
  keywords: string[];
  unit: string;
  max: number;
  marketPrice: number;
}> = [
  { keywords: ["ydyp", "3x1", "3x1,5", "3x1.5"], unit: "mb", max: 12, marketPrice: 5.5 },
  { keywords: ["ydyp", "3x2,5", "3x2.5"], unit: "mb", max: 14, marketPrice: 7.2 },
  { keywords: ["ydyp", "5x2,5", "5x2.5", "5x4"], unit: "mb", max: 28, marketPrice: 14.5 },
  { keywords: ["ydyzo", "3x1"], unit: "mb", max: 25, marketPrice: 18.0 },
  { keywords: ["yky", "5x4", "5x6"], unit: "mb", max: 28, marketPrice: 18.0 },
  { keywords: ["yky", "5x10"], unit: "mb", max: 55, marketPrice: 42.0 },
  { keywords: ["yky", "5x16"], unit: "mb", max: 80, marketPrice: 65.0 },
  { keywords: ["utp", "kat.6"], unit: "mb", max: 8, marketPrice: 4.0 },
  { keywords: ["utp", "kat6"], unit: "mb", max: 8, marketPrice: 4.0 },
  { keywords: ["puszka", "podtynkowa"], unit: "szt", max: 12, marketPrice: 3.5 },
  { keywords: ["gniazdo", "pojedyncze"], unit: "szt", max: 45, marketPrice: 22.0 },
  { keywords: ["gniazdo", "p/t"], unit: "szt", max: 50, marketPrice: 24.0 },
  { keywords: ["gniazdo", "podtynkow"], unit: "szt", max: 50, marketPrice: 24.0 },
  { keywords: ["gniazdo", "podwójne"], unit: "szt", max: 60, marketPrice: 30.0 },
  { keywords: ["gniazdo", "ip44"], unit: "szt", max: 75, marketPrice: 35.0 },
  { keywords: ["łącznik", "pojedynczy"], unit: "szt", max: 30, marketPrice: 15.0 },
  { keywords: ["łącznik", "schodowy"], unit: "szt", max: 42, marketPrice: 22.0 },
  { keywords: ["łącznik", "krzyżowy"], unit: "szt", max: 45, marketPrice: 28.0 },
  { keywords: ["wyłącznik", "b16"], unit: "szt", max: 55, marketPrice: 25.0 },
  { keywords: ["wyłącznik", "b10"], unit: "szt", max: 50, marketPrice: 22.0 },
  { keywords: ["wyłącznik", "b20"], unit: "szt", max: 55, marketPrice: 25.0 },
  { keywords: ["wyłącznik", "b25"], unit: "szt", max: 60, marketPrice: 28.0 },
  { keywords: ["rcd", "25a", "30ma", "2p"], unit: "szt", max: 150, marketPrice: 95.0 },
  { keywords: ["korytko", "pcv", "40x25"], unit: "mb", max: 15, marketPrice: 8.0 },
  { keywords: ["korytko", "pcv", "60x40"], unit: "mb", max: 22, marketPrice: 14.0 },
  { keywords: ["rura", "instalacyjna", "pcv"], unit: "mb", max: 8, marketPrice: 3.0 },
];

export const LABOR_PRICE_CEILING: Array<{
  keywords: string[];
  unit: string;
  max: number;
  marketPrice: number;
}> = [
  { keywords: ["montaż", "gniazda"], unit: "szt", max: 60, marketPrice: 28.0 },
  { keywords: ["montaż", "łącznika"], unit: "szt", max: 55, marketPrice: 25.0 },
  { keywords: ["montaż", "osprzętu"], unit: "szt", max: 60, marketPrice: 28.0 },
  { keywords: ["kucie", "bruzd"], unit: "mb", max: 30, marketPrice: 20.0 },
  { keywords: ["bruzdowanie"], unit: "mb", max: 30, marketPrice: 20.0 },
  // Heavy WLZ cables — MUST precede generic "układanie kabel/przewod" entries.
  // Prevents thin-wire ceiling (max=15 PLN/mb) from clamping WLZ labor down.
  { keywords: ["wlz"],            unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["ykyzo"],          unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["ykyżo"],          unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["yky"],            unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["nhxmh"],          unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["n2xh"],           unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["lgyo"],           unit: "mb", max: 130, marketPrice: 55.0 },
  { keywords: ["układanie", "przewod"], unit: "mb", max: 15, marketPrice: 10.0 },
  { keywords: ["układanie", "kabel"],   unit: "mb", max: 15, marketPrice: 10.0 },
  { keywords: ["montaż", "oprawy"], unit: "szt", max: 75, marketPrice: 40.0 },
  { keywords: ["montaż", "puszki"], unit: "szt", max: 25, marketPrice: 15.0 },
];

// ─── Quantity limits per unit in assembly context ───────────────────────────────
// "setKeywords" match the parent assembly name; "itemKeywords" match the child item
export const QUANTITY_LIMITS: Array<{
  setKeywords: string[];
  itemKeywords: string[];
  unit: string;
  maxQty: number;
  defaultQty: number;
}> = [
  { setKeywords: ["gniazdo"], itemKeywords: ["kabel", "przewod", "ydyp"], unit: "mb", maxQty: 7.0, defaultQty: 5.0 },
  { setKeywords: ["gniazdo"], itemKeywords: ["bruzd", "kucie", "bruzdowanie"], unit: "mb", maxQty: 7.0, defaultQty: 5.0 },
  { setKeywords: ["łącznik", "switch"], itemKeywords: ["kabel", "przewod"], unit: "mb", maxQty: 7.0, defaultQty: 4.0 },
  { setKeywords: ["łącznik", "switch"], itemKeywords: ["bruzd", "kucie"], unit: "mb", maxQty: 7.0, defaultQty: 4.0 },
  { setKeywords: ["oprawa", "oświetlenie"], itemKeywords: ["kabel", "przewod"], unit: "mb", maxQty: 7.0, defaultQty: 4.0 },
];

/**
 * Clamps a quantity for an item within an assembly.
 * @param setName - name of the parent assembly (e.g. "Punkt gniazda 230V")
 * @param itemName - name of the child item (e.g. "Przewód YDYp 3x2,5mm²")
 * @param unit - unit of measure (mb, szt, kpl)
 * @param qty - AI-generated quantity
 * @returns clamped quantity
 */
export function clampQuantity(
  setName: string,
  itemName: string,
  unit: string,
  qty: number
): number {
  const setLower = setName.toLowerCase();
  const itemLower = itemName.toLowerCase();
  const unitLower = unit.toLowerCase();

  for (const limit of QUANTITY_LIMITS) {
    const setMatch = limit.setKeywords.some((kw) => setLower.includes(kw));
    const itemMatch = limit.itemKeywords.some((kw) => itemLower.includes(kw));
    const unitMatch = limit.unit === unitLower;
    if (setMatch && itemMatch && unitMatch && qty > limit.maxQty) {
      return limit.defaultQty;
    }
  }
  return qty;
}

// ─── Minimum labor fallback prices ────────────────────────────────────────────
export const LABOR_UNIT_FALLBACK: Record<string, number> = {
  szt: 25,
  mb: 12,
  kpl: 180,
  h: 45,
  m2: 85,
  "m²": 85,
};

// ─── KNR code fallback map (regex-based) ─────────────────────────────────────
const KNR_LABOR_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /gniazdo|łącznik|osprzęt/i, code: "KNR 5-04 0202-01" },
  { pattern: /puszka\s*(podtynkowa|elektr)/i, code: "KNR 5-04 0601-01" },
  { pattern: /bruzd|bruzdowanie|kucie/i, code: "KNR 5-04 0701-01" },
  { pattern: /przewód|przewod|kabel|układanie/i, code: "KNR 5-04 0101-01" },
  { pattern: /oprawa|oświetlen|downlight|panel.*led/i, code: "KNR 5-04 0401-01" },
  { pattern: /mcb|rcd|rcbo|aparat.*moduł|wyłącznik.*różnic/i, code: "KNR 5-08 0201-01" },
  { pattern: /rozdzielni|tablica/i, code: "KNR 5-08 0101-01" },
  { pattern: /pomiar|odbiór|protokół/i, code: "KNR 5-04 1501-01" },
  { pattern: /kamera|domofon|wideo/i, code: "KNR 5-09 0401-01" },
  { pattern: /alarm|czujk/i, code: "KNR 5-09 0301-01" },
  { pattern: /uziemien|odgrom/i, code: "KNR 5-04 1401-01" },
  { pattern: /korytko|drabink|tras/i, code: "KNR 5-04 0501-01" },
];

/**
 * Returns a KNR code for a labor item name, or the generic fallback.
 */
export function lookupKnrForLabor(name: string): string {
  for (const { pattern, code } of KNR_LABOR_PATTERNS) {
    if (pattern.test(name)) return code;
  }
  return "KNR 5-04 0202-01"; // generic: montaż osprzętu
}

/**
 * Clamps a price to the market ceiling for the given item name and unit.
 * If price > max, returns marketPrice (realistic fallback), not just the ceiling.
 * Returns the original price if no ceiling applies.
 */
export function clampPrice(
  name: string,
  unit: string,
  price: number,
  type: "material" | "labor"
): number {
  const ceilings = type === "material" ? MATERIAL_PRICE_CEILING : LABOR_PRICE_CEILING;
  // Normalize Unicode multiplication sign × (U+00D7) → ASCII x so "3×1,5" matches "3x1,5"
  const nameLower = name.toLowerCase().replace(/×/g, "x");
  const unitLower = unit.toLowerCase();

  for (const ceiling of ceilings) {
    const unitMatch = !ceiling.unit || ceiling.unit === unitLower;
    const kwMatch = ceiling.keywords.every((kw) => nameLower.includes(kw));
    if (unitMatch && kwMatch && price > ceiling.max) {
      return ceiling.marketPrice;
    }
  }
  return price;
}

/** Alias for backwards compatibility and external callers */
export const lookupKnrFallback = lookupKnrForLabor;

// ─── Labor norm ceilings (rbh per unit) — independent of hourly rate ────────
export const LABOR_NORM_CEILING: Array<{
  keywords: string[];
  unit: string;
  maxNorm: number;
  typicalNorm: number;
}> = [
  { keywords: ["kucie", "bruzd"], unit: "mb", maxNorm: 0.20, typicalNorm: 0.08 },
  { keywords: ["bruzdowanie"], unit: "mb", maxNorm: 0.20, typicalNorm: 0.08 },
  // Heavy WLZ cables — MUST precede generic "układanie kabel/przewod" entries.
  // Real KNR norms for WLZ ≥10mm²: 0.60–1.20 rbh/mb (KNR 5-04 0101-02..05).
  // Without these entries, clampLaborNorm would cap them at thin-wire 0.032 rbh/mb.
  { keywords: ["wlz"],   unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["ykyzo"], unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["ykyżo"], unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["yky"],   unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["nhxmh"], unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["n2xh"],  unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["lgyo"],  unit: "mb", maxNorm: 2.0, typicalNorm: 0.70 },
  { keywords: ["układanie", "przewod"], unit: "mb", maxNorm: 0.12, typicalNorm: 0.032 },
  { keywords: ["układanie", "kabel"], unit: "mb", maxNorm: 0.12, typicalNorm: 0.032 },
  { keywords: ["układanie", "przewód"], unit: "mb", maxNorm: 0.12, typicalNorm: 0.032 },
  { keywords: ["montaż", "puszki"], unit: "szt", maxNorm: 0.40, typicalNorm: 0.12 },
  { keywords: ["montaż", "gniazda"], unit: "szt", maxNorm: 0.60, typicalNorm: 0.20 },
  { keywords: ["montaż", "łącznika"], unit: "szt", maxNorm: 0.50, typicalNorm: 0.18 },
  { keywords: ["montaż", "oprawy"], unit: "szt", maxNorm: 0.80, typicalNorm: 0.35 },
  { keywords: ["montaż", "osprzętu"], unit: "szt", maxNorm: 0.60, typicalNorm: 0.20 },
  { keywords: ["pomiar", "odbiorcz"], unit: "szt", maxNorm: 0.40, typicalNorm: 0.20 },
  { keywords: ["pomiar"], unit: "szt", maxNorm: 0.50, typicalNorm: 0.25 },
  { keywords: ["wyłącznik", "mcb"], unit: "szt", maxNorm: 0.30, typicalNorm: 0.15 },
  { keywords: ["rcd", "rcbo"], unit: "szt", maxNorm: 0.35, typicalNorm: 0.20 },
];

/**
 * Clamps an AI-generated labor norm (rbh/unit) to realistic KNR values.
 * Returns the typicalNorm if the AI norm exceeds maxNorm (likely hallucination).
 */
export function clampLaborNorm(
  name: string,
  unit: string,
  norm: number
): number {
  if (norm <= 0) return norm;
  const nameLower = name.toLowerCase().replace(/×/g, "x");
  const unitLower = unit.toLowerCase();
  for (const ceiling of LABOR_NORM_CEILING) {
    const unitMatch = !ceiling.unit || ceiling.unit === unitLower;
    const kwMatch = ceiling.keywords.every((kw) => nameLower.includes(kw));
    if (unitMatch && kwMatch && norm > ceiling.maxNorm) {
      return ceiling.typicalNorm;
    }
  }
  return norm;
}

/**
 * Full post-processing guard for a single AI-generated catalog item.
 * Returns corrected { base_labor_price, base_material_price, knr_code }.
 */
export function applyPriceGuard(item: {
  name: string;
  unit: string | null;
  base_labor_price: number;
  base_material_price: number;
  knr_code: string | null;
}): {
  base_labor_price: number;
  base_material_price: number;
  knr_code: string | null;
} {
  const unit = (item.unit ?? "szt").toLowerCase();
  const isLabor = item.base_labor_price > 0;

  let laborPrice = item.base_labor_price;
  let materialPrice = item.base_material_price;
  let knrCode = item.knr_code;

  if (isLabor) {
    if (!knrCode) knrCode = lookupKnrForLabor(item.name);
    if (laborPrice <= 0) laborPrice = LABOR_UNIT_FALLBACK[unit] ?? 25;
    laborPrice = clampPrice(item.name, unit, laborPrice, "labor");
  } else {
    materialPrice = clampPrice(item.name, unit, materialPrice, "material");
  }

  return { base_labor_price: laborPrice, base_material_price: materialPrice, knr_code: knrCode };
}
