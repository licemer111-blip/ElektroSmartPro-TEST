/**
 * Builds a compact KNR labor norms context from local JSON files.
 * Designed for Gemini 1M context window — injects the full norms DB
 * so the AI calculates labor_price = labor_norm × hourlyRate instead of guessing.
 */

import instalacjaPodstawowa from "@/data/knr/fixed_norms/es_knr_instalacja_podstawowa.json";
import { getModernizationFactor, classifyIntent, isMetal } from "@/lib/services/semantic-classifier";
import gniazda from "@/data/knr/fixed_norms/es_knr_gniazda_wylaczniki_oprawy.json";
import trasyPvc from "@/data/knr/fixed_norms/es_knr_trasy_kablowe_pvc.json";
import pomiary from "@/data/knr/fixed_norms/es_knr_pomiary_odbiory_2026.json";
import zasilanie from "@/data/knr/fixed_norms/es_knr_zasilanie_wlz_szr.json";
import teletechnika from "@/data/knr/fixed_norms/es_knr_teletechnika_kompletna.json";
import odgromowka from "@/data/knr/fixed_norms/es_knr_odgromowka_uziemienie.json";
import trasyRozszerzone from "@/data/knr/fixed_norms/es_knr_trasy_rozszerzone_2026.json";
import rozdzielniceKompletne from "@/data/knr/fixed_norms/es_knr_rozdzielnice_kompletne.json";
// Cluster 9–12: Ultra-Max 2.0 — Industrial & Green Energy sources
import fotowoltaika from "@/data/knr/fixed_norms/es_knr_fotowoltaika_kompletna.json";
import halePrzemysl from "@/data/knr/fixed_norms/es_knr_instalacje_przemyslowe_hale.json";
import sspPpoz from "@/data/knr/fixed_norms/es_knr_ssp_ppoz_rozszerzone.json";
import biuraKomercja from "@/data/knr/fixed_norms/es_knr_sklepy_biura_hotele_2026.json";

interface KnrEntry {
  catalog_code: string;
  description: string;
  unit: string;
  labor_norm: number;
  /** Scaling factor for norm units.
   * 1.0 (default) = per 1 unit (already per-m / per-szt).
   * 0.01 = per 100 units (raw per-100m KNR series — divide to get per-m). */
  unit_factor?: number;
  knr_category?: string;
  is_industrial?: boolean;
  synonyms?: string[];
}

export interface KnrMatch {
  code: string;
  /** Labor norm already adjusted by unit_factor (per 1 unit) */
  laborNorm: number;
  unit: string;
}

const CORE_KNR_SOURCES: unknown[] = [
  instalacjaPodstawowa,
  gniazda,
  trasyPvc,
  pomiary,
  zasilanie,
  teletechnika,
  odgromowka,
  trasyRozszerzone,
  rozdzielniceKompletne, // v2.7: composite rozdzielnica norms (12/24/36/48/72/96 mod p/t + n/t)
  // Cluster 9–12 (Ultra-Max 2.0)
  fotowoltaika,
  halePrzemysl,
  sspPpoz,
  biuraKomercja,
];

function toEntries(source: unknown): KnrEntry[] {
  if (Array.isArray(source)) return source as KnrEntry[];
  return [];
}

let _allEntries: KnrEntry[] | null = null;
function getAllEntries(): KnrEntry[] {
  if (!_allEntries) _allEntries = CORE_KNR_SOURCES.flatMap(toEntries);
  return _allEntries;
}

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => ({ ą:"a",ć:"c",ę:"e",ł:"l",ń:"n",ó:"o",ś:"s",ź:"z",ż:"z" }[c] ?? c))
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Action-verb groups: each item has a primary work-action that determines
 * which KNR family is appropriate. Two actions on the SAME stem (e.g. "bruzd")
 * are mutually exclusive:
 *   OPEN     — wykuwanie / bruzdowanie (cutting/opening a chase) — high norm
 *   RESTORE  — zaprawianie / zatynkowanie (sealing/restoring chase) — low norm
 *
 * Iron Rule: when item starts with a RESTORE verb, KNR entries describing
 * OPEN actions are HARD-BLOCKED (penalty -10) regardless of token overlap.
 */
type ActionLabel = "OPEN" | "RESTORE" | "DEMONTAZ" | "MEASURE" | "CONNECT" | "MOUNT_LAMP";

