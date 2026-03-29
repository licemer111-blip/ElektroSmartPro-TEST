/**
 * matching-engine.ts
 *
 * ES-Engine: 4-Phase Semantic Matching Pipeline
 * Maps any Polish installer text to a canonical KNR code.
 *
 * Phase 1 — Exact Match     → confidence L1 (100%)  — DB exact lookup
 * Phase 2 — Fuzzy Match     → confidence L2 (60-89%) — pg_trgm similarity
 * Phase 3 — Regex Extractors → confidence L2 (75%)  — cable/pipe specs
 * Phase 4 — LLM Fallback    → confidence L3 (<50%)  — mark for manual review
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeText,
  normalizePreservingSpecs,
  extractCableSpec,
  extractPipeSpec,
  tokenize,
  stripProjectNoise,
  extractTechnicalTokens,
  buildWeightedQuery,
  type CableSpec,
  type WeightedToken,
} from "./normalization";

// ─── Public Types ──────────────────────────────────────────────────────────────

export type DictionaryEntryType = "material" | "robocizna" | "zestaw";
export type ConfidenceLevel = "L1" | "L2" | "L3";
export type MatchMethod =
  | "exact"
  | "fuzzy_trgm"
  | "fuzzy_token"
  | "ner_weighted"
  | "synonym_expand"
  | "regex_cable"
  | "regex_pipe"
  | "reverse_norm_lookup"
  | "llm_suggestion"
  | "no_match";

export type MatchSensitivity = "restrykcyjna" | "optymalna" | "elastyczna";
export type MontageMode =
  | "bez_wyboru"
  | "pod_tynkiem"
  | "w_tynku"
  | "w_rurach"
  | "na_wierzchu"
  | "w_korytku"
  | "na_drabince"
  | "ziemny"
  | "sufitowo";

/** Settings injected from Centrum Kalkulacji UI → KnrEngineCalibration */
export interface EngineSettings {
  sensitivity: MatchSensitivity;
  defaultMontage: MontageMode;
  autoLearning: boolean;
  /** Optional free-text context from KnrInvestmentContext — forwarded to LLM */
  investmentContext?: string;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  sensitivity: "optymalna",
  defaultMontage: "bez_wyboru",
  autoLearning: true,
};

/** pg_trgm similarity thresholds per sensitivity level.
 *  Lowered from 0.6 → 0.4 (elastyczna) so NER weighted queries return
 *  a medium-confidence suggestion instead of "brak danych" (Phase 4).
 */
const SENSITIVITY_THRESHOLDS: Record<
  MatchSensitivity,
  { queryThreshold: number; returnHigh: number; returnLow: number }
> = {
  restrykcyjna: { queryThreshold: 0.55, returnHigh: 0.55, returnLow: 0.45 },
  optymalna:    { queryThreshold: 0.40, returnHigh: 0.50, returnLow: 0.35 },
  elastyczna:   { queryThreshold: 0.25, returnHigh: 0.35, returnLow: 0.25 },
};

const MONTAGE_LABELS: Record<MontageMode, string> = {
  bez_wyboru:  "",
  pod_tynkiem: "pod tynkiem",
  w_tynku:     "w tynku (bruzda)",
  w_rurach:    "w rurach (peszel)",
  na_wierzchu: "na wierzchu",
  w_korytku:   "w korytku kablowym",
  na_drabince: "na drabince kablowej",
  ziemny:      "kabel ziemny",
  sufitowo:    "prowadzenie sufitowe",
};

/** Keywords that indicate the user already specified a mounting method */
const MONTAGE_KEYWORDS = ["tynk", "podtynk", "wtynk", "wierzch", "natynk", "bruzd", "rura", "peszel", "arot"];

export interface CompositeRef {
  knr_ref: string;
  type: DictionaryEntryType;
  label: string;
  labor_norm_rbh?: number;
  unit?: string;
}

export interface MatchResult {
  /** Canonical KNR code, e.g. "KNR 5-04 0301-01" */
  knr_ref: string | null;
  /** Human-readable label */
  label: string | null;
  type: DictionaryEntryType;
  /** True → entry is a Zestaw that must be decomposed */
  is_composite: boolean;
  /** Sub-items for composite assemblies */
  composite_refs: CompositeRef[];
  /** Labor norm rbh/unit */
  labor_norm_rbh: number | null;
  /** Unit of measure */
  unit: string;
  /** Confidence score [0..1] */
  confidence: number;
  /** Confidence tier */
  confidence_level: ConfidenceLevel;
  /** Which phase produced this result */
  match_phase: 1 | 2 | 3 | 4;
  match_method: MatchMethod;
  /** The dictionary keyword that was matched */
  matched_keyword?: string;
  /** pg_trgm similarity score (Phase 2 only) */
  similarity?: number;
  /** Original unmodified input */
  original_input: string;
  /** Normalized form used for matching */
  normalized_input: string;
  /** Extracted cable spec (Phase 3) */
  cable_spec?: CableSpec;
  /**
   * True when the matched es_dictionary keyword already encodes a surface type
   * in its labor_norm_rbh (e.g. "bruzdowanie w betonie" norm=0.18 already includes
   * beton hardness). pricing.ts MUST skip getSurfaceModifier() for these entries.
   */
  keyword_encodes_surface?: boolean;
}

// ─── Cable cross-section → KNR table (Phase 3) ────────────────────────────────

interface CableKnrEntry {
  poles: number;
  section: number;
  knr_ref: string;
  label: string;
  labor_norm_rbh: number;
  unit: string;
}

