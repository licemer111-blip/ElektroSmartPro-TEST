"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage, getAiUsageInfo, getAiFunctionUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES, FUNCTION_LIMITS, DEMO_AI_LIMIT, PRO_AI_LIMIT } from "@/lib/ai-quota-config";
import { rateLimitAI } from "@/lib/rate-limit";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import type { AIAuditIssue } from "@/server/services/ai-advisor.service";
import { buildDynamicSystemPrompt, GEMINI_PRO_MODEL } from "@/lib/ai-master-brain";
import { SCHEMAT_SYSTEM_PROMPT } from "@/lib/ai/prompts/schemat-prompts";

// ── Types for the circuit tree ──
export interface CircuitNode {
  uid: string;
  moduleId: string;
  namePl: string;
  type: "main_switch" | "spd" | "rcd" | "rcbo" | "mcb" | "contactor" | "motor_starter" | "timer" | "monitoring" | "other";
  rating?: number;
  label?: string;
  circuitNumber?: string;
  cableType?: string;
  phase?: "L1" | "L2" | "L3"; // Phase assignment for 1-phase devices
  children?: CircuitNode[];
}

export interface SectionTree {
  sectionName: string;
  feed: string;
  supply: string;
  nodes: CircuitNode[];
}

interface ModuleInput {
  uid: string;
  moduleId: string;
  name: string;
  namePl: string;
  category: string;
  rating?: number;
  label?: string;
  circuitNumber?: string;
  cableType?: string;
  modules: number;
}

// ── Non-electrical categories to skip ──
const SKIP_CATEGORIES = ["wiring", "consumable", "terminal", "enclosure", "labor"];

// ── Category → CircuitNode type mapping ──
function mapType(m: ModuleInput): CircuitNode["type"] {
  if (m.moduleId.startsWith("main-switch") || m.moduleId.startsWith("mccb") || m.moduleId.startsWith("acb") || m.moduleId.startsWith("szr")) return "main_switch";
  if (m.category === "spd") return "spd";
  if (m.category === "rcd") return "rcd";
  if (m.category === "rcbo") return "rcbo";
  if (m.category === "contactor") return "contactor";
  if (m.category === "motor_control") return "motor_starter";
  if (m.category === "timer") return "timer";
  if (m.category === "monitoring") return "monitoring";
  if (m.category === "breaker") return "mcb";
  return "other";
}

function toNode(m: ModuleInput): CircuitNode {
  return {
    uid: m.uid,
    moduleId: m.moduleId,
    namePl: m.namePl,
    type: mapType(m),
    rating: m.rating,
    label: m.label,
    circuitNumber: m.circuitNumber,
    cableType: m.cableType,
  };
}

// ── Local (deterministic) tree builder — reliable fallback ──
function buildTreeLocally(modules: ModuleInput[]): CircuitNode[] {
  const electrical = modules.filter(m => !SKIP_CATEGORIES.includes(m.category));
  const nodes: CircuitNode[] = [];

  // 1. Main switches first
  const mainSwitches = electrical.filter(m => mapType(m) === "main_switch");
  for (const ms of mainSwitches) nodes.push(toNode(ms));

  // 2. SPDs
  const spds = electrical.filter(m => m.category === "spd");
  for (const s of spds) nodes.push(toNode(s));

  // 3. Walk modules in order — group MCBs under preceding RCD
  const remaining = electrical.filter(m =>
    mapType(m) !== "main_switch" && m.category !== "spd"
  );

  let currentRcd: CircuitNode | null = null;
  const pendingChildren: CircuitNode[] = [];

  for (const m of remaining) {
    const t = mapType(m);

    if (t === "rcd") {
      // Flush previous RCD group
      if (currentRcd) {
        currentRcd.children = [...pendingChildren];
        nodes.push(currentRcd);
        pendingChildren.length = 0;
      }
      currentRcd = toNode(m);
      currentRcd.children = [];
    } else if (t === "rcbo") {
      // RCBO is standalone — flush if there's a pending RCD with no children yet
      nodes.push(toNode(m));
    } else if (currentRcd && (t === "mcb" || t === "contactor" || t === "motor_starter" || t === "timer")) {
      pendingChildren.push(toNode(m));
    } else {
      // No active RCD — direct connection to bus
      nodes.push(toNode(m));
    }
  }

  // Flush last RCD group
  if (currentRcd) {
    currentRcd.children = [...pendingChildren];
    nodes.push(currentRcd);
  }

  return nodes;
}

