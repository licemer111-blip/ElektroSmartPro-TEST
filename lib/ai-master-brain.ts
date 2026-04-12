import esKnrDb from "@/data/knr/fixed_norms/es_knr_rozdzielnice_aparatura.json";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { POLISH_REGIONS } from "@/lib/config/regions";

/**
 * ElektroSmart PRO — AI MASTER BRAIN v2.0
 * Orchestrator: assembles prompts from lib/ai/prompts/ + KNR lookup logic.
 */

export {
  MASTER_IDENTITY,
  IRON_RULE_SPLIT_PRICING,
  IRON_RULE_VAT,
  IRON_RULE_REGION,
  IRON_RULE_DEMO,
  IRON_RULE_KNR_HIERARCHY,
  IRON_RULE_ZESTAWY_360,
  FOUR_IRON_RULES,
} from "@/lib/ai/prompts/identity-prompts";

import {
  MASTER_IDENTITY,
  FOUR_IRON_RULES,
  IRON_RULE_SPLIT_PRICING,
  IRON_RULE_VAT,
  IRON_RULE_DEMO,
  IRON_RULE_KNR_HIERARCHY,
  IRON_RULE_ZESTAWY_360,
} from "@/lib/ai/prompts/identity-prompts";

import { PRICING_PROMPT, ESTIMATOR_PROMPT, AUDITOR_PROMPT } from "@/lib/ai/prompts/pricing-prompts";
import { GENERATOR_PROMPT, ASSEMBLIES_PROMPT, IMPORTER_PROMPT, QUICK_ESTIMATE_PROMPT } from "@/lib/ai/prompts/knr-prompts";
import { SCHEMAT_PROMPT, SWITCHBOARD_PROMPT, CREATOR_PROMPT, AUTOMATION_PROMPT, CATALOG_PROMPT } from "@/lib/ai/prompts/panel-audit-prompts";

// ─── Module type ──────────────────────────────────────────────────────────────

export type AIModule =
  | "pricing"
  | "estimator"
  | "generator"
  | "assemblies"
  | "importer"
  | "quick-estimate"
  | "schemat"
  | "switchboard"
  | "creator"
  | "automation"
  | "catalog"
  | "auditor";

// ─── Module instruction map (assembled from lib/ai/prompts/) ──────────────────

const MODULE_INSTRUCTIONS: Record<AIModule, string> = {
  pricing:          PRICING_PROMPT,
  estimator:        ESTIMATOR_PROMPT,
  generator:        GENERATOR_PROMPT,
  assemblies:       ASSEMBLIES_PROMPT,
  importer:         IMPORTER_PROMPT,
  "quick-estimate": QUICK_ESTIMATE_PROMPT,
  schemat:          SCHEMAT_PROMPT,
  switchboard:      SWITCHBOARD_PROMPT,
  creator:          CREATOR_PROMPT,
  automation:       AUTOMATION_PROMPT,
  catalog:          CATALOG_PROMPT,
  auditor:          AUDITOR_PROMPT,
};

// ─── Main builder function ────────────────────────────────────────────────────

export function buildSystemPrompt(module: AIModule, extras?: string, expertDirectives?: string, rbhRate?: number): string {
  const parts = [MASTER_IDENTITY, FOUR_IRON_RULES, MODULE_INSTRUCTIONS[module]];
  if (expertDirectives?.trim()) {
    const resolved = rbhRate != null
      ? expertDirectives.trim().replace(/\{rbh_rate\}/g, String(rbhRate))
      : expertDirectives.trim();
    parts.push(`<expert_directives>\nGLOBALNE DYREKTYWY ADMINA (najwyższy priorytet po żelaznych zasadach):\n${resolved}\n</expert_directives>`);
  }
  if (extras) parts.push(extras);
  return parts.join("\n\n");
}

export async function buildDynamicSystemPrompt(
  module: AIModule,
  extras?: string,
  expertDirectives?: string,
  userEffectiveRate?: number | null,
): Promise<string> {
  const { buildDynamicRegionRule } = await import("@/lib/global-benchmarks");
  const dynamicRegionRule = await buildDynamicRegionRule();
  const adminRbhRate = 75; // hardcoded base rate (project-specific)
  // {rbh_rate} resolves to user's effective rate (P1/P2/P3 hierarchy result).
  // Falls back to admin benchmark only when user rate is unknown.
  const rateForSubstitution = userEffectiveRate != null && userEffectiveRate > 0
    ? userEffectiveRate
    : adminRbhRate;
  const ironRulesWithDynamic = [
    IRON_RULE_SPLIT_PRICING,
    IRON_RULE_VAT,
    dynamicRegionRule,
    IRON_RULE_DEMO,
    IRON_RULE_KNR_HIERARCHY,
    IRON_RULE_ZESTAWY_360,
  ].join("\n\n");
  const parts = [MASTER_IDENTITY, ironRulesWithDynamic, MODULE_INSTRUCTIONS[module]];
  if (expertDirectives?.trim()) {
    const resolved = expertDirectives.trim().replace(/\{rbh_rate\}/g, String(rateForSubstitution));
    parts.push(`<expert_directives>\nGLOBALNE DYREKTYWY ADMINA (najwyższy priorytet po żelaznych zasadach):\n${resolved}\n</expert_directives>`);
  }
  if (extras) parts.push(extras);
  return parts.join("\n\n");
}