// NOTE: KNR norms are specified per 100mb in the official tables.
// We store them as rbh/mb (÷100) so pricing pipeline can multiply
// directly by item quantity in meters without any extra conversion.
const CABLE_KNR_TABLE: CableKnrEntry[] = [
  // YDYp / NYM — residential wiring  (KNR norms ÷ 100 → rbh/mb)
  { poles: 2, section: 1.5,  knr_ref: "KNR 5-04 0101-01", label: "Przewód YDYp 2×1.5",   labor_norm_rbh: 0.025, unit: "mb" },
  { poles: 3, section: 1.5,  knr_ref: "KNR 5-04 0101-01", label: "Przewód YDYp 3×1.5",   labor_norm_rbh: 0.025, unit: "mb" },
  { poles: 3, section: 2.5,  knr_ref: "KNR 5-04 0101-02", label: "Przewód YDYp 3×2.5",   labor_norm_rbh: 0.030, unit: "mb" },
  { poles: 4, section: 1.5,  knr_ref: "KNR 5-04 0101-01", label: "Przewód YDYp 4×1.5",   labor_norm_rbh: 0.028, unit: "mb" },
  { poles: 4, section: 2.5,  knr_ref: "KNR 5-04 0101-03", label: "Przewód YDYp 4×2.5",   labor_norm_rbh: 0.035, unit: "mb" },
  { poles: 5, section: 1.5,  knr_ref: "KNR 5-04 0101-01", label: "Przewód YDYp 5×1.5",   labor_norm_rbh: 0.030, unit: "mb" },
  { poles: 5, section: 2.5,  knr_ref: "KNR 5-04 0101-03", label: "Przewód YDYp 5×2.5",   labor_norm_rbh: 0.035, unit: "mb" },
  { poles: 5, section: 4.0,  knr_ref: "KNR 5-04 0101-04", label: "Przewód YDYp 5×4",     labor_norm_rbh: 0.038, unit: "mb" },
  { poles: 5, section: 6.0,  knr_ref: "KNR 5-04 0101-04", label: "Przewód YDYp 5×6",     labor_norm_rbh: 0.040, unit: "mb" },
  { poles: 3, section: 4.0,  knr_ref: "KNR 5-04 0101-02", label: "Przewód YDYp 3×4",     labor_norm_rbh: 0.032, unit: "mb" },
  { poles: 3, section: 6.0,  knr_ref: "KNR 5-04 0101-04", label: "Przewód YDYp 3×6",     labor_norm_rbh: 0.038, unit: "mb" },
  { poles: 3, section: 10.0, knr_ref: "KNR 5-04 0102-01", label: "Przewód LgYżo 10mm²",  labor_norm_rbh: 0.020, unit: "mb" },
  { poles: 1, section: 6.0,  knr_ref: "KNR 5-04 0102-01", label: "Przewód LgYżo 6mm²",   labor_norm_rbh: 0.018, unit: "mb" },
  { poles: 1, section: 10.0, knr_ref: "KNR 5-04 0102-01", label: "Przewód LgYżo 10mm²",  labor_norm_rbh: 0.020, unit: "mb" },
  { poles: 1, section: 16.0, knr_ref: "KNR 5-04 0102-02", label: "Przewód LgYżo 16mm²",  labor_norm_rbh: 0.022, unit: "mb" },
  { poles: 1, section: 25.0, knr_ref: "KNR 5-04 0102-02", label: "Przewód LgYżo 25mm²",  labor_norm_rbh: 0.025, unit: "mb" },
  { poles: 1, section: 35.0, knr_ref: "KNR 5-04 0102-03", label: "Przewód LgYżo 35mm²",  labor_norm_rbh: 0.028, unit: "mb" },
  { poles: 1, section: 50.0, knr_ref: "KNR 5-04 0102-03", label: "Przewód LgYżo 50mm²",  labor_norm_rbh: 0.032, unit: "mb" },
  { poles: 1, section: 70.0, knr_ref: "KNR 5-04 0102-04", label: "Przewód LgYżo 70mm²",  labor_norm_rbh: 0.035, unit: "mb" },
  { poles: 1, section: 95.0, knr_ref: "KNR 5-04 0102-04", label: "Przewód LgYżo 95mm²",  labor_norm_rbh: 0.040, unit: "mb" },
];

// ─── Pipe diameter → KNR table (Phase 3) ──────────────────────────────────────

interface PipeKnrEntry {
  diameter: number;
  knr_ref: string;
  label: string;
  labor_norm_rbh: number;
}

const PIPE_KNR_TABLE: PipeKnrEntry[] = [
  { diameter: 16, knr_ref: "KNR 5-04 0801-01", label: "Rura instalacyjna M16", labor_norm_rbh: 0.012 },
  { diameter: 20, knr_ref: "KNR 5-04 0801-01", label: "Rura instalacyjna M20", labor_norm_rbh: 0.015 },
  { diameter: 25, knr_ref: "KNR 5-04 0801-02", label: "Rura instalacyjna M25", labor_norm_rbh: 0.020 },
  { diameter: 32, knr_ref: "KNR 5-04 0801-03", label: "Rura instalacyjna M32", labor_norm_rbh: 0.025 },
  { diameter: 40, knr_ref: "KNR 5-04 0801-03", label: "Rura instalacyjna M40", labor_norm_rbh: 0.030 },
  { diameter: 50, knr_ref: "KNR 5-04 0801-03", label: "Rura instalacyjna M50", labor_norm_rbh: 0.035 },
  { diameter: 63, knr_ref: "KNR 5-04 0801-03", label: "Rura instalacyjna M63", labor_norm_rbh: 0.040 },
];

// ─── Semantic Synonym Groups ──────────────────────────────────────────────────

