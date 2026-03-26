/**
 * lib/services/reality-check.ts
 * ─────────────────────────────────────────────────────────────────
 * Reality Check v1.3 — Warstwa Filtra Adekwatności
 * PURE functions: NO server-side imports, NO Supabase, NO Next.js.
 * Safe to import in vitest / browser context.
 *
 * Four Expert Rules — always run AFTER L0/L1/L2/L3, BEFORE securityAuditLayer.
 *
 * Rule 1 — Hardness Guard:
 *   żelbet ×8.0 | beton ×5.0 | silikat ×2.5 applied to BasePrice_Standard.
 *   If suggested labor < floor → override + log warning.
 *
 * Rule 2 — Gravity Guard:
 *   sufit/strop/antresola/nad głową → +50% labor (GENERAL items only).
 *   SAL already handles ceiling mods for non-GENERAL items.
 *
 * Rule 3 — Safety Integrity:
 *   indukcja/pompa ciepła/EV/sauna → safetyNote added to estimate.
 *   MaterialExpertPanel checks safetyNote and warns when no RCD/MCB present.
 *
 * Rule 4 — CrossSectionGuard + Metal Guard (WLZ / Heavy Power Cables):
 *   Cables with cross-section ≥10mm² have a minimum labor floor.
 *   ≥10mm²: floor = 40 PLN/mb | ≥35mm²: HEAVY_CONNECTION floor = 65 PLN/mb.
 *   Prevents thin-wire norm (0.032 rbh/mb) from being applied to WLZ lines.
 *   Aluminum detection (YAKY/AsXSn/Alu/Al): +17.5% overhead for connections.
 *   Silent Expert: Pasta stykowa Al-Cu + Końcówki Al-Cu suggested for Al cables.
 */

import { isZelbet, SAL_STD_CONN_FLOOR_PLN, classifyIntent } from "@/lib/services/semantic-classifier";

// ─────────────────────────────────────────────────────────────────
// Rule 1 — Hardness constants
// ─────────────────────────────────────────────────────────────────

/** Base price per-szt used as anchor for hardness floor calculation. */
export const RC_BASE_PRICE_STD_PLN = SAL_STD_CONN_FLOOR_PLN; // 45.00 PLN/szt

/** Base price per-mb used for linear work hardness floor calculation. */
export const RC_BASE_PRICE_MB_PLN  = 15.00; // PLN/mb (standard wall groove reference)

/** Hardness multiplier for reinforced concrete (żelbet / zbrojony / monolit). */
export const RC_MULT_ZELBET  = 8.0;
/** Hardness multiplier for plain concrete (beton). */
export const RC_MULT_BETON   = 5.0;
/** Hardness multiplier for calcium-silicate blocks (silikat). */
export const RC_MULT_SILIKAT = 2.5;

// ─────────────────────────────────────────────────────────────────
// Rule 2 — Gravity constants
// ─────────────────────────────────────────────────────────────────

/** Labor multiplier for overhead / ceiling work (+50%). */
export const RC_GRAVITY_MULT = 1.5;

/**
 * Detects overhead / ceiling work in item name or context.
 * No trailing \b — Polish declension: suficie, stropie, antresoli, etc.
 */
export const OVERHEAD_RE = /\b(sufi[tc]|strop|nad\s*glow|nad\s*głow|antresol)/i;

// ─────────────────────────────────────────────────────────────────
// Rule 4 — Cross-Section Guard constants (WLZ / Power cables)
// ─────────────────────────────────────────────────────────────────

/**
 * Regex to extract NxM cross-section from a cable name.
 * Matches: "5x10", "4x16", "3×2,5", "5х35" (Cyrillic х also accepted).
 * Does NOT match voltage patterns — caller must apply voltage guard.
 */
export const WLZ_SECTION_RE = /(\d+)\s*[xх×]\s*(\d+(?:[.,]\d+)?)/i;

/**
 * Voltage pattern guard — rejects strings like "1×230V", "3×400V".
 * Applied inside extractCableSection to prevent false section matches.
 */
export const VOLTAGE_PATTERN_RE = /[xх×]\s*\d{2,3}\s*[Vv]\b/i;

/** Minimum labor floor per mb for medium-weight cables (section 10–34mm²). */
export const RC_WLZ_FLOOR_10MM2 = 40.0;  // PLN/mb

/** Minimum labor floor per mb for heavy cables (section ≥35mm² — HEAVY_CONNECTION). */
export const RC_WLZ_FLOOR_35MM2 = 65.0;  // PLN/mb

