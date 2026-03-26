export const STANDARD_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 630, 800, 1000];

export const BREAKING_CAPACITIES: Record<string, number[]> = {
  domestic: [4.5, 6, 10],
  industrial: [10, 15, 20, 25, 35, 50, 70],
};

export const TRIP_CURVES: Record<string, { description: string; inRange: string; usage: string }> = {
  B: { description: "3-5 × In", inRange: "3-5", usage: "Obwody oświetleniowe, gniazdka w mieszkaniach" },
  C: { description: "5-10 × In", inRange: "5-10", usage: "Obwody ogólnego przeznaczenia, małe silniki" },
  D: { description: "10-20 × In", inRange: "10-20", usage: "Silniki, transformatory, duże prądy rozruchowe" },
  K: { description: "8-14 × In", inRange: "8-14", usage: "Obciążenia indukcyjne, silniki" },
};

export const PROTECTION_TYPES: Record<string, { description: string; sensitivity: string }> = {
  standard: { description: "Wyłącznik standardowy", sensitivity: "-" },
  rcd30: { description: "Wyłącznik różnicowoprądowy 30mA", sensitivity: "30mA (ochrona bezpośrednia)" },
  rcd100: { description: "Wyłącznik różnicowoprądowy 100mA", sensitivity: "100mA (ochrona pośrednia)" },
  rcd300: { description: "Wyłącznik różnicowoprądowy 300mA", sensitivity: "300mA (ochrona przeciwpożarowa)" },
  rcbo30: { description: "Wyłącznik nadprądowo-różnicowy 30mA", sensitivity: "30mA (kombі)" },
};

export interface CircuitBreakerResult {
  recommendedRating: number;
  cableOk: boolean;
  breakingCapacity: number;
  selectivity: boolean;
  tripRange: string;
  magneticTripMin: number;
  magneticTripMax: number;
  ikOk: boolean;
  utilizationPercent: number;
}

export function calculateCircuitBreaker(params: {
  loadCurrent: string;
  cableCapacity: string;
  shortCircuitCurrent: string;
  tripCurve: string;
  applicationType: string;
}): CircuitBreakerResult | null {
  const Ib = parseFloat(params.loadCurrent);
  const Iz = parseFloat(params.cableCapacity);
  const Ik = parseFloat(params.shortCircuitCurrent) || 10;

  if (!Ib || !Iz) return null;

  let recommendedRating = 6;
  for (const rating of STANDARD_RATINGS) {
    if (rating >= Ib) { recommendedRating = rating; break; }
  }

  const cableOk = recommendedRating <= Iz;

  const capacities = BREAKING_CAPACITIES[params.applicationType];
  let breakingCapacity = capacities[0];
  for (const capacity of capacities) {
    if (capacity >= Ik) { breakingCapacity = capacity; break; }
  }

  const curve = TRIP_CURVES[params.tripCurve];
  const [min, max] = curve.inRange.split("-").map((v) => parseInt(v));
  const magneticTripMin = recommendedRating * min;
  const magneticTripMax = recommendedRating * max;
  const ikOk = breakingCapacity >= Ik;
  const utilizationPercent = (Ib / recommendedRating) * 100;

  return {
    recommendedRating, cableOk, breakingCapacity,
    selectivity: true, tripRange: curve.description,
    magneticTripMin, magneticTripMax, ikOk, utilizationPercent,
  };
}
