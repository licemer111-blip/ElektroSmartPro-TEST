export const STANDARD_CAPACITORS = [2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250];

export interface PowerFactorParams {
  activePower: string;
  currentPF: string;
  targetPF: string;
  voltage: string;
  tariff: string;
  penaltyRate: string;
}

export interface PowerFactorResult {
  currentReactivePower: number;
  targetReactivePower: number;
  requiredCapacitorPower: number;
  recommendedCapacitor: number;
  currentApparentPower: number;
  targetApparentPower: number;
  powerReduction: number;
  currentBeforeCurrent: number;
  afterCurrent: number;
  currentReduction: number;
  monthlyCost: number;
  monthlySavings: number;
  paybackMonths: number;
  energySavingsPercent: number;
}

export function calculatePowerFactor(p: PowerFactorParams): PowerFactorResult {
  const P      = parseFloat(p.activePower);
  const pf1    = parseFloat(p.currentPF);
  const pf2    = parseFloat(p.targetPF);
  const V      = parseFloat(p.voltage);
  const tariff = parseFloat(p.tariff);
  const penalty = parseFloat(p.penaltyRate);

  const phi1 = Math.acos(pf1);
  const Q1   = P * Math.tan(phi1);
  const phi2 = Math.acos(pf2);
  const Q2   = P * Math.tan(phi2);
  const Qc   = Q1 - Q2;

  let recommendedCapacitor = STANDARD_CAPACITORS[0];
  for (const cap of STANDARD_CAPACITORS) {
    if (cap >= Qc) { recommendedCapacitor = cap; break; }
  }

  const S1 = P / pf1;
  const S2 = P / pf2;
  const powerReduction = S1 - S2;

  const I1 = (S1 * 1000) / (Math.sqrt(3) * V);
  const I2 = (S2 * 1000) / (Math.sqrt(3) * V);
  const currentReduction = ((I1 - I2) / I1) * 100;

  const hoursPerMonth   = 8000 / 12;
  const monthlyEnergy   = P * hoursPerMonth;
  const baseCost        = monthlyEnergy * tariff;
  const penaltyCost     = pf1 < 0.92 ? baseCost * penalty * (0.92 - pf1) / 0.92 : 0;
  const monthlyCost     = baseCost + penaltyCost;
  const penaltyCostAfter = pf2 < 0.92 ? baseCost * penalty * (0.92 - pf2) / 0.92 : 0;
  const monthlyCostAfter = baseCost + penaltyCostAfter;
  const monthlySavings  = monthlyCost - monthlyCostAfter;

  const capacitorCost  = recommendedCapacitor * 50;
  const paybackMonths  = monthlySavings > 0 ? capacitorCost / monthlySavings : 999;

  return {
    currentReactivePower: Q1, targetReactivePower: Q2,
    requiredCapacitorPower: Qc, recommendedCapacitor,
    currentApparentPower: S1, targetApparentPower: S2,
    powerReduction, currentBeforeCurrent: I1, afterCurrent: I2,
    currentReduction, monthlyCost, monthlySavings,
    paybackMonths, energySavingsPercent: currentReduction,
  };
}
