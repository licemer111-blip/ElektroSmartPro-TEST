// ═══════════════════════════════════════════════════════════════════
// _ai_actions/pricing-helpers.ts — Helper functions, constants, and
// engines extracted from pricing.ts for modularity.
// NO "use server" — pure logic, no server actions.
// ═══════════════════════════════════════════════════════════════════

import type { AiPriceEstimate } from "./pricing-types";
import {
  getModernizationFactor, getMFactorLabel,
  CONNECTION_MIN_NORM, HEAVY_CONNECTION_MIN_NORM,
  SAL_HEAVY_CONN_FLOOR_PLN, SAL_STD_CONN_FLOOR_PLN,
  SAL_HARD_SURFACE_FLOOR_PLN, SAL_DRILLING_FLOOR_PLN, SAL_GROOVE_ZELBET_FLOOR_PLN,
  SAL_ACTION_STEMS_RE, CONNECTION_RE, HEAVY_APPLIANCE_RE, CEILING_RE,
  normalizePlName, isZelbet, isHardSurface,
  getCeilingModifier, getHeightModifier, salMultiplier,
  classifyIntent, GROOVE_FLOOR_RE, DRILL_FLOOR_RE,
  type SemanticIntent, type SemanticProfile,
} from "@/lib/services/semantic-classifier";
import { applyRealityCheck } from "@/lib/services/reality-check";

// ─── KNR code validators ──────────────────────────────────────────

// Official KNR code pattern: starts with "KNR" followed by digits
export const isOfficialKnr = (code: string | null): boolean =>
  code != null && /^KNR[\s-]?\d/.test(code.trim());

// Hard-Link v2.2: Synthetic KNR codes invented by AI (not from real KNR database)
// Pattern: KNR-ES-XXXX or KNR_ES_XXXX — must be blocked from DB storage
export const isSyntheticKnr = (code: string | null): boolean =>
  code != null && /^KNR[-_]?ES[-_]?\d/i.test(code.trim());

// ─── Ambiguity detector ───────────────────────────────────────────

// FULL: always flag if contained anywhere in the name (truly generic terms)
const AMBIGUITY_FULL = [
  "materiały pomocnicze", "materiały drobne",
  "drobnica", "pozostałości",
  "nieprzewidziane", "rezerwa",
];
// SHORT: single-word adjectives — only flag when name is short (< 60 chars),
// meaning the item really IS vague (e.g. "Różne", "Inne prace").
// In long technical BOQ descriptions these are qualifiers:
//   "różne od na beton" = "type other than concrete" (NOT vague)
//   "dodatkowe wzmocnienie" in 150-char spec = technical detail (NOT vague)
const AMBIGUITY_SHORT = [
  "pomocnicze", "dodatkowe", "inne", "pozostałe", "różne",
];
// SUFFIX: "etc/itp/itd" in Polish technical PDFs often appear mid-name
// (e.g. "Kąty, rozgałęzienia itd. Kołanko korytka 90° KK200H80")
// — only flag as ambiguous if the name is short (< 40 chars), meaning it IS vague
const AMBIGUITY_SUFFIX = ["etc", "itp", "itd"];

export function detectAmbiguity(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (AMBIGUITY_FULL.some((kw) => lower === kw || lower.includes(kw))) return true;
  if (lower.length < 60 && AMBIGUITY_SHORT.some((kw) => lower === kw || lower.includes(kw))) return true;
  if (lower.length < 40 && AMBIGUITY_SUFFIX.some((kw) => lower === kw || lower.includes(kw))) return true;
  return false;
}

// ─── Regex constants ──────────────────────────────────────────────

/** Detects excavation items requiring Equipment ("S") category pricing. */
export const EXCAVATION_RE = /\b(wykop|prac[ae]\s+ziemn|kopanie|koparka|kopar[ek]i?|pogłębiark|ziemn[ae]\s+rob)/i;

// ─── Material-logic keyword lists ─────────────────────────────────
// Checked by .includes() on lowercased name (not anchored) — no regex fragility.

/** Pure-labor service items — material MUST be 0.00 PLN, AI estimation SKIPPED. */
const PURE_LABOR_KEYWORDS: readonly string[] = [
  "pomiar", "pomiary", "badanie", "przegląd", "testowanie", "sprawdzenie",
  "diagnostyka", "lokalizacja", "termowizja", "audyt", "projekt ",
  "dokumentacja", "inwentaryzacja", "protokół", "uzgodnienia", "dopuszczenie",
  "opracowanie", "nadzór", "kierownik", "konserwacja", "serwis", "czyszczenie",
  "asysta", "szkolenie", "instruktaż", "uruchomienie", "demontaż", "utylizacja",
  "wywóz", "usuwanie", "wynajem", "transport", "dojazd",
  "wiercenie", "przebicie", "kucie", "bruzdowanie", "wykucie", "zamurowanie",
  "programowanie", "konfiguracja", "parametryzacja", "backup",
];