interface ActionGroup {
  label: ActionLabel;
  /** Detect this action in the needle (item name). */
  detect: RegExp;
  /** KNR entry description must match this for a strong score boost. */
  required: RegExp;
  /** KNR entry description matching this is HARD-BLOCKED. */
  forbidden?: RegExp;
}

const ACTION_GROUPS: ReadonlyArray<ActionGroup> = [
  // RESTORE: zaprawianie / zatynkowanie / gipsowanie / uszczelnienie bruzdy
  // Must match entries that talk about closing/sealing the chase.
  // BLOCKED: wykuwanie / bruzdowanie / kucie / frezowanie (= opening chase).
  {
    label: "RESTORE",
    detect: /\b(zaprawia|zatynkow|zamkni[ea]ci|zaslepi|gipsowa|uszczelni|odtwarzani|zasypa|zalewa)/,
    required: /(zaprawia|zatynkow|zasypa|zamkni[ea]ci|zaslepi|gipsowa|uszczelni|odtwarzani|zalewa)/,
    forbidden: /(wykuwa|wykuci|bruzdowani[ea]|kucie\b|frezowan[ie]|nacieci[ea]|sztrobow)/,
  },
  // OPEN: bruzdowanie / wykuwanie / kucie / frezowanie / nacinanie
  // BLOCKED: zaprawianie / zatynkowanie (= opposite restoration action)
  {
    label: "OPEN",
    detect: /\b(bruzdowa[a-z]*|wykuwa|wykuci|frezowa|nacieci|sztrobow|szlifow.*scian)/,
    required: /(wykuwa|wykuci|bruzdowani[ea]|kucie|frezowan[ie]|naciec)/,
    forbidden: /(zaprawia|zatynkow|zasypa|zamkni[ea]ci|zaslepi)/,
  },
  // DEMONTAZ: usunięcie istniejącej instalacji (handled separately by slang map)
  {
    label: "DEMONTAZ",
    detect: /\b(demonta[a-zż]+|rozbior|zdemont|likwidacj)/,
    required: /(demonta[zż]|rozbiorka|usuniec)/,
    forbidden: /(montaz\s+(?:nowej|nowy|nowego)|wykonanie\s+nowej)/,
  },
  // MEASURE: pomiary instalacji (separate KNR family)
  {
    label: "MEASURE",
    detect: /\bpomiar(?:y|ow)?\b/,
    required: /(pomiar|badanie|odbior|sprawdz|kontrol)/,
  },
];

function detectActionGroup(needle: string): ActionGroup | null {
  let earliest: { group: ActionGroup; pos: number } | null = null;
  for (const group of ACTION_GROUPS) {
    const m = needle.match(group.detect);
    if (m && m.index !== undefined) {
      if (earliest === null || m.index < earliest.pos) {
        earliest = { group, pos: m.index };
      }
    }
  }
  return earliest?.group ?? null;
}

/**
 * Substrate tiers: harder material ⇒ higher tier ⇒ higher KNR labor norm.
 * Used to disambiguate identically-named actions (bruzdowanie cegła vs beton).
 *
 * tier: 4 = ytong/gazobeton, 3 = żelbet/zbrojony, 2.5 = silikat,
 *       2 = beton/g-k, 1 = cegła, 0 = neutral.
 */
const SUBSTRATE_TIERS: ReadonlyArray<{ stems: RegExp; tokens: readonly string[]; tier: number }> = [
  { stems: /\b(ytong|gazobeton|siporex)/,                tokens: ["ytong", "gazobeton", "siporex"],   tier: 4 },
  { stems: /\b(zelbe|zbrojon|monolit)/,                  tokens: ["zelbe", "zbrojon", "monolit"],     tier: 3 },
  { stems: /\b(silk[aoie]|silikat|silce)/,                tokens: ["silk", "silikat", "silce"],         tier: 2.5 },
  { stems: /\bbeton/,                                     tokens: ["beton", "zelbet"],                 tier: 2 },
  { stems: /\b(gipsokart|gipsow|\bgk\b|karton)/,          tokens: ["gipsokart", "gipsow", " gk "],     tier: 2 },
  { stems: /\b(cegl|cegiel|ceglan)/,                      tokens: ["cegl", "cegiel"],                   tier: 1 },
];