/** Section threshold (mm²) that triggers the WLZ medium-weight floor. */
export const WLZ_SECTION_THRESHOLD_MEDIUM = 10;

/** Section threshold (mm²) that triggers the HEAVY_CONNECTION floor. */
export const WLZ_SECTION_THRESHOLD_HEAVY = 35;

// ─────────────────────────────────────────────────────────────────
// Rule 4b — Metal Guard (Aluminum vs Copper)
// ─────────────────────────────────────────────────────────────────

/**
 * Detects ALUMINUM power cables: YAKY, AsXSn, variants with Alu/Al prefix/suffix.
 * Matches: YAKY, YAKYzo, YAKYżo, AsXSn, AsXSnzo, Alu, Al (word-boundary).
 */
export const ALUMINUM_CABLE_RE = /\b(Y?AKY(?:zo|żo)?|AsXSn(?:zo|żo)?|Alu|Al)\b/i;

/**
 * Detects COPPER power cables: YKY, YKYzo, YDYp, Cu, Miedź.
 * Copper is the DEFAULT — only needed when explicit copper confirmation is required.
 */
export const COPPER_CABLE_RE = /\b(Y?KY(?:zo|żo)?|Y?DYp?|Cu)\b|(?<![a-zA-Z0-9])Mied[zź]/i;

/**
 * Detects "Podłączenie" / connection work keywords.
 * Aluminum connections require anti-corrosion paste and special crimped terminals.
 */
export const AL_CONNECTION_RE = /\b(podłącz|przyłącz|zacisk|końcówk)/i;

/**
 * Additional labor overhead fraction for aluminum cable CONNECTIONS.
 * Anti-corrosion paste + special Al-Cu terminals require extra ~17.5% time.
 */
export const RC_AL_CONNECTION_OVERHEAD = 0.175; // +17.5%

/**
 * Identifies the conductor metal for a cable/wire item name.
 * Returns "aluminum" | "copper" | null (unknown / non-cable).
 *
 * Examples:
 *   "WLZ YAKY 4x35"   → "aluminum"
 *   "Kabel YKYzo 5x10" → "copper"
 *   "Montaż gniazda"   → null
 */
export function detectCableMetal(name: string): "aluminum" | "copper" | null {
  if (ALUMINUM_CABLE_RE.test(name)) return "aluminum";
  if (COPPER_CABLE_RE.test(name))   return "copper";
  return null;
}

/**
 * Extracts the conductor cross-section (mm²) from a cable/wire item name.
 * Returns null if no section pattern is found or if a voltage pattern is detected.
 *
 * Examples:
 *   "WLZ YKYzo 5x10"  → 10
 *   "Kabel YKY 4x16mm²" → 16
 *   "Linia 5x35"       → 35
 *   "Gniazdo 1×230V"   → null  (voltage guard)
 *   "Montaż gniazda"   → null
 */
export function extractCableSection(name: string): number | null {
  if (VOLTAGE_PATTERN_RE.test(name)) return null;
  const match = name.match(WLZ_SECTION_RE);
  if (!match) return null;
  const section = parseFloat(match[2].replace(",", "."));
  return isNaN(section) || section <= 0 ? null : section;
}

// ─────────────────────────────────────────────────────────────────
// Rule 3 — Safety device detection
// ─────────────────────────────────────────────────────────────────

/**
 * Detects high-power devices that MUST have an associated RCD and MCB.
 * Covers: induction hob, heat pump, EV charger, sauna.
 */
export const SAFETY_DEVICE_RE =
  /indukc|pomp.*ciep|ciep.*pomp|adowarka.*ev|ev.*adowarka|saun/i;

/** Human-readable label for the safety notification per device type. */
export function getSafetyDeviceLabel(name: string): string | null {
  const n = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/indukc/.test(n))                            return "kuchenka indukcyjna";
  if (/pomp.*ciep|ciep.*pomp/.test(n))              return "pompa ciepła";
  if (/adowarka.*ev|ev.*adowarka/.test(n))          return "ładowarka EV";
  if (/saun/.test(n))                               return "sauna";
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Hardness detection helpers (Rule 1)
// ─────────────────────────────────────────────────────────────────

interface HardnessHit {
  keyword: string;
  multiplier: number;
}

/**
 * Detects the hardest material present in the combined text.
 * Returns the highest-priority hit (żelbet > beton > silikat).
 */