/** Physical-installation items — if material=0 after KNR lookup, triggers AI L3 fallback. */
const MATERIAL_MANDATORY_KEYWORDS: readonly string[] = [
  // Cables & conductors
  "kabel", "przewod", "wlz", "ydy", "yky", "asxsn", "omty",
  "utp", "ftp", "h07", "linka", "drut", "bednarka", "tasma stalowa",
  // Conduits & trays
  "rura", "peszel", "korytko", "drabinka", "kanal", "listwa",
  // Enclosures & panels
  "rozdzielnica", "szafa", "obudowa", "skrzynka", "zlacze",
  "tablica", "panel",
  // Power electronics
  "falownik", "inwerter", "magazyn energii",
  "stacja ladowania", "wallbox", "ups", "akumulator",
  // PV / Fotowoltaika (v3.0)
  "fotowoltaika", "modul pv", "panel solarny", "panel pv", "mc4", "optymalizator",
  "konstrukcja pv", "microinwerter",
  // EV Charging (v3.0)
  "stacja ladowania ev", "ladowarka ev", "kabel ev", "typ2",
  // HVAC / Heat pump (v3.0)
  "pompa ciepla", "rekuperator", "rekuperacja", "klimatyzator", "klimatyzacja",
  "wentylacja mechaniczna", "czerpnia",
  // Additional switchboard items (v3.0)
  "szyna laczeniowa", "listwa zaciskowa", "zlaczka szynowa",
  // Protection & switching
  "wylacznik", "bezpiecznik", "stycznik", "przekaznik", "ogranicznik",
  "roznicowka", "rcd", "rcbo", "aparat", "modul", "szyna",
  // Outlets & accessories ("gniazd" covers gniazdo + gniazdko)
  "gniazd", "wlacznik", "lacznik", "przycisk", "ramka",
  "puszka", "zlaczka", "wago", "uchwyt", "kolek", "sruba",
  // Lighting
  "oprawa", "lampa", "naswietlacz", "reflektor", "halogen",
  "zarowka", "zasilacz led",
  // Security & automation
  "czujka", "detektor", "sygnalizator", "centrala", "kamera", "rejestrator",
  // Power supply lines (imply cables)
  "zasilanie", "linia",
];

// ─── Name normalisation ───────────────────────────────────────────

/** Normalise name for keyword matching: lowercase + strip diacritics + ł (ł = l with stroke).
 *  Note: ł (U+0142) does NOT decompose via NFD — must be replaced explicitly. */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove combining diacritics (ąęóśćźżń → aeosc z zn)
    .replace(/\u0142/g, "l");          // ł (l with stroke) → l (no NFD equivalent)
}

/** Returns true if the item is a pure-labour service — material MUST be 0. */
export function isPureLaborByKeyword(name: string): boolean {
  const n = normaliseName(name);
  return PURE_LABOR_KEYWORDS.some((kw) => n.includes(normaliseName(kw)));
}

/** Returns true if the item must have a material price (physical installation). */
export function isMaterialMandatory(name: string): boolean {
  if (isPureLaborByKeyword(name)) return false; // pure-labour wins
  const n = normaliseName(name);
  return MATERIAL_MANDATORY_KEYWORDS.some((kw) => n.includes(normaliseName(kw)));
}

// ─── Material safety factors ──────────────────────────────────────
/** 3% auxiliary-materials surcharge (tape, ties, screws) for all physical-install items. */
export const AUXILIARY_MATERIAL_FACTOR = 1.03;
/** 5% cable-waste factor (cutting, slack, corners) for linear cable items (mb/m). */
export const CABLE_WASTE_FACTOR = 1.05;

/** Cable keywords that trigger the waste factor — must match AND unit be mb/m. */
const CABLE_WASTE_KEYWORDS: readonly string[] = [
  "kabel", "przewod", "wlz", "ydy", "yky", "asxsn", "omty",
  "utp", "ftp", "h07", "linka", "drut", "bednarka",
];

/**
 * KNR 4-03: demontaż robocizna = 65% montaż norm.
 * Single source of truth — used by enforceKeywordRules and repriceSingleItem.
 */
