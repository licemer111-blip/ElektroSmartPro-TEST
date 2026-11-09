"use server";

/**
 * AI Pricing Action — Panel Configurator
 *
 * Labor is the ES hour times the electrician's own rate.
 * Material is the catalog price of the device already on the rail.
 * The region is not baked in, and this action does not call the model.
 */

import { VOIVODESHIP_MODIFIERS } from "@/lib/ai-master-brain";
import { getEffectiveRate } from "@/lib/global-benchmarks";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Input types ──────────────────────────────────────────────────────────────

export interface PricingModule {
  moduleId: string;
  namePl: string;
  category: string;
  rating?: number;
  quantity: number;
  /** Catalog price of the device the electrician already placed. Not an AI guess. */
  materialPrice?: number;
}

export interface PricingSection {
  sectionName: string;
  enclosureName: string;
  enclosureModules: number;
  modules: PricingModule[];
  accessories: PricingModule[];
}

export interface PricingRequest {
  panelName: string;
  manufacturerId: string;
  manufacturerCoeff: number;
  /** Raw voivodeshipModifier from UI. Will be clamped to [0.80..1.30] for safety. */
  voivodeshipModifier: number;
  /** Optional voivodeship name for lookup validation (e.g. "Podlaskie") */
  voivodeshipName?: string;
  sections: PricingSection[];
  /** Admin expert directives from KB Manager (highest priority) */
  expertDirectives?: string;
  /** User ID for loading private KB files and hourly_rate from profile */
  userId?: string;
}

// ── Output types ─────────────────────────────────────────────────────────────

export type ConfidenceLevel = "verified" | "analog" | "estimated" | "uncertain";

export interface PricedModule {
  moduleId: string;
  namePl: string;
  quantity: number;
  unitMaterial: number;
  unitLabor: number;
  totalMaterial: number;
  totalLabor: number;
  knrCode: string;
  isEstimate: boolean;
  /** Source of pricing data: 'ES-KNR 2026' | 'User File: <name>' | 'AI Szacunek' | 'System Default' */
  priceSource: string;
  /** Confidence level: verified=KNR exact match, analog=similar found, estimated=market avg, uncertain=no data */
  confidenceLevel: ConfidenceLevel;
  /** Note for analog/uncertain: e.g. "Analog: Schneider Resi9 16A" or "Brak danych w bazie KNR" */
  confidenceNote?: string;
}

export interface PricedSection {
  sectionName: string;
  enclosureMaterial: number;
  enclosureLabor: number;
  modules: PricedModule[];
  accessories: PricedModule[];
  sectionTotalMaterial: number;
  sectionTotalLabor: number;
}

export interface PricingResult {
  success: boolean;
  source: "KNR" | "GPT-estimate" | "fallback";
  confidence: "high" | "medium" | "low";
  voivodeshipModifier: number;
  manufacturerCoeff: number;
  sections: PricedSection[];
  grandTotalMaterial: number;
  grandTotalLabor: number;
  grandTotal: number;
  isEstimate: boolean;
  error?: string;
  audited?: boolean;
  auditFixed?: boolean;
  auditIssues?: import("@/server/services/ai-advisor.service").AIAuditIssue[];
  auditConfidence?: "high" | "medium" | "low";
  /** KB files used for pricing (user-uploaded documents) */
  kbFileNames?: string[];
}

// ── KNR Labor Map for DIN Modules (KNR 5-08) ────────────────────────────────
// Source: KNR 5-08 Montaż aparatury elektrycznej. Norms in rbh/szt.
// Eliminates AI labor guessing — deterministic KNR-derived values only.

interface KnrModuleEntry { knrCode: string; laborNorm: number }

