export interface Load {
  id: string;
  name: string;
  power: number;
  quantity: number;
  simultaneity: number;
}

export type ConductorType = "copper" | "aluminum";
export type InstallMethod = "B1" | "B2" | "C" | "E";

// Same Cu/PVC columns as the cable calculator (PN-HD 60364-5-52, 2 loaded conductors).
// B1 = pipes in a wall. C = clipped to a wall. Al ≈ 0.78 × Cu, same factor as the cable tool.
export const CABLE_CAPACITY_CU_B1: Record<number, number> = {
  1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110,
  50: 134, 70: 171, 95: 207, 120: 239, 150: 272, 185: 311, 240: 365, 300: 419,
};

export const CABLE_CAPACITY_AL_B1: Record<number, number> = {
  1.5: 12, 2.5: 16, 4: 22, 6: 28, 10: 39, 16: 53, 25: 69, 35: 86,
  50: 105, 70: 133, 95: 161, 120: 186, 150: 212, 185: 243, 240: 285, 300: 327,
};

export const CABLE_CAPACITY_CU_C: Record<number, number> = {
  1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125,
  50: 151, 70: 192, 95: 232, 120: 269, 150: 309, 185: 353, 240: 415, 300: 472,
};

export const CABLE_CAPACITY_AL_C: Record<number, number> = {
  1.5: 14, 2.5: 19, 4: 25, 6: 32, 10: 44, 16: 59, 25: 79, 35: 98,
  50: 118, 70: 150, 95: 181, 120: 210, 150: 241, 185: 275, 240: 324, 300: 368,
};

// Same Cu/PVC columns as the cable calculator, method B2 and E.
// Al is the same 0.78 factor already used for B1 and C.
export const CABLE_CAPACITY_CU_B2: Record<number, number> = {
  1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99,
  50: 118, 70: 149, 95: 179, 120: 206, 150: 233, 185: 263, 240: 306, 300: 349,
};

export const CABLE_CAPACITY_AL_B2: Record<number, number> = {
  1.5: 12, 2.5: 16, 4: 21, 6: 27, 10: 36, 16: 48, 25: 62, 35: 77,
  50: 92, 70: 116, 95: 140, 120: 161, 150: 182, 185: 205, 240: 239, 300: 272,
};

export const CABLE_CAPACITY_CU_E: Record<number, number> = {
  1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 110, 35: 137,
  50: 167, 70: 214, 95: 259, 120: 299, 150: 341, 185: 390, 240: 459, 300: 526,
};

export const CABLE_CAPACITY_AL_E: Record<number, number> = {
  1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 49, 16: 66, 25: 86, 35: 107,
  50: 130, 70: 167, 95: 202, 120: 233, 150: 266, 185: 304, 240: 358, 300: 410,
};

export const INSTALL_METHOD_LABELS: Record<InstallMethod, string> = {
  B1: "B1 – w rurach w ścianie",
  B2: "B2 – w rurach pod tynkiem",
  C:  "C – na tynku lub w korycie pełnym",
  E:  "E – trasa kablowa (koryto perforowane lub drabinka)",
};

// PN-HD 60364-5-52 Table B.52-14 — Temperature correction
export const TEMP_CORRECTION: Record<string, number> = {
  "25": 1.03, "30": 1.00, "35": 0.94, "40": 0.87, "45": 0.79, "50": 0.71,
};

// PN-HD 60364-5-52 Table B.52-17 — Grouping correction
export const GROUPING_CORRECTION: Record<string, number> = {
  "1": 1.00, "2": 0.80, "3": 0.70, "4": 0.65, "5": 0.60, "6": 0.57, "9": 0.50, "12": 0.45,
};

export const STANDARD_BREAKERS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