export function applyDemontazRule(laborPrice: number, name: string): number {
  if (laborPrice <= 0) return laborPrice;
  if (!normaliseName(name).includes("demontaz")) return laborPrice;
  return Math.round(laborPrice * 0.65 * 100) / 100;
}

/** Returns true if the item is a cable/conductor product (triggers waste factor on mb/m). */
export function isCableItem(name: string): boolean {
  const n = normaliseName(name);
  return CABLE_WASTE_KEYWORDS.some((kw) => n.includes(normaliseName(kw)));
}

// ─── Cable Cross-Section Engine ───────────────────────────────────
// Computes a labor complexity multiplier from the cable cross-section
// found in the item name (e.g. "5x240" → section=240 → ×2.5).

/** Regex to extract NxM cross-section (e.g. "5x240", "3×2.5", "4x70") */
export const CABLE_SECTION_RE = /(\d+)\s*[xх×]\s*(\d+(?:[.,]\d+)?)/i;
/** Detects aluminium cable material in item name */
const CABLE_AL_RE = /\b(al\b|aluminium|aluminum)/i;

/**
 * Returns a labor complexity multiplier based on cable cross-section.
 * Cu ≤35mm²: ×1.0 | >35mm²: ×1.3 | >70mm²: ×1.8 | >150mm²: ×2.5
 * Al cables: additional ×1.1 factor applied on top.
 *
 * GUARD: only fires for items identified as cables by isCableItem().
 * This prevents false matches like "Gniazdo 1×230V" → section=230mm² → ×2.5.
 * Voltage patterns (e.g. "1×230V", "3×400V") are also explicitly rejected.
 */
export function getCableComplexityModifier(name: string): number {
  // Guard 1: non-cable items never get cross-section penalty
  if (!isCableItem(name)) return 1.0;
  // Guard 2: reject voltage patterns — "NxV" or "N×XXXV" (device ratings, not cross-sections)
  if (/[xх×]\s*\d{2,3}\s*[Vv]\b/i.test(name)) return 1.0;
  const match = name.match(CABLE_SECTION_RE);
  if (!match) return 1.0;
  const section = parseFloat(match[2].replace(",", "."));
  if (isNaN(section) || section <= 0) return 1.0;
  const alFactor = CABLE_AL_RE.test(name) ? 1.1 : 1.0;
  let sectionFactor = 1.0;
  if (section > 150) sectionFactor = 2.5;
  else if (section > 70) sectionFactor = 1.8;
  else if (section > 35) sectionFactor = 1.3;
  return sectionFactor * alFactor;
}

// ─── Multiplier Snowball Guard ────────────────────────────────────
// Physics modifiers (cable × surface × ceiling × height) can stack
// to unrealistic values (e.g. ×2.75 × ×2.25 × ×2.5 × ×2.0 = ×30.9).
// Cap their combined product at MAX_COMBINED_MODIFIER = 3.5 before
// applying the hourly rate. globalLaborMod (project-level policy) is
// intentionally NOT included in this cap.

export const MAX_COMBINED_MODIFIER = 3.5;

/**
 * Clamps the product of local physics modifiers to MAX_COMBINED_MODIFIER.
 * Returns the raw product if below cap, otherwise returns the cap.
 */
export function clampLocalModifiers(
  cableMod: number,
  surfaceMod: number,
  ceilingMod: number,
  heightMod: number,
): number {
  const raw = cableMod * surfaceMod * ceilingMod * heightMod;
  return Math.min(raw, MAX_COMBINED_MODIFIER);
}

/** Bruzdowanie / groove-cutting items — legitimately high norms (up to 2.0 rbh/m in concrete) */
export const GROOVE_RE = /\b(bruzd|kucie|rowek|kanal)\b/i;
/** Distribution panel / switchboard — assembly can legitimately take >8 rbh/szt */
export const PANEL_RE = /\b(rozdzielnic|tablic|szaf)/i;

// ─── Surface Complexity Engine ────────────────────────────────────
// Labor multiplier based on surface/material hardness.
// Item description is checked first; globalContext (section/notes) is fallback.

