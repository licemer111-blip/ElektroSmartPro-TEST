/**
 * catalog-types.ts
 * Shared types and constants for the catalog matching engine.
 */

export interface CatalogItemRef {
  id: string;
  name: string;
  unit: string;
  base_material_price: number | null;
  base_labor_price: number | null;
  category?: string | null;
  subcategory?: string | null;
  panel_category?: string | null;
  catalog_confidence?: string | null;
  knr_code?: string | null;
}

/** Источник ставки: 'engine' = ES-Engine 2026, 'manual' = Własna Stawka */
export type RateSource = "engine" | "manual";

export interface PriceThresholds {
  PRICE_THRESHOLD: number;
}

export interface MatchTrace {
  method: "exact" | "diacritic" | "contains" | "intersection" | "keyword" | "levenshtein" | "semantic" | "miss";
  score: number;
  detail: string;
}

export interface CatalogMatchResult {
  match: CatalogItemRef | null;
  trace: MatchTrace;
  bestMiss: { name: string; score: number } | null;
}

export interface SemanticMatchResult {
  match: CatalogItemRef | null;
  confidence: number;
  chosenName: string | null;
}

/** Polish stop-words — filtered out during tokenization */
export const STOP_WORDS = new Set([
  "z", "do", "na", "w", "i", "dla", "pod", "bez", "od",
  "mm", "szt", "mb", "kpl", "nr", "poz", "lub",
]);

/** Sacred technical words — NEVER filtered regardless of length */
export const SACRED_WORDS = new Set([
  "ydyp", "ydyz", "ydyzo", "nym", "nhxmh", "hdgs", "rhdpe", "hdpe", "lgyzo", "ykyzo",
  "utp", "ftp", "lan", "led", "rgb",
  "mcb", "rcbo", "rcd", "spd", "ups",
  "b6", "b10", "b16", "b20", "b25", "b32", "b63",
  "c6", "c10", "c16", "c20", "c25", "c32", "c63",
  "1p", "2p", "3p", "4p",
  "m16", "m20", "m25", "m32", "m40", "m50", "m63",
  "ip20", "ip44", "ip54", "ip65", "ip67", "ip68",
  "nvr", "dvr", "poe",
  "din", "th35", "1u", "2u", "6u", "9u", "12u", "18u", "27u", "42u",
  "1x1.5", "1x2.5", "1x4", "1x6", "1x10", "1x16", "1x25", "1x35", "1x50",
  "2x1.5", "2x2.5", "2x4", "2x6", "2x0.75",
  "3x1.5", "3x2.5", "3x4", "3x6", "3x10", "3x16", "3x25", "3x35", "3x0.75",
  "4x1.5", "4x2.5", "4x4", "4x6", "4x10", "4x0.75",
  "5x1.5", "5x2.5", "5x4", "5x6", "5x10", "5x16", "5x25",
]);