const MODULE_KNR_MAP: Record<string, KnrModuleEntry> = {
  // MCB 1P (curves B/C/D — same norm)
  "mcb-b-1p":        { knrCode: "KNR 5-08 0401-01", laborNorm: 0.200 },
  "mcb-c-1p":        { knrCode: "KNR 5-08 0401-01", laborNorm: 0.200 },
  "mcb-d-1p":        { knrCode: "KNR 5-08 0401-01", laborNorm: 0.200 },
  // MCB 3P / 3P+N
  "mcb-b-3p":        { knrCode: "KNR 5-08 0401-02", laborNorm: 0.300 },
  "mcb-c-3p":        { knrCode: "KNR 5-08 0401-02", laborNorm: 0.300 },
  "mcb-d-3p":        { knrCode: "KNR 5-08 0401-02", laborNorm: 0.300 },
  "mcb-c-3pn":       { knrCode: "KNR 5-08 0401-02", laborNorm: 0.300 },
  // RCD 2P
  "rcd-30":          { knrCode: "KNR 5-08 0401-03", laborNorm: 0.250 },
  "rcd-30-a":        { knrCode: "KNR 5-08 0401-03", laborNorm: 0.250 },
  "rcd-30-f":        { knrCode: "KNR 5-08 0401-03", laborNorm: 0.250 },
  "rcd-300":         { knrCode: "KNR 5-08 0401-05", laborNorm: 0.250 },
  // RCD 4P
  "rcd-30-4p":       { knrCode: "KNR 5-08 0401-04", laborNorm: 0.350 },
  "rcd-300-4p":      { knrCode: "KNR 5-08 0401-05", laborNorm: 0.250 },
  // RCBO 1P (all subtypes)
  "rcbo":            { knrCode: "KNR 5-08 0401-06", laborNorm: 0.300 },
  "rcbo-b":          { knrCode: "KNR 5-08 0401-06", laborNorm: 0.300 },
  "rcbo-a":          { knrCode: "KNR 5-08 0401-06", laborNorm: 0.300 },
  "rcbo-f":          { knrCode: "KNR 5-08 0401-06", laborNorm: 0.300 },
  // SPD 1-phase
  "spd-t2":          { knrCode: "KNR 5-08 0402-01", laborNorm: 0.500 },
  "spd-t1t2":        { knrCode: "KNR 5-08 0402-01", laborNorm: 0.500 },
  // SPD 3-phase
  "spd-t2-3p":       { knrCode: "KNR 5-08 0402-02", laborNorm: 0.600 },
  "spd-t1t2-3p":     { knrCode: "KNR 5-08 0402-02", laborNorm: 0.600 },
  // Main switches / Rozlączniki
  "main-switch-1p":  { knrCode: "KNR 5-08 0403-01", laborNorm: 0.600 },
  "main-switch-3p":  { knrCode: "KNR 5-08 0403-01", laborNorm: 0.600 },
  // MCCB 100A–630A (prefix match handles all variants)
  "mccb":            { knrCode: "KNR 5-08 0403-02", laborNorm: 1.500 },
  "mccb-motor":      { knrCode: "KNR 5-08 0403-02", laborNorm: 1.500 },
  // ACB 800A–1600A
  "acb":             { knrCode: "KNR 5-08 0403-02", laborNorm: 3.000 },
  // ATS / SZR
  "ats":             { knrCode: "KNR 5-08 0403-03", laborNorm: 6.000 },
  "changeover":      { knrCode: "KNR 5-08 0403-03", laborNorm: 6.000 },
  // Liczniki
  "meter-1p":        { knrCode: "KNR 5-08 0501-01", laborNorm: 1.000 },
  "meter-3p":        { knrCode: "KNR 5-08 0501-02", laborNorm: 1.200 },
  // ZUG terminal blocks
  "zug-block":       { knrCode: "KNR 5-08 0701-01", laborNorm: 0.100 },
  // Szyny DIN / magistrale
  "busbar-3p":       { knrCode: "KNR 5-08 0702-01", laborNorm: 0.200 },
  "busbar-2p":       { knrCode: "KNR 5-08 0702-01", laborNorm: 0.150 },
  "pe-bar":          { knrCode: "KNR 5-08 0702-01", laborNorm: 0.100 },
  "n-bar":           { knrCode: "KNR 5-08 0702-01", laborNorm: 0.100 },
  // Contactors
  "contactor-1p":    { knrCode: "KNR 5-08 0401-01", laborNorm: 0.350 },
  "contactor-2p":    { knrCode: "KNR 5-08 0401-02", laborNorm: 0.350 },
  "contactor-3p":    { knrCode: "KNR 5-08 0401-02", laborNorm: 0.400 },
  // Timers
  "timer-astro":     { knrCode: "KNR 5-08 0401-01", laborNorm: 0.350 },
  "timer-cyclic":    { knrCode: "KNR 5-08 0401-01", laborNorm: 0.300 },
  "staircase-timer": { knrCode: "KNR 5-08 0401-01", laborNorm: 0.300 },
  // Monitoring relays
  "overvoltage-relay":  { knrCode: "KNR 5-08 0401-01", laborNorm: 0.300 },
  "current-relay":      { knrCode: "KNR 5-08 0401-01", laborNorm: 0.300 },
  "phase-sequence":     { knrCode: "KNR 5-08 0401-01", laborNorm: 0.300 },
  // UPS DIN rail
  "ups-rail":           { knrCode: "KNR 5-08 0401-07", laborNorm: 2.000 },
};

