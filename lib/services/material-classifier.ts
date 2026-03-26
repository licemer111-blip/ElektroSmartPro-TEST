/**
 * lib/services/material-classifier.ts
 * ─────────────────────────────────────────────────────────────────
 * PURE functions: NO server-side imports, NO Supabase, NO Next.js.
 * Material Brain — mirrors semantic-classifier.ts for the material layer.
 *
 * Exports:
 *   classifyMaterial(name)          → MaterialProfile
 *   calculateMaterialTotal(ctx)     → MaterialTotal
 *   extractMaterialSpec(name)       → string | null
 *   normalizeMatUnit(category)      → "mb" | "szt" | "kg" | "op"
 *   CABLE_WASTE_FACTOR              → 1.10
 *   DEFAULT_MATERIAL_MARGIN_PCT     → 15
 */

// ─────────────────────────────────────────────────────────────────
// Constants (exported for tests)
// ─────────────────────────────────────────────────────────────────

/** Default material waste factor for cables (10% for cuts/preparation). */
export const CABLE_WASTE_FACTOR        = 1.10;
/** Default waste factor for consumables (gips, zaprawa — 5%). */
export const CONSUMABLE_WASTE_FACTOR   = 1.05;
/** Default waste factor for other materials (no waste expected). */
export const DEFAULT_WASTE_FACTOR      = 1.00;

/** Default contractor markup on materials (PLN buy → PLN sell). */
export const DEFAULT_MATERIAL_MARGIN_PCT = 15;

/** VAT rate for residential projects (Mieszkanie/Dom ≤150m², budownictwo mieszkaniowe). */
export const VAT_RESIDENTIAL = 8;
/** VAT rate for commercial/industrial projects (Biuro, Sklep, Przemysł). */
export const VAT_COMMERCIAL  = 23;

// ─────────────────────────────────────────────────────────────────
// Material categories
// ─────────────────────────────────────────────────────────────────

export type MaterialCategory =
  | "CABLE"       // kabel/przewód/YDYp/YKY/NYY → mb, waste +10%
  | "BREAKER"     // bezpiecznik/wyłącznik/MCB/RCD/RCBO → szt
  | "SOCKET"      // gniazdo/wtyczka/rozgałęźnik → szt
  | "SWITCH"      // łącznik/włącznik/dimmer → szt
  | "BOX"         // puszka/skrzynka/obudowa → szt
  | "CONDUIT"     // rura/koryto/peszla → mb, waste +5%
  | "PLASTER"     // gips/zaprawa/tynk → kg
  | "HARDWARE"    // kołek/śruba/uchwyt/taśma/opaska → szt/op
  | "GENERAL";    // fallback → szt

// ─────────────────────────────────────────────────────────────────
// Regex detection patterns
// ─────────────────────────────────────────────────────────────────

/** Cable stems: przewód/kabel + known type abbreviations */
export const CABLE_RE  = /\b(kabel|przewod|ydyp|ydy|yky|nyy|hls|flat|ydyżo|liycy|skyd|rg-?6|utp|nkt|klotz)\b|\d+x\d/i;

/** Circuit breaker / RCD / RCBO / SPD stems */
export const BREAKER_RE = /\b(bezpiecznik|wylacznik|wyłącznik|mcb|rcd|rcbo|fi|b\d+|c\d+|spd|overvoltage|rozlacznik|rozłącznik)\b/i;

/** Socket / outlet */
export const SOCKET_RE  = /\b(gniazdo|wtyk|wtyczka|rozgal|rozgał|prise|schuko)\b/i;

/** Wall switch / dimmer */
export const SWITCH_RE  = /\b(lacznik|łącznik|wlacznik|włącznik|dimmer|przycisk|klawisz)\b/i;

/** Junction/mounting box */
export const BOX_RE     = /\b(puszka|skrzynka|rozdzielnica|szafka|obudowa|rozdzieln|junction|box)\b/i;

/** Conduit / cable tray */
export const CONDUIT_RE = /\b(rura|koryto|peszla|peszl|rurka|kanał|kana)\b/i;

/** Plaster / grout / mortar */
export const PLASTER_RE = /\b(gips|zaprawa|tynk|szpachl|cemen|zapraw)\b/i;

/** Small hardware: fixings, ties, tape */
export const HARDWARE_RE = /\b(kolek|kołek|sruba|śruba|uchwyt|opaska|tasma|taśma|klips|pinen|pin)\b/i;

// ─────────────────────────────────────────────────────────────────
// Spec extraction regex
// ─────────────────────────────────────────────────────────────────

/**
 * Extracts the technical spec from a material name.
 * Examples:
 *   "Przewód YDYp 3x2.5"  → "3x2.5"
 *   "Hager B16"           → "B16"
 *   "MCB 3P 32A"          → "3P 32A"
 *   "Puszka Ø60"          → "Ø60"
 */
