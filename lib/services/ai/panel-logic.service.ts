/**
 * panel-logic.service.ts
 *
 * Logika generacji i walidacji konfiguracji rozdzielnic.
 * Wyodrębniona z app/dashboard/projects/[id]/ai-actions.ts.
 *
 * Zawiera:
 *  - parseElectricalConstraints() — deterministyczny parser opisu obiektu
 *  - fixSelectivity()             — post-processor selektywności
 *  - fixLoadBalance()             — post-processor bilansu mocy
 *  - computeAccessories()         — kalkulator materiałów montażowych
 */

import { getKnrMetadata } from "@/lib/ai-master-brain";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ElectricalConstraints {
  phaseCount: number;
  mainRating: number;
  maxMcb1p: number;
  rcd300: number;
  rcd30max: number;
}

export interface MappedModule {
  moduleId: string;
  rating?: number;
  qty: number;
  label?: string;
  phase?: string;
  circuitNumber?: string;
  cableType?: string;
  isZugBlock?: boolean;
  terminalCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_MAIN_RATINGS = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630];
const RCD_RATINGS = [16, 25, 40, 63, 80, 100, 125];

const isMainSwitch = (id: string) =>
  id.startsWith("main-switch") || id.startsWith("mccb") || id.startsWith("acb") || id.startsWith("szr");
const RCD300_IDS = ["rcd-300", "rcd-300-4p"];
const RCD30_IDS = ["rcd-30-ac", "rcd-30-a", "rcd-30-b", "rcd-30-f", "rcd-30-4p"];
const MCB_IDS = [
  "mcb-b-1p", "mcb-c-1p", "mcb-d-1p",
  "mcb-b-3p", "mcb-c-3p", "mcb-d-3p", "mcb-c-3pn",
  "rcbo-b30", "rcbo-c30", "rcbo-c-100ma", "rcbo-c-type-f", "rcbo-b-300ma",
];
const MCB1P_IDS = ["mcb-b-1p", "mcb-c-1p", "mcb-d-1p", "rcbo-b30", "rcbo-c30", "rcbo-c-100ma", "rcbo-c-type-f", "rcbo-b-300ma"];
const MCB3P_IDS = ["mcb-b-3p", "mcb-c-3p", "mcb-d-3p", "mcb-c-3pn"];
const ENCLOSURE_OPTIONS_LIST = [12, 24, 36, 48, 54, 72, 96, 120, 144, 192, 216, 288];

const MODULE_DIN_WIDTH: Record<string, number> = {
  "main-switch-1p": 1, "main-switch-3p": 3,
  "mccb": 6, "mccb-100a": 6, "mccb-160a": 6, "mccb-250a": 9, "mccb-400a": 9, "mccb-630a": 12,
  "acb-800a": 12, "acb-1600a": 18,
  "rcd-30-ac": 2, "rcd-30-a": 2, "rcd-30-b": 2, "rcd-30-f": 2, "rcd-30-4p": 4,
  "rcd-300": 2, "rcd-300-4p": 4,
  "spd-t2": 3, "spd-t2-3p": 4, "spd-t1t2": 4,
  "mcb-b-1p": 1, "mcb-c-1p": 1, "mcb-d-1p": 1,
  "mcb-b-3p": 3, "mcb-c-3p": 3, "mcb-d-3p": 3,
  "rcbo-b30": 2, "rcbo-c30": 2, "rcbo-c-100ma": 2, "rcbo-c-type-f": 2,
  "zug-block": 5,
  "contactor-2p": 2, "contactor-4p": 3,
  "step-relay": 1, "staircase-timer": 1,
  "timer-digital": 2, "timer-astro": 2, "dimmer-module": 2,
  "energy-meter-1p": 1, "energy-meter-3p": 4,
  "phase-monitor": 2, "voltage-relay": 2, "signal-lamp": 1,
  "knx-power-supply": 4, "knx-usb-interface": 2, "plc-basic": 6,
  "changeover-switch": 4, "szr-3p": 8, "szr-4p": 10,
  "fuse-3p": 3,
};

