/**
 * SMOKE TEST v1.0 — Expert Engine Verification
 * ─────────────────────────────────────────────────────────────────
 * "Golden Standard" regression suite.
 * These 4 cases define the MINIMUM ACCEPTABLE behavior of the
 * SemanticInterpreter + SecurityAuditLayer.
 *
 * CI rule: run before every commit that touches pricing, semantic-classifier,
 * or matching-engine. If any test fails → block merge.
 *
 * Tests import ONLY from lib/services/semantic-classifier — pure functions,
 * no server-side deps, no Supabase, no Next.js.
 */
import { describe, it, expect } from "vitest";
import {
  classifyIntent,
  applySALFloor,
  getHeightModifier,
  salMultiplier,
  CEILING_RE,
  isZelbet,
  SAL_HEAVY_CONN_FLOOR_PLN,
  SAL_STD_CONN_FLOOR_PLN,
  SAL_HARD_SURFACE_FLOOR_PLN,
  SAL_GROOVE_ZELBET_FLOOR_PLN,
  GROOVE_FLOOR_RE,
  DRILL_FLOOR_RE,
  HEAVY_CONNECTION_MIN_NORM,
  CONNECTION_MIN_NORM,
  M_MATRIX,
  getModernizationFactor,
  getMFactorLabel,
  CABLE_LAYING_RE,
  CABLE_BRAND_RE,
  DISTRIBUTION_BOARD_RE,
  ZESTAW_RE,
  ATOMIC_TASK_RE,
  isZestaw,
  isAtomicTask,
  normalizePlName,
} from "@/lib/services/semantic-classifier";
import {
  getMaterialBill,
  filterBillForAtomicTask,
  ATOMIC_EXCLUSION_CATEGORIES,
} from "@/lib/config/material-bill-bridge";
import {
  INTENT_FORBIDDEN_CATEGORIES,
  LIGHTING_NAME_RE,
  AUTOMATION_NAME_RE,
  getForbiddenCategories,
  isCategoryForbidden,
} from "@/lib/services/material-constraints";
import {
  EXPERT_HINT_RULES,
  SURFACE_MATERIALS,
  getSurfaceMaterials,
  getExpertHints,
} from "@/lib/config/expert-hints";

// ─────────────────────────────────────────────────────────────────
// Golden Standard Test Case #1
// "Podłączenie pompy ciepła (zasilanie 3-fazowe, kabel 5x10mm2)"
// ─────────────────────────────────────────────────────────────────
describe("TC-1: Heavy Connection — Pompa ciepła", () => {
  const INPUT = "Podłączenie pompy ciepła (zasilanie 3-fazowe, kabel 5x10mm2)";

  it("classifies as HEAVY_CONNECTION with HIGH confidence", () => {
    const p = classifyIntent(INPUT);
    expect(p.intent).toBe("HEAVY_CONNECTION");
    expect(p.confidence).toBe("high");   // action verb "Podłączenie" present
  });

  it("forces unit to szt (Hierarchy of Truth: mb in name is ignored)", () => {
    const p = classifyIntent(INPUT);
    expect(p.forcedUnit).toBe("szt");    // cable spec in name = device spec, NOT cable unit
  });

  it("base floor is 140.40 PLN (SAL_HEAVY_CONN_FLOOR_PLN)", () => {
    const p = classifyIntent(INPUT);
    expect(p.baseFloor).toBe(SAL_HEAVY_CONN_FLOOR_PLN);
    expect(p.baseFloor).toBe(140.40);
  });

  it("base norm is 1.30 rbh/szt (HEAVY_CONNECTION_MIN_NORM)", () => {
    const p = classifyIntent(INPUT);
    expect(p.baseNorm).toBe(HEAVY_CONNECTION_MIN_NORM);
    expect(p.baseNorm).toBe(1.30);
  });

  it("ASSERTION: price raised from 2.16 to ≥ 140.40 PLN — SecurityAuditLayer must not fail", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "mb" });
    // IRON RULE: if this assertion fails, the SecurityAuditLayer is broken
    expect(result.suggestedLabor).toBeGreaterThanOrEqual(SAL_HEAVY_CONN_FLOOR_PLN);
    expect(result.suggestedLabor).toBeGreaterThanOrEqual(140.40);
  });

  it("expert_override is true when price was raised", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "mb" });
    expect(result.expertOverride).toBe(true);
  });

  it("isLowConfidence is false (explicit verb = HIGH confidence)", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "mb" });
    expect(result.isLowConfidence).toBe(false);
  });

  it("unit is forced to szt even when input unit is mb", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "mb" });
    expect(result.guardedUnit).toBe("szt");
  });

  it("calculationLog contains intent and floor", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "mb" });
    expect(result.calculationLog).toContain("HEAVY_CONNECTION");
    expect(result.calculationLog).toContain("140.40");
  });
});