/**
 * Construction/electrical vocabulary synonyms for Phase 2e augmentation.
 * When any trigger token (≥4 chars, already ASCII-normalized) is found in the
 * normalized input, the canonical KNR term is appended to the fuzzy query.
 *
 * Iron Rule: augmentation is ADDITIVE — original tokens are never removed.
 */
interface SynonymGroup {
  readonly canonical: string;        // plain Polish KNR term (normalized before use)
  readonly triggers: ReadonlyArray<string>; // lowercase ASCII partial stems
}

const SEMANTIC_SYNONYM_GROUPS: ReadonlyArray<SynonymGroup> = [
  // ── Bruzdy — wall chasing / cutting ──────────────────────────────────────
  { canonical: "bruzda",
    triggers: ["wykuc", "bruzdow", "sztrobow", "rowek", "rowki", "naciec", "frezow", "wykuwa", "kucie rowk"] },

  // ── Kablowanie — cable laying verbs ──────────────────────────────────────
  { canonical: "ukladanie kabla",
    triggers: ["wciagan", "kablowani", "prowadze kabel", "ciagni kabel", "ulozen kabla"] },

  // ── Rury — conduit / peszel ───────────────────────────────────────────────
  { canonical: "rura karbowana",
    triggers: ["peszel", "peszl", "karbowk", "elastyczna rura", "rura oslon", "rura gofr"] },

  // ── Korytka — cable tray ──────────────────────────────────────────────────
  { canonical: "koryto kablowe",
    triggers: ["korytko", "koryto kablo", "kanal kablo", "listwa kablo"] },

  // ── Gniazda — socket outlet slang ────────────────────────────────────────
  { canonical: "gniazdo",
    triggers: ["kontakt", "kontaktu", "gniazdko", "punkt gniazd", "gniazdo silow"] },

  // ── Rozdzielnica — panel board slang ─────────────────────────────────────
  { canonical: "rozdzielnica",
    triggers: ["tablica rozdziel", "skrzynka elektr", "rozdzielnia"] },

  // ── Demontaż — removal / demolition ──────────────────────────────────────
  { canonical: "demontaz",
    triggers: ["wyrwani", "rozbior", "rozebr", "likwidacj", "usunieci", "zdemon", "rozmont"] },

  // ── Oprawa oświetleniowa — light fixture slang ────────────────────────────
  { canonical: "oprawa oswietleniowa",
    triggers: ["lampa sufitow", "lampa nastaw", "downlight", "highbay", "lowbay", "punkt swietln", "plafoniera", "spot led"] },

  // ── Wyłącznik — switch / dimmer slang ────────────────────────────────────
  { canonical: "wylacznik",
    triggers: ["sciemniacz", "dimmer", "schalter", "klawisz swietln", "przycisk swietln"] },

  // ── Falownik — VFD / frequency inverter ──────────────────────────────────
  { canonical: "falownik",
    triggers: ["inverter", "czestotliw", "vfd", "softstart", "soft-start"] },

  // ── Klimatyzacja — AC / heat pump slang ──────────────────────────────────
  { canonical: "klimatyzacja",
    triggers: ["klima split", "split system", "aircondition", "jednostka zewn", "jednostka wewn"] },

  // ── Ładowarka EV — EV charging station ───────────────────────────────────
  { canonical: "ladowarka ev",
    triggers: ["wallbox", "stacja ladow", "evse", "punkt ladow", "ev charger", "ladowanie pojazdow"] },

  // ── Uziom — grounding electrode ──────────────────────────────────────────
  { canonical: "uziom",
    triggers: ["bednark", "szpila uziem", "uziemnik", "pret uziem", "uziemieni"] },

  // ── Drabinka kablowa — cable ladder ──────────────────────────────────────
  { canonical: "drabinka kablowa",
    triggers: ["drabinka kablo", "drag kablow", "drabinka stalowa"] },

  // ── Przepust ognioodporny — fire-rated penetration seal ──────────────────
  { canonical: "przepust pozarowy",
    triggers: ["uszczelnienie ogn", "obroza ppoz", "przepust ognioodp", "uszczelnienie przejsc", "roxtec"] },

  // ── Oprawa awaryjna — emergency / exit lighting ───────────────────────────
  { canonical: "oprawa awaryjna",
    triggers: ["swiatlo awaryjn", "lampa awaryjn", "ewakuacyjn", "antipanik", "exit led"] },

  // ── WLZ — main supply cable run ───────────────────────────────────────────
  { canonical: "wlz kabel",
    triggers: ["zasilanie glown", "linia zasilaj", "kabel glown", "przylacze kablo"] },

  // ── Zasilacz UPS / SZR — emergency power ─────────────────────────────────
  { canonical: "zasilacz ups",
    triggers: ["zasilanie awaryjn", "szr", "automatyczny przela", "agregat pradotw"] },
] as const;

/**
 * Phase 2e — Semantic synonym expansion.
 * Returns an augmented query string with canonical KNR terms appended
 * for any detected slang triggers, or null if nothing was detected.
 */
function expandWithSynonyms(normalized: string): string | null {
  const additions: string[] = [];
  for (const { canonical, triggers } of SEMANTIC_SYNONYM_GROUPS) {
    const canonicalNorm = normalizeText(canonical);
    if (normalized.includes(canonicalNorm.split(" ")[0])) continue; // already present
    // B3 fix: .trim() guards against any accidental trailing/leading whitespace in triggers
    if (triggers.some((t) => normalized.includes(t.trim()))) {
      additions.push(canonicalNorm);
    }
  }
  return additions.length > 0 ? `${normalized} ${additions.join(" ")}` : null;
}

// ─── DB row shape (Supabase response) ─────────────────────────────────────────

