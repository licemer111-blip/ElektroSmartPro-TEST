/**
 * AI Expert Advisor Service
 *
 * Centralized intelligence layer that connects Gemini Knowledge Base
 * to ALL app modules (Estimator, Switchboard, Creator, etc.)
 *
 * Two-Stage "AI Auditor" Pattern (for pricing + schemat modules):
 *   Stage 1 — Generator : gemini-2.0-flash        → fast structured JSON output
 *   Stage 2 — Auditor   : AI_MODEL_TIER1 (Tier 1) → verify, fix, return audited result (generateObject)
 *
 * Single-Stage Pattern (all other modules):
 *   1. Query KB (RAG) with timeout → inject context if available
 *   2. Generate structured JSON via Flash
 *   3. Mark source: "KNR" | "GPT-estimate" | "fallback"
 */

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { fetchKbContext, listKbFileNames, fetchUserKbContext } from "@/lib/kb-storage";
import {
  buildSystemPrompt,
  buildDynamicSystemPrompt,
  injectKbContext,
  type AIModule,
  GEMINI_RAG_MODEL,
  GEMINI_PRO_MODEL,
} from "@/lib/ai-master-brain";
import { getExpertDirectives } from "@/app/actions/admin-settings";
import { getEffectiveRate, getBaseRbhRate } from "@/lib/global-benchmarks";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdvisorSource = "KNR" | "GPT-estimate" | "fallback";

export interface AdvisorResult<T> {
  data: T;
  source: AdvisorSource;
  confidence: "high" | "medium" | "low";
  kbExcerpt: string | null;
}

// ─── Auditor types ────────────────────────────────────────────────────────────

export interface AIAuditIssue {
  severity: "critical" | "warning" | "info";
  field: string;
  message: string;
}

export interface AIAuditorResult<T> extends AdvisorResult<T> {
  audited: boolean;
  auditFixed: boolean;
  auditIssues: AIAuditIssue[];
  auditConfidence: "high" | "medium" | "low";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KB_TIMEOUT_MS = 6000;

// Modules that require the two-stage Auditor pass
const AUDITED_MODULES: ReadonlySet<AIModule> = new Set(["pricing", "schemat"]);

// ─── Stage 2: Auditor ─────────────────────────────────────────────────────────

/**
 * Runs the Stage 2 Auditor pass using gemini-2.0-flash (GEMINI_PRO_MODEL).
 * Receives the Stage 1 JSON output, verifies it, and returns a fixed version
 * along with a list of issues found.
 *
 * @param stage1Output  - Serialized JSON from Stage 1 (Flash)
 * @param module        - The originating module ("pricing" | "schemat")
 * @returns             - Parsed fixed JSON + audit metadata
 */
// ─── Zod schema for Auditor response envelope ────────────────────────────────

const AuditIssueSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  field: z.string(),
  message: z.string(),
});

// Generic auditor envelope — wraps any Stage 1 output as unknown JSON
const AuditEnvelopeSchema = z.object({
  fixed: z.boolean().describe("true jeśli Audytor dokonał poprawek w danych Stage 1"),
  confidence: z.enum(["high", "medium", "low"]).describe("Ocena jakości wyniku Stage 1"),
  issues: z.array(AuditIssueSchema).describe("Lista znalezionych problemów (pusta jeśli brak)"),
  data: z.unknown().describe("Poprawiony lub oryginalny obiekt Stage 1"),
});