/**
 * Material hardness → labor multiplier. Calibrated from KNR 5-04/5-08 norms,
 * reference material = cegła/pustak (KNR 5-08 0301-01, 0.08 rbh/mb = ×1.0).
 *
 * KNR data:
 *   ytong/bloczki: 0.20 rbh/mb (KNR 5-04 0101-04) → 0.20/0.08 = ×2.50
 *   żelbet:        0.18 rbh/mb (KNR 5-08 0301-02) → 0.18/0.08 = ×2.25
 *   gipskarton GK: 0.15 rbh/mb (KNR 5-04 0101-03) → 0.15/0.08 = ×1.88
 *   beton:         0.12 rbh/mb (KNR 5-04 0701-02) → 0.12/0.08 = ×1.50
 *   cegła/pustak:  0.08 rbh/mb (KNR 5-08 0301-01) → reference ×1.00
 *   tynk:          0.06 rbh/mb (KNR 5-04 0701-01) → 0.06/0.08 = ×0.75
 *
 * Order: highest-multiplier-first for early-exit correctness.
 *
 * IMPORTANT — Ytong/Gazobeton clarification:
 * Ytong (aerated autoclaved concrete) is a LIGHTWEIGHT, porous material — physically easy to cut.
 * However it requires a dedicated diamond-disc angle grinder (not a standard chisel), and the
 * porous structure causes rapid disc wear. KNR 5-04 accounts for this with 0.20 rbh/mb vs
 * brick reference 0.08 rbh/mb → ratio = ×2.50. The multiplier is NOT about hardness, it is
 * about TOOLING SETUP TIME and material waste during cutting.
 * RULE: apply ×2.50 ONLY when the es_dictionary keyword does NOT already encode ytong
 * (i.e. keyword_encodes_surface=false). If keyword = "bruzdowanie w ytong" (norm=0.20),
 * getSurfaceModifier() must return 1.0 → no double-count.
 *
 * NOTE: use prefix patterns (no trailing \b) so Polish inflections match:
 * beton→betonie, cegła→cegle/ceglany, żelbet→żelbetowy, etc.
 */
const SURFACE_KEYWORDS: Array<[RegExp, number]> = [
  [/\bgazobeton|\bsiporex|\bytong|\bbloczk/i,    2.50],  // ytong/aerated: 0.20÷0.08 = ×2.50 delta from brick
  [/żelbe|zelbe|zbrojon/i,                         2.25],  // reinforced concrete — stem covers: żelbet/żelbecie/żelbetowy/zbrojony/zbrojone
  [/\bmonolit/i,                                  2.00],  // monolithic concrete
  [/silk[aąei]|silce/i,                          1.75],  // silica brick — stem covers: silka/silki/silce (loc. case)
  [/\bgipsokart|\bgk\b/i,                         1.88],  // gypsum board: 0.15÷0.08 = ×1.88
  [/\bbeton/i,                                    1.50],  // plain concrete: 0.12÷0.08 = ×1.50 (matches betonie/betonowy)
  [/\bcegla|\bcegle|\bceglany|\bcegł/i,           1.00],  // brick — reference ×1.0 (0.08 rbh/mb = base)
  [/\btynk|\bgips(?!okart)|\bplaski/i,            0.75],  // plaster/smooth: 0.06÷0.08 = ×0.75
];

/**
 * Returns a surface hardness multiplier for labor.
 * Checks `description` first, then `globalContext` (e.g. item.section).
 * Returns 1.0 when surface is unknown / neutral.
 */
export function getSurfaceModifier(description: string, globalContext = ""): number {
  // Hardest surface rule: scan ALL keywords in both texts, return MAXIMUM multiplier found.
  // "tynku i beton pod spodem" → beton (1.50) wins over tynk (0.75).
  let best = 1.0;
  for (const text of [description, globalContext]) {
    for (const [re, mod] of SURFACE_KEYWORDS) {
      if (re.test(text) && mod > best) best = mod;
    }
  }
  return best;
}

// CEILING_RE, getCeilingModifier, getHeightModifier — imported from @/lib/services/semantic-classifier

/** Appends physics warning badges when complexity modifiers exceed safe thresholds. */
export function buildModifierWarnings(cableMod: number, surfaceMod: number, ceilingMod = 1.0): string {
  const w: string[] = [];
  if (ceilingMod > 1.0)  w.push("⚠️ Praca nad głową: Sufit/Strop");
  if (surfaceMod > 1.5)  w.push("⚠️ Podwyższona trudność: Materiał twardy");
  if (cableMod > 1.5)    w.push("⚠️ Duży przekrój: Wymaga zespołu");
  return w.length ? " | " + w.join(" | ") : "";
}

// ─── Hard surface + groove floor constants ────────────────────────
// (used in L2 pricing loop)

// isHardSurface, isZelbet, GROOVE_FLOOR_RE, DRILL_FLOOR_RE — imported from @/lib/services/semantic-classifier

