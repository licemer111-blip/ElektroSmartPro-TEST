/**
 * Power Logic Tests — ElektroSmart PRO
 *
 * Tests for computePhaseLoads() and findHeaviestCircuitOnPhase()
 * from lib/power-logic.ts
 *
 * Standard: PN-HD 60364 / IEC 60364-1
 */
import { describe, it, expect } from "vitest";
import { computePhaseLoads, findHeaviestCircuitOnPhase, type CircuitInput } from "@/lib/power-logic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mkCircuit(uid: string, rating: number, poles = 1, phase?: "L1" | "L2" | "L3"): CircuitInput {
  return { uid, label: uid, rating, poles, phase };
}

// ─── computePhaseLoads — 1-phase panel ────────────────────────────────────────

describe("computePhaseLoads — 1-phase panel", () => {
  it("empty panel returns zeros", () => {
    const r = computePhaseLoads([], false, 25);
    expect(r.phaseLoads.L1).toBe(0);
    expect(r.phaseLoads.L2).toBe(0);
    expect(r.phaseLoads.L3).toBe(0);
    expect(r.asymmetryPct).toBe(0);
    expect(r.is3Phase).toBe(false);
  });

  it("single 16A circuit on 1-phase panel", () => {
    const r = computePhaseLoads([mkCircuit("c1", 16)], false, 25);
    // 1-phase residential (25A ≤ 63A): Kj for n=1 → 0.8
    expect(r.phaseLoads.L1).toBeCloseTo(16 * 0.8, 1);
    expect(r.phaseLoads.L2).toBe(0);
    expect(r.phaseLoads.L3).toBe(0);
  });

  it("all circuits go to L1 on 1-phase panel", () => {
    const circuits = [
      mkCircuit("c1", 16),
      mkCircuit("c2", 16),
      mkCircuit("c3", 10),
    ];
    const r = computePhaseLoads(circuits, false, 25);
    expect(r.phaseLoads.L2).toBe(0);
    expect(r.phaseLoads.L3).toBe(0);
    expect(r.phaseLoads.L1).toBeGreaterThan(0);
  });

  it("1-phase panel: L2/L3=0 so asymmetry is 100% (all load on L1)", () => {
    // On a 1-phase panel all circuits go to L1, L2 and L3 stay 0.
    // asymmetryPct = (max - min) / max * 100 = (L1 - 0) / L1 * 100 = 100%
    const r = computePhaseLoads([mkCircuit("c1", 20), mkCircuit("c2", 16)], false, 25);
    expect(r.phaseLoads.L2).toBe(0);
    expect(r.phaseLoads.L3).toBe(0);
    expect(r.asymmetryPct).toBe(100);
    expect(r.hasAsymmetry).toBe(true);
  });
});

// ─── computePhaseLoads — 3-phase panel ────────────────────────────────────────

describe("computePhaseLoads — 3-phase panel", () => {
  it("3 equal circuits round-robin → perfect balance, 0% asymmetry", () => {
    const circuits = [
      mkCircuit("c1", 16), // → L1
      mkCircuit("c2", 16), // → L2
      mkCircuit("c3", 16), // → L3
    ];
    const r = computePhaseLoads(circuits, true, 63);
    expect(r.phaseLoads.L1).toBeCloseTo(r.phaseLoads.L2, 1);
    expect(r.phaseLoads.L2).toBeCloseTo(r.phaseLoads.L3, 1);
    expect(r.asymmetryPct).toBe(0);
    expect(r.hasAsymmetry).toBe(false);
  });

  it("explicit phase assignment overrides round-robin", () => {
    const circuits = [
      mkCircuit("c1", 32, 1, "L1"),
      mkCircuit("c2", 32, 1, "L1"),
      mkCircuit("c3", 10, 1, "L2"),
    ];
    const r = computePhaseLoads(circuits, true, 63);
    // L1 should be heavier than L2
    expect(r.phaseLoads.L1).toBeGreaterThan(r.phaseLoads.L2);
    expect(r.maxPhaseName).toBe("L1");
  });

  it("detects asymmetry >30%", () => {
    // L1: 3×32A, L2: 10A, L3: 10A → heavy imbalance
    const circuits = [
      mkCircuit("c1", 32, 1, "L1"),
      mkCircuit("c2", 32, 1, "L1"),
      mkCircuit("c3", 32, 1, "L1"),
      mkCircuit("c4", 10, 1, "L2"),
      mkCircuit("c5", 10, 1, "L3"),
    ];
    const r = computePhaseLoads(circuits, true, 100);
    expect(r.hasAsymmetry).toBe(true);
    expect(r.asymmetryPct).toBeGreaterThan(30);
  });

  it("3P motor circuit adds equally to all phases", () => {
    const circuits = [mkCircuit("motor1", 32, 3)];
    const r = computePhaseLoads(circuits, true, 63);
    expect(r.phaseLoads.L1).toBeCloseTo(r.phaseLoads.L2, 1);
    expect(r.phaseLoads.L2).toBeCloseTo(r.phaseLoads.L3, 1);
    expect(r.asymmetryPct).toBe(0);
  });

  it("mixed 1P + 3P circuits", () => {
    const circuits = [
      mkCircuit("motor", 16, 3),   // 3P
      mkCircuit("c1", 16, 1, "L1"), // 1P
      mkCircuit("c2", 16, 1, "L2"), // 1P
    ];
    const r = computePhaseLoads(circuits, true, 63);
    // All phases should have load (3P contributes to all)
    expect(r.phaseLoads.L1).toBeGreaterThan(0);
    expect(r.phaseLoads.L2).toBeGreaterThan(0);
    expect(r.phaseLoads.L3).toBeGreaterThan(0);
  });

  it("diversity factor decreases with more circuits (Kj ≤ 1)", () => {
    const few = [mkCircuit("c1", 16), mkCircuit("c2", 16)];
    const many = Array.from({ length: 15 }, (_, i) => mkCircuit(`c${i}`, 16));
    const rFew = computePhaseLoads(few, true, 100);
    const rMany = computePhaseLoads(many, true, 100);
    // More circuits → lower Kj → lower effective load per circuit
    expect(rMany.diversityFactor).toBeLessThan(rFew.diversityFactor);
  });

  it("maxPhaseName and minPhaseName are correct", () => {
    const circuits = [
      mkCircuit("c1", 32, 1, "L1"),
      mkCircuit("c2", 32, 1, "L1"),
      mkCircuit("c3", 10, 1, "L2"),
      mkCircuit("c4", 10, 1, "L3"),
    ];
    const r = computePhaseLoads(circuits, true, 100);
    expect(r.maxPhaseName).toBe("L1");
    expect(["L2", "L3"]).toContain(r.minPhaseName);
  });

  it("is3Phase flag is passed through correctly", () => {
    const r1 = computePhaseLoads([], false, 25);
    const r2 = computePhaseLoads([], true, 63);
    expect(r1.is3Phase).toBe(false);
    expect(r2.is3Phase).toBe(true);
  });
});

