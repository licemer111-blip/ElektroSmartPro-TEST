// ═══════════════════════════════════════════════════════════════════
// Schemat Draw Symbols — IEC 60617 Symbol Renderers
// Each function returns an SVG string fragment.
// ═══════════════════════════════════════════════════════════════════
import type { SchematDevice } from "../schemat-svg-types";
import { PHASE_COLORS, BUS_SPACING, PHASE_COLOR_ARR } from "../schemat-svg-types";
import { esc, truncate } from "../schemat-svg-types";

// ── Circuit Info Table (3-row label block below each circuit device) ──
export function drawCircuitInfoTable(x: number, y: number, nr: string, cable: string, opis: string, poles: number): string {
  let cableDisplay = cable;
  if (poles >= 3 && cable) cableDisplay = cable.replace(/\b3x/g, "5x");
  const cellW = 92, x0 = x - cellW / 2, ROW_H = 13, MAX_CHARS = 13;
  let opisLine1 = "", opisLine2 = "";
  if (opis.length <= MAX_CHARS) { opisLine1 = opis; }
  else { const b = opis.lastIndexOf(" ", MAX_CHARS); if (b > 2) { opisLine1 = opis.substring(0, b); opisLine2 = truncate(opis.substring(b + 1).trim(), MAX_CHARS); } else { opisLine1 = truncate(opis, MAX_CHARS); } }
  const opisH = opisLine2 ? ROW_H * 2 : ROW_H, totalH = ROW_H + opisH + ROW_H + 2;
  const p: string[] = [];
  p.push(`<rect x="${x0}" y="${y}" width="${cellW}" height="${totalH}" rx="2" fill="white" stroke="#94a3b8" stroke-width="0.8"/>`);
  p.push(`<rect x="${x0}" y="${y}" width="${cellW}" height="${ROW_H}" rx="2" fill="#eff6ff" stroke="none"/>`);
  p.push(`<line x1="${x0}" y1="${y + ROW_H}" x2="${x0 + cellW}" y2="${y + ROW_H}" stroke="#cbd5e1" stroke-width="0.6"/>`);
  p.push(`<text x="${x}" y="${y + ROW_H - 3}" text-anchor="middle" font-size="8" font-weight="bold" fill="#1d4ed8">${esc(nr ? "Nr " + nr : "-")}</text>`);
  const y2 = y + ROW_H;
  p.push(`<rect x="${x0}" y="${y2}" width="${cellW}" height="${opisH}" fill="#f8fafc" stroke="none"/>`);
  p.push(`<line x1="${x0}" y1="${y2 + opisH}" x2="${x0 + cellW}" y2="${y2 + opisH}" stroke="#cbd5e1" stroke-width="0.6"/>`);
  if (opisLine1) { p.push(`<text x="${x}" y="${y2 + 10}" text-anchor="middle" font-size="7.5" fill="#334155">${esc(opisLine1)}</text>`); if (opisLine2) p.push(`<text x="${x}" y="${y2 + 22}" text-anchor="middle" font-size="7.5" fill="#334155">${esc(opisLine2)}</text>`); }
  else p.push(`<text x="${x}" y="${y2 + 10}" text-anchor="middle" font-size="7" fill="#94a3b8" font-style="italic">brak opisu</text>`);
  const y3 = y2 + opisH;
  p.push(`<rect x="${x0}" y="${y3}" width="${cellW}" height="${ROW_H}" fill="#f0fdf4" stroke="none"/>`);
  p.push(`<text x="${x}" y="${y3 + ROW_H - 3}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#16a34a">${esc(cableDisplay || "-")}</text>`);
  return p.join("");
}

function slashMarks(x: number, y: number, color: string, poles: number): string {
  if (poles <= 1) return "";
  let s = `<line x1="${x-6}" y1="${y+8}" x2="${x+2}" y2="${y+2}" stroke="${color}" stroke-width="1.5"/>`;
  if (poles >= 3) s += `<line x1="${x-4}" y1="${y+10}" x2="${x+4}" y2="${y+4}" stroke="${color}" stroke-width="1.5"/>`;
  if (poles >= 4) s += `<line x1="${x-2}" y1="${y+12}" x2="${x+6}" y2="${y+6}" stroke="${color}" stroke-width="1.5"/>`;
  return s;
}