export const LOAD_TEMPLATES: Record<string, { name: string; power: number; simultaneity: number }> = {
  lighting:   { name: "Oświetlenie LED",       power: 50,   simultaneity: 0.8 },
  sockets:    { name: "Gniazdka 230V",          power: 500,  simultaneity: 0.4 },
  hvac:       { name: "Klimatyzacja",           power: 3500, simultaneity: 0.7 },
  oven:       { name: "Piekarnik elektryczny",  power: 3000, simultaneity: 0.5 },
  dishwasher: { name: "Zmywarka",               power: 2500, simultaneity: 0.3 },
  washer:     { name: "Pralka",                 power: 2200, simultaneity: 0.3 },
  fridge:     { name: "Lodówka",                power: 150,  simultaneity: 0.8 },
  boiler:     { name: "Bojler elektryczny",     power: 2000, simultaneity: 0.6 },
  induction:  { name: "Płyta indukcyjna",       power: 7400, simultaneity: 0.7 },
  heatpump:   { name: "Pompa ciepła",           power: 4000, simultaneity: 0.8 },
};

export interface LoadCalculatorParams {
  loads: Load[];
  voltage: string;
  conductor: ConductorType;
  installMethod: InstallMethod;
  temperature: string;
  grouping: string;
  powerFactor: string;
}

export interface LoadCalculatorResult {
  totalPower: number;
  apparentPower: number;
  current: number;
  correctedCurrent: number;
  correctionFactor: number;
  tempFactor: number;
  groupFactor: number;
  recommendedSection: number;
  recommendedBreaker: number;
  cableCapacity: number;
  isCableOk: boolean;
  utilizationPercent: number;
}

const CAPACITY: Record<InstallMethod, { copper: Record<number, number>; aluminum: Record<number, number> }> = {
  B1: { copper: CABLE_CAPACITY_CU_B1, aluminum: CABLE_CAPACITY_AL_B1 },
  B2: { copper: CABLE_CAPACITY_CU_B2, aluminum: CABLE_CAPACITY_AL_B2 },
  C:  { copper: CABLE_CAPACITY_CU_C,  aluminum: CABLE_CAPACITY_AL_C },
  E:  { copper: CABLE_CAPACITY_CU_E,  aluminum: CABLE_CAPACITY_AL_E },
};

export function getCapacityTable(
  conductor: ConductorType,
  installMethod: InstallMethod,
): Record<number, number> {
  return CAPACITY[installMethod][conductor];
}

export function getCableSection(current: number, table: Record<number, number>): number {
  const sections = Object.keys(table).map(Number).sort((a, b) => a - b);
  for (const s of sections) {
    if (table[s] >= current) return s;
  }
  return 300;
}

export function getCircuitBreaker(current: number): number {
  for (const b of STANDARD_BREAKERS) {
    if (b >= current) return b;
  }
  return 250;
}

export function calculateLoad(params: LoadCalculatorParams): LoadCalculatorResult {
  const { loads, voltage, conductor, installMethod, temperature, grouping, powerFactor } = params;

  const totalPower = loads.reduce((sum, l) => sum + l.power * l.quantity * l.simultaneity, 0);
  const pf = parseFloat(powerFactor);
  const apparentPower = totalPower / pf;
  const V = parseFloat(voltage);
  const current = V === 400
    ? apparentPower / (Math.sqrt(3) * V)
    : apparentPower / V;

  const tempFactor = TEMP_CORRECTION[temperature] ?? 1.0;
  const groupFactor = GROUPING_CORRECTION[grouping] ?? 1.0;
  const correctionFactor = tempFactor * groupFactor;
  const correctedCurrent = current / correctionFactor;

  const table = getCapacityTable(conductor, installMethod);
  const recommendedSection = getCableSection(correctedCurrent, table);
  const recommendedBreaker = getCircuitBreaker(current);
  const cableCapacity = table[recommendedSection] ?? 0;
  const isCableOk = cableCapacity * correctionFactor >= recommendedBreaker;
  const utilizationPercent = (current / recommendedBreaker) * 100;

  return {
    totalPower, apparentPower, current, correctedCurrent,
    correctionFactor, tempFactor, groupFactor,
    recommendedSection, recommendedBreaker,
    cableCapacity, isCableOk, utilizationPercent,
  };
}
