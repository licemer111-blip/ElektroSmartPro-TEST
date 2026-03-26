// ============================================================
// lib/power-logic.ts — 3-Phase Load Balancing Logic
// ElektroSmart PRO · PN-HD 60364 / IEC 60364-1
// ============================================================

export interface PhaseLoad {
  L1: number;
  L2: number;
  L3: number;
}

export interface PhaseLoadResult {
  /** Raw phase currents before diversity factor (A) */
  rawPhaseLoads: PhaseLoad;
  /** Effective phase currents after diversity factor (A) */
  phaseLoads: PhaseLoad;
  /** 3-phase contribution per phase (A, after Kj) */
  threePhasePart: number;
  /** Max phase current (A) */
  maxPhase: number;
  /** Min phase current (A) */
  minPhase: number;
  /** Phase with max load */
  maxPhaseName: "L1" | "L2" | "L3";
  /** Phase with min load */
  minPhaseName: "L1" | "L2" | "L3";
  /** Asymmetry ratio: (max - min) / max × 100 (%) */
  asymmetryPct: number;
  /** true if asymmetry > 30% */
  hasAsymmetry: boolean;
  /** Diversity factor applied */
  diversityFactor: number;
  /** Whether the panel is 3-phase */
  is3Phase: boolean;
}

export interface CircuitInput {
  uid: string;
  label?: string;
  rating: number;
  /** Assigned phase: "L1" | "L2" | "L3" | undefined (auto round-robin) */
  phase?: string;
  /** Number of poles (1 = 1P, 3+ = 3P) */
  poles: number;
}

/**
 * Compute per-phase load distribution for a panel section.
 *
 * Formula per PN-HD 60364 §311:
 *   I_total(Lx) = (Σ I_1P assigned to Lx) × Kj_1P + I_3P × Kj_3P
 *
 * @param circuits   Outgoing breakers/RCBOs (NOT main switch, NOT RCDs)
 * @param is3Phase   Whether the main switch is 3-phase
 * @param mainRating Main switch rating (A), used for Kj selection
 */
export function computePhaseLoads(
  circuits: CircuitInput[],
  is3Phase: boolean,
  mainRating: number
): PhaseLoadResult {
  const circuits1P = circuits.filter(c => c.poles < 3);
  const circuits3P = circuits.filter(c => c.poles >= 3);

  // ── Diversity factor (Kj) ──────────────────────────────────
  const isResidential = mainRating > 0 && mainRating <= 63;

  const getKj1P = (n: number): number => {
    if (!is3Phase && isResidential) {
      if (n <= 2) return 0.8;
      if (n <= 4) return 0.5;
      if (n <= 9) return 0.3;
      if (n <= 20) return 0.25;
      return 0.2;
    }
    if (n <= 2) return 1.0;
    if (n <= 4) return 0.8;
    if (n <= 9) return 0.6;
    if (n <= 20) return 0.5;
    if (n <= 40) return 0.4;
    return 0.35;
  };

  const getKj3P = (n: number): number => {
    if (isResidential) {
      if (n <= 1) return 1.0;
      if (n <= 3) return 0.6;
      return 0.5;
    }
    if (n <= 2) return 1.0;
    if (n <= 4) return 0.8;
    if (n <= 9) return 0.6;
    if (n <= 20) return 0.5;
    if (n <= 40) return 0.4;
    return 0.35;
  };

  const kj1P = getKj1P(circuits1P.length);
  const kj3P = getKj3P(circuits3P.length);

  // Weighted average Kj for display
  const totalN = circuits1P.length + circuits3P.length;
  const diversityFactor = totalN > 0
    ? Math.round(((kj1P * circuits1P.length + kj3P * circuits3P.length) / totalN) * 100) / 100
    : 1.0;

  // ── 1P circuits: assign to phases ─────────────────────────
  // Use explicit phase assignment if available, otherwise round-robin L1→L2→L3
  const raw1P: PhaseLoad = { L1: 0, L2: 0, L3: 0 };

  if (is3Phase) {
    const phaseKeys: Array<"L1" | "L2" | "L3"> = ["L1", "L2", "L3"];
    let rrIdx = 0;
    for (const c of circuits1P) {
      const ph = (c.phase === "L1" || c.phase === "L2" || c.phase === "L3")
        ? c.phase
        : phaseKeys[rrIdx % 3];
      raw1P[ph] += c.rating;
      if (!c.phase) rrIdx++;
    }
  } else {
    // 1-phase panel: all on L1
    for (const c of circuits1P) {
      raw1P.L1 += c.rating;
    }
  }

  // ── 3P circuits: add equally to all three phases ──────────
  const sum3P = circuits3P.reduce((s, c) => s + c.rating, 0);
  const threePhasePart3P = sum3P / 3; // per-phase contribution (raw)

  // ── Apply diversity factors ────────────────────────────────
  const eff3PPerPhase = threePhasePart3P * kj3P;

  const phaseLoads: PhaseLoad = {
    L1: Math.round((raw1P.L1 * kj1P + eff3PPerPhase) * 10) / 10,
    L2: Math.round((raw1P.L2 * kj1P + eff3PPerPhase) * 10) / 10,
    L3: Math.round((raw1P.L3 * kj1P + eff3PPerPhase) * 10) / 10,
  };

  const rawPhaseLoads: PhaseLoad = {
    L1: Math.round((raw1P.L1 + threePhasePart3P) * 10) / 10,
    L2: Math.round((raw1P.L2 + threePhasePart3P) * 10) / 10,
    L3: Math.round((raw1P.L3 + threePhasePart3P) * 10) / 10,
  };

  // ── Asymmetry ──────────────────────────────────────────────
  const vals: Array<{ name: "L1" | "L2" | "L3"; val: number }> = [
    { name: "L1", val: phaseLoads.L1 },
    { name: "L2", val: phaseLoads.L2 },
    { name: "L3", val: phaseLoads.L3 },
  ];

  const maxEntry = vals.reduce((a, b) => b.val > a.val ? b : a);
  const minEntry = vals.reduce((a, b) => b.val < a.val ? b : a);

  const asymmetryPct = maxEntry.val > 0
    ? Math.round(((maxEntry.val - minEntry.val) / maxEntry.val) * 100)
    : 0;

  return {
    rawPhaseLoads,
    phaseLoads,
    threePhasePart: Math.round(eff3PPerPhase * 10) / 10,
    maxPhase: maxEntry.val,
    minPhase: minEntry.val,
    maxPhaseName: maxEntry.name,
    minPhaseName: minEntry.name,
    asymmetryPct,
    hasAsymmetry: asymmetryPct > 30,
    diversityFactor,
    is3Phase,
  };
}

/**
 * Find the most overloaded circuit on a given phase.
 * Used for diagnostic message: "Przenieś obwód '[Nazwa]' na [target]"
 */
export function findHeaviestCircuitOnPhase(
  circuits: CircuitInput[],
  phase: "L1" | "L2" | "L3"
): CircuitInput | undefined {
  return circuits
    .filter(c => c.poles < 3 && (c.phase === phase || (!c.phase && phase === "L1")))
    .sort((a, b) => b.rating - a.rating)[0];
}