const SPEC_RE = /(?:\b([A-Z]\d+)\b|(\d+[×xX]\d+(?:\.\d+)?(?:mm[²2])?)|(\d+P\s*\d+A|\d+A)|([ØÆ]\s*\d+))/;

export function extractMaterialSpec(name: string): string | null {
  const hit = SPEC_RE.exec(name);
  if (!hit) return null;
  return (hit[1] ?? hit[2] ?? hit[3] ?? hit[4] ?? "").trim() || null;
}

// ─────────────────────────────────────────────────────────────────
// MaterialProfile
// ─────────────────────────────────────────────────────────────────

export interface MaterialProfile {
  category:     MaterialCategory;
  /** Unit forced by category (null = keep user's unit). */
  forcedUnit:   "mb" | "szt" | "kg" | "op" | null;
  /**
   * Waste multiplier applied to quantity.
   * Cable = 1.10 (10%), Conduit = 1.05, Consumables = 1.05, Others = 1.00.
   */
  wasteFactor:  number;
  /** Technical spec extracted from name (e.g. "3x2.5", "B16"). */
  spec:         string | null;
}

/**
 * Canonical unit for each material category.
 * Used for unit enforcement ("mb" for cable, "szt" for hardware, etc.)
 */
export function normalizeMatUnit(cat: MaterialCategory): "mb" | "szt" | "kg" | "op" {
  switch (cat) {
    case "CABLE":
    case "CONDUIT":  return "mb";
    case "PLASTER":  return "kg";
    case "HARDWARE": return "op";
    default:         return "szt";
  }
}

/**
 * Material Brain — classifyMaterial.
 * Classifies a material item name into a MaterialProfile.
 *
 * Priority order (first match wins):
 *   1. Cable/wire keywords → CABLE (mb, waste 1.10)
 *   2. Breaker keywords   → BREAKER (szt, no waste)
 *   3. Socket keywords    → SOCKET (szt, no waste)
 *   4. Switch keywords    → SWITCH (szt, no waste)
 *   5. Box keywords       → BOX (szt, no waste)
 *   6. Conduit keywords   → CONDUIT (mb, waste 1.05)
 *   7. Plaster keywords   → PLASTER (kg, waste 1.05)
 *   8. Hardware keywords  → HARDWARE (op, waste 1.05)
 *   9. Fallback           → GENERAL (szt, no waste)
 */
export function classifyMaterial(name: string): MaterialProfile {
  const spec = extractMaterialSpec(name);

  if (CABLE_RE.test(name)) {
    return { category: "CABLE",    forcedUnit: "mb",  wasteFactor: CABLE_WASTE_FACTOR,      spec };
  }
  if (BREAKER_RE.test(name)) {
    return { category: "BREAKER",  forcedUnit: "szt", wasteFactor: DEFAULT_WASTE_FACTOR,     spec };
  }
  if (SOCKET_RE.test(name)) {
    return { category: "SOCKET",   forcedUnit: "szt", wasteFactor: DEFAULT_WASTE_FACTOR,     spec };
  }
  if (SWITCH_RE.test(name)) {
    return { category: "SWITCH",   forcedUnit: "szt", wasteFactor: DEFAULT_WASTE_FACTOR,     spec };
  }
  if (BOX_RE.test(name)) {
    return { category: "BOX",      forcedUnit: "szt", wasteFactor: DEFAULT_WASTE_FACTOR,     spec };
  }
  if (CONDUIT_RE.test(name)) {
    return { category: "CONDUIT",  forcedUnit: "mb",  wasteFactor: CONSUMABLE_WASTE_FACTOR,  spec };
  }
  if (PLASTER_RE.test(name)) {
    return { category: "PLASTER",  forcedUnit: "kg",  wasteFactor: CONSUMABLE_WASTE_FACTOR,  spec };
  }
  if (HARDWARE_RE.test(name)) {
    return { category: "HARDWARE", forcedUnit: "op",  wasteFactor: CONSUMABLE_WASTE_FACTOR,  spec };
  }

  return { category: "GENERAL",   forcedUnit: null,  wasteFactor: DEFAULT_WASTE_FACTOR,     spec };
}

// ─────────────────────────────────────────────────────────────────
// Material Pricing — The Muscle
// ─────────────────────────────────────────────────────────────────

/**
 * Discrete categories — items are always whole units (Math.ceil).
 * Half a circuit breaker or half a junction box doesn't exist.
 */
const DISCRETE_CATEGORIES: ReadonlySet<MaterialCategory> = new Set<MaterialCategory>([
  "BREAKER", "SOCKET", "SWITCH", "BOX",
]);

