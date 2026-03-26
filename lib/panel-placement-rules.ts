// =============================================
// PANEL CONFIGURATOR — PLACEMENT LOGIC GUARD
// =============================================
// Engineering rules for valid module placement on DIN rails.
// Each rule returns null (OK) or a PlacementViolation (blocked/warned).

import type { DinModule, RailModule, SelectedSlot } from "@/components/project/panel-configurator-types";

export type ViolationSeverity = "block" | "warn";

export interface PlacementViolation {
  severity: ViolationSeverity;
  title: string;
  reason: string;
  hint: string;
}

// Categories allowed as the very first module (Row 1, Slot 1)
const ENTRY_ALLOWED_CATEGORIES: DinModule["category"][] = ["switch", "spd", "monitoring"];

// Categories that must NOT be placed directly after an RCD (another RCD in same group)
const RCD_CATEGORIES: DinModule["category"][] = ["rcd"];

// Non-modular categories — skip all placement rules (accessories, wiring, labor)
const NON_RAIL_CATEGORIES: DinModule["category"][] = [
  "enclosure", "wiring", "labor", "terminal", "consumable",
];

// ─── Rule #1: Main Entry ──────────────────────────────────────────────────────
// Row 1, Slot 1 must be a main switch, SPD, or monitoring device.
function checkMainEntry(
  mod: DinModule,
  slot: SelectedSlot,
  railModules: RailModule[],
): PlacementViolation | null {
  if (slot.rowIdx !== 0 || slot.slotIdx !== 0) return null;
  if (NON_RAIL_CATEGORIES.includes(mod.category)) return null;
  if (ENTRY_ALLOWED_CATEGORIES.includes(mod.category)) return null;

  // If there's already a module at position 0, this rule doesn't apply (inserting after)
  if (railModules.length > 0) return null;

  return {
    severity: "block",
    title: "Nieprawidłowa kolejność",
    reason: `Pierwszym elementem rozdzielnicy powinien być Rozłącznik Główny lub Ochronnik przepięć (SPD).`,
    hint: "Kategorie dozwolone na wejściu: Rozłączniki, SPD, Aparatura pomiarowa.",
  };
}

// ─── Rule #2: RCD → RCD nesting ──────────────────────────────────────────────
// Placing an RCD immediately after another RCD (without MCBs between) is a wiring error.
function checkRcdAfterRcd(
  mod: DinModule,
  slot: SelectedSlot,
  railModules: RailModule[],
): PlacementViolation | null {
  if (!RCD_CATEGORIES.includes(mod.category)) return null;
  if (NON_RAIL_CATEGORIES.includes(mod.category)) return null;

  // Find the module that would be immediately before the insertion point
  // We need to compute the absolute insertion index
  // For simplicity: check if the module at (slotIdx - 1) in the flat railModules is also an RCD
  // We use a simple heuristic: if the last module before the slot is an RCD, warn.
  if (railModules.length === 0) return null;

  // Compute how many real modules precede this slot across all rows
  // (simplified: just check the module immediately before the target slot index)
  // The slot index in the flat array is approximated by counting modules in preceding rows
  // For a precise check we'd need railRows — here we use a conservative heuristic:
  // if ANY adjacent module in railModules is an RCD, warn.
  const prevModule = railModules[railModules.length - 1];
  if (!prevModule) return null;

  if (RCD_CATEGORIES.includes(prevModule.module.category)) {
    return {
      severity: "warn",
      title: "Selektywność RCD",
      reason: "Dwa RCD obok siebie bez MCB między nimi może powodować problemy z selektywnością.",
      hint: "Między RCD a kolejnym RCD powinny znajdować się wyłączniki nadprądowe (MCB/RCBO).",
    };
  }

  return null;
}

