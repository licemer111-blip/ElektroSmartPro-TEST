import type { PanelSection, Manufacturer } from "@/components/project/panel-configurator-types";
import type { DinModule } from "@/components/project/panel-configurator-types";
import { getItemUnit } from "@/components/project/panel-configurator-helpers";
import { renderSection, escXml, getModWidth, type SectionLayout } from "./panel-svg-generator-section";

const MARGIN = 50;
const HEADER_H = 100;
const FOOTER_H = 30;
const SEC_GAP = 60;
const CONTENT_GAP = 40;
const MAX_CONTENT_W = 1200;

const CAT_LABELS: Record<string, string> = {
  breaker: "Zabezpieczenia nadprądowe", rcd: "Ochrona różnicowa", rcbo: "RCBO",
  switch: "Rozłączniki / SZR", spd: "Ochrona przepięciowa", contactor: "Styczniki / Przekaźniki",
  motor_control: "Napędy / Rozruch", timer: "Sterowanie / Programatory", monitoring: "Pomiar / Monitoring",
  automation: "Automatyka / KNX / BMS", compensation: "Kompensacja mocy biernej",
  terminal: "Złączki / Końcówki", enclosure: "Obudowy / Akcesoria",
  wiring: "Przewody / Okablowanie", consumable: "Materiały montażowe", labor: "Robocizna / Usługi",
};

interface SpecRow {
  name: string;
  category: string;
  rating?: number;
  count: number;
  unit: string;
  isAccessory: boolean;
}