interface DictRow {
  id: string;
  keyword: string;
  keyword_normalized: string;
  knr_ref: string;
  label: string | null;
  type: DictionaryEntryType;
  is_composite: boolean;
  composite_refs: CompositeRef[] | null;
  labor_norm_rbh: number | null;
  unit: string | null;
  category: string | null;
  confidence_weight: number | null;
  user_id: string | null;
  keyword_encodes_surface: boolean;
}

interface FuzzyRow extends DictRow {
  sim: number;
}

// ─── Helper: build MatchResult from a DictRow ──────────────────────────────────

function rowToResult(
  row: DictRow,
  input: string,
  normalized: string,
  phase: 1 | 2,
  method: MatchMethod,
  similarity?: number,
): MatchResult {
  const weight = row.confidence_weight ?? 1.0;
  let confidence: number;
  let level: ConfidenceLevel;

  if (phase === 1) {
    confidence = 1.0;
    level = "L1";
  } else {
    // Phase 2: scale by weight and similarity
    const rawSim = similarity ?? 0.65;
    confidence = Math.min(0.89, rawSim * weight);
    level = confidence >= 0.60 ? "L2" : "L3";
  }

  return {
    knr_ref: row.knr_ref,
    label: row.label ?? row.keyword,
    type: row.type,
    is_composite: row.is_composite,
    composite_refs: Array.isArray(row.composite_refs) ? row.composite_refs : [],
    labor_norm_rbh: row.labor_norm_rbh,
    unit: row.unit ?? "szt",
    confidence,
    confidence_level: level,
    match_phase: phase,
    match_method: method,
    matched_keyword: row.keyword,
    similarity,
    original_input: input,
    normalized_input: normalized,
    keyword_encodes_surface: row.keyword_encodes_surface ?? false,
  };
}

// ─── GLOBAL_ACTION_PRIORITY: Cable-laying keyword blocker ──────────────────────
// If an action-verb input (podlaczenie/uruchomienie) gets a cable-LAYING fuzzy result,
// reject it immediately and retry with "montaz osprzetu" to find connection norms.
// KNR 5-08 "Ukladanie przewodow" is NEVER correct for connection/commissioning items.
const CABLE_LAYING_RE = /ukladani|prowadzeni[\s-]*przewod|kabel.*lini|lini.*kablowej|montaz.*kabla/i;

// ─── Phase 0: Action-verb priority lock ──────────────────────────────────────
// When item starts with a construction ACTION verb, force-search es_dictionary
// for action-specific keywords BEFORE cable regex or fuzzy match.
// Iron Rule: ACTION verb always wins over OBJECT noun.
// Examples:
//   "Podlaczenie kuchenki indukcyjnej" → podlacz norm, NOT cable norm
//   "Wymiana gniazda" → wymiana/montaż norm with ×1.5 factor
//   "Bruzdowanie pod kabel" → bruzda norm (0.25), NOT cable norm (0.02)

const ACTION_LOCK: ReadonlyArray<{ re: RegExp; stem: string }> = [
  { re: /^bruzd/,        stem: "bruzd" },
  { re: /^wykuci/,       stem: "bruzd" },
  { re: /^kucie/,        stem: "kuci"  },
  { re: /^wierci/,       stem: "wierci" },
  { re: /^przejsci/,     stem: "przejsci" },
  { re: /^podlacz/,      stem: "podlacz" },   // Podłączenie (connection)
  { re: /^pod[lł][aą]cz/, stem: "podlacz" },  // alternate normalisation
  { re: /^uruchom/,      stem: "uruchom" },   // Uruchomienie (commissioning)
  { re: /^wymian/,       stem: "wymian" },    // Wymiana (replacement = montaż + demontaż)
  { re: /^wymien/,       stem: "wymian" },    // Wymienię/Wymieniam
  { re: /^demonta[zżź]/,  stem: "demontaz" }, // Demontaż (removal only)
  { re: /^monta[zżź]/,    stem: "montaz"   }, // Montaż (assembly) — block KNR-5-08
];