export function detectHardnessMaterial(text: string): HardnessHit | null {
  if (isZelbet(text)) return { keyword: "żelbet", multiplier: RC_MULT_ZELBET };
  // No trailing \b — Polish declension: betonów, betonie, betonowej, etc.
  if (/\bbeton/i.test(text)) return { keyword: "beton",   multiplier: RC_MULT_BETON };
  if (/\bsilikat/i.test(text)) return { keyword: "silikat", multiplier: RC_MULT_SILIKAT };
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Minimal input type for applyRealityCheck
// ─────────────────────────────────────────────────────────────────

export interface RCItem {
  name:           string;
  hardContext?:   string;
  unit?:          string;
  guardedUnit?:   string;
  suggestedLabor?: number;
  laborNorm?:     number | null;
  calculationLog?: string;
  note?:          string;
  isAssemblyChild?: boolean;
}

export interface RCResult {
  suggestedLabor:      number;
  calculationLog:      string;
  note:                string;
  safetyNote?:         string;
  /** Silent Expert material suggestion, populated when aluminum cable is detected. */
  materialSuggestion?: string;
  realityCheckApplied: boolean;
}

// ─────────────────────────────────────────────────────────────────
// applyRealityCheck  — main entry point
// ─────────────────────────────────────────────────────────────────

/**
 * Applies all three Reality Check rules to a pricing estimate.
 * Returns corrected fields merged back into the estimate.
 *
 * Placement in pipeline:
 *   enforceExpertGuards → applyRealityCheck → securityAuditLayer (nuclear veto)
 *
 * Architecture guarantee: Reality Check result is always ADDITIVE — it
 * can only RAISE prices and ADD log entries. It never lowers prices.
 */
export function applyRealityCheck(item: RCItem): RCResult {
  const name         = item.name ?? "";
  const hardCtx      = (item.hardContext ?? "").trim();
  const effectiveTxt = hardCtx ? `${name} ${hardCtx}` : name;
  const unit         = (item.guardedUnit ?? item.unit ?? "szt").toLowerCase().trim();
  const isLinear     = unit === "mb" || unit === "m";

  let labor       = item.suggestedLabor ?? 0;
  const logParts: string[] = item.calculationLog ? [item.calculationLog] : [];
  const noteParts: string[] = item.note ? [item.note] : [];
  let applied            = false;
  let safetyNote:         string | undefined;
  let materialSuggestion: string | undefined;

  // ── Rule 1: Hardness Guard ──────────────────────────────────────
  const hit = detectHardnessMaterial(effectiveTxt);
  if (hit && !item.isAssemblyChild) {
    const base  = isLinear ? RC_BASE_PRICE_MB_PLN : RC_BASE_PRICE_STD_PLN;
    const floor = Math.round(base * hit.multiplier * 100) / 100;

    if (labor < floor) {
      const prev = labor;
      labor  = floor;
      applied = true;
      logParts.push(
        `RC Rule 1 — Hardness Guard [${hit.keyword}]: ` +
        `${base.toFixed(2)} × ${hit.multiplier} = ${floor.toFixed(2)} PLN. ` +
        `Cena skorygowana: ${prev.toFixed(2)} → ${floor.toFixed(2)} PLN.`
      );
      noteParts.push(
        `⚠️ Cena skorygowana: ${hit.keyword.charAt(0).toUpperCase() + hit.keyword.slice(1)} ` +
        `wymaga wyższej stawki KNR. (×${hit.multiplier})`
      );
    } else {
      logParts.push(
        `RC Rule 1 — Hardness Guard [${hit.keyword}] ×${hit.multiplier}: ` +
        `floor = ${Math.round(base * hit.multiplier * 100) / 100} PLN — cena OK (${labor.toFixed(2)} ≥ floor).`
      );
    }
  }

  // ── Rule 2: Gravity Guard ───────────────────────────────────────
  // Applies to ALL non-assembly items. securityAuditLayer may further amplify (×2.5 for strop).
  if (
    OVERHEAD_RE.test(effectiveTxt) &&
    !item.isAssemblyChild
  ) {
    if (labor > 0) {
      const prev  = labor;
      labor  = Math.round(labor * RC_GRAVITY_MULT * 100) / 100;
      applied = true;
      logParts.push(
        `RC Rule 2 — Gravity Guard (sufit/strop/antresola): ` +
        `+${Math.round((RC_GRAVITY_MULT - 1) * 100)}% do robocizny. ` +
        `${prev.toFixed(2)} × ${RC_GRAVITY_MULT} = ${labor.toFixed(2)} PLN.`
      );
      noteParts.push("⚠️ Praca nad głową: +50% czas montażu [RC Gravity Guard]");
    }
  }

  // ── Rule 3: Safety Integrity ────────────────────────────────────
  // No price correction — just signals the UI to check for RCD/MCB.
  const deviceLabel = getSafetyDeviceLabel(name);
  if (deviceLabel) {
    safetyNote =
      `✨ Czy pamiętałeś o zabezpieczeniach RCD dla ${deviceLabel}? ` +
      `Urządzenie wymaga dedykowanego obwodu z bezpiecznikiem MCB i wyłącznikiem różnicowoprądowym RCD.`;
  }

  // ── Rule 4: CrossSectionGuard + Metal Guard ─────────────────────
  // Only for linear items (mb/m). Assembly children are bypassed.
  // Prevents thin-wire KNR norm (~0.032 rbh/mb) from being used for
  // heavy power cables where real norms are 0.60–1.20 rbh/mb.
  if (isLinear && !item.isAssemblyChild) {
    // ── Rule 4b: Metal detection — materialSuggestion for Al cables ─
    const metal = detectCableMetal(name);
    if (metal === "aluminum") {
      materialSuggestion =
        "Kabel aluminiowy — dodaj: " +
        "Pasta stykowa Al-Cu (anti-korozja), Końcówki szczelne/Al-Cu. " +
        "[ES-Engine Metal Guard]";
    }

    const section = extractCableSection(name);
    if (section !== null && section >= WLZ_SECTION_THRESHOLD_MEDIUM) {
      const isHeavy = section >= WLZ_SECTION_THRESHOLD_HEAVY;
      let   floor   = isHeavy ? RC_WLZ_FLOOR_35MM2 : RC_WLZ_FLOOR_10MM2;
      const label   = isHeavy
        ? `HEAVY_CONNECTION ≥${WLZ_SECTION_THRESHOLD_HEAVY}mm²`
        : `WLZ ≥${WLZ_SECTION_THRESHOLD_MEDIUM}mm²`;

      // ── Al-Cu connection overhead (+17.5%) ───────────────────────
      // Aluminum connections require anti-corrosion paste and crimped
      // Al-Cu terminals → additional 17.5% labor time for "Podłączenie".
      const isConnectionWork = AL_CONNECTION_RE.test(name);
      if (metal === "aluminum" && isConnectionWork) {
        const prevFloor = floor;
        floor = Math.round(floor * (1 + RC_AL_CONNECTION_OVERHEAD) * 100) / 100;
        logParts.push(
          `RC Rule 4b — Al-Cu Connection Overhead: ` +
          `+${Math.round(RC_AL_CONNECTION_OVERHEAD * 100)}% (pasta Al-Cu + końcówki). ` +
          `${prevFloor.toFixed(2)} × ${(1 + RC_AL_CONNECTION_OVERHEAD).toFixed(3)} ` +
          `= ${floor.toFixed(2)} PLN/mb.`
        );
      }

      const alTag = metal === "aluminum" ? " [Al]" : "";

      if (labor < floor) {
        const prev = labor;
        labor      = floor;
        applied    = true;
        logParts.push(
          `RC Rule 4 — CrossSectionGuard [${label}]${alTag}: ` +
          `przekrój ${section}mm² → podłoga robocizny ${floor.toFixed(2)} PLN/mb. ` +
          `Cena skorygowana: ${prev.toFixed(2)} → ${floor.toFixed(2)} PLN.`
        );
        noteParts.push(
          `⚠️ Kabel zasilający ${section}mm²${alTag} wymaga wyższej normy pracy KNR. ` +
          `Minimum ${floor.toFixed(0)} PLN/mb [CrossSectionGuard].`
        );
      } else {
        logParts.push(
          `RC Rule 4 — CrossSectionGuard [${label}]${alTag}: ` +
          `przekrój ${section}mm² → floor = ${floor.toFixed(2)} PLN/mb — cena OK (${labor.toFixed(2)} ≥ floor).`
        );
      }
    }
  }

  return {
    suggestedLabor:      labor,
    calculationLog:      logParts.join(" | "),
    note:                noteParts.join(" | "),
    safetyNote,
    materialSuggestion,
    realityCheckApplied: applied,
  };
}