const AUTOMATION_PREFIXES = ["knx-", "dali-", "bms-"];
const BUS_CONTROLLER_IDS = [
  "knx-power-supply", "knx-ip-router", "knx-usb", "knx-line-coupler",
  "dali-gateway", "dali-gateway-64ch", "psu-24v", "psu-24v-5a",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RCD300_CATALOG_MIN = 25;  // lowest ratingOption for rcd-300 / rcd-300-4p
const RCD300_CATALOG_MAX = 100; // highest ratingOption for rcd-300 / rcd-300-4p

const nextRating = (min: number): number =>
  RCD_RATINGS.find((r) => r >= min) ?? RCD_RATINGS[RCD_RATINGS.length - 1];

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Deterministycznie wyciąga parametry elektryczne z opisu.
 * Zapobiega AI zgadywaniu prądu głównego i układu faz.
 */
export function parseElectricalConstraints(description: string): ElectricalConstraints {
  const d = description.toLowerCase();

  const is3phase = /3[\s-]?faz|trójfaz|3npe|400v|three[\s-]?phase/.test(d);
  const phaseCount = is3phase ? 3 : 1;

  const amperagePatterns = [
    /\d[\s-]?faz\s+(\d+)\s*a\b/i,
    /przy[łl][aą]cze\s*(\d+)\s*a\b/i,
    /g[łl][oó]wny\s*(\d+)\s*a\b/i,
    /\b(\d+)\s*a\b/gi,
  ];

  let mainRating = 0;
  for (const pattern of amperagePatterns) {
    pattern.lastIndex = 0;
    const isGlobal = pattern.flags.includes("g");
    if (isGlobal) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(description)) !== null) {
        const val = parseInt(match[1], 10);
        if (VALID_MAIN_RATINGS.includes(val)) { mainRating = val; break; }
      }
    } else {
      const match = pattern.exec(description);
      if (match) {
        const val = parseInt(match[1], 10);
        if (VALID_MAIN_RATINGS.includes(val)) mainRating = val;
      }
    }
    if (mainRating > 0) break;
  }
  if (mainRating === 0) mainRating = is3phase ? 40 : 25;

  const maxMcb1p = mainRating;
  const rcd300Ratings = [25, 40, 63, 80, 100, 125];

  // Estimate rcd-300 based on typical circuit count × Kj(0.35):
  // 3-phase: ~14 circuits; 1-phase: ~8 circuits; MCB avg 16A
  const typicalCircuits = phaseCount === 3 ? 14 : 8;
  const typicalMcbRating = Math.min(mainRating, 16);
  const rcd300ByLoad = Math.ceil(typicalCircuits * typicalMcbRating * 0.35);
  const rcd300 = rcd300Ratings.find((r) => r >= Math.max(mainRating, rcd300ByLoad)) ?? 80;

  // Group RCDs: 40A is the standard residential minimum (5×16A×0.35=28A → need 40A)
  const rcd30max = 40;

  return { phaseCount, mainRating, maxMcb1p, rcd300, rcd30max };
}

// ─── Module mapper ────────────────────────────────────────────────────────────

export function mapRawModule(m: Record<string, unknown>): MappedModule {
  return {
    moduleId: String(m.moduleId ?? ""),
    rating: typeof m.rating === "number" ? m.rating : undefined,
    qty: typeof m.qty === "number" ? m.qty : 1,
    label: typeof m.label === "string" ? m.label : undefined,
    phase: typeof m.phase === "string" ? m.phase : undefined,
    circuitNumber: typeof m.circuitNumber === "string" ? m.circuitNumber : undefined,
    cableType: typeof m.cableType === "string" ? m.cableType : undefined,
    isZugBlock: typeof m.isZugBlock === "boolean" ? m.isZugBlock : undefined,
    terminalCount: typeof m.terminalCount === "number" ? m.terminalCount : undefined,
  };
}

