"use server";

import { logger } from "@/lib/logger";
/**
 * AI Pricing Action — Panel Configurator
 *
 * Sends the board JSON to the RAG pipeline (KB + ES-Intelligence v2.1).
 * Returns per-module material + labor prices based on:
 *   - ES-KNR 2026 norms (from Knowledge Base)
 *   - Voivodeship modifier
 *   - Manufacturer coefficient
 */

import { askExpertWithAudit } from "@/server/services/ai-advisor.service";
import { listKbFileNames } from "@/lib/kb-storage";
import { VOIVODESHIP_MODIFIERS } from "@/lib/ai-master-brain";
import { getEffectiveRate, getKnrMultiplier } from "@/lib/global-benchmarks";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

// ── Input types ──────────────────────────────────────────────────────────────

export interface PricingModule {
  moduleId: string;
  namePl: string;
  category: string;
  rating?: number;
  quantity: number;
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

// ── Zod schema for AI response ────────────────────────────────────────────────

const PricedModuleSchema = z.object({
  moduleId: z.string(),
  namePl: z.string(),
  quantity: z.number(),
  unitMaterial: z.number().nullable().describe("Cena materiału netto PLN za 1 szt. NULL jeśli brak danych (UNCERTAIN)"),
  unitLabor: z.number().nullable().describe("Koszt robocizny netto PLN za 1 szt. wg KNR. NULL jeśli brak danych (UNCERTAIN)"),
  totalMaterial: z.number().nullable(),
  totalLabor: z.number().nullable(),
  knrCode: z.string().describe("Kod KNR np. KNR 5-04 0101-01, 'szacunek' lub 'brak'"),
  isEstimate: z.boolean(),
  confidenceLevel: z.enum(["verified", "analog", "estimated", "uncertain"])
    .describe("verified=dokładne trafienie w ES-KNR, analog=znaleziono podobny produkt, estimated=szacunek rynkowy, uncertain=brak danych"),
  confidenceNote: z.string().optional()
    .describe("Dla analog: nazwa znalezionego analogu. Dla uncertain: 'Wymaga wyceny ręcznej'. Dla estimated: 'Szacunek rynkowy 2026'."),
});

const PricedSectionSchema = z.object({
  sectionName: z.string(),
  enclosureMaterial: z.number().describe("Cena obudowy netto PLN"),
  enclosureLabor: z.number().describe("Koszt montażu obudowy netto PLN"),
  modules: z.array(PricedModuleSchema),
  accessories: z.array(PricedModuleSchema),
  sectionTotalMaterial: z.number(),
  sectionTotalLabor: z.number(),
});

const PricingResponseSchema = z.object({
  sections: z.array(PricedSectionSchema),
  grandTotalMaterial: z.number(),
  grandTotalLabor: z.number(),
  grandTotal: z.number(),
  isEstimate: z.boolean(),
});

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
  const materialMultiplier = effectiveRate.matMultiplier;
  const laborRatePLN = effectiveRate.laborRate;
  const knrMultiplier = await getKnrMultiplier();

  const totalModules = sections.reduce(
    (s, sec) => s + sec.modules.length + sec.accessories.length,
    0
  );

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

  const boardJson = JSON.stringify(
    sections.map((sec) => ({
      sekcja: sec.sectionName,
      obudowa: `${sec.enclosureName} (${sec.enclosureModules} mod.)`,
      urzadzenia: sec.modules.map((m) => ({
        id: m.moduleId,
        nazwa: m.namePl,
        kategoria: m.category,
        prad: m.rating ? `${m.rating}A` : undefined,
        ilosc: m.quantity,
      })),
      akcesoria: sec.accessories.map((a) => ({
        id: a.moduleId,
        nazwa: a.namePl,
        kategoria: a.category,
        ilosc: a.quantity,
      })),
    })),
    null,
    2
  );

  const context = `Rozdzielnica: "${panelName}"
Producent: ${manufacturerId} (współczynnik: ×${manufacturerCoeff.toFixed(2)})
Województwo: ${request.voivodeshipName ?? "Nieznane"} (współczynnik: ×${voivodeshipModifier.toFixed(2)})
Stawka robocizny: ${laborRatePLN} PLN/rbh (uwzgl. region ×${effectiveRate.regionModifier.toFixed(2)}) (OBOWIĄZUJE: każda rbh = ${laborRatePLN} PLN netto)
Współczynnik inflacji materiałów: ×${materialMultiplier.toFixed(2)} (stosuj do cen katalogowych)

SKŁAD ROZDZIELNICY (JSON):
${boardJson}`;