/** Context required for material price calculation. */
export interface MaterialPriceContext {
  /** Quantity from the estimate (already adjusted for qty factor in sets). */
  qty:          number;
  /** Unit price from catalog/es_dictionary (PLN per unit, NET). */
  basePrice:    number;
  /** Waste multiplier from MaterialProfile.wasteFactor */
  wasteFactor:  number;
  /** VAT rate: 8 (residential) or 23 (commercial). From project.vat_rate. */
  vatRate:      8 | 23;
  /** Contractor markup on materials in %. From profiles.material_margin (default 15). */
  marginPct:    number;
  /**
   * Material category — drives discrete rounding.
   * BREAKER/SOCKET/SWITCH/BOX → Math.ceil(qty).
   * Omit or set to undefined to skip discrete rounding.
   */
  category?:    MaterialCategory;
  /**
   * Catalog package size (e.g. 100 for a 100m cable coil).
   * Used to generate displayHint for bulk items.
   * Omit if item has no logical packaging unit.
   */
  packageSize?: number;
  /** Unit label used in displayHint (e.g. 'mb', 'szt'). */
  unit?:        string;
}

/** Full price breakdown for one material position. */
export interface MaterialTotal {
  /** basePrice × qty (before any adjustments). */
  subtotal:     number;
  /** subtotal × wasteFactor (adjusted for cable offcuts/waste). */
  withWaste:    number;
  /** withWaste × (1 + marginPct/100) — contractor's selling price, NET. */
  totalNet:     number;
  /** totalNet × (1 + vatRate/100) — price billed to client, GROSS. */
  totalGross:   number;
  /** totalGross - totalNet */
  vatAmount:    number;
  /** Human-readable formula string for PDF/UI explainability. */
  breakdown:    string;
  /** Raw (decimal) quantity before discrete rounding. */
  rawQty:       number;
  /**
   * Order quantity after rounding.
   * Discrete items (BREAKER/BOX etc.) → Math.ceil(rawQty).
   * Bulk items (cables) → same as rawQty (decimal kept for estimate).
   */
  discreteQty:  number;
  /**
   * Human-readable packaging hint for bulk items.
   * Example: "11.0 mb (~0.11 buhty × 100m)"
   * undefined for discrete items or unknown package_size.
   */
  displayHint?: string;
}

/**
 * Material Muscle — calculateMaterialTotal.
 * Pure calculation: no DB, no side effects.
 *
 * Formula:
 *   totalNet   = basePrice × qty × wasteFactor × (1 + marginPct/100)
 *   totalGross = totalNet × (1 + vatRate/100)
 *
 * All values rounded to 2 decimal places.
 */
export function calculateMaterialTotal(ctx: MaterialPriceContext): MaterialTotal {
  const { qty, basePrice, wasteFactor, vatRate, marginPct, category, packageSize, unit } = ctx;

  const r = (v: number) => Math.round(v * 100) / 100;

  // Discrete rounding: whole units only for BREAKER/BOX/SOCKET/SWITCH
  const rawQty      = qty;
  const discreteQty = category && DISCRETE_CATEGORIES.has(category)
    ? Math.ceil(rawQty)
    : rawQty;

  // Pricing uses discreteQty so we never underprice
  const subtotal   = r(basePrice * discreteQty);
  const withWaste  = r(subtotal * wasteFactor);
  const totalNet   = r(withWaste * (1 + marginPct / 100));
  const totalGross = r(totalNet * (1 + vatRate / 100));
  const vatAmount  = r(totalGross - totalNet);

  // Display hint for bulk items with a logical package size
  let displayHint: string | undefined;
  if (packageSize && packageSize > 1 && !DISCRETE_CATEGORIES.has(category ?? "GENERAL")) {
    const coils = rawQty / packageSize;
    displayHint = `${rawQty.toFixed(1)} ${unit ?? ""} (~${coils.toFixed(2)} × ${packageSize}${unit ?? ""})`;
  }

  const wasteTag  = wasteFactor !== 1.0 ? `×${wasteFactor}(odpad)` : "";
  const marginTag = `×${(1 + marginPct / 100).toFixed(2)}(marża${marginPct}%)`;
  const vatTag    = `×${(1 + vatRate / 100).toFixed(2)}(VAT${vatRate}%)`;

  const breakdown =
    `${discreteQty} × ${basePrice.toFixed(2)} PLN ${[wasteTag, marginTag, vatTag].filter(Boolean).join(" ")} = ${totalNet.toFixed(2)} PLN netto / ${totalGross.toFixed(2)} PLN brutto`;

  return { subtotal, withWaste, totalNet, totalGross, vatAmount, breakdown, rawQty, discreteQty, displayHint };
}

/**
 * Return the project's VAT rate as 8 | 23.
 *
 * Iron Rule: projects.vat_rate is the ONLY authoritative source.
 * The user's choice is sovereign — no automatic override by object_type name.
 *
 * @param projectVatRate — from projects.vat_rate (8 or 23, set by user)
 * @param _objectTypeName — ignored (kept for backward-compat signature)
 */
export function resolveVatRate(
  projectVatRate: number,
  _objectTypeName?: string | null
): 8 | 23 {
  return projectVatRate === 8 ? 8 : 23;
}