async function phase0ActionLock(
  normalized: string,
  input: string,
  supabase: SupabaseClient,
): Promise<MatchResult | null> {
  const lock = ACTION_LOCK.find(({ re }) => re.test(normalized));
  if (!lock) return null;

  const { data, error } = await supabase
    .from("es_dictionary")
    .select("id, keyword, keyword_normalized, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight, user_id, keyword_encodes_surface")
    .ilike("keyword_normalized", `%${lock.stem}%`)
    .eq("type", "robocizna")
    .not("labor_norm_rbh", "is", null)
    .order("confidence_weight", { ascending: false })
    .limit(12);

  if (error || !data || data.length === 0) return null;

  const inputTokens = new Set(normalized.split(/\s+/).filter(t => t.length >= 3));

  // Surface-aware tiers: item surface → preferred keyword tokens
  // Prefer keywords whose surface MATCHES the item; penalise softer-surface keywords.
  // Phase0 SURFACE_TIERS: detect item surface context and enforce matching priority.
  // CRITICAL: never let a soft-material keyword (gk, beton) match a hard-material item (zelbet, ytong).
  // tier ordering: ytong(4) > zelbet(3) > silka(2.5) > gk/beton(2) > cegla(1) > neutral(0)
  // STEMS: use partial prefixes to cover Polish declension in normalised (diacritic-stripped) text.
  // "zelbecie" → contains "zelbe" ✓  |  "zbrojonym" → contains "zbrojon" ✓
  // "silce"    → listed explicitly  ✓  |  "silka/silki" → contains "silk" ✓
  const SURFACE_TIERS: ReadonlyArray<{ stems: string[]; tokens: string[]; tier: number }> = [
    { stems: ["ytong", "gazobeton", "siporex"],      tokens: ["ytong", "gazobeton", "siporex"],  tier: 4 },
    { stems: ["zelbe", "zbrojon", "monolit"],         tokens: ["zbrojony", "zelbet", "monolit"],  tier: 3 },
    { stems: ["silk", "silce"],                       tokens: ["silka"],                          tier: 2.5 },
    { stems: ["gipsokart", " gk ", " gk"],            tokens: ["gk", "gipsokarton"],              tier: 2 },
    { stems: ["betonie", "betonow", "betonow"],       tokens: ["betonie", "beton"],                tier: 2 },
    { stems: ["cegla", "cegiel"],                     tokens: ["cegla", "cegle"],                  tier: 1 },
  ];
  let itemTier = -1;
  let preferredSurfaceTokens: string[] = [];
  for (const { stems, tokens, tier } of SURFACE_TIERS) {
    if (stems.some(s => normalized.includes(s))) { itemTier = tier; preferredSurfaceTokens = tokens; break; }
  }

  let best: DictRow | null = null;
  let bestScore = 0;

  for (const row of data as DictRow[]) {
    const kwNorm = row.keyword_normalized ?? "";
    const kwTokens = kwNorm.split(/\s+/).filter(t => t.length >= 3);
    const overlap = kwTokens.filter(t => inputTokens.has(t)).length;
    let score = (overlap / Math.max(kwTokens.length, 1)) + (kwTokens.length > 1 ? 0.1 : 0);
    // Surface-aware scoring
    if (itemTier >= 0) {
      const kwMatchesSurface = preferredSurfaceTokens.some(t => kwNorm.includes(t));
      // Nuclear penalty: keyword encodes a SOFTER material than the item describes.
      // Example: item="zelbet" (tier 3), keyword="bruzdowanie w gk" (tier 1) → blocked.
      const kwHasSofterSurface = !kwMatchesSurface && SURFACE_TIERS.some(
        ({ tokens, tier }) => tier < itemTier && tokens.some(t => kwNorm.includes(t))
      );
      if (kwMatchesSurface)    score += 0.60; // strong bonus: surface match
      if (kwHasSofterSurface)  score -= 5.00; // NUCLEAR: softer keyword CANNOT win
    }
    if (score > bestScore) { bestScore = score; best = row as DictRow; }
  }

  // Only return if we found meaningful token overlap (avoids returning irrelevant fallback)
  if (!best || bestScore < 0.05) return null;
  const confidence = Math.min(0.85, 0.50 + bestScore);
  return rowToResult(best, input, normalized, 2, "fuzzy_trgm", confidence);
}

// ─── Phase 1: Exact match ──────────────────────────────────────────────────────

async function phase1Exact(
  normalized: string,
  supabase: SupabaseClient,
  input: string,
): Promise<MatchResult | null> {
  // Fetch up to 2 rows: might be one global (user_id IS NULL) + one user-specific
  // We prefer user entry over global seed — avoid .single() which crashes on multiple rows
  const { data, error } = await supabase
    .from("es_dictionary")
    .select("id, keyword, keyword_normalized, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight, user_id, keyword_encodes_surface")
    .eq("keyword_normalized", normalized)
    .limit(2);

  if (error || !data || data.length === 0) return null;

  // User-specific entry takes priority over global seed
  const row =
    (data as DictRow[]).find((r) => r.user_id != null) ??
    (data as DictRow[])[0];

  return rowToResult(row, input, normalized, 1, "exact");
}

// ─── Phase 2a: Fuzzy match via pg_trgm (RPC) ──────────────────────────────────

async function phase2Fuzzy(
  normalized: string,
  supabase: SupabaseClient,
  input: string,
  threshold = 0.45,
): Promise<MatchResult | null> {
  const { data, error } = await supabase.rpc("es_dictionary_fuzzy_match", {
    p_input: normalized,
    p_threshold: threshold,
    p_limit: 3,
  });

  if (error || !data || (data as FuzzyRow[]).length === 0) return null;

  const best = (data as FuzzyRow[])[0];
  // keyword_encodes_surface may not be returned by legacy RPC — default false for safety
  const bestWithSurface = best as FuzzyRow & { keyword_encodes_surface?: boolean };
  if (bestWithSurface.keyword_encodes_surface === undefined) bestWithSurface.keyword_encodes_surface = false;
  return rowToResult(bestWithSurface as FuzzyRow, input, normalized, 2, "fuzzy_trgm", best.sim);
}

// ─── Phase 2b: Token-containment match (word_similarity) ──────────────────────

async function phase2TokenMatch(
  normalized: string,
  supabase: SupabaseClient,
  input: string,
  threshold = 0.40,
): Promise<MatchResult | null> {
  const { data, error } = await supabase.rpc("es_dictionary_token_match", {
    p_input: normalized,
    p_threshold: threshold,
    p_limit: 3,
  });

  if (error || !data || (data as FuzzyRow[]).length === 0) return null;

  const best = (data as FuzzyRow[])[0];
  const row: DictRow = {
    id: best.id,
    keyword: "",
    keyword_normalized: normalized,
    knr_ref: best.knr_ref,
    label: best.label,
    type: best.type,
    is_composite: best.is_composite,
    composite_refs: best.composite_refs as CompositeRef[] | null,
    labor_norm_rbh: best.labor_norm_rbh,
    unit: best.unit,
    category: best.category,
    confidence_weight: best.confidence_weight,
    user_id: null,
    keyword_encodes_surface: ((best as unknown) as { keyword_encodes_surface?: boolean }).keyword_encodes_surface === true,
  };

  return rowToResult(row, input, normalized, 2, "fuzzy_token", best.sim);
}

// ─── Phase 2c: NER Weighted Token Match ──────────────────────────────────────

