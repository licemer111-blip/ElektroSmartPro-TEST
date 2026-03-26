/**
 * lib/config/material-bill-bridge.ts
 * ─────────────────────────────────────────────────────────────────
 * Bridge: SemanticIntent (Labor Brain) → MaterialBill (Material Brain).
 * Pure data — no imports from server, safe for vitest.
 *
 * When the Labor Brain classifies an item (e.g. HEAVY_CONNECTION),
 * the bridge provides the expected material bill of materials.
 *
 * These are SUGGESTIONS, not automatic insertions. The UI should
 * display them and let the user confirm/edit before adding to project.
 *
 * Note: For "Zestawy" (Sets) with explicit recipes, use zestawy-recipes.ts.
 * This bridge covers intent-level suggestions for items NOT in a named set.
 */

import type { SemanticIntent } from "@/lib/services/semantic-classifier";
import type { MaterialCategory } from "@/lib/services/material-classifier";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface MaterialBillItem {
  /** Stable ID within bill for UI keying. */
  id:             string;
  /** Category for waste factor + unit auto-assignment. */
  category:       MaterialCategory;
  /** Human-readable label (Polish). */
  label:          string;
  /** Canonical unit (matches classifyMaterial.forcedUnit). */
  unit:           "mb" | "szt" | "kg" | "op";
  /**
   * Quantity multiplier per parent unit (e.g. 8 mb cable per 1 pump connection).
   * Final qty = parentQty × qtyFactor.
   */
  qtyFactor:      number;
  /**
   * Normalized search slug matching materials_catalog.search_slug.
   * Primary key for server-side catalog price lookup.
   * Pattern: category-spec (e.g. 'ydyp-3x2.5', 'mcb-b16-1p', 'puszka-fi60').
   */
  slug:           string;
  /**
   * Reference (fallback) price PLN/unit when catalog lookup returns nothing.
   * Kept in sync with materials_catalog seed data (2026 Polish market prices).
   */
  refPricePLN:    number;
  /** Optional note for UI tooltip / PDF explainability. */
  note?:          string;
  /**
   * Smart Pack Multiplicity (v1.8): pack size for "N units per pack" items.
   * When set, final pack qty = Math.ceil(laborItemQty / unitsPerPack).
   * Example: WAGO op.50szt → unitsPerPack=50 → 100 lamps → ceil(100/50)=2 packs.
   * Overrides the qtyFactor-based calculation for pack-based consumables.
   */
  unitsPerPack?:  number;
}

export interface MaterialBill {
  /** Parent labor intent that triggered this bill. */
  intent:     SemanticIntent;
  /** Human-readable description of this suggestion context. */
  label:      string;
  /** List of suggested material items. */
  items:      MaterialBillItem[];
  /** Source note for UI — explains why these materials were suggested. */
  rationale:  string;
}

// ─────────────────────────────────────────────────────────────────
// BRIDGE MAP
// ─────────────────────────────────────────────────────────────────

/**
 * Bridge entries indexed by SemanticIntent.
 * Each entry is an array of bills (multiple variants possible in future).
 * Currently one bill per intent.
 */
