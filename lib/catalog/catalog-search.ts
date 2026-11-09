import { normalizePolish } from "@/lib/utils";

/** Fold Polish letters and punctuation so "lacznik" and "łącznik" are the same word. */
export function foldCatalogText(value: string | null | undefined): string {
  return normalizePolish(value)
    .replace(/×/g, "x")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "bruzda" and "bruzdowanie" share "bruzd". Short codes stay whole. */
function stem(word: string): string {
  if (word.length <= 4) return word;
  return word
    .replace(/owanie$|owaniu$|owania$/, "")
    .replace(/(?:ami|ach|owi|iem|em|om|ie|ow|a|e|y|i|u)$/u, "");
}

function wordHits(queryWord: string, nameWord: string): boolean {
  if (nameWord === queryWord) return true;
  const qs = stem(queryWord);
  const ns = stem(nameWord);
  if (qs.length < 3) return nameWord.startsWith(queryWord);

  // "lacznik" sits inside "wylacznik". A switch search must not return a breaker.
  if (qs === "lacznik" && (nameWord.startsWith("wylacz") || ns.startsWith("wylacz"))) return false;
  // "gniazdo" must not land on "kabel gniazdkowy".
  if (qs.startsWith("gniazd") && nameWord.includes("gniazdkow")) return false;

  return nameWord.startsWith(qs) || ns.startsWith(qs) || (qs.startsWith(ns) && ns.length >= 4);
}

/** Folders that are another trade, or a broken label. Rows stay in the database. */
export function isHiddenCatalogCategory(name: string): boolean {
  const folded = foldCatalogText(name);
  if (folded === "kory") return true;
  if (folded.startsWith("wentylacja i klimat")) return true;
  if (folded.startsWith("robotyka i automatyka")) return true;
  // Short folders repeat a longer one. Rows stay searchable.
  if (folded === "rozdzielnice") return true;
  if (folded === "pomiary") return true;
  if (folded === "smart home") return true;
  if (folded === "okablowanie") return true;
  return false;
}

/** Brand HVAC ducts and robot parts are not an electrician's line. */
export function isOffTradeCatalogItem(name: string): boolean {
  const folded = foldCatalogText(name);
  if (/\b(anemostat|tlumik akust|kratka wentyl|kanal wentyl|spiro)\b/.test(folded)) return true;
  if (/\bklimatyzator\b/.test(folded) && /\b(daikin|mitsubishi|kaseton|przeplyw|multi)\b/.test(folded)) return true;
  if (/\b(schunk|schmalz|igus|keyence|leuze|pilz)\b/.test(folded)) return true;
  if (/\b(chwytak|ssawka prozni|pompa prozni|kurtyna swietlna)\b/.test(folded)) return true;
  return false;
}

/** Old size rows ("Bruzda w cegle 20x20mm") kept a lump zł price next to Bruzdowanie. */
export function isLegacySizeChase(name: string): boolean {
  const folded = foldCatalogText(name);
  if (/^bruzda w (betonie|cegle)\b/.test(folded)) return true;
  return /^wykucie bruzdy w\b/.test(folded) && /\b1x1/.test(folded);
}
function isBrokenName(name: string): boolean {
  return /bruzd\w*utr/.test(name);
}

/**
 * A short query names one job. "bruzda" is cutting the chase, not laying a cable
 * in a chase and not filling it. The same hours apply in a flat, office, shop or hall.
 */
function sameJob(query: string, name: string): boolean {
  const words = query.split(" ");
  const head = words[0] ?? "";
  if (words.length > 2) return true;

  if (/^bruzd/.test(head)) {
    const cutting = /\bbruzdowan|\bkucie bruzd|\bwykucie bruzd|\bbruzda w\b|\bbruzdy w\b/.test(name);
    const other = /\b(uklad|montaz|przeciag|demont|zapraw|tynkow)\b/.test(name);
    if (/\b(zapraw|tynkow)\b/.test(name) && !/\b(zapraw|tynk)/.test(query)) return false;
    if (other && !cutting) return false;
    return cutting;
  }
  if (/^gniazd/.test(head)) return /\bgniazd/.test(name) && !/gniazdkow/.test(name);
  if (head === "lacznik") return /\blacznik/.test(name) && !/\bwylacz/.test(name);
  if (head === "wylacznik") return /\bwylacz/.test(name);
  if (/^puszk/.test(head)) return /\bpuszk/.test(name);
  if (/^(opraw|lampa|oswietl)/.test(head)) return /\b(opraw|lamp|oswietl|plafon|downlight)/.test(name);
  if (/^(ydyp|yky|ydy|kabel|przewod)/.test(head)) return /\b(ydyp|yky|ydy|kabel|przewod)/.test(name);
  return true;
}

/** True when every word of the query hits the same kind of catalog name. */
export function catalogNameMatches(query: string, name: string): boolean {
  if (isLegacySizeChase(name)) return false;
  const q = foldCatalogText(query);
  const n = foldCatalogText(name);
  if (!q || !n || isBrokenName(n)) return false;
  if (!sameJob(q, n)) return false;
  const queryWords = q.split(" ").filter((word) => word.length >= 2);
  if (queryWords.length === 0) return false;
  const nameWords = n.split(" ");
  return queryWords.every((word) => nameWords.some((nameWord) => wordHits(word, nameWord)));
}

/** Higher rank is the work the electrician meant. Canonical names come first. */
export function catalogSearchRank(query: string, name: string): number {
  if (!catalogNameMatches(query, name)) return 0;
  const q = foldCatalogText(query);
  const n = foldCatalogText(name);
  if (/^bruzd/.test(q)) {
    if (n.startsWith("bruzdow")) return 5;
    if (n.startsWith("kucie bruzd") || n.startsWith("wykucie bruzd")) return 4;
    return 2;
  }
  const head = q.split(" ")[0] ?? "";
  if (head && n.startsWith(head)) return 5;
  return 1;
}