  const query = `Wycień tę rozdzielnicę elektryczną zgodnie z normami ES-KNR 2026.

══ POLITYKA ZEROWEJ HALUCYNACJI (OBOWIĄZKOWE) ══
Dla KAŻDEGO urządzenia musisz wykonać następującą klasyfikację:

1. VERIFIED (confidenceLevel="verified") — tylko jeśli masz DOKŁADNE trafienie w bazie ES-KNR po nazwie lub kategorii:
   → Podaj rzeczywistą cenę, knrCode w formacie "KNR X-XX XXXX-XX"
   → isEstimate=false

2. ANALOG (confidenceLevel="analog") — jeśli brak dokładnego trafiania, ale znalazłeś podobny produkt tej samej kategorii:
   → Podaj cenę analogu, w confidenceNote napisz "Analog: [nazwa analogu]"
   → isEstimate=true, knrCode="szacunek"

3. ESTIMATED (confidenceLevel="estimated") — jeśli brak analogu, ale możesz oszacować cenę na podstawie kategorii i przeciętnych cen rynkowych 2026:
   → Podaj szacunkową cenę, confidenceNote="Szacunek rynkowy 2026"
   → isEstimate=true, knrCode="szacunek"

4. UNCERTAIN (confidenceLevel="uncertain") — TYLKO jeśli NIE MASZ ŻADNYCH danych i nie możesz nawet oszacować:
   → unitMaterial=null, unitLabor=null, totalMaterial=null, totalLabor=null
   → knrCode="brak", confidenceNote="Wymaga wyceny ręcznej"
   → isEstimate=true
   ⚠️ NIE WPISUJ LOSOWYCH LICZB. Zostaw null.

══ ZASADY WYCENY ══
1. Ceny materiałów: aktualne ceny rynkowe 2026 netto PLN (bez VAT)
2. Robocizna: wg KNR (Katalogi Nakładów Rzeczowych) × stawka regionalna
3. Podaj BAZOWE ceny materiałów (ceny katalogowe netto PLN bez żadnych współczynników producenta — współczynnik producenta zostanie zastosowany automatycznie)
4. Zastosuj współczynnik regionalny ×${voivodeshipModifier.toFixed(2)} do robocizny
5. Dla obudowy: enclosureMaterial (cena obudowy), enclosureLabor (montaż obudowy)
6. Oblicz sumy sekcji i grand total (null traktuj jako 0 w sumach)

Zwróć kompletny obiekt JSON ze wszystkimi sekcjami, modułami i sumami.`;

