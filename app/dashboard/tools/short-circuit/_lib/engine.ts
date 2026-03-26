export type ConductorMaterial = "copper" | "aluminum";
export type CableType = "single" | "multi";

export const CABLE_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

export const RESISTIVITY: Record<ConductorMaterial, number> = {
  copper:   0.0175,
  aluminum: 0.0283,
};

export const REACTANCE_PER_KM: Record<CableType, number> = {
  single: 0.08,
  multi:  0.10,
};

export interface ShortCircuitParams {
  voltage: string;
  cableLength: string;
  cableSection: string;
  conductor: ConductorMaterial;
  cableType: CableType;
  systemType: string;
  transformerPower: string;
  transformerVoltage: string;
}

export interface ShortCircuitResult {
  ik3: number;
  ik1: number;
  resistance: number;
  reactance: number;
  impedance: number;
  breakingCapacity: number;
  isOk: boolean;
  recommendation: string;
  details: string;
}

export function calculateShortCircuit(p: ShortCircuitParams): ShortCircuitResult {
  const V    = parseFloat(p.voltage);
  const S    = parseFloat(p.cableSection);
  const L    = parseFloat(p.cableLength);
  const StKVA = parseFloat(p.transformerPower);

  const ukPercent = 4;
  const St = StKVA * 1000;
  const Zt = (ukPercent / 100) * (V * V) / (St / 1000);

  const rho    = RESISTIVITY[p.conductor];
  const Rcable = (rho * L) / S;
  const X0     = REACTANCE_PER_KM[p.cableType];
  const Xcable = X0 * (L / 1000);

  const Xtotal = Zt + Xcable;
  const Ztotal = Math.sqrt(Rcable * Rcable + Xtotal * Xtotal);

  const c   = V === 400 ? 1.1 : 1.05;
  const ik3_A = (c * V) / (Math.sqrt(3) * Ztotal);
  const ik1_A = ik3_A * 0.5;
  const ik3   = ik3_A / 1000;
  const ik1   = ik1_A / 1000;

  let breakingCapacity = 6;
  let recommendation   = "Wyłącznik standardowy B lub C (Icn = 6 kA)";
  let details          = "Dla instalacji mieszkaniowych i małych obiektów komercyjnych";

  if (ik3 > 25)      { breakingCapacity = 50; recommendation = "Wyłącznik przemysłowy o zdolności łączeniowej 50 kA"; details = "Dla instalacji przemysłowych z transformatorami dużej mocy"; }
  else if (ik3 > 15) { breakingCapacity = 25; recommendation = "Wyłącznik o zwiększonej zdolności łączeniowej 25 kA"; details = "Dla dużych obiektów komercyjnych i średniej wielkości przemysłu"; }
  else if (ik3 > 10) { breakingCapacity = 15; recommendation = "Wyłącznik o zdolności łączeniowej 15 kA"; details = "Dla średnich obiektów komercyjnych"; }
  else if (ik3 > 6)  { breakingCapacity = 10; recommendation = "Wyłącznik o zdolności łączeniowej 10 kA"; details = "Dla małych obiektów komercyjnych"; }

  return {
    ik3, ik1,
    resistance: Rcable, reactance: Xtotal, impedance: Ztotal,
    breakingCapacity, isOk: ik3 <= breakingCapacity * 0.8,
    recommendation, details,
  };
}
