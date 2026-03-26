export type ConductorMaterial = "copper" | "aluminum";
export type InstallMethod = "A1" | "B1" | "B2" | "C" | "D" | "E" | "F";
export type InsulationType = "PVC" | "XLPE";

// PN-HD 60364-5-52 Table B.52-3 — Iz (A) for Cu/PVC, various methods
// [A1, B1, B2, C, D, E, F]
export const CABLE_CAPACITY_CU_PVC: Record<number, number[]> = {
  1.5:  [13, 15.5, 15, 17.5, 18, 19.5, 22],
  2.5:  [17.5, 21, 20, 24, 24, 27, 30],
  4:    [23, 28, 27, 32, 31, 36, 40],
  6:    [29, 36, 34, 41, 39, 46, 51],
  10:   [39, 50, 46, 57, 52, 63, 70],
  16:   [52, 68, 62, 76, 67, 85, 94],
  25:   [66, 89, 80, 101, 86, 110, 119],
  35:   [80, 110, 99, 125, 103, 137, 147],
  50:   [93, 134, 118, 151, 122, 167, 179],
  70:   [117, 171, 149, 192, 151, 214, 229],
  95:   [141, 207, 179, 232, 179, 259, 278],
  120:  [161, 239, 206, 269, 203, 299, 322],
  150:  [182, 272, 233, 309, 230, 341, 371],
  185:  [205, 311, 263, 353, 258, 390, 424],
  240:  [236, 365, 306, 415, 297, 459, 500],
  300:  [265, 419, 349, 472, 336, 526, 576],
};

// Cu/XLPE (approx 1.15× PVC values)
export const CABLE_CAPACITY_CU_XLPE: Record<number, number[]> = Object.fromEntries(
  Object.entries(CABLE_CAPACITY_CU_PVC).map(([s, vals]) => [s, vals.map(v => Math.round(v * 1.15))])
);

// Al/PVC (approx 0.78× Cu/PVC)
export const CABLE_CAPACITY_AL_PVC: Record<number, number[]> = Object.fromEntries(
  Object.entries(CABLE_CAPACITY_CU_PVC).map(([s, vals]) => [s, vals.map(v => Math.round(v * 0.78))])
);

export const INSTALL_METHOD_INDEX: Record<InstallMethod, number> = {
  A1: 0, B1: 1, B2: 2, C: 3, D: 4, E: 5, F: 6,
};

export const INSTALL_METHOD_LABELS: Record<InstallMethod, string> = {
  A1: "A1 – w izolacji ściany",
  B1: "B1 – w rurach w ścianie",
  B2: "B2 – w rurach pod tynkiem",
  C:  "C – na ścianie/suficie",
  D:  "D – w ziemi",
  E:  "E – drabinka kablowa",
  F:  "F – wolno w powietrzu",
};

export const TEMP_CORRECTION: Record<string, Record<InsulationType, number>> = {
  "10": { PVC: 1.22, XLPE: 1.15 },
  "15": { PVC: 1.17, XLPE: 1.12 },
  "20": { PVC: 1.12, XLPE: 1.08 },
  "25": { PVC: 1.06, XLPE: 1.04 },
  "30": { PVC: 1.00, XLPE: 1.00 },
  "35": { PVC: 0.94, XLPE: 0.96 },
  "40": { PVC: 0.87, XLPE: 0.91 },
  "45": { PVC: 0.79, XLPE: 0.87 },
  "50": { PVC: 0.71, XLPE: 0.82 },
};

export const GROUPING_CORRECTION: Record<string, number> = {
  "1": 1.00, "2": 0.80, "3": 0.70, "4": 0.65, "5": 0.60,
  "6": 0.57, "9": 0.50, "12": 0.45,
};

// Resistivity (Ω·mm²/m at 20°C)
export const RESISTIVITY: Record<ConductorMaterial, number> = {
  copper:   0.0175,
  aluminum: 0.0283,
};

export const CABLE_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
export const STANDARD_BREAKERS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

export interface CableParams {
  current: string;
  voltage: string;
  phases: "1" | "3";
  length: string;
  conductor: ConductorMaterial;
  insulation: InsulationType;
  installMethod: InstallMethod;
  temperature: string;
  grouping: string;
  powerFactor: string;
}

export interface CableResult {
  designCurrent: number;
  correctedCurrent: number;
  tempFactor: number;
  groupFactor: number;
  recommendedSection: number;
  cableCapacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
  isVoltageDropOk: boolean;
  recommendedBreaker: number;
  isCableOk: boolean;
  warning?: string;
}

function getCapacityTable(conductor: ConductorMaterial, insulation: InsulationType) {
  if (conductor === "copper")   return insulation === "PVC" ? CABLE_CAPACITY_CU_PVC : CABLE_CAPACITY_CU_XLPE;
  return CABLE_CAPACITY_AL_PVC;
}

function selectSection(corrected: number, table: Record<number, number[]>, methodIdx: number): number {
  const sections = Object.keys(table).map(Number).sort((a, b) => a - b);
  for (const s of sections) {
    if ((table[s][methodIdx] ?? 0) >= corrected) return s;
  }
  return 300;
}

function getBreaker(current: number) {
  for (const b of STANDARD_BREAKERS) { if (b >= current) return b; }
  return 250;
}

export function calculateCable(p: CableParams): CableResult {
  const I      = parseFloat(p.current);
  const V      = parseFloat(p.voltage);
  const L      = parseFloat(p.length);
  const pf     = parseFloat(p.powerFactor);
  const tempF  = TEMP_CORRECTION[p.temperature]?.[p.insulation] ?? 1.0;
  const groupF = GROUPING_CORRECTION[p.grouping] ?? 1.0;
  const corrF  = tempF * groupF;
  const corrected = I / corrF;

  const table    = getCapacityTable(p.conductor, p.insulation);
  const methIdx  = INSTALL_METHOD_INDEX[p.installMethod];
  const section  = selectSection(corrected, table, methIdx);
  const capacity = (table[section] ?? [])[methIdx] ?? 0;

  // Voltage drop: simplified ΔU = 2ILρ/S (1ph) or √3ILρ/S (3ph)
  const rho   = RESISTIVITY[p.conductor];
  const drop  = p.phases === "1"
    ? (2 * I * L * rho) / section
    : (Math.sqrt(3) * I * L * rho) / section;
  const dropPct   = (drop / V) * 100;
  const isVdOk    = dropPct <= 5;
  const breaker   = getBreaker(I);
  const isCableOk = (capacity * corrF) >= breaker;

  let warning: string | undefined;
  if (p.conductor === "aluminum" && section < 10) {
    warning = "Dla aluminium minimalny przekrój to 10 mm²!";
  } else if (dropPct > 3 && dropPct <= 5) {
    warning = "Spadek napięcia w granicach 3-5% (akceptowalny, ale niezalecany).";
  } else if (!isVdOk) {
    warning = `Spadek napięcia ${dropPct.toFixed(1)}% przekracza normę 5%! Zwiększ przekrój.`;
  }

  return {
    designCurrent: I, correctedCurrent: corrected,
    tempFactor: tempF, groupFactor: groupF,
    recommendedSection: section, cableCapacity: capacity,
    voltageDrop: drop, voltageDropPercent: dropPct,
    isVoltageDropOk: isVdOk, recommendedBreaker: breaker,
    isCableOk, warning,
  };
}