// ─── Load balance post-processor ─────────────────────────────────────────────

/**
 * Diversity factor table matching computeSectionPowerBalance in panel-configurator-helpers.ts.
 * For 3-phase and commercial installations.
 */
const getKj3Phase = (n: number): number => {
  if (n <= 2) return 1.0;
  if (n <= 4) return 0.8;
  if (n <= 9) return 0.6;
  if (n <= 20) return 0.5;
  if (n <= 40) return 0.4;
  return 0.35;
};

/**
 * Removes excess MCBs (1P largest-first, then 3P smallest-first) until
 * effective load ≤ mainRating.
 *
 * For 3-phase: Kj is FROZEN at the initial circuit count using the same table
 * as the UI diagnostic (computeSectionPowerBalance). This ensures the panel
 * will not show overload in the diagnostic after post-processing.
 *
 * Kj is frozen (not variable during iteration) to avoid the feedback loop:
 *   removing MCBs → fewer circuits → Kj jumps up → load increases → more removal.
 *
 * For 1-phase residential: fixed Kj=0.25 (PN-HD 60364, 10-20 circuits).
 */
export function fixLoadBalance(
  modules: MappedModule[],
  mainRating: number,
  phaseCount: number
): MappedModule[] {
  if (mainRating === 0) return modules;

  const is3Phase = phaseCount === 3;

  // Compute Kj at EVERY iteration using current circuit count.
  // This matches the diagnostic (computeSectionPowerBalance) exactly:
  // after removal n drops → Kj may jump up → we keep removing until the
  // FINAL state satisfies effectiveLoad ≤ mainRating at the FINAL Kj.
  // Converges: each step removes ≥1 MCB, total MCBs is finite (guard: 60 iter).
  const calcLoad = (mods: MappedModule[]): number => {
    const mcb1ps = mods.filter((m) => MCB1P_IDS.includes(m.moduleId));
    const mcb3ps = mods.filter((m) => MCB3P_IDS.includes(m.moduleId));
    const n = mcb1ps.length + mcb3ps.length;
    const sum1P = mcb1ps.reduce((s, m) => s + (m.rating ?? 16), 0);
    const sum3P = mcb3ps.reduce((s, m) => s + (m.rating ?? 16), 0);
    const perPhase1P = sum1P / (is3Phase ? 3 : 1);
    const Kj = is3Phase ? getKj3Phase(n) : 0.25;
    return (perPhase1P + sum3P) * Kj;
  };

  let result = [...modules];
  let iterations = 0;

  while (calcLoad(result) > mainRating && iterations < 40) {
    const mcb1ps = result
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => MCB1P_IDS.includes(m.moduleId))
      .sort((a, b) => (b.m.rating ?? 0) - (a.m.rating ?? 0));

    if (mcb1ps.length > 0) {
      result = result.filter((_, i) => i !== mcb1ps[0].i);
    } else {
      const mcb3ps = result
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => MCB3P_IDS.includes(m.moduleId))
        .sort((a, b) => (a.m.rating ?? 0) - (b.m.rating ?? 0));
      if (mcb3ps.length === 0) break;
      result = result.filter((_, i) => i !== mcb3ps[0].i);
    }
    iterations++;
  }
  return result;
}

// ─── Phase balance post-processor ────────────────────────────────────────────

/**
 * Reassigns `phase` fields on 1P MCBs for minimum asymmetry using greedy
 * load balancing: sort MCBs by rating descending, assign each to the
 * least-loaded phase (L1/L2/L3). Only runs for 3-phase panels.
 */