/**
 * NER-enhanced token search.
 *
 * Example: "Linie WLZ YKYzo 5x10 zasilanie tablicy segment A DBx/1"
 *  1. stripProjectNoise → "WLZ YKYzo 5x10 tablicy"
 *  2. extractTechnicalTokens → [{wlz,0.9},{ykyzo,0.9},{5x10,0.9},{tablicy,0.2}]
 *  3. buildWeightedQuery → "wlz wlz wlz ykyzo ykyzo ykyzo 5x10 5x10 5x10 tablicy"
 *  4. fuzzy_trgm on weighted string → high similarity to "kabel ykyzo 5x10"
 *
 * Only runs when at least 1 high-weight technical token was extracted.
 */
async function phase2NerWeighted(
  input: string,
  supabase: SupabaseClient,
  threshold: number,
): Promise<MatchResult | null> {
  const tokens = extractTechnicalTokens(input);
  const highWeightTokens = tokens.filter((t: WeightedToken) => t.weight >= 0.8);

  if (highWeightTokens.length === 0) return null;

  const weightedQuery = buildWeightedQuery(tokens);
  if (!weightedQuery) return null;

  const { data, error } = await supabase.rpc("es_dictionary_fuzzy_match", {
    p_input: weightedQuery,
    p_threshold: threshold,
    p_limit: 3,
  });

  if (error || !data || (data as FuzzyRow[]).length === 0) return null;

  const best = (data as FuzzyRow[])[0];
  const result = rowToResult(best, input, weightedQuery, 2, "ner_weighted", best.sim);
  result.confidence = Math.min(0.89, result.confidence * 1.15);
  return result;
}

// ─── Phase 3: Regex extractors ────────────────────────────────────────────────

/**
 * Tries to match cable cross-section spec (e.g. "3x1.5", "5×2.5")
 * and maps it to the appropriate KNR variant.
 */
function phase3Cable(input: string, normalized: string, settings?: EngineSettings): MatchResult | null {
  const spec = extractCableSpec(input);
  if (!spec) return null;

  let entry = CABLE_KNR_TABLE.find(
    (e) => e.poles === spec.poles && e.section === spec.section,
  );
  if (!entry) {
    entry = CABLE_KNR_TABLE.find((e) => e.section === spec.section);
  }
  if (!entry) return null;

  let label = entry.label;
  if (settings && settings.defaultMontage !== "pod_tynkiem" && settings.defaultMontage !== "bez_wyboru") {
    const normalizedInput = input.toLowerCase();
    const hasMontageKw = MONTAGE_KEYWORDS.some((kw) => normalizedInput.includes(kw));
    if (!hasMontageKw) {
      const montageLabel = MONTAGE_LABELS[settings.defaultMontage];
      if (montageLabel) label = `${entry.label} [${montageLabel}]`;
    }
  }

  return {
    knr_ref: entry.knr_ref,
    label,
    type: "robocizna",
    is_composite: false,
    composite_refs: [],
    labor_norm_rbh: entry.labor_norm_rbh,
    unit: entry.unit,
    confidence: 0.92,
    confidence_level: "L1",
    match_phase: 3,
    match_method: "regex_cable",
    original_input: input,
    normalized_input: normalized,
    cable_spec: spec,
  };
}

/**
 * Tries to match pipe/conduit diameter spec (e.g. "M20", "Ø25")
 * and maps it to the appropriate KNR variant.
 */
function phase3Pipe(input: string, normalized: string): MatchResult | null {
  const spec = extractPipeSpec(input);
  if (!spec) return null;

  const entry = PIPE_KNR_TABLE.find((e) => e.diameter === spec.diameter);
  if (!entry) return null;

  const pipeKeywords = ["peszel", "rura", "m20", "m25", "m32", "m16", "m40", "m50", "oring", "arot", "pvcu"];
  const normalizedPreserved = normalizePreservingSpecs(input);
  const hasPipeKw = pipeKeywords.some((kw) => normalizedPreserved.includes(kw));
  if (!hasPipeKw) return null;

  return {
    knr_ref: entry.knr_ref,
    label: entry.label,
    type: "robocizna",
    is_composite: false,
    composite_refs: [],
    labor_norm_rbh: entry.labor_norm_rbh,
    unit: "mb",
    confidence: 0.75,
    confidence_level: "L2",
    match_phase: 3,
    match_method: "regex_pipe",
    original_input: input,
    normalized_input: normalized,
  };
}

// ─── Phase 4b: Reverse norm lookup ───────────────────────────────────────────

/**
 * "Donor lookup" — last resort before pure L3 fallback.
 * Extracts the 2 most distinctive tokens (≥5 chars) from the normalized
 * input and queries es_dictionary via ILIKE to borrow a labor_norm_rbh
 * from the closest matching robocizna entry.
 *
 * Eliminates labor_norm_rbh: null for most standard electrical tasks
 * without requiring LLM intervention. Returned as L3 / reverse_norm_lookup.
 */
async function phase4bReverseLookup(
  input: string,
  normalized: string,
  supabase: SupabaseClient,
): Promise<MatchResult | null> {
  const tokens = normalized
    .split(/\s+/)
    .filter((t) => t.length >= 5)
    .slice(0, 3);
  if (tokens.length === 0) return null;

  for (const token of tokens) {
    const { data, error } = await supabase
      .from("es_dictionary")
      .select("knr_ref, label, labor_norm_rbh, unit")
      .ilike("keyword_normalized", `%${token}%`)
      .eq("type", "robocizna")
      .not("labor_norm_rbh", "is", null)
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.labor_norm_rbh) continue;

    return {
      knr_ref: data.knr_ref,
      label: data.label ?? data.knr_ref,
      type: "robocizna",
      is_composite: false,
      composite_refs: [],
      labor_norm_rbh: data.labor_norm_rbh,
      unit: data.unit ?? "szt",
      confidence: 0.22,
      confidence_level: "L3",
      match_phase: 4,
      match_method: "reverse_norm_lookup",
      original_input: input,
      normalized_input: normalized,
    };
  }
  return null;
}