export function drawMcb(x: number, y: number, ratingLabel: string, circuitLabel: string, descLabel: string, cableLabel: string, poles: number): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+18}" stroke="#1e293b" stroke-width="2"/>
    ${slashMarks(x, y, "#2563eb", poles)}
    <circle cx="${x}" cy="${y+22}" r="4" fill="none" stroke="#2563eb" stroke-width="2"/>
    <line x1="${x}" y1="${y+26}" x2="${x+10}" y2="${y+42}" stroke="#2563eb" stroke-width="2.5"/>
    <line x1="${x}" y1="${y+46}" x2="${x}" y2="${y+60}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+62}" r="2.5" fill="#1e293b"/>
    ${poles > 1 ? `<text x="${x+15}" y="${y+38}" font-size="8" font-weight="bold" fill="#2563eb">${poles}P</text>` : ""}
    <text x="${x+18}" y="${y+4}" text-anchor="start" font-size="10" font-weight="bold" fill="#1e293b">${esc(ratingLabel)}</text>
    ${drawCircuitInfoTable(x, y+68, circuitLabel, cableLabel, descLabel, poles)}
  </g>`;
}

export function drawMainSwitch(x: number, y: number, ratingLabel: string, descLabel: string, poles: number): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+18}" stroke="#1e293b" stroke-width="2"/>
    ${slashMarks(x, y, "#dc2626", poles)}
    <circle cx="${x}" cy="${y+22}" r="4.5" fill="none" stroke="#dc2626" stroke-width="2.5"/>
    <line x1="${x}" y1="${y+26}" x2="${x+12}" y2="${y+44}" stroke="#dc2626" stroke-width="3"/>
    <line x1="${x}" y1="${y+48}" x2="${x}" y2="${y+60}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+62}" r="2.5" fill="#1e293b"/>
    ${poles > 1 ? `<text x="${x+16}" y="${y+38}" font-size="8" font-weight="bold" fill="#dc2626">${poles}P</text>` : ""}
    <text x="${x+20}" y="${y+4}" text-anchor="start" font-size="10" font-weight="bold" fill="#dc2626">${esc(ratingLabel)}</text>
    <text x="${x}" y="${y+76}" text-anchor="middle" font-size="9" fill="#dc2626" font-weight="bold">QF</text>
    <text x="${x}" y="${y+88}" text-anchor="middle" font-size="8.5" fill="#1e293b" font-weight="600">${esc(truncate(descLabel, 18))}</text>
  </g>`;
}

export function drawRcd(x: number, y: number, ratingLabel: string, sensitivity: string, poles: number, rcdType: string): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+10}" stroke="#1e293b" stroke-width="2"/>
    <rect x="${x-18}" y="${y+10}" width="36" height="38" rx="3" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text x="${x}" y="${y+25}" text-anchor="middle" font-size="8" fill="#16a34a" font-weight="bold">IDn</text>
    <text x="${x}" y="${y+36}" text-anchor="middle" font-size="7.5" fill="#16a34a" font-weight="bold">${esc(rcdType)}</text>
    <text x="${x}" y="${y+45}" text-anchor="middle" font-size="6.5" fill="#16a34a">${esc(sensitivity)}</text>
    <line x1="${x}" y1="${y+48}" x2="${x}" y2="${y+60}" stroke="#1e293b" stroke-width="2"/>
    ${poles > 1 ? `<text x="${x-22}" y="${y+30}" font-size="7" fill="#16a34a" font-weight="bold">${poles}P</text>` : ""}
    <text x="${x+22}" y="${y+4}" text-anchor="start" font-size="10" font-weight="bold" fill="#16a34a">${esc(ratingLabel)}</text>
  </g>`;
}

export function drawRcbo(x: number, y: number, ratingLabel: string, circuitLabel: string, descLabel: string, cableLabel: string, poles: number): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+14}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+18}" r="3.5" fill="none" stroke="#7c3aed" stroke-width="2"/>
    <line x1="${x}" y1="${y+21}" x2="${x+8}" y2="${y+33}" stroke="#7c3aed" stroke-width="2"/>
    <rect x="${x-14}" y="${y+36}" width="28" height="20" rx="2" fill="#faf5ff" stroke="#7c3aed" stroke-width="1.5"/>
    <text x="${x}" y="${y+50}" text-anchor="middle" font-size="7" fill="#7c3aed" font-weight="bold">IDn</text>
    <line x1="${x}" y1="${y+56}" x2="${x}" y2="${y+68}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+70}" r="2.5" fill="#1e293b"/>
    ${poles > 1 ? `<text x="${x+16}" y="${y+48}" font-size="7" font-weight="bold" fill="#7c3aed">${poles}P</text>` : ""}
    <text x="${x+18}" y="${y+4}" text-anchor="start" font-size="10" font-weight="bold" fill="#7c3aed">${esc(ratingLabel)}</text>
    ${drawCircuitInfoTable(x, y+76, circuitLabel, cableLabel, descLabel, poles)}
  </g>`;
}

