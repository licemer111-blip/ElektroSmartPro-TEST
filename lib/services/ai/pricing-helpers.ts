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

  return `źRÓDŁO STAWKI: ${rateLabel}
KROK 1 — SZUKAJ KODU KNR: Dla każdej pozycji OBOŁĄZKOWO znajdź kod KNR z poniższej bazy ES-KNR 2026.
  Jeśli znajdziesz → ustaw knr_code="KNR X-XX XXXX-XX", knr_source="official", confidence="high".
  Jeśli nie znajdziesz dokładnego → szukaj semantycznie (np. "kabel LAN"→"Kabel UTP kat.6") → knr_source="official".
  Jeśli brak odpowiednika → generuj syntetyczny "KNR-ES-XXXX" → knr_source="es-synthetic", confidence="low".
  NIGDY nie zostawiaj knr_code=null gdy istnieje choć przybliżone dopasowanie.

KROK 2 — WYLICZ CENĘ przez normę r-g:
  labor_price = norma_rg × ${userHourlyRate} PLN/rbh.
  KATEGORYCZNIE ZABRONIONYM jest używanie wartości PLN z metadanych plików JSON.
  material_price = koszt materiału za 1 jednostkę miary (dane katalogowe lub rynkowe 2026).
  NIE zgaduj gotowej sumy — wylicz przez normę!

BAZA KNR ES-ENGINE 2026 (fragmenty):
  KNR 5-04 0101-01 | Przewód YDYp 3x1.5 /100mb | r-g=2.50
  KNR 5-04 0101-02 | Przewód YDYp 3x2.5 /100mb | r-g=3.00
  KNR 5-04 0101-03 | Przewód YDYp 5x2.5 /100mb | r-g=3.50
  KNR 5-04 0101-04 | Przewód YDYp 5x6 /100mb | r-g=4.00
  KNR 5-04 0301-01 | Gniazdo 230V wtyczkowe /szt | r-g=0.22
  KNR 5-04 0302-01 | Łącznik instalacyjny /szt | r-g=0.20
  KNR 5-04 0401-01 | Oprawa LED natynkowa /szt | r-g=0.40
  KNR 5-04 0501-01 | MCB 1P wyłącznik naprądowy /szt | r-g=0.15
  KNR 5-04 0501-02 | MCB 3P wyłącznik naprądowy /szt | r-g=0.25
  KNR 5-04 0501-03 | RCD 2P 40A/30mA /szt | r-g=0.20
  KNR 5-04 0601-01 | Rozdzielnica podtynkowa montaż /kpl | r-g=2.00
  KNR 5-04 0701-01 | Bruzda w tynku /mb | r-g=0.06
  KNR 5-04 0801-01 | Rura instalacyjna M20 /mb | r-g=0.015
  KNR 5-06 0101-01 | Kabel UTP kat.6 /100mb | r-g=2.00
  KNR 5-06 0101-02 | Kabel UTP kat.6a /100mb | r-g=2.50
  KNR 5-06 0201-01 | Gniazdo RJ45 kat.6 /szt | r-g=0.20
  KNR 5-06 0201-02 | Gniazdo RJ45 kat.6 podwójne /szt | r-g=0.25
  KNR 5-06 0301-01 | Patchpanel 24p montaż /szt | r-g=0.45
  KNR 5-06 0401-01 | Szafa rack 12U montaż /szt | r-g=0.90
  KNR 5-06 0401-02 | Szafa rack 42U montaż /szt | r-g=2.50
  KNR 5-06 0501-01 | Wkładka keystonowa RJ45 /szt | r-g=0.05
  KNR 5-06 0701-01 | Certyfikacja linii LAN /mb | r-g=0.15
  KNR 5-07 0101-01 | Kamera IP kopułkowa montaż /szt | r-g=1.20
  KNR 5-07 0201-01 | Rejestrator NVR montaż /szt | r-g=1.50
  KNR 5-08 0101-01 | Koryto kablowe 60x40 /mb | r-g=0.08
  KNR 5-08 0201-01 | Drabinka kablowa 200mm /mb | r-g=0.15

Hierarchia źródeł: katalog prywatny L1 → normy KNR L2 → szacunek rynkowy 2026 L3 (confidence=low).`;
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