// ─── Phase 4: Fallback (L3 — mark for manual review) ──────────────────────────

function phase4Fallback(input: string, normalized: string): MatchResult {
  return {
    knr_ref: null,
    label: null,
    type: "robocizna",
    is_composite: false,
    composite_refs: [],
    labor_norm_rbh: null,
    unit: "szt",
    confidence: 0.0,
    confidence_level: "L3",
    match_phase: 4,
    match_method: "no_match",
    original_input: input,
    normalized_input: normalized,
  };
}

// ─── Main matching function ────────────────────────────────────────────────────

/**
 * Runs the 4-phase ES-Engine matching pipeline for a single input string.
 *
 * @param input    - Raw installer text (e.g. "różnicówka 40A/30mA 2P")
 * @param supabase - Authenticated Supabase client (server-side)
 * @returns        MatchResult with confidence level L1 / L2 / L3
 */
export async function matchItem(
  input: string,
  supabase: SupabaseClient,
  settings: EngineSettings = DEFAULT_ENGINE_SETTINGS,
): Promise<MatchResult> {
  if (!input || !input.trim()) return phase4Fallback(input, "");

  // Strip project noise BEFORE normalization so trigram scores aren't diluted
  const denoised = stripProjectNoise(input);
  const normalized = normalizeText(denoised || input);
  if (!normalized) return phase4Fallback(input, "");

  const t = SENSITIVITY_THRESHOLDS[settings.sensitivity];

  // ── Phase 1: Exact match ─────────────────────────────────────────────
  try {
    const p1 = await phase1Exact(normalized, supabase, input);
    if (p1) return p1;
    // Also try exact match on original (un-denoised) normalized form
    if (denoised !== input) {
      const p1raw = await phase1Exact(normalizeText(input), supabase, input);
      if (p1raw) return p1raw;
    }
  } catch {
    // Supabase unavailable — skip to in-memory phases
  }

  // ── Phase 0: Action-verb priority lock (bruzd / wierci / wykuci) ────────────
  // Must run BEFORE cable regex so "Bruzdowanie pod kabel" → bruzda norm, not cable.
  try {
    const p0 = await phase0ActionLock(normalized, input, supabase);
    if (p0 && p0.confidence >= 0.55) return p0;
  } catch { /* non-critical — fall through */ }

  // ── Phase 3a: Regex — cable cross-section FIRST (highest precision for cables) ─
  // Run before fuzzy to avoid YDYżo/YDYp being wrongly matched as L2 via pg_trgm.
  // extractCableSpec detects "3×2,5", "5x10" etc. — if found, trust regex over fuzzy.
  // EXCEPTION: action verbs (podlaczenie, uruchomienie) MUST NOT match as cable.
  // A cable spec in the name is the DEVICE spec (power rating), not the item unit.
  // Hierarchy of Truth v9.0: also block KNR 5-08 for HEAVY appliance nouns even without
  // an explicit action verb (e.g. "Pompa ciepła 15kW" — cable is power spec, not work type).
  const ACTION_NO_CABLE_RE = /^(podl[a\u0105]cz|uruchom|wymian|wymien|monta[z\u017c\u017a])/;
  const HEAVY_NOUN_RE = /pomp|indukcj|kuchen|silni|kocio|klimatyz|agregat/i;
  const isActionVerb = ACTION_NO_CABLE_RE.test(normalized) || HEAVY_NOUN_RE.test(normalized);
  if (!isActionVerb) {
    const p3cable = phase3Cable(input, normalized, settings);
    if (p3cable) return p3cable;
  }

  // ── Phase 2a: Fuzzy trigram match (threshold driven by sensitivity) ─────────
  try {
    const p2 = await phase2Fuzzy(normalized, supabase, input, t.queryThreshold);
    if (p2 && p2.confidence >= t.returnHigh) return p2;

    // Phase 2b: token-containment (word_similarity)
    const p2b = await phase2TokenMatch(normalized, supabase, input, t.queryThreshold * 0.85);
    if (p2b && p2b.confidence >= t.returnHigh) return p2b;

    // Phase 2c: NER weighted — technical tokens with boosted trigram weight
    // Handles: "Linie WLZ YKYzo 5x10 zasilanie tablicy" → matches "kabel ykyzo 5x10"
    const p2c = await phase2NerWeighted(input, supabase, t.queryThreshold * 0.80);
    if (p2c && p2c.confidence >= t.returnHigh) return p2c;

    // ── GLOBAL_ACTION_PRIORITY: block cable-laying results for action verbs ──
    // If action verb (podlacz/uruchom) matched a cable-laying keyword → reject.
    // Retry with "montaz osprzetu" to find connection/device assembly norms.
    // Fallback: phase4Fallback → pricing.ts absolute PLN floor (140+ PLN) applies.
    if (isActionVerb) {
      const best2 = (p2c ?? p2b ?? p2);
      if (best2 && CABLE_LAYING_RE.test(best2.matched_keyword ?? "")) {
        try {
          const montazQuery = `montaz osprzetu podlaczenie ${normalized}`.trim();
          const p2x = await phase2Fuzzy(montazQuery, supabase, input, t.queryThreshold * 0.65);
          if (p2x && p2x.confidence >= t.returnLow && !CABLE_LAYING_RE.test(p2x.matched_keyword ?? "")) {
            return p2x;
          }
        } catch { /* fall through */ }
        // No valid non-cable result found — return fallback so pricing floor takes over
        return phase4Fallback(input, "action-verb: cable-norm rejected");
      }
    }

    // Return best of 2a/2b/2c above low threshold
    if (p2 && p2.confidence >= t.returnLow) return p2;
    if (p2b && p2b.confidence >= t.returnLow) return p2b;
    if (p2c && p2c.confidence >= t.returnLow) return p2c;

    // ── Phase 2d: investmentContext-augmented retry ───────────────────────────
    // When the user has described the investment (e.g. "KNX villa, fotowoltaika"),
    // prepend domain keywords to the query to boost fuzzy matching for rare items.
    if (settings.investmentContext?.trim()) {
      const ctxTokens = normalizeText(settings.investmentContext)
        .split(/\s+/)
        .filter((t) => t.length >= 3)
        .slice(0, 4)
        .join(" ");
      if (ctxTokens) {
        const augmented = `${ctxTokens} ${normalized}`.trim();
        const p2d = await phase2NerWeighted(augmented, supabase, t.queryThreshold * 0.80);
        if (p2d && p2d.confidence >= t.returnLow) return p2d;
      }
    }

    // ── Phase 2e: Semantic synonym expansion ─────────────────────────────────
    // Detects construction slang (wykucie→bruzda, peszel→rura karbowana, etc.)
    // and appends canonical KNR terms to boost fuzzy recall.
    const synonymExpanded = expandWithSynonyms(normalized);
    if (synonymExpanded) {
      const p2e = await phase2Fuzzy(synonymExpanded, supabase, input, t.queryThreshold * 0.75);
      if (p2e && p2e.confidence >= t.returnLow) {
        p2e.match_method = "synonym_expand";
        return p2e;
      }
    }
  } catch {
    // pg_trgm not available — fall through to regex
  }

  // ── Phase 3b: Regex — pipe diameter ───────────────────────────────────
  const p3pipe = phase3Pipe(input, normalized);
  if (p3pipe) return p3pipe;

  // ── Phase 4b: Reverse norm lookup — borrow rbh from closest es_dictionary ──
  // Eliminates labor_norm_rbh: null for most standard tasks without AI cost.
  try {
    const p4b = await phase4bReverseLookup(input, normalized, supabase);
    if (p4b) return p4b;
  } catch {
    // non-critical — fall through to pure L3
  }

  // ── Phase 4: No match found — mark as L3 (manual review) ──────────────────
  return phase4Fallback(input, normalized);
}

