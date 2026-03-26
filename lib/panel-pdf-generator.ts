import type { PanelSection, Manufacturer } from "@/components/project/panel-configurator-types";
import type { DinModule } from "@/components/project/panel-configurator-types";
import { getModulePrice, getItemUnit } from "@/components/project/panel-configurator-helpers";
import { SECTION_FEED_LABELS, SECTION_TYPE_LABELS } from "@/components/project/panel-configurator-helpers";
import { PDF_COLORS, renderUnifiedFooter } from "@/lib/utils/pdf-shared-styles";

export interface PdfUserProfile {
  company_name?: string | null;
  full_name?: string | null;
  nip?: string | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface PdfEnclosure {
  name: string;
  modules: number;
  rows: number;
  price: number;
  laborPrice: number;
}

export interface GeneratePanelPdfParams {
  sections: PanelSection[];
  panelName: string;
  selectedManufacturer: Manufacturer;
  manufacturerCoeff: number;
  selectedEnclosure: PdfEnclosure;
  totalModules: number;
  grandTotalMaterial: number;
  grandTotalLabor: number;
  isPro: boolean;
  userProfile: PdfUserProfile | null | undefined;
}

const DIACRITICS: Record<string, string> = {
  "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o", "ś": "s", "ź": "z", "ż": "z",
  "Ą": "A", "Ć": "C", "Ę": "E", "Ł": "L", "Ń": "N", "Ó": "O", "Ś": "S", "Ź": "Z", "Ż": "Z",
};

function clean(t: string): string {
  return t
    .replace(/[\uE000-\uF8FF\u2600-\u26FF\u2700-\u27BF\uD800-\uDFFF]/g, "")
    .replace(/📦|🔧|👷|↳|⚠|✓/g, "")
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => DIACRITICS[ch] || ch)
    .trim();
}

