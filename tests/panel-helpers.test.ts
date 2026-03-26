/**
 * Panel Configurator Helpers Tests — ElektroSmart PRO
 *
 * Tests for pure helper functions from:
 *   components/project/panel-configurator-helpers.ts
 */
import { describe, it, expect } from "vitest";
import {
  isConsumableCategory,
  isLaborCategory,
  isNonModularItem,
  getItemUnit,
  getModuleAbbr,
  getModulePrice,
  getCableWarning,
  suggestCableForCircuit,
  getCategoryColor,
  getPhaseColor,
} from "@/components/project/panel-configurator-helpers";
import type { DinModule, RailModule } from "@/components/project/panel-configurator-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mkModule(overrides: Partial<DinModule> = {}): DinModule {
  return {
    id: "mcb-1p-16a",
    name: "MCB 1P 16A",
    namePl: "Wyłącznik 1P 16A",
    category: "breaker",
    modules: 1,
    icon: (() => null) as unknown as DinModule["icon"],
    defaultRating: 16,
    defaultPrice: 28,
    defaultLaborPrice: 12,
    ratingOptions: [6, 10, 16, 20, 25, 32],
    description: "MCB 1P",
    ...overrides,
  };
}

function mkRailModule(overrides: Partial<RailModule> = {}): RailModule {
  return {
    uid: "uid-1",
    module: mkModule(),
    rating: 16,
    label: "",
    phase: undefined,
    cableType: undefined,
    customName: undefined,
    customMaterialPrice: undefined,
    customLaborPrice: undefined,
    quantity: 1,
    isZugBlock: false,
    terminalCount: undefined,
    knrCode: undefined,
    laborRate: undefined,
    ...overrides,
  };
}

// ─── isConsumableCategory ─────────────────────────────────────────────────────

describe("isConsumableCategory", () => {
  it("returns true for consumable", () => {
    expect(isConsumableCategory("consumable")).toBe(true);
  });
  it("returns true for wiring", () => {
    expect(isConsumableCategory("wiring")).toBe(true);
  });
  it("returns true for terminal", () => {
    expect(isConsumableCategory("terminal")).toBe(true);
  });
  it("returns false for breaker", () => {
    expect(isConsumableCategory("breaker")).toBe(false);
  });
  it("returns false for rcd", () => {
    expect(isConsumableCategory("rcd")).toBe(false);
  });
  it("returns false for labor", () => {
    expect(isConsumableCategory("labor")).toBe(false);
  });
});

// ─── isLaborCategory ──────────────────────────────────────────────────────────

describe("isLaborCategory", () => {
  it("returns true for labor", () => {
    expect(isLaborCategory("labor")).toBe(true);
  });
  it("returns false for consumable", () => {
    expect(isLaborCategory("consumable")).toBe(false);
  });
  it("returns false for breaker", () => {
    expect(isLaborCategory("breaker")).toBe(false);
  });
});

// ─── isNonModularItem ─────────────────────────────────────────────────────────

describe("isNonModularItem", () => {
  it("returns true for consumable category", () => {
    expect(isNonModularItem(mkModule({ category: "consumable" }))).toBe(true);
  });
  it("returns true for wiring category", () => {
    expect(isNonModularItem(mkModule({ category: "wiring" }))).toBe(true);
  });
  it("returns true for labor category", () => {
    expect(isNonModularItem(mkModule({ category: "labor" }))).toBe(true);
  });
  it("returns true when modules = 0", () => {
    expect(isNonModularItem(mkModule({ modules: 0 }))).toBe(true);
  });
  it("returns false for breaker (modular)", () => {
    expect(isNonModularItem(mkModule({ category: "breaker", modules: 1 }))).toBe(false);
  });
  it("returns false for rcd (modular)", () => {
    expect(isNonModularItem(mkModule({ category: "rcd", modules: 2 }))).toBe(false);
  });
});

// ─── getItemUnit ──────────────────────────────────────────────────────────────

describe("getItemUnit", () => {
  it("returns 'm' for wiring", () => {
    expect(getItemUnit(mkModule({ category: "wiring" }))).toBe("m");
  });
  it("returns 'usł.' for labor", () => {
    expect(getItemUnit(mkModule({ category: "labor" }))).toBe("usł.");
  });
  it("returns 'szt.' for consumable", () => {
    expect(getItemUnit(mkModule({ category: "consumable" }))).toBe("szt.");
  });
  it("returns 'szt.' for breaker (default)", () => {
    expect(getItemUnit(mkModule({ category: "breaker" }))).toBe("szt.");
  });
  it("returns 'szt.' for rcd (default)", () => {
    expect(getItemUnit(mkModule({ category: "rcd" }))).toBe("szt.");
  });
});

// ─── getModuleAbbr ────────────────────────────────────────────────────────────

