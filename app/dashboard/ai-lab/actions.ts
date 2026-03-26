// ─── Barrel re-exports — preserves all existing imports in UI ─────────────────
// Domain split:
//   ai-core-actions.ts  → Gemini AI calls (parsePdfWithAi, analyzeImageWithAi)
//   ai-data-actions.ts  → Supabase mutations (addMaterialsToProject, createQuickEstimateFromMaterials, getRegions…)
//   ai-excel-actions.ts → File parsing helpers + interfaces (ExtractedMaterial, ParseResult, …)

export type {
  ExtractedMaterial,
  ParseResult,
  VisionAnalysisResult,
} from "./ai-excel-actions";

export {
  parsePdfWithAi,
  analyzeImageWithAi,
} from "./ai-core-actions";

export {
  addMaterialsToProject,
  createQuickEstimateFromMaterials,
  getRegionsForQuickEstimate,
  getObjectTypesForQuickEstimate,
} from "./ai-data-actions";
