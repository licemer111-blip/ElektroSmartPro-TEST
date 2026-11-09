/**
 * Centralized AI quota limits — importable from both server and client.
 *
 * One monthly pool for every AI window (import, assistant, photo, panel).
 *   - FREE: 10 requests / month. Enough to try photo import and the assistant.
 *   - 7-day trial: same pool as PRO.
 *   - PRO: 500 requests / month. Room for daily work, not an open tap.
 * A priced row from the ES hour list does not spend a request.
 *   Limits are GLOBAL (shared across all AI features), not per-function.
 */
export const DEMO_AI_LIMIT = 10;
export const PRO_AI_LIMIT = 500;

/**
 * Per-function overrides (if not set, falls back to DEMO/PRO_AI_LIMIT).
 * aiSchemat historically had higher demo limit — kept for backward compat,
 * but capped to the FREE ceiling (one pool for every AI window).
 */
export const FUNCTION_LIMITS: Partial<Record<string, { demo: number; pro: number }>> = {
  // No per-function overrides — all AI features share the 10/500 pool.
  // Add entries here ONLY if a specific function needs a different cap.
};

export const AI_FUNCTION_NAMES = {
  generateItems: "generateItems",
  aiImportProject: "aiImportProject",
  aiImportLab: "aiImportLab",
  aiImportCatalog: "aiImportCatalog",
  aiBlueprint: "aiBlueprint",
  aiSchemat: "aiSchemat",
  aiAssemblies: "aiAssemblies",
  aiPricing: "aiPricing",
  quickEstimate: "quickEstimate",
  aiVision: "aiVision",
  excelAnalyze: "excelAnalyze",
  transcribeVoice: "transcribeVoice",
  cleanPrzedmiar: "cleanPrzedmiar",
  chatbot: "chatbot",
  aiCatalog: "aiCatalog",
  aiDuplicates: "aiDuplicates",
} as const;

export type AiFunctionName = (typeof AI_FUNCTION_NAMES)[keyof typeof AI_FUNCTION_NAMES];
