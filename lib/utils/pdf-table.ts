import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProjectWithRelations, ProjectItem, Profile } from "@/lib/types/database";
import { processTextForPDF, formatCurrency, formatQuantity, addPageFooter } from "./pdf-utils";
import {
  PDF_COLORS,
  PDF_TABLE_HEAD,
  PDF_TABLE_BODY,
  PDF_TABLE_ALTERNATE,
  renderPdfLegend,
} from "./pdf-shared-styles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableResult {
  finalY: number;
  materialSubtotal: number;
  laborSubtotal: number;
  totalLaborHours: number;
}

type ColStyle = {
  cellWidth: number;
  halign: "left" | "center" | "right";
  fontStyle?: "bold" | "normal";
};

interface TableRow {
  isParent: boolean;
  isChild: boolean;
  isZestaw: boolean;        // Zestaw (assembly parent) — orange left border
  isMissingPrice: boolean;  // BRAK CENY — red text only, no fill
  isSection: boolean;       // Section divider row
  sectionName?: string;
  rowType: string;
  data: string[];
  knrCode?: string | null;
}

// ─── Design tokens (from shared-styles) ────────────────────────────────────

// Row fills
const C_ZESTAW_FILL  = PDF_COLORS.orangeLight;
const C_CHILD_FILL   = PDF_COLORS.white;
const C_SINGLE_FILL  = PDF_COLORS.slateBg;
const C_SECTION_FILL = PDF_COLORS.violetLight;

// Text
const C_SECTION_TEXT = PDF_COLORS.violet;
const C_ZESTAW_TEXT: [number,number,number] = [154, 52, 18]; // orange-800
const C_CHILD_TEXT   = PDF_COLORS.slateLight;
const C_NORMAL_TEXT  = PDF_COLORS.slateDark;
const C_MISSING_TEXT = PDF_COLORS.red;
const C_KNR_TEXT     = PDF_COLORS.slateMuted;

// ─── Column layout ────────────────────────────────────────────────────────────

function buildColumnHeaders(showRg: boolean, matOwnedByClient: boolean): string[] {
  return [
    "Lp.",
    processTextForPDF("Nazwa pozycji"),
    "Jm",
    processTextForPDF("Ilosc"),
    ...(showRg ? [processTextForPDF("r-g")] : []),
    ...(matOwnedByClient ? [] : [processTextForPDF("Material")]),
    processTextForPDF("Robocizna"),
    processTextForPDF("Wartosc"),
  ];
}

function buildColumnStyles(showRg: boolean, matOwnedByClient: boolean): Record<number, ColStyle> {
  // Column order: Lp | Nazwa | Jm | Ilosc | [r-g] | [Material] | Robocizna | Wartosc
  if (showRg && !matOwnedByClient) {
    return {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 52, halign: "left" },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 24, halign: "right" },
      7: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    };
  }
  if (showRg && matOwnedByClient) {
    return {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 62, halign: "left" },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 32, halign: "right" },
      6: { cellWidth: 34, halign: "right", fontStyle: "bold" },
    };
  }
  if (!showRg && matOwnedByClient) {
    return {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 80, halign: "left" },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 36, halign: "right" },
      5: { cellWidth: 36, halign: "right", fontStyle: "bold" },
    };
  }
  return {
    0: { cellWidth: 12, halign: "center" },
    1: { cellWidth: 62, halign: "left" },
    2: { cellWidth: 12, halign: "center" },
    3: { cellWidth: 16, halign: "center" },
    4: { cellWidth: 28, halign: "right" },
    5: { cellWidth: 28, halign: "right" },
    6: { cellWidth: 32, halign: "right", fontStyle: "bold" },
  };
}

// ─── Section divider row builder ──────────────────────────────────────────────

function makeSectionRow(name: string, colCount: number): TableRow {
  return {
    isParent: false,
    isChild: false,
    isZestaw: false,
    isMissingPrice: false,
    isSection: true,
    sectionName: name,
    rowType: "section",
    data: [
      { content: processTextForPDF(name), colSpan: colCount } as unknown as string,
    ],
  };
}

// ─── Main render function ─────────────────────────────────────────────────────

/**
 * Renders the items table with professional ElektroSmart PRO styling.
 * Returns financial subtotals and the finalY position.
 */