export function buildLightSystemPrompt(extras?: string, expertDirectives?: string, rbhRate?: number): string {
  const parts = [MASTER_IDENTITY, FOUR_IRON_RULES];
  if (expertDirectives?.trim()) {
    const resolved = rbhRate != null
      ? expertDirectives.trim().replace(/\{rbh_rate\}/g, String(rbhRate))
      : expertDirectives.trim();
    parts.push(`<expert_directives>\nGLOBALNE DYREKTYWY ADMINA:\n${resolved}\n</expert_directives>`);
  }
  if (extras) parts.push(extras);
  return parts.join("\n\n");
}

// ─── KB context injector ──────────────────────────────────────────────────────

export function injectKbContext(basePrompt: string, kbContext: string | null): string {
  if (!kbContext) {
    return basePrompt + `\n\n<kb_status>Baza wiedzy użytkownika niedostępna. Używaj kodów KNR z katalogu wbudowanego w system prompt (KNR 5-04, KNR 5-08 itp.). Oznaczaj jako szacunek (isEstimate=true, knrCode="szacunek") TYLKO pozycje, dla których nie ma odpowiedniego kodu KNR w katalogu.</kb_status>`;
  }
  return basePrompt + `\n\n<kb_context_injected>
HIERARCHIA ŹRÓDEŁ (stosuj w tej kolejności):
1. Poniższe dane KB (ES-KNR 2026 / pliki użytkownika) — ABSOLUTNY PRIORYTET.
2. Wiedza ogólna AI — TYLKO dla pozycji nieobecnych w KB. Ustaw isEstimate=true.

ŹRÓDŁO: ES-KNR 2026 — Oficjalna Baza Wiedzy ElektroSmart PRO

${kbContext}
</kb_context_injected>`;
}

// ─── Region modifier helper — DERIVED from lib/config/regions.ts (single source of truth) ───

export const VOIVODESHIP_MODIFIERS: Record<string, number> = Object.fromEntries(
  POLISH_REGIONS.map((r) => [r.name, r.multiplier])
);

export function getVoivodeshipModifier(voivodeship?: string | null): number {
  if (!voivodeship) return 1.0;
  return VOIVODESHIP_MODIFIERS[voivodeship] ?? 1.0;
}

// ─── Legacy KNR maps (deprecated — use getKnrMetadata()) ─────────────────────

/** @deprecated Use getKnrMetadata() */
export const ACCESSORY_KNR_MAP: Record<string, string> = {
  "wire-1-5":        "KNR 5-08 0101-01",
  "wire-2-5":        "KNR 5-08 0101-02",
  "wire-6":          "KNR 5-08 0101-04",
  "wire-10":         "KNR 5-08 0101-05",
  "wire-16":         "KNR 5-08 0101-06",
  "wire-35":         "KNR 5-08 0101-07",
  "wire-70":         "KNR 5-08 0101-08",
  "ferrule-small":   "KNR 5-08 0902-01",
  "ferrule-medium":  "KNR 5-08 0902-02",
  "ferrule-large":   "KNR 5-08 0902-03",
  "cable-tie-200":   "KNR 5-08 0902-05",
  "cable-tie-300":   "KNR 5-08 0902-05",
  "marking-strip":   "KNR 5-08 0902-10",
  "label-set":       "KNR 5-08 0902-10",
  "busbar-3p":       "KNR 5-08 0812-01",
  "busbar-2p":       "KNR 5-08 0812-02",
  "pe-bar":          "KNR 5-08 0401-10",
  "n-bar":           "KNR 5-08 0401-11",
  "busbar-pe":       "KNR 5-08 0401-10",
  "busbar-n":        "KNR 5-08 0401-11",
  "terminal-block":    "KNR 5-08 0401-01",
  "terminal-zug-1p":   "KNR 5-08 0401-01",
  "terminal-zug-3p":   "KNR 5-08 0401-02",
  "terminal-end-bracket": "KNR 5-08 0401-05",
  "signal-terminal":      "KNR 5-08 0902-01",
  "dali-controller":      "KNR 5-08 0801-05",
  "bus-cable-wiring":     "KNR 5-08 0102-01",
  "labor-assembly":        "KNR 5-08 0201-01",
  "labor-cable-routing":   "KNR 5-08 0201-03",
  "labor-testing":         "KNR 5-08 0201-08",
  "labor-marking":         "KNR 5-08 0201-05",
};

// ─── KNR Metadata Result Type ─────────────────────────────────────────────────

export interface KnrMetadata {
  knrCode: string;
  laborRate: number;
  description: string;
  unit: string;
  source: "exact" | "prefix" | "keyword" | "category" | "poles" | "generic";
}

