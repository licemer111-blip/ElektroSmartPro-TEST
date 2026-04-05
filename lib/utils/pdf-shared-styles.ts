/**
 * pdf-shared-styles.ts — ElektroSmart Unified PDF Design System
 *
 * Single source of truth for ALL PDF documents (estimate, materials, panel).
 * DNA:
 *   Orange  #f59e0b — Materials & Assemblies (Zestawy)
 *   Green   #10b981 — Labor & Montage (Robocizna)
 *   Blue    #3b82f6 — Totals & Financial summary
 *   Slate   #1e293b — Header fill (dark)
 *   Violet  #7c3aed — Section dividers
 */

import jsPDF from "jspdf";
import type { Profile } from "@/lib/types/database";

// ─── Color palette ────────────────────────────────────────────────────────────

export const PDF_COLORS = {
  // Brand
  orange:      [245, 158,  11] as [number, number, number], // amber-500
  orangeLight: [255, 247, 237] as [number, number, number], // orange-50
  green:       [ 16, 185, 129] as [number, number, number], // emerald-500
  greenLight:  [240, 253, 244] as [number, number, number], // emerald-50
  blue:        [ 59, 130, 246] as [number, number, number], // blue-500
  blueDeep:    [ 37,  99, 235] as [number, number, number], // blue-600
  bluePanel:   [ 30,  64, 175] as [number, number, number], // blue-800 (panel header)

  // Neutral
  slateHeader: [ 30,  41,  59] as [number, number, number], // slate-800
  slateDark:   [ 15,  23,  42] as [number, number, number], // slate-900
  slate:       [ 51,  65,  85] as [number, number, number], // slate-700
  slateLight:  [ 71,  85, 105] as [number, number, number], // slate-600
  slateSubtle: [100, 116, 139] as [number, number, number], // slate-500
  slateMuted:  [148, 163, 184] as [number, number, number], // slate-400
  slateRule:   [226, 232, 240] as [number, number, number], // slate-200
  slateBg:     [248, 250, 252] as [number, number, number], // slate-50

  // Section / violet
  violet:      [ 88,  28, 135] as [number, number, number], // violet-900
  violetLight: [238, 235, 255] as [number, number, number], // violet-50

  // Status
  red:         [220,  38,  38] as [number, number, number], // red-600
  redLight:    [254, 226, 226] as [number, number, number], // red-100

  // Base
  white:       [255, 255, 255] as [number, number, number],
  black:       [  0,   0,   0] as [number, number, number],
} as const;

// ─── Typography sizes ──────────────────────────────────────────────────────────

export const PDF_FONT = {
  display:  16,
  h1:       14,
  h2:       11,
  h3:       10,
  body:      9,
  small:     8,
  tiny:      7,
  micro:     6.5,
} as const;

// ─── Shared autoTable head styles ─────────────────────────────────────────────

export interface AutoTableHeadStyle {
  fillColor: [number, number, number];
  textColor: [number, number, number];
  fontStyle: "bold" | "normal";
  fontSize: number;
  halign: "center" | "left" | "right";
  lineWidth: number;
  cellPadding: { top: number; right: number; bottom: number; left: number };
}

export const PDF_TABLE_HEAD: AutoTableHeadStyle = {
  fillColor:   PDF_COLORS.slateHeader,
  textColor:   PDF_COLORS.white,
  fontStyle:   "bold",
  fontSize:    PDF_FONT.small,
  halign:      "center",
  lineWidth:   0,
  cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
};

export interface AutoTableBodyStyle {
  font: string;
  fontSize: number;
  textColor: [number, number, number];
  lineColor: [number, number, number];
  lineWidth: number;
  cellPadding: { top: number; right: number; bottom: number; left: number };
}

export const PDF_TABLE_BODY: AutoTableBodyStyle = {
  font:        "Roboto",
  fontSize:    PDF_FONT.small,
  textColor:   PDF_COLORS.slateDark,
  lineColor:   PDF_COLORS.slateRule,
  lineWidth:   0.1,
  cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
};

export const PDF_TABLE_ALTERNATE = {
  fillColor: [245, 247, 250] as [number, number, number], // very subtle zebra
};

// ─── Column accent colors (bars drawn above header) ───────────────────────────

export const PDF_ACCENT = {
  material:  PDF_COLORS.orange,
  labor:     PDF_COLORS.green,
  total:     PDF_COLORS.blue,
  section:   PDF_COLORS.violet,
} as const;

// ─── Legend items definition ──────────────────────────────────────────────────

export interface LegendItem {
  color: [number, number, number];
  label: string;
}

export const PDF_LEGEND_ITEMS: LegendItem[] = [
  { color: PDF_COLORS.orangeLight, label: "Zestaw (kompletny montaz)" },
  { color: PDF_COLORS.slateBg,     label: "Pozycja standardowa"       },
  { color: PDF_COLORS.green,       label: "Robocizna"                 },
  { color: PDF_COLORS.orange,      label: "Materialy"                 },
];

// ─── Legend renderer ──────────────────────────────────────────────────────────

/**
 * Renders a clean horizontal legend strip (no "Aa" placeholders).
 * Returns the Y position after the legend block.
 */
export function renderPdfLegend(
  _doc: jsPDF,
  _margin: number,
  startY: number,
  _pageWidth: number,
  _showColors: boolean,
): number {
  // Legend removed — cleaner PDF layout
  return startY;
}

