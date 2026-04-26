// ═══════════════════════════════════════════════════════════════════
// lib/ai/smart-context-mapper.ts
// ES-Engine Smart Context Mapper — "Sacred Words" keyword parser.
//
// Detects 4 semantic categories in item names and returns structured
// SmartContext used to enrich AI prompts and drive UI validation badges.
//
// Pure functions — NO server deps, NO Supabase. Safe for client + server.
// ═══════════════════════════════════════════════════════════════════

import { normalizePlName } from "@/lib/services/semantic-classifier";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * 4 Sacred Word categories.
 *
 * Priority order (higher wins if multiple match):
 *   1. ZESTAW       — full assembly cycle (Punkt, Zestaw, Komplet, Przyłącze)
 *   2. ROZDZIELNICA — panel/switchboard aggregation (Prefabrykacja, Uzbrojenie)
 *   3. TRASY        — linear work per mb (Układanie, Bruzda, Wciąganie)
 *   4. BIALY_MONTAZ — installation-only, no cable/conduit (Montaż, Wymiana)
 */
export type SmartCategory =
  | "ZESTAW"
  | "BIALY_MONTAZ"
  | "TRASY"
  | "ROZDZIELNICA"
  | "NONE";

/** Expert sub-classification within a category. */
export type SmartSubType =
  | "ZESTAW_3PHASE"   // Indukcja / Siła / 3-faz → YDYp 5×2.5, CEE socket
  | "ZESTAW_LED"      // LED → include zasilacz + profile mounting note
  | "ROZDZIELNICA_MOD"// calculate by modules (moduły), not szt
  | null;

export interface SmartContext {
  /** Semantic category (NONE if no Sacred Word found). */
  category: SmartCategory;
  /** Expert sub-type within the category. */
  subType: SmartSubType;
  /** The Sacred Word that triggered the match (e.g. "Punkt"). */
  matchedKeyword: string | null;
  /** The literal substring matched from item.name. */
  matchedTrigger: string | null;
  /** Recommended cable spec (null for non-ZESTAW). */
  cableSpec: string | null;
  /** Default cable run length per point (mb). */
  defaultCableLength: number;
  /** Default furrow (bruzda) length per point (mb). */
  defaultFurrowLength: number;
  /**
   * Human-readable label shown in UI:
   * "Rozpoznano jako: Zestaw kompletny (Punkt)"
   */
  validationLabel: string;
  /**
   * Short instruction injected directly into the L3 AI batch prompt per item.
   * Empty string when category === "NONE".
   */
  promptHint: string;
  /** Suggested unit override (null = keep original). */
  suggestedUnit: "szt" | "mb" | "kpl" | null;
}

// ─── Sacred Word Patterns ─────────────────────────────────────────────────────

// Category 1 — ZESTAW (Full cycle): Punkt wins over everything.
const ZESTAW_PUNKT_RE      = /\bpunkt\b/i;
const ZESTAW_EXPLICIT_RE   = /\bzestaw\b/i;
const ZESTAW_KOMPLET_RE    = /\bkomplet\b/i;
// "Wypust z instalacją" — wypust + presence of "instalacj" (any declension)
const ZESTAW_WYPUST_INST_RE = /\bwypust\b.*\binstalag?c/i;
// "Przyłącze" (e.g. Przyłącze AGD, Przyłącze kuchenne)
const ZESTAW_PRZYLACZE_RE  = /\bprzyl[aą]cze?\b/i;

// Category 2 — BIAŁY MONTAŻ (Installation-only, no cable/conduit)
const BIALY_MONTAZ_RE      = /\bmonta[zż]\b/i;
const BIALY_OSPRZET_RE     = /\bosprzęt\b|\bosprzet\b/i;
const BIALY_PODLACZENIE_RE = /\bpodl[aą]czenie\b/i;
const BIALY_WYMIANA_RE     = /\bwymiana\b/i;
const BIALY_INST_OSP_RE    = /instalacja\s+osprzę?tu/i;