export function fixPhaseBalance(
  modules: MappedModule[],
  phaseCount: number
): MappedModule[] {
  if (phaseCount !== 3) return modules;

  const phases = ["L1", "L2", "L3"] as const;
  type Phase = (typeof phases)[number];

  const mcb1pIdxs = modules
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => MCB1P_IDS.includes(m.moduleId))
    .sort((a, b) => (b.m.rating ?? 16) - (a.m.rating ?? 16)); // largest first

  if (mcb1pIdxs.length === 0) return modules;

  const result = modules.map((m) => ({ ...m }));
  const phaseLoads: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };

  for (const { i } of mcb1pIdxs) {
    const minPhase = phases.reduce<Phase>(
      (min, ph) => (phaseLoads[ph] < phaseLoads[min] ? ph : min),
      phases[0]
    );
    result[i].phase = minPhase;
    phaseLoads[minPhase] += result[i].rating ?? 16;
  }

  return result;
}

// ─── Selectivity post-processor ───────────────────────────────────────────────

/**
 * Wymusza hierarchię selektywności:
 * main ≥ rcd-300 ≥ rcd-30 ≥ max(MCB pod nim)
 * Usuwa Ghost RCD (RCD bez obwodów poniżej).
 */
export function fixSelectivity(
  modules: MappedModule[],
  knownMainRating?: number
): MappedModule[] {
  const isGroupBreaker = (id: string) => isMainSwitch(id) || RCD300_IDS.includes(id);
  const ALL_RCD_IDS = [...RCD300_IDS, ...RCD30_IDS];

  const mainSwitch = modules.find((m) => isMainSwitch(m.moduleId));
  const mainRating = knownMainRating ?? mainSwitch?.rating ?? 32;

  // Step 1: fix rcd-300 >= mainRating, bounded to catalog range [25A..100A]
  for (const m of modules) {
    if (RCD300_IDS.includes(m.moduleId)) {
      const needed = Math.max(RCD300_CATALOG_MIN, nextRating(mainRating));
      const bounded = Math.min(needed, RCD300_CATALOG_MAX);
      if ((m.rating ?? 0) < bounded) m.rating = bounded;
    }
  }

  // Step 2: fix rcd-30 >= max MCB under it
  let currentRcdIdx = -1;
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    if (isGroupBreaker(m.moduleId)) {
      currentRcdIdx = -1;
    } else if (RCD30_IDS.includes(m.moduleId)) {
      currentRcdIdx = i;
    } else if (MCB_IDS.includes(m.moduleId) && currentRcdIdx >= 0) {
      const mcbRating = m.rating ?? 16;
      const rcd = modules[currentRcdIdx];
      if ((rcd.rating ?? 0) < mcbRating) {
        rcd.rating = nextRating(mcbRating);
      }
    }
  }

  // Step 3: cap 1P MCB ratings <= mainRating
  for (const m of modules) {
    if (MCB1P_IDS.includes(m.moduleId) && (m.rating ?? 0) > mainRating) {
      const capped = [...RCD_RATINGS].reverse().find((r) => r <= mainRating) ?? 16;
      m.rating = capped;
    }
  }

  // Step 4: RCD sum load check
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    if (!RCD30_IDS.includes(m.moduleId)) continue;
    let downstreamSum = 0;
    let maxMcb = 0;
    for (let j = i + 1; j < modules.length; j++) {
      if (isGroupBreaker(modules[j].moduleId) || RCD30_IDS.includes(modules[j].moduleId)) break;
      if (MCB_IDS.includes(modules[j].moduleId)) {
        const r = modules[j].rating ?? 16;
        downstreamSum += r;
        if (r > maxMcb) maxMcb = r;
      }
    }
    if (downstreamSum === 0) continue;
    const requiredBySum = nextRating(Math.ceil(downstreamSum * 0.35));
    const requiredByMax = nextRating(maxMcb);
    const required = Math.max(requiredBySum, requiredByMax);
    if ((m.rating ?? 0) < required) m.rating = required;
  }

  // Step 4b: fix rcd-300 (fire RCD) rating based on ALL downstream MCBs (through rcd-30 layers)
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    if (!RCD300_IDS.includes(m.moduleId)) continue;
    let totalMcbSum = 0;
    let maxDownstreamMcb = 0;
    for (let j = i + 1; j < modules.length; j++) {
      if (isMainSwitch(modules[j].moduleId) || RCD300_IDS.includes(modules[j].moduleId)) break;
      if (MCB_IDS.includes(modules[j].moduleId)) {
        const r = modules[j].rating ?? 16;
        totalMcbSum += r;
        if (r > maxDownstreamMcb) maxDownstreamMcb = r;
      }
    }
    if (totalMcbSum === 0) continue;
    const kj300 = 0.35;
    const requiredByKj = nextRating(Math.ceil(totalMcbSum * kj300));
    const requiredByMax = nextRating(maxDownstreamMcb);
    const required300 = Math.max(requiredByKj, requiredByMax);
    const required300Capped = Math.min(required300, RCD300_CATALOG_MAX);
    if ((m.rating ?? 0) < required300Capped) m.rating = required300Capped;
  }

  // Step 5: Ghost RCD cleaner (multi-pass)
  const scanForGhosts = (mods: MappedModule[]): Set<number> => {
    const ghosts = new Set<number>();
    for (let i = 0; i < mods.length; i++) {
      const m = mods[i];
      if (!ALL_RCD_IDS.includes(m.moduleId)) continue;
      let mcbCount = 0;
      let rcd30WithMcb = 0;
      for (let j = i + 1; j < mods.length; j++) {
        if (isMainSwitch(mods[j].moduleId)) break;
        if (RCD300_IDS.includes(mods[j].moduleId)) break;
        if (RCD30_IDS.includes(mods[j].moduleId)) {
          let innerMcb = 0;
          for (let k = j + 1; k < mods.length; k++) {
            if (isMainSwitch(mods[k].moduleId) || ALL_RCD_IDS.includes(mods[k].moduleId)) break;
            if (MCB_IDS.includes(mods[k].moduleId)) innerMcb++;
          }
          if (innerMcb > 0) rcd30WithMcb++;
          break;
        }
        if (MCB_IDS.includes(mods[j].moduleId)) mcbCount++;
      }
      if (mcbCount > 0) continue;
      if (RCD300_IDS.includes(m.moduleId) && rcd30WithMcb > 0) {
        let lastMainIdx = -1;
        for (let k = i - 1; k >= 0; k--) {
          if (isMainSwitch(mods[k].moduleId)) { lastMainIdx = k; break; }
        }
        const isInSeries = !mods.slice(lastMainIdx + 1, i).some(
          (x) => MCB_IDS.includes(x.moduleId) || RCD30_IDS.includes(x.moduleId)
        );
        if (isInSeries) continue;
      }
      ghosts.add(i);
    }
    return ghosts;
  };

  let cleaned = [...modules];
  for (let pass = 0; pass < 5; pass++) {
    const ghosts = scanForGhosts(cleaned);
    if (ghosts.size === 0) break;
    cleaned = cleaned.filter((_, idx) => !ghosts.has(idx));
  }
  return cleaned;
}

