/**
 * tests/reality-check.test.ts
 * ─────────────────────────────────────────────────────────────────
 * Reality Check v1.3 — test suite for all 4 Expert Rules.
 *
 * Rule 1 — Hardness Guard: żelbet×8.0 | beton×5.0 | silikat×2.5
 * Rule 2 — Gravity Guard: sufit/strop/antresola → +50%
 * Rule 3 — Safety Integrity: indukcja/pompa/EV/sauna → safetyNote
 * Rule 4 — CrossSectionGuard: WLZ ≥10mm² → floor 40 PLN/mb | ≥35mm² → 65 PLN/mb
 * Rule 4b — Metal Guard: YAKY/Al detected → +17.5% overhead for connections + materialSuggestion
 */
import { describe, it, expect } from "vitest";
import {
  applyRealityCheck,
  detectHardnessMaterial,
  RC_BASE_PRICE_STD_PLN,
  RC_BASE_PRICE_MB_PLN,
  RC_MULT_ZELBET,
  RC_MULT_BETON,
  RC_MULT_SILIKAT,
  RC_GRAVITY_MULT,
  OVERHEAD_RE,
  SAFETY_DEVICE_RE,
  getSafetyDeviceLabel,
  extractCableSection,
  RC_WLZ_FLOOR_10MM2,
  RC_WLZ_FLOOR_35MM2,
  WLZ_SECTION_THRESHOLD_MEDIUM,
  WLZ_SECTION_THRESHOLD_HEAVY,
  detectCableMetal,
  ALUMINUM_CABLE_RE,
  COPPER_CABLE_RE,
  AL_CONNECTION_RE,
  RC_AL_CONNECTION_OVERHEAD,
} from "@/lib/services/reality-check";