/** Minimum labor norm (rbh/mb) for groove-cutting in zelbet/monolit. */
export const GROOVE_ZELBET_MIN_NORM = 0.25;

/** Minimum labor norm (szt) for drilling in silka (harder than brick). */
export const DRILL_SILKA_MIN_NORM = 0.15;

/** Minimum labor norm (rbh/szt) for drilling in plain concrete. */
export const DRILL_BETON_MIN_NORM = 0.25;

// normalizePlName, CONNECTION_RE, CONNECTION_MIN_NORM, HEAVY_APPLIANCE_RE,
// HEAVY_CONNECTION_MIN_NORM — imported from @/lib/services/semantic-classifier

/**
 * Wymiana (replacement) multiplier.
 * Wymiana = Montaż (new device) + Demontaż (removal of old) = base × 1.5.
 * Triggered when item name starts with "Wymiana" or contains both "demontaż" and "montaż".
 */
export const WYMIANA_RE = /^wymian|^wymien/i;
export const DEMONTAZ_MONTAZ_RE = /demonta[zż].{0,40}monta[zż]|monta[zż].{0,40}demonta[zż]/i;
export const WYMIANA_FACTOR = 1.5; // labor = montaż_norm + 0.5 × montaż_norm (simplified demontaż)

// ─── applySanityCheck ─────────────────────────────────────────────
// Validates pricing output against realistic labor norm thresholds.
// Prevents L3 AI hallucinations (e.g. 4 rbh/m for cable) from
// silently propagating into the kosztorys.

/** Max labor norm (rbh) per unit type for non-linear units.
 * v2.0 calibration (Apr 2026): raised linear cap from 0.35 → 0.50 because heavy-
 * gauge Cu (YKY 5×240) in grooves legitimately reaches ~0.50 rbh/mb even at
 * baseline surface; cable complexity multiplier then scales it up from there.
 * `szt` raised from 8 → 12 to accommodate complex single-device installs
 * (industrial PLCs, large EV chargers with commissioning).
 */
const SANITY_MAX_RBH: Record<string, number> = {
  m:    0.50,  // linear: cable/pipe — groove & large sections use dynamic check below
  mb:   0.50,
  mb2:  0.50,
  "m²": 3.00,
  m2:   3.00,
  szt: 12.00,  // single device installation (up from 8)
  kpl: 24.00,  // complex assembly (up from 20)
  "r-g": 8.00, // engineering tasks (commissioning, measurements, programming)
  t:   12.00,  // per tonne
  kg:   0.20,
};
const SANITY_DEFAULT_MAX_RBH = 24.0; // permissive catch-all

export function applySanityCheck(est: AiPriceEstimate, laborRate: number): AiPriceEstimate {
  // Skip ambiguous/unmatched/L1-catalog items — their prices are user-verified
  if (est.isAmbiguous || est.trace === "unmatched" || est.knrSource === "catalog-l1") return est;
  // Skip if labor is 0 (not estimated) or mode=material only
  if (est.suggestedLabor <= 0) return est;

  const unit = (est.guardedUnit ?? est.unit ?? "szt").toLowerCase().trim();
  const isLinear = unit === "m" || unit === "mb" || unit === "mb2";

  // Dynamic max for linear units: groove cutting allows high norms; cable section drives complexity
  let maxRbh: number;
  if (isLinear) {
    if (GROOVE_RE.test(est.name)) {
      maxRbh = 3.0; // bruzdowanie w betonie / kucie: do 2.0 rbh/m
    } else {
      maxRbh = 0.35 * getCableComplexityModifier(est.name);
    }
  } else {
    maxRbh = SANITY_MAX_RBH[unit] ?? SANITY_DEFAULT_MAX_RBH;
    if (unit === "szt" && PANEL_RE.test(est.name)) maxRbh = 24.0;
  }

  // Derive implied norm: either stored laborNorm or back-calculated from price
  const impliedNorm = est.laborNorm != null
    ? est.laborNorm
    : laborRate > 0 ? est.suggestedLabor / laborRate : 0;

  if (impliedNorm > maxRbh) {
    return {
      ...est,
      suggestedLabor: 0,
      // NOTE: material price is preserved — only the labour norm failed sanity check
      confidence: "low" as const,
      isAmbiguous: true,
      note: `⚠️ Weryfikacja: norma ${impliedNorm.toFixed(2)} rbh/${unit} przekracza próg ${maxRbh.toFixed(2)} rbh/${unit}. Sprawdź ręcznie.`,
      trace: `${est.trace} → SANITY_FAIL (${impliedNorm.toFixed(2)} > ${maxRbh.toFixed(2)} rbh/${unit})`,
    };
  }

  // Unit-mismatch detection: absurdly high unit price suggests AI returned a package/box price
  // Permissive ceilings — only catches obvious hallucinations (e.g. 2000 PLN/mb for a cable)
  const matUnitCeiling =
    unit === "mb" || unit === "m" ? 600   // even YKY 5x240 ≈ 300 PLN/mb
    : unit === "szt"              ? 3000  // covers UPS/inverters
    : unit === "kpl"              ? 10000
    : 10000;
  if (est.suggestedMaterial > matUnitCeiling) {
    return {
      ...est,
      suggestedMaterial: 0,
      suggestedLabor: 0,
      confidence: "low" as const,
      isAmbiguous: true,
      note: `⚠️ Możliwy błąd jednostki: cena mat. ${est.suggestedMaterial.toFixed(2)} PLN/${unit} przekracza max ${matUnitCeiling} PLN/${unit}. Sprawdź jednostkę.`,
      trace: `${est.trace} → UNIT_MISMATCH (mat=${est.suggestedMaterial} > ${matUnitCeiling}/${unit})`,
    };
  }
  return est;
}

