// ═══════════════════════════════════════════════════════════════════
// schemat-svg-renderer.ts — Orchestrator
// Assembles the final SVG by delegating to:
//   lib/schemat/geometry-engine  — layout math, device enrichment
//   lib/schemat/draw-symbols     — IEC 60617 symbol renderers
//   lib/schemat/draw-layout      — bus bar, title block, legend
//   lib/schemat/svg-helpers      — SVG string utilities
// External consumers (panel-schemat-tab.tsx, DXF/PDF export) import
// from THIS file only — public API is unchanged.
// ═══════════════════════════════════════════════════════════════════

import type { SchematConfig, PageResult } from "./schemat-svg-types";
import { computeBusBarY, DEVICE_ANCHORS } from "./schemat-svg-types";
import { MARGIN, COL_W, MIN_PAGE_W, computeDeviceLevels, classifyDevices, enrichSection } from "./schemat/geometry-engine";
import { renderDeviceSymbol } from "./schemat/draw-symbols";
import { drawBusBar, drawBusDots, drawBusConnection, drawTitleBlock, drawLegend } from "./schemat/draw-layout";
import { combinePagesToSvg } from "./schemat/svg-helpers";
import { PHASE_COLORS, esc } from "./schemat-svg-types";
import { suggestCable } from "./schemat-svg-types";

// ── Re-export public API (backwards-compatible) ──────────────────────────────
export type { SchematDevice, SchematSection, SchematConfig, PageResult } from "./schemat-svg-types";
export { suggestCable, combinePagesToSvg };

// ── Main Page Renderer ───────────────────────────────────────────────────────