// Category 3 — TRASY / OKABLOWANIE (Linear work per mb)
// NOTE: TRASY assembly bundles bruzd + cable + mocowanie. It must be triggered
// by an EXPLICIT cable-action verb (układanie/prowadzenie/wciąganie/mocowanie)
// or by a "trasa kablowa" / "linia kablowa" composite name. Bare "Bruzdowanie"
// is NOT a TRASY trigger — standalone bruzdowanie is a separate kosztorys line
// (KNR 5-08 0101 cegła = 0.85 rbh/mb, KNR 5-08 0103 beton = 2.0 rbh/mb).
// Triggering TRASY on bare "Bruzdowanie" caused (a) double-counting against
// the user's separate cable lines and (b) flat 0.98 rbh/mb override of the
// L0 canonical norms (cegła vs beton differentiation lost). v2.6.3.
const TRASY_UKLADANIE_RE   = /\bu[lł][oó][zż]enie\b|\bukladanie\b|\bukladac\b/i;
const TRASY_PROWADZENIE_RE = /\bprowadzenie\b/i;
const TRASY_WCIAGANIE_RE   = /\bwci[aą]ganie\b/i;
const TRASY_MOCOWANIE_RE   = /\bmocowanie\b/i;
// "trasa kablowa" / "linia kablowa" — explicit composite naming triggers bundle.
// Standalone "Bruzdowanie" is INTENTIONALLY NOT in this regex.
const TRASY_TRASA_RE       = /\b(?:trasa|linia)\s+kablow/i;

// Category 4 — ROZDZIELNICE (Panel aggregation)
const RZDZ_PREFABRYKACJA_RE = /\bprefabrykacja\b/i;
const RZDZ_UZBROJENIE_RE    = /\buzbrojenie\b/i;
const RZDZ_OPISANIE_RE      = /\bopisanie\b|\boznaczenie\b/i;
// Standalone "rozdzielnica" / "tablica el" triggers assembly mode (not just a device item)
const RZDZ_BOARD_RE         = /\brozdzielnic[ay]\b|\btablica\s+el(?:ektryczna)?\b/i;

// Expert heuristics — sub-type detection
const EXPERT_3PHASE_RE  = /\bindukcja\b|\bsi[lł]a\b|\b3[-\s]?faz/i;
const EXPERT_LED_RE     = /\bled\b/i;
const EXPERT_MOD_RE     = /\bmodul[yó]\b|\bmod\b|\bpola\b/i;

// ─── Main function ─────────────────────────────────────────────────────────────

/**
 * Detects Sacred Words in an item name and returns a structured SmartContext.
 *
 * Priority: ZESTAW > ROZDZIELNICA > TRASY > BIAŁY MONTAŻ > NONE
 * Uses normalizePlName() for diacritic-safe matching.
 */