// ── Deterministic post-processor — the "Expert Brains" ──────────────────────
// Runs after AI output. Fixes grouping errors, assigns phases, warns about issues.

function getMaxChildren(rating: number): number {
  if (rating <= 25) return 3;
  if (rating <= 40) return 6;
  if (rating <= 100) return 8;
  return 12;
}

function is3PModule(moduleId: string): boolean {
  return /3p|4p|3-pol|4-pol|3ph|4ph/i.test(moduleId);
}

function fixSchematTree(inputNodes: CircuitNode[]): { nodes: CircuitNode[]; fixes: string[] } {
  // Deep clone to avoid mutating AI result
  const nodes: CircuitNode[] = JSON.parse(JSON.stringify(inputNodes)) as CircuitNode[];
  const fixes: string[] = [];

  const phases: ("L1" | "L2" | "L3")[] = ["L1", "L2", "L3"];
  let phaseCounter = 0;

  const is3Phase = nodes.some(n => n.type === "main_switch" && is3PModule(n.moduleId));

  function assignPhase(node: CircuitNode): void {
    if (!is3Phase) return;
    if (node.phase) return;
    if (node.type !== "mcb" && node.type !== "rcbo") return;
    if (is3PModule(node.moduleId)) return;
    node.phase = phases[phaseCounter % 3];
    phaseCounter++;
  }

  // Pass 1: fix each RCD group
  const orphans: CircuitNode[] = [];
  const rcdNodes = nodes.filter(n => n.type === "rcd");

  for (let i = 0; i < rcdNodes.length; i++) {
    const rcd = rcdNodes[i];
    if (!rcd.children || rcd.children.length === 0) continue;

    const rcdRating = rcd.rating ?? 40;
    const maxC = getMaxChildren(rcdRating);

    // Warn if any child MCB > RCD rating (hard electrical error)
    const overRated = rcd.children.filter(c => (c.rating ?? 0) > rcdRating);
    if (overRated.length > 0) {
      fixes.push(`⚠ RCD ${rcdRating}A "${rcd.namePl}": ${overRated.map(c => c.namePl + " " + (c.rating ?? 0) + "A").join(", ")} przekracza prąd RCD — zmień na wyższy RCD`);
    }

    // Redistribute excess children to next RCD
    if (rcd.children.length > maxC) {
      const excess = rcd.children.splice(maxC);
      const nextRcd = rcdNodes[i + 1];
      if (nextRcd) {
        nextRcd.children = [...excess, ...(nextRcd.children ?? [])];
        fixes.push(`↗ Przeniesiono ${excess.length} obw. z "${rcd.namePl}" → "${nextRcd.namePl}" (max ${maxC} dla ${rcdRating}A)`);
      } else {
        orphans.push(...excess);
        fixes.push(`↗ ${excess.length} obw. z "${rcd.namePl}" → szyna główna (brak kolejnego RCD)`);
      }
    }

    // Assign phases to children
    for (const child of rcd.children) assignPhase(child);
  }

  // Pass 2: insert orphans after last RCD
  if (orphans.length > 0) {
    const lastRcdIdx = nodes.reduce((max, n, i) => n.type === "rcd" ? i : max, -1);
    nodes.splice(lastRcdIdx + 1, 0, ...orphans);
  }

  // Pass 3: assign phases to top-level 1P MCBs
  for (const node of nodes) assignPhase(node);

  return { nodes, fixes };
}