/** Prefix-match: "mccb-100a" → MODULE_KNR_MAP["mccb"]. Longer prefixes win. */
function resolveModuleKnr(moduleId: string): KnrModuleEntry | null {
  if (MODULE_KNR_MAP[moduleId]) return MODULE_KNR_MAP[moduleId];
  const sortedKeys = Object.keys(MODULE_KNR_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sortedKeys) {
    if (moduleId.startsWith(prefix)) return MODULE_KNR_MAP[prefix];
  }
  return null;
}

/** KNR 5-08 0101-XX: enclosure assembly labor by module capacity */
function resolveEnclosureKnr(moduleCount: number): KnrModuleEntry {
  if (moduleCount <= 24) return { knrCode: "KNR 5-08 0101-01", laborNorm: 4.0 };
  if (moduleCount <= 48) return { knrCode: "KNR 5-08 0101-02", laborNorm: 6.0 };
  if (moduleCount <= 72) return { knrCode: "KNR 5-08 0101-03", laborNorm: 8.0 };
  if (moduleCount <= 96) return { knrCode: "KNR 5-08 0101-04", laborNorm: 10.0 };
  return { knrCode: "KNR 5-08 0101-05", laborNorm: 14.0 };
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function pricePanelWithAI(
  request: PricingRequest
): Promise<PricingResult> {
  const { panelName, manufacturerId, manufacturerCoeff, sections, expertDirectives, userId } = request;

  // Validate & clamp voivodeshipModifier: if voivodeshipName provided, use canonical value
  // Otherwise clamp raw value to safe range [0.80..1.30] to prevent prompt injection
  let voivodeshipModifier = request.voivodeshipModifier;
  if (request.voivodeshipName && VOIVODESHIP_MODIFIERS[request.voivodeshipName] !== undefined) {
    voivodeshipModifier = VOIVODESHIP_MODIFIERS[request.voivodeshipName];
  } else {
    voivodeshipModifier = Math.max(0.80, Math.min(1.30, voivodeshipModifier || 1.0));
  }
  interface ProfileRateData {
    hourly_rate?: number | null;
    use_custom_rates?: boolean | null;
    custom_labor_rate?: number | null;
    material_multiplier?: number | null;
  }
  let profileData: ProfileRateData | null = null;
  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("hourly_rate, use_custom_rates, custom_labor_rate, material_multiplier")
      .eq("id", userId)
      .single();
    profileData = data as unknown as ProfileRateData;
  }
  // P1/P2 Iron Rule: use_custom_rates=true → custom_labor_rate; false → hourly_rate
  const laborRateForCalc = profileData?.use_custom_rates
    ? (profileData?.custom_labor_rate ?? null)
    : (profileData?.hourly_rate ?? null);
  const effectiveRate = await getEffectiveRate(
    request.voivodeshipName ?? null,
    laborRateForCalc,
    profileData?.material_multiplier ?? null,
  );
  if (effectiveRate.usedDefaultRate) {
    return {
      success: false,
      source: "fallback",
      confidence: "low",
      voivodeshipModifier,
      manufacturerCoeff,
      sections: [],
      grandTotalMaterial: 0,
      grandTotalLabor: 0,
      grandTotal: 0,
      isEstimate: false,
      error: "Nie ustawiono stawki robocizny. Ustaw stawkę w ustawieniach projektu (PLN/rbh).",
    };
  }
  const laborRatePLN = laborRateForCalc ?? 0;
  const totalModules = sections.reduce((sum, sec) => sum + sec.modules.length + sec.accessories.length, 0);
  if (totalModules === 0) {
    return {
      success: false,
      source: "fallback",
      confidence: "low",
      voivodeshipModifier,
      manufacturerCoeff,
      sections: [],
      grandTotalMaterial: 0,
      grandTotalLabor: 0,
      grandTotal: 0,
      isEstimate: true,
      error: "Brak urządzeń do wyceny.",
    };
  }
  void panelName;
  void manufacturerId;
  void expertDirectives;

  const priceOne = (mod: PricingModule): PricedModule => {
    const qty = mod.quantity || 0;
    const material = Math.round((mod.materialPrice ?? 0) * 100) / 100;
    const knr = resolveModuleKnr(mod.moduleId);
    if (!knr) {
      return {
        moduleId: mod.moduleId,
        namePl: mod.namePl,
        quantity: qty,
        unitMaterial: material,
        unitLabor: 0,
        totalMaterial: Math.round(material * qty * 100) / 100,
        totalLabor: 0,
        knrCode: "",
        isEstimate: true,
        priceSource: "Brak normy ES",
        confidenceLevel: "uncertain",
        confidenceNote: "Brak godziny normy ES. Robocizna zostaje pusta. Materiał z wybranego aparatu.",
      };
    }
    const unitLabor = Math.round(knr.laborNorm * laborRatePLN * 100) / 100;
    return {
      moduleId: mod.moduleId,
      namePl: mod.namePl,
      quantity: qty,
      unitMaterial: material,
      unitLabor,
      totalMaterial: Math.round(material * qty * 100) / 100,
      totalLabor: Math.round(unitLabor * qty * 100) / 100,
      knrCode: knr.knrCode,
      isEstimate: false,
      priceSource: "Norma ES",
      confidenceLevel: "verified",
      confidenceNote: `${knr.laborNorm} rbh × ${Math.round(laborRatePLN)} zł. Województwo dolicza kosztorys.`,
    };
  };

  const pricedSections: PricedSection[] = sections.map((sec) => {
    const enclosureKnr = resolveEnclosureKnr(sec.enclosureModules ?? 36);
    const enclosureLabor = Math.round(enclosureKnr.laborNorm * laborRatePLN * 100) / 100;
    const modules = sec.modules.map(priceOne);
    const accessories = sec.accessories.map(priceOne);
    const sectionTotalMaterial = Math.round((modules.reduce((s, m) => s + m.totalMaterial, 0) + accessories.reduce((s, a) => s + a.totalMaterial, 0)) * 100) / 100;
    const sectionTotalLabor = Math.round((modules.reduce((s, m) => s + m.totalLabor, 0) + accessories.reduce((s, a) => s + a.totalLabor, 0) + enclosureLabor) * 100) / 100;
    return {
      sectionName: sec.sectionName,
      enclosureMaterial: 0,
      enclosureLabor,
      modules,
      accessories,
      sectionTotalMaterial,
      sectionTotalLabor,
    };
  });

  const grandTotalMaterial = Math.round(pricedSections.reduce((s, sec) => s + sec.sectionTotalMaterial, 0) * 100) / 100;
  const grandTotalLabor = Math.round(pricedSections.reduce((s, sec) => s + sec.sectionTotalLabor, 0) * 100) / 100;
  const allMods = pricedSections.flatMap((sec) => [...sec.modules, ...sec.accessories]);
  const verifiedCount = allMods.filter((m) => m.confidenceLevel === "verified").length;

  return {
    success: true,
    source: verifiedCount > 0 ? "KNR" : "fallback",
    confidence: allMods.length === 0 ? "low" : verifiedCount === allMods.length ? "high" : verifiedCount > 0 ? "medium" : "low",
    voivodeshipModifier,
    manufacturerCoeff,
    sections: pricedSections,
    grandTotalMaterial,
    grandTotalLabor,
    grandTotal: Math.round((grandTotalMaterial + grandTotalLabor) * 100) / 100,
    isEstimate: verifiedCount < allMods.length,
  };
}