function fmtPln(n: number): string {
  const [i, d] = n.toFixed(2).split(".");
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${d} zl`;
}

export async function generatePanelPdf(params: GeneratePanelPdfParams) {
  const {
    sections, panelName, selectedManufacturer, manufacturerCoeff,
    selectedEnclosure, totalModules, grandTotalMaterial, grandTotalLabor,
    isPro, userProfile,
  } = params;

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Load Roboto font for Polish characters
  let fontName = "helvetica";
  try {
    const fontResp = await fetch(
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
      { cache: "force-cache" }
    );
    if (fontResp.ok) {
      const ab = await fontResp.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let bin = "";
      for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
      const base64Font = btoa(bin);
      doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
      fontName = "Roboto";
    }
  } catch {
    // fallback to helvetica
  }
  const setFont = () => doc.setFont(fontName, "normal");
  setFont();

  const companyName = clean(userProfile?.company_name || "");
  const companyNip = userProfile?.nip ? clean(`NIP: ${userProfile.nip}`) : "";
  const companyAddr = (() => {
    const parts = [
      userProfile?.street,
      userProfile?.postal_code && userProfile?.city
        ? `${userProfile.postal_code} ${userProfile.city}`
        : (userProfile?.city || userProfile?.postal_code),
    ].filter(Boolean).join(", ");
    return parts ? clean(parts) : (userProfile?.address ? clean(userProfile.address) : "");
  })();
  const companyPhone = userProfile?.phone ? clean(`Tel: ${userProfile.phone}`) : "";
  const companyEmail = userProfile?.email || "";
  const personName = clean(userProfile?.full_name || "");

  // Header bar (unified blue)
  doc.setFillColor(...PDF_COLORS.bluePanel);
  doc.rect(0, 0, pageW, 40, "F");

  setFont();
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("SPECYFIKACJA ROZDZIELNICY", margin, 13);
  doc.setFontSize(11);
  doc.setTextColor(220, 230, 255);
  const mfrLabel = selectedManufacturer.id !== "hager"
    ? ` | ${clean(selectedManufacturer.name)} x${manufacturerCoeff.toFixed(2)}`
    : "";
  doc.text(clean(panelName.trim()) + mfrLabel, margin, 20);
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 255);
  doc.text(new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }), margin, 27);

  setFont();
  let rightY = 10;
  if (companyName) {
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(companyName, pageW - margin, rightY, { align: "right" });
    rightY += 5;
  } else if (personName) {
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(personName, pageW - margin, rightY, { align: "right" });
    rightY += 5;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(200, 215, 255);
  if (companyNip) { doc.text(companyNip, pageW - margin, rightY, { align: "right" }); rightY += 4; }
  if (companyAddr) { doc.text(companyAddr, pageW - margin, rightY, { align: "right" }); rightY += 4; }
  if (companyPhone) { doc.text(companyPhone, pageW - margin, rightY, { align: "right" }); rightY += 4; }
  if (companyEmail) { doc.text(companyEmail, pageW - margin, rightY, { align: "right" }); rightY += 4; }

  if (!isPro) {
    doc.setFontSize(10);
    doc.setTextColor(255, 180, 180);
    doc.text("WERSJA DEMO", pageW - margin, 36, { align: "right" });
  }

  let y = 46;

  // Info cards row
  const cardW = (pageW - margin * 2 - 8) / 3;

  setFont();
  doc.setFillColor(...PDF_COLORS.slateBg);
  doc.setDrawColor(...PDF_COLORS.slateRule);
  doc.roundedRect(margin, y, cardW, 20, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.slateSubtle);
  doc.text("OBUDOWA", margin + 4, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.slateDark);
  const encName = clean(selectedEnclosure.name);
  const encLines = doc.splitTextToSize(encName, cardW - 8);
  doc.text(encLines[0] || "", margin + 4, y + 13);
  if (encLines[1]) doc.text(encLines[1], margin + 4, y + 17);

  setFont();
  doc.setFillColor(...PDF_COLORS.slateBg);
  doc.setDrawColor(...PDF_COLORS.slateRule);
  doc.roundedRect(margin + cardW + 4, y, cardW, 20, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.slateSubtle);
  doc.text("ZAJETOSC", margin + cardW + 8, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.slateDark);
  const occPct = Math.round((totalModules / selectedEnclosure.modules) * 100);
  doc.text(`${totalModules} / ${selectedEnclosure.modules} modulow (${occPct}%)`, margin + cardW + 8, y + 13);
  const barX = margin + cardW + 8;
  const barW = cardW - 12;
  doc.setFillColor(...PDF_COLORS.slateRule);
  doc.roundedRect(barX, y + 15, barW, 2.5, 1, 1, "F");
  // Bar color: red if overloaded, blue otherwise
  doc.setFillColor(...(occPct > 90 ? PDF_COLORS.red : PDF_COLORS.blue));
  doc.roundedRect(barX, y + 15, barW * Math.min(occPct / 100, 1), 2.5, 1, 1, "F");

  setFont();
  doc.setFillColor(...PDF_COLORS.slateBg);
  doc.setDrawColor(...PDF_COLORS.slateRule);
  doc.roundedRect(margin + (cardW + 4) * 2, y, cardW, 20, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.slateSubtle);
  doc.text("PRODUCENT", margin + (cardW + 4) * 2 + 4, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.slateDark);
  doc.text(
    clean(`${selectedManufacturer.name}${selectedManufacturer.country ? ` (${selectedManufacturer.country})` : ""}${manufacturerCoeff !== 1.0 ? ` x${manufacturerCoeff.toFixed(2)}` : ""}`),
    margin + (cardW + 4) * 2 + 4, y + 13
  );
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${selectedEnclosure.rows} rzedow x ${Math.ceil(selectedEnclosure.modules / selectedEnclosure.rows)} mod.`,
    margin + (cardW + 4) * 2 + 4, y + 17
  );

  y = 72;

  // Specification table
  const tableData: string[][] = [];
  const sectionHeaderRows: number[] = [];
  let rowCounter = 0;

  for (const sec of sections) {
    if (sections.length > 1) {
      const feedLabel = clean(SECTION_FEED_LABELS[sec.feed]);
      const typeLabel = clean(SECTION_TYPE_LABELS[sec.type]);
      tableData.push(["", clean(`${sec.name} — ${feedLabel} | ${typeLabel}`), "", "", "", ""]);
      sectionHeaderRows.push(rowCounter);
      rowCounter++;
    }

    tableData.push([
      "",
      clean(`Obudowa: ${sec.enclosure.name}`),
      "1",
      isPro ? fmtPln(sec.enclosure.price) : "***",
      isPro ? fmtPln(sec.enclosure.laborPrice) : "***",
      isPro ? fmtPln(sec.enclosure.price + sec.enclosure.laborPrice) : "***",
    ]);
    rowCounter++;

    const secMap = new Map<string, { module: DinModule; rating?: number; count: number; totalMat: number; totalLab: number }>();
    for (const m of sec.modules) {
      if (m.isZugBlock) continue;
      const p = getModulePrice(m, manufacturerCoeff);
      const key = `${m.module.id}-${m.rating || ""}-${p.material}-${p.labor}`;
      const existing = secMap.get(key);
      if (existing) { existing.count++; existing.totalMat += p.material; existing.totalLab += p.labor; }
      else { secMap.set(key, { module: m.module, rating: m.rating, count: 1, totalMat: p.material, totalLab: p.labor }); }
    }

    let itemIdx = 1;
    for (const item of secMap.values()) {
      const ratingStr = item.rating ? ` ${item.rating}A` : "";
      const unitMat = item.totalMat / item.count;
      const unitLab = item.totalLab / item.count;
      tableData.push([
        String(itemIdx),
        clean(`${item.module.namePl}${ratingStr}`),
        String(item.count),
        isPro ? fmtPln(unitMat) : "***",
        isPro ? fmtPln(unitLab) : "***",
        isPro ? fmtPln(item.totalMat + item.totalLab) : "***",
      ]);
      itemIdx++;
      rowCounter++;
    }
  }

  setFont();
  autoTable(doc, {
    startY: y,
    head: [["Lp.", "Nazwa urzadzenia", "Szt.", "Material jed.", "Robocizna jed.", "Razem"]],
    body: tableData,
    styles: { fontSize: 8.5, cellPadding: 2.5, font: fontName, textColor: PDF_COLORS.slateDark },
    headStyles: { fillColor: PDF_COLORS.slateHeader, textColor: PDF_COLORS.white, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] as [number,number,number] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 62 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      data.cell.styles.font = fontName;
      const colAligns: Record<number, "center" | "right" | "left"> = { 0: "center", 2: "center", 3: "right", 4: "right", 5: "right" };
      if (data.section === "head" && colAligns[data.column.index]) {
        data.cell.styles.halign = colAligns[data.column.index];
      }
      if (data.section === "body") {
        if (sectionHeaderRows.includes(data.row.index)) {
          data.cell.styles.fillColor = PDF_COLORS.violetLight;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = PDF_COLORS.violet;
        }
        const isEnclosureRow = sections.length > 1
          ? sectionHeaderRows.includes(data.row.index - 1)
          : data.row.index === 0;
        if (isEnclosureRow) {
          // Enclosure row: subtle blue tint
          data.cell.styles.fillColor = [219, 234, 254] as [number,number,number];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  let finalY: number = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 200;

  // Accessories & Labor table
  const allAccessories = sections.flatMap((s) => s.accessories);
  const zugBlocks = sections.flatMap((s) => s.modules.filter((m) => m.isZugBlock));
  const hasAccOrZug = allAccessories.length > 0 || zugBlocks.length > 0;

  if (hasAccOrZug) {
    const accTableData: string[][] = [];
    const accMap = new Map<string, { module: DinModule; qty: number; unit: string; unitMat: number; unitLab: number; totalMat: number; totalLab: number }>();

    for (const zug of zugBlocks) {
      const zugQty = zug.terminalCount || 15;
      const p = getModulePrice(zug, manufacturerCoeff);
      const uMat = zugQty > 0 ? p.material / zugQty : p.material;
      const uLab = zugQty > 0 ? p.labor / zugQty : p.labor;
      const key = `zug-${zug.module.id}-${uMat.toFixed(4)}-${uLab.toFixed(4)}`;
      const existing = accMap.get(key);
      if (existing) { existing.qty += zugQty; existing.totalMat += p.material; existing.totalLab += p.labor; }
      else { accMap.set(key, { module: zug.module, qty: zugQty, unit: "szt.", unitMat: uMat, unitLab: uLab, totalMat: p.material, totalLab: p.labor }); }
    }

    for (const m of allAccessories) {
      const qty = m.quantity || 1;
      const p = getModulePrice(m, manufacturerCoeff);
      const uMat = qty > 0 ? p.material / qty : p.material;
      const uLab = qty > 0 ? p.labor / qty : p.labor;
      const unit = getItemUnit(m.module as DinModule);
      const key = `${m.module.id}-${uMat.toFixed(4)}-${uLab.toFixed(4)}`;
      const existing = accMap.get(key);
      if (existing) { existing.qty += qty; existing.totalMat += p.material; existing.totalLab += p.labor; }
      else { accMap.set(key, { module: m.module as DinModule, qty, unit, unitMat: uMat, unitLab: uLab, totalMat: p.material, totalLab: p.labor }); }
    }

    let accIdx = 1;
    for (const item of accMap.values()) {
      accTableData.push([
        String(accIdx),
        clean(item.module.namePl),
        clean(`${item.qty} ${item.unit}`),
        isPro ? fmtPln(item.unitMat) : "***",
        isPro ? fmtPln(item.unitLab) : "***",
        isPro ? fmtPln(item.totalMat + item.totalLab) : "***",
      ]);
      accIdx++;
    }

    setFont();
    autoTable(doc, {
      startY: finalY + 8,
      head: [["Lp.", "Materialy pomocnicze i Robocizna", "Ilosc", "Material jed.", "Robocizna jed.", "Razem"]],
      body: accTableData,
      styles: { fontSize: 8.5, cellPadding: 2.5, font: fontName, textColor: PDF_COLORS.slateDark },
      headStyles: { fillColor: PDF_COLORS.slateSubtle, textColor: PDF_COLORS.white, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] as [number,number,number] },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 62 },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 30, halign: "right" },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        data.cell.styles.font = fontName;
        const colAligns: Record<number, "center" | "right" | "left"> = { 0: "center", 2: "center", 3: "right", 4: "right", 5: "right" };
        if (data.section === "head" && colAligns[data.column.index]) {
          data.cell.styles.halign = colAligns[data.column.index];
        }
      },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
  }

  // Totals section
  if (isPro) {
    const totY = finalY + 6;
    const totW = 80;
    const totX = pageW - margin - totW;

    doc.setFillColor(...PDF_COLORS.slateBg);
    doc.setDrawColor(...PDF_COLORS.slateRule);
    doc.roundedRect(totX, totY, totW, 32, 2, 2, "FD");

    setFont();
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.slateSubtle);
    doc.text("Material:", totX + 4, totY + 8);
    doc.text("Robocizna:", totX + 4, totY + 15);

    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.slateDark);
    doc.text(fmtPln(grandTotalMaterial), totX + totW - 4, totY + 8, { align: "right" });
    doc.text(fmtPln(grandTotalLabor), totX + totW - 4, totY + 15, { align: "right" });

    doc.setDrawColor(...PDF_COLORS.slateRule);
    doc.line(totX + 4, totY + 19, totX + totW - 4, totY + 19);

    doc.setFillColor(...PDF_COLORS.bluePanel);
    doc.roundedRect(totX, totY + 21, totW, 10, 0, 0, "F");
    setFont();
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("RAZEM NETTO:", totX + 4, totY + 28);
    doc.text(fmtPln(grandTotalMaterial + grandTotalLabor), totX + totW - 4, totY + 28, { align: "right" });
  }

  // Footer — unified across all PDF documents
  const totalPages = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderUnifiedFooter(doc, pageW, doc.internal.pageSize.getHeight(), userProfile as Parameters<typeof renderUnifiedFooter>[3], isPro);
  }

  return doc;
}