// ── Count all nodes in tree (including children) ──
function countNodes(nodes: CircuitNode[]): number {
  let c = 0;
  for (const n of nodes) {
    c++;
    if (n.children) c += countNodes(n.children);
  }
  return c;
}

const SYSTEM_PROMPT = SCHEMAT_SYSTEM_PROMPT;

// ── Parse AI JSON response (nodes + optional validationNotes) ──
function parseAiResponse(raw: string): { nodes: CircuitNode[]; validationNotes?: string[] } | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { nodes?: CircuitNode[]; validationNotes?: string[] };
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) return null;
    return { nodes: parsed.nodes, validationNotes: parsed.validationNotes };
  } catch {
    return null;
  }
}

export async function generateSchematWithAI(
  sectionName: string,
  feed: string,
  modules: ModuleInput[]
): Promise<{ success: boolean; tree?: SectionTree; validationNotes?: string[]; error?: string; audited?: boolean; auditFixed?: boolean; auditIssues?: AIAuditIssue[] }> {
  try {
    const { user } = await requireAuth();
    if (!user) return { success: false, error: "Wymagane logowanie" };

    const aiCheck = await checkAndIncrementAiUsage(user.id, "generateSchemat");
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    const rateCheck = rateLimitAI(user.id);
    if (!rateCheck.allowed) return { success: false, error: "Zbyt wiele zapytań. Poczekaj chwilę." };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "Brak klucza API (GOOGLE_GENERATIVE_AI_API_KEY)" };
    }

    const electricalModules = modules.filter(m => !SKIP_CATEGORIES.includes(m.category));
    if (electricalModules.length === 0) {
      return { success: false, error: "Brak urządzeń elektrycznych w sekcji" };
    }

    const moduleList = electricalModules.map((m, i) =>
      `${i + 1}. uid="${m.uid}" moduleId="${m.moduleId}" category="${m.category}" namePl="${m.namePl}" rating=${m.rating || 0}A${m.label ? ` label="${m.label}"` : ""}${m.circuitNumber ? ` circuit="${m.circuitNumber}"` : ""}${m.cableType ? ` cable="${m.cableType}"` : ""}`
    ).join("\n");

    const userMessage = `Sekcja: "${sectionName}" (${feed})
ŁĄCZNIE ${electricalModules.length} urządzeń. MUSISZ zwrócić DOKŁADNIE ${electricalModules.length} urządzeń (nodes + children łącznie).

${moduleList}

Zbuduj drzewo hierarchii elektrycznej wg norm PN-EN 61439. Zwróć JSON z polami "nodes" i "validationNotes".`;

    const { text: aiContent } = await generateText({
      model: google(AI_MODEL_TIER1),
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: userMessage },
      ],
      temperature: 0.0,
      maxOutputTokens: 4000,
    });

    if (!aiContent) {
      return {
        success: true,
        tree: { sectionName, feed, supply: "3~ 400V", nodes: buildTreeLocally(modules) },
      };
    }

    const parsed = parseAiResponse(aiContent);
    if (!parsed) {
      return {
        success: true,
        tree: { sectionName, feed, supply: "3~ 400V", nodes: buildTreeLocally(modules) },
      };
    }

    // Validate: AI must return at least 70% of input modules
    const aiNodeCount = countNodes(parsed.nodes);
    const expectedCount = electricalModules.length;

    if (aiNodeCount < expectedCount * 0.7) {
      logger.error(`[ENGINEERING] AI returned ${aiNodeCount}/${expectedCount} nodes — falling back to local`, {});
      return {
        success: true,
        tree: { sectionName, feed, supply: "3~ 400V", nodes: buildTreeLocally(modules) },
        validationNotes: parsed.validationNotes,
      };
    }

    // Stage 1.5 — Deterministic Expert Brains (fixSchematTree)
    // Runs BEFORE audit: fixes RCD grouping, phase assignment, overrated MCB warnings
    const { nodes: fixedNodes, fixes } = fixSchematTree(parsed.nodes);

    // Stage 2 — Auditor pass (gemini-2.0-pro-001)
    const auditResult = await runSchematAudit(fixedNodes, sectionName);

    // Stage 2.5 — Apply fixSchematTree again on audit result (audit may reorder nodes)
    const { nodes: finalNodes } = fixSchematTree(auditResult.nodes);

    return {
      success: true,
      tree: { sectionName, feed, supply: "3~ 400V", nodes: finalNodes },
      validationNotes: [
        ...(parsed.validationNotes ?? []),
        ...(fixes.length > 0 ? [`[AUTO-FIX] Korekcje ES-Engine: ${fixes.join("; ")}`] : []),
        ...(auditResult.issues.map(i => `[${i.severity.toUpperCase()}] ${i.field}: ${i.message}`)),
      ],
      audited: true,
      auditFixed: auditResult.fixed || fixes.length > 0,
      auditIssues: auditResult.issues,
    };
  } catch (err) {
    logger.error("[ENGINEERING] AI schemat generation error:", {}, err);
    return {
      success: true,
      tree: { sectionName, feed, supply: "3~ 400V", nodes: buildTreeLocally(modules) },
    };
  }
}