  try {
    const [result, kbFiles] = await Promise.all([
      askExpertWithAudit(context, query, PricingResponseSchema, "KNR wycena rozdzielnicy elektrycznej montaż", "pricing", expertDirectives, userId),
      listKbFileNames().catch(() => [] as string[]),
    ]);

    // Derive human-readable price source for each priced module
    // Rule: files starting with "ES-KNR" / "es-knr" are system KNR files → Green badge
    //       other uploaded files are user data → Blue badge
    const isEsKnrFile = (n: string) => n.toLowerCase().startsWith("es-knr");
    const userFile = kbFiles.find(f => !isEsKnrFile(f));
    const kbSourceLabel = kbFiles.length === 0
      ? "ES-KNR 2026"
      : userFile
        ? `User File: ${userFile.replace(/\.json$/i, "")}`
        : kbFiles[0].replace(/\.json$/i, ""); // e.g. "ES-KNR-AUTOMATION" → green via badge

    const deriveSource = (mod: z.infer<typeof PricedModuleSchema>): string => {
      if (mod.confidenceLevel === "uncertain") return "Brak danych";
      if (mod.confidenceLevel === "verified") {
        if (mod.knrCode && mod.knrCode.startsWith("KNR ")) return mod.knrCode;
        return kbSourceLabel;
      }
      if (mod.confidenceLevel === "analog") return "AI Analog";
      if (mod.isEstimate || mod.knrCode === "szacunek") return "AI Szacunek";
      return result.source === "KNR" ? kbSourceLabel : "AI Szacunek";
    };

    // enrichModule: AI handles material price; labor is replaced with deterministic KNR norm.
    // L0 (KNR 5-08 lookup) → L3 (AI fallback) for unmatched modules.
    const enrichModule = (mod: z.infer<typeof PricedModuleSchema>): PricedModule => {
      const baseQty = mod.quantity;
      // Apply manufacturerCoeff deterministically to base material price from AI
      const baseMat = Math.round((mod.unitMaterial ?? 0) * manufacturerCoeff * 100) / 100;
      const knrEntry = resolveModuleKnr(mod.moduleId);

      if (knrEntry) {
        // L0: KNR-verified — deterministic labor, no AI guessing
        const unitLabor = Math.round(knrEntry.laborNorm * knrMultiplier * laborRatePLN * 100) / 100;
        const modStr = "";
        const voivStr = request.voivodeshipName
          ? ` | ${request.voivodeshipName} ×${voivodeshipModifier.toFixed(2)}`
          : "";
        return {
          moduleId: mod.moduleId,
          namePl: mod.namePl,
          quantity: baseQty,
          unitMaterial: baseMat,
          unitLabor,
          totalMaterial: Math.round(baseMat * baseQty * 100) / 100,
          totalLabor: Math.round(unitLabor * baseQty * 100) / 100,
          knrCode: knrEntry.knrCode,
          isEstimate: false,
          priceSource: knrEntry.knrCode,
          confidenceLevel: "verified",
          confidenceNote: `${knrEntry.knrCode} | ${knrEntry.laborNorm} rbh × ${Math.round(laborRatePLN)} PLN/rbh${modStr}${voivStr} | mat ×${manufacturerCoeff.toFixed(2)} (${manufacturerId})`,
        };
      }

      // L3: No KNR match — keep AI estimate (material + labor)
      const unitLabor = mod.unitLabor ?? 0;
      return {
        moduleId: mod.moduleId,
        namePl: mod.namePl,
        quantity: baseQty,
        unitMaterial: baseMat,
        unitLabor,
        totalMaterial: Math.round(baseMat * baseQty * 100) / 100,
        totalLabor: Math.round(unitLabor * baseQty * 100) / 100,
        knrCode: mod.knrCode || "szacunek",
        isEstimate: true,
        priceSource: deriveSource(mod),
        confidenceLevel: mod.confidenceLevel ?? "estimated",
        confidenceNote: mod.confidenceNote ?? `Szacunek rynkowy 2026 (brak normy KNR 5-08) | mat ×${manufacturerCoeff.toFixed(2)} (${manufacturerId})`,
      };
    };

    const pricedSections: PricedSection[] = (result.data?.sections ?? []).map((sec) => {
      // KNR 5-08 0101-XX: enclosure assembly labor by module count (from input sections)
      const inputSec = sections.find(s => s.sectionName === sec.sectionName);
      const enclosureKnr = resolveEnclosureKnr(inputSec?.enclosureModules ?? 36);
      const enclosureLabor = Math.round(
        enclosureKnr.laborNorm * knrMultiplier * laborRatePLN * 100
      ) / 100;
      // Apply manufacturerCoeff to enclosure material price
      const enclosureMaterialWithCoeff = Math.round((sec.enclosureMaterial ?? 0) * manufacturerCoeff * 100) / 100;

      const enrichedModules = (sec.modules ?? []).map(enrichModule);
      const enrichedAccessories = (sec.accessories ?? []).map(enrichModule);

      const sectionTotalMaterial =
        enrichedModules.reduce((s, m) => s + m.totalMaterial, 0) +
        enrichedAccessories.reduce((s, a) => s + a.totalMaterial, 0) +
        enclosureMaterialWithCoeff;
      const sectionTotalLabor =
        enrichedModules.reduce((s, m) => s + m.totalLabor, 0) +
        enrichedAccessories.reduce((s, a) => s + a.totalLabor, 0) +
        enclosureLabor;

      return {
        sectionName: sec.sectionName,
        enclosureMaterial: enclosureMaterialWithCoeff,
        enclosureLabor,
        modules: enrichedModules,
        accessories: enrichedAccessories,
        sectionTotalMaterial: Math.round(sectionTotalMaterial * 100) / 100,
        sectionTotalLabor: Math.round(sectionTotalLabor * 100) / 100,
      };
    });

    // Recompute grand totals from KNR-overridden section data (not from AI output)
    const grandTotalMaterial = Math.round(
      pricedSections.reduce((s, sec) => s + sec.sectionTotalMaterial, 0) * 100
    ) / 100;
    const grandTotalLabor = Math.round(
      pricedSections.reduce((s, sec) => s + sec.sectionTotalLabor, 0) * 100
    ) / 100;
    const grandTotal = Math.round((grandTotalMaterial + grandTotalLabor) * 100) / 100;

    // Derive overall confidence from KNR coverage
    const allMods = pricedSections.flatMap(sec => [...sec.modules, ...sec.accessories]);
    const verifiedCount = allMods.filter(m => m.confidenceLevel === "verified").length;
    const computedSource: "KNR" | "GPT-estimate" | "fallback" =
      verifiedCount > 0 ? "KNR" : "GPT-estimate";
    const computedConfidence: "high" | "medium" | "low" =
      allMods.length === 0 ? "low" :
      verifiedCount === allMods.length ? "high" :
      verifiedCount >= allMods.length * 0.7 ? "medium" : "low";

    return {
      success: true,
      source: computedSource,
      confidence: computedConfidence,
      voivodeshipModifier,
      manufacturerCoeff,
      sections: pricedSections,
      grandTotalMaterial,
      grandTotalLabor,
      grandTotal,
      isEstimate: verifiedCount < allMods.length,
      audited: result.audited,
      auditFixed: result.auditFixed,
      auditIssues: result.auditIssues,
      auditConfidence: result.auditConfidence,
      kbFileNames: kbFiles,
    };
  } catch (error) {
    logger.error("[AI Pricing] pricePanelWithAI failed:", {}, error);
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
      error: "Nie udało się wycenić rozdzielnicy. Spróbuj ponownie.",
    };
  }
}