// ─── enforceExpertGuards ──────────────────────────────────────────
// FINAL post-processing step — runs AFTER L0/L1/L2/L3 and applySanityCheck.
// Cannot be bypassed. Enforces:
//   A. Connection PLN floor for ALL connection/commissioning items.
//   B. Hard surface price floor based on stored laborNorm × surface tier.
// This is the last line of defence — no multiplier chain can undercut it.

export function enforceExpertGuards(
  est: AiPriceEstimate,
  baseRate: number,
  globalMod: number,
): AiPriceEstimate {
  const name    = est.name ?? "";
  const profile = classifyIntent(name);

  // A. Connection/commissioning formula floor — rate-dependent (contrast: securityAuditLayer is hardcoded)
  // M-Matrix: HEAVY_CONNECTION ×1.0, STANDARD_ACTION ×0.85, DISTRIBUTION_BOARD ×1.0
  if (profile.intent === "HEAVY_CONNECTION" || profile.intent === "STANDARD_ACTION" || profile.intent === "DISTRIBUTION_BOARD") {
    const mFactor    = getModernizationFactor(profile.intent);
    const priceFloor = Math.round(profile.baseNorm * mFactor * baseRate * globalMod * 100) / 100;
    if ((est.suggestedLabor ?? 0) < priceFloor) {
      return {
        ...est,
        suggestedLabor: priceFloor,
        laborNorm: Math.max(est.laborNorm ?? 0, profile.baseNorm),
        confidence: "medium" as const,
        trace: `${est.trace ?? ""} [⬆EXPERT: conn-floor [${profile.intent}] ${priceFloor.toFixed(2)}PLN]`,
        note: `${est.note ?? ""} | ⬆ Minimalny koszt [${profile.intent}]: ${priceFloor.toFixed(2)} PLN/szt (KNR 5-04 floor)`,
      };
    }
  }

  // B. Hard surface formula floor — using stored laborNorm (reliable for L0/L2; skip if null)
  // Formula: surfaceFloor = laborNorm × M-Factor × surfaceTier × baseRate × globalMod
  // Uses a separate surface-tier matrix (silka 1.75x is not in classifyIntent — material property, not intent).
  if (est.laborNorm != null && est.laborNorm > 0) {
    const hardTier = isZelbet(name) ? 2.25
      : /silk[aąei]|silce/i.test(name) ? 1.75
      : /\bbeton/i.test(name) ? 1.50
      : 0;
    if (hardTier > 0) {
      const mFactorHard = getModernizationFactor(profile.intent);
      const surfaceFloor = Math.round(est.laborNorm * mFactorHard * hardTier * baseRate * globalMod * 100) / 100;
      if ((est.suggestedLabor ?? 0) < surfaceFloor) {
        return {
          ...est,
          suggestedLabor: surfaceFloor,
          trace: `${est.trace ?? ""} [⬆EXPERT: surface-floor ×${hardTier} → ${surfaceFloor.toFixed(2)}PLN]`,
          note: `${est.note ?? ""} | ⬆ Twarda pow.: ${hardTier}x → ${surfaceFloor.toFixed(2)} PLN`,
        };
      }
    }
  }

  return est;
}

