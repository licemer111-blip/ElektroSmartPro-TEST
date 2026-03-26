// ═══════════════════════════════════════════════════════════════════
// Schemat SVG Renderer — Types & Constants
// ═══════════════════════════════════════════════════════════════════

export interface SchematDevice {
  uid: string;
  moduleId: string;
  name: string;
  type: "main_switch" | "spd" | "rcd" | "rcbo" | "mcb" | "contactor" | "motor_starter" | "timer" | "monitoring" | "other";
  rating?: number;
  label?: string;
  circuitNumber?: string;
  cableType?: string;
  phase?: string;
  poles: number;
  rcdSensitivity?: string;
  rcdType?: string;
  spdLabel?: string;
  children?: SchematDevice[];
}

export interface SchematSection {
  name: string;
  feedLabel: string;
  enclosureName: string;
  moduleCount: number;
  devices: SchematDevice[];
}

export interface SchematConfig {
  panelName: string;
  manufacturerName: string;
  companyName?: string;
  designerName?: string;
  projectName?: string;
  drawingNumber?: string;
  sections: SchematSection[];
  isAiGenerated?: boolean;
}

export interface PageResult {
  svg: string;
  w: number;
  h: number;
}

export interface BusBarGeometry {
  yL1: number;
  yL2: number;
  yL3: number;
  yN: number;
  yPE: number;
  busBottom: number;
  has3Phase: boolean;
}

// ── Layout Constants ──
export const MARGIN = 30;
export const COL_W = 120;
export const MIN_PAGE_W = 1190;
export const BUS_SPACING = 12;

export const PHASE_COLORS = {
  L1: "#92400e",
  L2: "#1e293b",
  L3: "#6b7280",
  N: "#2563eb",
  PE: "#16a34a",
  PE_STRIPE: "#eab308",
} as const;

export const PHASE_LABELS = ["L1", "L2", "L3", "N", "PE"] as const;
export const PHASE_COLOR_ARR = [PHASE_COLORS.L1, PHASE_COLORS.L2, PHASE_COLORS.L3, PHASE_COLORS.N, PHASE_COLORS.PE];

export const DEVICE_ANCHORS: Record<SchematDevice["type"], { inputY: number; outputY: number }> = {
  main_switch:   { inputY: 0, outputY: 62 },
  spd:           { inputY: 0, outputY: 44 },
  rcd:           { inputY: 0, outputY: 60 },
  rcbo:          { inputY: 0, outputY: 70 },
  mcb:           { inputY: 0, outputY: 62 },
  contactor:     { inputY: 0, outputY: 70 },
  motor_starter: { inputY: 0, outputY: 64 },
  timer:         { inputY: 0, outputY: 58 },
  monitoring:    { inputY: 0, outputY: 58 },
  other:         { inputY: 0, outputY: 62 },
};

export function getOutputY(type: SchematDevice["type"]): number {
  return DEVICE_ANCHORS[type]?.outputY ?? 62;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.substring(0, max - 1) + "…" : s;
}

export function computeBusBarY(busY: number, has3Phase: boolean): BusBarGeometry {
  return {
    yL1: busY,
    yL2: busY + BUS_SPACING,
    yL3: busY + 2 * BUS_SPACING,
    yN: busY + (has3Phase ? 3 : 1) * BUS_SPACING,
    yPE: busY + (has3Phase ? 4 : 2) * BUS_SPACING,
    busBottom: busY + (has3Phase ? 4 : 2) * BUS_SPACING + 12,
    has3Phase,
  };
}

export function suggestCable(rating: number, poles: number): string {
  const p = poles >= 3 ? 5 : 3;
  if (rating <= 10) return `YDYp ${p}×1.5`;
  if (rating <= 16) return `YDYp ${p}×2.5`;
  if (rating <= 20) return `YDYp ${p}×2.5`;
  if (rating <= 25) return `YDYp ${p}×4`;
  if (rating <= 32) return `YDYp ${p}×6`;
  if (rating <= 40) return `YKY ${p}×10`;
  if (rating <= 63) return `YKY ${p}×16`;
  if (rating <= 80) return `YKY ${p}×25`;
  if (rating <= 100) return `YKY ${p}×35`;
  return `YKY ${p}×50`;
}
