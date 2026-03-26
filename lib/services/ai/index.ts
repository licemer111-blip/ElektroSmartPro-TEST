/**
 * lib/services/ai/index.ts
 *
 * Barrel export for all AI services.
 * Import from here instead of individual files.
 *
 * Usage:
 *   import { findBestCatalogMatch, parseElectricalConstraints } from "@/lib/services/ai";
 */

export * from "./pricing-logic.service";
export * from "./knr-engine.service";
export * from "./panel-logic.service";
export * from "./categorization.service";
