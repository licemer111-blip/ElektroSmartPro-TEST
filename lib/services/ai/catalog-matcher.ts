/**
 * catalog-matcher.ts
 * 6-stage waterfall catalog search pipeline + LLM-assisted semantic matching.
 */

import { logger } from "@/lib/logger";
import type {
  CatalogItemRef,
  CatalogMatchResult,
  MatchTrace,
  SemanticMatchResult,
} from "./catalog-types";
import { sanitize, tokenizeWords, normalizeCableSpec } from "./catalog-sanitizer";
import { SACRED_WORDS } from "./catalog-types";

// ─── Low-level primitives ─────────────────────────────────────────────────────

function levenshtein(a: string, b: string, maxDist = 3): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[b.length];
}

function bigrams(s: string): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) result.add(s.slice(i, i + 2));
  return result;
}

function bigramSimilarity(a: string, b: string): number {
  const ba = bigrams(a);
  const bb = bigrams(b);
  if (ba.size === 0 || bb.size === 0) return 0;
  let intersection = 0;
  for (const g of ba) { if (bb.has(g)) intersection++; }
  return (2 * intersection) / (ba.size + bb.size);
}

function isSacredToken(tok: string): boolean {
  return SACRED_WORDS.has(tok) || /^\d+x\d/.test(tok);
}

function countSharedWords(
  queryTokens: string[],
  catTokens: string[],
  strictSacred: boolean
): { count: number; matched: string[] } {
  let count = 0;
  const matched: string[] = [];
  for (const mw of queryTokens) {
    const sacred = isSacredToken(mw);
    const hit = catTokens.some((cw) => {
      if (sacred && strictSacred) return cw === mw;
      if (cw === mw) return true;
      if (!sacred && mw.length >= 3 && (cw.includes(mw) || mw.includes(cw))) return true;
      if (!sacred && mw.length > 4 && levenshtein(mw, cw, 1) <= 1) return true;
      return false;
    });
    if (hit) { count++; matched.push(mw); }
  }
  return { count, matched };
}

// ─── Search pipeline ──────────────────────────────────────────────────────────

/**
 * findBestCatalogMatch — backward-compatible wrapper.
 */
export function findBestCatalogMatch(
  materialName: string,
  catalogItems: CatalogItemRef[],
  debugMiss = false
): CatalogItemRef | null {
  return findBestCatalogMatchWithHint(materialName, catalogItems, debugMiss).match;
}

/**
 * findBestCatalogMatchWithHint — unified L1 search pipeline.
 *
 * 6-stage waterfall:
 *   1) Exact match
 *   2) Diacritic-normalized exact
 *   3) Contains (substring)
 *   4) Intersection (≥2 shared words)
 *   5) Keyword fuzzy (score ≥0.55)
 *   6) Levenshtein typo-tolerant (≤1 edit, short names)
 */