export function drawSpd(x: number, y: number, label: string): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+14}" stroke="#1e293b" stroke-width="2"/>
    <rect x="${x-15}" y="${y+14}" width="30" height="30" rx="2" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
    <line x1="${x-6}" y1="${y+29}" x2="${x+6}" y2="${y+29}" stroke="#ea580c" stroke-width="2"/>
    <line x1="${x}" y1="${y+22}" x2="${x}" y2="${y+36}" stroke="#ea580c" stroke-width="2"/>
    <line x1="${x}" y1="${y+44}" x2="${x}" y2="${y+56}" stroke="#1e293b" stroke-width="2"/>
    <line x1="${x-8}" y1="${y+56}" x2="${x+8}" y2="${y+56}" stroke="${PHASE_COLORS.PE}" stroke-width="2.5"/>
    <line x1="${x-5}" y1="${y+60}" x2="${x+5}" y2="${y+60}" stroke="${PHASE_COLORS.PE}" stroke-width="2"/>
    <line x1="${x-2}" y1="${y+64}" x2="${x+2}" y2="${y+64}" stroke="${PHASE_COLORS.PE}" stroke-width="1.5"/>
    <text x="${x}" y="${y+78}" text-anchor="middle" font-size="9" font-weight="bold" fill="#ea580c">${esc(label)}</text>
  </g>`;
}

export function drawContactor(x: number, y: number, ratingLabel: string, circuitLabel: string, descLabel: string, cableLabel: string, poles: number): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+16}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+20}" r="4" fill="none" stroke="#b45309" stroke-width="2"/>
    <line x1="${x}" y1="${y+24}" x2="${x+8}" y2="${y+36}" stroke="#b45309" stroke-width="2"/>
    <rect x="${x-12}" y="${y+40}" width="24" height="16" rx="2" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
    <text x="${x}" y="${y+52}" text-anchor="middle" font-size="7" fill="#b45309" font-weight="bold">K</text>
    <line x1="${x}" y1="${y+56}" x2="${x}" y2="${y+68}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+70}" r="2.5" fill="#1e293b"/>
    ${poles > 1 ? `<text x="${x+15}" y="${y+32}" font-size="7" font-weight="bold" fill="#b45309">${poles}P</text>` : ""}
    <text x="${x}" y="${y-6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#b45309">${esc(ratingLabel)}</text>
    ${drawCircuitInfoTable(x, y+76, circuitLabel, cableLabel, descLabel, poles)}
  </g>`;
}