// ─── Server-side RCD reorder (mirrors client reorderForRcdCoverage) ─────────────

/**
 * Ensures every rcd-30 comes BEFORE its MCBs in the modules array.
 * Run this before fixSelectivity so Step 4 can correctly count downstream MCBs.
 */
export function reorderRcdBeforeMcbs(modules: MappedModule[]): MappedModule[] {
  const isMnSw = (m: MappedModule) => isMainSwitch(m.moduleId);
  const isSpdM = (m: MappedModule) => m.moduleId.startsWith("spd-");
  const isRcd3 = (m: MappedModule) => [...RCD300_IDS, ...RCD30_IDS].includes(m.moduleId);
  const isBrkr = (m: MappedModule) => MCB_IDS.includes(m.moduleId) && !isMnSw(m);
  const allRcds = modules.filter(isRcd3);
  if (allRcds.length === 0) return modules;
  // Check if already ordered (every RCD has ≥1 MCB after it before the next RCD/mainSwitch)
  let needsReorder = false;
  for (let i = 0; i < modules.length; i++) {
    if (!isRcd3(modules[i])) continue;
    const hasFollowing = modules.slice(i + 1).some(isBrkr);
    if (!hasFollowing) { needsReorder = true; break; }
  }
  if (!needsReorder) return modules;
  const mainSwitches = modules.filter(isMnSw);
  const spds = modules.filter(isSpdM);
  const rcd300s = modules.filter(m => RCD300_IDS.includes(m.moduleId));
  const rcd30s = modules.filter(m => RCD30_IDS.includes(m.moduleId));
  const breakers = modules.filter(isBrkr);
  const others = modules.filter(m => !isMnSw(m) && !isSpdM(m) && !isRcd3(m) && !isBrkr(m));
  if (rcd30s.length === 0) return modules;
  const result: MappedModule[] = [...mainSwitches, ...spds, ...rcd300s];
  const perRcd = Math.floor(breakers.length / rcd30s.length);
  const extra = breakers.length % rcd30s.length;
  let bIdx = 0;
  for (let i = 0; i < rcd30s.length; i++) {
    result.push(rcd30s[i]);
    const count = perRcd + (i < extra ? 1 : 0);
    result.push(...breakers.slice(bIdx, bIdx + count));
    bIdx += count;
  }
  return [...result, ...others];
}

