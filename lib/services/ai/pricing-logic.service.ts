/**
 * pricing-logic.service.ts  v3.0  — barrel re-export
 *
 * Submodules:
 *  - catalog-types.ts      — interfaces, constants (STOP_WORDS, SACRED_WORDS)
 *  - catalog-sanitizer.ts  — sanitize, tokenizeWords, stripDiacritics, normalizeCableSpec
 *  - catalog-matcher.ts    — findBestCatalogMatch, buildTopCatalogCandidates, semantic LLM
 *  - pricing-helpers.ts    — resolveUserHourlyRate, buildRateSourceInstruction, buildCatalogContext
 */

export * from "./catalog-types";
export * from "./catalog-sanitizer";
export * from "./catalog-matcher";
export * from "./pricing-helpers";
