// ═══════════════════════════════════════════════════════════════════
// Schemat Draw Layout — Bus Bar, Bus Connections, Title Block, Legend
// PN-EN ISO 7200 (title block), IEC 60617 (bus representation)
// ═══════════════════════════════════════════════════════════════════
import type { SchematDevice, SchematConfig, BusBarGeometry } from "../schemat-svg-types";
import { PHASE_COLORS, PHASE_COLOR_ARR, PHASE_LABELS, BUS_SPACING } from "../schemat-svg-types";
import { esc, truncate } from "../schemat-svg-types";
import { MARGIN } from "./geometry-engine";

// ── Bus Bar (5-line: L1 L2 L3 N PE) ─────────────────────────────────────────
export function drawBusBar(busX1: number, busX2: number, busY: number, has3Phase: boolean): string {
  const parts: string[] = [];
  const indices = has3Phase ? [0, 1, 2, 3, 4] : [0, 3, 4];
  for (const li of indices) {
    const lineIdx = has3Phase ? li : (li === 0 ? 0 : li === 3 ? 1 : 2);
    const ly = busY + lineIdx * BUS_SPACING;
    const lw = li < 3 ? 2.5 : 1.5;
    const dash = li === 3 ? ' stroke-dasharray="8,4"' : li === 4 ? ' stroke-dasharray="6,3"' : "";
    parts.push(`<line x1="${busX1}" y1="${ly}" x2="${busX2}" y2="${ly}" stroke="${PHASE_COLOR_ARR[li]}" stroke-width="${lw}"${dash}/>`);
    parts.push(`<text x="${busX1 - 6}" y="${ly + 4}" text-anchor="end" font-size="9" font-weight="bold" fill="${PHASE_COLOR_ARR[li]}">${PHASE_LABELS[li]}</text>`);
  }
  const yPE = busY + (has3Phase ? 4 : 2) * BUS_SPACING;
  parts.push(`<line x1="${busX1}" y1="${yPE}" x2="${busX2}" y2="${yPE}" stroke="${PHASE_COLORS.PE_STRIPE}" stroke-width="1.5" stroke-dasharray="4,7" stroke-dashoffset="2"/>`);
  return parts.join("");
}

// ── Bus connection dots ───────────────────────────────────────────────────────
export function drawBusDots(x: number, dev: SchematDevice, geo: BusBarGeometry): string {
  let d = "";
  const dot = (cy: number, color: string, r = 3.5) => `<circle cx="${x}" cy="${cy}" r="${r}" fill="${color}"/>`;
  const t = dev.type, p = dev.poles;
  if (t === "spd") {
    if (geo.has3Phase) { d += dot(geo.yL1, PHASE_COLORS.L1); d += dot(geo.yL2, PHASE_COLORS.L2); d += dot(geo.yL3, PHASE_COLORS.L3); }
    else { d += dot(geo.yL1, PHASE_COLORS.L1); }
    d += dot(geo.yN, PHASE_COLORS.N, 3); d += dot(geo.yPE, PHASE_COLORS.PE, 3);
  } else if (t === "rcd") {
    if (p >= 3 && geo.has3Phase) { d += dot(geo.yL1, PHASE_COLORS.L1); d += dot(geo.yL2, PHASE_COLORS.L2); d += dot(geo.yL3, PHASE_COLORS.L3); }
    else { const pi = dev.phase === "L2" ? 1 : dev.phase === "L3" ? 2 : 0; d += dot(geo.has3Phase ? geo.yL1 + pi * BUS_SPACING : geo.yL1, PHASE_COLOR_ARR[pi]); }
    d += dot(geo.yN, PHASE_COLORS.N, 3);
  } else if (t === "main_switch") {
    if (p >= 3 && geo.has3Phase) { d += dot(geo.yL1, PHASE_COLORS.L1); d += dot(geo.yL2, PHASE_COLORS.L2); d += dot(geo.yL3, PHASE_COLORS.L3); if (p >= 4) d += dot(geo.yN, PHASE_COLORS.N, 3); }
    else { d += dot(geo.yL1, PHASE_COLORS.L1); d += dot(geo.yN, PHASE_COLORS.N, 3); }
  } else {
    if (p >= 3 && geo.has3Phase) { d += dot(geo.yL1, PHASE_COLORS.L1); d += dot(geo.yL2, PHASE_COLORS.L2); d += dot(geo.yL3, PHASE_COLORS.L3); }
    else { const pi = dev.phase === "L2" ? 1 : dev.phase === "L3" ? 2 : 0; d += dot(geo.has3Phase ? geo.yL1 + pi * BUS_SPACING : geo.yL1, PHASE_COLOR_ARR[pi]); }
  }
  return d;
}