// ─── Rule #3: SPD position ───────────────────────────────────────────────────
// SPD should be placed near the entry (Row 1), not at the end of the panel.
function checkSpdPosition(
  mod: DinModule,
  slot: SelectedSlot,
  railModules: RailModule[],
): PlacementViolation | null {
  if (mod.category !== "spd") return null;
  if (slot.rowIdx === 0) return null; // OK — near entry

  // If there are already many modules and SPD is placed far from entry, warn
  if (railModules.length >= 6 && slot.rowIdx >= 2) {
    return {
      severity: "warn",
      title: "Pozycja SPD",
      reason: "Ochronniki przepięć (SPD) powinny być umieszczone jak najbliżej wejścia zasilania.",
      hint: "Zalecane: Rząd 1, zaraz po Rozłączniku Głównym.",
    };
  }

  return null;
}

// ─── Rule #4: Labor/Wiring in rail ───────────────────────────────────────────
// Labor and wiring items should not be placed on DIN rail slots.
function checkNonRailInSlot(
  mod: DinModule,
  slot: SelectedSlot,
): PlacementViolation | null {
  if (!["labor", "wiring"].includes(mod.category)) return null;

  return {
    severity: "block",
    title: "Nieprawidłowa pozycja",
    reason: `Element „${mod.namePl}" nie jest modułem szynowym i nie może być umieszczony na szynie DIN.`,
    hint: "Pozycje robocizny i przewodów dodawane są automatycznie do kosztorysu.",
  };
}

// ─── Main validator ───────────────────────────────────────────────────────────
export function validatePlacement(
  mod: DinModule,
  slot: SelectedSlot | null,
  railModules: RailModule[],
): PlacementViolation | null {
  // No slot selected — appending to end, no positional rules apply
  if (slot === null) return null;

  return (
    checkNonRailInSlot(mod, slot) ??
    checkMainEntry(mod, slot, railModules) ??
    checkRcdAfterRcd(mod, slot, railModules) ??
    checkSpdPosition(mod, slot, railModules) ??
    null
  );
}

// ─── Category dimming (per-module) ───────────────────────────────────────────
// Returns true if a category should be visually dimmed for the current slot context.
// Legacy: used for per-item dimming inside an open category.
export function isCategoryForbiddenForSlot(
  category: DinModule["category"],
  slot: SelectedSlot | null,
  railModules: RailModule[],
): boolean {
  if (slot === null) return false;
  if (NON_RAIL_CATEGORIES.includes(category)) return false;

  // Row 1, Slot 1, empty panel — only entry categories allowed
  if (slot.rowIdx === 0 && slot.slotIdx === 0 && railModules.length === 0) {
    return !ENTRY_ALLOWED_CATEGORIES.includes(category);
  }

  return false;
}

// ─── Recommended categories for slot ─────────────────────────────────────────
// Returns a Set of category keys that are explicitly recommended for this slot.
// Used by ModuleLibrary to sort recommended categories to the top.
export function getRecommendedCategories(
  slot: SelectedSlot | null,
  railModules: RailModule[],
): Set<DinModule["category"]> {
  if (slot === null) return new Set();

  // Row 1, Slot 1, empty panel — main switch and SPD are the recommended entry devices
  if (slot.rowIdx === 0 && slot.slotIdx === 0 && railModules.length === 0) {
    return new Set<DinModule["category"]>(["switch", "spd", "monitoring"]);
  }

  // After an RCD (last placed module is RCD) — MCBs and RCBOs are recommended
  if (railModules.length > 0) {
    const lastMod = railModules[railModules.length - 1];
    if (lastMod.module.category === "rcd") {
      return new Set<DinModule["category"]>(["breaker", "rcbo"]);
    }
  }

  return new Set();
}

// ─── Recursive category disabling ─────────────────────────────────────────────
// Returns true if EVERY module in the category is blocked (severity="block").
// Used to disable entire category folders before the user opens them.
// Performance: only recomputes when selectedSlot changes (caller uses useMemo).
export function isCategoryFullyForbidden(
  mods: DinModule[],
  slot: SelectedSlot | null,
  railModules: RailModule[],
): boolean {
  if (slot === null) return false;
  if (mods.length === 0) return false;

  return mods.every((mod) => {
    const violation = validatePlacement(mod, slot, railModules);
    return violation !== null && violation.severity === "block";
  });
}