interface EsKnrEntry {
  knr_code: string;
  description: string;
  unit: string;
  labor_hours: number;
  category: string;
  poles: number | null;
  module_ids: string[];
  keywords: string[];
}

interface PoleFallbackEntry {
  knr_code: string;
  labor_hours: number;
  description: string;
}

/**
 * Returns KNR metadata for a DIN-rail Panel Configurator module.
 *
 * DESIGN SCOPE — intentionally limited to es_knr_rozdzielnice_aparatura.json:
 *   This function covers only switchboard aparatura (MCB, RCD, RCBO, MCCB, SPD,
 *   busbars, terminals, wiring accessories). It is used exclusively by the
 *   Panel Configurator pricing engine.
 *
 *   Other KNR categories (instalacje_rurowe, silniki, klimatyzacja, stacje_trafo,
 *   demontaż, etc.) are served by:
 *     1. es_dictionary DB table — semantic lookup for project items (ES-Engine)
 *     2. AI estimation fallback — RAG via Gemini Knowledge Base
 *
 *   Merging all 35+ category files here would increase the server bundle by ~2MB
 *   with no benefit for the Panel Configurator use-case.
 */
export function getKnrMetadata(
  moduleId: string,
  category?: string,
  moduleName?: string,
  modules?: number,
): KnrMetadata {
  const catalog: EsKnrEntry[] = (esKnrDb as unknown as { module_catalog?: EsKnrEntry[] }).module_catalog ?? [];
  const rawPolesFallback = (esKnrDb as unknown as {
    labor_norms?: { pole_count_fallback?: Record<string, unknown> }
  }).labor_norms?.pole_count_fallback ?? {};
  const polesFallback = Object.fromEntries(
    Object.entries(rawPolesFallback).filter(([k]) => /^\dP$/.test(k))
  ) as Record<string, PoleFallbackEntry>;

  const idLower = moduleId.toLowerCase();
  const nameLower = (moduleName || "").toLowerCase();

  for (const entry of catalog) {
    if (entry.module_ids.includes(moduleId)) {
      return { knrCode: entry.knr_code, laborRate: entry.labor_hours, description: entry.description, unit: entry.unit, source: "exact" };
    }
  }

  let bestPrefixEntry: EsKnrEntry | null = null;
  let bestPrefixLen = 0;
  for (const entry of catalog) {
    for (const mid of entry.module_ids) {
      if (idLower.startsWith(mid.toLowerCase()) && mid.length > bestPrefixLen) {
        bestPrefixEntry = entry;
        bestPrefixLen = mid.length;
      }
    }
  }
  if (bestPrefixEntry) {
    return { knrCode: bestPrefixEntry.knr_code, laborRate: bestPrefixEntry.labor_hours, description: bestPrefixEntry.description, unit: bestPrefixEntry.unit, source: "prefix" };
  }

  const idTokens = new Set(idLower.split("-"));
  const nameTokens = new Set(nameLower.split(/[\s\-\/,]+/).filter(Boolean));
  const allTokens = new Set([...idTokens, ...nameTokens]);

  let bestKwEntry: EsKnrEntry | null = null;
  let bestKwScore = 0;

  for (const entry of catalog) {
    if (category && entry.category !== category) continue;
    let score = 0;
    for (const kw of entry.keywords) {
      if (allTokens.has(kw.toLowerCase())) score += 2;
      else if (idLower.includes(kw.toLowerCase()) || nameLower.includes(kw.toLowerCase())) score += 1;
    }
    if (category && entry.category === category) score += 1;
    if (score > bestKwScore) { bestKwScore = score; bestKwEntry = entry; }
  }
  if (bestKwEntry && bestKwScore >= 2) {
    return { knrCode: bestKwEntry.knr_code, laborRate: bestKwEntry.labor_hours, description: bestKwEntry.description, unit: bestKwEntry.unit, source: "keyword" };
  }

  if (category) {
    const catEntry = catalog.find(e => e.category === category);
    if (catEntry) {
      return { knrCode: catEntry.knr_code, laborRate: catEntry.labor_hours, description: catEntry.description, unit: catEntry.unit, source: "category" };
    }
  }

  if (modules && modules >= 1 && modules <= 4) {
    const poleKey = `${modules}P` as keyof typeof polesFallback;
    const pf = polesFallback[poleKey];
    if (pf) {
      return { knrCode: pf.knr_code, laborRate: pf.labor_hours, description: pf.description, unit: "szt", source: "poles" };
    }
  }

  return { knrCode: "KNR 5-08", laborRate: 0.20, description: "Montaż aparatu elektrycznego na szynie TH35", unit: "szt", source: "generic" };
}

// ─── Model Routing Constants ──────────────────────────────────────────────────

export const GEMINI_RAG_MODEL = "gemini-2.0-flash" as const;
// Stage 2 Auditor — uses Tier 1 for deeper verification of pricing/schemat output
export const GEMINI_PRO_MODEL = AI_MODEL_TIER1;
