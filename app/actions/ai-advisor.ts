"use server";

import { logger } from "@/lib/logger";
/**
 * AI Advisor — Server Actions
 *
 * Thin wrappers over ai-advisor.service.ts for use in frontend components.
 * Each action returns a typed result + metadata (source, confidence).
 * Safe defaults are returned if AI fails completely.
 */

import {
  suggestLaborTime,
  validateComponentCompatibility,
  suggestProjectTemplate,
  type LaborTimeSuggestion,
  type CompatibilityResult,
  type ProjectTemplateSuggestion,
  type AdvisorSource,
} from "@/server/services/ai-advisor.service";

// ─── Shared result wrapper ────────────────────────────────────────────────────

interface ActionResult<T> {
  success: boolean;
  data: T;
  source: AdvisorSource | "fallback";
  confidence: "high" | "medium" | "low";
  kbExcerpt: string | null;
  error?: string;
}

// ─── ACTION 1: Estimator — consultEstimator ───────────────────────────────────

const LABOR_FALLBACK: LaborTimeSuggestion = {
  knrCode: "—",
  taskName: "Brak danych KNR",
  unit: "szt",
  laborHours: 0,
  laborPricePerUnit: 0,
  materialHint: "Brak sugestii",
  notes: "Nie udało się pobrać danych. Wprowadź wartości ręcznie.",
  isEstimate: true,
};

/**
 * Estimator: look up KNR norms for a task description.
 * Returns labor hours, unit, price, and material hints.
 *
 * @example
 * const result = await consultEstimator("montaż gniazdka podtynkowego 230V");
 * // result.data.laborHours === 0.35
 * // result.data.knrCode === "KNR 5-04 0101-01"
 * // result.source === "KNR" | "GPT-estimate"
 */
export async function consultEstimator(
  taskDescription: string,
  regionName = "Polska",
  priceModifier = 1.0
): Promise<ActionResult<LaborTimeSuggestion>> {
  try {
    const result = await suggestLaborTime(taskDescription, regionName, priceModifier);
    return {
      success: true,
      data: result.data,
      source: result.source,
      confidence: result.confidence,
      kbExcerpt: result.kbExcerpt,
    };
  } catch (error) {
    logger.error("[AI Advisor] consultEstimator failed:", {}, error);
    return {
      success: false,
      data: LABOR_FALLBACK,
      source: "fallback",
      confidence: "low",
      kbExcerpt: null,
      error: "Nie udało się pobrać danych KNR. Wprowadź wartości ręcznie.",
    };
  }
}

// ─── ACTION 2: Switchboard — consultSwitchboard ───────────────────────────────

const COMPATIBILITY_FALLBACK: CompatibilityResult = {
  compatible: true,
  reason: "Brak danych katalogowych — nie można zweryfikować automatycznie.",
  warnings: ["Sprawdź kompatybilność ręcznie w dokumentacji producenta."],
  recommendations: ["Zweryfikuj prądy znamionowe i charakterystyki wyzwalania."],
  normReference: "PN-HD 60364-4-43",
  isEstimate: true,
};

/**
 * Switchboard: validate compatibility of two components.
 * Returns warnings, recommendations, and norm references.
 *
 * @example
 * const result = await consultSwitchboard(["Legrand TX3 16A B", "Hager CDA440D RCD 40A 30mA"]);
 * // result.data.compatible === true
 * // result.data.warnings === ["Sprawdź selektywność..."]
 */
export async function consultSwitchboard(
  components: string[]
): Promise<ActionResult<CompatibilityResult>> {
  if (components.length < 2) {
    return {
      success: false,
      data: COMPATIBILITY_FALLBACK,
      source: "fallback",
      confidence: "low",
      kbExcerpt: null,
      error: "Podaj co najmniej 2 komponenty do weryfikacji.",
    };
  }

  try {
    const [componentA, componentB, ...rest] = components;
    const fullContext = rest.length > 0
      ? `${componentA} + ${componentB} (pozostałe: ${rest.join(", ")})`
      : undefined;

    const result = await validateComponentCompatibility(
      fullContext ?? componentA,
      componentB
    );
    return {
      success: true,
      data: result.data,
      source: result.source,
      confidence: result.confidence,
      kbExcerpt: result.kbExcerpt,
    };
  } catch (error) {
    logger.error("[AI Advisor] consultSwitchboard failed:", {}, error);
    return {
      success: false,
      data: COMPATIBILITY_FALLBACK,
      source: "fallback",
      confidence: "low",
      kbExcerpt: null,
      error: "Nie udało się zweryfikować kompatybilności. Sprawdź ręcznie.",
    };
  }
}

// ─── ACTION 3: Creator — consultCreator ──────────────────────────────────────

const TEMPLATE_FALLBACK: ProjectTemplateSuggestion = {
  objectType: "Obiekt mieszkalny",
  recommendedSystems: [
    {
      system: "Instalacja oświetleniowa",
      priority: "obowiązkowy",
      norm: "PN-HD 60364-5-55",
      estimatedPoints: 20,
      estimatedMaterialCostPLN: 2400,
      estimatedLaborCostPLN: 1600,
    },
    {
      system: "Instalacja gniazd 230V",
      priority: "obowiązkowy",
      norm: "PN-HD 60364-7-701",
      estimatedPoints: 30,
      estimatedMaterialCostPLN: 3600,
      estimatedLaborCostPLN: 2400,
    },
    {
      system: "Rozdzielnica główna",
      priority: "obowiązkowy",
      norm: "PN-EN 61439-3",
      estimatedPoints: 1,
      estimatedMaterialCostPLN: 2000,
      estimatedLaborCostPLN: 1500,
    },
  ],
  totalEstimatedMaterialCostPLN: 8000,
  totalEstimatedLaborCostPLN: 5500,
  keyNorms: ["PN-HD 60364-4-41", "PN-HD 60364-5-52", "WT 2021"],
  notes: "Dane szacunkowe — baza wiedzy niedostępna. Dostosuj do specyfiki obiektu.",
  isEstimate: true,
};

/**
 * Creator: suggest recommended electrical systems for a project.
 * Returns prioritized systems with norms, point counts, and cost estimates.
 *
 * @example
 * const result = await consultCreator("dom jednorodzinny 150m2, garaż, ogród");
 * // result.data.recommendedSystems[0].system === "Instalacja oświetleniowa"
 * // result.data.recommendedSystems[0].priority === "obowiązkowy"
 */
export async function consultCreator(
  projectRequirements: string
): Promise<ActionResult<ProjectTemplateSuggestion>> {
  try {
    const result = await suggestProjectTemplate(projectRequirements);
    return {
      success: true,
      data: result.data,
      source: result.source,
      confidence: result.confidence,
      kbExcerpt: result.kbExcerpt,
    };
  } catch (error) {
    logger.error("[AI Advisor] consultCreator failed:", {}, error);
    return {
      success: false,
      data: TEMPLATE_FALLBACK,
      source: "fallback",
      confidence: "low",
      kbExcerpt: null,
      error: "Nie udało się wygenerować szablonu. Użyto wartości domyślnych.",
    };
  }
}