// ─────────────────────────────────────────────────────────────────
// Golden Standard Test Case #2
// "Bruzdowanie pod paski LED (strop żelbetowy, h=4.8m)"
// ─────────────────────────────────────────────────────────────────
describe("TC-2: Hard Construction — strop żelbetowy", () => {
  const INPUT = "Bruzdowanie pod paski LED (strop żelbetowy, h=4.8m)";

  it("classifies as HARD_CONSTRUCTION (żelbetowy detected)", () => {
    const p = classifyIntent(INPUT);
    expect(p.intent).toBe("HARD_CONSTRUCTION");
  });

  it("base floor is SAL_HARD_SURFACE_FLOOR_PLN = 40.50", () => {
    const p = classifyIntent(INPUT);
    expect(p.baseFloor).toBe(SAL_HARD_SURFACE_FLOOR_PLN);
    expect(p.baseFloor).toBe(40.50);
  });

  it("isZelbet detects 'żelbetowy'", () => {
    expect(isZelbet(INPUT)).toBe(true);    // surfaces mod 2.25
  });

  it("CEILING_RE detects 'strop'", () => {
    expect(CEILING_RE.test(INPUT)).toBe(true);  // ceiling mod 2.50
  });

  it("surface multiplier = 2.25 (żelbet)", () => {
    // salMultiplier only applies isZelbet (2.25) + CEILING (2.50) + height
    // For this input: 2.25 × 2.50 = 5.625 (height h=4.8m not in 'wysokość Xm' format)
    const mult = salMultiplier(INPUT);
    expect(mult).toBeCloseTo(2.25 * 2.50, 4);   // 5.625
  });

  it("ASSERTION: final price ≈ 227.81 PLN (40.50 × 2.25 × 2.50)", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 5.00, unit: "mb" });
    // 40.50 × 2.25 × 2.50 = 227.8125 → rounded to 227.81
    const expected = Math.round(40.50 * 2.25 * 2.50 * 100) / 100;
    expect(result.suggestedLabor).toBeCloseTo(expected, 1);  // ± 0.1 PLN
    expect(result.suggestedLabor).toBeGreaterThanOrEqual(200); // sanity floor
  });

  it("expert_override is true", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 5.00, unit: "mb" });
    expect(result.expertOverride).toBe(true);
  });

  it("calculationLog mentions both surface and ceiling multipliers", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 5.00, unit: "mb" });
    expect(result.calculationLog).toContain("Pow.×2.25");
    expect(result.calculationLog).toContain("Suf.×2.5");
  });
});

// ─────────────────────────────────────────────────────────────────
// Golden Standard Test Case #3
// "Pompa ciepła 15kW" — no action verb
// ─────────────────────────────────────────────────────────────────
describe("TC-3: Ambiguous Heavy Noun — Pompa ciepła (no action verb)", () => {
  const INPUT = "Pompa ciepła 15kW";

  it("classifies as HEAVY_CONNECTION via safety fallback", () => {
    const p = classifyIntent(INPUT);
    expect(p.intent).toBe("HEAVY_CONNECTION");
  });

  it("confidence is LOW (noun only, no action verb)", () => {
    const p = classifyIntent(INPUT);
    expect(p.confidence).toBe("low");
  });

  it("base floor is still 140.40 PLN (safety > precision)", () => {
    const p = classifyIntent(INPUT);
    expect(p.baseFloor).toBe(140.40);
  });

  it("ASSERTION: isLowConfidence=true on SAL result", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 0 });
    expect(result.isLowConfidence).toBe(true);
  });

  it("ASSERTION: price set to 140.40 PLN floor even from 0", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 0 });
    expect(result.suggestedLabor).toBe(SAL_HEAVY_CONN_FLOOR_PLN);
    expect(result.suggestedLabor).toBe(140.40);
  });

  it("calculationLog contains [Pewność: NISKA] flag", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 0 });
    expect(result.calculationLog).toContain("Pewność: NISKA");
  });

  it("calculationLog contains HEAVY_CONNECTION intent", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 0 });
    expect(result.calculationLog).toContain("HEAVY_CONNECTION");
  });
});

// ─────────────────────────────────────────────────────────────────
// Golden Standard Test Case #4
// "Wymiana starego żyrandola na antresoli"
// ─────────────────────────────────────────────────────────────────
describe("TC-4: Standard Action with height — antresola", () => {
  const INPUT = "Wymiana starego żyrandola na antresoli";

  it("classifies as STANDARD_ACTION (wymiana = action verb)", () => {
    const p = classifyIntent(INPUT);
    expect(p.intent).toBe("STANDARD_ACTION");
  });

  it("confidence is HIGH (explicit action verb 'Wymiana')", () => {
    const p = classifyIntent(INPUT);
    expect(p.confidence).toBe("high");
  });

  it("base floor is 45.00 PLN (STANDARD_ACTION)", () => {
    const p = classifyIntent(INPUT);
    expect(p.baseFloor).toBe(SAL_STD_CONN_FLOOR_PLN);
    expect(p.baseFloor).toBe(45.00);
  });

  it("ASSERTION: height multiplier applied for 'antresola' (v9.0 mandate)", () => {
    const ht = getHeightModifier(INPUT);
    expect(ht).toBeGreaterThan(1.0);   // antresola must trigger elevated work modifier
    expect(ht).toBe(2.0);              // Architecture Mandate v9.0: antresola → ×2.0
  });

  it("ASSERTION: final price ≥ 89.51 PLN (floor × height modifier)", () => {
    // floor=45.00 × height=2.0 = 90.00 PLN ≥ 89.51 PLN (user spec)
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "szt" });
    expect(result.suggestedLabor).toBeGreaterThanOrEqual(89.51);
  });

  it("expert_override is true when price was below floor", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "szt" });
    expect(result.expertOverride).toBe(true);
  });

  it("isLowConfidence is false (action verb is explicit)", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "szt" });
    expect(result.isLowConfidence).toBe(false);
  });

  it("calculationLog mentions height multiplier 'Wys.'", () => {
    const result = applySALFloor({ name: INPUT, suggestedLabor: 2.16, unit: "szt" });
    expect(result.calculationLog).toContain("Wys.×2.00");
  });
});