export function findBestCatalogMatchWithHint(
  materialName: string,
  catalogItems: CatalogItemRef[],
  debugMiss = false
): CatalogMatchResult {
  const normalizedName = normalizeCableSpec(materialName.toLowerCase().trim());
  const strippedName = sanitize(materialName);
  const queryTokens = tokenizeWords(strippedName);

  // ── Stage 1: Exact match ──
  const exactMatch = catalogItems.find(
    (item) => item.name.toLowerCase().trim() === normalizedName
  );
  if (exactMatch) {
    const trace: MatchTrace = { method: "exact", score: 1, detail: `"${materialName}" === "${exactMatch.name}"` };
    if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
    return { match: exactMatch, trace, bestMiss: null };
  }

  // ── Stage 2: Diacritic-normalized exact ──
  const diacMatch = catalogItems.find((item) => sanitize(item.name) === strippedName);
  if (diacMatch) {
    const trace: MatchTrace = { method: "diacritic", score: 0.99, detail: `"${materialName}" ≈diac≈ "${diacMatch.name}"` };
    if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
    return { match: diacMatch, trace, bestMiss: null };
  }

  // ── Stage 3: Contains (substring) ──
  // B9 fix: reduced min length from 8 → 4 so short catalog names like "Kabel",
  // "Rura", "Puszka" (5–6 chars after sanitize) are eligible for substring matching.
  let containsMatch: CatalogItemRef | null = null;
  let containsMatchLen = 0;
  for (const item of catalogItems) {
    const catName = sanitize(item.name);
    if (catName.length < 4) continue;
    const coverage = catName.length / Math.max(strippedName.length, 1);
    if (coverage < 0.5) continue;
    if (strippedName.includes(catName) || catName.includes(strippedName)) {
      if (catName.length > containsMatchLen) {
        containsMatchLen = catName.length;
        containsMatch = item;
      }
    }
  }
  if (containsMatch) {
    const trace: MatchTrace = { method: "contains", score: 0.95, detail: `"${materialName}" ⊆ "${containsMatch.name}" (len=${containsMatchLen})` };
    if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
    return { match: containsMatch, trace, bestMiss: null };
  }

  // ── Stage 4: Intersection (≥2 shared words + coverage ratio ≥0.5) ──
  if (queryTokens.length >= 2) {
    let bestItem: CatalogItemRef | null = null;
    let bestCount = 0;
    let bestMatched: string[] = [];
    for (const item of catalogItems) {
      const catTokens = tokenizeWords(sanitize(item.name));
      const { count, matched } = countSharedWords(queryTokens, catTokens, true);
      const ratio = count / Math.max(queryTokens.length, catTokens.length, 1);
      if (count >= 2 && ratio >= 0.5 && count > bestCount) {
        bestCount = count;
        bestItem = item;
        bestMatched = matched;
      }
    }
    if (bestItem) {
      const trace: MatchTrace = {
        method: "intersection",
        score: Math.round((bestCount / Math.max(queryTokens.length, 1)) * 100) / 100,
        detail: `${bestCount} shared words [${bestMatched.join(",")}] → "${bestItem.name}"`,
      };
      if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
      return { match: bestItem, trace, bestMiss: null };
    }
  }

  // ── Stage 5: Keyword fuzzy (score ≥0.55) ──
  let bestMatch: CatalogItemRef | null = null;
  let bestScore = 0;
  let bestMatchedWords: string[] = [];
  let globalBestScore = 0;
  let globalBestName = "";

  for (const item of catalogItems) {
    const catTokens = tokenizeWords(sanitize(item.name));
    const { count, matched } = countSharedWords(queryTokens, catTokens, false);
    const score = queryTokens.length > 0
      ? count / Math.max(queryTokens.length, catTokens.length)
      : 0;

    if (score > globalBestScore) { globalBestScore = score; globalBestName = item.name; }

    if (score > bestScore && score >= 0.55 && (count >= 1 || queryTokens.length === 1)) {
      bestScore = score;
      bestMatch = item;
      bestMatchedWords = matched;
    }
  }

  if (bestMatch) {
    const trace: MatchTrace = {
      method: "keyword",
      score: Math.round(bestScore * 100) / 100,
      detail: `matched=[${bestMatchedWords.join(",")}] → "${bestMatch.name}"`,
    };
    if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
    return { match: bestMatch, trace, bestMiss: null };
  }

  // ── Stage 6: Levenshtein (short names ≤12 chars, ≤1 edit) ──
  if (strippedName.length <= 12) {
    let typoMatch: CatalogItemRef | null = null;
    let typoMinDist = 2;
    for (const item of catalogItems) {
      const catStripped = sanitize(item.name);
      if (catStripped.length > 14 || catStripped.length < 4) continue;
      const dist = levenshtein(strippedName, catStripped, 1);
      if (dist <= 1 && dist < typoMinDist) { typoMinDist = dist; typoMatch = item; }
    }
    if (typoMatch) {
      const trace: MatchTrace = {
        method: "levenshtein",
        score: Math.round((1 - typoMinDist / Math.max(strippedName.length, 1)) * 100) / 100,
        detail: `edit distance ${typoMinDist} → "${typoMatch.name}"`,
      };
      if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
      return { match: typoMatch, trace, bestMiss: null };
    }
  }

  // ── MISS ──
  const bestMiss = globalBestScore > 0
    ? { name: globalBestName, score: Math.round(globalBestScore * 100) / 100 }
    : null;
  const trace: MatchTrace = {
    method: "miss",
    score: 0,
    detail: `No match for "${materialName}" (best: ${bestMiss ? `"${bestMiss.name}" ${bestMiss.score}` : "none"})`,
  };
  if (debugMiss) logger.info(`[L1] ${trace.method}: ${trace.detail}`);
  return { match: null, trace, bestMiss };
}

