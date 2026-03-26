import type { RailModule, PanelSection, Manufacturer } from "@/components/project/panel-configurator-types";
import { getModuleAbbr } from "@/components/project/panel-configurator-helpers";

export const MOD_W = 54;
export const ROW_H = 150;
export const MOD_H = 100;
const MOD_GAP = 1;
const LABEL_H = 16;

export function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function getCatColor(cat: string): string {
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

function getPhaseColorSvg(phase: string): string {
  switch (phase) {
    case "L1": return "#92400e";
    case "L2": return "#1e293b";
    case "L3": return "#6b7280";
    default: return "#3b82f6";
  }
}

function is3Pole(mod: RailModule): boolean {
  return (
    mod.module.modules >= 3 &&
    (mod.module.id.includes("-3p") || mod.module.id.includes("-4p") ||
      mod.module.id.includes("3p") ||
      (mod.module.category === "rcd" && mod.module.modules >= 4))
  );
}

export function getModWidth(mod: RailModule): number {
  if (mod.isZugBlock && mod.terminalCount) return Math.ceil(mod.terminalCount / 3);
  return Math.max(1, mod.module.modules);
}

export interface SectionLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  parts: string[];
}

export function renderSection(sec: PanelSection, selectedManufacturer: Manufacturer): SectionLayout {
  const encRows = sec.enclosure.rows;
  const modsPerRow = Math.round(sec.enclosure.modules / encRows);
  const secParts: string[] = [];
  const rows: RailModule[][] = [];
  let currentRow: RailModule[] = [];
  let currentRowMods = 0;

  for (const mod of sec.modules) {
    const modWidth = getModWidth(mod);
    if (currentRowMods + modWidth > modsPerRow && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowMods = 0;
    }
    currentRow.push(mod);
    currentRowMods += modWidth;
  }
  if (currentRow.length > 0) rows.push(currentRow);
  while (rows.length < encRows) rows.push([]);

  const PAD = 10;
  const sectionW = modsPerRow * MOD_W + PAD * 2 + 10;
  const sectionH = rows.length * ROW_H + 80;
  const mfr = escXml(`${selectedManufacturer.name} (${selectedManufacturer.country || ""})`);

  secParts.push(`<rect x="0" y="0" width="${sectionW}" height="36" rx="6" fill="#1e293b"/>`);
  secParts.push(`<circle cx="12" cy="18" r="4" fill="#22c55e"/>`);
  secParts.push(`<text x="22" y="22" font-size="11" font-weight="bold" fill="white">${escXml(sec.enclosure.name.toUpperCase())}</text>`);
  secParts.push(`<rect x="${sectionW - 140}" y="8" width="130" height="20" rx="4" fill="rgba(255,255,255,0.1)"/>`);
  secParts.push(`<text x="${sectionW - 75}" y="22" text-anchor="middle" font-size="8" fill="#94a3b8">${mfr}</text>`);
  secParts.push(`<text x="${sectionW - 10}" y="22" text-anchor="end" font-size="8" fill="#64748b">${encRows} rzędów × ${modsPerRow} mod.</text>`);
  secParts.push(`<rect x="0" y="36" width="${sectionW}" height="${sectionH - 36}" rx="0 0 6 6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>`);

  rows.forEach((rowMods, rowIdx) => {
    const usedSlots = rowMods.reduce((s, m) => s + getModWidth(m), 0);
    const rowY = 48 + rowIdx * ROW_H;
    secParts.push(`<text x="${PAD}" y="${rowY + 10}" font-size="9" fill="#64748b" font-weight="600">Rząd ${rowIdx + 1} — ${usedSlots}/${modsPerRow} mod.</text>`);

    const railBgY = rowY + 16;
    secParts.push(`<rect x="${PAD}" y="${railBgY}" width="${sectionW - PAD * 2}" height="${MOD_H + 20}" rx="6" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="0.5"/>`);

    const railCenterY = railBgY + (MOD_H + 20) / 2;
    secParts.push(`<rect x="${PAD + 4}" y="${railCenterY - 3}" width="${sectionW - PAD * 2 - 8}" height="6" rx="1" fill="#cbd5e1"/>`);
    for (let dx = PAD + 12; dx < sectionW - PAD - 8; dx += 14) {
      secParts.push(`<circle cx="${dx}" cy="${railCenterY}" r="2.5" fill="#22c55e" opacity="0.6"/>`);
    }

    let modX = PAD + 4;
    const modY = railBgY + 6;

    rowMods.forEach((mod) => {
      const modWidth = getModWidth(mod);
      const w = modWidth * MOD_W - MOD_GAP;
      const h = MOD_H;
      const isZug = mod.isZugBlock || mod.module.category === "terminal";
      const color = isZug ? "#94a3b8" : getCatColor(mod.module.category);
      const cx = modX + w / 2;
      const shortName = getModuleAbbr(mod.module.id, mod.module.name);

      secParts.push(`<rect x="${modX}" y="${modY}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>`);

      if (isZug) {
        secParts.push(`<text x="${cx}" y="${modY + 26}" text-anchor="middle" font-size="8" font-weight="bold" fill="#334155">${w > 80 ? "ZŁĄCZKI" : "ZUG"}</text>`);
        const badgeW = Math.min(w - 6, 60);
        secParts.push(`<rect x="${cx - badgeW / 2}" y="${modY + 32}" width="${badgeW}" height="16" rx="3" fill="white"/>`);
        secParts.push(`<text x="${cx}" y="${modY + 44}" text-anchor="middle" font-size="9" font-weight="bold" fill="#1e293b">${mod.terminalCount || 15} szt.</text>`);
        const stripeW = w * 0.7;
        const stripeX = cx - stripeW / 2;
        const stripeY = modY + 56;
        const seg = stripeW / 3;
        secParts.push(`<rect x="${stripeX}" y="${stripeY}" width="${seg}" height="6" fill="#92400e" rx="1"/>`);
        secParts.push(`<rect x="${stripeX + seg}" y="${stripeY}" width="${seg}" height="6" fill="#2563eb"/>`);
        secParts.push(`<rect x="${stripeX + seg * 2}" y="${stripeY}" width="${seg}" height="6" fill="#22c55e" rx="1"/>`);
      } else {
        const _3p = is3Pole(mod);
        secParts.push(`<circle cx="${cx}" cy="${modY + 14}" r="6" fill="rgba(255,255,255,0.15)"/>`);
        secParts.push(`<rect x="${cx - 3}" y="${modY + 11}" width="6" height="6" rx="1" fill="rgba(255,255,255,0.6)"/>`);
        if (_3p) {
          secParts.push(`<text x="${cx + 10}" y="${modY + 17}" font-size="6" font-weight="bold" fill="rgba(255,255,255,0.7)">3P</text>`);
        }

        if (_3p) {
          const barW2 = w - 6;
          const barX2 = modX + 3;
          const seg = barW2 / 3;
          secParts.push(`<rect x="${barX2}" y="${modY + 22}" width="${seg}" height="3" fill="#92400e" rx="0.5"/>`);
          secParts.push(`<rect x="${barX2 + seg}" y="${modY + 22}" width="${seg}" height="3" fill="#1e293b"/>`);
          secParts.push(`<rect x="${barX2 + seg * 2}" y="${modY + 22}" width="${seg}" height="3" fill="#6b7280" rx="0.5"/>`);
        } else if (mod.phase) {
          secParts.push(`<rect x="${modX + 3}" y="${modY + 22}" width="${w - 6}" height="3" rx="1" fill="${getPhaseColorSvg(mod.phase)}"/>`);
        }

        const ratingStr = mod.rating ? String(mod.rating) : "";
        const displayText = ratingStr ? `${shortName}${ratingStr}` : shortName;

        if (w >= 100) {
          secParts.push(`<text x="${cx}" y="${modY + 46}" text-anchor="middle" font-size="15" font-weight="bold" fill="white">${escXml(shortName)}${ratingStr}</text>`);
          secParts.push(`<text x="${cx}" y="${modY + 60}" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.6)">${escXml(shortName)}</text>`);
        } else if (w >= 60) {
          secParts.push(`<text x="${cx}" y="${modY + 50}" text-anchor="middle" font-size="13" font-weight="bold" fill="white">${escXml(displayText)}</text>`);
        } else if (ratingStr) {
          secParts.push(`<text x="${cx}" y="${modY + 40}" text-anchor="middle" font-size="9" font-weight="bold" fill="rgba(255,255,255,0.8)">${escXml(shortName)}</text>`);
          secParts.push(`<text x="${cx}" y="${modY + 56}" text-anchor="middle" font-size="13" font-weight="bold" fill="white">${ratingStr}</text>`);
        } else {
          secParts.push(`<text x="${cx}" y="${modY + 50}" text-anchor="middle" font-size="10" font-weight="bold" fill="white">${escXml(displayText)}</text>`);
        }

        const lblY = modY + h - LABEL_H - 2;
        const lblW = w - 4;
        secParts.push(`<rect x="${modX + 2}" y="${lblY}" width="${lblW}" height="${LABEL_H}" rx="2" fill="white" opacity="0.95"/>`);
        const label = mod.label || (mod.circuitNumber ? `Obw.${mod.circuitNumber}` : "");
        if (label) {
          const maxLen = Math.max(Math.floor(lblW / 5), 4);
          const truncLabel = label.length > maxLen ? label.substring(0, maxLen - 1) + "…" : label;
          const lblColor = mod.label ? "#475569" : "#2563eb";
          secParts.push(`<text x="${cx}" y="${lblY + 12}" text-anchor="middle" font-size="8" font-weight="${mod.circuitNumber && !mod.label ? "bold" : "500"}" fill="${lblColor}">${escXml(truncLabel)}</text>`);
        } else {
          secParts.push(`<text x="${cx}" y="${lblY + 12}" text-anchor="middle" font-size="8" fill="#cbd5e1">—</text>`);
        }
      }

      modX += w + MOD_GAP;
    });

    // Empty slots
    const usedMods = rowMods.reduce((sum, m) => sum + getModWidth(m), 0);
    const emptyMods = modsPerRow - usedMods;
    for (let ei = 0; ei < emptyMods; ei++) {
      const ew = MOD_W - MOD_GAP;
      secParts.push(`<rect x="${modX}" y="${modY}" width="${ew}" height="${MOD_H}" rx="3" fill="none" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="4,3"/>`);
      modX += MOD_W;
    }
  });

  const totalMods = sec.modules.reduce((s, m) => s + getModWidth(m), 0);
  const pct = Math.round((totalMods / sec.enclosure.modules) * 100);
  secParts.push(`<text x="${sectionW / 2}" y="${sectionH + 18}" text-anchor="middle" font-size="10" fill="#64748b" font-weight="bold">${totalMods}/${sec.enclosure.modules} mod. (${pct}%)</text>`);

  return { x: 0, y: 0, w: sectionW, h: sectionH + 24, parts: secParts };
}
