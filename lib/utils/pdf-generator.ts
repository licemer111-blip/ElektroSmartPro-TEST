import { logger } from "@/lib/logger";
import jsPDF from "jspdf";
import type { ProjectWithRelations, ProjectItem, Profile } from "@/lib/types/database";
import { getBase64Font, processTextForPDF, formatCurrency, addPageFooter } from "./pdf-utils";
import { renderPdfHeader, renderProjectBlock } from "./pdf-header";
import { renderItemsTable } from "./pdf-table";

interface PDFGeneratorOptions {
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile?: Profile | null;
  adjustmentPercentage?: number;
  showColors?: boolean;
  activeCoefficients?: { height?: boolean; difficulty?: boolean; surface?: boolean } | null;
}

/**
 * Generate professional estimate PDF with stable fonts and company branding
 */
export async function generateEstimatePDF({
  project,
  items,
  profile,
  adjustmentPercentage = 0,
  showColors = true,
  activeCoefficients,
}: PDFGeneratorOptions) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    try {
      const fontBase64 = await getBase64Font();
      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto", "normal");
    } catch (error) {
      logger.error("Font loading failed, falling back to Helvetica:", {}, error);
      doc.setFont("Roboto", "normal");
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const bottomMargin = 70;

    // ============================================
    // HEADER: logo, company details, client, doc title
    // ============================================
    let currentY = await renderPdfHeader({
      doc,
      project,
      profile,
      pageWidth,
      margin,
      startY: margin,
    });

    // ============================================
    // PROJECT INFO BLOCK
    // ============================================
    currentY = renderProjectBlock(doc, project, pageWidth, margin, currentY, showColors);
    currentY += 10;

    // Materials note
    if (project.materials_owned_by_customer) {
      doc.setFillColor(254, 249, 195);
      doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 8, 2, 2, "F");
      doc.setFontSize(9);
      doc.setTextColor(161, 98, 7);
      doc.setFont("Roboto", "bold");
      doc.text(
        processTextForPDF("⚠ Materialy zapewnione przez inwestora"),
        margin + 3,
        currentY + 5.5
      );
      currentY += 11;
    }

    // ============================================
    // ITEMS TABLE
    // ============================================
    const { finalY, materialSubtotal, laborSubtotal, totalLaborHours } = renderItemsTable(
      doc,
      project,
      items,
      profile,
      adjustmentPercentage,
      showColors,
      currentY,
      margin,
      pageWidth,
      pageHeight,
      bottomMargin
    );
    currentY = finalY;

    // ============================================
    // TECHNICAL NOTES (applied KNR modifiers)
    // ============================================
    const techNoteItems = items.filter(item => {
      const n = item.confidence_note ?? "";
      return /×[\d.]+\s*KNR/i.test(n) || /×[\d.]+\s*kabel/.test(n);
    });
    const hasActiveCoeffs = activeCoefficients &&
      (activeCoefficients.height || activeCoefficients.difficulty || activeCoefficients.surface);

    if (techNoteItems.length > 0 || hasActiveCoeffs) {
      if (currentY + 20 > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = margin;
      }
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(processTextForPDF("Uwagi techniczne — zastosowane wspolczynniki KNR:"), margin, currentY);
      currentY += 5;

      if (hasActiveCoeffs) {
        const parts: string[] = [];
        if (activeCoefficients?.height)     parts.push(processTextForPDF("Praca na wysokosci ×1.25"));
        if (activeCoefficients?.difficulty) parts.push(processTextForPDF("Utrudnienia ×1.22"));
        if (activeCoefficients?.surface)    parts.push(processTextForPDF("Trudne podloze +15%"));
        if (parts.length > 0) {
          doc.setFont("Roboto", "normal");
          doc.setTextColor(146, 64, 14);
          doc.text(parts.join(" | "), margin + 3, currentY);
          currentY += 5;
        }
      }

      for (const item of techNoteItems.slice(0, 8)) {
        if (currentY + 4.5 > pageHeight - bottomMargin) break;
        const noteStr = item.confidence_note ?? "";
        const cableM = noteStr.match(/×([\d.]+)\s*kabel/);
        const surfM  = noteStr.match(/×([\d.]+)\s*pod/);
        const knrM   = noteStr.match(/×([\d.]+)\s*KNR/);
        const parts: string[] = [];
        if (cableM && parseFloat(cableM[1]) > 1) parts.push(processTextForPDF(`kabel ×${cableM[1]}`));
        if (surfM  && parseFloat(surfM[1])  > 1) parts.push(processTextForPDF(`podloze ×${surfM[1]}`));
        if (knrM   && parseFloat(knrM[1])   > 1) parts.push(processTextForPDF(`KNR ×${knrM[1]}`));
        if (parts.length === 0) continue;
        doc.setFont("Roboto", "normal");
        doc.setTextColor(71, 85, 105);
        const label = processTextForPDF(item.name.substring(0, 45));
        doc.text(`${label} — ${parts.join(", ")}`, margin + 3, currentY);
        currentY += 4.5;
      }
      currentY += 4;
    }

    // ============================================
    // ZESTAWIENIE ZBIORCZE M/R/S (per section — only when ≥2 sections)
    // ============================================
    const adjustmentMultiplier = 1 + adjustmentPercentage / 100;
    {
      const sectionMap = new Map<string, { mat: number; lab: number; eq: number }>();
      const parentIds = new Set(
        items.filter(i => i.is_assembly_child).map(i => i.parent_assembly_id).filter(Boolean)
      );
      for (const item of items) {
        if (item.is_assembly_child) continue;
        const sec = item.section || "Inne pozycje";
        const prev = sectionMap.get(sec) ?? { mat: 0, lab: 0, eq: 0 };
        if (parentIds.has(item.id)) {
          const children = items.filter(c => c.is_assembly_child && c.parent_assembly_id === item.id);
          for (const c of children) {
            prev.mat += (project.materials_owned_by_customer ? 0 : (c.final_material_price ?? c.material_price ?? 0) * c.quantity) * adjustmentMultiplier;
            prev.lab += (c.final_labor_price ?? c.labor_price ?? 0) * c.quantity * adjustmentMultiplier;
          }
        } else {
          prev.mat += (project.materials_owned_by_customer ? 0 : (item.final_material_price ?? item.material_price ?? 0) * item.quantity) * adjustmentMultiplier;
          prev.lab += (item.final_labor_price ?? item.labor_price ?? 0) * item.quantity * adjustmentMultiplier;
          prev.eq += (item.equipment_price ?? 0) * item.quantity;
        }
        sectionMap.set(sec, prev);
      }

      const sections = Array.from(sectionMap.entries());
      const hasEquipmentInSections = sections.some(([, v]) => v.eq > 0);

      if (sections.length >= 2) {
        const rowH = 6;
        const tableHeight = 14 + sections.length * rowH + rowH + 4;
        if (currentY + tableHeight > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = margin;
        }

        doc.setFontSize(10);
        doc.setFont("Roboto", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text(processTextForPDF("ZESTAWIENIE ZBIORCZE M/R/S"), margin, currentY);
        currentY += 7;

        const colW = (pageWidth - 2 * margin) / (hasEquipmentInSections ? 5 : 4);
        const cols = {
          name: margin,
          mat:  margin + colW,
          lab:  margin + 2 * colW,
          eq:   hasEquipmentInSections ? margin + 3 * colW : 0,
          tot:  hasEquipmentInSections ? margin + 4 * colW : margin + 3 * colW,
        };

        // Header row
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, currentY - 4, pageWidth - 2 * margin, rowH + 1, 1, 1, "F");
        doc.setFontSize(8);
        doc.setFont("Roboto", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(processTextForPDF("Pomieszczenie / Dzial"), cols.name + 2, currentY);
        doc.text("M (mat.)", cols.mat + colW - 4, currentY, { align: "right" });
        doc.text("R (rob.)", cols.lab + colW - 4, currentY, { align: "right" });
        if (hasEquipmentInSections) doc.text("S (sprz.)", cols.eq + colW - 4, currentY, { align: "right" });
        doc.text(processTextForPDF("Razem"), cols.tot + colW - 4, currentY, { align: "right" });
        currentY += rowH;

        let secTotMat = 0, secTotLab = 0, secTotEq = 0;
        for (let idx = 0; idx < sections.length; idx++) {
          const [name, v] = sections[idx];
          const tot = v.mat + v.lab + v.eq;
          secTotMat += v.mat; secTotLab += v.lab; secTotEq += v.eq;

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY - 4, pageWidth - 2 * margin, rowH, "F");
          }
          doc.setFont("Roboto", "normal");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text(processTextForPDF(name.substring(0, 38)), cols.name + 2, currentY);
          doc.setTextColor(146, 64, 14);
          doc.text(formatCurrency(v.mat), cols.mat + colW - 4, currentY, { align: "right" });
          doc.setTextColor(6, 78, 59);
          doc.text(formatCurrency(v.lab), cols.lab + colW - 4, currentY, { align: "right" });
          if (hasEquipmentInSections) {
            doc.setTextColor(88, 28, 135);
            doc.text(formatCurrency(v.eq), cols.eq + colW - 4, currentY, { align: "right" });
          }
          doc.setFont("Roboto", "bold");
          doc.setTextColor(37, 99, 235);
          doc.text(formatCurrency(tot), cols.tot + colW - 4, currentY, { align: "right" });
          currentY += rowH;
        }

        // Totals row
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(margin, currentY - 4, pageWidth - 2 * margin, rowH + 1, 1, 1, "F");
        doc.setFont("Roboto", "bold");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(processTextForPDF("RAZEM NETTO"), cols.name + 2, currentY);
        doc.setTextColor(146, 64, 14);
        doc.text(formatCurrency(secTotMat), cols.mat + colW - 4, currentY, { align: "right" });
        doc.setTextColor(6, 78, 59);
        doc.text(formatCurrency(secTotLab), cols.lab + colW - 4, currentY, { align: "right" });
        if (hasEquipmentInSections) {
          doc.setTextColor(88, 28, 135);
          doc.text(formatCurrency(secTotEq), cols.eq + colW - 4, currentY, { align: "right" });
        }
        doc.setTextColor(37, 99, 235);
        doc.text(formatCurrency(secTotMat + secTotLab + secTotEq), cols.tot + colW - 4, currentY, { align: "right" });
        currentY += rowH + 8;
      }
    }

    // ============================================
    // FINANCIAL SUMMARY BLOCK
    // ============================================
    const equipmentSubtotal = items.reduce(
      (sum, item) => sum + (item.equipment_price ?? 0) * item.quantity, 0
    );
    const subtotal = materialSubtotal + laborSubtotal;
    const baseSubtotal = subtotal / adjustmentMultiplier;
    const adjustmentAmount = subtotal - baseSubtotal;
    const vatAmount = (subtotal * project.vat_rate) / 100;
    const grandTotal = subtotal + vatAmount;

    const hasAdjustment = adjustmentPercentage !== 0;
    const hasEquipment = equipmentSubtotal > 0;
    const showLaborHours = project.show_labor_hours_in_pdf === true && totalLaborHours > 0;
    const summaryLinesCount = 2 + (hasEquipment ? 1 : 0) + (hasAdjustment ? 2 : 0) + 2 + (showLaborHours ? 1 : 0);
    const summaryHeight = 16 + summaryLinesCount * 6 + 18;
    if (currentY + summaryHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(11);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text(
      processTextForPDF("PODSUMOWANIE FINANSOWE"),
      pageWidth - margin,
      currentY,
      { align: "right" }
    );
    currentY += 8;

    const summaryX = pageWidth - margin - 80;
    const summaryWidth = 80;
    let summaryY = currentY;
    const boxHeight = 16 + summaryLinesCount * 6 + 10;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(summaryX, summaryY, summaryWidth, boxHeight, 3, 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(summaryX, summaryY, summaryWidth, boxHeight, 3, 3, "S");
    summaryY += 7;

    // M — Materials
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(146, 64, 14);
    doc.text(processTextForPDF("M — Materialy:"), summaryX + 4, summaryY);
    doc.setFont("Roboto", "bold");
    doc.text(formatCurrency(materialSubtotal), summaryX + summaryWidth - 4, summaryY, { align: "right" });
    summaryY += 6;

    // R — Labor
    doc.setFont("Roboto", "normal");
    doc.setTextColor(6, 78, 59);
    doc.text(processTextForPDF("R — Robocizna:"), summaryX + 4, summaryY);
    doc.setFont("Roboto", "bold");
    doc.text(formatCurrency(laborSubtotal), summaryX + summaryWidth - 4, summaryY, { align: "right" });
    summaryY += 6;

    // Σ RBH — total labor hours (only when show_labor_hours_in_pdf)
    if (showLaborHours) {
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70);
      doc.text(processTextForPDF("\u03a3 Rbh robocizna:"), summaryX + 4, summaryY);
      doc.setFont("Roboto", "bold");
      doc.text(`${totalLaborHours.toFixed(2)} rbh`, summaryX + summaryWidth - 4, summaryY, { align: "right" });
      doc.setFontSize(9);
      summaryY += 6;
    }

    // S — Equipment (only if exists)
    if (hasEquipment) {
      doc.setFont("Roboto", "normal");
      doc.setTextColor(88, 28, 135);
      doc.text(processTextForPDF("S — Sprzet:"), summaryX + 4, summaryY);
      doc.setFont("Roboto", "bold");
      doc.text(formatCurrency(equipmentSubtotal), summaryX + summaryWidth - 4, summaryY, { align: "right" });
      summaryY += 6;
    }
    summaryY += 2;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(summaryX + 4, summaryY, summaryX + summaryWidth - 4, summaryY);
    summaryY += 7;

    if (hasAdjustment) {
      doc.setFontSize(9);
      doc.setFont("Roboto", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(processTextForPDF("Suma bazowa:"), summaryX + 4, summaryY);
      doc.text(formatCurrency(baseSubtotal), summaryX + summaryWidth - 4, summaryY, { align: "right" });
      summaryY += 6;

      const adjustmentLabel =
        adjustmentPercentage < 0
          ? processTextForPDF(`Rabat (${adjustmentPercentage.toFixed(1)}%):`)
          : processTextForPDF(`Korekta (${adjustmentPercentage > 0 ? "+" : ""}${adjustmentPercentage.toFixed(1)}%):`);
      const adjustmentColor: [number, number, number] =
        adjustmentPercentage < 0 ? [34, 197, 94] : [37, 99, 235];

      doc.setFontSize(9);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(...adjustmentColor);
      doc.text(adjustmentLabel, summaryX + 4, summaryY);
      doc.text(
        (adjustmentAmount >= 0 ? "+" : "") + formatCurrency(adjustmentAmount),
        summaryX + summaryWidth - 4,
        summaryY,
        { align: "right" }
      );
      summaryY += 8;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(summaryX + 4, summaryY, summaryX + summaryWidth - 4, summaryY);
      summaryY += 7;
    }

    // Net total
    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(processTextForPDF("Razem Netto:"), summaryX + 4, summaryY);
    doc.setFont("Roboto", "bold");
    doc.text(formatCurrency(subtotal), summaryX + summaryWidth - 4, summaryY, { align: "right" });
    summaryY += 7;

    // VAT
    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.text(
      processTextForPDF(`Kwota VAT (${project.vat_rate}%):`),
      summaryX + 4,
      summaryY
    );
    doc.setFont("Roboto", "bold");
    doc.text(formatCurrency(vatAmount), summaryX + summaryWidth - 4, summaryY, { align: "right" });
    summaryY += 10;

    // Brutto total
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(summaryX + 2, summaryY - 5, summaryWidth - 4, 12, 2, 2, "F");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(processTextForPDF("Suma BRUTTO:"), summaryX + 4, summaryY);
    doc.text(formatCurrency(grandTotal), summaryX + summaryWidth - 4, summaryY, { align: "right" });

    // ============================================
    // FOOTER ON ALL PAGES
    // ============================================
    const totalPages = (
      doc as unknown as { internal: { getNumberOfPages(): number } }
    ).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPageFooter(doc, pageWidth, pageHeight, profile);
    }

    const safeProjectName = processTextForPDF(project.name)
      .replace(/[^a-zA-Z0-9\s]/g, "_")
      .substring(0, 30);
    const fileName = `Kosztorys_${safeProjectName}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || "Unknown error";
    logger.error("PDF Generation Error:", {}, error);
    throw new Error(`Błąd generowania PDF: ${errorMessage}`);
  }
}