// ─── Top candidates ───────────────────────────────────────────────────────────

/**
 * Returns top-N candidates from the catalog ranked by relevance.
 * Uses token scoring with bigram fallback when all token scores = 0.
 */
export function buildTopCatalogCandidates(
  materialName: string,
  catalogItems: CatalogItemRef[],
  topN = 5
): Array<{ name: string; mat: number; lab: number; score: number }> {
  const strippedName = sanitize(materialName);
  const queryTokens = tokenizeWords(strippedName);

  const scored = catalogItems.map((item) => {
    const catSanitized = sanitize(item.name);
    const catTokens = tokenizeWords(catSanitized);
    const { count } = countSharedWords(queryTokens, catTokens, false);
    const tokenScore = queryTokens.length > 0
      ? count / Math.max(queryTokens.length, catTokens.length)
      : 0;
    return { name: item.name, mat: item.base_material_price ?? 0, lab: item.base_labor_price ?? 0, tokenScore, catSanitized };
  });

  const hasAnyTokenHit = scored.some((c) => c.tokenScore > 0);

  if (hasAnyTokenHit) {
    return scored
      .map(({ name, mat, lab, tokenScore }) => ({ name, mat, lab, score: Math.round(tokenScore * 100) / 100 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  return scored
    .map(({ name, mat, lab, catSanitized }) => ({
      name, mat, lab,
      score: Math.round(bigramSimilarity(strippedName, catSanitized) * 100) / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// ─── Semantic LLM matching ────────────────────────────────────────────────────

/**
 * semanticCatalogMatch — LLM fallback for Tryb Własny when keyword pipeline misses.
 * @param desperate - P1 mode: ALWAYS return best match, threshold drops to 0.3.
 */
export async function semanticCatalogMatch(
  itemName: string,
  catalogItems: CatalogItemRef[],
  maxCandidates = 20,
  desperate = false
): Promise<SemanticMatchResult> {
  if (catalogItems.length === 0) return { match: null, confidence: 0, chosenName: null };

  const topScored = buildTopCatalogCandidates(itemName, catalogItems, maxCandidates);
  const catalogByName = new Map<string, CatalogItemRef>(catalogItems.map((c) => [c.name, c]));
  const candidates: CatalogItemRef[] = topScored
    .map((s) => catalogByName.get(s.name))
    .filter((c): c is CatalogItemRef => c !== undefined);

  if (candidates.length === 0) return { match: null, confidence: 0, chosenName: null };

  const listText = candidates.map((c, i) => `${i + 1}. ${c.name} (${c.unit})`).join("\n");

  const desperateRule = desperate
    ? `- ZAWSZE wybierz najlepiej pasującą pozycję. Lista jest KRÓTKA (${candidates.length} pozycji) — lepiej dać "podobne" niż "brak".\n` +
      `- Zwróć index=0 TYLKO jeśli absolutnie nic nie ma wspólnego (np. "kabel" vs "farba").\n`
    : `- Jeśli ŻADNA nie pasuje na ≥50% semantycznie → zwróć 0.\n`;

  const prompt =
    `Masz listę pozycji z cennika elektryka (posortowane wg trafności):\n${listText}\n\n` +
    `Pytanie: Która pozycja z tej listy najlepiej pasuje do: "${itemName}"?\n` +
    `Zasady:\n` +
    `- Szukaj semantycznie: "bezpiecznik B16" = "Wyłącznik nadprądowy MCB 1P B16", "S gniazdo" = "Gniazdo 230V".\n` +
    `- "kabel 3x1.5" = "Przewód YDYp 3x1.5", "bruzda" = "Kucie bruzdy w tynku".\n` +
    desperateRule +
    `Odpowiedź: zwróć TYLKO JSON: {"index": <numer 1-${candidates.length} lub 0>, "confidence": <0.0-1.0>}`;

  const minConfidence = desperate ? 0.3 : 0.65;

  try {
    const { google } = await import("@ai-sdk/google");
    const { generateText } = await import("ai");

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      maxOutputTokens: 60,
    });

    const raw = text.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw) as { index: number; confidence: number };

    if (!parsed.index || parsed.index < 1 || parsed.confidence < minConfidence) {
      return { match: null, confidence: parsed.confidence ?? 0, chosenName: null };
    }

    const chosen = candidates[parsed.index - 1] ?? null;
    return { match: chosen, confidence: parsed.confidence, chosenName: chosen?.name ?? null };
  } catch {
    return { match: null, confidence: 0, chosenName: null };
  }
}

/**
 * batchSemanticCatalogMatch — single LLM call for N items.
 * @param desperate - P1 mode: threshold 0.3, always pick best
 */
export async function batchSemanticCatalogMatch(
  items: Array<{ id: string; name: string }>,
  catalogItems: CatalogItemRef[],
  topN = 10,
  desperate = false
): Promise<Map<string, SemanticMatchResult>> {
  const results = new Map<string, SemanticMatchResult>();
  if (items.length === 0 || catalogItems.length === 0) return results;

  const catalogByName = new Map<string, CatalogItemRef>(catalogItems.map((c) => [c.name, c]));

  const perItemCandidates = items.map((item) => ({
    item,
    candidates: buildTopCatalogCandidates(item.name, catalogItems, topN)
      .map((s) => catalogByName.get(s.name))
      .filter((c): c is CatalogItemRef => c !== undefined),
  }));

  const itemBlocks = perItemCandidates
    .map(({ item, candidates: cands }, itemIdx) => {
      const list = cands.map((c, i) => `  ${i + 1}. ${c.name} (${c.unit})`).join("\n");
      return `POZYCJA ${itemIdx + 1}: "${item.name}"\nKandydaci:\n${list}`;
    })
    .join("\n\n");

  const desperateRule = desperate
    ? "Dla każdej pozycji ZAWSZE wybierz najlepszą. Zwróć 0 TYLKO jeśli absolutnie nic nie ma wspólnego."
    : "Zwróć 0 jeśli żadna nie pasuje na ≥50%.";

  const prompt =
    `Masz ${items.length} pozycji do dopasowania z cennika elektryka.\n` +
    `Zasady: szukaj semantycznie (bezpiecznik B16 = MCB 1P B16, bruzda = kucie bruzdy). ${desperateRule}\n\n` +
    itemBlocks +
    `\n\nZwróć TYLKO JSON array: [{"pos": 1, "index": <1-N lub 0>, "confidence": <0.0-1.0>}, ...]`;

  const minConfidence = desperate ? 0.3 : 0.65;

  try {
    const { google } = await import("@ai-sdk/google");
    const { generateText } = await import("ai");

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      maxOutputTokens: Math.min(200 + items.length * 30, 2000),
    });

    const raw = text.trim().replace(/```json|```/g, "").trim();

    let parsed: Array<{ pos: number; index: number; confidence: number }> = [];
    try {
      const json = JSON.parse(raw);
      parsed = Array.isArray(json) ? json : (json.results ?? json.estimates ?? []);
    } catch {
      const objMatches = raw.matchAll(/\{[^}]+\}/g);
      for (const m of objMatches) {
        try {
          const obj = JSON.parse(m[0]) as { pos?: number; index?: number; confidence?: number };
          if (typeof obj.pos === "number") parsed.push(obj as { pos: number; index: number; confidence: number });
        } catch { /* skip malformed fragment */ }
      }
    }

    for (const r of parsed) {
      const itemEntry = perItemCandidates[r.pos - 1];
      if (!itemEntry) continue;
      const { item, candidates: cands } = itemEntry;

      if (!r.index || r.index < 1 || (r.confidence ?? 0) < minConfidence) {
        results.set(item.id, { match: null, confidence: r.confidence ?? 0, chosenName: null });
        continue;
      }

      const chosen = cands[r.index - 1] ?? null;
      results.set(item.id, { match: chosen, confidence: r.confidence, chosenName: chosen?.name ?? null });
    }
  } catch {
    // Network/API failure — results remain empty, filled below
  }

  for (const { item } of perItemCandidates) {
    if (!results.has(item.id)) {
      results.set(item.id, { match: null, confidence: 0, chosenName: null });
    }
  }

  return results;
}
