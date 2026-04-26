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
 * Slang → canonical KNR vocabulary substitutions, applied BEFORE fuzzy match.
 *
 * Why: lookupKnrByName scores against entry.description / entry.synonyms only.
 * Common Polish installer slang (e.g. "bruzdowanie") doesn't appear verbatim
 * in any KNR JSON, so fuzzy returns 0 → "Uzupełnij" fall-through. Expanding
 * the needle string with canonical equivalents fixes recall without polluting
 * the JSON datasets.
 *
 * Iron Rule: ADDITIVE — original tokens are preserved (we append, not replace).
 */
const NEEDLE_SLANG_MAP: ReadonlyArray<{ trigger: RegExp; canonical: string }> = [
  // Bruzdy — wall chasing for cables / lamps
  // Typo-tolerant: matches "bruzd" stem with any suffix (handles bruzdownie, bruzdy, bruzdowane).
  { trigger: /\bbruzd[a-z]*/, canonical: "wykucie bruzdy bruzdowanie sciany bruzda" },
  { trigger: /\bsztrobow|\browkow|\bfrezowani|\bnacieci|\bwykuwa/, canonical: "wykucie bruzdy bruzda" },

  // Demontaż instalacji
  // Typo-tolerant: stem "demontaz" / "demonta" + any ending (demontaze, demontaż, demontaza).
  { trigger: /\bdemonta[a-zż]*/, canonical: "demontaz rozbiorka usuniecie istniejacej instalacji" },
  { trigger: /\brozbior|\bzdemont|\blikwidacj|\busuniec|\bwyrwani/, canonical: "demontaz rozbiorka" },

  // Detektory obecności / ruchu — long-range corridor variants
  // Loosened: detector + obecnosci/ruchu within 30 chars (any tokens between).
  { trigger: /\bdetektor[a-z]*\b/, canonical: "czujnik ruchu detektor obecnosci pir montaz" },
  { trigger: /\bczujnik\s+(pir|ruchu|obecnosc)/, canonical: "czujnik ruchu pir montaz" },

  // Zasilanie urządzeń (klimatyzacja, agregaty, IT) — cable laying
  // Typo-tolerant: stems zasilan / zasialn (transposition) — matches "zasialnie" too.
  { trigger: /\b(zasilan|zasialn)[a-z]*/, canonical: "ulozenie kabla zasilanie wlz prowadzenie przewodu" },

  // Klimatyzacja — context boost for AC-related cable runs
  { trigger: /\bklimatyz[a-z]*/, canonical: "klimatyzacja split jednostka" },

  // Okablowanie / przewody zasilające — generic cable laying
  { trigger: /\bokablowani[ea]\b|\bprzewody\s+zasilaj/, canonical: "ulozenie przewodu kabla wciaganie" },

  // Pomiary i odbiory
  { trigger: /\bpomiar(y|ow)?\s+(instalacj|elektryczn|odbior)/, canonical: "pomiary odbiorcze badania instalacji" },

  // Bruzdowanie + lamp / oprawy — composite fix for "Bruzdowanie do lamp"
  { trigger: /\bbruzd.*lamp|\bbruzd.*opraw/, canonical: "wykucie bruzdy pod oprawe oswietleniowa" },

  // Oświetlenie — typo-tolerant (oswietlen / osweitlen — letter transposition)
  { trigger: /\bo[sś]w(?:ietl|eitl)[a-z]*/, canonical: "oswietlenie oprawa oswietleniowa lampa" },
];

function expandSlang(normalized: string): string {
  const additions: string[] = [];
  for (const { trigger, canonical } of NEEDLE_SLANG_MAP) {
    if (trigger.test(normalized)) {
      additions.push(canonical);
    }
  }
  return additions.length === 0 ? normalized : `${normalized} ${additions.join(" ")}`;
}

/**
 * Fuzzy token match: exact substring OR shared prefix of length ≥5.
 * Handles typos like "gniazdko" ↔ "gniazdo", "przewod" ↔ "przewód" (after normalize).
 */
function tokenMatches(needle: string, haystack: string): boolean {
  if (haystack.includes(needle)) return true;
  // prefix=4 handles Polish declension: cegle/cegla/cegly all share "cegl"
  const P = 4;
  if (needle.length >= P && haystack.split(" ").some((t) => t.startsWith(needle.slice(0, P)))) return true;
  if (needle.length >= P && needle.startsWith(haystack.slice(0, P))) return true;
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
 * Uses fuzzy prefix matching — handles typos and Polish declension variations.
 * Prefers non-industrial entries for residential context (tie-breaking).
 * Returns best match or null.
 */
export function lookupKnrByName(itemName: string, preferResidential = true): KnrMatch | null {
  const baseNeedle = normalize(itemName);
  // Expand installer slang → canonical KNR vocabulary (additive — original tokens kept)
  const needle = expandSlang(baseNeedle);
  const needleTokens = needle.split(" ").filter((t) => t.length > 2);
  if (needleTokens.length === 0) return null;

  let bestEntry: KnrEntry | null = null;
  let bestScore = 0;

  for (const entry of getAllEntries()) {
    const candidates = [
      normalize(entry.description),
      ...(entry.synonyms ?? []).map(normalize),
    ];

    let score = 0;
    for (const candidate of candidates) {
      score = Math.max(score, scoreCandidate(needleTokens, candidate));
    }

    // Tie-breaking: prefer residential (is_industrial=false) entries
    const residentialBonus = preferResidential && entry.is_industrial === false ? 0.05 : 0;
    const effectiveScore = score + residentialBonus;

    if (effectiveScore > bestScore) {
      bestScore = effectiveScore;
      bestEntry = entry;
    }
  }

  // Minimum threshold: at least 50% of needle tokens matched
  if (bestScore >= 0.5 && bestEntry) {
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