// ─── Enclosure auto-sizer ─────────────────────────────────────────────────────

/**
 * Computes the minimum enclosure modules needed for all DIN modules + 25% reserve.
 * Returns the next available enclosure size from the standard list.
 */
export function computeEnclosureModules(modules: MappedModule[]): number {
  const totalWidth = modules.reduce((sum, m) => {
    // ZUG block: real width = ceil(terminalCount/3), NOT the static 5 in MODULE_DIN_WIDTH
    const w = m.isZugBlock
      ? Math.ceil((m.terminalCount ?? 15) / 3)
      : (MODULE_DIN_WIDTH[m.moduleId] ?? 1);
    return sum + w;
  }, 0);
  const withReserve = Math.ceil(totalWidth * 1.3);
  return ENCLOSURE_OPTIONS_LIST.find(e => e >= withReserve) ?? 72;
}

// ─── Accessories calculator ───────────────────────────────────────────────────

/**
 * Deterministyczny kalkulator materiałów montażowych.
 * Normy wg PN-HD 60364 i SEP-E-005:
 *   LgY 1.5/2.5mm²: 0.35m/MCB | LgY 6/10mm²: 0.8m/rząd | Tulejki: 2.2szt/m
 */
export function computeAccessories(
  allModules: MappedModule[],
  encMods = 72,
  phaseCount: number,
  mainRating: number
): { moduleId: string; qty: number; knrCode?: string }[] {
  const circuits1p = allModules.filter((m) => MCB1P_IDS.includes(m.moduleId));
  const circuits3p = allModules.filter((m) => MCB3P_IDS.includes(m.moduleId));
  const totalCircuits = circuits1p.length + circuits3p.length;

  const light1p = circuits1p.filter((m) => (m.rating ?? 16) <= 10).length;
  const socket1p = circuits1p.filter((m) => (m.rating ?? 16) > 10 && (m.rating ?? 16) <= 16).length;
  const heavy1p = circuits1p.filter((m) => (m.rating ?? 16) > 16).length;
  const heavy3p = circuits3p.length;

  const LGY_SMALL_PER_MCB = 0.35;
  let lgy15m = Math.round(light1p * LGY_SMALL_PER_MCB * 10) / 10;
  let lgy25m = Math.round(
    (socket1p + heavy1p + (circuits1p.length - light1p - socket1p - heavy1p)) * LGY_SMALL_PER_MCB * 10
  ) / 10;

  if (encMods <= 96) {
    const totalSmall = lgy15m + lgy25m;
    if (totalSmall > 45) {
      const ratio = 45 / totalSmall;
      lgy15m = Math.round(lgy15m * ratio * 10) / 10;
      lgy25m = Math.round(lgy25m * ratio * 10) / 10;
    }
  }

  const dinRows = Math.max(1, Math.ceil((totalCircuits + 2) / 8));
  const lgy6m = Math.round(heavy3p * 0.8 * 10) / 10;
  const lgy10m = Math.round(dinRows * 8) / 10;

  const mainFeedQty = Math.max(1, dinRows);
  const mainFeedId = mainRating >= 40 ? "wire-16" : "wire-10";

  const totalLgyHeavy = lgy6m + lgy10m;
  const ferruleSmall = Math.max(1, Math.ceil(totalCircuits * 2 / 100));
  const ferruleMed = totalLgyHeavy > 0
    ? Math.max(1, Math.ceil((heavy3p * 3 + mainFeedQty) * 2 / 50))
    : 0;

  const cableTie200 = Math.max(1, Math.ceil(totalCircuits / 8));
  const cableTie300 = heavy3p > 0 ? 1 : 0;
  const markingStrip = Math.max(1, dinRows);

  const busbars: { moduleId: string; qty: number }[] =
    phaseCount === 3
      ? [{ moduleId: "busbar-3p", qty: 1 }, { moduleId: "busbar-2p", qty: 1 }]
      : [{ moduleId: "busbar-2p", qty: 1 }];

  const hasAutomation = allModules.some((m) =>
    AUTOMATION_PREFIXES.some((p) => m.moduleId.startsWith(p))
  );
  const busControllerCount = allModules.filter((m) =>
    BUS_CONTROLLER_IDS.includes(m.moduleId)
  ).length;
  const signalTerminalPacks = busControllerCount > 0 ? Math.max(1, busControllerCount) : 0;

  const ZUG_MULTIPLIER = hasAutomation ? 3 : 1;
  const isExpertPanel = encMods > 24;
  const zug1p = isExpertPanel ? circuits1p.length * ZUG_MULTIPLIER : 0;
  const zug3p = isExpertPanel ? circuits3p.length * ZUG_MULTIPLIER : 0;
  const endBrackets = isExpertPanel && zug1p + zug3p > 0 ? 2 : 0;

  const withKnr = (moduleId: string, qty: number) => {
    const meta = getKnrMetadata(moduleId);
    return {
      moduleId,
      qty,
      ...(meta.source !== "generic" ? { knrCode: meta.knrCode } : {}),
    };
  };

  return [
    ...(lgy15m > 0 ? [withKnr("wire-1-5", lgy15m)] : []),
    ...(lgy25m > 0 ? [withKnr("wire-2-5", lgy25m)] : []),
    ...(lgy6m > 0 ? [withKnr("wire-6", lgy6m)] : []),
    ...(lgy10m > 0 ? [withKnr("wire-10", lgy10m)] : []),
    withKnr(mainFeedId, mainFeedQty),
    ...busbars.map((b) => withKnr(b.moduleId, b.qty)),
    withKnr("pe-bar", 1),
    withKnr("n-bar", 1),
    withKnr("ferrule-small", ferruleSmall),
    ...(ferruleMed > 0 ? [withKnr("ferrule-medium", ferruleMed)] : []),
    withKnr("cable-tie-200", cableTie200),
    ...(cableTie300 > 0 ? [withKnr("cable-tie-300", cableTie300)] : []),
    withKnr("marking-strip", markingStrip),
    ...(zug1p > 0 ? [withKnr("terminal-zug-1p", zug1p)] : []),
    ...(zug3p > 0 ? [withKnr("terminal-zug-3p", zug3p)] : []),
    ...(endBrackets > 0 ? [withKnr("terminal-end-bracket", endBrackets)] : []),
    ...(signalTerminalPacks > 0 ? [withKnr("signal-terminal", signalTerminalPacks)] : []),
    withKnr("labor-assembly", 1),
    withKnr("labor-cable-routing", 1),
    withKnr("labor-testing", 1),
    withKnr("labor-marking", 1),
  ];
}