async function auditWithPro<T>(
  stage1Output: T,
  module: "pricing" | "schemat"
): Promise<{ data: T; fixed: boolean; issues: AIAuditIssue[]; confidence: "high" | "medium" | "low" }> {
  const auditorSystemPrompt = await buildDynamicSystemPrompt("auditor");

  const userPrompt = `MODUŁ: ${module.toUpperCase()}

WYNIK STAGE 1 (do audytu):
${JSON.stringify(stage1Output, null, 2)}

Przeprowadź pełny audyt zgodnie z instrukcjami modułu audytora.
Sprawdź: FIREWALL 1 (Demo Blur), FIREWALL 2 (Split Pricing), Weryfikację Elektryczną, Weryfikację Matematyczną.
Zwróć obiekt JSON z polami: fixed, confidence, issues, data.`;

  const AUDIT_TIMEOUT_MS = 20000;

  const auditPromise = generateObject({
    model: google(GEMINI_PRO_MODEL),
    schema: AuditEnvelopeSchema,
    system: auditorSystemPrompt,
    prompt: userPrompt,
    temperature: 0.0,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Audytor Stage 2 timeout (20s)")), AUDIT_TIMEOUT_MS)
  );

  try {
    const { object } = await Promise.race([auditPromise, timeoutPromise]);

    return {
      data: object.data as T,
      fixed: object.fixed,
      issues: object.issues,
      confidence: object.confidence,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd audytora";
    return {
      data: stage1Output,
      fixed: false,
      issues: [{ severity: "warning", field: "auditor", message: `Audytor Stage 2 niedostępny (${msg}) — zwrócono wynik Stage 1.` }],
      confidence: "medium",
    };
  }
}

// ─── Two-stage wrapper ────────────────────────────────────────────────────────

/**
 * Two-stage expert query for modules that require auditing (pricing, schemat).
 * Stage 1: Flash generates the structured JSON.
 * Stage 2: Pro audits, fixes, and returns the verified result.
 *
 * For all other modules, delegates directly to askExpert() (single-stage).
 */
export async function askExpertWithAudit<T>(
  context: string,
  query: string,
  schema: z.ZodType<T>,
  kbQuery?: string,
  module: AIModule = "estimator",
  expertDirectives?: string,
  userId?: string
): Promise<AIAuditorResult<T>> {
  // Stage 1 — always run Flash generation
  const stage1Result = await askExpert(context, query, schema, kbQuery, module, expertDirectives, userId);

  // Only audit for pricing + schemat modules
  if (!AUDITED_MODULES.has(module)) {
    return {
      ...stage1Result,
      audited: false,
      auditFixed: false,
      auditIssues: [],
      auditConfidence: stage1Result.confidence,
    };
  }

  // Stage 2 — Pro auditor pass
  const auditResult = await auditWithPro(stage1Result.data, module as "pricing" | "schemat");

  return {
    data: auditResult.data,
    source: stage1Result.source,
    confidence: auditResult.confidence,
    kbExcerpt: stage1Result.kbExcerpt,
    audited: true,
    auditFixed: auditResult.fixed,
    auditIssues: auditResult.issues,
    auditConfidence: auditResult.confidence,
  };
}

// ─── Core: KB retrieval via Supabase Storage (System B — single source of truth) ─

interface UserRateProfile {
  hourly_rate: number | null;
  use_custom_rates: boolean | null;
  custom_labor_rate: number | null;
}

async function fetchUserEffectiveRate(userId: string): Promise<number | null> {
  try {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("hourly_rate")
      .eq("id", userId)
      .single();
    if (!data) return null;
    const rate = (data as { hourly_rate?: number | null }).hourly_rate ?? null;
    const result = await getEffectiveRate(null, rate);
    return result.laborRate;
  } catch {
    return null;
  }
}

/**
 * Filters KB filenames by relevance to the query using filename keyword matching.
 * Falls back to ALL files when no match found (never discards context silently).
 * This avoids loading the entire KB for every query — O(n files) not O(n*m chars).
 */
function selectRelevantKbFiles(fileNames: string[], query: string): string[] {
  if (!query || query.length < 8 || fileNames.length <= 3) return fileNames;

  // Extract meaningful tokens from the query (>3 chars, not stop words)
  const STOP = new Set(["dla", "przy", "lub", "jest", "jak", "ile", "czy", "jako", "the", "and", "for"]);
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3 && !STOP.has(t));

  if (queryTokens.length === 0) return fileNames;

  // Score each file: how many query tokens appear in the filename
  const scored = fileNames.map((f) => {
    const nameLower = f.toLowerCase();
    const score = queryTokens.reduce((s, t) => s + (nameLower.includes(t) ? 1 : 0), 0);
    return { f, score };
  });

  const relevant = scored.filter((x) => x.score > 0).map((x) => x.f);

  // Always include "general" / "normy" / "cennik" files regardless of query
  const alwaysInclude = fileNames.filter((f) => {
    const n = f.toLowerCase();
    return n.includes("general") || n.includes("normy") || n.includes("cennik") || n.includes("katalog");
  });

  const merged = [...new Set([...relevant, ...alwaysInclude])];
  return merged.length > 0 ? merged : fileNames;
}

async function fetchGlobalKBContext(query: string): Promise<string | null> {
  try {
    const fileNames = await Promise.race([
      listKbFileNames(),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), KB_TIMEOUT_MS)),
    ]);
    if (!fileNames || fileNames.length === 0) return null;

    const relevantFiles = selectRelevantKbFiles(fileNames, query);

    const context = await Promise.race([
      fetchKbContext(relevantFiles, "knr_knowledge_base"),
      new Promise<string>((resolve) => setTimeout(() => resolve(""), KB_TIMEOUT_MS)),
    ]);
    return context && context.length > 30 ? context : null;
  } catch {
    return null;
  }
}

// ─── Core: askExpert ──────────────────────────────────────────────────────────