// ─── securityAuditLayer — NUCLEAR VETO ────────────────────────────
// Absolute last resort. Hardcoded PLN floors — zero dependencies on
// baseRate, globalMod, KNR norms, or any computed context.
// Uses SemanticInterpreter classification to enforce expert floors.
// Applies AFTER L0/L1/L2/L3 + enforceExpertGuards.
// Zero runtime dependencies (no baseRate, no DB, no AI).
// Formula: Total = max(CalculatedPrice, CategoryFloor) × salMultiplier

// SAL_*_PLN floors, SAL_ACTION_STEMS_RE, SemanticIntent, SemanticProfile,
// classifyIntent, salMultiplier — imported from @/lib/services/semantic-classifier

/**
 * Maximum labor price (PLN) per unit that SAL will ever enforce via floor × multipliers.
 * Guards against degenerate cases: e.g. HEAVY_CONNECTION floor 140.40 × 2.25 × 2.50 × 1.40 ≈ 1106 PLN.
 *
 * v2.0 calibration (Apr 2026): raised 2000 → 5000. Real-world per-unit labor that
 * exceeds 2000 PLN is legitimate for:
 *   - Rozdzielnica 3-fazowa mieszkaniowa + uruchomienie + pomiary (2500–3500 PLN)
 *   - Podłączenie pompy ciepła 16 kW / klimatyzatora multi + konfiguracja (2000–3000 PLN)
 *   - Stacja ładowania EV 22 kW + integracja z rozdzielnicą (2500–4000 PLN)
 *   - Silnik przemysłowy 55+ kW + zabezpieczenia (3000–5000 PLN)
 * 5000 PLN is the new ceiling for a SINGLE UNIT of labor (not the total job).
 */
const SAL_MAX_LABOR_PLN = 5000;

export function securityAuditLayer(est: AiPriceEstimate): AiPriceEstimate {
  const name    = est.name ?? "";
  // v10.1: merge AI Context into classification so surface keywords in the
  // context box are honoured by Expert Guardrails (not just by the AI prompt).
  const hardCtx      = (est.hardContext ?? "").trim();
  const effectiveName = hardCtx ? `${name} ${hardCtx}` : name;

  // Zestawy bypass: assembly child items are priced by their parent assembly's logic.
  if (est.isAssemblyChild) return est;

  const profile = classifyIntent(effectiveName);

  // No category floor — pass through, but still generate calculationLog for transparency
  if (profile.intent === "GENERAL") return est;

  // ── Cumulative multiplier breakdown (for Explainability Layer)
  // Use effectiveName for surface detection — catches zelbet only in context box
  const surfaceMod = isZelbet(effectiveName) ? 2.25 : 1.0;
  const ceilingMod = CEILING_RE.test(effectiveName) ? 2.50 : 1.0;
  const heightMod  = getHeightModifier(effectiveName, "");
  const mult       = surfaceMod * ceilingMod * (heightMod > 1.0 ? heightMod : 1.0);
  let   floor      = Math.round(profile.baseFloor * mult * 100) / 100;

  // v10.1: Groove-żelbet Nuclear Override
  // When item is groove/chasing work AND combined context has żelbet/beton/monolit,
  // enforce hard minimum: 150 PLN/mb regardless of KNR norm result.
  // Physics: diamond blade, rebar present, slow progress → KNR norms 0.45–0.80 rbh/mb
  // 0.45 rbh/mb × 85 PLN/rbh = 38 PLN — clearly insufficient. Floor at 150.
  if (GROOVE_FLOOR_RE.test(name) && isZelbet(effectiveName)) {
    floor = Math.max(floor, SAL_GROOVE_ZELBET_FLOOR_PLN);
  }
  const prevPrice  = est.suggestedLabor ?? 0;

  // Unit enforcement: ACTION/HEAVY_CONNECTION always → szt, regardless of mb in name
  const currentUnit = (est.guardedUnit ?? est.unit ?? "").toLowerCase().trim();
  const forcedUnit  = profile.forcedUnit ?? currentUnit;
  const unitChanged = forcedUnit !== currentUnit;

  // Confidence flags
  const isLowConf = profile.confidence === "low";

  // ── Explainability Layer: generate calculationLog for every non-GENERAL item
  const objectHint  = (HEAVY_APPLIANCE_RE.test(name) || /kocio[lł]/i.test(name)) ? "Ciężkie urządz." : "Osprzęt";
  const surfTag     = surfaceMod !== 1.0 ? `Pow.×${surfaceMod}` : "Pow.×1.0";
  const ceilTag     = ceilingMod !== 1.0 ? `Suf.×${ceilingMod}` : "Suf.×1.0";
  const htTag       = heightMod > 1.0 ? `Wys.×${heightMod.toFixed(2)}` : "Wys.×1.0";
  const confTag     = isLowConf ? " [Pewność: NISKA]" : "";
  const calculationLog =
    `Wykryto: [${profile.intent}] (${objectHint})${confTag}. ` +
    `Norma bazowa: ${profile.baseNorm.toFixed(2)} rbh. ` +
    `Floor: ${profile.baseFloor.toFixed(2)} PLN. ` +
    `Mnożniki: ${surfTag} × ${ceilTag} × ${htTag} → Końcowa: ${(prevPrice > 0 ? Math.max(prevPrice, floor) : floor).toFixed(2)} PLN`;

  // Trigger correction if price below floor OR unit wrong.
  // NOTE: prevPrice > 0 guard REMOVED — items zeroed by applySanityCheck (SANITY_FAIL)
  // must also be corrected to the expert floor (Iron Rule: 0 PLN for Pompa is illegal).
  const cappedFloor    = Math.min(floor, SAL_MAX_LABOR_PLN);
  const priceBelowFloor = prevPrice < cappedFloor;
  if (!priceBelowFloor && !unitChanged) {
    // No price correction needed, but still attach calculationLog + isLowConfidence
    if (isLowConf || !est.calculationLog) {
      return { ...est, calculationLog, isLowConfidence: isLowConf || est.isLowConfidence };
    }
    return est;
  }

  const finalPrice = prevPrice > 0 ? Math.max(prevPrice, floor) : floor;
  const multTag    = mult > 1.0 ? ` × ${mult.toFixed(2)}(pow/suf/wys)` : "";
  const ambiguityNote = isLowConf
    ? " ⚠️ Niejednoznaczna formułowanie. Zastosowano cenę ochronną. Sprawdź ręcznie."
    : "";

  return {
    ...est,
    suggestedLabor:  finalPrice,
    guardedUnit:     forcedUnit,
    laborNorm:       Math.max(est.laborNorm ?? 0, profile.baseNorm),
    confidence:      "medium" as const,
    expert_override: true,
    isLowConfidence: isLowConf,
    calculationLog:  calculationLog,
    trace: `${est.trace ?? ""} [🚩 Экспертный щит: Категория [${profile.intent}]. Цена скорректирована с ${prevPrice.toFixed(2)} до ${finalPrice.toFixed(2)} PLN${multTag}${ambiguityNote}]`,
    note:  `${est.note ?? ""} | 🚩 Expert Shield [${profile.intent}]: min. ${cappedFloor.toFixed(2)} PLN${ambiguityNote}`,
  };
}