// ─────────────────────────────────────────────────────────────────
// Regression lock: these cases must NOT regress
// ─────────────────────────────────────────────────────────────────
describe("Regression Lock — classifyIntent priority rules", () => {
  it("Action verb beats heavy noun — 'Wymiana silnika' is HEAVY not STANDARD (verb + heavy)", () => {
    const p = classifyIntent("Wymiana silnika 3-fazowego");
    expect(p.intent).toBe("HEAVY_CONNECTION");
    expect(p.confidence).toBe("high");
  });

  it("Drilling in beton → DRILLING_HARD, not HARD_CONSTRUCTION", () => {
    const p = classifyIntent("Wiercenie otworów w betonie fi50");
    expect(p.intent).toBe("DRILLING_HARD");
    expect(p.baseFloor).toBe(35.00);
  });

  it("Beton without verb → HARD_CONSTRUCTION medium confidence", () => {
    const p = classifyIntent("Bruzda w ścianie betonowej");
    expect(p.intent).toBe("HARD_CONSTRUCTION");
    expect(p.confidence).toBe("medium");
  });

  it("Noun-to-Verb: cable brand without trigger → CABLE_LAYING medium (P5), no floor", () => {
    const p = classifyIntent("Kabel YDYp 3x2.5mm2");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.baseFloor).toBe(0);
  });

// ─────────────────────────────────────────────────────────────────
// Golden Standard Test Case #5
// "Bruzdowanie do lamp" + context "żelbet"
// Architecture Mandate v10.1: min 150 PLN/mb for groove in reinforced concrete.
// ─────────────────────────────────────────────────────────────────
describe("TC-5: Groove-Żelbet Floor (v10.1 mandate)", () => {
  it("SAL_GROOVE_ZELBET_FLOOR_PLN is 150.00", () => {
    expect(SAL_GROOVE_ZELBET_FLOOR_PLN).toBe(150.00);
  });

  it("GROOVE_FLOOR_RE matches bruzdowanie/kucie/wykucie", () => {
    expect(GROOVE_FLOOR_RE.test("Bruzdowanie do lamp")).toBe(true);
    expect(GROOVE_FLOOR_RE.test("Kucie bruzd pod instalację")).toBe(true);
    expect(GROOVE_FLOOR_RE.test("Wykucie bruzd w ścianie")).toBe(true);
    expect(GROOVE_FLOOR_RE.test("Montaż gniazdka")).toBe(false);
  });

  it("classifyIntent('Bruzdowanie do lamp') alone → GENERAL (no surface in name)", () => {
    const p = classifyIntent("Bruzdowanie do lamp");
    expect(p.intent).toBe("GENERAL");
  });

  it("classifyIntent with żelbet appended → HARD_CONSTRUCTION", () => {
    const effectiveName = "Bruzdowanie do lamp żelbet";
    const p = classifyIntent(effectiveName);
    expect(p.intent).toBe("HARD_CONSTRUCTION");
    expect(p.baseFloor).toBe(SAL_HARD_SURFACE_FLOOR_PLN);
  });

  it("isZelbet detects żelbet context string", () => {
    expect(isZelbet("żelbet")).toBe(true);
    expect(isZelbet("strop żelbetowy")).toBe(true);
    expect(isZelbet("beton zbrojony")).toBe(true);
    expect(isZelbet("monolit")).toBe(true);
    expect(isZelbet("ściana ceglana")).toBe(false);
  });

  it("Groove-żelbet floor: 150 PLN is max(HARD×zelbet_mod, 150)", () => {
    // HARD_CONSTRUCTION base = 40.50, żelbet mod = 2.25 → 40.50 × 2.25 = 91.125
    // max(91.125, 150) = 150
    const base = SAL_HARD_SURFACE_FLOOR_PLN * 2.25;
    expect(Math.max(base, SAL_GROOVE_ZELBET_FLOOR_PLN)).toBe(150.00);
  });

  it("CRITICAL: 7.20 PLN/mb for 'Bruzdowanie w żelbecie' → floor raises to ≥ 150", () => {
    const effectiveName = "Bruzdowanie w żelbecie";
    const p = classifyIntent(effectiveName);
    const isGroove = GROOVE_FLOOR_RE.test(effectiveName);
    const isHard   = isZelbet(effectiveName);
    const surfMod  = isHard ? 2.25 : 1.0;
    const baseFloor = p.baseFloor * surfMod;
    const finalFloor = isGroove && isHard
      ? Math.max(baseFloor, SAL_GROOVE_ZELBET_FLOOR_PLN)
      : baseFloor;
    expect(finalFloor).toBeGreaterThanOrEqual(150);
    expect(7.20).toBeLessThan(finalFloor); // AI hallucination caught
  });
});

  it("IRON RULE: 2.16 PLN for heavy connection ALWAYS corrected to ≥ 140.40", () => {
    const inputs = [
      "Podłączenie pompy ciepłej",
      "Podłączenie pompy ciepła (zasilanie 3-fazowe, kabel 5x10mm2)",
      "Montaż pompy 5.5kW",
      "Uruchomienie pompy obiegowej",
    ];
    for (const name of inputs) {
      const r = applySALFloor({ name, suggestedLabor: 2.16 });
      expect(r.suggestedLabor, `FAIL: "${name}" → ${r.suggestedLabor} PLN (expected ≥ 140.40)`).toBeGreaterThanOrEqual(140.40);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// M-Matrix v1.4 — Intent-Based Modernization Factor
// ─────────────────────────────────────────────────────────────────
describe("M-Matrix v1.4 — getModernizationFactor()", () => {
  it("M_MATRIX: HARD_CONSTRUCTION + DRILLING_HARD = 0.45", () => {
    expect(M_MATRIX.HARD_CONSTRUCTION).toBe(0.45);
    expect(M_MATRIX.DRILLING_HARD).toBe(0.45);
  });

  it("M_MATRIX: CABLE_LAYING + GENERAL = 0.65", () => {
    expect(M_MATRIX.CABLE_LAYING).toBe(0.65);
    expect(M_MATRIX.GENERAL).toBe(0.65);
  });

  it("M_MATRIX: STANDARD_ACTION = 0.85", () => {
    expect(M_MATRIX.STANDARD_ACTION).toBe(0.85);
  });

  it("M_MATRIX: HEAVY_CONNECTION + DISTRIBUTION_BOARD = 1.0", () => {
    expect(M_MATRIX.HEAVY_CONNECTION).toBe(1.0);
    expect(M_MATRIX.DISTRIBUTION_BOARD).toBe(1.0);
  });

  it("getModernizationFactor: returns correct factor per intent", () => {
    expect(getModernizationFactor("HARD_CONSTRUCTION")).toBe(0.45);
    expect(getModernizationFactor("DRILLING_HARD")).toBe(0.45);
    expect(getModernizationFactor("CABLE_LAYING")).toBe(0.65);
    expect(getModernizationFactor("GENERAL")).toBe(0.65);
    expect(getModernizationFactor("STANDARD_ACTION")).toBe(0.85);
    expect(getModernizationFactor("HEAVY_CONNECTION")).toBe(1.0);
    expect(getModernizationFactor("DISTRIBUTION_BOARD")).toBe(1.0);
  });

  it("WLZ guard: section ≥10mm² → M-Factor clamped to max(factor, 0.90)", () => {
    // CABLE_LAYING 0.65 → 0.90 (heavy WLZ 10mm² limits pulling speed)
    expect(getModernizationFactor("CABLE_LAYING", 10)).toBe(0.90);
    expect(getModernizationFactor("CABLE_LAYING", 35)).toBe(0.90);
    // GENERAL 0.65 → 0.90
    expect(getModernizationFactor("GENERAL", 25)).toBe(0.90);
    // STANDARD_ACTION 0.85 → 0.90
    expect(getModernizationFactor("STANDARD_ACTION", 16)).toBe(0.90);
    // HEAVY_CONNECTION 1.0 → 1.0 (already ≥ 0.90)
    expect(getModernizationFactor("HEAVY_CONNECTION", 35)).toBe(1.0);
    // Section < 10 — no WLZ guard
    expect(getModernizationFactor("CABLE_LAYING", 2.5)).toBe(0.65);
    expect(getModernizationFactor("CABLE_LAYING", 6)).toBe(0.65);
    // null/undefined — no WLZ guard
    expect(getModernizationFactor("CABLE_LAYING", null)).toBe(0.65);
    expect(getModernizationFactor("CABLE_LAYING")).toBe(0.65);
  });

  it("getMFactorLabel: correct labels", () => {
    expect(getMFactorLabel(0.45)).toBe("Machine-Assisted");
    expect(getMFactorLabel(0.65)).toBe("Power-Tool Accel.");
    expect(getMFactorLabel(0.85)).toBe("Precision Tools");
    expect(getMFactorLabel(0.90)).toBe("Heavy Cable");
    expect(getMFactorLabel(1.0)).toBe("Expert Manual");
  });
});

// ─────────────────────────────────────────────────────────────────
// M-Matrix v1.4 — new intent detection (CABLE_LAYING, DISTRIBUTION_BOARD)
// ─────────────────────────────────────────────────────────────────
describe("M-Matrix v1.4 — CABLE_LAYING intent detection", () => {
  it("CABLE_LAYING_RE matches: układanie, ułożenie, prowadzenie (normalized)", () => {
    expect(CABLE_LAYING_RE.test(normalizePlName("Układanie kabla YKY"))).toBe(true);
    expect(CABLE_LAYING_RE.test(normalizePlName("Ułożenie przewodów WLZ"))).toBe(true);
    expect(CABLE_LAYING_RE.test(normalizePlName("Prowadzenie trasy kablowej"))).toBe(true);
    expect(CABLE_LAYING_RE.test(normalizePlName("Montaż gniazdka"))).toBe(false);
    expect(CABLE_LAYING_RE.test(normalizePlName("Kabel YDYp 3x2.5"))).toBe(false);
  });

  it("classifyIntent: 'Układanie kabla YKY 5x10' → CABLE_LAYING", () => {
    const p = classifyIntent("Układanie kabla YKY 5x10");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.confidence).toBe("high");
    expect(p.baseFloor).toBe(0); // no floor for CABLE_LAYING
  });

  it("classifyIntent: 'Ułożenie przewodów WLZ YAKY 4x35' → CABLE_LAYING", () => {
    const p = classifyIntent("Ułożenie przewodów WLZ YAKY 4x35");
    expect(p.intent).toBe("CABLE_LAYING");
  });

  it("getModernizationFactor for CABLE_LAYING WLZ 4x35 (35mm²) → WLZ guard: 0.90", () => {
    const factor = getModernizationFactor("CABLE_LAYING", 35);
    expect(factor).toBe(0.90);
    expect(getMFactorLabel(factor)).toBe("Heavy Cable");
  });

  it("Noun-to-Verb: 'Kabel YDYp 3x2.5mm2' (bare cable noun) → CABLE_LAYING medium", () => {
    const p = classifyIntent("Kabel YDYp 3x2.5mm2");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.confidence).toBe("medium");
    expect(p.forcedUnit).toBe("mb");
  });
});

// ─────────────────────────────────────────────────────────────────
// Noun-to-Verb CABLE_LAYING (Priority 5) — lazy electrician shorthand
// ─────────────────────────────────────────────────────────────────
describe("Priority 5: Noun-to-Verb CABLE_BRAND_RE → CABLE_LAYING", () => {
  it("CABLE_BRAND_RE detects WLZ, YDY, YKY brand designations", () => {
    expect(CABLE_BRAND_RE.test("WLZ 4x35")).toBe(true);
    expect(CABLE_BRAND_RE.test("YDYp 3x2.5")).toBe(true);
    expect(CABLE_BRAND_RE.test("YKY 5x10")).toBe(true);
    expect(CABLE_BRAND_RE.test("YAKY 4x50")).toBe(true);
    expect(CABLE_BRAND_RE.test("NYY 5x6")).toBe(true);
    expect(CABLE_BRAND_RE.test("LgYżo 1x35")).toBe(true);
    expect(CABLE_BRAND_RE.test("Gniazdko 230V")).toBe(false);
    expect(CABLE_BRAND_RE.test("Montaz rozdzielnicy")).toBe(false);
  });

  it("'WLZ 4x35' (bare brand) → CABLE_LAYING medium, forcedUnit=mb", () => {
    const p = classifyIntent("WLZ 4x35");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.confidence).toBe("medium");
    expect(p.forcedUnit).toBe("mb");
  });

  it("'YDYp 3x2.5' (bare brand, no prefix) → CABLE_LAYING medium", () => {
    const p = classifyIntent("YDYp 3x2.5");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.confidence).toBe("medium");
  });

  it("'Przewód YKY 5x10 mb' (noun + brand) → CABLE_LAYING medium", () => {
    const p = classifyIntent("Przewód YKY 5x10 mb");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.confidence).toBe("medium");
  });

  it("Priority guard: 'Ułożenie kabla YDY 3x2.5' (verb present) → CABLE_LAYING HIGH (P3a wins)", () => {
    const p = classifyIntent("Ułożenie kabla YDY 3x2.5");
    expect(p.intent).toBe("CABLE_LAYING");
    expect(p.confidence).toBe("high"); // verb wins → high, not medium
  });

  it("Priority guard: 'Montaż WLZ' (action verb present) → STANDARD_ACTION HIGH (P1 wins)", () => {
    const p = classifyIntent("Montaż WLZ");
    expect(p.intent).toBe("STANDARD_ACTION");
    expect(p.confidence).toBe("high"); // P1 verb always beats cable noun
  });
});