// ─────────────────────────────────────────────────────────────────
// Rule 1 — Hardness Guard
// ─────────────────────────────────────────────────────────────────
describe("RC Rule 1 — Hardness Guard", () => {
  it("constants: żelbet×8, beton×5, silikat×2.5, base_szt=45, base_mb=15", () => {
    expect(RC_BASE_PRICE_STD_PLN).toBe(45.00);
    expect(RC_BASE_PRICE_MB_PLN).toBe(15.00);
    expect(RC_MULT_ZELBET).toBe(8.0);
    expect(RC_MULT_BETON).toBe(5.0);
    expect(RC_MULT_SILIKAT).toBe(2.5);
  });

  it("detectHardnessMaterial: żelbet wins over beton", () => {
    expect(detectHardnessMaterial("ściana żelbetowa")).toMatchObject({ keyword: "żelbet", multiplier: 8.0 });
    expect(detectHardnessMaterial("ściana betonowa")).toMatchObject({ keyword: "beton", multiplier: 5.0 });
    expect(detectHardnessMaterial("ściana z silikat")).toMatchObject({ keyword: "silikat", multiplier: 2.5 });
    expect(detectHardnessMaterial("cegła ceramiczna")).toBeNull();
  });

  it("detectHardnessMaterial: zelbet in context string", () => {
    expect(detectHardnessMaterial("Bruzdowanie do lamp żelbet")).toMatchObject({ keyword: "żelbet" });
  });

  it("Rule 1 szt: 5.00 PLN for gniazdko w żelbecie → raised to 45×8=360 PLN", () => {
    const rc = applyRealityCheck({
      name: "Montaż gniazdka w żelbecie",
      unit: "szt",
      suggestedLabor: 5.00,
    });
    const floor = RC_BASE_PRICE_STD_PLN * RC_MULT_ZELBET;
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(floor);
    expect(rc.realityCheckApplied).toBe(true);
    expect(rc.note.toLowerCase()).toContain("żelbet"); // note capitalizes keyword
  });

  it("Rule 1 szt: beton floor = 45×5 = 225 PLN (Polish declension: betonie)", () => {
    const rc = applyRealityCheck({
      name: "Wiercenie w betonie", // Polish declension of 'beton'
      unit: "szt",
      suggestedLabor: 12.00,
    });
    const floor = RC_BASE_PRICE_STD_PLN * RC_MULT_BETON;
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(floor);
  });

  it("Rule 1 szt: silikat floor = 45×2.5 = 112.5 PLN", () => {
    const rc = applyRealityCheck({
      name: "Montaż puszki w silikat",
      unit: "szt",
      suggestedLabor: 10.00,
    });
    const floor = RC_BASE_PRICE_STD_PLN * RC_MULT_SILIKAT;
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(floor);
  });

  it("Rule 1 mb: żelbet floor = 15×8 = 120 PLN/mb", () => {
    const rc = applyRealityCheck({
      name: "Bruzdowanie w żelbecie",
      unit: "mb",
      suggestedLabor: 7.20,
    });
    const floor = RC_BASE_PRICE_MB_PLN * RC_MULT_ZELBET;
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(floor);
    expect(rc.realityCheckApplied).toBe(true);
  });

  it("Rule 1: price above floor — NOT overridden, no change", () => {
    const rc = applyRealityCheck({
      name: "Montaż gniazdka w żelbecie",
      unit: "szt",
      suggestedLabor: 400.00, // above 360 floor
    });
    expect(rc.suggestedLabor).toBe(400.00);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("Rule 1 from hardContext (not item name)", () => {
    const rc = applyRealityCheck({
      name: "Bruzdowanie do lamp",
      hardContext: "żelbet",
      unit: "mb",
      suggestedLabor: 7.20,
    });
    expect(rc.realityCheckApplied).toBe(true);
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(RC_BASE_PRICE_MB_PLN * RC_MULT_ZELBET);
  });

  it("Rule 1: assembly child is bypassed", () => {
    const rc = applyRealityCheck({
      name: "Montaż puszki w żelbecie",
      unit: "szt",
      suggestedLabor: 5.00,
      isAssemblyChild: true,
    });
    expect(rc.suggestedLabor).toBe(5.00);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("calc_log contains hardness keyword + multiplier", () => {
    const rc = applyRealityCheck({
      name: "Montaż gniazdka w betonie",
      unit: "szt",
      suggestedLabor: 5.00,
    });
    expect(rc.calculationLog).toContain("Hardness Guard");
    expect(rc.calculationLog).toContain("beton");
    expect(rc.calculationLog).toContain("× 5");
  });
});

// ─────────────────────────────────────────────────────────────────
// Rule 2 — Gravity Guard
// ─────────────────────────────────────────────────────────────────
describe("RC Rule 2 — Gravity Guard", () => {
  it("constants: gravity multiplier = 1.5", () => {
    expect(RC_GRAVITY_MULT).toBe(1.5);
  });

  it("OVERHEAD_RE matches: sufit (suficie), strop (stropie), antresola, nad głową", () => {
    expect(OVERHEAD_RE.test("Montaż listwy na suficie")).toBe(true);  // sufficit forms
    expect(OVERHEAD_RE.test("Montaż na sufitowy")).toBe(true);         // sufitow prefix
    expect(OVERHEAD_RE.test("Instalacja na stropie")).toBe(true);        // strop stem
    expect(OVERHEAD_RE.test("Montaż na antresoli")).toBe(true);         // antresol prefix
    expect(OVERHEAD_RE.test("praca nad głową")).toBe(true);             // nad głow
    expect(OVERHEAD_RE.test("Montaż gniazdka")).toBe(false);
    expect(OVERHEAD_RE.test("podłączenie w piwnicy")).toBe(false);
  });

  it("Rule 2: GENERAL item on sufit → +50% labor", () => {
    const rc = applyRealityCheck({
      name: "Montaż listwy LED na suficie",
      unit: "mb",
      suggestedLabor: 20.00,
    });
    expect(rc.suggestedLabor).toBe(20.00 * 1.5);
    expect(rc.realityCheckApplied).toBe(true);
    expect(rc.note).toContain("+50%");
  });

  it("Rule 2: 0 labor — no change (nothing to multiply)", () => {
    const rc = applyRealityCheck({
      name: "Montaż kabla na suficie",
      unit: "mb",
      suggestedLabor: 0,
    });
    expect(rc.suggestedLabor).toBe(0);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("Rule 2: via hardContext — antresola in context triggers guard", () => {
    const rc = applyRealityCheck({
      name: "Montaż lamp",
      hardContext: "antresola",
      unit: "szt",
      suggestedLabor: 40.00,
    });
    expect(rc.suggestedLabor).toBe(40.00 * 1.5);
  });

  it("Rule 2: assembly child bypassed", () => {
    const rc = applyRealityCheck({
      name: "Kabel na suficie",
      unit: "mb",
      suggestedLabor: 20.00,
      isAssemblyChild: true,
    });
    expect(rc.suggestedLabor).toBe(20.00);
  });

  it("calc_log contains Gravity Guard label", () => {
    const rc = applyRealityCheck({
      name: "Montaż oprawy na stropie",
      unit: "szt",
      suggestedLabor: 50.00,
    });
    expect(rc.calculationLog).toContain("Gravity Guard");
    expect(rc.calculationLog).toContain("+50%");
  });
});

// ─────────────────────────────────────────────────────────────────
// Rule 3 — Safety Integrity
// ─────────────────────────────────────────────────────────────────
describe("RC Rule 3 — Safety Integrity", () => {
  it("SAFETY_DEVICE_RE matches: indukcja, pompa ciepła, EV ładowarka, sauna", () => {
    expect(SAFETY_DEVICE_RE.test("Kuchenka indukcyjna")).toBe(true);
    expect(SAFETY_DEVICE_RE.test("Podłączenie pompy ciepła")).toBe(true); // pomp.*ciep
    expect(SAFETY_DEVICE_RE.test("Ładowarka EV 11kW")).toBe(true);  // adowarka.*ev
    expect(SAFETY_DEVICE_RE.test("ladowarka EV")).toBe(true);             // ASCII variant
    expect(SAFETY_DEVICE_RE.test("Podłączenie sauny")).toBe(true);
    expect(SAFETY_DEVICE_RE.test("Montaż gniazdka")).toBe(false);
    expect(SAFETY_DEVICE_RE.test("Kabel YDYp 3x2.5")).toBe(false);
  });

  it("getSafetyDeviceLabel: correct labels", () => {
    expect(getSafetyDeviceLabel("Kuchenka indukcyjna")).toBe("kuchenka indukcyjna");
    expect(getSafetyDeviceLabel("Podłączenie pompy ciepła")).toBe("pompa ciepła");
    expect(getSafetyDeviceLabel("Ładowarka EV")).toBe("ładowarka EV"); // NFD normalize: ładowarka EV
    expect(getSafetyDeviceLabel("ladowarka EV")).toBe("ładowarka EV");  // ASCII variant
    expect(getSafetyDeviceLabel("Montaż sauny")).toBe("sauna");
    expect(getSafetyDeviceLabel("Montaż gniazdka")).toBeNull();
  });

  it("Rule 3: indukcja item gets safetyNote", () => {
    const rc = applyRealityCheck({
      name: "Podłączenie kuchenki indukcyjnej",
      unit: "szt",
      suggestedLabor: 150.00,
    });
    expect(rc.safetyNote).toBeDefined();
    expect(rc.safetyNote).toContain("RCD");
    expect(rc.safetyNote).toContain("MCB");
  });

  it("Rule 3: pompa ciepła gets safetyNote with label", () => {
    const rc = applyRealityCheck({
      name: "Montaż pompy ciepła 9kW", // pomp.*ciep in SAFETY_DEVICE_RE
      unit: "szt",
      suggestedLabor: 200.00,
    });
    expect(rc.safetyNote).toBeDefined();
    expect(rc.safetyNote).toContain("RCD");
  });

  it("Rule 3: regular item — no safetyNote", () => {
    const rc = applyRealityCheck({
      name: "Montaż gniazdka",
      unit: "szt",
      suggestedLabor: 45.00,
    });
    expect(rc.safetyNote).toBeUndefined();
  });

  it("Rule 3: does NOT change price — only adds notification", () => {
    const rc = applyRealityCheck({
      name: "Podłączenie kuchenki indukcyjnej",
      unit: "szt",
      suggestedLabor: 150.00,
    });
    expect(rc.suggestedLabor).toBe(150.00);
  });
});

// ─────────────────────────────────────────────────────────────────
// Rule 4 — CrossSectionGuard
// ─────────────────────────────────────────────────────────────────
describe("RC Rule 4 — CrossSectionGuard (WLZ / Heavy Power Cables)", () => {
  it("constants: thresholds 10 / 35 mm², floors 40 / 65 PLN/mb", () => {
    expect(WLZ_SECTION_THRESHOLD_MEDIUM).toBe(10);
    expect(WLZ_SECTION_THRESHOLD_HEAVY).toBe(35);
    expect(RC_WLZ_FLOOR_10MM2).toBe(40.0);
    expect(RC_WLZ_FLOOR_35MM2).toBe(65.0);
  });

  it("extractCableSection: parses 5x10, 4x16, 3×2,5, 5x35", () => {
    expect(extractCableSection("WLZ YKYzo 5x10")).toBe(10);
    expect(extractCableSection("Kabel YKY 4x16mm²")).toBe(16);
    expect(extractCableSection("Linia 3×2,5")).toBeCloseTo(2.5);
    expect(extractCableSection("Linia 5x35")).toBe(35);
    expect(extractCableSection("NHXMH 5x25")).toBe(25);
  });

  it("extractCableSection: rejects voltage patterns 1×230V, 3×400V", () => {
    expect(extractCableSection("Gniazdo 1×230V")).toBeNull();
    expect(extractCableSection("Silnik 3×400V")).toBeNull();
    expect(extractCableSection("Napęcie 1x230v")).toBeNull();
  });

  it("extractCableSection: returns null when no pattern", () => {
    expect(extractCableSection("Montaż gniazda")).toBeNull();
    expect(extractCableSection("Bruzdowanie")).toBeNull();
  });

  // ── PRIMARY VALIDATION — the reported bug ────────────────────────────────
  it("Rule 4: Linia WLZ YKYzo 5x10 at 2.16 PLN → raised to 40–60 PLN/mb", () => {
    const rc = applyRealityCheck({
      name: "Linia WLZ YKYzo 5x10",
      unit: "mb",
      suggestedLabor: 2.16,
    });
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(RC_WLZ_FLOOR_10MM2);
    expect(rc.suggestedLabor).toBeLessThanOrEqual(60);
    expect(rc.realityCheckApplied).toBe(true);
    expect(rc.calculationLog).toContain("CrossSectionGuard");
    expect(rc.calculationLog).toContain("10mm²");
    expect(rc.note).toContain("Minimum 40 PLN/mb");
  });

  it("Rule 4: section ≥35mm² → HEAVY_CONNECTION floor 65 PLN/mb", () => {
    const rc = applyRealityCheck({
      name: "Linia WLZ YKYzo 5x35",
      unit: "mb",
      suggestedLabor: 15.00,
    });
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(RC_WLZ_FLOOR_35MM2);
    expect(rc.realityCheckApplied).toBe(true);
    expect(rc.calculationLog).toContain("HEAVY_CONNECTION");
    expect(rc.calculationLog).toContain("35mm²");
  });

  it("Rule 4: thin cable 3x1.5 (1.5mm² < 10mm²) — NOT triggered", () => {
    const rc = applyRealityCheck({
      name: "Przewód YDYp 3x1.5",
      unit: "mb",
      suggestedLabor: 10.00,
    });
    expect(rc.suggestedLabor).toBe(10.00);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("Rule 4: 3x2,5mm² — NOT triggered", () => {
    const rc = applyRealityCheck({
      name: "Kabel YDYp 3x2,5mm²",
      unit: "mb",
      suggestedLabor: 8.00,
    });
    expect(rc.suggestedLabor).toBe(8.00);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("Rule 4: 4x6mm² — NOT triggered (below 10mm² threshold)", () => {
    const rc = applyRealityCheck({
      name: "YKY 4x6",
      unit: "mb",
      suggestedLabor: 12.00,
    });
    expect(rc.suggestedLabor).toBe(12.00);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("Rule 4: price already above floor — NOT overridden", () => {
    const rc = applyRealityCheck({
      name: "WLZ YKY 5x10",
      unit: "mb",
      suggestedLabor: 55.00,
    });
    expect(rc.suggestedLabor).toBe(55.00);
    expect(rc.realityCheckApplied).toBe(false);
    expect(rc.calculationLog).toContain("cena OK");
  });

  it("Rule 4: NOT triggered for non-linear unit (szt)", () => {
    const rc = applyRealityCheck({
      name: "Kabel YKY 5x10 (komplet)",
      unit: "szt",
      suggestedLabor: 5.00,
    });
    expect(rc.realityCheckApplied).toBe(false);
    expect(rc.suggestedLabor).toBe(5.00);
  });

  it("Rule 4: assembly child is bypassed", () => {
    const rc = applyRealityCheck({
      name: "Kabel WLZ 5x10",
      unit: "mb",
      suggestedLabor: 2.00,
      isAssemblyChild: true,
    });
    expect(rc.suggestedLabor).toBe(2.00);
    expect(rc.realityCheckApplied).toBe(false);
  });

  it("Rule 4: NHXMH fire-resistant cable 5x25 — triggered (≥10mm²)", () => {
    const rc = applyRealityCheck({
      name: "Kabel NHXMH 5x25",
      unit: "mb",
      suggestedLabor: 5.00,
    });
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(RC_WLZ_FLOOR_10MM2);
    expect(rc.realityCheckApplied).toBe(true);
  });

  it("Rule 4: voltage pattern guard — Gniazdo 1×230V NOT triggered", () => {
    const rc = applyRealityCheck({
      name: "Gniazdo 1×230V podtynkowe",
      unit: "mb",
      suggestedLabor: 5.00,
    });
    expect(rc.realityCheckApplied).toBe(false);
    expect(rc.suggestedLabor).toBe(5.00);
  });
});

// ─────────────────────────────────────────────────────────────────
// Rule 4b — Metal Guard (Aluminum vs Copper)
// ─────────────────────────────────────────────────────────────────
describe("RC Rule 4b — Metal Guard (Aluminum vs Copper)", () => {
  it("constants: RC_AL_CONNECTION_OVERHEAD = 0.175", () => {
    expect(RC_AL_CONNECTION_OVERHEAD).toBe(0.175);
  });

  it("ALUMINUM_CABLE_RE matches: YAKY, YAKYzo, AsXSn, Alu, Al", () => {
    expect(ALUMINUM_CABLE_RE.test("WLZ YAKY 4x35")).toBe(true);
    expect(ALUMINUM_CABLE_RE.test("Kabel YAKYzo 4x16")).toBe(true);
    expect(ALUMINUM_CABLE_RE.test("AsXSn 4x10")).toBe(true);
    expect(ALUMINUM_CABLE_RE.test("Kabel Alu 4x25")).toBe(true);
    expect(ALUMINUM_CABLE_RE.test("Kabel Al 4x50")).toBe(true);
    expect(ALUMINUM_CABLE_RE.test("Kabel YKY 5x10")).toBe(false);    // copper
    expect(ALUMINUM_CABLE_RE.test("Montaż gniazda")).toBe(false);
  });

  it("COPPER_CABLE_RE matches: YKY, YKYzo, YDYp, Cu, Miedź", () => {
    expect(COPPER_CABLE_RE.test("Kabel YKY 5x10")).toBe(true);
    expect(COPPER_CABLE_RE.test("YKYzo 5x10")).toBe(true);
    expect(COPPER_CABLE_RE.test("Przewód YDYp 3x2.5")).toBe(true);
    expect(COPPER_CABLE_RE.test("przewod Cu 10mm")).toBe(true);
    expect(COPPER_CABLE_RE.test("Miedź 35mm")).toBe(true);
    expect(COPPER_CABLE_RE.test("YAKY 4x35")).toBe(false);           // aluminum
  });

  it("AL_CONNECTION_RE matches: podłączenie, przyłącze, zacisk, końcówka", () => {
    expect(AL_CONNECTION_RE.test("Podłączenie kabla")).toBe(true);
    expect(AL_CONNECTION_RE.test("Przyłącze główne")).toBe(true);
    expect(AL_CONNECTION_RE.test("Montaż zacisku Al")).toBe(true);
    expect(AL_CONNECTION_RE.test("Końcówka kablowa")).toBe(true);
    expect(AL_CONNECTION_RE.test("Uładanie kabla")).toBe(false);
    expect(AL_CONNECTION_RE.test("Linia WLZ YAKY")).toBe(false);
  });

  it("detectCableMetal: YAKY → aluminum, YKY → copper, brak → null", () => {
    expect(detectCableMetal("Linia WLZ YAKY 4x35")).toBe("aluminum");
    expect(detectCableMetal("Kabel YAKYzo 4x16")).toBe("aluminum");
    expect(detectCableMetal("AsXSn 4x10")).toBe("aluminum");
    expect(detectCableMetal("Kabel YKYzo 5x10")).toBe("copper");
    expect(detectCableMetal("Przewód YDYp 3x2.5")).toBe("copper");
    expect(detectCableMetal("Montaż gniazda")).toBeNull();
    expect(detectCableMetal("Bruzdowanie")).toBeNull();
  });

  // ── PRIMARY VALIDATION — the reported WLZ YAKY 4x35 case ────────────────
  it("Rule 4+4b: Linia WLZ YAKY 4x35 → HEAVY [Al] floor ≥65 PLN/mb + materialSuggestion", () => {
    const rc = applyRealityCheck({
      name: "Linia WLZ YAKY 4x35",
      unit: "mb",
      suggestedLabor: 2.16,
    });
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(RC_WLZ_FLOOR_35MM2);
    expect(rc.realityCheckApplied).toBe(true);
    expect(rc.calculationLog).toContain("HEAVY_CONNECTION");
    expect(rc.calculationLog).toContain("[Al]");
    expect(rc.materialSuggestion).toBeDefined();
    expect(rc.materialSuggestion).toContain("Pasta stykowa Al-Cu");
    expect(rc.materialSuggestion).toContain("Końcówki");
  });

  it("Rule 4b: aluminum cable any section → materialSuggestion set", () => {
    const rc = applyRealityCheck({
      name: "Kabel YAKY 4x10",
      unit: "mb",
      suggestedLabor: 5.00,
    });
    expect(rc.materialSuggestion).toBeDefined();
    expect(rc.materialSuggestion).toContain("Pasta stykowa Al-Cu");
  });

  it("Rule 4b: copper cable — NO materialSuggestion", () => {
    const rc = applyRealityCheck({
      name: "Kabel YKYzo 5x10",
      unit: "mb",
      suggestedLabor: 5.00,
    });
    expect(rc.materialSuggestion).toBeUndefined();
  });

  it("Rule 4b: Al connection overhead +17.5% applied on top of HEAVY floor", () => {
    const expectedBase  = RC_WLZ_FLOOR_35MM2; // 65
    const expectedFloor = Math.round(expectedBase * (1 + RC_AL_CONNECTION_OVERHEAD) * 100) / 100;
    const rc = applyRealityCheck({
      name: "Podłączenie kabla YAKY 4x35",
      unit: "mb",
      suggestedLabor: 2.00,
    });
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(expectedFloor);
    expect(rc.calculationLog).toContain("Al-Cu Connection Overhead");
    expect(rc.calculationLog).toContain("+18%");
  });

  it("Rule 4b: Al connection overhead NOT applied for laying (no connection keyword)", () => {
    const layingRc = applyRealityCheck({
      name: "Uładanie kabla YAKY 4x35",
      unit: "mb",
      suggestedLabor: 2.00,
    });
    const connectionRc = applyRealityCheck({
      name: "Podłączenie kabla YAKY 4x35",
      unit: "mb",
      suggestedLabor: 2.00,
    });
    expect(connectionRc.suggestedLabor).toBeGreaterThan(layingRc.suggestedLabor);
  });

  it("Rule 4b: materialSuggestion NOT set for non-linear (szt) Al item", () => {
    const rc = applyRealityCheck({
      name: "Zacisk Al YAKY 4x35 (komplet)",
      unit: "szt",
      suggestedLabor: 15.00,
    });
    expect(rc.materialSuggestion).toBeUndefined();
  });

  it("Rule 4b: assembly child bypassed — no materialSuggestion", () => {
    const rc = applyRealityCheck({
      name: "Kabel YAKY 4x35",
      unit: "mb",
      suggestedLabor: 2.00,
      isAssemblyChild: true,
    });
    expect(rc.materialSuggestion).toBeUndefined();
    expect(rc.realityCheckApplied).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Combined rules
// ─────────────────────────────────────────────────────────────────
describe("RC combined rules interaction", () => {
  it("Rules 1+3 both apply: pompa ciepła in beton", () => {
    const rc = applyRealityCheck({
      name: "Montaż pompy ciepła w betonie",
      unit: "szt",
      suggestedLabor: 50.00,
    });
    const floor = RC_BASE_PRICE_STD_PLN * RC_MULT_BETON;
    expect(rc.suggestedLabor).toBeGreaterThanOrEqual(floor);
    expect(rc.safetyNote).toBeDefined(); // Rule 3
    expect(rc.realityCheckApplied).toBe(true); // Rule 1
  });

  it("Rules 2+3 both apply: indukcja na suficie", () => {
    const rc = applyRealityCheck({
      name: "Montaż kuchenki indukcyjnej na suficie",
      unit: "szt",
      suggestedLabor: 100.00,
    });
    expect(rc.suggestedLabor).toBe(100.00 * 1.5);
    expect(rc.safetyNote).toBeDefined();
  });
});
