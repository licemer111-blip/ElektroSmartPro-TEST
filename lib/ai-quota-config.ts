/**
 * Centralized AI quota limits — importable from both server and client.
 *
 * v2.1 Freemium model:
 *   - FREE tier: 5 AI requests / month — enough to evaluate the product,
 *     insufficient for routine use (drives trial activation / PRO upgrade).
 *   - 7-DAY TRIAL: gets PRO_AI_LIMIT (unlimited in practice).
 *   - PRO tier: 500 AI requests / month (500 = effectively unlimited for
 *     working electricians, hard ceiling against abuse).
 */
export const DEMO_AI_LIMIT = 5;
export const PRO_AI_LIMIT = 500;

/**
 * Per-function overrides (if not set, falls back to DEMO/PRO_AI_LIMIT).
 * aiSchemat historically had higher demo limit — kept for backward compat,
 * but capped to FREE ceiling of 5 (v2.1 unified limit across all AI functions).
 */
export const FUNCTION_LIMITS: Partial<Record<string, { demo: number; pro: number }>> = {
  // No per-function overrides in v2.1 — all AI features share the 5/500 limit.
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