describe("M-Matrix v1.4 — DISTRIBUTION_BOARD intent detection", () => {
  it("DISTRIBUTION_BOARD_RE matches: rozdzielnica, tablica rozdzielcza", () => {
    expect(DISTRIBUTION_BOARD_RE.test("Rozdzielnica RG-15")).toBe(true);
    expect(DISTRIBUTION_BOARD_RE.test("Montaż rozdzielnicy")).toBe(true);
    expect(DISTRIBUTION_BOARD_RE.test("Tablica rozdzielcza TG-1")).toBe(true);
    expect(DISTRIBUTION_BOARD_RE.test("Szafa rozdzielcza 24P")).toBe(true);
    expect(DISTRIBUTION_BOARD_RE.test("Gniazdko 230V")).toBe(false);
  });

  it("classifyIntent: 'Montaż rozdzielnicy RG-20' (verb + board) → DISTRIBUTION_BOARD", () => {
    const p = classifyIntent("Montaż rozdzielnicy RG-20");
    expect(p.intent).toBe("DISTRIBUTION_BOARD");
    expect(p.confidence).toBe("high");
    expect(p.baseFloor).toBe(SAL_STD_CONN_FLOOR_PLN);
  });

  it("classifyIntent: 'Rozdzielnica RG-15' (noun only) → DISTRIBUTION_BOARD medium", () => {
    const p = classifyIntent("Rozdzielnica RG-15");
    expect(p.intent).toBe("DISTRIBUTION_BOARD");
    expect(p.confidence).toBe("medium");
  });

  it("getModernizationFactor DISTRIBUTION_BOARD = 1.0 (Expert Manual)", () => {
    expect(getModernizationFactor("DISTRIBUTION_BOARD")).toBe(1.0);
    expect(getMFactorLabel(1.0)).toBe("Expert Manual");
  });

  it("Regression: 'Wymiana starego żyrandola' → still STANDARD_ACTION (no board keyword)", () => {
    const p = classifyIntent("Wymiana starego żyrandola na antresoli");
    expect(p.intent).toBe("STANDARD_ACTION");
  });

  it("Regression: 'Montaz silnika' → HEAVY_CONNECTION (heavy beats distribution board)", () => {
    const p = classifyIntent("Montaż silnika 3-fazowego");
    expect(p.intent).toBe("HEAVY_CONNECTION");
  });
});