export function renderSchematPages(config: SchematConfig): PageResult[] {
  const allPages: PageResult[] = [];
  const dateStr = new Date().toLocaleDateString("pl-PL");
  const totalSections = config.sections.length;

  // Pre-process: apply engineering logic (auto-cable, circuit numbers, phase balance)
  for (const sec of config.sections) {
    enrichSection(sec);
  }

  for (let si = 0; si < totalSections; si++) {
    const sec = config.sections[si];
    const parts: string[] = [];

    // ── Classify devices into typed groups ───────────────────────────────────
    const { mainSwitches, spds, rcdGroups, directDevices, usedTypes } = classifyDevices(sec);

    // ── Calculate page dimensions ─────────────────────────────────────────────
    const topCount = mainSwitches.length + spds.length;
    const rcdChildrenCount = rcdGroups.reduce((s, g) => s + Math.max(g.children.length, 1), 0);
    const gapCount = rcdGroups.length;
    const directCount = directDevices.length;
    const neededCols = Math.max(topCount, rcdChildrenCount + gapCount + directCount);
    const pageW = Math.max(MIN_PAGE_W, (neededCols + 2) * COL_W + MARGIN * 2);
    const pageH = 960;
    const innerW = pageW - MARGIN * 2;

    // ── Page frame ────────────────────────────────────────────────────────────
    parts.push(`<rect width="${pageW}" height="${pageH}" fill="white" stroke="#94a3b8" stroke-width="2"/>`);
    parts.push(`<rect x="${MARGIN - 2}" y="${MARGIN - 2}" width="${innerW + 4}" height="${pageH - MARGIN * 2 + 4}" fill="none" stroke="#1e293b" stroke-width="1.5"/>`);

    // ── Title block + section title ───────────────────────────────────────────
    parts.push(drawTitleBlock(config, sec.name, pageW, si + 1, totalSections, dateStr));
    parts.push(`<text x="${MARGIN + 8}" y="${MARGIN + 18}" font-size="15" font-weight="bold" fill="#0f172a">${esc(sec.name)}</text>`);
    parts.push(`<text x="${MARGIN + 8}" y="${MARGIN + 33}" font-size="9" fill="#64748b">${esc(sec.feedLabel)}</text>`);

    // ── Bus bar ───────────────────────────────────────────────────────────────
    const has3Phase = sec.devices.some((d) => d.poles >= 3);
    const busY = MARGIN + 100;
    const busX1 = MARGIN + 16;
    const busX2 = pageW - MARGIN - 16;
    const supplyText = has3Phase ? "Zasilanie 3NPE" : "Zasilanie 1NPE";
    const supplyDetail = has3Phase ? "400/230V 50Hz TN-S" : "230V 50Hz TN-S";
    parts.push(`<text x="${busX1}" y="${busY - 24}" font-size="10" font-weight="bold" fill="#475569">${supplyText}</text>`);
    parts.push(`<text x="${busX1}" y="${busY - 12}" font-size="8" fill="#64748b">${supplyDetail}</text>`);
    parts.push(drawBusBar(busX1, busX2, busY, has3Phase));
    const geo = computeBusBarY(busY, has3Phase);

    // ── Device Y-levels (anchor-based) ────────────────────────────────────────
    const levels = computeDeviceLevels(geo.busBottom);
    const { devStartY, rcdLevelY, subBusY, mcbLevelY } = levels;
    const RCD_OUT_Y = DEVICE_ANCHORS.rcd.outputY;

    // ── Device placement ──────────────────────────────────────────────────────
    let cx = MARGIN + 50;
    let autoCircuitNum = 1;
    const hasRcds = rcdGroups.length > 0;

    // Main switches
    for (const ms of mainSwitches) {
      const devX = cx + COL_W / 2;
      parts.push(drawBusDots(devX, ms, geo));
      parts.push(drawBusConnection(devX, devStartY, ms, geo));
      parts.push(renderDeviceSymbol(ms, devX, devStartY, autoCircuitNum));
      cx += COL_W;
    }

    // SPDs
    for (const spd of spds) {
      const devX = cx + COL_W / 2;
      parts.push(drawBusDots(devX, spd, geo));
      parts.push(drawBusConnection(devX, devStartY, spd, geo));
      parts.push(renderDeviceSymbol(spd, devX, devStartY, autoCircuitNum));
      cx += COL_W;
    }

    // RCD groups
    for (const group of rcdGroups) {
      const gx = cx;
      const childCount = Math.max(group.children.length, 1);
      const groupW = childCount * COL_W;
      const rcdCX = gx + groupW / 2;

      parts.push(drawBusDots(rcdCX, group.rcd, geo));
      parts.push(drawBusConnection(rcdCX, rcdLevelY, group.rcd, geo));
      parts.push(renderDeviceSymbol(group.rcd, rcdCX, rcdLevelY, autoCircuitNum));

      // PE tap from group area
      const peConnX = gx + groupW + 10;
      const peLineEndY = rcdLevelY + Math.round(RCD_OUT_Y / 2);
      parts.push(`<line x1="${peConnX}" y1="${geo.yPE}" x2="${peConnX}" y2="${peLineEndY}" stroke="${PHASE_COLORS.PE}" stroke-width="1" stroke-dasharray="4,3"/>`);
      parts.push(`<text x="${peConnX + 5}" y="${rcdLevelY}" font-size="6" fill="${PHASE_COLORS.PE}" font-weight="bold">PE</text>`);

      // Sub-bus and children
      if (group.children.length > 1) {
        const fx = gx + COL_W / 2;
        const lx = gx + (group.children.length - 1) * COL_W + COL_W / 2;
        const rcdOutAbs = rcdLevelY + RCD_OUT_Y;
        parts.push(`<line x1="${rcdCX}" y1="${rcdOutAbs}" x2="${rcdCX}" y2="${subBusY}" stroke="#1e293b" stroke-width="2"/>`);
        parts.push(`<line x1="${fx}" y1="${subBusY}" x2="${lx}" y2="${subBusY}" stroke="#1e293b" stroke-width="2.5"/>`);
        parts.push(`<line x1="${fx}" y1="${subBusY + 6}" x2="${lx}" y2="${subBusY + 6}" stroke="${PHASE_COLORS.N}" stroke-width="1" stroke-dasharray="3,3"/>`);
      } else if (group.children.length === 1) {
        const rcdOutAbs = rcdLevelY + RCD_OUT_Y;
        parts.push(`<line x1="${rcdCX}" y1="${rcdOutAbs}" x2="${rcdCX}" y2="${mcbLevelY}" stroke="#1e293b" stroke-width="2"/>`);
      }

      // Child MCBs under RCD
      const PHASE_CYCLE: Array<"L1" | "L2" | "L3"> = ["L1", "L2", "L3"];
      const phaseColorArr = [PHASE_COLORS.L1, PHASE_COLORS.L2, PHASE_COLORS.L3];
      group.children.forEach((child, ci) => {
        const mx = gx + ci * COL_W + COL_W / 2;
        const assignedPhase = child.phase || (geo.has3Phase ? PHASE_CYCLE[ci % 3] : "L1");
        const pi = assignedPhase === "L2" ? 1 : assignedPhase === "L3" ? 2 : 0;
        const lineColor = phaseColorArr[pi];
        if (group.children.length > 1) {
          parts.push(`<line x1="${mx}" y1="${subBusY}" x2="${mx}" y2="${mcbLevelY}" stroke="${lineColor}" stroke-width="1.8"/>`);
        }
        if (geo.has3Phase) {
          const lblY = subBusY - 10;
          parts.push(`<rect x="${mx - 12}" y="${lblY - 9}" width="24" height="13" rx="3" fill="${lineColor}" opacity="0.15"/>`);
          parts.push(`<text x="${mx}" y="${lblY}" text-anchor="middle" font-size="9" font-weight="bold" fill="${lineColor}">${assignedPhase}</text>`);
        }
        parts.push(renderDeviceSymbol(child, mx, mcbLevelY, autoCircuitNum));
        autoCircuitNum++;
      });

      cx += groupW + 35;
    }

    // Direct devices (RCBOs, contactors, timers, monitors, motor starters, unassigned MCBs)
    const directY = hasRcds ? mcbLevelY : devStartY;
    for (const dev of directDevices) {
      const devX = cx + COL_W / 2;
      parts.push(drawBusDots(devX, dev, geo));
      parts.push(drawBusConnection(devX, directY, dev, geo));
      parts.push(renderDeviceSymbol(dev, devX, directY, autoCircuitNum));
      autoCircuitNum++;
      cx += COL_W;
    }

    // ── Legend ────────────────────────────────────────────────────────────────
    const legendY = pageH - MARGIN - 96;
    parts.push(drawLegend(MARGIN, legendY, innerW, usedTypes));

    // ── Footer ────────────────────────────────────────────────────────────────
    const footY = pageH - MARGIN + 2;
    parts.push(`<text x="${MARGIN + 4}" y="${footY + 12}" font-size="7" fill="#94a3b8">ElektroSmart PRO \u00b7 ${esc(config.panelName || "Rozdzielnica")} \u00b7 ${esc(sec.name)} \u00b7 ${dateStr}</text>`);

    allPages.push({ svg: parts.join(""), w: pageW, h: pageH });
  }

  return allPages;
}
