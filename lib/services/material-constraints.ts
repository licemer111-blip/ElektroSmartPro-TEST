/**
 * lib/services/material-constraints.ts
 * ─────────────────────────────────────────────────────────────────
 * Atomic Guard v1.7 — Per-intent Material Forbidden Categories.
 *
 * Rule: Each SemanticIntent has a specific set of material categories
 * that are FORBIDDEN (hard ban) to prevent double-counting.
 *
 * v1.7 additions:
 *   - LIGHTING name-based exclusion (opraw/oswietl/lampa → no CABLE/CONDUIT)
 *     even when intent falls to GENERAL (noun-only lighting items).
 *   - AUTOMATION name-based exclusion (KNX/automatyk → no CABLE).
 *
 * Exception: Items matching ZESTAW_RE (Punkt/Zestaw/Komplet) bypass ALL
 * filtering — complex assemblies receive the full material bill.
 *
 * Pure functions — no server deps, safe for vitest.
 *
 * Exports:
 *   INTENT_FORBIDDEN_CATEGORIES — static map (SemanticIntent → MaterialCategory[])
 *   LIGHTING_NAME_RE, AUTOMATION_NAME_RE — name-based detection patterns
 *   getForbiddenCategories(intent, itemName) → MaterialCategory[] | undefined
 *   isCategoryForbidden(category, intent, itemName) → boolean
 */

import type { SemanticIntent } from "@/lib/services/semantic-classifier";
import type { MaterialCategory } from "@/lib/services/material-classifier";
import { ZESTAW_RE, normalizePlName } from "@/lib/services/semantic-classifier";

// ─────────────────────────────────────────────────────────────────
// Name-based detection patterns (v1.7 additions)
// ─────────────────────────────────────────────────────────────────

/**
 * Detects lighting items by name (even without action verb → GENERAL intent).
 * These items must never have cables/conduits suggested (atomic = single fixture).
 * Uses normalized ASCII to handle Polish diacritics.
 */
export const LIGHTING_NAME_RE = /\b(opraw|oswietl|lampa|swiatl|wypust)/i;

/**
 * Detects automation/KNX/bus items by name.
 * Power cables (YDYp/YKY) are excluded — bus cables are a separate CABLE_LAYING item.
 */
export const AUTOMATION_NAME_RE = /\b(knx|automatyk|bus|magistral|dali|smart.home)/i;

// ─────────────────────────────────────────────────────────────────
// Per-intent forbidden categories (Atomic Guard map)
// ─────────────────────────────────────────────────────────────────

/**
 * Maps SemanticIntent → MaterialCategory[] that are HARD-BANNED
 * for that type of labor item to prevent material double-counting.
 *
 * STANDARD_ACTION (Montaż gniazdka / puszki / włącznika):
 *   Cables and conduits are ALWAYS separate CABLE_LAYING line items.
 *   Allowed: BOX, SOCKET, SWITCH, PLASTER, HARDWARE.
 *   Forbidden: CABLE, CONDUIT.
 *
 * CABLE_LAYING (Układanie WLZ / YDYp / YKY):
 *   Sockets, switches, breakers belong to STANDARD_ACTION items, not here.
 *   Allowed: CABLE, CONDUIT, HARDWARE (spinki, uchwyty, trytytki).
 *   Forbidden: SOCKET, SWITCH, BOX, BREAKER.
 *
 * HARD_CONSTRUCTION (Bruzdowanie / kucie w betonie):
 *   Groove work needs only consumables (gips, zaprawa).
 *   All device-level and cable materials are separate items.
 *   Allowed: PLASTER, HARDWARE.
 *   Forbidden: CABLE, CONDUIT, SOCKET, SWITCH, BOX, BREAKER.
 *
 * DRILLING_HARD (Wiercenie w betonie / silce):
 *   Drilling provides only anchor points; devices and cables are separate.
 *   Allowed: HARDWARE (kołki rozporowe, śruby).
 *   Forbidden: CABLE, CONDUIT, SOCKET, SWITCH, BOX, BREAKER.
 *
 * DISTRIBUTION_BOARD (Rozdzielnica / tablica el.):
 *   Incoming/outgoing external cables are separate CABLE_LAYING items.
 *   Allowed: BREAKER, BOX, HARDWARE (szyny, zaciski, tulejki).
 *   Forbidden: CABLE, CONDUIT.
 *
 * HEAVY_CONNECTION (Pompa / silnik / indukcja):
 *   The connection cable IS part of this job (short run to device).
 *   No restriction — full bill including CABLE is intentional.
 *   (Not listed below → getForbiddenCategories returns undefined.)
 *
 * GENERAL / CABLE_LAYING (verb form):
 *   No per-intent restriction beyond CABLE_LAYING map above.
 */
export const INTENT_FORBIDDEN_CATEGORIES: Partial<Record<SemanticIntent, MaterialCategory[]>> = {
  STANDARD_ACTION:    ["CABLE", "CONDUIT"],
  CABLE_LAYING:       ["SOCKET", "SWITCH", "BOX", "BREAKER"],
  HARD_CONSTRUCTION:  ["CABLE", "CONDUIT", "SOCKET", "SWITCH", "BOX", "BREAKER"],
  DRILLING_HARD:      ["CABLE", "CONDUIT", "SOCKET", "SWITCH", "BOX", "BREAKER"],
  DISTRIBUTION_BOARD: ["CABLE", "CONDUIT"],
};

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Returns the list of forbidden MaterialCategories for a given intent + item name.
 *
 * Zestaw Exception: Items matching ZESTAW_RE (Punkt / Zestaw / Komplet) bypass
 * all filtering and return undefined — Zestawy receive the full material bill
 * including cables, conduits, and all devices.
 *
 * @param intent   — from classifyIntent(itemName).intent
 * @param itemName — original labor item name (checked for Zestaw exception)
 * @returns        — categories to exclude, or undefined if no filter applies
 */
export function getForbiddenCategories(
  intent: SemanticIntent,
  itemName: string
): MaterialCategory[] | undefined {
  if (ZESTAW_RE.test(itemName)) return undefined;

  // Per-intent forbidden categories
  const intentForbidden = INTENT_FORBIDDEN_CATEGORIES[intent];
  if (intentForbidden) return intentForbidden;

  // v1.7: Name-based exclusions for GENERAL intent
  // (noun-only lighting/automation items that have no dedicated intent)
  const nn = normalizePlName(itemName);
  if (LIGHTING_NAME_RE.test(nn))    return ["CABLE", "CONDUIT"];
  if (AUTOMATION_NAME_RE.test(nn))  return ["CABLE", "CONDUIT"];

  return undefined;
}

/**
 * Returns true if the given material category is forbidden for this intent + item.
 * Convenience wrapper for single-category checks (e.g. in UI hints).
 */
export function isCategoryForbidden(
  category: MaterialCategory,
  intent: SemanticIntent,
  itemName: string
): boolean {
  const forbidden = getForbiddenCategories(intent, itemName);
  return forbidden !== undefined && forbidden.includes(category);
}