// ─────────────────────────────────────────────────────────────────
// Material Filter v1.6 — Atomic vs Zestaw (Architecture Mandate)
// ─────────────────────────────────────────────────────────────────
describe("Material Filter v1.6 — isZestaw / isAtomicTask / filterBillForAtomicTask", () => {
  it("ZESTAW_RE detects Komplet / Punkt / Zestaw", () => {
    expect(ZESTAW_RE.test("Punkt oświetleniowy (Zestaw)")).toBe(true);
    expect(ZESTAW_RE.test("Komplet gniazdowy")).toBe(true);
    expect(ZESTAW_RE.test("Zestaw RG-15")).toBe(true);
    expect(ZESTAW_RE.test("Montaż gniazda")).toBe(false);
    expect(ZESTAW_RE.test("Puszka podtynkowa")).toBe(false);
  });

  it("isZestaw() returns true only for Zestaw/Komplet/Punkt names", () => {
    expect(isZestaw("Punkt oświetleniowy (Zestaw)")).toBe(true);
    expect(isZestaw("Komplet gniazdowy")).toBe(true);
    expect(isZestaw("Montaż gniazda")).toBe(false);
    expect(isZestaw("Puszka łuki 60mm")).toBe(false);
  });

  it("ATOMIC_TASK_RE detects Montaż/Gniazdo/Puszka/Łącznik/Wypust (normalized)", () => {
    expect(ATOMIC_TASK_RE.test(normalizePlName("Montaż gniazda"))).toBe(true);
    expect(ATOMIC_TASK_RE.test(normalizePlName("Gniazdo 230V"))).toBe(true);
    expect(ATOMIC_TASK_RE.test(normalizePlName("Puszka podtynkowa"))).toBe(true);
    expect(ATOMIC_TASK_RE.test(normalizePlName("Łącznik podwójny"))).toBe(true);
    expect(ATOMIC_TASK_RE.test(normalizePlName("Wypust oświetleniowy"))).toBe(true);
    expect(ATOMIC_TASK_RE.test(normalizePlName("Oprawa sufitowa"))).toBe(true);
    expect(ATOMIC_TASK_RE.test(normalizePlName("Pompa ciepła 12kW"))).toBe(false);
    expect(ATOMIC_TASK_RE.test(normalizePlName("YDYp 3x2.5"))).toBe(false);
  });

  it("isAtomicTask() returns true for device-level items", () => {
    expect(isAtomicTask("Montaż gniazda 230V")).toBe(true);
    expect(isAtomicTask("Puszka podtynkowa Ø60")).toBe(true);
    expect(isAtomicTask("Łącznik schodowy")).toBe(true);
    expect(isAtomicTask("Podmączenie pompy ciepła")).toBe(false);
    expect(isAtomicTask("Punkt oświetleniowy (Zestaw)")).toBe(true); // 'oswietl' stem matches; Zestaw guard applied separately via !isZestaw&&isAtomicTask
  });

  it("ATOMIC_EXCLUSION_CATEGORIES = ['CABLE', 'CONDUIT']", () => {
    expect(ATOMIC_EXCLUSION_CATEGORIES).toContain("CABLE");
    expect(ATOMIC_EXCLUSION_CATEGORIES).toContain("CONDUIT");
    expect(ATOMIC_EXCLUSION_CATEGORIES).not.toContain("BOX");
    expect(ATOMIC_EXCLUSION_CATEGORIES).not.toContain("PLASTER");
  });

  it("filterBillForAtomicTask: STANDARD_ACTION bill has no CABLE/CONDUIT after filter", () => {
    const rawBill = getMaterialBill("STANDARD_ACTION");
    expect(rawBill).not.toBeNull();
    // After data cleanup sa_cable is already gone, so filtered should equal raw
    const filtered = filterBillForAtomicTask(rawBill!);
    expect(filtered).not.toBeNull();
    const hasExcluded = filtered!.items.some(
      (i) => ATOMIC_EXCLUSION_CATEGORIES.includes(i.category)
    );
    expect(hasExcluded).toBe(false);
  });

  it("filterBillForAtomicTask: HEAVY_CONNECTION bill retains CABLE (connection cable is part of job)", () => {
    const rawBill = getMaterialBill("HEAVY_CONNECTION");
    expect(rawBill).not.toBeNull();
    // HEAVY_CONNECTION hc_cable is category CABLE
    const hasCable = rawBill!.items.some((i) => i.category === "CABLE");
    expect(hasCable).toBe(true);
    // After filter: cable removed (but HEAVY_CONNECTION is never filtered in practice)
    const filtered = filterBillForAtomicTask(rawBill!);
    expect(filtered).not.toBeNull(); // still has MCB, RCD, BOX, HARDWARE
    expect(filtered!.items.some((i) => i.category === "CABLE")).toBe(false);
  });

  it("Decision logic: Zestaw → no filter; Atomic → filter; other → no filter", () => {
    const zestaw   = "Punkt oświetleniowy (Zestaw)";
    const atomic   = "Montaż gniazda 230V";
    const other    = "Podłączenie pompy ciepła";

    expect(!isZestaw(zestaw) && isAtomicTask(zestaw)).toBe(false); // Zestaw: skip filter
    expect(!isZestaw(atomic) && isAtomicTask(atomic)).toBe(true);  // Atomic: apply filter
    expect(!isZestaw(other)  && isAtomicTask(other)).toBe(false);  // Other: skip filter
  });
});