/**
 * Generic expert query. Returns structured JSON validated by the provided Zod schema.
 * Uses Master Brain (lib/ai-master-brain.ts) as the single source of truth for
 * system instructions, 4 Iron Rules, and module-specific context.
 *
 * @param context  - Background context for the AI (e.g. current project data)
 * @param query    - The specific question to answer
 * @param schema   - Zod schema for the expected JSON output
 * @param kbQuery  - Optional separate query for KB (defaults to `query`)
 * @param module   - Which AI module is calling (governs system prompt variant)
 */
export async function askExpert<T>(
  context: string,
  query: string,
  schema: z.ZodType<T>,
  kbQuery?: string,
  module: AIModule = "estimator",
  expertDirectivesOverride?: string,
  userId?: string
): Promise<AdvisorResult<T>> {
  // Load global KB + expert directives + user KB + user hourly_rate in parallel
  const [globalKbContext, loadedDirectives, userKbContext, userProfile] = await Promise.all([
    fetchGlobalKBContext(kbQuery ?? query),
    expertDirectivesOverride !== undefined
      ? Promise.resolve(expertDirectivesOverride)
      : getExpertDirectives().catch(() => ""),
    userId ? fetchUserKbContext(userId).catch(() => null) : Promise.resolve(null),
    userId ? fetchUserEffectiveRate(userId) : Promise.resolve(null),
  ]);

  const expertDirectives = expertDirectivesOverride ?? loadedDirectives;
  const source: AdvisorSource = (globalKbContext || userKbContext) ? "KNR" : "GPT-estimate";

  // Build system prompt — pass user's effective rate so {rbh_rate} resolves correctly
  const userRate = userProfile as number | null;
  const basePrompt = await buildDynamicSystemPrompt(module, undefined, expertDirectives, userRate ?? undefined);
  const userRateContext = userRate
    ? `<user_settings>\nStawka robocizny użytkownika: ${userRate} PLN/rbh.\nJest to JEDYNA stawka do wyliczenia labor_price. Nie istnieje żadna stawka domyślna ani globalna.\n</user_settings>`
    : `<user_settings>\nBrak stawki robocizny. Nie wyliczaj cen robocizny PLN — podaj wyłącznie nakłady rbh z KNR.\n</user_settings>`;

  // Combine: base prompt + user settings + global KB + user private KB (highest priority)
  let systemPrompt = injectKbContext(basePrompt, globalKbContext);
  if (userRateContext) systemPrompt += "\n\n" + userRateContext;
  if (userKbContext) systemPrompt += "\n\n" + userKbContext;

  const userPrompt = context
    ? `KONTEKST ZADANIA:\n${context}\n\nPYTANIE:\n${query}`
    : query;

  const { object } = await generateObject({
    model: google(GEMINI_RAG_MODEL),
    schema,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.1,
  });

  return {
    data: object,
    source,
    confidence: (globalKbContext || userKbContext) ? "high" : "medium",
    kbExcerpt: globalKbContext ?? userKbContext,
  };
}

// ─── Module 1: Estimator — suggestLaborTime ───────────────────────────────────

const LaborTimeSchema = z.object({
  knrCode: z.string().describe("Kod KNR np. KNR 5-04 0101-01"),
  taskName: z.string().describe("Nazwa czynności wg KNR"),
  unit: z.string().describe("Jednostka miary: rbh, m, szt, kpl"),
  laborHours: z.number().describe("Nakład robocizny w rbh na jednostkę"),
  laborPricePerUnit: z.number().describe("Cena robocizny netto PLN za jednostkę (stawka rynkowa 2026 wg regionu)"),
  materialHint: z.string().describe("Główne materiały potrzebne do wykonania"),
  notes: z.string().describe("Uwagi: trudność, warunki, norma"),
  isEstimate: z.boolean().describe("true jeśli brak danych KNR — to szacunek"),
});

export type LaborTimeSuggestion = z.infer<typeof LaborTimeSchema>;

/**
 * Estimator module: look up KNR norms for a task and return labor time + price.
 * @param taskDescription - e.g. "montaż gniazdka podtynkowego 230V"
 * @param regionName      - e.g. "Mazowieckie" (affects labor rate)
 * @param priceModifier   - regional multiplier 0.85–1.25 (default 1.0)
 */
export async function suggestLaborTime(
  taskDescription: string,
  regionName = "Polska",
  priceModifier = 1.0,
  userId?: string
): Promise<AdvisorResult<LaborTimeSuggestion>> {
  const globalRate = await getBaseRbhRate();
  const baseRate = Math.round(globalRate * priceModifier);
  return askExpert(
    `Region: ${regionName} (współczynnik cenowy: ${priceModifier}). Stawka robocizny dla tego regionu: ~${baseRate} PLN/rbh netto.`,
    `Znajdź nakład robocizny wg KNR dla zadania: "${taskDescription}".
Podaj: kod KNR, nazwę czynności, jednostkę, rbh/jednostkę, cenę robocizny netto PLN.
Stawka robocizny: ${baseRate} PLN/rbh (region: ${regionName}, współczynnik: ${priceModifier}).
Jeśli brak w KNR — podaj szacunek i ustaw isEstimate=true.`,
    LaborTimeSchema,
    `KNR nakład robocizny ${taskDescription}`,
    "estimator",
    undefined,
    userId
  );
}

