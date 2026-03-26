export type StartingMethod = "DOL" | "star-delta" | "soft-starter" | "vfd";
export type EfficiencyClass = "IE1" | "IE2" | "IE3" | "IE4";

export const STARTING_METHODS: Record<StartingMethod, { name: string; startCurrentFactor: number; startTorqueFactor: number }> = {
  "DOL":          { name: "Bezpośrednie (DOL)",              startCurrentFactor: 7.0, startTorqueFactor: 1.5 },
  "star-delta":   { name: "Gwiazda-Trójkąt (Y-Δ)",          startCurrentFactor: 2.5, startTorqueFactor: 0.5 },
  "soft-starter": { name: "Softstart (łagodny rozruch)",     startCurrentFactor: 3.0, startTorqueFactor: 0.8 },
  "vfd":          { name: "Falownik (VFD)",                   startCurrentFactor: 1.5, startTorqueFactor: 1.5 },
};

export const EFFICIENCY_CLASSES: Record<EfficiencyClass, { label: string; efficiency: number }> = {
  IE1: { label: "IE1 (standard)",  efficiency: 0.88 },
  IE2: { label: "IE2 (wysoka)",    efficiency: 0.91 },
  IE3: { label: "IE3 (premium)",   efficiency: 0.93 },
  IE4: { label: "IE4 (super-premium)", efficiency: 0.95 },
};

export const CABLE_SECTIONS_MOTOR = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

// Simplified cable capacity lookup (Method B1, Cu, PVC, 30°C)
export const CABLE_CAPACITY_MOTOR: Record<number, number> = {
  1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239,
};

export const STANDARD_BREAKERS_MOTOR = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
export const STANDARD_CONTACTORS = [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 185, 225];

export interface MotorParams {
  power: string;
  voltage: string;
  efficiency: string;
  powerFactor: string;
  startingMethod: StartingMethod;
  efficiencyClass: EfficiencyClass;
  dutyCycle: string;
  phases: "1" | "3";
}

export interface MotorResult {
  ratedCurrent: number;
  startingCurrent: number;
  apparentPower: number;
  inputPower: number;
  torque: number;
  cableSection: number;
  cableCapacity: number;
  circuitBreaker: number;
  thermalRelay: { min: number; max: number };
  contactor: number;
  startingTorque: number;
  efficiencyPct: number;
}

function getCableSection(current: number): number {
  const sections = Object.keys(CABLE_CAPACITY_MOTOR).map(Number).sort((a, b) => a - b);
  for (const s of sections) {
    if (CABLE_CAPACITY_MOTOR[s] >= current * 1.25) return s;
  }
  return 120;
}

function getBreaker(startCurrent: number): number {
  for (const b of STANDARD_BREAKERS_MOTOR) { if (b >= startCurrent * 1.1) return b; }
  return 250;
}

function getContactor(ratedCurrent: number): number {
  for (const c of STANDARD_CONTACTORS) { if (c >= ratedCurrent * 1.0) return c; }
  return 225;
}

export function calculateMotor(p: MotorParams): MotorResult {
  const Pn   = parseFloat(p.power) * 1000; // W
  const V    = parseFloat(p.voltage);
  const eta  = parseFloat(p.efficiency) / 100;
  const pf   = parseFloat(p.powerFactor);
  const duty = parseFloat(p.dutyCycle) / 100;

  const inputPower    = Pn / eta;
  const apparentPower = inputPower / pf;

  const ratedCurrent = p.phases === "3"
    ? (apparentPower) / (Math.sqrt(3) * V)
    : apparentPower / V;

  const startInfo     = STARTING_METHODS[p.startingMethod];
  const startingCurrent = ratedCurrent * startInfo.startCurrentFactor * duty;
  const startingTorque  = startInfo.startTorqueFactor;

  // Rated torque: T = P / ω (assuming 1450 rpm = ~151.8 rad/s)
  const omega = 1450 * 2 * Math.PI / 60;
  const torque = Pn / omega;

  const effCls    = EFFICIENCY_CLASSES[p.efficiencyClass];
  const cableSection = getCableSection(ratedCurrent);
  const cableCapacity = CABLE_CAPACITY_MOTOR[cableSection] ?? 0;
  const circuitBreaker = getBreaker(startingCurrent);
  const contactor = getContactor(ratedCurrent);

  return {
    ratedCurrent, startingCurrent, apparentPower: apparentPower / 1000,
    inputPower: inputPower / 1000, torque, cableSection, cableCapacity,
    circuitBreaker,
    thermalRelay: { min: ratedCurrent * 0.9, max: ratedCurrent * 1.1 },
    contactor, startingTorque,
    efficiencyPct: effCls.efficiency * 100,
  };
}