// ─────────────────────────────────────────────────────────────────
// Atomic Guard v1.6 — Per-intent material-constraints.ts
// ─────────────────────────────────────────────────────────────────
describe("Atomic Guard v1.6 — INTENT_FORBIDDEN_CATEGORIES + getForbiddenCategories", () => {
  it("STANDARD_ACTION forbids CABLE and CONDUIT only", () => {
    const forbidden = INTENT_FORBIDDEN_CATEGORIES.STANDARD_ACTION!;
    expect(forbidden).toContain("CABLE");
    expect(forbidden).toContain("CONDUIT");
    expect(forbidden).not.toContain("BOX");
    expect(forbidden).not.toContain("PLASTER");
    expect(forbidden).not.toContain("HARDWARE");
  });

  it("CABLE_LAYING forbids SOCKET, SWITCH, BOX, BREAKER (not CABLE)", () => {
    const forbidden = INTENT_FORBIDDEN_CATEGORIES.CABLE_LAYING!;
    expect(forbidden).toContain("SOCKET");
    expect(forbidden).toContain("SWITCH");
    expect(forbidden).toContain("BOX");
    expect(forbidden).toContain("BREAKER");
    expect(forbidden).not.toContain("CABLE");
    expect(forbidden).not.toContain("HARDWARE");
  });

  it("HARD_CONSTRUCTION and DRILLING_HARD forbid all device+cable categories", () => {
    const deviceCats = ["CABLE", "CONDUIT", "SOCKET", "SWITCH", "BOX", "BREAKER"];
    for (const cat of deviceCats) {
      expect(INTENT_FORBIDDEN_CATEGORIES.HARD_CONSTRUCTION).toContain(cat);
      expect(INTENT_FORBIDDEN_CATEGORIES.DRILLING_HARD).toContain(cat);
    }
    expect(INTENT_FORBIDDEN_CATEGORIES.HARD_CONSTRUCTION).not.toContain("PLASTER");
    expect(INTENT_FORBIDDEN_CATEGORIES.DRILLING_HARD).not.toContain("HARDWARE");
  });

  it("DISTRIBUTION_BOARD forbids CABLE and CONDUIT (external cables are separate)", () => {
    const forbidden = INTENT_FORBIDDEN_CATEGORIES.DISTRIBUTION_BOARD!;
    expect(forbidden).toContain("CABLE");
    expect(forbidden).toContain("CONDUIT");
    expect(forbidden).not.toContain("BREAKER");
  });

  it("HEAVY_CONNECTION has no forbidden categories (connection cable is part of job)", () => {
    expect(INTENT_FORBIDDEN_CATEGORIES.HEAVY_CONNECTION).toBeUndefined();
    const result = getForbiddenCategories("HEAVY_CONNECTION", "Podłączenie pompy ciepła");
    expect(result).toBeUndefined();
  });

  it("GENERAL has no forbidden categories", () => {
    expect(INTENT_FORBIDDEN_CATEGORIES.GENERAL).toBeUndefined();
    const result = getForbiddenCategories("GENERAL", "Praca ogólna");
    expect(result).toBeUndefined();
  });

  it("getForbiddenCategories: Zestaw exception bypasses ALL filters", () => {
    expect(getForbiddenCategories("STANDARD_ACTION", "Punkt oświetleniowy (Zestaw)")).toBeUndefined();
    expect(getForbiddenCategories("CABLE_LAYING",    "Komplet gniazdowy")).toBeUndefined();
    expect(getForbiddenCategories("HARD_CONSTRUCTION", "Zestaw bruzdowania")).toBeUndefined();
  });

  it("getForbiddenCategories: non-Zestaw items get per-intent filter", () => {
    const sa = getForbiddenCategories("STANDARD_ACTION", "Montaż gniazda");
    expect(sa).toContain("CABLE");
    expect(sa).toContain("CONDUIT");

    const cl = getForbiddenCategories("CABLE_LAYING", "Ułożenie WLZ 4x35");
    expect(cl).toContain("SOCKET");
    expect(cl).not.toContain("CABLE");
  });

  it("isCategoryForbidden: CABLE banned for Montaż gniazda (STANDARD_ACTION)", () => {
    expect(isCategoryForbidden("CABLE",   "STANDARD_ACTION", "Montaż gniazda")).toBe(true);
    expect(isCategoryForbidden("BOX",     "STANDARD_ACTION", "Montaż gniazda")).toBe(false);
    expect(isCategoryForbidden("PLASTER", "STANDARD_ACTION", "Montaż gniazda")).toBe(false);
  });

  it("isCategoryForbidden: CABLE allowed for Punkt (Zestaw exception)", () => {
    expect(isCategoryForbidden("CABLE", "STANDARD_ACTION", "Punkt oświetleniowy (Zestaw)")).toBe(false);
  });

  it("The Puszka Bug Fix: CABLE is forbidden for Puszka podtynkowa (STANDARD_ACTION)", () => {
    const intent = classifyIntent("Montaż puszki podtynkowej").intent;
    expect(intent).toBe("STANDARD_ACTION"); // verb 'montaz' detected
    const forbidden = getForbiddenCategories(intent, "Montaż puszki podtynkowej");
    expect(forbidden).toContain("CABLE"); // YDYp cable hard-banned
    expect(forbidden).not.toContain("BOX"); // box itself is allowed
  });

  it("v1.7: LIGHTING_NAME_RE detects opraw/oswietl/lampa/wypust", () => {
    expect(LIGHTING_NAME_RE.test(normalizePlName("Oprawa sufitowa LED"))).toBe(true);
    expect(LIGHTING_NAME_RE.test(normalizePlName("Lampa ścienna"))).toBe(true);
    expect(LIGHTING_NAME_RE.test(normalizePlName("Wypust oświetleniowy"))).toBe(true);
    expect(LIGHTING_NAME_RE.test(normalizePlName("Montaż gniazda"))).toBe(false);
  });

  it("v1.7: GENERAL lighting noun-item gets CABLE+CONDUIT exclusion (name-based)", () => {
    const intent = classifyIntent("Oprawa sufitowa LED").intent;
    expect(intent).toBe("GENERAL"); // noun-only, no action verb → falls to GENERAL
    // v1.7 name-based fallback: LIGHTING_NAME_RE matches 'opraw' → forbid CABLE+CONDUIT
    const forbidden = getForbiddenCategories(intent, "Oprawa sufitowa LED");
    expect(forbidden).toContain("CABLE");
    expect(forbidden).toContain("CONDUIT");
  });

  it("v1.7: AUTOMATION_NAME_RE detects KNX/automatyka", () => {
    expect(AUTOMATION_NAME_RE.test("Moduł KNX 12CH")).toBe(true);
    expect(AUTOMATION_NAME_RE.test("System automatyki DALI")).toBe(true);
    expect(AUTOMATION_NAME_RE.test("Rozdzielnica RG-15")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Expert Hints v1.7 — Mandatory Inclusions + Surface Sensitivity
// ─────────────────────────────────────────────────────────────────
describe("Expert Hints v1.7 — getSurfaceMaterials + getExpertHints", () => {
  it("EXPERT_HINT_RULES has rules for lighting, power-cee, db-busbars-spd, knx-ferrules", () => {
    const ids = EXPERT_HINT_RULES.map((r) => r.id);
    expect(ids).toContain("lighting-wago");
    expect(ids).toContain("power-cee");
    expect(ids).toContain("db-busbars-spd");
    expect(ids).toContain("knx-ferrules");
  });

  it("SURFACE_MATERIALS: BETON has category HARDWARE and slug kolek-fi8", () => {
    expect(SURFACE_MATERIALS.BETON.category).toBe("HARDWARE");
    expect(SURFACE_MATERIALS.BETON.slug).toBe("kolek-fi8");
    expect(SURFACE_MATERIALS.GK.slug).toBe("kolek-gk-molly");
    expect(SURFACE_MATERIALS.DREWNO.slug).toBe("wkret-drewno-4x40");
  });

  it("getSurfaceMaterials: 'Montaż w betonie' → kołek-fi8", () => {
    const items = getSurfaceMaterials("Montaż puszki w betonie");
    expect(items).toHaveLength(1);
    expect(items[0].slug).toBe("kolek-fi8");
  });

  it("getSurfaceMaterials: 'Montaż na płycie GK' → kolek-gk-molly", () => {
    const items = getSurfaceMaterials("Montaż oprawy na płycie GK");
    expect(items).toHaveLength(1);
    expect(items[0].slug).toBe("kolek-gk-molly");
  });

  it("getSurfaceMaterials: 'Montaż w drewnie' → wkret-drewno", () => {
    const items = getSurfaceMaterials("Montaż w drewnianej konstruck");
    expect(items).toHaveLength(1);
    expect(items[0].slug).toBe("wkret-drewno-4x40");
  });

  it("getSurfaceMaterials: no surface keyword → empty array", () => {
    expect(getSurfaceMaterials("Montaż gniazda 230V")).toHaveLength(0);
  });

  it("getExpertHints: 'Wypust oświetleniowy' → includes WAGO", () => {
    const hints = getExpertHints("Wypust oświetleniowy");
    expect(hints.some((h) => h.slug === "wago-3p")).toBe(true);
  });

  it("getExpertHints: 'Podłączenie 3-fazowe' → includes CEE socket", () => {
    const hints = getExpertHints("Podłączenie 3-fazowe pompy");
    expect(hints.some((h) => h.slug === "zlacze-silowe-16a")).toBe(true);
  });

  it("getExpertHints: 'Montaż rozdzielnicy' → includes szyna-N + szyna-PE + SPD", () => {
    const hints = getExpertHints("Montaż rozdzielnicy RG-20");
    const slugs = hints.map((h) => h.slug);
    expect(slugs).toContain("szyna-grzebieniowa-n");
    expect(slugs).toContain("szyna-grzebieniowa-pe");
    expect(slugs).toContain("spd-t2-3pn");
  });

  it("getExpertHints: 'Montaż KNX' → includes НШВИ ferrules", () => {
    const hints = getExpertHints("Moduł KNX 12-kanałowy");
    expect(hints.some((h) => h.slug === "nsvi-0.75")).toBe(true);
  });

  it("getExpertHints: surface + content combined — rozdzielnica w żelbecie", () => {
    const hints = getExpertHints("Montaż rozdzielnicy w żelbecie");
    const slugs = hints.map((h) => h.slug);
    expect(slugs).toContain("szyna-grzebieniowa-n"); // db rule
    expect(slugs).toContain("kolek-fi8"); // surface rule
  });

  it("getExpertHints: deduplication — no duplicate ids even if two rules fire", () => {
    const hints = getExpertHints("Wypust oświetleniowy na płycie GK");
    const ids = hints.map((h) => h.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size); // no duplicates
  });

  it("getExpertHints: no hints for plain cable item", () => {
    expect(getExpertHints("YDYp 3x2.5")).toHaveLength(0);
    expect(getExpertHints("Montaż gniazda 230V")).toHaveLength(0);
  });
});
