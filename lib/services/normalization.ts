/**
 * normalization.ts
 *
 * ES-Engine: Text Normalization Pipeline
 * Cleans and standardizes Polish installer text before matching.
 *
 * Pipeline:
 *  1. Lowercase
 *  2. Remove Polish diacritics (ą→a, ę→e, ł→l, etc.)
 *  3. Strip measurement units and noise words
 *  4. Normalize whitespace and punctuation
 */

// ─── Project noise (stop-words) ─────────────────────────────────────────────────

/**
 * Words that appear in project descriptions but carry zero semantic value
 * for KNR matching. Stripped BEFORE normalization to avoid diluting trigram scores.
 *
 * Examples from real Polish estimates:
 *   "DBx/1", "w ramach istniejącej", "pomieszczenie kuchnia", "segment A"
 */
export const PROJECT_NOISE_WORDS = new Set([
  // Lokalizatory projektowe
  "pomieszczenie", "pomieszczen", "pomieszczenia",
  "pokoj", "pokoju", "korytarz", "korytarza",
  "kuchnia", "kuchni", "lazienka", "lazienki",
  "salon", "salonu", "gabinet", "gabinetu",
  "piwnica", "piwnicy", "strych", "strychu",
  "garaz", "garazu", "kotlownia", "kotlowni",
  "toaleta", "toalety", "wc", "przedpokoj",
  "segment", "budynek", "kondygnacja", "pietro",
  "poziom", "strefa", "obszar", "sektor",
  "mieszkanie", "lokal", "biuro",
  // Kody pozycji projektowych
  "dbx", "db", "rbt", "rb", "zl", "poz", "lp",
  // Frazy projektowe
  "w", "ramach", "istniejacy", "istniejacych", "istniejaca",
  "nowych", "nowej", "nowego", "nowe", "nowy",
  "oraz", "wraz", "przy", "dla", "do", "ze", "na", "po",
  "instalacja", "instalacji",  // zbyt ogolne jako token
  "obwod", "linii", "linie",  // bez kontekstu
  "zasilanie", "zasilajacy", "zasilajaca",  // waga 0.1 — patrz extractTechnicalTokens
  "prowadzenie", "ukladanie", "montaz", "podlaczenie",
  "wykonanie", "demontaz", "wymiana",
  "kompletna", "kompletny", "komplet",
  "zgodnie", "wedlug", "wg", "patrz", "jak",
  // BOQ qualifier phrases — dilute trigram scores without adding KNR context
  "uzupelnienie", "uzupelniajacy", "uzupelniajaca", "uzupelniona", "uzupelnione",
  "brakujacych", "brakujacy", "brakujaca", "brakujace",
  "odcinkow", "odcinka", "odcinki", "odcinek",
  "dodatkowych", "dodatkowy", "dodatkowa", "dodatkowe",
  "pozostalych", "pozostaly", "pozostale",
  "lacznie", "razem", "ogol",
  "uzupelniajacych", "brakujacego",
  // KNR cable BOQ description words — appear in full KNR work descriptions
  // e.g. "Przewody kablekowe o łącznym przekroju żył do 7,5 mm2 - przewód YDYp"
  "lacznym", "lacznej", "laczna", "laczne", "lacznego", "lacznych",
  "zyl", "zyla", "zyly", "zylach", "zylek",
  "przekroju", "przekroj", "przekrojow", "przekrojach",
  "kablekowe", "kablekowy", "kablekowych", "kabelkowe", "kabelkowych",
  "jednozylowych", "jednozylowy", "wielozylowych", "wielozylowy",
]);

/**
 * Patterns for project reference codes to strip: DBx/1, RB-12/A, poz.3.1 etc.
 */
const PROJECT_CODE_RE = /\b(?:db|rb|rbt|poz|lp)[a-z0-9]*(?:\/[a-z0-9]+)?\b/gi;

/**
 * Strips project noise from raw input BEFORE normalization.
 * Returns cleaned string preserving technical specs (cable sections, types, codes).
 */
export function stripProjectNoise(input: string): string {
  // Remove project reference codes (DBx/1, RB-12/A)
  let text = input.replace(PROJECT_CODE_RE, " ");
  // Remove slash-separated codes like /1, /2, /A that remain
  text = text.replace(/\/\d+[a-z]?\b/gi, " ");
  // Split on spaces, filter noise words
  const tokens = text.split(/\s+/).filter((t) => {
    const tLower = t.toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (c) => ({ ą:"a",ć:"c",ę:"e",ł:"l",ń:"n",ó:"o",ś:"s",ź:"z",ż:"z" }[c] ?? c));
    return !PROJECT_NOISE_WORDS.has(tLower) && t.length > 1;
  });
  return tokens.join(" ");
}

// ─── Polish diacritics map ─────────────────────────────────────────────────────

