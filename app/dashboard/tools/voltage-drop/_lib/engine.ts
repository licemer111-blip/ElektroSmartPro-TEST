export type ConductorMaterial = "copper" | "aluminum";
export type CableType = "single" | "multi";
export type Phases = "1" | "3";

export const RESISTIVITY: Record<ConductorMaterial, number> = {
  copper:   0.0175,
  aluminum: 0.0283,
};

export const REACTANCE_PER_KM: Record<CableType, number> = {
  single: 0.08,
  multi:  0.10,
};

export const CABLE_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

export interface VoltageDropParams {
  voltage: string;
  current: string;
  length: string;
  crossSection: string;
  phases: Phases;
  conductor: ConductorMaterial;
  cableType: CableType;
  powerFactor: string;
  includeReactance: boolean;
}

export interface VoltageDropResult {
  voltageDrop: number;
  voltageDropPercent: number;
  voltageAtEnd: number;
  resistance: number;
  reactance?: number;
  impedance?: number;
  powerLoss: number;
  isOk3: boolean;
  isOk5: boolean;
}

export function calculateVoltageDrop(p: VoltageDropParams): VoltageDropResult {
  const V   = parseFloat(p.voltage);
  const I   = parseFloat(p.current);
  const L   = parseFloat(p.length);
  const S   = parseFloat(p.crossSection);
  const pf  = parseFloat(p.powerFactor);
  const rho = RESISTIVITY[p.conductor];
  const R   = (rho * L) / S;

  let drop: number;
  let reactance: number | undefined;
  let impedance: number | undefined;

  if (p.includeReactance) {
    const X0 = REACTANCE_PER_KM[p.cableType];
    const X  = X0 * (L / 1000);
    reactance = X;
    const sinPhi = Math.sqrt(1 - pf * pf);
    drop = p.phases === "1"
      ? 2 * I * (R * pf + X * sinPhi)
      : Math.sqrt(3) * I * (R * pf + X * sinPhi);
    impedance = Math.sqrt(R * R + X * X);
  } else {
    drop = p.phases === "1"
      ? (2 * I * L * rho) / S
      : (Math.sqrt(3) * I * L * rho) / S;
  }

  const dropPercent  = (drop / V) * 100;
  const voltageAtEnd = V - drop;
  const powerLoss    = (p.phases === "3" ? 3 * I * I * R : I * I * R) / 1000;

  return {
    voltageDrop: drop, voltageDropPercent: dropPercent,
    voltageAtEnd, resistance: R, reactance, impedance,
    powerLoss, isOk3: dropPercent <= 3, isOk5: dropPercent <= 5,
  };
}