function detectSubstrate(needle: string): { tier: number; tokens: readonly string[] } {
  for (const t of SUBSTRATE_TIERS) {
    if (t.stems.test(needle)) return { tier: t.tier, tokens: t.tokens };
  }
  return { tier: -1, tokens: [] };
}

/**
 * Slang → canonical KNR vocabulary substitutions, applied BEFORE fuzzy match.
 *
 * Why: lookupKnrByName scores against entry.description / entry.synonyms only.
 * Common Polish installer slang (e.g. "bruzdowanie") doesn't appear verbatim
 * in any KNR JSON, so fuzzy returns 0 → "Uzupełnij" fall-through. Expanding
 * the needle string with canonical equivalents fixes recall without polluting
 * the JSON datasets.
 *
 * Iron Rule: ADDITIVE — original tokens are preserved (we append, not replace).
 *
 * Action-aware: if `action` is set, this slang fires ONLY when the detected
 * action group label matches. Prevents bruzd-OPEN slang from hijacking
 * RESTORE items (e.g. "Zaprawianie bruzd po ułożeniu kabli").
 */
interface SlangRule {
  trigger: RegExp;
  canonical: string;
  /** Restrict firing to a specific action group (optional). */
  onlyAction?: ActionLabel;
  /** Suppress firing when this action group is detected (optional). */
  notWhenAction?: ActionLabel;
}

const NEEDLE_SLANG_MAP: ReadonlyArray<SlangRule> = [
  // === Bruzdy — wall chasing OPEN action ===
  // CRITICAL: notWhenAction=RESTORE prevents this from polluting "zaprawianie bruzd"
  { trigger: /\bbruzd[a-z]*/, canonical: "wykucie bruzdy bruzdowanie sciany bruzda", notWhenAction: "RESTORE" },
  { trigger: /\bsztrobow|\browkow|\bfrezowani|\bnacieci|\bwykuwa/, canonical: "wykucie bruzdy bruzda", notWhenAction: "RESTORE" },

  // === Bruzdy — RESTORE action (zaprawianie / zatynkowanie) ===
  { trigger: /\b(zaprawia|zatynkow|gipsowa|zaslepi|zamkni[ea]ci|zasypa|uszczelni|odtwarzani)/,
    canonical: "zaprawianie zatynkowanie bruzdy gips tynk renowacyjny zasypanie zalanie zamkniecie odtworzenie tynku" },

  // === Demontaż instalacji ===
  { trigger: /\bdemonta[a-zż]*/, canonical: "demontaz rozbiorka usuniecie istniejacej instalacji" },
  { trigger: /\brozbior|\bzdemont|\blikwidacj|\busuniec|\bwyrwani/, canonical: "demontaz rozbiorka" },

  // === Detektory obecności / ruchu ===
  { trigger: /\bdetektor[a-z]*\b/, canonical: "czujnik ruchu detektor obecnosci pir montaz" },
  { trigger: /\bczujnik\s+(pir|ruchu|obecnosc)/, canonical: "czujnik ruchu pir montaz" },

  // === Zasilanie urządzeń (klimatyzacja, agregaty, IT) ===
  { trigger: /\b(zasilan|zasialn)[a-z]*/, canonical: "ulozenie kabla zasilanie wlz prowadzenie przewodu" },
  { trigger: /\bklimatyz[a-z]*/, canonical: "klimatyzacja split jednostka" },

  // === Cables — narrow slang for legacy items ===
  // CAUTION: cable slang is intentionally NARROW — broad triggers risk
  // pulling sockets/panels toward cable entries (cross-unit norm bugs).
  // Only fire when item name actually contains the cable abbreviation.
  // YDYp/YDY — copper PVC cable
  { trigger: /\bydyp?\b|\bydy\b/, canonical: "ulozenie przewodu ydyp" },
  // YKY/YKYzo — copper power cable
  { trigger: /\byky(?:zo)?\b/, canonical: "ulozenie kabla yky miedziany" },
  // UTP/skrętka — must have explicit "utp" or "skretka" (NOT bare "cat 6"
  // because RJ45 sockets also include cat 6 and we'd misroute them)
  { trigger: /\butp\b|\bskretka\b/, canonical: "ulozenie skretki utp" },

  // === Okablowanie / przewody zasilające — generic cable laying ===
  { trigger: /\bokablowani[ea]\b|\bprzewody\s+zasilaj/, canonical: "ulozenie przewodu kabla wciaganie" },

  // === Pomiary i odbiory — must include explicit pomiar+context ===
  { trigger: /\bpomiar[a-z]*\s+(?:rezystancj|izolacj|skutec|odbior|elektryczn|instalacj)/,
    canonical: "pomiary odbiorcze badania instalacji rezystancja izolacji" },

  // === Bruzdy do lamp — composite OPEN action ===
  { trigger: /\bbruzd.*(?:lamp|opraw)/, canonical: "wykucie bruzdy pod oprawe oswietleniowa", notWhenAction: "RESTORE" },

  // === Oświetlenie — typo-tolerant (oswietlen / osweitlen — transposition) ===
  { trigger: /\bo[sś]w(?:ietl|eitl)[a-z]*/, canonical: "oswietlenie oprawa oswietleniowa lampa" },
];