const DIACRITICS_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  // Uppercase (handled after lowercasing, kept for safety)
  Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n", Ó: "o", Ś: "s", Ź: "z", Ż: "z",
};

// ─── Patterns ─────────────────────────────────────────────────────────────────

/**
 * Units and noise words to strip from item names.
 * Regex: word-boundary match (case-insensitive)
 */
const UNITS_RE =
  /\b(szt\.?|mb|m\.b\.?|100mb|kpl\.?|komplet|metr[ów]?|metrze|sztuk[ai]?|l\.p\.?|lp\.?|poz\.?|pozycj[ai]?|jedn\.?|rbh|rg|kw[hp]?|kva|mva|hz|mm2?|cm2?|kg|opak(?:owanie)?|op|par|set|zest\.?)\b/gi;

/**
 * KNR cable cross-section range notation: "do 7,5 mm2", "do 4mm2", "do 16 mm2"
 * Appears in full KNR work descriptions (robocizna items) — strip entirely.
 */
const SECTION_RANGE_RE = /\bdo\s+\d+[.,]?\d*\s*mm2?\b/gi;

/**
 * Cable tray dimension pattern: "100h50", "60h35", "200H100" (width × height)
 * Polish BOQ notation for cable tray/duct cross-sections.
 */
const TRAY_DIM_RE = /\b\d+[hH]\d+\b/g;

/**
 * Cable cross-section pattern: "3x1.5", "5×2.5", "3X6" (poles × section)
 */
const CABLE_XSECTION_RE = /(\d+)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;

/**
 * Pipe diameter pattern: "M20", "M25", "Ø20", "φ32"
 */
export const PIPE_DIAM_RE = /(?:m|ø|φ|o)\s*(\d{2,3})/i;

/**
 * Extra whitespace / special chars that add noise
 */