// ─── Accent bars above table header columns ───────────────────────────────────

/**
 * Draws 2pt colored accent bars above specified header cells.
 * Call inside `didDrawPage` of autoTable after the first page renders the header.
 *
 * @param doc       jsPDF instance
 * @param cells     headRow.cells from hookData.table.head[0].cells
 * @param accents   Map of column index → accent color
 * @param baseY     Y coordinate to draw bars at (typically header top - 1)
 */
export function drawColumnAccents(
  doc: jsPDF,
  cells: Record<number, { x: number; width: number }>,
  accents: Record<number, [number, number, number]>,
  baseY: number,
): void {
  for (const [idxStr, color] of Object.entries(accents)) {
    const idx = Number(idxStr);
    const cell = cells[idx];
    if (!cell) continue;
    doc.setDrawColor(...color);
    doc.setLineWidth(2);
    doc.line(cell.x, baseY, cell.x + cell.width, baseY);
  }
}

// ─── Universal footer ─────────────────────────────────────────────────────────

/**
 * Renders a unified footer on the current page: separator line, company info, page number.
 * Identical across ALL PDF types.
 */
export function renderUnifiedFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  profile?: Profile | null,
  isPro: boolean = true,
): void {
  const margin = 15;
  const footerY = pageHeight - 15;

  // DEMO watermark
  if (!isPro) {
    doc.saveGraphicsState();
    doc.setGState(
      new (doc as unknown as { GState: new (opts: { opacity: number }) => object }).GState({ opacity: 0.07 })
    );
    doc.setFontSize(60);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(...PDF_COLORS.red);
    doc.text("WERSJA DEMO", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  }

  // Separator
  doc.setDrawColor(...PDF_COLORS.slateRule);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(PDF_FONT.micro);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(...PDF_COLORS.slateMuted);

  // Center: company or system
  const centerText = profile?.company_name && profile?.nip
    ? `Kosztorys przygotowany przez: ${profile.company_name}, NIP: ${profile.nip}`
    : profile?.company_name
      ? `Kosztorys przygotowany przez: ${profile.company_name}`
      : "Dokument wygenerowany w systemie ElektroSmart PRO";

  doc.text(centerText, pageWidth / 2, footerY, { align: "center" });

  // Date
  doc.setFontSize(6.5);
  doc.text(
    `Data wygenerowania: ${new Date().toLocaleString("pl-PL")}`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" },
  );

  // Page number (right)
  const pageInfo = (
    doc as unknown as {
      internal: {
        getCurrentPageInfo(): { pageNumber: number };
        getNumberOfPages(): number;
      };
    }
  ).internal;
  const pageNum   = pageInfo.getCurrentPageInfo().pageNumber;
  const pageTotal = pageInfo.getNumberOfPages();
  doc.text(`Strona ${pageNum} / ${pageTotal}`, pageWidth - margin, footerY + 4, { align: "right" });
}

// ─── Project meta block (below header separator) ─────────────────────────────

export interface ProjectMeta {
  name: string;
  status?: string | null;
  objectTypeName?: string | null;
  vatRate?: number | null;
}

/**
 * Renders unified project info block below the header.
 * Returns Y after the block.
 */
export function renderProjectMetaBlock(
  doc: jsPDF,
  meta: ProjectMeta,
  margin: number,
  pageWidth: number,
  startY: number,
  showColors: boolean,
): number {
  const blockHeight = 30;
  const blockPad = 4;

  doc.setFillColor(...PDF_COLORS.slateBg);
  doc.roundedRect(margin, startY, pageWidth - 2 * margin, blockHeight, 2, 2, "F");
  doc.setDrawColor(...PDF_COLORS.slateRule);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, startY, pageWidth - 2 * margin, blockHeight, 2, 2, "S");

  let y = startY + blockPad + 4;

  // Project name
  doc.setFontSize(PDF_FONT.h1);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...PDF_COLORS.slateDark);
  doc.text(meta.name || "Bez nazwy", margin + blockPad, y);
  y += 7;

  doc.setFontSize(PDF_FONT.small);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(...PDF_COLORS.slateSubtle);

  const leftCol  = margin + blockPad;
  const rightCol = pageWidth / 2 + 5;

  // Object type (moved to left column — region is intentionally hidden from client PDF)
  if (meta.objectTypeName) {
    doc.text(`Typ obiektu: ${meta.objectTypeName}`, leftCol, y);
  }
  y += 5;

  // VAT
  const vatStr = meta.vatRate != null
    ? `VAT: ${meta.vatRate}% (${meta.vatRate === 8 ? "stawka obnizona (8%)" : "stawka standardowa (23%)"})`
    : "";
  if (vatStr) doc.text(vatStr, leftCol, y);

  // Status
  const statusMap: Record<string, string> = {
    draft: "Wersja robocza", final: "Wersja finalna", archived: "Zarchiwizowany",
  };
  if (meta.status) {
    const statusLabel = statusMap[meta.status] ?? meta.status;
    doc.text(`Status: ${statusLabel}`, rightCol, y);
  }

  // Accent bar — left edge of block
  if (showColors) {
    doc.setFillColor(...PDF_COLORS.blue);
    doc.rect(margin, startY, 2.5, blockHeight, "F");
  }

  return startY + blockHeight;
}