// ─── Module 2: Switchboard — validateComponentCompatibility ───────────────────

const CompatibilitySchema = z.object({
  compatible: z.boolean().describe("Czy komponenty są kompatybilne"),
  reason: z.string().describe("Uzasadnienie technicznie (norma, producent, parametry)"),
  warnings: z.array(z.string()).describe("Lista ostrzeżeń technicznych"),
  recommendations: z.array(z.string()).describe("Zalecenia montażowe"),
  normReference: z.string().describe("Odniesienie do normy np. PN-HD 60364-4-41, IEC 60947"),
  isEstimate: z.boolean().describe("true jeśli brak danych katalogowych — to ocena ogólna"),
});

export type CompatibilityResult = z.infer<typeof CompatibilitySchema>;

/**
 * Switchboard module: validate if two components can be connected.
 * @param componentA - e.g. "Legrand TX3 16A B-char"
 * @param componentB - e.g. "Hager CDA440D RCD 40A 30mA"
 */
export async function validateComponentCompatibility(
  componentA: string,
  componentB: string
): Promise<AdvisorResult<CompatibilityResult>> {
  return askExpert(
    `Komponent A: ${componentA}\nKomponent B: ${componentB}`,
    `Sprawdź czy można bezpośrednio połączyć "${componentA}" z "${componentB}" w rozdzielnicy elektrycznej.
Oceń kompatybilność pod względem: prądu znamionowego, charakterystyki wyzwalania, selektywności, norm IEC/PN.
Podaj ostrzeżenia i zalecenia montażowe.`,
    CompatibilitySchema,
    `kompatybilność ${componentA} ${componentB} rozdzielnica`,
    "switchboard"
  );
}

// ─── Module 3: Creator — suggestProjectTemplate ───────────────────────────────

const ProjectTemplateSchema = z.object({
  objectType: z.string().describe("Typ obiektu np. Mieszkanie, Dom jednorodzinny, Biuro"),
  recommendedSystems: z.array(z.object({
    system: z.string().describe("Nazwa systemu np. Instalacja oświetleniowa, Smart Home, PV"),
    priority: z.enum(["obowiązkowy", "zalecany", "opcjonalny"]),
    norm: z.string().describe("Norma lub przepis np. PN-HD 60364-7-701"),
    estimatedPoints: z.number().describe("Szacowana liczba punktów/obwodów"),
    estimatedMaterialCostPLN: z.number().describe("Szacowany koszt materiałów netto PLN (bez robocizny)"),
    estimatedLaborCostPLN: z.number().describe("Szacowany koszt robocizny netto PLN (bez materiałów)"),
  })),
  totalEstimatedMaterialCostPLN: z.number().describe("Łączny koszt materiałów netto PLN"),
  totalEstimatedLaborCostPLN: z.number().describe("Łączny koszt robocizny netto PLN"),
  keyNorms: z.array(z.string()).describe("Kluczowe normy dla tego obiektu"),
  notes: z.string().describe("Uwagi projektowe i specyfika obiektu"),
  isEstimate: z.boolean().describe("true jeśli brak danych z bazy — to szacunek ogólny"),
});

export type ProjectTemplateSuggestion = z.infer<typeof ProjectTemplateSchema>;

/**
 * Creator module: suggest recommended electrical systems for a project description.
 * @param description - e.g. "dom jednorodzinny 150m2, 3 sypialnie, garaż, ogród"
 */
export async function suggestProjectTemplate(
  description: string
): Promise<AdvisorResult<ProjectTemplateSuggestion>> {
  return askExpert(
    "",
    `Na podstawie polskich norm elektrycznych dla obiektu: "${description}",
wymień zalecane systemy instalacyjne (oświetlenie, gniazda, Smart Home, Alarm, PV, EV, odgromowa itp.).
Dla każdego systemu podaj: priorytet (obowiązkowy/zalecany/opcjonalny), normę, szacowaną liczbę punktów.
SPLIT PRICING (OBOWIĄZKOWE): podaj OSOBNO estimatedMaterialCostPLN (tylko materiały) i estimatedLaborCostPLN (tylko robocizna). NIGDY nie łącz ich w jedną kwotę.
Ceny netto PLN 2026. Uwzględnij specyfikę polskiego rynku i wymagania WT 2021.`,
    ProjectTemplateSchema,
    `normy instalacje elektryczne ${description} WT 2021`,
    "creator"
  );
}
