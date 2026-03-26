// ═══════════════════════════════════════════════════════════════════
// Schemat Geometry Engine
// Responsible for: coordinate calculations, layout constants,
// device enrichment (auto-cable, auto-circuit, auto-phase assignment)
// Standards: PN-HD 60364 (cable selection), IEC 60617 (device types)
// ═══════════════════════════════════════════════════════════════════

import type { SchematDevice, SchematSection, BusBarGeometry } from "../schemat-svg-types";
import {
  BUS_SPACING,
  DEVICE_ANCHORS,
  PHASE_COLOR_ARR,
} from "../schemat-svg-types";

export { BUS_SPACING, DEVICE_ANCHORS, PHASE_COLOR_ARR };

// ── Re-export from SSOT (schemat-svg-types is the single source of truth) ──
export {
  computeBusBarY,
  getOutputY,
  suggestCable,
} from "../schemat-svg-types";

// ── Phase round-robin for auto-assignment (load balancing) ──
export const PHASE_ROUND_ROBIN: Array<"L1" | "L2" | "L3"> = ["L1", "L2", "L3"];

// ── Page layout constants ──
export const MARGIN = 30;
export const COL_W = 120;
export const MIN_PAGE_W = 1190;

// ── Dynamic Y-level calculation for device placement ──

export interface DeviceLevels {
  devStartY: number;
  rcdLevelY: number;
  subBusY: number;
  mcbLevelY: number;
}

/**
 * Computes all vertical Y-levels for device placement on the page.
 * Uses DEVICE_ANCHORS as single source of truth for device heights.
 */
export function computeDeviceLevels(busBottom: number): DeviceLevels {
  const devStartY = busBottom + 16;
  const topDeviceMaxH = Math.max(
    DEVICE_ANCHORS.main_switch.outputY,
    DEVICE_ANCHORS.spd.outputY,
    62
  );
  const rcdLevelY = devStartY + topDeviceMaxH + 30;
  const RCD_OUT_Y = DEVICE_ANCHORS.rcd.outputY; // 60
  const SUB_BUS_GAP = 15;
  const subBusY = rcdLevelY + RCD_OUT_Y + SUB_BUS_GAP;
  const CHILD_GAP = 20;
  const mcbLevelY = subBusY + CHILD_GAP;

  return { devStartY, rcdLevelY, subBusY, mcbLevelY };
}

// ── Page width calculation ──

export interface DeviceGroups {
  mainSwitches: SchematDevice[];
  spds: SchematDevice[];
  rcdGroups: { rcd: SchematDevice; children: SchematDevice[] }[];
  directDevices: SchematDevice[];
}

/**
 * Calculates the required page width based on the number of columns needed.
 */
export function computePageWidth(groups: DeviceGroups): number {
  const topCount = groups.mainSwitches.length + groups.spds.length;
  const rcdChildrenCount = groups.rcdGroups.reduce(
    (s, g) => s + Math.max(g.children.length, 1),
    0
  );
  const gapCount = groups.rcdGroups.length;
  const directCount = groups.directDevices.length;
  const neededCols = Math.max(topCount, rcdChildrenCount + gapCount + directCount);
  return Math.max(MIN_PAGE_W, (neededCols + 2) * COL_W + MARGIN * 2);
}

// ── Intelligent Device Enrichment ──
// Applies professional electrical engineering logic before rendering:
// 1. Phase auto-assignment (L1→L2→L3 round-robin) for load balancing
// 2. Auto cable suggestion based on rating/poles per PN-HD 60364
// 3. Auto circuit numbering for unnamed circuits

