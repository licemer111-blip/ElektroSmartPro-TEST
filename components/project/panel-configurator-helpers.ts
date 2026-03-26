// =============================================
// PANEL CONFIGURATOR — HELPER FUNCTIONS
// =============================================
// Pure utility functions extracted from panel-configurator.tsx.
// No React imports — safe to use in server and client contexts.

import type { DinModule, RailModule } from "./panel-configurator-types";

// ─── Category labels ─────────────────────────────────────────────────────────
export const MODULE_CATEGORIES: Record<string, string> = {
  breaker: "Zabezpieczenia nadprądowe",
  rcd: "Ochrona różnicowa",
  rcbo: "Kombinowane (RCBO)",
  switch: "Rozłączniki / SZR / Wyłączniki",
  spd: "Ochrona przepięciowa",
  contactor: "Styczniki / Przekaźniki",
  motor_control: "Napędy / Rozruch silników",
  timer: "Sterowanie / Programatory",
  monitoring: "Pomiar / Monitoring",
  automation: "Automatyka / KNX / BMS",
  compensation: "Kompensacja mocy biernej",
  terminal: "Złączki / Końcówki / Zaciski",
  enclosure: "Obudowy / Akcesoria szyn",
  wiring: "Przewody / Okablowanie",
  consumable: "Materiały montażowe",
  labor: "Robocizna / Usługi montażowe",
};

// ─── Section labels ───────────────────────────────────────────────────────────
export const SECTION_FEED_LABELS: Record<string, string> = {
  main: "Zasilanie podstawowe",
  reserve: "Zasilanie rezerwowe",
  ups: "UPS / gwarantowane",
  pv: "Fotowoltaika / OZE",
  generator: "Agregat prądotwórczy",
};

export const SECTION_TYPE_LABELS: Record<string, string> = {
  distribution: "Rozdzielcza",
  ats: "SZR / Przełączanie",
  metering: "Pomiarowa",
  compensation: "Kompensacja",
  automation: "Automatyka / BMS",
  motor: "Odpływy silnikowe",
};

// ─── Non-modular detection ────────────────────────────────────────────────────
export const NON_MODULAR_CATEGORIES = ["labor", "wiring", "consumable", "terminal"] as const;

export function isNonModularItem(module: DinModule): boolean {
  return NON_MODULAR_CATEGORIES.includes(module.category as (typeof NON_MODULAR_CATEGORIES)[number]) || module.modules === 0;
}

export function isConsumableCategory(category: string): boolean {
  return category === "consumable" || category === "wiring" || category === "terminal";
}

export function isLaborCategory(category: string): boolean {
  return category === "labor";
}

export function getItemUnit(module: DinModule): string {
  if (module.category === "wiring") return "m";
  if (module.category === "labor") return "usł.";
  if (module.category === "consumable") return "szt.";
  return "szt.";
}