const MATERIAL_BILL_MAP: Partial<Record<SemanticIntent, MaterialBill>> = {

  // ── HEAVY_CONNECTION: Pompa / Silnik / Indukcja / Klimatyzator ─────────────
  // Standard heavy appliance connection requires:
  //   - Multi-core power cable (min. 5×2.5 for pumps up to 1.5kW, 5×6 for larger)
  //   - 3-pole MCB (16A residential pump, 32A for larger)
  //   - IP65 junction box (outdoor/wet location)
  //   - Cable gland PG16 (for proper sealing)
  HEAVY_CONNECTION: {
    intent:    "HEAVY_CONNECTION",
    label:     "Podłączenie urządzenia ciężkiego (pompa ciepła/silnik/indukcja)",
    rationale: "Zasilanie 3-fazowe >2kW: kabel YKY 5×6 (10mb), MCB 3P B25, RCD 4P 40A/30mA, puszka IP65, dławnice.",
    items: [
      {
        id:          "hc_cable",
        category:    "CABLE",
        label:       "Kabel YKY 5×6 (zasilanie pompy ciepła)",
        unit:        "mb",
        qtyFactor:   10,
        slug:        "yky-5x6",
        refPricePLN: 18.40,
        note:        "10mb = trasa od rozdzielnicy do pompy. Waste +10% wliczony automatycznie (= 11mb faktycznie zamówić).",
      },
      {
        id:          "hc_mcb",
        category:    "BREAKER",
        label:       "Wyłącznik nadprądowy 3P B25A",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "mcb-b25-3p",
        refPricePLN: 42.00,
        note:        "Charakterystyka B dla pomp ciepła (niski prąd rozruchowy). C32 dla sprężarek.",
      },
      {
        id:          "hc_rcd",
        category:    "BREAKER",
        label:       "Różnicowo-prądowy RCD 40A/30mA 4P",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "rcd-40a-4p",
        refPricePLN: 145.00,
        note:        "Obowiązkowy dla pompy ciepła wg PN-IEC 60364. 30mA = ochrona osobista.",
      },
      {
        id:          "hc_box",
        category:    "BOX",
        label:       "Puszka przyłączeniowa IP65",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "puszka-ip65",
        refPricePLN: 12.50,
        note:        "IP65 wymagane dla urządzeń w pomieszczeniach wilgotnych i na zewnątrz.",
      },
      {
        id:          "hc_gland",
        category:    "HARDWARE",
        label:       "Dławnica kablowa PG16",
        unit:        "szt",
        qtyFactor:   2,
        slug:        "dlawnica-pg16",
        refPricePLN: 3.50,
        note:        "2 szt: wejście kabla do puszki + wyjście do urządzenia.",
      },
    ],
  },

  // ── STANDARD_ACTION: Gniazdo / Włącznik / Lampa / Montaż osprzętu ──────────
  // Atomic-level items only. Cables are separate CABLE_LAYING line items.
  // Zestawy (Punkt/Komplet/Zestaw) use zestawy-recipes.ts and get full bills.
  STANDARD_ACTION: {
    intent:    "STANDARD_ACTION",
    label:     "Montaż osprzętu 230V (gniazdo/lampa/włącznik)",
    rationale: "Samo ciało punktu: puszka podtynkowa + gips do wmurowania. Kabel to osobna pozycja (CABLE_LAYING).",
    items: [
      {
        id:          "sa_box",
        category:    "BOX",
        label:       "Puszka podtynkowa Ø60 głęboka",
        unit:        "szt",
        qtyFactor:   1,
        slug:        "puszka-fi60",
        refPricePLN: 1.20,
      },
      {
        id:          "sa_gips",
        category:    "PLASTER",
        label:       "Gips budowlany (wmorowanie puszki)",
        unit:        "op",
        qtyFactor:   0.1,
        slug:        "gips-5kg",
        refPricePLN: 16.00,
        note:        "0.1 op (= 0.5kg) na zabetonowanie 1 puszki w ścianie.",
      },
    ],
  },

  // ── HARD_CONSTRUCTION: Bruzdowanie / Kucie ──────────────────────────────────
  // Groove cutting creates debris — requires plaster/grout for repair.
  HARD_CONSTRUCTION: {
    intent:    "HARD_CONSTRUCTION",
    label:     "Naprawienie bruzdy po sztrobie",
    rationale: "Każdy metr bruzdy: 0.5kg gipsu do szpachlowania + 0.3kg zaprawy do uszczelnienia.",
    items: [
      {
        id:          "hkc_plaster",
        category:    "PLASTER",
        label:       "Gips budowlany (szpachlowanie bruzdy)",
        unit:        "op",
        qtyFactor:   0.1,
        slug:        "gips-5kg",
        refPricePLN: 16.00,
        note:        "0.1 op (= 0.5kg z worka 5kg) na 1 mb bruzdy. Waste +5% wliczony.",
      },
      {
        id:          "hkc_mortar",
        category:    "PLASTER",
        label:       "Zaprawa cementowa szybkowiążąca",
        unit:        "op",
        qtyFactor:   0.06,
        slug:        "zaprawa-1kg",
        refPricePLN: 4.50,
        note:        "0.06 op (= 0.3 z worka 1kg) na uszczelnienie końcówek bruzdy.",
      },
    ],
  },

  // ── DRILLING_HARD: Wiercenie w betonie / silce ──────────────────────────────
  // Drilling requires anchors to mount boxes/fixtures.
  DRILLING_HARD: {
    intent:    "DRILLING_HARD",
    label:     "Mocowanie po wierceniu (kołki rozporowe)",
    rationale: "Każdy otwór fi8 wymaga 2 kołków rozporowych do mocowania.",
    items: [
      {
        id:          "dh_anchor",
        category:    "HARDWARE",
        label:       "Kołek rozporowy fi8×40 op.100szt",
        unit:        "op",
        qtyFactor:   0.02,
        slug:        "kolek-fi8",
        refPricePLN: 24.00,
        note:        "0.02 op = 2 kołki z opakowania 100szt. Cena op.100szt = 24 PLN.",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// Atomic Task Exclusion
// ─────────────────────────────────────────────────────────────────

/**
 * Material categories strictly FORBIDDEN for Atomic Tasks.
 * Atomic = single-action item (Montaż/Gniazdo/Puszka/Łącznik/Wypust).
 * Cables and conduits are ALWAYS separate CABLE_LAYING line items.
 * Only allowed: BOX, BREAKER, SOCKET, SWITCH, PLASTER, HARDWARE, GENERAL.
 */
export const ATOMIC_EXCLUSION_CATEGORIES: MaterialCategory[] = ["CABLE", "CONDUIT"];

/**
 * Returns a filtered copy of bill with CABLE and CONDUIT items removed.
 * Use when isAtomicTask(itemName) === true && isZestaw(itemName) === false.
 * Returns null if bill becomes empty after filtering (no materials to suggest).
 */
export function filterBillForAtomicTask(bill: MaterialBill): MaterialBill | null {
  const filteredItems = bill.items.filter(
    (item) => !ATOMIC_EXCLUSION_CATEGORIES.includes(item.category)
  );
  if (!filteredItems.length) return null;
  return { ...bill, items: filteredItems };
}

// ─────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Returns the MaterialBill for a given SemanticIntent.
 * Returns null for GENERAL (no expected materials).
 */
export function getMaterialBill(intent: SemanticIntent): MaterialBill | null {
  return MATERIAL_BILL_MAP[intent] ?? null;
}

/**
 * Calculates the suggested quantities for all bill items
 * scaled by parent item quantity.
 *
 * @param intent   — from classifyIntent(itemName).intent
 * @param parentQty — quantity of the parent labor item (e.g. 3 pumps)
 * @returns        — array of { item, scaledQty } or empty if GENERAL
 */
export function scaleMaterialBill(
  intent: SemanticIntent,
  parentQty: number
): Array<{ item: MaterialBillItem; scaledQty: number }> {
  const bill = getMaterialBill(intent);
  if (!bill) return [];
  return bill.items.map((item) => ({
    item,
    scaledQty: Math.round(item.qtyFactor * parentQty * 100) / 100,
  }));
}

/**
 * Returns all material categories expected for a given intent.
 * Useful for UI to show "expected materials" hint before full bill calculation.
 */
export function getExpectedCategories(intent: SemanticIntent): MaterialCategory[] {
  const bill = getMaterialBill(intent);
  if (!bill) return [];
  return [...new Set(bill.items.map((i) => i.category))];
}