describe("getModuleAbbr", () => {
  it("MCB 1P", () => {
    expect(getModuleAbbr("mcb-1p-16a", "Wyłącznik")).toBe("B1P");
  });
  it("MCB 3P", () => {
    expect(getModuleAbbr("mcb-3p-32a", "Wyłącznik 3P")).toBe("B3P");
  });
  it("MCB 3P type C", () => {
    expect(getModuleAbbr("mcb-3p-c-16a", "MCB C")).toBe("C3P");
  });
  it("MCB 3P type D", () => {
    expect(getModuleAbbr("mcb-3p-d-16a", "MCB D")).toBe("D3P");
  });
  it("RCBO", () => {
    expect(getModuleAbbr("rcbo-1p-16a", "RCBO")).toBe("RCBO");
  });
  it("RCD 30mA AC — matches rcd-30-a prefix → RCD A", () => {
    // rcd-30-ac starts with rcd-30-a, so returns "RCD A" (type A check runs first)
    expect(getModuleAbbr("rcd-30-ac-40a", "RCD")).toBe("RCD A");
  });
  it("RCD type A", () => {
    expect(getModuleAbbr("rcd-30-a-40a", "RCD A")).toBe("RCD A");
  });
  it("SPD", () => {
    expect(getModuleAbbr("spd-t1t2", "SPD")).toBe("SPD");
  });
  it("contactor", () => {
    expect(getModuleAbbr("contactor-25a", "Stycznik")).toBe("K");
  });
  it("energy meter", () => {
    expect(getModuleAbbr("energy-meter-1p", "Licznik")).toBe("kWh");
  });
  it("main switch", () => {
    expect(getModuleAbbr("main-switch-3p-63a", "Rozłącznik")).toBe("QF");
  });
  it("VFD drive", () => {
    expect(getModuleAbbr("vfd-drive", "Falownik")).toBe("VFD");
  });
  it("terminal block", () => {
    expect(getModuleAbbr("terminal-2.5mm", "Złączka")).toBe("TERM");
  });
  it("WAGO connector", () => {
    expect(getModuleAbbr("wago-221-3", "WAGO")).toBe("WAGO");
  });
  it("unknown → first 4 chars of name uppercase", () => {
    expect(getModuleAbbr("unknown-xyz", "Pompa")).toBe("POMP");
  });
});

// ─── getModulePrice ───────────────────────────────────────────────────────────

describe("getModulePrice", () => {
  it("returns default prices without custom overrides", () => {
    const m = mkRailModule();
    const p = getModulePrice(m, 1.0);
    expect(p.material).toBe(28);
    expect(p.labor).toBe(12);
  });

  it("applies manufacturer coefficient to material price", () => {
    const m = mkRailModule();
    const p = getModulePrice(m, 1.2);
    expect(p.material).toBeCloseTo(28 * 1.2, 2);
    expect(p.labor).toBe(12); // labor not affected by coeff
  });

  it("custom material price overrides default + coeff", () => {
    const m = mkRailModule({ customMaterialPrice: 50 });
    const p = getModulePrice(m, 1.5);
    expect(p.material).toBe(50); // custom price, coeff ignored
  });

  it("custom labor price overrides default", () => {
    const m = mkRailModule({ customLaborPrice: 99 });
    const p = getModulePrice(m, 1.0);
    expect(p.labor).toBe(99);
  });

  it("quantity multiplies both prices", () => {
    const m = mkRailModule({ quantity: 5 });
    const p = getModulePrice(m, 1.0);
    expect(p.material).toBe(28 * 5);
    expect(p.labor).toBe(12 * 5);
  });

  it("ZUG block uses terminalCount as quantity", () => {
    const m = mkRailModule({ isZugBlock: true, terminalCount: 20 });
    const p = getModulePrice(m, 1.0);
    expect(p.material).toBe(28 * 20);
    expect(p.labor).toBe(12 * 20);
  });

  it("ZUG block with no terminalCount defaults to 15", () => {
    const m = mkRailModule({ isZugBlock: true, terminalCount: undefined });
    const p = getModulePrice(m, 1.0);
    expect(p.material).toBe(28 * 15);
  });

  it("zero price module returns 0", () => {
    const m = mkRailModule({
      module: mkModule({ defaultPrice: 0, defaultLaborPrice: 0 }),
    });
    const p = getModulePrice(m, 1.0);
    expect(p.material).toBe(0);
    expect(p.labor).toBe(0);
  });
});

// ─── getCableWarning ──────────────────────────────────────────────────────────