export interface SvgGeneratorProfile {
  companyName?: string | null;
  fullName?: string | null;
  nip?: string | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface GeneratePanelSvgParams {
  sections: PanelSection[];
  panelName: string;
  selectedManufacturer: Manufacturer;
  isPro: boolean;
  profile: SvgGeneratorProfile | null;
}

function layoutSections(sectionLayouts: SectionLayout[]): { contentH: number; contentW: number } {
  let layoutX = 0;
  let layoutY = 0;
  let rowMaxH = 0;
  let maxRowW = 0;

  for (const sl of sectionLayouts) {
    if (layoutX + sl.w > MAX_CONTENT_W && layoutX > 0) {
      layoutY += rowMaxH + SEC_GAP;
      layoutX = 0;
      rowMaxH = 0;
    }
    sl.x = layoutX;
    sl.y = layoutY;
    layoutX += sl.w + SEC_GAP;
    if (sl.h > rowMaxH) rowMaxH = sl.h;
    if (layoutX - SEC_GAP > maxRowW) maxRowW = layoutX - SEC_GAP;
  }
  return { contentH: layoutY + rowMaxH, contentW: maxRowW };
}

function buildSpecRows(sections: PanelSection[]): SpecRow[] {
  const allSpecRows: SpecRow[] = [];

  const devMap = new Map<string, SpecRow>();
  for (const sec of sections) {
    for (const m of sec.modules) {
      if (m.isZugBlock) continue;
      const key = `${m.module.id}-${m.rating || 0}`;
      const ex = devMap.get(key);
      if (ex) ex.count++;
      else devMap.set(key, { name: m.module.namePl, category: m.module.category, rating: m.rating, count: 1, unit: "szt.", isAccessory: false });
    }
  }
  allSpecRows.push(...devMap.values());

  const accMap = new Map<string, SpecRow>();
  for (const zug of sections.flatMap((s) => s.modules.filter((m) => m.isZugBlock))) {
    const qty = zug.terminalCount || 15;
    const key = `zug-${zug.module.id}`;
    const ex = accMap.get(key);
    if (ex) ex.count += qty;
    else accMap.set(key, { name: zug.module.namePl, category: zug.module.category, count: qty, unit: "szt.", isAccessory: true });
  }
  for (const m of sections.flatMap((s) => s.accessories)) {
    const qty = m.quantity || 1;
    const unit = getItemUnit(m.module as DinModule);
    const key = m.module.id;
    const ex = accMap.get(key);
    if (ex) ex.count += qty;
    else accMap.set(key, { name: m.module.namePl, category: m.module.category, count: qty, unit, isAccessory: true });
  }
  allSpecRows.push(...accMap.values());

  return allSpecRows;
}

function renderHeader(
  parts: string[],
  totalW: number,
  panelName: string,
  sections: PanelSection[],
  totalDevices: number,
  totalModsAll: number,
  dateStr: string,
  companyName: string,
  profile: SvgGeneratorProfile | null,
  isPro: boolean
): void {
  const hx1 = MARGIN;
  const hx2 = totalW - MARGIN;
  const hdrW = hx2 - hx1;
  const midDivX = hx1 + hdrW * 0.6;
  const rx1 = midDivX + 10;
  const rx2 = hx2 - 10;

  parts.push(`<rect x="${hx1}" y="${MARGIN}" width="${hdrW}" height="${HEADER_H}" fill="none" stroke="#1e293b" stroke-width="1.5"/>`);
  parts.push(`<line x1="${midDivX}" y1="${MARGIN}" x2="${midDivX}" y2="${MARGIN + HEADER_H}" stroke="#1e293b" stroke-width="0.5"/>`);
  parts.push(`<line x1="${hx1}" y1="${MARGIN + 36}" x2="${midDivX}" y2="${MARGIN + 36}" stroke="#cbd5e1" stroke-width="0.5"/>`);
  parts.push(`<text x="${hx1 + 10}" y="${MARGIN + 24}" font-size="16" font-weight="bold" fill="#0f172a">SCHEMAT ROZDZIELNICY</text>`);
  parts.push(`<text x="${hx1 + 10}" y="${MARGIN + 52}" font-size="11" fill="#475569">${escXml(panelName)}</text>`);
  parts.push(`<text x="${hx1 + 10}" y="${MARGIN + 68}" font-size="8.5" fill="#94a3b8">${sections.length} ${sections.length === 1 ? "sekcja" : "sekcji"} · ${totalDevices} urz. · ${totalModsAll} mod.</text>`);
  parts.push(`<text x="${hx1 + 10}" y="${MARGIN + 82}" font-size="8" fill="#94a3b8">${escXml(dateStr)}</text>`);
  parts.push(`<line x1="${midDivX}" y1="${MARGIN + 36}" x2="${hx2}" y2="${MARGIN + 36}" stroke="#cbd5e1" stroke-width="0.5"/>`);
  parts.push(`<line x1="${midDivX}" y1="${MARGIN + 60}" x2="${hx2}" y2="${MARGIN + 60}" stroke="#cbd5e1" stroke-width="0.5"/>`);

  if (companyName) parts.push(`<text x="${rx1}" y="${MARGIN + 24}" font-size="12" font-weight="bold" fill="#0f172a">${companyName}</text>`);
  if (profile?.nip) parts.push(`<text x="${rx2}" y="${MARGIN + 24}" text-anchor="end" font-size="8.5" fill="#64748b">NIP: ${escXml(profile.nip)}</text>`);
  const svgAddr = [
    profile?.street,
    profile?.postal_code && profile?.city ? `${profile.postal_code} ${profile.city}` : (profile?.city || profile?.postal_code),
  ].filter(Boolean).join(", ") || profile?.address || "";
  if (svgAddr) parts.push(`<text x="${rx1}" y="${MARGIN + 50}" font-size="8.5" fill="#64748b">${escXml(svgAddr)}</text>`);
  if (profile?.phone) parts.push(`<text x="${rx1}" y="${MARGIN + 74}" font-size="8.5" fill="#64748b">Tel: ${escXml(profile.phone)}</text>`);
  if (profile?.email) parts.push(`<text x="${rx2}" y="${MARGIN + 74}" text-anchor="end" font-size="8.5" fill="#64748b">${escXml(profile.email)}</text>`);
  parts.push(`<text x="${rx1}" y="${MARGIN + 92}" font-size="7.5" fill="#94a3b8">Norma: PN-EN 61439-1/2</text>`);
  parts.push(`<text x="${rx2}" y="${MARGIN + 92}" text-anchor="end" font-size="7.5" fill="#94a3b8">ElektroSmart PRO</text>`);
  if (!isPro) parts.push(`<text x="${rx2}" y="${MARGIN + 50}" text-anchor="end" font-size="9" fill="#dc2626" font-weight="bold">WERSJA DEMO</text>`);
}

function renderSpecTable(
  parts: string[],
  allSpecRows: SpecRow[],
  panelName: string,
  totalW: number,
  specStartY: number
): { specTableW: number; tableBottomY: number } {
  const TABLE_PAD = 20;
  const ROW_HEIGHT = 24;
  const COL_LP = 30;
  const COL_NAME = 260;
  const COL_CAT = 150;
  const COL_RATING = 50;
  const COL_QTY = 44;
  const COL_UNIT = 50;
  const TABLE_W = COL_LP + COL_NAME + COL_CAT + COL_RATING + COL_QTY + COL_UNIT;
  const specTableW = Math.max(TABLE_W + MARGIN * 2 + TABLE_PAD * 2, totalW);
  const tblX = MARGIN + TABLE_PAD;

  parts.push(`<rect x="${tblX}" y="${specStartY}" width="${TABLE_W}" height="28" fill="#1e293b"/>`);
  parts.push(`<text x="${tblX + 10}" y="${specStartY + 18}" font-size="11" font-weight="bold" fill="white">SPECYFIKACJA</text>`);
  parts.push(`<text x="${tblX + TABLE_W - 10}" y="${specStartY + 18}" text-anchor="end" font-size="8" fill="#94a3b8">${allSpecRows.length} pozycji · ${escXml(panelName)}</text>`);

  const hdrY = specStartY + 28;
  parts.push(`<rect x="${tblX}" y="${hdrY}" width="${TABLE_W}" height="${ROW_HEIGHT}" fill="#f1f5f9"/>`);
  parts.push(`<line x1="${tblX}" y1="${hdrY + ROW_HEIGHT}" x2="${tblX + TABLE_W}" y2="${hdrY + ROW_HEIGHT}" stroke="#cbd5e1" stroke-width="1"/>`);
  const hdrTextY = hdrY + 16;
  parts.push(`<text x="${tblX + COL_LP / 2}" y="${hdrTextY}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#475569">Lp.</text>`);
  parts.push(`<text x="${tblX + COL_LP + 6}" y="${hdrTextY}" font-size="7.5" font-weight="bold" fill="#475569">Nazwa</text>`);
  parts.push(`<text x="${tblX + COL_LP + COL_NAME + 6}" y="${hdrTextY}" font-size="7.5" font-weight="bold" fill="#475569">Kategoria</text>`);
  parts.push(`<text x="${tblX + COL_LP + COL_NAME + COL_CAT + COL_RATING / 2}" y="${hdrTextY}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#475569">Prąd</text>`);
  parts.push(`<text x="${tblX + COL_LP + COL_NAME + COL_CAT + COL_RATING + COL_QTY / 2}" y="${hdrTextY}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#475569">Ilość</text>`);
  parts.push(`<text x="${tblX + COL_LP + COL_NAME + COL_CAT + COL_RATING + COL_QTY + COL_UNIT / 2}" y="${hdrTextY}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#475569">Jedn.</text>`);

  let deviceSectionDone = false;
  allSpecRows.forEach((row, idx) => {
    const ry = hdrY + ROW_HEIGHT + idx * ROW_HEIGHT;
    if (row.isAccessory && !deviceSectionDone) {
      deviceSectionDone = true;
      parts.push(`<rect x="${tblX}" y="${ry}" width="${TABLE_W}" height="1.5" fill="#475569"/>`);
    }
    parts.push(`<rect x="${tblX}" y="${ry}" width="${TABLE_W}" height="${ROW_HEIGHT}" fill="${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}"/>`);
    parts.push(`<line x1="${tblX}" y1="${ry + ROW_HEIGHT}" x2="${tblX + TABLE_W}" y2="${ry + ROW_HEIGHT}" stroke="#e2e8f0" stroke-width="0.5"/>`);
    const rowTextY = ry + 16;
    parts.push(`<text x="${tblX + COL_LP / 2}" y="${rowTextY}" text-anchor="middle" font-size="7.5" fill="#94a3b8">${idx + 1}</text>`);
    parts.push(`<text x="${tblX + COL_LP + 6}" y="${rowTextY}" font-size="8.5" font-weight="600" fill="#0f172a">${escXml(row.name)}</text>`);
    parts.push(`<text x="${tblX + COL_LP + COL_NAME + 6}" y="${rowTextY}" font-size="7.5" fill="#64748b">${escXml(CAT_LABELS[row.category] || row.category)}</text>`);
    parts.push(`<text x="${tblX + COL_LP + COL_NAME + COL_CAT + COL_RATING / 2}" y="${rowTextY}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${row.rating ? row.rating + "A" : "—"}</text>`);
    parts.push(`<text x="${tblX + COL_LP + COL_NAME + COL_CAT + COL_RATING + COL_QTY / 2}" y="${rowTextY}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#0f172a">${row.count}</text>`);
    parts.push(`<text x="${tblX + COL_LP + COL_NAME + COL_CAT + COL_RATING + COL_QTY + COL_UNIT / 2}" y="${rowTextY}" text-anchor="middle" font-size="7.5" fill="#475569">${escXml(row.unit)}</text>`);
  });

  const tableH = ROW_HEIGHT + allSpecRows.length * ROW_HEIGHT;
  parts.push(`<rect x="${tblX}" y="${hdrY}" width="${TABLE_W}" height="${tableH}" fill="none" stroke="#cbd5e1" stroke-width="1"/>`);

  return { specTableW, tableBottomY: hdrY + tableH };
}

export function generatePanelSvg(params: GeneratePanelSvgParams): string {
  const { sections, panelName, selectedManufacturer, isPro, profile } = params;
  const allSvgParts: string[] = [];

  const sectionLayouts: SectionLayout[] = sections.map((sec) => renderSection(sec, selectedManufacturer));
  const { contentH, contentW } = layoutSections(sectionLayouts);

  const totalW = Math.max(contentW + MARGIN * 2, 700);
  const contentOffsetX = Math.max(MARGIN, (totalW - contentW) / 2);
  const contentStartY = MARGIN + HEADER_H + CONTENT_GAP;

  const dateStr = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  const dateShort = new Date().toLocaleDateString("pl-PL");
  const totalDevices = sections.reduce((s, sec) => s + sec.modules.length, 0);
  const totalModsAll = sections.reduce((s, sec) => s + sec.modules.reduce((sm, m) => sm + Math.max(m.module.modules, 1), 0), 0);
  const companyName = escXml(profile?.companyName || profile?.fullName || "");

  renderHeader(allSvgParts, totalW, panelName, sections, totalDevices, totalModsAll, dateStr, companyName, profile, isPro);

  for (const sl of sectionLayouts) {
    allSvgParts.push(`<g transform="translate(${contentOffsetX + sl.x}, ${contentStartY + sl.y})">`);
    allSvgParts.push(...sl.parts);
    allSvgParts.push(`</g>`);
  }

  const specStartY = MARGIN + HEADER_H + CONTENT_GAP + contentH + 30;
  const allSpecRows = buildSpecRows(sections);
  const { specTableW, tableBottomY } = renderSpecTable(allSvgParts, allSpecRows, panelName, totalW, specStartY);

  // Footer
  const footY = tableBottomY + 20;
  allSvgParts.push(`<line x1="${MARGIN}" y1="${footY}" x2="${specTableW - MARGIN}" y2="${footY}" stroke="#cbd5e1" stroke-width="0.5"/>`);
  if (companyName) {
    allSvgParts.push(`<text x="${MARGIN + 20}" y="${footY + 12}" font-size="7.5" fill="#94a3b8">${companyName}</text>`);
  }
  allSvgParts.push(`<text x="${specTableW - MARGIN - 20}" y="${footY + 12}" text-anchor="end" font-size="7.5" fill="#94a3b8">Wygenerowano w ElektroSmart PRO · ${dateShort}</text>`);

  const finalW = Math.max(totalW, specTableW);
  const finalH = footY + 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${finalW}" height="${finalH}" viewBox="0 0 ${finalW} ${finalH}">
<defs></defs>
<style>text { font-family: 'Segoe UI', Arial, sans-serif; }</style>
<rect width="${finalW}" height="${finalH}" fill="#ffffff"/>
${allSvgParts.join("\n")}
</svg>`;
}

// DXF conversion (browser-only, uses DOMParser)
export function svgToDxf(svgString: string): string {
  let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  let entityHandle = 100;

  svgDoc.querySelectorAll("line").forEach((line) => {
    const x1 = parseFloat(line.getAttribute("x1") || "0");
    const y1 = parseFloat(line.getAttribute("y1") || "0");
    const x2 = parseFloat(line.getAttribute("x2") || "0");
    const y2 = parseFloat(line.getAttribute("y2") || "0");
    dxf += `0\nLINE\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${x1}\n20\n${-y1}\n30\n0.0\n11\n${x2}\n21\n${-y2}\n31\n0.0\n`;
    entityHandle++;
  });

  svgDoc.querySelectorAll("circle").forEach((circle) => {
    const cx = parseFloat(circle.getAttribute("cx") || "0");
    const cy = parseFloat(circle.getAttribute("cy") || "0");
    const r = parseFloat(circle.getAttribute("r") || "0");
    dxf += `0\nCIRCLE\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${cx}\n20\n${-cy}\n30\n0.0\n40\n${r}\n`;
    entityHandle++;
  });

  svgDoc.querySelectorAll("rect").forEach((rect) => {
    const x = parseFloat(rect.getAttribute("x") || "0");
    const y = parseFloat(rect.getAttribute("y") || "0");
    const w = parseFloat(rect.getAttribute("width") || "0");
    const h = parseFloat(rect.getAttribute("height") || "0");
    dxf += `0\nLINE\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${x}\n20\n${-y}\n11\n${x + w}\n21\n${-y}\n`;
    entityHandle++;
    dxf += `0\nLINE\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${x + w}\n20\n${-y}\n11\n${x + w}\n21\n${-(y + h)}\n`;
    entityHandle++;
    dxf += `0\nLINE\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${x + w}\n20\n${-(y + h)}\n11\n${x}\n21\n${-(y + h)}\n`;
    entityHandle++;
    dxf += `0\nLINE\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${x}\n20\n${-(y + h)}\n11\n${x}\n21\n${-y}\n`;
    entityHandle++;
  });

  svgDoc.querySelectorAll("text").forEach((text) => {
    const x = parseFloat(text.getAttribute("x") || "0");
    const y = parseFloat(text.getAttribute("y") || "0");
    const content = text.textContent || "";
    const fontSize = parseFloat(text.getAttribute("font-size") || "10");
    dxf += `0\nTEXT\n5\n${entityHandle.toString(16)}\n8\n0\n10\n${x}\n20\n${-y}\n30\n0.0\n40\n${fontSize}\n1\n${content.replace(/[\n\r]/g, " ")}\n`;
    entityHandle++;
  });

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}