function expandSlang(normalized: string, action: ActionGroup | null): string {
  const additions: string[] = [];
  for (const rule of NEEDLE_SLANG_MAP) {
    if (rule.onlyAction && action?.label !== rule.onlyAction) continue;
    if (rule.notWhenAction && action?.label === rule.notWhenAction) continue;
    if (rule.trigger.test(normalized)) {
      additions.push(rule.canonical);
    }
  }
  return additions.length === 0 ? normalized : `${normalized} ${additions.join(" ")}`;
}

/**
 * Fuzzy token match: exact substring OR shared prefix.
 * P=4 covers Polish declension (cegle/cegla/cegly share "cegl");
 * fallback P=3 for tokens ≥6 chars handles letter-transposition typos
 * like "osweitlen" ↔ "oswietlen".
 */
function tokenMatches(needle: string, haystack: string): boolean {
  if (haystack.includes(needle)) return true;
  const P = 4;
  const haystackTokens = haystack.split(" ");
  if (needle.length >= P && haystackTokens.some((t) => t.startsWith(needle.slice(0, P)))) return true;
  if (needle.length >= P && needle.startsWith(haystack.slice(0, P))) return true;
  // Loose prefix=3 for longer words only — limits false positives
  if (needle.length >= 6 && haystackTokens.some((t) => t.length >= 6 && t.startsWith(needle.slice(0, 3)))) {
    // Require at least 50% character overlap to avoid wild matches
    const cand = haystackTokens.find((t) => t.length >= 6 && t.startsWith(needle.slice(0, 3)));
    if (cand) {
      const minLen = Math.min(needle.length, cand.length);
      let common = 0;
      for (let i = 0; i < minLen; i++) if (needle[i] === cand[i]) common++;
      if (common / minLen >= 0.65) return true;
    }
  }
  return false;
}

function scoreCandidate(needleTokens: string[], candidate: string): number {
  const candTokens = candidate.split(" ").filter((t) => t.length > 2);
  const hits = needleTokens.filter((nt) =>
    candTokens.some((ct) => tokenMatches(nt, ct) || tokenMatches(ct, nt))
  ).length;
  if (hits === 0) return 0;
  // Recall-based: how many needle tokens were found (denominator = needle length)
  return hits / needleTokens.length * hits;
}

/**
 * Server-side KNR lookup by item name against local JSON synonyms + descriptions.
 *
 * Disambiguation cascade (in priority order):
 *   1. Action-verb gating  — RESTORE items can't match OPEN entries (and vice versa)
 *   2. Substrate tier      — beton items prefer beton entries over cegła
 *   3. Token recall score  — base fuzzy matching with prefix tolerance
 *   4. Residential tiebreak — prefer is_industrial=false entries
 *
 * Returns best match or null when no entry passes the recall threshold.
 */