// ─── Batch matching ───────────────────────────────────────────────────────────

export interface BatchMatchInput {
  id: string;
  text: string;
}

export interface BatchMatchOutput {
  id: string;
  result: MatchResult;
}

/**
 * Batch-matches multiple items concurrently.
 * Limits parallelism to avoid overwhelming Supabase connection pool.
 */
export async function matchBatch(
  inputs: BatchMatchInput[],
  supabase: SupabaseClient,
  concurrency = 20,
  settings?: EngineSettings,
): Promise<BatchMatchOutput[]> {
  const effectiveSettings = settings ?? DEFAULT_ENGINE_SETTINGS;
  const results: BatchMatchOutput[] = [];

  for (let i = 0; i < inputs.length; i += concurrency) {
    const chunk = inputs.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async ({ id, text }) => ({
        id,
        result: await matchItem(text, supabase, effectiveSettings),
      })),
    );
    results.push(...chunkResults);
  }

  return results;
}

// ─── Convenience: resolve imported rows ───────────────────────────────────────

export interface ImportedRow {
  name: string;
  unit?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface ResolvedRow extends ImportedRow {
  /** Matching result — null means Phase 4 fallback */
  _match: MatchResult;
  /** Suggested KNR code (null if L3) */
  knr_code: string | null;
  /** Suggested labor norm rbh/unit */
  labor_norm_rbh: number | null;
  /** Whether this item needs manual review */
  needs_review: boolean;
}

/**
 * Enriches an array of imported rows with KNR matching results.
 * Called from server actions BEFORE sending to LLM, to reduce AI token usage.
 *
 * Items resolved with L1/L2 confidence do NOT need LLM processing.
 * Items with L3 confidence should be sent to AI for best-effort suggestion.
 */
export async function resolveImportedRows(
  rows: ImportedRow[],
  supabase: SupabaseClient,
  settings?: EngineSettings,
): Promise<ResolvedRow[]> {
  const inputs: BatchMatchInput[] = rows.map((row, idx) => ({
    id: String(idx),
    text: row.name ?? "",
  }));

  const matched = await matchBatch(inputs, supabase, 20, settings);

  return rows.map((row, idx) => {
    const m = matched[idx]?.result ?? phase4Fallback(row.name ?? "", "");
    return {
      ...row,
      _match: m,
      knr_code: m.knr_ref,
      labor_norm_rbh: m.labor_norm_rbh,
      needs_review: m.confidence_level === "L3",
    };
  });
}

// ─── Confidence level helpers ─────────────────────────────────────────────────

/**
 * Returns a Polish user-facing description of the confidence level.
 */
export function confidenceLevelLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "L1": return "Dokładne dopasowanie";
    case "L2": return "Dopasowanie przybliżone";
    case "L3": return "Wymaga weryfikacji";
  }
}

/**
 * Returns badge color class for the confidence level (Tailwind).
 */
export function confidenceLevelColor(level: ConfidenceLevel): string {
  switch (level) {
    case "L1": return "bg-green-100 text-green-800";
    case "L2": return "bg-yellow-100 text-yellow-800";
    case "L3": return "bg-red-100 text-red-800";
  }
}
