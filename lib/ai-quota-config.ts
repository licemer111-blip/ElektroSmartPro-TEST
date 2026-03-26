/** Centralized AI quota limits — importable from both server and client */
export const DEMO_AI_LIMIT = 20;
export const PRO_AI_LIMIT = 500;

/** Per-function overrides (if not set, falls back to DEMO/PRO_AI_LIMIT) */
export const FUNCTION_LIMITS: Partial<Record<string, { demo: number; pro: number }>> = {
  aiSchemat: { demo: 20, pro: 500 },
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