export function renderItemsTable(
  doc: jsPDF,
  project: ProjectWithRelations,
  items: ProjectItem[],
  profile: Profile | null | undefined,
  adjustmentPercentage: number,
  showColors: boolean,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  bottomMargin: number
): TableResult {
  const showRg = project.show_labor_hours_in_pdf === true;
  const matOwnedByClient = Boolean((project as unknown as Record<string, unknown>).materials_owned_by_customer);
  const isEmpty = !items || items.length === 0;

  let materialSubtotal = 0;
  let laborSubtotal = 0;
  let totalLaborHours = 0;

  const tableHead = buildColumnHeaders(showRg, matOwnedByClient);
  const colStyles = buildColumnStyles(showRg, matOwnedByClient);
  const colCount = tableHead.length;

  // ── Legend (unified shared renderer) ────────────────────────────────────
  const legendY = renderPdfLegend(doc, margin, startY, pageWidth, showColors);

  if (isEmpty) {
    autoTable(doc, {
      startY: legendY,
      head: [tableHead],
      body: [[{
        content: processTextForPDF("Brak pozycji w kosztorysie"),
        colSpan: colCount,
        styles: { halign: "center", textColor: [150,150,150] as [number,number,number], fontStyle: "italic", font: "Roboto" },
      }]],
      theme: "plain",
      styles: { font: "Roboto", lineColor: PDF_COLORS.slateRule, lineWidth: 0.1 },
      headStyles: { ...PDF_TABLE_HEAD, font: "Roboto" },
      bodyStyles: { font: "Roboto", fontSize: 9, textColor: [120,120,120] as [number,number,number] },
      margin: { left: margin, right: margin, bottom: bottomMargin },
      showHead: "everyPage",
    });
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    return { finalY, materialSubtotal, laborSubtotal, totalLaborHours };
  }

  const adjMult = 1 + adjustmentPercentage / 100;
  const tableData: TableRow[] = [];
  let rowIndex = 1;
  let lastSection: string | null = null;

  // ── Group by section then build rows ──────────────────────────────────────
  for (const item of items) {
    const section = item.section ?? null;

    // Section divider
    if (section !== lastSection) {
      lastSection = section;
      if (section) {
        tableData.push(makeSectionRow(section, colCount));
      }
    }

    const rawMat = item.final_material_price ?? item.material_price ?? 0;
    const rawLab = item.final_labor_price ?? item.labor_price ?? 0;
    const matUnit = rawMat * adjMult;
    const labUnit = rawLab * adjMult;
    const matTotal = matUnit * item.quantity;
    const labTotal = labUnit * item.quantity;
    const rowTotal = matTotal + labTotal;

    materialSubtotal += matTotal;
    laborSubtotal += labTotal;

    const isMissingPrice = rowTotal === 0 && !item.is_assembly_child;
    const isZestaw = item.is_assembly_child !== true && !!item.catalog_item_id && rowTotal === 0
      ? false
      : false; // resolved below via is_assembly_child flag absence on parent
    const isParent = !item.is_assembly_child && items.some(c => c.is_assembly_child && (c as ProjectItem & { parent_assembly_id?: string }).parent_assembly_id === item.id);
    const isChild = item.is_assembly_child === true;

    const itemHours = item.labor_hours_total ?? null;
    if (itemHours != null) totalLaborHours += itemHours;
    const rgCell = showRg ? (itemHours != null ? `${itemHours.toFixed(2)} rbh` : "—") : null;

    // Name cell: for children add ↳ indent marker (handled in didParseCell)
    const nameText = isChild
      ? `  ${processTextForPDF(item.name)}`
      : processTextForPDF(item.name);

    const priceText = isMissingPrice
      ? "BRAK CENY!"
      : formatCurrency(rowTotal);

    tableData.push({
      isParent,
      isChild,
      isZestaw: isParent,
      isMissingPrice,
      isSection: false,
      rowType: isParent ? "zestaw" : isChild ? "child" : "single",
      knrCode: item.knr_code ?? null,
      data: [
        isChild ? "" : String(rowIndex++),
        nameText,
        item.unit,
        formatQuantity(item.quantity),
        ...(showRg ? [rgCell ?? "—"] : []),
        ...(matOwnedByClient ? [] : [isMissingPrice ? "—" : formatCurrency(matUnit)]),
        isMissingPrice ? "—" : formatCurrency(labUnit),
        priceText,
      ],
    });
  }

  autoTable(doc, {
    startY: legendY,
    head: [tableHead],
    body: tableData.map((row) => {
      if (row.isSection) return row.data; // pass colSpan cell as-is
      return row.data;
    }),
    theme: "plain",
    styles: { ...PDF_TABLE_BODY, font: "Roboto", fontSize: 7.5, textColor: C_NORMAL_TEXT },
    headStyles: { ...PDF_TABLE_HEAD, font: "Roboto" },
    bodyStyles: { font: "Roboto", fontSize: 7.5, textColor: C_NORMAL_TEXT },
    columnStyles: colStyles,
    alternateRowStyles: { fillColor: PDF_TABLE_ALTERNATE.fillColor },
    margin: { left: margin, right: margin, bottom: bottomMargin },
    showHead: "everyPage",
    didDrawPage: () => {
      addPageFooter(doc, pageWidth, pageHeight, profile);
    },
    didParseCell: (data) => {
      if (data.section === "head") return;

      const idx = data.row.index;
      const rowData = tableData[idx];
      if (!rowData) return;

      // ── Section divider ──────────────────────────────────────────────────
      if (rowData.isSection) {
        data.cell.styles.fillColor = C_SECTION_FILL;
        data.cell.styles.textColor = C_SECTION_TEXT;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize  = 7.5;
        data.cell.styles.lineWidth = { top: 1, bottom: 0.3, left: 0.1, right: 0.1 };
        return;
      }

      // ── BRAK CENY — red text, white fill ────────────────────────────────
      if (rowData.isMissingPrice) {
        data.cell.styles.fillColor = [255,255,255] as [number,number,number];
        if (data.column.index === 1 || data.column.index === colCount - 1) {
          data.cell.styles.textColor = C_MISSING_TEXT;
          data.cell.styles.fontStyle = "bold";
        }
        return;
      }

      // ── Fill by row type ─────────────────────────────────────────────────
      if (showColors) {
        if (rowData.isZestaw) {
          data.cell.styles.fillColor = C_ZESTAW_FILL;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = C_ZESTAW_TEXT;
        } else if (rowData.isChild) {
          data.cell.styles.fillColor = C_CHILD_FILL;
          data.cell.styles.textColor = C_CHILD_TEXT;
        } else {
          data.cell.styles.fillColor = C_SINGLE_FILL;
          data.cell.styles.textColor = C_NORMAL_TEXT;
        }
      } else {
        data.cell.styles.fillColor = rowData.isZestaw
          ? [240,240,240] as [number,number,number]
          : [255,255,255] as [number,number,number];
        if (rowData.isZestaw) data.cell.styles.fontStyle = "bold";
      }

      // ── Name cell: child indent ──────────────────────────────────────────
      if (data.column.index === 1 && rowData.isChild) {
        data.cell.styles.cellPadding = { left: 10, right: 2, top: 1.5, bottom: 1.5 };
        data.cell.styles.fontSize = 7;
      }

      // ── Suma column bold ─────────────────────────────────────────────────
      if (data.column.index === colCount - 1 && !rowData.isSection) {
        data.cell.styles.fontStyle = "bold";
      }

      // ── Top separator line for Zestaw parent ─────────────────────────────
      if (rowData.isZestaw) {
        data.cell.styles.lineWidth = { top: 1, bottom: 0.1, left: 0.1, right: 0.1 };
      }
    },

    didDrawCell: (data) => {
      if (data.section === "head" || data.section !== "body") return;

      const idx = data.row.index;
      const rowData = tableData[idx];
      if (!rowData || rowData.isSection) return;

      // ── Orange left-border stripe for Zestaw rows ────────────────────────
      if (rowData.isZestaw && data.column.index === 0) {
        doc.setFillColor(249, 115, 22); // orange-500
        doc.rect(data.cell.x, data.cell.y, 2.5, data.cell.height, "F");
      }

      // ── Child rows: subtle ↳ glyph before name ───────────────────────────
      if (rowData.isChild && data.column.index === 1) {
        doc.setFontSize(7);
        doc.setFont("Roboto", "normal");
        doc.setTextColor(...C_KNR_TEXT);
        doc.text("->", data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1);
      }

      // ── KNR code sub-line below name (Regular 8pt grey) ──────────────────
      if (data.column.index === 1 && rowData.knrCode && !rowData.isChild && !rowData.isSection) {
        const knrY = data.cell.y + data.cell.height - 2;
        doc.setFontSize(6.5);
        doc.setFont("Roboto", "normal");
        doc.setTextColor(...C_KNR_TEXT);
        doc.text(
          processTextForPDF(rowData.knrCode),
          data.cell.x + 2,
          knrY
        );
      }
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  return { finalY, materialSubtotal, laborSubtotal, totalLaborHours };
}