// ─── applyPostProcessPipeline ─────────────────────────────────────
// Unified post-processing for ALL entry points.
// Ensures triggerL3Estimation and repriceSingleItem go through
// the same guardrails as estimatePricesWithAI.

export function applyPostProcessPipeline(
  est: AiPriceEstimate,
  baseRateForCalc: number,
  globalLaborMod: number,
): AiPriceEstimate {
  // Step 1: Keyword rules (pure-labor → material=0, demontaż ×0.65)
  let result = { ...est };
  if (isPureLaborByKeyword(result.name) && result.suggestedMaterial > 0) {
    result = { ...result, suggestedMaterial: 0, matSource: null };
  }
  const demontazLabor = applyDemontazRule(result.suggestedLabor, result.name);
  if (demontazLabor !== result.suggestedLabor) {
    const suffix = (result.note ?? "").includes("KNR 4-03") ? "" : " | KNR 4-03 ×0.65";
    result = { ...result, suggestedLabor: demontazLabor, note: (result.note ?? "") + suffix };
  }

  // Step 2: Sanity check (norm thresholds, unit-mismatch detection)
  result = applySanityCheck(result, baseRateForCalc);

  // Step 3: Expert guards (connection PLN floor, hard surface floor)
  result = enforceExpertGuards(result, baseRateForCalc, globalLaborMod);

  // Step 4: Reality check (hardness guard, gravity guard, safety integrity)
  const rc = applyRealityCheck(result);
  result = {
    ...result,
    suggestedLabor: rc.suggestedLabor,
    calculationLog: rc.calculationLog || result.calculationLog,
    note: rc.note || result.note,
    safetyNote: rc.safetyNote,
  };

  // Step 5: Security Audit Layer — NUCLEAR VETO (hardcoded PLN floors)
  result = securityAuditLayer(result);

  return result;
}
