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

/** True when every word of the query hits the same kind of catalog name. */
export function catalogNameMatches(query: string, name: string): boolean {
  const q = foldCatalogText(query);
  const n = foldCatalogText(name);
  if (!q || !n) return false;
  const queryWords = q.split(" ").filter((word) => word.length >= 2);
  if (queryWords.length === 0) return false;
  const nameWords = n.split(" ");
  return queryWords.every((word) => nameWords.some((nameWord) => wordHits(word, nameWord)));
}