function suggestCableLocal(rating: number, poles: number): string {
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

export function enrichDevice(
  dev: SchematDevice,
  circuitIdx: { n: number },
  phaseIdx: { n: number },
  is3Phase: boolean
): void {
  if (!dev.cableType && dev.rating && dev.rating > 0) {
    const needsCable =
      dev.type === "mcb" ||
      dev.type === "rcbo" ||
      dev.type === "contactor" ||
      dev.type === "motor_starter";
    if (needsCable) {
      dev.cableType = suggestCableLocal(dev.rating, dev.poles);
    }
  }

  if (!dev.circuitNumber) {
    const needsCircuit =
      dev.type === "mcb" ||
      dev.type === "rcbo" ||
      dev.type === "contactor" ||
      dev.type === "motor_starter" ||
      dev.type === "timer";
    if (needsCircuit) {
      circuitIdx.n++;
      dev.circuitNumber = String(circuitIdx.n);
    }
  }

  if (!dev.phase && is3Phase && dev.poles === 1) {
    dev.phase = PHASE_ROUND_ROBIN[phaseIdx.n % 3];
    phaseIdx.n++;
  }

  if (dev.children && dev.children.length > 0) {
    for (const child of dev.children) {
      enrichDevice(child, circuitIdx, phaseIdx, is3Phase);
    }
  }
}

export function enrichSection(sec: SchematSection): void {
  const is3Phase = sec.devices.some(
    (d) => d.poles >= 3 || (d.children && d.children.some((c) => c.poles >= 3))
  );
  const circuitIdx = { n: 0 };
  const phaseIdx = { n: 0 };
  for (const dev of sec.devices) {
    enrichDevice(dev, circuitIdx, phaseIdx, is3Phase);
  }
}

// ── Device Classification ──

const isEnergyMeter = (d: SchematDevice): boolean =>
  d.type === "monitoring" &&
  (d.moduleId?.startsWith("energy-meter") ||
    d.moduleId?.startsWith("ev-energy-meter") ||
    d.moduleId?.startsWith("kwh-meter"));

const isPvMeter = (d: SchematDevice): boolean =>
  isEnergyMeter(d) &&
  (d.label?.toLowerCase().includes("pv") || d.moduleId?.includes("bidirect"));

/**
 * Classifies section devices into typed groups for rendering.
 * Order: mainMeters → unassigned MCBs → rcbos → contactors → timers → otherMonitors → motorStarters → pvMeters
 */
export function classifyDevices(sec: SchematSection): DeviceGroups & { usedTypes: Set<string> } {
  const usedTypes = new Set<string>();
  const mainSwitches: SchematDevice[] = [];
  const spds: SchematDevice[] = [];
  const rcdGroups: { rcd: SchematDevice; children: SchematDevice[] }[] = [];
  const unassigned: SchematDevice[] = [];
  const rcbos: SchematDevice[] = [];
  const contactors: SchematDevice[] = [];
  const timers: SchematDevice[] = [];
  const monitors: SchematDevice[] = [];
  const motorStarters: SchematDevice[] = [];

  for (const dev of sec.devices) {
    usedTypes.add(dev.type);

    if (dev.type === "main_switch") {
      mainSwitches.push(dev);
    } else if (dev.type === "spd") {
      spds.push(dev);
    } else if (dev.type === "rcd") {
      if (dev.children && dev.children.length > 0) {
        rcdGroups.push({ rcd: dev, children: dev.children });
        dev.children.forEach((c) => usedTypes.add(c.type));
      } else {
        rcdGroups.push({ rcd: dev, children: [] });
      }
    } else if (dev.type === "mcb" && !dev.children) {
      unassigned.push(dev);
    } else if (dev.type === "rcbo") {
      rcbos.push(dev);
    } else if (dev.type === "contactor") {
      contactors.push(dev);
    } else if (dev.type === "timer") {
      timers.push(dev);
    } else if (dev.type === "monitoring") {
      monitors.push(dev);
    } else if (dev.type === "motor_starter") {
      motorStarters.push(dev);
    }
  }

  const mainMeters = monitors.filter((d) => isEnergyMeter(d) && !isPvMeter(d));
  const pvMeters = monitors.filter((d) => isPvMeter(d));
  const otherMonitors = monitors.filter((d) => !isEnergyMeter(d));

  const directDevices = [
    ...mainMeters,
    ...unassigned,
    ...rcbos,
    ...contactors,
    ...timers,
    ...otherMonitors,
    ...motorStarters,
    ...pvMeters,
  ];

  return { mainSwitches, spds, rcdGroups, directDevices, usedTypes };
}