// ── Bus connection lines (busbar → device terminal) ──────────────────────────
export function drawBusConnection(x: number, targetY: number, dev: SchematDevice, geo: BusBarGeometry): string {
  let d = "";
  const p = dev.poles;
  if (p >= 3 && geo.has3Phase) {
    const convStart = targetY - 12;
    d += `<line x1="${x-5}" y1="${geo.yL1}" x2="${x-5}" y2="${convStart}" stroke="${PHASE_COLORS.L1}" stroke-width="1.4"/>`;
    d += `<line x1="${x}" y1="${geo.yL2}" x2="${x}" y2="${targetY}" stroke="${PHASE_COLORS.L2}" stroke-width="1.4"/>`;
    d += `<line x1="${x+5}" y1="${geo.yL3}" x2="${x+5}" y2="${convStart}" stroke="${PHASE_COLORS.L3}" stroke-width="1.4"/>`;
    d += `<line x1="${x-5}" y1="${convStart}" x2="${x}" y2="${targetY}" stroke="${PHASE_COLORS.L1}" stroke-width="1.4"/>`;
    d += `<line x1="${x+5}" y1="${convStart}" x2="${x}" y2="${targetY}" stroke="${PHASE_COLORS.L3}" stroke-width="1.4"/>`;
    if (["rcd","main_switch","rcbo","spd","contactor","motor_starter"].includes(dev.type)) {
      d += `<line x1="${x+10}" y1="${geo.yN}" x2="${x+10}" y2="${convStart}" stroke="${PHASE_COLORS.N}" stroke-width="1" stroke-dasharray="3,3"/>`;
      d += `<line x1="${x+10}" y1="${convStart}" x2="${x}" y2="${targetY}" stroke="${PHASE_COLORS.N}" stroke-width="1" stroke-dasharray="3,3"/>`;
    }
    const labelY = geo.busBottom + Math.round((targetY - geo.busBottom) * 0.35);
    d += `<text x="${x+14}" y="${labelY}" font-size="7" font-weight="bold" fill="#475569">${p}P</text>`;
  } else {
    const pi = dev.phase === "L2" ? 1 : dev.phase === "L3" ? 2 : 0;
    const startY = geo.has3Phase ? geo.yL1 + pi * BUS_SPACING : geo.yL1;
    d += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${targetY}" stroke="${PHASE_COLOR_ARR[pi]}" stroke-width="1.5"/>`;
    if (geo.has3Phase && dev.phase) d += `<text x="${x+8}" y="${(startY + targetY) / 2}" font-size="7" font-weight="bold" fill="${PHASE_COLOR_ARR[pi]}">${dev.phase}</text>`;
  }
  return d;
}

// ── Title Block per PN-EN ISO 7200 ────────────────────────────────────────────
export function drawTitleBlock(config: SchematConfig, _sectionName: string, pageW: number, pageNum: number, totalPages: number, dateStr: string): string {
  const tbW = 320, tbH = 80, tbX = pageW - MARGIN - tbW, tbY = MARGIN, midX = tbX + 100;
  const parts: string[] = [];
  parts.push(`<rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" rx="1"/>`);
  parts.push(`<line x1="${midX}" y1="${tbY}" x2="${midX}" y2="${tbY+tbH}" stroke="#94a3b8" stroke-width="0.5"/>`);
  [20, 40, 60].forEach(off => parts.push(`<line x1="${tbX}" y1="${tbY+off}" x2="${tbX+tbW}" y2="${tbY+off}" stroke="#94a3b8" stroke-width="0.5"/>`));
  const drawingNum = config.drawingNumber || `ES-${String(pageNum).padStart(3, "0")}`;
  parts.push(`<text x="${tbX+4}" y="${tbY+14}" font-size="7" fill="#94a3b8">Nr rys.</text>`);
  parts.push(`<text x="${tbX+40}" y="${tbY+14}" font-size="9" font-weight="bold" fill="#0f172a">${esc(drawingNum)}</text>`);
  parts.push(`<text x="${midX+4}" y="${tbY+14}" font-size="9" font-weight="bold" fill="#0f172a">${esc(truncate(config.panelName || "Rozdzielnica", 28))}</text>`);
  parts.push(`<text x="${tbX+4}" y="${tbY+34}" font-size="7" fill="#94a3b8">Producent</text>`);
  parts.push(`<text x="${tbX+50}" y="${tbY+34}" font-size="8" fill="#475569">${esc(config.manufacturerName)}</text>`);
  parts.push(`<text x="${midX+4}" y="${tbY+34}" font-size="7" fill="#94a3b8">Data</text>`);
  parts.push(`<text x="${midX+30}" y="${tbY+34}" font-size="8" fill="#475569">${esc(dateStr)}</text>`);
  parts.push(`<text x="${tbX+tbW-4}" y="${tbY+34}" text-anchor="end" font-size="8" fill="#475569">Ark. ${pageNum}/${totalPages}</text>`);
  if (config.companyName) { parts.push(`<text x="${tbX+4}" y="${tbY+54}" font-size="7" fill="#94a3b8">Firma</text>`); parts.push(`<text x="${tbX+34}" y="${tbY+54}" font-size="8" fill="#475569">${esc(truncate(config.companyName, 16))}</text>`); }
  if (config.designerName) { parts.push(`<text x="${midX+4}" y="${tbY+54}" font-size="7" fill="#94a3b8">Wykonal</text>`); parts.push(`<text x="${midX+44}" y="${tbY+54}" font-size="8" fill="#475569">${esc(truncate(config.designerName, 22))}</text>`); }
  parts.push(`<text x="${tbX+4}" y="${tbY+74}" font-size="7" fill="#94a3b8">Norma</text>`);
  parts.push(`<text x="${tbX+34}" y="${tbY+74}" font-size="7.5" fill="#475569">PN-EN 61439-2</text>`);
  parts.push(`<text x="${tbX+tbW-4}" y="${tbY+74}" text-anchor="end" font-size="7.5" font-weight="bold" fill="#1e293b">SCHEMAT WIELOLINIOWY</text>`);
  return parts.join("");
}

