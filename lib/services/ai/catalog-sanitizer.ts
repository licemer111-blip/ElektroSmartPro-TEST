/**
 * catalog-sanitizer.ts
 * Unified sanitizer and tokenizer — single source of truth for name normalization.
 */

import { STOP_WORDS, SACRED_WORDS } from "./catalog-types";

/** Strip Polish diacritics for typo-tolerant comparison */
export function stripDiacritics(s: string): string {
  return s
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e")
    .replace(/ł/g, "l").replace(/ń/g, "n").replace(/ó/g, "o")
    .replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z");
}

/**
 * Normalize cable cross-section notation.
 * "3x1,5" → "3x1.5", "3×1,5" → "3x1.5", "3X2.5" → "3x2.5"
 */
export function normalizeCableSpec(s: string): string {
  return s
    .replace(/[Xx×]/g, "x")
    .replace(/(\d),( ?)(\d)/g, "$1.$3");
}

/**
 * Unified sanitizer — THE ONLY entry point for name normalization.
 * lowercase + trim + decimal comma→dot + cable normalization + diacritic stripping
 */
export function sanitize(s: string | null | undefined): string {
  if (s == null) return "";
  let v = s.toLowerCase().trim();
  v = v.replace(/(\d),(\d)/g, "$1.$2");
  v = v.replace(/[,;.]+$/, "");
  return stripDiacritics(normalizeCableSpec(v));
}

/**
 * Unified tokenizer — splits sanitized string into significant words.
 * Uses shared STOP_WORDS / SACRED_WORDS.
 */
export function tokenizeWords(sanitized: string): string[] {
  return sanitized
    .split(/[\s./()[\]{},;:!?=<>"'`|\\#@$&^~+%-]+/)
    .filter((tok) =>
      tok.length > 0 &&
      ((tok.length >= 2 && !STOP_WORDS.has(tok)) || SACRED_WORDS.has(tok))
    );
}