// ─── Module abbreviation (shown on DIN rail blocks) ──────────────────────────
export function getModuleAbbr(id: string, name: string): string {
  if (id.startsWith("mcb")) return id.includes("1p") ? "B1P" : id.includes("3p") ? (id.includes("-d-") ? "D3P" : id.includes("-c-") ? "C3P" : "B3P") : "MCB";
  if (id.startsWith("rcbo")) return "RCBO";
  if (id.startsWith("rcd-30-a")) return "RCD A";
  if (id.startsWith("rcd-30")) return "RCD";
  if (id.startsWith("rcd-300")) return "RCD 300";
  if (id.startsWith("mccb")) return id.includes("100") ? "MCCB100" : id.includes("160") ? "MCCB160" : id.includes("250") ? "MCCB250" : id.includes("400") ? "MCCB400" : id.includes("630") ? "MCCB630" : "MCCB";
  if (id.startsWith("acb")) return "ACB";
  if (id.startsWith("szr")) return "SZR";
  if (id.startsWith("spd")) return "SPD";
  if (id === "motor-starter-dol") return "DOL";
  if (id === "star-delta-starter") return "Y/Δ";
  if (id === "soft-starter") return "SS";
  if (id === "vfd-drive") return "VFD";
  if (id === "thermal-overload") return "OL";
  if (id === "auxiliary-relay") return "AUX";
  if (id.startsWith("contactor")) return "K";
  if (id.startsWith("knx")) return "KNX";
  if (id.startsWith("pfc")) return "PFC";
  if (id.startsWith("main-switch")) return "QF";
  if (id === "changeover-switch") return "Q0-1";
  if (id.startsWith("energy-meter")) return "kWh";
  if (id === "multifunction-meter") return "MF";
  if (id === "ct-5a") return "CT";
  if (id === "phase-monitor") return "REL";
  if (id === "voltage-relay") return "RNT";
  if (id.startsWith("timer")) return "T";
  if (id === "step-relay") return "BIS";
  if (id === "priority-relay") return "PRIOR";
  if (id.startsWith("wire-")) return "WIRE";
  if (id.startsWith("busbar")) return "BUSB";
  if (id.startsWith("cable-tie")) return "TIES";
  if (id.startsWith("cable-gland")) return "CONN";
  if (id.startsWith("cable-lug")) return "CABL";
  if (id.startsWith("cable-entry")) return "ENTR";
  if (id.startsWith("cable-comb")) return "COMB";
  if (id === "signal-lamp") return "SIGN";
  if (id === "marking-strip") return "MARK";
  if (id === "ammeter-din") return "AMPR";
  if (id === "psu-24v") return "PSU";
  if (id.startsWith("din-rail")) return "DIN";
  if (id.startsWith("end-stopper")) return "STOP";
  if (id.startsWith("phase-sep")) return "SEP";
  if (id.startsWith("heat-shrink")) return "SHRK";
  if (id.startsWith("corrugated")) return "TUBE";
  if (id.startsWith("insulation")) return "INSU";
  if (id.startsWith("iso-tape")) return "TAPE";
  if (id.startsWith("wire-marker")) return "WMRK";
  if (id.startsWith("phase-marker")) return "PMRK";
  if (id.startsWith("wire-duct")) return "DUCT";
  if (id.startsWith("mounting")) return "BOLT";
  if (id.startsWith("copper-bar")) return "CuBA";
  if (id.startsWith("ferrule")) return "FERR";
  if (id.startsWith("ring-term")) return "RING";
  if (id.startsWith("terminal")) return "TERM";
  if (id.startsWith("wago")) return "WAGO";
  if (id.startsWith("distrib-block")) return "BLOK";
  if (id.startsWith("detuned")) return "DROS";
  if (id.startsWith("labor")) return "PRAC";
  if (id.startsWith("fan-therm")) return "VENT";
  if (id.startsWith("anti-cond")) return "GRZK";
  if (id.startsWith("vent-grille")) return "KRAT";
  if (id.startsWith("led-light")) return "LED";
  if (id.startsWith("door-switch")) return "DRSW";
  if (id.startsWith("door-seal")) return "SEAL";
  if (id.startsWith("earth-bar")) return "PE";
  if (id.startsWith("label-tape")) return "ETYK";
  return name.slice(0, 4).toUpperCase();
}

// ─── Module price calculation ─────────────────────────────────────────────────
export function getModulePrice(m: RailModule, manufacturerCoeff: number = 1.0): { material: number; labor: number } {
  const qty = m.isZugBlock ? (m.terminalCount || 15) : (m.quantity || 1);
  const unitMaterial = m.customMaterialPrice ?? Math.round(m.module.defaultPrice * manufacturerCoeff * 100) / 100;
  const unitLabor = m.customLaborPrice ?? m.module.defaultLaborPrice;
  return {
    material: unitMaterial * qty,
    labor: unitLabor * qty,
  };
}

// ─── Cable helpers ────────────────────────────────────────────────────────────
export function getCableWarning(cableType: string | undefined, rating: number): string | null {
  if (!cableType || !rating) return null;
  const crossMatch = cableType.match(/×(\d+[.,]?\d*)/) || cableType.match(/(\d+[.,]?\d*)\s*mm/);
  if (!crossMatch) return null;
  const cross = parseFloat(crossMatch[1].replace(",", "."));
  const maxRating: Record<number, number> = { 1.5: 10, 2.5: 16, 4: 25, 6: 32, 10: 50, 16: 63, 25: 80, 35: 100 };
  const maxA = maxRating[cross];
  if (maxA && rating > maxA) return `Kabel ${cross}mm² max ${maxA}A, MCB ${rating}A — za słaby!`;
  return null;
}

export function suggestCableForCircuit(rating: number, moduleId: string): string {
  const id = moduleId.toLowerCase();
  if (id.includes("3p") || id.includes("3-p") || id.includes("troj") || id.startsWith("mccb") || id.startsWith("acb")) {
    if (rating <= 16) return "YDYp 5×2.5";
    if (rating <= 25) return "YDYp 5×4";
    if (rating <= 32) return "YDYp 5×6";
    if (rating <= 50) return "YDYp 5×10";
    if (rating <= 80) return "LgY 3×25mm²";
    if (rating <= 125) return "LgY 3×35mm²";
    if (rating <= 160) return "LgY 3×50mm²";
    if (rating <= 250) return "LgY 3×95mm²";
    if (rating <= 400) return "LgY 3×185mm²";
    return "LgY 3×240mm²";
  }
  if (rating <= 10) return "YDYp 3×1.5";
  if (rating <= 16) return "YDYp 3×2.5";
  if (rating <= 25) return "YDYp 3×4";
  if (rating <= 32) return "YDYp 3×6";
  if (rating <= 50) return "YDYp 3×10";
  if (rating <= 80) return "LgY 1×25mm²";
  return "LgY 1×35mm²";
}