// ─── Stage 2: Schemat Auditor ─────────────────────────────────────────────────

async function runSchematAudit(
  nodes: CircuitNode[],
  sectionName: string
): Promise<{ nodes: CircuitNode[]; fixed: boolean; issues: AIAuditIssue[] }> {
  try {
    const auditorSystemPrompt = await buildDynamicSystemPrompt("auditor");
    const userPrompt = `MODUŁ: SCHEMAT
SEKCJA: "${sectionName}"

WYNIK STAGE 1 (drzewo obwodów do audytu):
\`\`\`json
${JSON.stringify(nodes, null, 2)}
\`\`\`

Przeprowadź audyt bezpieczeństwa elektrycznego:
- Czy jest główny wyłącznik (main_switch)?
- Czy każda gałąź ma RCD 30mA?
- Czy prądy MCB nie przekraczają prądu RCD nadrzędnego?
- Czy numery obwodów są unikalne?

Zwróć JSON: { fixed: boolean, issues: [{severity, field, message}], nodes: [...poprawione lub oryginalne drzewo...] }`;

    const { text: rawText } = await generateText({
      model: google(GEMINI_PRO_MODEL),
      system: auditorSystemPrompt,
      prompt: userPrompt,
      temperature: 0.0,
      maxOutputTokens: 6000,
    });

    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    const parsed = JSON.parse(jsonStr) as {
      fixed: boolean;
      issues: AIAuditIssue[];
      nodes: CircuitNode[];
    };

    return {
      nodes: Array.isArray(parsed.nodes) && parsed.nodes.length > 0 ? parsed.nodes : nodes,
      fixed: parsed.fixed ?? false,
      issues: parsed.issues ?? [],
    };
  } catch {
    return { nodes, fixed: false, issues: [] };
  }
}

export async function getAiUsage(): Promise<{ used: number; limit: number; isPro: boolean }> {
  try {
    const { user } = await requireAuth();
    if (!user) return { used: 0, limit: DEMO_AI_LIMIT, isPro: false };
    const profile = await getAiUsageInfo(user.id);
    const fnLimits = FUNCTION_LIMITS[AI_FUNCTION_NAMES.aiSchemat];
    const limit = fnLimits
      ? (profile.isPro ? fnLimits.pro : fnLimits.demo)
      : (profile.isPro ? PRO_AI_LIMIT : DEMO_AI_LIMIT);
    const fnInfo = await getAiFunctionUsage(user.id, AI_FUNCTION_NAMES.aiSchemat);
    return { used: fnInfo.used, limit, isPro: profile.isPro };
  } catch {
    return { used: 0, limit: DEMO_AI_LIMIT, isPro: false };
  }
}