const NOISE_RE = /[,;!?"|'`@#$%^&*=+\\[\]{}()\/<>×]/g;

// ─── Cable cross-section extractor ────────────────────────────────────────────

export interface CableSpec {
  /** Number of conductors (poles): 2, 3, 4, 5 */
  poles: number;
  /** Cross-section in mm²: 1.5, 2.5, 4, 6, 10, 16, … */
  section: number;
  /** Raw matched string: "3x1.5" */
  raw: string;
}

/**
 * Extracts first cable cross-section spec from a raw input string.
 * Returns null if none found.
 */
export function extractCableSpec(input: string): CableSpec | null {
  const match = CABLE_XSECTION_RE.exec(input);
  if (!match) return null;

  const poles = parseInt(match[1], 10);
  const section = parseFloat(match[2].replace(",", "."));
  if (isNaN(poles) || isNaN(section)) return null;

  return { poles, section, raw: match[0] };
}

// ─── Pipe diameter extractor ──────────────────────────────────────────────────

export interface PipeSpec {
  /** Diameter in mm: 16, 20, 25, 32, 40, 50 */
  diameter: number;
  raw: string;
}

/**
 * Extracts pipe/conduit diameter from raw text (M20, Ø25, φ32, etc.).
 */
export function extractPipeSpec(input: string): PipeSpec | null {
  const match = PIPE_DIAM_RE.exec(input);
  if (!match) return null;

  const diameter = parseInt(match[1], 10);
  if (isNaN(diameter)) return null;

  return { diameter, raw: match[0] };
}

// ─── Core normalizer ──────────────────────────────────────────────────────────

/**
 * Normalizes a Polish installer text string for exact/fuzzy matching.
 *
 * Steps:
 * 1. Lowercase
 * 2. Remove Polish diacritics (ą→a, etc.)
 * 3. Strip units and noise words
 * 4. Remove noisy punctuation
 * 5. Collapse multiple spaces
 * 6. Trim
 *
 * This MUST produce the same result as the SQL trigger in es_dictionary:
 *   lower(unaccent(keyword))
 * The only difference: TypeScript also strips units (SQL does not, for searchability).
 */
export function normalizeText(input: string): string {
  if (!input) return "";

  let text = input.toLowerCase();

  // Step 2: Replace Polish diacritics char by char
  text = text
    .split("")
    .map((ch) => DIACRITICS_MAP[ch] ?? ch)
    .join("");

  // Step 3a: Strip KNR cross-section range notation ("do 7,5 mm2", "do 4mm2")
  text = text.replace(SECTION_RANGE_RE, " ");
  // Step 3: Strip measurement units and noise words
  text = text.replace(UNITS_RE, " ");
  // Step 3b: Strip cable tray dimension notation (100h50, 60h35, 200H100)
  text = text.replace(TRAY_DIM_RE, " ");
  // Step 3c: Strip lone multiplier prefixes left after tray-dim strip (e.g. "2x" from "2x100h50")
  text = text.replace(/\b\d+\s*[xX]\s*(?=\s|$)/g, " ");

  // Step 4: Remove noisy punctuation (keep dots in numbers like "1.5", "3x1.5")
  text = text.replace(NOISE_RE, " ");

  // Step 5: Collapse multiple whitespace into single space
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Normalizes but PRESERVES cable cross-section specs (e.g. "3x1.5").
 * Used for Phase 3 (Regex Extractors).
 */
export function normalizePreservingSpecs(input: string): string {
  if (!input) return "";

  let text = input.toLowerCase();

  // Replace Polish diacritics
  text = text
    .split("")
    .map((ch) => DIACRITICS_MAP[ch] ?? ch)
    .join("");

  // Strip units EXCEPT cross-section (digits×digits are preserved)
  text = text.replace(UNITS_RE, " ");
  text = text.replace(NOISE_RE, " ");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// ─── Token-level helpers ──────────────────────────────────────────────────────

/**
 * Splits normalized text into significant tokens (min 2 chars, not pure numbers).
 */
export function tokenize(normalized: string): string[] {
  return normalized
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t));
}

// ─── NER: Technical token extraction with weights ────────────────────────────

export interface WeightedToken {
  token: string;
  weight: number;
}

/**
 * HIGH-WEIGHT technical patterns (weight 0.9):
 * - Cable cross-sections:  5x10, 3x1.5, 4×2.5
 * - Cable type codes:      YKY, YDY, NHXH, LgYzo, NYM, YKYzo, YDYzo
 * - Pipe specs:            M20, M25, M32
 * - Numeric ratings:       63A, 100kVA, 30mA, 400V
 * - Standard codes:        WLZ, RCD, SPD, MCB, RCBO
 * - Network connectors:    RJ45, RJ-45, RJ11 (socket/network outlet)
 * - Brand/product:         WAGO (connector brand)
 * - Phase modifiers:       3-fazowy, 3faz, 1-fazowy, 1faz (boosts pomiar/sprawdzenie matches)
 */
const TECH_TOKEN_RE =
  /\b(?:\d+[xX×]\d+(?:[.,]\d+)?|[ynl](?:ky|dy|hxh|gym)[a-z0-9]{0,6}|nhxh\s*e?\d*|lgyz?o?|nym|asky|asxs?|m\d{2,3}|wlz|rcd|rcbo|mcb|spd|afdd|rj-?45|rj-?11|rj-?12|wago|3-?fazow[aey]?|3-?faz|jednofazow[aey]?|1-?faz|\d+(?:[.,]\d+)?(?:kva?|kw|a|ma|v|mm2?)\b)\b/gi;

/**
 * Extracts tokens with semantic weights for NER-style matching.
 * Technical specs get weight 0.9, descriptive words get weight 0.2.
 *
 * @example
 *   "Linie WLZ YKYzo 5x10 zasilanie tablicy"
 *   → [{token:"wlz",0.9}, {token:"ykyzo",0.9}, {token:"5x10",0.9},
 *      {token:"tablicy",0.2}]
 */
export function extractTechnicalTokens(input: string): WeightedToken[] {
  const denoised = stripProjectNoise(input);
  const normalized = denoised.toLowerCase()
    .split("").map((ch) => DIACRITICS_MAP[ch] ?? ch).join("");

  const result: WeightedToken[] = [];
  const seen = new Set<string>();

  // Extract high-weight technical tokens
  let m: RegExpExecArray | null;
  const techRe = new RegExp(TECH_TOKEN_RE.source, "gi");
  while ((m = techRe.exec(normalized)) !== null) {
    const tok = m[0].toLowerCase().replace(/\s+/g, "");
    if (!seen.has(tok)) { seen.add(tok); result.push({ token: tok, weight: 0.9 }); }
  }

  // Remaining tokens — low weight semantic context
  normalized.split(/\s+/).forEach((tok) => {
    const clean = tok.replace(/[^a-z0-9x]/g, "");
    if (clean.length < 2 || seen.has(clean) || PROJECT_NOISE_WORDS.has(clean)) return;
    if (/^\d+$/.test(clean)) return;
    seen.add(clean);
    result.push({ token: clean, weight: 0.2 });
  });

  return result;
}

/**
 * Builds a weighted search string from technical tokens.
 * High-weight tokens are repeated 3x to boost trigram similarity.
 */
export function buildWeightedQuery(tokens: WeightedToken[]): string {
  return tokens
    .map(({ token, weight }) => (weight >= 0.8 ? `${token} ${token} ${token}` : token))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes a simple character-level similarity score [0..1] between two strings.
 * Used in-memory for Phase 3 when pg_trgm is not available.
 */
export function inMemorySimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;

  let matches = 0;
  const usedIdx = new Set<number>();

  for (const ch of shorter) {
    const idx = longer.indexOf(ch);
    if (idx !== -1 && !usedIdx.has(idx)) {
      matches++;
      usedIdx.add(idx);
    }
  }

  return matches / longer.length;
}