// ─── Category color (for DIN rail blocks) ────────────────────────────────────
export function getCategoryColor(cat: string): string {
  switch (cat) {
    case "breaker": return "#2563eb";
    case "rcd": case "rcbo": return "#059669";
    case "switch": return "#475569";
    case "spd": return "#d97706";
    case "contactor": return "#7c3aed";
    case "motor_control": return "#c2410c";
    case "timer": return "#0891b2";
    case "monitoring": return "#e11d48";
    case "automation": return "#4f46e5";
    case "compensation": return "#4d7c0f";
    case "terminal": return "#db2777";
    case "wiring": return "#0d9488";
    case "consumable": return "#7c3aed";
    case "labor": return "#ea580c";
    default: return "#64748b";
  }
}

// ─── Rail rows computation ────────────────────────────────────────────────────
export interface VisualModuleSlim {
  source: RailModule;
  visualWidth: number;
  isFragment: boolean;
  fragmentIndex?: number;
  fragmentTotal?: number;
  fragmentTerminalCount?: number;
}

export function computeRailRows(railModules: RailModule[], modulesPerRow: number, enclosureRows: number): VisualModuleSlim[][] {
  const rows: VisualModuleSlim[][] = [];
  let currentRow: VisualModuleSlim[] = [];
  let currentSlots = 0;
  for (const mod of railModules) {
    const fullWidth = mod.isZugBlock && mod.terminalCount ? Math.ceil(mod.terminalCount / 3) : Math.max(1, mod.module.modules);
    if (mod.isZugBlock && fullWidth > 0) {
      let remaining = fullWidth;
      let remainingTerminals = mod.terminalCount || (fullWidth * 3);
      let fragIdx = 0;
      const totalFrags = Math.ceil(fullWidth / modulesPerRow) + (currentSlots > 0 && fullWidth > (modulesPerRow - currentSlots) ? 1 : 0);
      while (remaining > 0) {
        const available = modulesPerRow - currentSlots;
        if (available <= 0) { if (currentRow.length > 0) rows.push(currentRow); currentRow = []; currentSlots = 0; continue; }
        const sliceWidth = Math.min(remaining, available);
        const terminalsInSlice = remaining === sliceWidth ? remainingTerminals : Math.min(remainingTerminals, sliceWidth * 3);
        currentRow.push({ source: mod, visualWidth: sliceWidth, isFragment: fullWidth !== sliceWidth, fragmentIndex: fragIdx, fragmentTotal: totalFrags, fragmentTerminalCount: terminalsInSlice });
        currentSlots += sliceWidth; remaining -= sliceWidth; remainingTerminals -= terminalsInSlice; fragIdx++;
        if (currentSlots >= modulesPerRow) { rows.push(currentRow); currentRow = []; currentSlots = 0; }
      }
    } else {
      if (fullWidth > modulesPerRow) {
        // Wide non-ZUG module: split across rows like ZUG
        let remaining = fullWidth;
        let fragIdx = 0;
        const totalFrags = Math.ceil(fullWidth / modulesPerRow);
        while (remaining > 0) {
          const available = modulesPerRow - currentSlots;
          if (available <= 0) { if (currentRow.length > 0) rows.push(currentRow); currentRow = []; currentSlots = 0; continue; }
          const sliceWidth = Math.min(remaining, available);
          currentRow.push({ source: mod, visualWidth: sliceWidth, isFragment: fragIdx > 0 || sliceWidth < fullWidth, fragmentIndex: fragIdx, fragmentTotal: totalFrags });
          currentSlots += sliceWidth; remaining -= sliceWidth; fragIdx++;
          if (currentSlots >= modulesPerRow) { rows.push(currentRow); currentRow = []; currentSlots = 0; }
        }
      } else {
        if (currentSlots + fullWidth > modulesPerRow && currentRow.length > 0) { rows.push(currentRow); currentRow = []; currentSlots = 0; }
        currentRow.push({ source: mod, visualWidth: fullWidth, isFragment: false });
        currentSlots += fullWidth;
      }
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);
  while (rows.length < enclosureRows) rows.push([]);
  return rows;
}

// ─── Power balance computation ────────────────────────────────────────────────
export interface SectionPowerBalance {
  sectionId: string;
  mainRating: number;
  is3Phase: boolean;
  totalCircuits: number;
  diversityFactor: number;
  effectiveLoad: number;
  loadPercent: number;
  totalPowerKW: number;
  status: "empty" | "ok" | "warning" | "overload";
}

export function computeSectionPowerBalance(sections: { id: string; modules: RailModule[] }[]): SectionPowerBalance[] {
  return sections.map((sec) => {
    const mainSwitch = sec.modules.find(m =>
      m.module.id.startsWith("main-switch") || m.module.id.startsWith("mccb") || m.module.id.startsWith("acb")
    );
    const mainRating = mainSwitch?.rating || 0;
    const is3Phase = !!(mainSwitch?.module.id.includes("3p") || (mainSwitch?.module.modules || 0) >= 3);
    const outgoingCircuits1P: number[] = [];
    const outgoingCircuits3P: number[] = [];
    for (const m of sec.modules) {
      if (m.uid === mainSwitch?.uid) continue;
      if (!m.rating) continue;
      const cat = m.module.category;
      if (cat !== "breaker" && cat !== "rcbo") continue;
      if (m.module.id.startsWith("mccb") || m.module.id.startsWith("motorized")) continue;
      const is3p = m.module.modules >= 3;
      if (is3p) outgoingCircuits3P.push(m.rating);
      else outgoingCircuits1P.push(m.rating);
    }
    const totalCircuits = outgoingCircuits1P.length + outgoingCircuits3P.length;
    const isResidential1P = !is3Phase && mainRating > 0 && mainRating <= 40;
    const getDiversityFactor = (n: number): number => {
      if (isResidential1P) {
        if (n <= 2) return 0.8; if (n <= 4) return 0.5; if (n <= 9) return 0.3; if (n <= 20) return 0.25; return 0.2;
      }
      if (n <= 2) return 1.0; if (n <= 4) return 0.8; if (n <= 9) return 0.6; if (n <= 20) return 0.5; if (n <= 40) return 0.4; return 0.35;
    };
    const Kj = getDiversityFactor(totalCircuits);
    const sum1P = outgoingCircuits1P.reduce((a, b) => a + b, 0);
    const sum3P = outgoingCircuits3P.reduce((a, b) => a + b, 0);
    const perPhase1P = sum1P / (is3Phase ? 3 : 1);
    const maxPerPhase = perPhase1P + sum3P;
    const effectiveLoad = maxPerPhase * Kj;
    const loadPercent = mainRating > 0 ? Math.round((effectiveLoad / mainRating) * 100) : 0;
    const totalPowerKW = is3Phase
      ? Math.round(effectiveLoad * 400 * 1.732 / 1000 * 10) / 10
      : Math.round(effectiveLoad * 230 / 1000 * 10) / 10;
    return {
      sectionId: sec.id, mainRating, is3Phase, totalCircuits, diversityFactor: Kj,
      effectiveLoad: Math.round(effectiveLoad * 10) / 10, loadPercent, totalPowerKW,
      status: loadPercent === 0 ? "empty" : loadPercent <= 80 ? "ok" : loadPercent <= 100 ? "warning" : "overload",
    };
  });
}

// ─── Module short name ────────────────────────────────────────────────────────
export function getShortName(rm: RailModule): string {
  const cat = rm.module.category;
  const name = rm.module.name;
  if (cat === "breaker") return "MCB";
  if (cat === "rcd") return "RCD";
  if (cat === "rcbo") return "RCBO";
  if (cat === "switch") {
    if (name.includes("SZR")) return "SZR";
    if (name.includes("Przełącznik")) return "PRZL";
    return "ROZL";
  }
  if (cat === "spd") return "SPD";
  if (cat === "contactor") return "KONT";
  if (cat === "motor_control") return "NAP";
  if (cat === "timer") return "STER";
  if (cat === "monitoring") return name.includes("Licznik") ? "LICZN" : "MON";
  if (cat === "automation") return name.includes("KNX") ? "KNX" : "AUTO";
  if (cat === "compensation") return "KOMP";
  if (cat === "terminal") return name.includes("WAGO") ? "WAGO" : "TERM";
  if (cat === "wiring") return "WIRE";
  if (cat === "consumable") return "MAT";
  if (cat === "labor") return "ROB";
  return name.substring(0, 4).toUpperCase();
}

// ─── Phase helpers ────────────────────────────────────────────────────────────
export function getPhaseColor(phase: string): string {
  switch (phase) {
    case "L1": return "#92400e";
    case "L2": return "#1e293b";
    case "L3": return "#6b7280";
    default: return "#3b82f6";
  }
}
