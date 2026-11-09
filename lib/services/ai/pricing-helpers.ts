/**
 * pricing-helpers.ts
 * Pure pricing utility functions — zero side-effects, fully testable.
 */

import type { CatalogItemRef, RateSource } from "./catalog-types";

/**
 * Определяет эффективную ставку робоцизны для проекта.
 * Иерархия: project override → user profile → global admin fallback.
 */
export function resolveUserHourlyRate(
  projectHourlyRate: number | null,
  profileHourlyRate: number | null,
  globalFallback = 85
): number {
  return projectHourlyRate ?? profileHourlyRate ?? globalFallback;
}

/**
 * Buduje instrukcję AI na podstawie źródła stawki (RateSource).
 * Źródło: rate_source z profilu użytkownika ('engine' | 'manual').
 * 
 * ZASADA (Iron Rule):
 * - Obie stawki używają norm KNR do wyliczenia labor_price.
 * - labor_price = norma_rg × userHourlyRate. NIGDY nie używaj cen PLN z metadanych.
 * - material_price = koszt materiału za 1 jm (dane katalogowe lub rynkowe 2026).
 */
export function buildRateSourceInstruction(
  rateSource: RateSource,
  userHourlyRate: number
): string {
  const rateLabel = rateSource === "manual"
    ? `WŁASNA STAWKA (${userHourlyRate} PLN/rbh)`
    : `ES-ENGINE 2026 (${userHourlyRate} PLN/rbh)`;

  return `ŹRÓDŁO STAWKI: ${rateLabel}
Nie wymyślaj numeru tabeli i nie nazywaj godziny oficjalnym KNR.
material_price ZAWSZE 0. Nie podawaj ceny hurtowej.
Jak znasz godzinę normy ES: labor_norm_rbh = ta godzina, labor_price = godzina × ${userHourlyRate}.
Jak nie znasz godziny: labor_norm_rbh = 0, labor_price = 0, knr_code pusty.
Nie mnoż przez województwo. Program doliczy je na ekranie.`;
}

/**
 * @deprecated Используй buildRateSourceInstruction(rateSource, rate) вместо этой функции.
 * Оставлена для backward compat с тестами.
 */
export function buildPricingModeInstruction(
  _mode: string,
  userHourlyRate: number
): string {
  return buildRateSourceInstruction("engine", userHourlyRate);
}

/**
 * Строит инструкцию ограничений для режима выцены конкретного поля.
 */
export function buildModeFieldRestriction(
  mode: "material" | "labor" | "all",
  userHourlyRate: number
): string {
  if (mode === "material") {
    return "\n\nKRYTYCZNE: Wyceniasz TYLKO material_price. Ustaw labor_price = 0 dla WSZYSTKICH pozycji bez wyjątku.";
  }
  if (mode === "labor") {
    return `\n\nKRYTYCZNE: Wyceniasz TYLKO labor_price (robocizna). Ustaw material_price = 0 dla WSZYSTKICH pozycji. Stawka użytkownika: ${userHourlyRate} PLN/rbh. Wylicz labor_price = norma_rg * ${userHourlyRate}. NIE używaj domyślnych stawek.`;
  }
  return `\n\nStawka robocizny użytkownika: ${userHourlyRate} PLN/rbh. Wylicz labor_price = norma_rg * ${userHourlyRate}.`;
}

/**
 * Sprawdza czy cena jest poniżej progu (uważana za brakującą/placeholder).
 */
export const isPriceMissing = (price: number | null, threshold = 1.0): boolean =>
  (price || 0) <= threshold;

/**
 * Buduje confidence note dla pozycji na podstawie dopasowania do katalogu lub AI.
 */
export function buildConfidenceNote(
  catalogMatch: CatalogItemRef | null,
  aiKnrCode: string | null,
  aiConfidenceNote: string | null
): string {
  if (catalogMatch) {
    const knr = (catalogMatch as CatalogItemRef & { knr_code?: string | null }).knr_code;
    return `Cena na podstawie katalogu${knr ? ` (${knr})` : ""}`;
  }
  if (aiConfidenceNote) return aiConfidenceNote;
  if (aiKnrCode) return `Cena na podstawie ${aiKnrCode}`;
  return "Szacunek rynkowy 2026";
}

/**
 * Buduje skrócony kontekst katalogu dla promptu AI (max N pozycji).
 */
export function buildCatalogContext(items: CatalogItemRef[], maxItems = 150): string {
  const verified = items.filter((i) => i.catalog_confidence === "verified");
  const others = items.filter((i) => i.catalog_confidence !== "verified");
  const context = [...verified, ...others].slice(0, maxItems);

  return context
    .map((item) => {
      const knr = item.knr_code ? ` [${item.knr_code}]` : "";
      const conf = item.catalog_confidence === "verified" ? " ✓VERIFIED" : "";
      return `- ${item.name} (${item.unit})${knr}${conf} | materiał: ${item.base_material_price ?? 0} PLN | robocizna: ${item.base_labor_price ?? 0} PLN`;
    })
    .join("\n");
}