export function drawMotorStarter(x: number, y: number, typeLabel: string, ratingLabel: string, descLabel: string, cableLabel: string): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+14}" stroke="#1e293b" stroke-width="2"/>
    <rect x="${x-16}" y="${y+14}" width="32" height="34" rx="3" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
    <circle cx="${x}" cy="${y+31}" r="9" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text x="${x}" y="${y+35}" text-anchor="middle" font-size="9" fill="#dc2626" font-weight="bold">M</text>
    <text x="${x}" y="${y+46}" text-anchor="middle" font-size="5.5" fill="#dc2626" font-weight="bold">${esc(typeLabel)}</text>
    <line x1="${x}" y1="${y+48}" x2="${x}" y2="${y+62}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+64}" r="2.5" fill="#1e293b"/>
    <text x="${x}" y="${y-6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">${esc(ratingLabel)}</text>
    ${drawCircuitInfoTable(x, y+70, typeLabel + " " + ratingLabel, cableLabel, descLabel, 3)}
  </g>`;
}

export function drawTimer(x: number, y: number, ratingLabel: string, circuitLabel: string, descLabel: string): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+14}" stroke="#1e293b" stroke-width="2"/>
    <rect x="${x-14}" y="${y+14}" width="28" height="28" rx="3" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text x="${x}" y="${y+32}" text-anchor="middle" font-size="11" fill="#2563eb" font-weight="bold">T</text>
    <line x1="${x}" y1="${y+42}" x2="${x}" y2="${y+56}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+58}" r="2.5" fill="#1e293b"/>
    <text x="${x}" y="${y-6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">${esc(ratingLabel)}</text>
    ${drawCircuitInfoTable(x, y+64, circuitLabel, "", descLabel, 1)}
  </g>`;
}

export function drawMonitoring(x: number, y: number, typeLabel: string, ratingLabel: string, descLabel: string, poles: number): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y+14}" stroke="#1e293b" stroke-width="2"/>
    <rect x="${x-14}" y="${y+14}" width="28" height="28" rx="3" fill="#f0fdf4" stroke="#059669" stroke-width="2"/>
    <text x="${x}" y="${y+32}" text-anchor="middle" font-size="8" fill="#059669" font-weight="bold">${esc(typeLabel)}</text>
    <line x1="${x}" y1="${y+42}" x2="${x}" y2="${y+56}" stroke="#1e293b" stroke-width="2"/>
    <circle cx="${x}" cy="${y+58}" r="2.5" fill="#1e293b"/>
    ${poles > 1 ? `<text x="${x+16}" y="${y+30}" font-size="7" font-weight="bold" fill="#059669">${poles}P</text>` : ""}
    <text x="${x}" y="${y-6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#059669">${esc(ratingLabel)}</text>
    <text x="${x}" y="${y+72}" text-anchor="middle" font-size="8.5" fill="#1e293b" font-weight="600">${esc(truncate(descLabel, 18))}</text>
  </g>`;
}

export function renderDeviceSymbol(dev: SchematDevice, x: number, y: number, autoCircuit: number): string {
  const r = dev.rating || 0;
  const lbl = dev.label || dev.name || "";
  const circuit = dev.circuitNumber || String(autoCircuit);
  switch (dev.type) {
    case "main_switch": return drawMainSwitch(x, y, `QF ${r}A`, lbl || "Glowny", dev.poles);
    case "spd":         return drawSpd(x, y, dev.spdLabel || "SPD");
    case "rcd":         return drawRcd(x, y, `RCD ${r}A`, dev.rcdSensitivity || "30mA", dev.poles, dev.rcdType || "AC");
    case "rcbo":        return drawRcbo(x, y, `RCBO ${r}A`, `Obw.${circuit}`, lbl, dev.cableType || "", dev.poles);
    case "contactor":   return drawContactor(x, y, `K ${r}A`, `Obw.${circuit}`, lbl, dev.cableType || "", dev.poles);
    case "motor_starter": {
      const ms = dev.moduleId.includes("vfd") ? "VFD" : dev.moduleId.includes("soft") ? "SS" : dev.moduleId.includes("star") ? "Y/D" : "DOL";
      return drawMotorStarter(x, y, ms, `${r}A`, lbl, dev.cableType || "");
    }
    case "timer":       return drawTimer(x, y, `T ${r}A`, `Obw.${circuit}`, lbl);
    case "monitoring": {
      const mn = dev.moduleId.includes("energy") || dev.moduleId.includes("kwh") ? "kWh" : dev.moduleId.includes("multi") ? "MF" : "PM";
      return drawMonitoring(x, y, mn, `${r}A`, lbl, dev.poles);
    }
    default: return drawMcb(x, y, `MCB ${r}A`, `Obw.${circuit}`, lbl, dev.cableType || "", dev.poles);
  }
}