// ─── Diversity factor (Kj) thresholds ─────────────────────────────────────────

describe("Diversity factor (Kj) — PN-HD 60364", () => {
  it("residential 1-phase: 1-2 circuits → Kj=0.8", () => {
    const r = computePhaseLoads([mkCircuit("c1", 10)], false, 25);
    expect(r.diversityFactor).toBeCloseTo(0.8, 2);
  });

  it("residential 1-phase: 3-4 circuits → Kj=0.5", () => {
    const circuits = [mkCircuit("c1", 10), mkCircuit("c2", 10), mkCircuit("c3", 10)];
    const r = computePhaseLoads(circuits, false, 25);
    expect(r.diversityFactor).toBeCloseTo(0.5, 2);
  });

  it("commercial 3-phase: 1-2 circuits → Kj=1.0", () => {
    const r = computePhaseLoads([mkCircuit("c1", 16)], true, 100);
    expect(r.diversityFactor).toBeCloseTo(1.0, 2);
  });

  it("commercial 3-phase: 3-4 circuits → Kj=0.8", () => {
    const circuits = [mkCircuit("c1", 16), mkCircuit("c2", 16), mkCircuit("c3", 16)];
    const r = computePhaseLoads(circuits, true, 100);
    expect(r.diversityFactor).toBeCloseTo(0.8, 2);
  });
});

// ─── findHeaviestCircuitOnPhase ───────────────────────────────────────────────

describe("findHeaviestCircuitOnPhase", () => {
  const circuits: CircuitInput[] = [
    mkCircuit("c1", 16, 1, "L1"),
    mkCircuit("c2", 32, 1, "L1"),
    mkCircuit("c3", 10, 1, "L2"),
    mkCircuit("c4", 20, 1, "L3"),
  ];

  it("returns heaviest circuit on L1", () => {
    const result = findHeaviestCircuitOnPhase(circuits, "L1");
    expect(result?.uid).toBe("c2");
    expect(result?.rating).toBe(32);
  });

  it("returns heaviest circuit on L2", () => {
    const result = findHeaviestCircuitOnPhase(circuits, "L2");
    expect(result?.uid).toBe("c3");
  });

  it("returns heaviest circuit on L3", () => {
    const result = findHeaviestCircuitOnPhase(circuits, "L3");
    expect(result?.uid).toBe("c4");
  });

  it("returns undefined for empty phase", () => {
    const result = findHeaviestCircuitOnPhase([], "L1");
    expect(result).toBeUndefined();
  });

  it("ignores 3P circuits (only 1P circuits per phase)", () => {
    const mixed = [
      mkCircuit("motor", 100, 3), // 3P — should be ignored
      mkCircuit("c1", 16, 1, "L1"),
    ];
    const result = findHeaviestCircuitOnPhase(mixed, "L1");
    expect(result?.uid).toBe("c1");
  });
});
