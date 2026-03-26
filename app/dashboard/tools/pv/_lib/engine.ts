export type ModuleType = "monocrystalline" | "polycrystalline" | "thinfilm";
export type Orientation = "south" | "south-east" | "south-west" | "east" | "west";

export const IRRADIATION_BY_REGION: Record<string, { name: string; annual: number }> = {
  "mazowieckie":      { name: "Mazowieckie",      annual: 1050 },
  "malopolskie":      { name: "Małopolskie",       annual: 1100 },
  "slaskie":          { name: "Śląskie",           annual: 1080 },
  "wielkopolskie":    { name: "Wielkopolskie",     annual: 1020 },
  "dolnoslaskie":     { name: "Dolnośląskie",      annual: 1060 },
  "lodzkie":          { name: "Łódzkie",           annual: 1030 },
  "kujawsko-pomorskie": { name: "Kujawsko-Pomorskie", annual: 1000 },
  "lubelskie":        { name: "Lubelskie",         annual: 1070 },
  "podkarpackie":     { name: "Podkarpackie",      annual: 1090 },
  "pomorskie":        { name: "Pomorskie",         annual: 990  },
  "zachodniopomorskie": { name: "Zachodniopomorskie", annual: 980 },
  "lubuskie":         { name: "Lubuskie",          annual: 1000 },
  "warminsko-mazurskie": { name: "Warmińsko-Mazurskie", annual: 970 },
  "podlaskie":        { name: "Podlaskie",         annual: 1010 },
  "swietokrzyskie":   { name: "Świętokrzyskie",    annual: 1050 },
  "opolskie":         { name: "Opolskie",          annual: 1060 },
};

export const MODULE_TYPES: Record<ModuleType, { name: string; efficiency: number; tempCoeff: number }> = {
  monocrystalline: { name: "Monokrystaliczny (wysoka sprawność)",   efficiency: 0.21, tempCoeff: -0.0035 },
  polycrystalline: { name: "Polikrystaliczny (standard)",           efficiency: 0.17, tempCoeff: -0.0040 },
  thinfilm:        { name: "Cienkowarstwowy (CIGS/CdTe)",            efficiency: 0.12, tempCoeff: -0.0025 },
};

export const ORIENTATION_FACTORS: Record<Orientation, number> = {
  "south":      1.00,
  "south-east": 0.95,
  "south-west": 0.95,
  "east":       0.80,
  "west":       0.80,
};

export const TILT_FACTORS: Record<string, number> = {
  "10": 0.92, "20": 0.97, "30": 1.00, "35": 0.99, "40": 0.97, "45": 0.94,
  "60": 0.85, "90": 0.68,
};

export interface PvParams {
  region: string;
  moduleType: ModuleType;
  peakPower: string;
  tilt: string;
  orientation: Orientation;
  systemLoss: string;
  electricityPrice: string;
  installCostPerKwp: string;
}

export interface PvResult {
  annualProduction: number;
  specificYield: number;
  dailyProduction: number;
  co2Reduction: number;
  annualSavings: number;
  installCost: number;
  paybackYears: number;
  roi25Years: number;
  peakPowerKwp: number;
  irradiation: number;
}

export function calculatePv(p: PvParams): PvResult {
  const peakPowerKwp = parseFloat(p.peakPower);
  const electricityPrice = parseFloat(p.electricityPrice);
  const installCostPerKwp = parseFloat(p.installCostPerKwp);
  const systemLoss = parseFloat(p.systemLoss) / 100;

  const irradiation = IRRADIATION_BY_REGION[p.region]?.annual ?? 1050;
  const orientFactor = ORIENTATION_FACTORS[p.orientation];
  const tiltFactor = TILT_FACTORS[p.tilt] ?? 1.0;
  const moduleEff = MODULE_TYPES[p.moduleType].efficiency;
  const tempLoss = 0.05;

  const annualProduction =
    peakPowerKwp * irradiation * orientFactor * tiltFactor * (1 - systemLoss) * (1 - tempLoss);

  const specificYield = annualProduction / peakPowerKwp;
  const dailyProduction = annualProduction / 365;
  const co2Reduction = annualProduction * 0.71;
  const annualSavings = annualProduction * electricityPrice;
  const installCost = peakPowerKwp * installCostPerKwp;
  const paybackYears = annualSavings > 0 ? installCost / annualSavings : 999;
  const roi25Years = annualSavings * 25 - installCost;

  return {
    annualProduction, specificYield, dailyProduction,
    co2Reduction, annualSavings, installCost, paybackYears, roi25Years,
    peakPowerKwp, irradiation,
  };
}