// ── Legend (Legenda Symboli) ───────────────────────────────────────────────────
export function drawLegend(x: number, y: number, width: number, usedTypes: Set<string>): string {
  const parts: string[] = [];
  const legendH = 90;
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${legendH}" fill="#fafafa" stroke="#cbd5e1" stroke-width="1" rx="2"/>`);
  parts.push(`<text x="${x+8}" y="${y+14}" font-size="9" font-weight="bold" fill="#1e293b">LEGENDA SYMBOLI</text>`);
  parts.push(`<line x1="${x}" y1="${y+20}" x2="${x+width}" y2="${y+20}" stroke="#cbd5e1" stroke-width="0.5"/>`);
  const colW = width / 2;
  const entries: { type: string; label: string; color: string }[] = [];
  if (usedTypes.has("main_switch")) entries.push({ type: "QF",   label: "Rozlacznik glowny / MCCB",          color: "#dc2626" });
  if (usedTypes.has("mcb"))         entries.push({ type: "MCB",  label: "Wylacznik nadpradowy",               color: "#2563eb" });
  if (usedTypes.has("rcd"))         entries.push({ type: "RCD",  label: "Wylacznik roznicowopadowy",          color: "#16a34a" });
  if (usedTypes.has("rcbo"))        entries.push({ type: "RCBO", label: "Wylacznik roznicowo-nadpradowy",     color: "#7c3aed" });
  if (usedTypes.has("spd"))         entries.push({ type: "SPD",  label: "Ogranicznik przepiec",               color: "#ea580c" });
  if (usedTypes.has("contactor"))   entries.push({ type: "K",    label: "Stycznik / Przekaznik mocy",         color: "#b45309" });
  if (usedTypes.has("motor_starter")) entries.push({ type: "M",  label: "Rozruch silnika (DOL/VFD/SS)",       color: "#dc2626" });
  if (usedTypes.has("timer"))       entries.push({ type: "T",    label: "Przekaznik czasowy",                 color: "#2563eb" });
  if (usedTypes.has("monitoring"))  entries.push({ type: "PM",   label: "Pomiar / Licznik energii",           color: "#059669" });
  entries.forEach((e, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const ex = x + col * colW + 12, ey = y + 34 + row * 14;
    parts.push(`<rect x="${ex}" y="${ey-8}" width="14" height="10" rx="1.5" fill="white" stroke="${e.color}" stroke-width="1.2"/>`);
    parts.push(`<text x="${ex+7}" y="${ey}" text-anchor="middle" font-size="5.5" fill="${e.color}" font-weight="bold">${e.type}</text>`);
    parts.push(`<text x="${ex+20}" y="${ey}" font-size="7.5" fill="#475569">${e.label}</text>`);
  });
  const wireY = y + 68;
  parts.push(`<line x1="${x}" y1="${wireY-8}" x2="${x+width}" y2="${wireY-8}" stroke="#cbd5e1" stroke-width="0.5"/>`);
  parts.push(`<text x="${x+8}" y="${wireY+2}" font-size="7" font-weight="bold" fill="#1e293b">PRZEWODY:</text>`);
  [
    { label: "L1", color: PHASE_COLORS.L1, dash: "",    xOff: 70  },
    { label: "L2", color: PHASE_COLORS.L2, dash: "",    xOff: 130 },
    { label: "L3", color: PHASE_COLORS.L3, dash: "",    xOff: 190 },
    { label: "N",  color: PHASE_COLORS.N,  dash: "6,3", xOff: 250 },
    { label: "PE", color: PHASE_COLORS.PE, dash: "4,3", xOff: 310 },
  ].forEach(w => {
    const wx = x + w.xOff;
    parts.push(`<line x1="${wx}" y1="${wireY}" x2="${wx+30}" y2="${wireY}" stroke="${w.color}" stroke-width="2"${w.dash ? ` stroke-dasharray="${w.dash}"` : ""}/>`);
    parts.push(`<text x="${wx+34}" y="${wireY+3}" font-size="7" font-weight="bold" fill="${w.color}">${w.label}</text>`);
  });
  return parts.join("");
}