export function detectSmartContext(name: string): SmartContext {
  const nn = normalizePlName(name);
  const raw = name; // keep original for display

  // ── Category 1: ZESTAW (highest priority) ──────────────────────────────────
  if (ZESTAW_PUNKT_RE.test(raw) || ZESTAW_PUNKT_RE.test(nn)) {
    const is3Phase = EXPERT_3PHASE_RE.test(nn) || EXPERT_3PHASE_RE.test(raw);
    const isLED    = EXPERT_LED_RE.test(raw);
    const subType: SmartSubType = is3Phase ? "ZESTAW_3PHASE" : isLED ? "ZESTAW_LED" : null;
    return buildZestaw("Punkt", "Punkt", subType, raw);
  }
  if (ZESTAW_PRZYLACZE_RE.test(raw) || ZESTAW_PRZYLACZE_RE.test(nn)) {
    const is3Phase = EXPERT_3PHASE_RE.test(nn) || EXPERT_3PHASE_RE.test(raw);
    const subType: SmartSubType = is3Phase ? "ZESTAW_3PHASE" : null;
    return buildZestaw("Przyłącze", "Przyłącze", subType, raw);
  }
  if (ZESTAW_WYPUST_INST_RE.test(raw)) {
    return buildZestaw("Wypust z instalacją", "Wypust", null, raw);
  }
  if (ZESTAW_KOMPLET_RE.test(raw) || ZESTAW_KOMPLET_RE.test(nn)) {
    return buildZestaw("Komplet", "Komplet", null, raw);
  }
  if (ZESTAW_EXPLICIT_RE.test(raw) || ZESTAW_EXPLICIT_RE.test(nn)) {
    return buildZestaw("Zestaw", "Zestaw", null, raw);
  }

  // ── Category 4: ROZDZIELNICE ────────────────────────────────────────────────
  if (RZDZ_PREFABRYKACJA_RE.test(raw) || RZDZ_PREFABRYKACJA_RE.test(nn)) {
    return buildRozdzielnica("Prefabrykacja", raw);
  }
  if (RZDZ_UZBROJENIE_RE.test(raw) || RZDZ_UZBROJENIE_RE.test(nn)) {
    return buildRozdzielnica("Uzbrojenie tablicy", raw);
  }
  if (RZDZ_OPISANIE_RE.test(raw) || RZDZ_OPISANIE_RE.test(nn)) {
    return buildRozdzielnica("Opisanie/Oznaczenie", raw);
  }
  if (RZDZ_BOARD_RE.test(raw) || RZDZ_BOARD_RE.test(nn)) {
    const byMod = EXPERT_MOD_RE.test(nn) || EXPERT_MOD_RE.test(raw);
    const subType: SmartSubType = byMod ? "ROZDZIELNICA_MOD" : null;
    return buildRozdzielnica("Rozdzielnica", raw, subType);
  }

  // ── Category 3: TRASY / OKABLOWANIE ────────────────────────────────────────
  // v2.6.3: bare "Bruzdowanie" no longer triggers TRASY (see TRASY_TRASA_RE comment).
  if (TRASY_TRASA_RE.test(raw) || TRASY_TRASA_RE.test(nn)) {
    return buildTrasy("Trasa kablowa", raw);
  }
  if (TRASY_UKLADANIE_RE.test(raw) || TRASY_UKLADANIE_RE.test(nn)) {
    return buildTrasy("Układanie/Ułożenie", raw);
  }
  if (TRASY_PROWADZENIE_RE.test(raw) || TRASY_PROWADZENIE_RE.test(nn)) {
    return buildTrasy("Prowadzenie", raw);
  }
  if (TRASY_WCIAGANIE_RE.test(raw) || TRASY_WCIAGANIE_RE.test(nn)) {
    return buildTrasy("Wciąganie", raw);
  }
  if (TRASY_MOCOWANIE_RE.test(raw) || TRASY_MOCOWANIE_RE.test(nn)) {
    return buildTrasy("Mocowanie (tras)", raw);
  }

  // ── Category 2: BIAŁY MONTAŻ ────────────────────────────────────────────────
  if (BIALY_INST_OSP_RE.test(raw)) {
    return buildBialyMontaz("Instalacja osprzętu", raw);
  }
  if (BIALY_WYMIANA_RE.test(raw) || BIALY_WYMIANA_RE.test(nn)) {
    return buildBialyMontaz("Wymiana", raw);
  }
  if (BIALY_PODLACZENIE_RE.test(raw) || BIALY_PODLACZENIE_RE.test(nn)) {
    return buildBialyMontaz("Podłączenie", raw);
  }
  if (BIALY_OSPRZET_RE.test(raw)) {
    return buildBialyMontaz("Osprzęt", raw);
  }
  if (BIALY_MONTAZ_RE.test(raw) || BIALY_MONTAZ_RE.test(nn)) {
    return buildBialyMontaz("Montaż", raw);
  }

  // ── No match ─────────────────────────────────────────────────────────────────
  return {
    category: "NONE",
    subType: null,
    matchedKeyword: null,
    matchedTrigger: null,
    cableSpec: null,
    defaultCableLength: 0,
    defaultFurrowLength: 0,
    validationLabel: "",
    promptHint: "",
    suggestedUnit: null,
  };
}

// ─── Builder helpers ──────────────────────────────────────────────────────────

function buildZestaw(
  keyword: string,
  trigger: string,
  subType: SmartSubType,
  _rawName: string,
): SmartContext {
  const is3Phase = subType === "ZESTAW_3PHASE";
  const isLED    = subType === "ZESTAW_LED";

  const cableSpec = is3Phase ? "YDYp 5×2.5mm²" : "YDYp 3×2.5mm²";
  const cableLen  = is3Phase ? 4.5 : 3.5;
  const furrowLen = is3Phase ? 4.5 : 1.5;

  let assemblyDesc = "Zestaw kompletny";
  if (is3Phase) assemblyDesc = "Zestaw 3-fazowy (Siła/Indukcja)";
  else if (isLED) assemblyDesc = "Zestaw oświetleniowy LED";

  const ledNote = isLED
    ? " Uwzględnij zasilacz LED i montaż profilu/mocowania."
    : "";
  const phaseNote = is3Phase
    ? " Zastosuj kabel 5×2.5mm², gniazdo CEE 16A/32A, ochronę 3-fazową."
    : "";

  return {
    category: "ZESTAW",
    subType,
    matchedKeyword: keyword,
    matchedTrigger: trigger,
    cableSpec,
    defaultCableLength: cableLen,
    defaultFurrowLength: furrowLen,
    validationLabel: `${assemblyDesc} (${keyword})`,
    promptHint: [
      `[SCM:ZESTAW keyword="${keyword}"]`,
      `To jest ZESTAW KOMPLETNY. NIE zwracaj jednego kodu KNR.`,
      `Musi zawierać: kabel ${cableSpec} (~${cableLen}mb), bruzda (~${furrowLen}mb), puszka, montaż urządzenia.`,
      phaseNote,
      ledNote,
    ].filter(Boolean).join(" "),
    suggestedUnit: "szt",
  };
}

