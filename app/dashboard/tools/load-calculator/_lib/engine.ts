export interface Load {
  id: string;
  name: string;
  power: number;
  quantity: number;
  simultaneity: number;
}

export type ConductorType = "copper" | "aluminum";
export type InstallMethod = "B1" | "C";

// PN-HD 60364-5-52 Table B.52-3 — Method B1, Cu
export const CABLE_CAPACITY_CU_B1: Record<number, number> = {
  1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125,
  50: 151, 70: 192, 95: 232, 120: 269, 150: 309, 185: 353, 240: 415, 300: 472,
};

// Al (approx 0.62× Cu)
export const CABLE_CAPACITY_AL_B1: Record<number, number> = {
  1.5: 11, 2.5: 15, 4: 20, 6: 25, 10: 35, 16: 47, 25: 62, 35: 77,
  50: 94, 70: 119, 95: 144, 120: 167, 150: 192, 185: 219, 240: 257, 300: 293,
};

// Method C — Cu
export const CABLE_CAPACITY_CU_C: Record<number, number> = {
  1.5: 20, 2.5: 28, 4: 37, 6: 48, 10: 66, 16: 88, 25: 118, 35: 147,
  50: 179, 70: 229, 95: 278, 120: 322, 150: 371, 185: 424, 240: 499, 300: 569,
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

export function getCapacityTable(
  conductor: ConductorType,
  installMethod: InstallMethod,
): Record<number, number> {
  if (conductor === "copper") {
    return installMethod === "B1" ? CABLE_CAPACITY_CU_B1 : CABLE_CAPACITY_CU_C;
  }
  return CABLE_CAPACITY_AL_B1;
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
