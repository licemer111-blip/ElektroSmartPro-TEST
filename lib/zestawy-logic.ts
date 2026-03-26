/**
 * zestawy-logic.ts  — v1.5
 *
 * Конфигурация «умных расходников» для модулей щита.
 * Каждый модуль при синхронизации с Kosztorys разворачивается в набор позиций.
 *
 * СТРАТЕГИЯ ГРУППИРОВКИ:
 *  - Позиции с aggregate=true суммируются по всем модулям → одна строка на весь щит.
 *  - Позиции с aggregate=false — одна строка на каждый модуль (или origin_id).
 *  - Шина (busbar) рассчитывается отдельно: сумма полюсов / 12 × цена шины.
 */

// ─── Category helpers ─────────────────────────────────────────────────────────

/** Категории, которые считаются «силовыми» и требуют доли шины */
export const POWER_CATEGORIES = new Set([
  "breaker", "rcd", "rcbo", "spd", "contactor",
]);

/** Категории, для которых НЕ добавляются расходники (провода, метизы и т.п.) */
export const SKIP_CONSUMABLE_CATEGORIES = new Set([
  "enclosure", "labor", "wiring", "consumable",
]);

// ─── KNR Labor norms (rbh per unit) ──────────────────────────────────────────

export const LABOR_NORMS: Record<string, number> = {
  breaker_1p:  0.15,
  breaker_2p:  0.20,
  breaker_3p:  0.35,
  breaker_4p:  0.40,
  rcd_2p:      0.30,
  rcd_4p:      0.45,
  rcbo_1p:     0.20,
  rcbo_2p:     0.30,
  spd:         0.50,
  contactor:   0.45,
  timer:       0.35,
  monitoring:  0.40,
  automation:  0.40,
  compensation:0.60,
  terminal:    0.10,
  switch:      0.20,
  default:     0.25,
};

/** Возвращает KNR норму (rbh/szt) по категории и числу полюсов */
export function getLaborNorm(category: string, poles: number): number {
  const key = `${category}_${poles}p`;
  if (key in LABOR_NORMS) return LABOR_NORMS[key];
  if (category === "spd") return LABOR_NORMS.spd;
  if (category in LABOR_NORMS) return LABOR_NORMS[category];
  return LABOR_NORMS.default;
}

// ─── Consumable items (module_general) ───────────────────────────────────────

export interface ConsumableItemDef {
  /** Klucz do agregacji (używany jako origin_id dla zgrupowanych wierszy) */
  aggregateKey: string;
  name: string;
  unit: "kpl" | "szt" | "m";
  basePricePerModule: number;
  /** Jeśli true — sumowane na całą rozdzielnicę, nie na każdy moduł osobno */
  aggregate: boolean;
}

export const MODULE_CONSUMABLES: ConsumableItemDef[] = [
  {
    aggregateKey: "rozdzielnica__tulejki",
    name: "Tulejki i materiały pomocnicze (kpl.)",
    unit: "kpl",
    basePricePerModule: 2.50,
    aggregate: true,
  },
  {
    aggregateKey: "rozdzielnica__oznakowanie",
    name: "Oznakowanie pola w rozdzielnicy",
    unit: "szt",
    basePricePerModule: 1.20,
    aggregate: true,
  },
];

// ─── Busbar logic ─────────────────────────────────────────────────────────────

export const BUSBAR_LOGIC = {
  aggregateKey: "rozdzielnica__szyna_laczeniowa",
  name: "Szyna łączeniowa 12-mod. (udział)",
  unit: "szt" as const,
  /** Cena za pełną szynę 12-modułową (PLN netto) */
  basePriceFullRail: 45.00,
  /** Cena za 1 modul = basePriceFullRail / 12 */
  get pricePerPole(): number { return this.basePriceFullRail / 12; },
};

// ─── Panel assembly base row ──────────────────────────────────────────────────

export const PANEL_ASSEMBLY = {
  aggregateKey: "rozdzielnica__montaz_bazowy",
  name: "Montaż i podłączenie rozdzielnicy (KNR 5-04)",
  unit: "kpl" as const,
  /** Базовая трудоёмкость сборки корпуса (rbh) */
  laborNormBase: 2.0,
  /** Stawka bazowa robocizny (PLN/rbh przed regionModifier) */
  baseLaborRate: 85.0,
};

// ─── Full Zestaw expansion ────────────────────────────────────────────────────

export interface ZestawModule {
  uid: string;
  category: string;
  poles: number;         // Number of DIN slots / poles
  quantity: number;
}

export interface ZestawAggregate {
  aggregateKey: string;
  name: string;
  unit: "kpl" | "szt" | "m";
  totalQty: number;
  totalPrice: number;    // PLN netto BASE (no regionModifier — calcRowPrices applies region at display)
  originType: "panel_consumable" | "panel_busbar" | "panel_assembly";
}

/**
 * Oblicza zagregowane pozycje zestawu dla całej rozdzielnicy.
 * Wywołaj raz dla wszystkich modułów — zwraca gotowe wiersze do wstawienia.
 * Prices returned are BASE (no regionModifier) — calcRowPrices applies region at display time.
 */
export function computeZestawAggregates(
  modules: ZestawModule[],
  isFirstSync: boolean,
): ZestawAggregate[] {
  const result: ZestawAggregate[] = [];

  // ── 1. Consumables (tulejki + oznakowanie) ────────────────────────────────
  for (const def of MODULE_CONSUMABLES) {
    let totalQty = 0;
    let totalPrice = 0;

    for (const mod of modules) {
      if (SKIP_CONSUMABLE_CATEGORIES.has(mod.category)) continue;
      totalQty += mod.quantity;
      totalPrice += def.basePricePerModule * mod.quantity; // Iron Rule: no regionModifier on material
    }

    if (totalQty > 0) {
      result.push({
        aggregateKey: def.aggregateKey,
        name: def.name,
        unit: def.unit,
        totalQty,
        totalPrice,
        originType: "panel_consumable",
      });
    }
  }

  // ── 2. Busbar share (Szyna łączeniowa) ───────────────────────────────────
  let totalPoles = 0;
  for (const mod of modules) {
    if (!POWER_CATEGORIES.has(mod.category)) continue;
    totalPoles += mod.poles * mod.quantity;
  }

  if (totalPoles > 0) {
    const busbarsNeeded = totalPoles; // ilość udziałów (każdy = 1 pol)
    const busbarsPrice = BUSBAR_LOGIC.pricePerPole * totalPoles; // Iron Rule: no regionModifier on material
    result.push({
      aggregateKey: BUSBAR_LOGIC.aggregateKey,
      name: BUSBAR_LOGIC.name,
      unit: BUSBAR_LOGIC.unit,
      totalQty: Math.round(busbarsNeeded * 100) / 100,
      totalPrice: Math.round(busbarsPrice * 100) / 100,
      originType: "panel_busbar",
    });
  }

  // ── 3. Panel assembly base (tylko przy pierwszej synchronizacji) ──────────
  if (isFirstSync) {
    const laborPrice = PANEL_ASSEMBLY.laborNormBase * PANEL_ASSEMBLY.baseLaborRate; // BASE price — calcRowPrices applies regionModifier at display time
    result.push({
      aggregateKey: PANEL_ASSEMBLY.aggregateKey,
      name: PANEL_ASSEMBLY.name,
      unit: PANEL_ASSEMBLY.unit,
      totalQty: 1,
      totalPrice: laborPrice,
      originType: "panel_assembly",
    });
  }

  return result;
}