function buildBialyMontaz(keyword: string, _rawName: string): SmartContext {
  return {
    category: "BIALY_MONTAZ",
    subType: null,
    matchedKeyword: keyword,
    matchedTrigger: keyword,
    cableSpec: null,
    defaultCableLength: 0,
    defaultFurrowLength: 0,
    validationLabel: `Biały montaż (${keyword})`,
    promptHint: `[SCM:BIALY_MONTAZ keyword="${keyword}"] Tylko czysta robocizna — BEZ kabla i BEZ bruzdy. Osobne pozycje na kabel/bruzdę jeśli potrzeba.`,
    suggestedUnit: "szt",
  };
}

function buildTrasy(keyword: string, _rawName: string): SmartContext {
  return {
    category: "TRASY",
    subType: null,
    matchedKeyword: keyword,
    matchedTrigger: keyword,
    cableSpec: null,
    defaultCableLength: 0,
    defaultFurrowLength: 0,
    validationLabel: `Trasy/Okablowanie (${keyword})`,
    promptHint: `[SCM:TRASY keyword="${keyword}"] Praca liniowa rozliczana per mb. Jednostka MUSI być mb/m. Podaj nakład rbh/mb.`,
    suggestedUnit: "mb",
  };
}

function buildRozdzielnica(
  keyword: string,
  _rawName: string,
  subType: SmartSubType = null,
): SmartContext {
  const byMod = subType === "ROZDZIELNICA_MOD";
  return {
    category: "ROZDZIELNICA",
    subType,
    matchedKeyword: keyword,
    matchedTrigger: keyword,
    cableSpec: null,
    defaultCableLength: 0,
    defaultFurrowLength: 0,
    validationLabel: `Rozdzielnica/Tablica (${keyword})`,
    promptHint: [
      `[SCM:ROZDZIELNICA keyword="${keyword}"]`,
      `Złożona pozycja tablicy elektrycznej.`,
      byMod
        ? "Wyceniaj per moduł (mod) — podaj stawkę/moduł."
        : "Wyceniaj per szt (komplet tablicy). Uwzględnij: obudowa + aparatura + szyny + podłączenia.",
    ].join(" "),
    suggestedUnit: byMod ? "kpl" : "szt",
  };
}

// ─── Prompt injection helper ─────────────────────────────────────────────────

/**
 * Builds a per-item context line for injection into L3 AI batch prompt.
 * Returns empty string if category === "NONE" (no hint added).
 */
export function buildItemContextPrompt(name: string): string {
  const ctx = detectSmartContext(name);
  return ctx.promptHint;
}

/**
 * Enriches the L3 item list string with per-item SCM hints.
 * Format: `${idx+1}. "${name}" | jednostka: ${unit} [SCM hint if any]`
 */
export function buildEnrichedItemList(
  items: Array<{ name: string; unit: string }>,
): string {
  return items
    .map((item, idx) => {
      const hint = buildItemContextPrompt(item.name);
      const hintSuffix = hint ? `\n   ↳ ${hint}` : "";
      return `${idx + 1}. "${item.name}" | jednostka: ${item.unit}${hintSuffix}`;
    })
    .join("\n");
}

/**
 * Returns a short display label for use in UI badge.
 * Returns null when no Sacred Word was found.
 */
export function getSmartContextLabel(name: string): string | null {
  const ctx = detectSmartContext(name);
  return ctx.validationLabel || null;
}

/**
 * Returns a CSS color class for the SCM category badge.
 */
export function getSmartContextBadgeColor(category: SmartCategory): string {
  switch (category) {
    case "ZESTAW":        return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700";
    case "ROZDZIELNICA":  return "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700";
    case "TRASY":         return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700";
    case "BIALY_MONTAZ":  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
    default:              return "";
  }
}