export function lookupKnrByName(itemName: string, preferResidential = true): KnrMatch | null {
  const baseNeedle = normalize(itemName);
  // Detect action and substrate ON THE RAW item name (before slang noise pollutes them)
  const actionGroup = detectActionGroup(baseNeedle);
  const substrate = detectSubstrate(baseNeedle);

  // Expand slang AFTER action detection so RESTORE items don't get OPEN-bruzd canonical noise
  const needle = expandSlang(baseNeedle, actionGroup);
  const needleTokens = needle.split(" ").filter((t) => t.length > 2);
  if (needleTokens.length === 0) return null;

  let bestEntry: KnrEntry | null = null;
  let bestScore = -Infinity;
  let bestRawScore = 0; // for threshold checking, separate from bonused score

  for (const entry of getAllEntries()) {
    const descNorm = normalize(entry.description);
    const synonymNorms = (entry.synonyms ?? []).map(normalize);
    const candidates = [descNorm, ...synonymNorms];

    let rawScore = 0;
    for (const candidate of candidates) {
      rawScore = Math.max(rawScore, scoreCandidate(needleTokens, candidate));
    }
    if (rawScore === 0) continue;

    let effectiveScore = rawScore;

    // ── Action-verb gating ──────────────────────────────────────────────
    if (actionGroup) {
      const allHaystack = [descNorm, ...synonymNorms].join(" ");
      const matchesAllowed = actionGroup.required.test(allHaystack);
      const matchesForbidden = actionGroup.forbidden?.test(allHaystack) ?? false;
      if (matchesAllowed)        effectiveScore += 1.50;   // strong preference
      else if (matchesForbidden) effectiveScore -= 10.0;   // HARD-BLOCK
    }

    // ── Substrate tier matching ─────────────────────────────────────────
    if (substrate.tier > 0) {
      const allHaystack = [descNorm, ...synonymNorms].join(" ");
      const candHasMatchingSubstrate = substrate.tokens.some((t) => allHaystack.includes(t));
      if (candHasMatchingSubstrate) {
        effectiveScore += 0.80;
      } else {
        // Penalize entries that explicitly state a SOFTER substrate than the item.
        // Example: item="bruzdowanie w betonie" (tier 2) vs entry="bruzdowanie w cegle" (tier 1)
        const candHasSofterSubstrate = SUBSTRATE_TIERS
          .filter((s) => s.tier > 0 && s.tier < substrate.tier)
          .some((s) => s.tokens.some((tok) => allHaystack.includes(tok)));
        if (candHasSofterSubstrate) effectiveScore -= 2.50;
      }
    }

    // ── Residential tiebreak ───────────────────────────────────────────
    if (preferResidential && entry.is_industrial === false) effectiveScore += 0.05;

    if (effectiveScore > bestScore) {
      bestScore = effectiveScore;
      bestRawScore = rawScore;
      bestEntry = entry;
    }
  }

  // Threshold: raw token-recall must clear 0.5 (50% of needle matched).
  // No score-fallback — boosts are tiebreakers among already-recalling entries,
  // not a way to admit weak matches.
  if (bestEntry && bestRawScore >= 0.5) {
    const adjustedNorm = bestEntry.labor_norm * (bestEntry.unit_factor ?? 1.0);
    return { code: bestEntry.catalog_code, laborNorm: adjustedNorm, unit: bestEntry.unit };
  }
  return null;
}

/**
 * M-Matrix v1.4: per-entry tool-acceleration factor for AI context reference prices.
 * Uses classifyIntent(description) → getModernizationFactor(intent) so L3 AI context
 * matches what L2 KNR calculates: price = norm × M-Factor(intent) × hourlyRate.
 * Replaces the deprecated global TOOLING_ADJ = 0.75 constant.
 */

/** Module-level cache: context string is expensive to rebuild (O(n) string ops) — memoize per rounded hourlyRate */
const _contextCache = new Map<string, string>();

export function buildLocalKnrContext(hourlyRate: number = 84, maxEntries?: number): string {
  const rounded = Math.round(hourlyRate);
  const cacheKey = `${rounded}:${maxEntries ?? "all"}`;
  const cached = _contextCache.get(cacheKey);
  if (cached) return cached;

  const all = getAllEntries();
  const entries = maxEntries != null ? all.slice(0, maxEntries) : all;
  const lines = entries.map((e) => {
    const factor = e.unit_factor ?? 1.0;
    const norm = e.labor_norm * factor;
    const intent = classifyIntent(e.description).intent;
    const isMetalEntry = (e.is_industrial === true) && isMetal(e.description);
    const mFactor = getModernizationFactor(intent, null, false, isMetalEntry);
    const price = (norm * mFactor * hourlyRate).toFixed(2);
    return `${e.catalog_code}: ${e.description} → ${norm.toFixed(4)} rbh/${e.unit} = ${price} PLN robocizna`;
  });

  const ctx = lines.join("\n");
  _contextCache.set(cacheKey, ctx);
  return ctx;
}