describe("getCableWarning", () => {
  it("returns null for undefined cable type", () => {
    expect(getCableWarning(undefined, 16)).toBeNull();
  });

  it("returns null for zero rating", () => {
    expect(getCableWarning("YDYp 3×2.5", 0)).toBeNull();
  });

  it("returns null when cable is adequate (2.5mm² for 16A)", () => {
    expect(getCableWarning("YDYp 3×2.5", 16)).toBeNull();
  });

  it("returns warning when cable is too weak (1.5mm² for 16A, max 10A)", () => {
    const w = getCableWarning("YDYp 3×1.5", 16);
    expect(w).not.toBeNull();
    expect(w).toContain("1.5mm²");
    expect(w).toContain("10A");
  });

  it("returns warning for 2.5mm² with 25A MCB (max 16A)", () => {
    const w = getCableWarning("YDYp 3×2.5", 25);
    expect(w).not.toBeNull();
    expect(w).toContain("16A");
  });

  it("returns null for 6mm² with 32A (max 32A — exactly at limit)", () => {
    expect(getCableWarning("YDYp 3×6", 32)).toBeNull();
  });

  it("returns warning for 6mm² with 40A (max 32A)", () => {
    const w = getCableWarning("YDYp 3×6", 40);
    expect(w).not.toBeNull();
  });

  it("returns null for cable without cross-section info", () => {
    expect(getCableWarning("Kabel specjalny", 32)).toBeNull();
  });

  it("handles comma decimal separator (European format)", () => {
    const w = getCableWarning("YDYp 3×2,5", 25);
    expect(w).not.toBeNull(); // 2.5mm² max 16A, 25A is too much
  });
});

// ─── suggestCableForCircuit ───────────────────────────────────────────────────

describe("suggestCableForCircuit", () => {
  it("suggests 1.5mm² for 10A 1P circuit", () => {
    expect(suggestCableForCircuit(10, "mcb-1p-10a")).toBe("YDYp 3×1.5");
  });

  it("suggests 2.5mm² for 16A 1P circuit", () => {
    expect(suggestCableForCircuit(16, "mcb-1p-16a")).toBe("YDYp 3×2.5");
  });

  it("suggests 4mm² for 25A 1P circuit", () => {
    expect(suggestCableForCircuit(25, "mcb-1p-25a")).toBe("YDYp 3×4");
  });

  it("suggests 6mm² for 32A 1P circuit", () => {
    expect(suggestCableForCircuit(32, "mcb-1p-32a")).toBe("YDYp 3×6");
  });

  it("suggests 10mm² for 50A 1P circuit", () => {
    expect(suggestCableForCircuit(50, "mcb-1p-50a")).toBe("YDYp 3×10");
  });

  it("suggests 5-core cable for 3P circuit (16A)", () => {
    expect(suggestCableForCircuit(16, "mcb-3p-16a")).toBe("YDYp 5×2.5");
  });

  it("suggests 5-core 4mm² for 3P 25A circuit", () => {
    expect(suggestCableForCircuit(25, "mcb-3p-25a")).toBe("YDYp 5×4");
  });

  it("suggests 5-core 6mm² for 3P 32A circuit", () => {
    expect(suggestCableForCircuit(32, "mcb-3p-32a")).toBe("YDYp 5×6");
  });

  it("detects 3P from 'troj' in module ID", () => {
    expect(suggestCableForCircuit(16, "wylacznik-trojfazowy")).toBe("YDYp 5×2.5");
  });
});

// ─── getCategoryColor ─────────────────────────────────────────────────────────

describe("getCategoryColor", () => {
  it("breaker → blue", () => {
    expect(getCategoryColor("breaker")).toBe("#2563eb");
  });
  it("rcd → green", () => {
    expect(getCategoryColor("rcd")).toBe("#059669");
  });
  it("rcbo → green (same as rcd)", () => {
    expect(getCategoryColor("rcbo")).toBe("#059669");
  });
  it("spd → amber", () => {
    expect(getCategoryColor("spd")).toBe("#d97706");
  });
  it("terminal → pink", () => {
    expect(getCategoryColor("terminal")).toBe("#db2777");
  });
  it("consumable → violet", () => {
    expect(getCategoryColor("consumable")).toBe("#7c3aed");
  });
  it("labor → orange", () => {
    expect(getCategoryColor("labor")).toBe("#ea580c");
  });
  it("unknown category → slate fallback", () => {
    expect(getCategoryColor("unknown_xyz")).toBe("#64748b");
  });
});

// ─── getPhaseColor ────────────────────────────────────────────────────────────

describe("getPhaseColor", () => {
  it("L1 → brown", () => {
    expect(getPhaseColor("L1")).toBe("#92400e");
  });
  it("L2 → dark slate", () => {
    expect(getPhaseColor("L2")).toBe("#1e293b");
  });
  it("L3 → gray", () => {
    expect(getPhaseColor("L3")).toBe("#6b7280");
  });
  it("unknown → blue (default)", () => {
    expect(getPhaseColor("N")).toBe("#3b82f6");
    expect(getPhaseColor("PE")).toBe("#3b82f6");
  });
});
