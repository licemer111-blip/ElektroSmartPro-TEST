import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extended jsPDF types for plugin APIs not in default type definitions
interface JsPDFExtended {
  GState: new (options: { opacity: number }) => object;
  internal: {
    getCurrentPageInfo(): { pageNumber: number };
    getNumberOfPages(): number;
  };
  lastAutoTable: { finalY: number };
}

interface DemoPDFOptions {
  companyName: string;
  clientName: string;
}

/**
 * Sanitize Polish characters to Latin equivalents for stable PDF rendering
 */
function sanitizeText(text: string): string {
  if (!text) return "";
  
  const polishMap: { [key: string]: string } = {
    'ą': 'a', 'Ą': 'A',
    'ć': 'c', 'Ć': 'C',
    'ę': 'e', 'Ę': 'E',
    'ł': 'l', 'Ł': 'L',
    'ń': 'n', 'Ń': 'N',
    'ó': 'o', 'Ó': 'O',
    'ś': 's', 'Ś': 'S',
    'ź': 'z', 'Ź': 'Z',
    'ż': 'z', 'Ż': 'Z'
  };
  
  return text.replace(/[ąĄćĆęĘłŁńŃóÓśŚźŹżŻ]/g, (char) => polishMap[char] || char);
}

/**
 * Format censored price for demo mode
 */
function formatCensoredPrice(): string {
  return "**** zl";
}

/**
 * Format quantity with Polish decimal separator
 */
function formatQuantity(quantity: number): string {
  return quantity.toFixed(2).replace('.', ',');
}

/**
 * Add demo watermark diagonally across the page
 */
function addDemoWatermark(doc: jsPDF, pageWidth: number, pageHeight: number) {
  // Save current graphics state
  doc.saveGraphicsState();
  
  // Set transparency using the correct jsPDF API
  doc.setGState(new (doc as unknown as JsPDFExtended).GState({ opacity: 0.1 }));
  
  // Set font and color
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38); // Red color
  
  // Calculate center and rotation
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  
  // Rotate and add text
  doc.text(
    sanitizeText("WERSJA DEMO"),
    centerX,
    centerY,
    {
      align: "center",
      angle: 45,
    }
  );
  
  // Restore graphics state
  doc.restoreGraphicsState();
}

/**
 * Add footer to every page
 */
function addPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, companyName: string) {
  const margin = 15;
  const footerY = pageHeight - 15;
  
  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);

  // Company info
  doc.text(
    sanitizeText(`Kosztorys przygotowany przez: ${companyName}`),
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  doc.setFontSize(7);
  doc.text(
    `Data wygenerowania: ${new Date().toLocaleString("pl-PL")}`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  // Page numbers
  const pageNumber = (doc as unknown as JsPDFExtended).internal.getCurrentPageInfo().pageNumber;
  const totalPages = (doc as unknown as JsPDFExtended).internal.getNumberOfPages();
  doc.text(
    `Strona ${pageNumber} / ${totalPages}`,
    pageWidth - margin,
    footerY + 4,
    { align: "right" }
  );
}

/**
 * Generate demo PDF with censored prices and watermark
 */
export async function generateDemoPDF({ companyName, clientName }: DemoPDFOptions) {
  // Create PDF document (A4, portrait)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("helvetica", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const bottomMargin = 25;

  let currentY = margin;

  // ============================================
  // HEADER SECTION
  // ============================================
  
  // Company Logo placeholder (simple blue box)
  doc.setFillColor(79, 70, 229); // Indigo
  doc.roundedRect(margin, currentY, 12, 12, 2, 2, "F");
  
  // Zap icon simulation (white "Z")
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("E", margin + 4, currentY + 8);
  
  // Company name (right side)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizeText(companyName.toUpperCase()), margin + 15, currentY + 6);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Profesjonalne kosztorysowanie elektryczne", margin + 15, currentY + 10);
  
  currentY += 20;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 10;

  // ============================================
  // DOCUMENT TITLE (Right aligned, minimalist)
  // ============================================
  
  const docNumber = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/001`;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizeText(`KOSZTORYS OFERTOWY nr ${docNumber}`), pageWidth - margin, currentY, { align: "right" });
  
  currentY += 3;

  // ============================================
  // PROJECT INFO SECTION
  // ============================================
  
  const infoBoxY = currentY;
  const infoBoxHeight = 35;
  
  // Background for info section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, infoBoxY, pageWidth - 2 * margin, infoBoxHeight, 3, 3, "F");
  
  // Left column
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizeText("Inwestycja:"), margin + 5, infoBoxY + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizeText("Instalacja elektryczna - demo"), margin + 5, infoBoxY + 13);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizeText("Klient:"), margin + 5, infoBoxY + 20);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizeText(clientName), margin + 5, infoBoxY + 25);
  
  // Right column
  const rightColX = pageWidth - margin - 60;
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizeText("Data:"), rightColX, infoBoxY + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(new Date().toLocaleDateString("pl-PL"), rightColX, infoBoxY + 13);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("VAT:", rightColX, infoBoxY + 20);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("8% (budowa)", rightColX, infoBoxY + 25);
  
  currentY = infoBoxY + infoBoxHeight + 12;

  // ============================================
  // DEMO ITEMS TABLE
  // ============================================
  
  // Sample items for demo (typical electrical project)
  const demoItems = [
    { name: "Punkt gniazdowy podtynkowy", unit: "kpl", quantity: 15 },
    { name: "Punkt oswietleniowy podtynkowy", unit: "kpl", quantity: 12 },
    { name: "Przewod YDYp 3x2,5 mm2", unit: "m", quantity: 85 },
    { name: "Przewod YDYp 3x1,5 mm2", unit: "m", quantity: 120 },
    { name: "Rozdzielnica naścienna (12-pol)", unit: "szt", quantity: 1 },
    { name: "Wylacznik nadpradowy B16 1P", unit: "szt", quantity: 8 },
    { name: "Wylacznik nadpradowy B10 1P", unit: "szt", quantity: 4 },
    { name: "Wylacznik roznicowy 25A/30mA", unit: "szt", quantity: 2 },
    { name: "Puszka podtynkowa fi 60mm", unit: "szt", quantity: 27 },
    { name: "Korytko kablowe 60x40mm", unit: "m", quantity: 15 },
  ];

  const tableData = demoItems.map((item, index) => [
    String(index + 1),
    sanitizeText(item.name),
    item.unit,
    formatQuantity(item.quantity),
    formatCensoredPrice(), // CENSORED
    formatCensoredPrice(), // CENSORED
  ]);

  // Generate table with censored prices
  autoTable(doc, {
    startY: currentY,
    head: [[
      "Lp.",
      sanitizeText("Nazwa Pozycji"),
      "Jm",
      sanitizeText("Ilosc"),
      sanitizeText("Cena (Netto)"),
      sanitizeText("Wartosc (Netto)")
    ]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 51, 51],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 75, halign: "left" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 35, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: margin, right: margin, bottom: bottomMargin },
    showHead: "everyPage",
    didDrawPage: (data) => {
      // Add watermark and footer to every page
      addDemoWatermark(doc, pageWidth, pageHeight);
      addPageFooter(doc, pageWidth, pageHeight, companyName);
    },
  });

  currentY = (doc as unknown as JsPDFExtended).lastAutoTable.finalY + 10;

  // ============================================
  // FINANCIAL SUMMARY (CENSORED) - Minimalist Style
  // ============================================
  
  // Check if summary fits on current page
  const summaryHeight = 65;
  if (currentY + summaryHeight > pageHeight - bottomMargin) {
    doc.addPage();
    currentY = margin;
    // Add watermark to new page
    addDemoWatermark(doc, pageWidth, pageHeight);
  }

  // Section Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizeText("PODSUMOWANIE FINANSOWE"), pageWidth - margin, currentY, { align: "right" });
  
  currentY += 8;

  // Summary box (right-aligned) - minimalist single box
  const summaryX = pageWidth - margin - 75;
  const summaryWidth = 75;
  let summaryY = currentY;
  const boxHeight = 58;
  
  // Background box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, summaryY, summaryWidth, boxHeight, 3, 3, "F");
  
  // Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryX, summaryY, summaryWidth, boxHeight, 3, 3, "S");

  summaryY += 7;

  // ============================================
  // SPLIT BREAKDOWN: Materials and Labor
  // ============================================

  // Materials Total
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizeText("Suma Materialy:"), summaryX + 4, summaryY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(formatCensoredPrice(), summaryX + summaryWidth - 4, summaryY, { align: "right" });

  summaryY += 6;

  // Labor Total
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizeText("Suma Robocizna:"), summaryX + 4, summaryY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(formatCensoredPrice(), summaryX + summaryWidth - 4, summaryY, { align: "right" });

  summaryY += 8;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(summaryX + 4, summaryY, summaryX + summaryWidth - 4, summaryY);

  summaryY += 7;

  // ============================================
  // NET TOTAL
  // ============================================

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizeText("Razem Netto:"), summaryX + 4, summaryY);
  doc.setFont("helvetica", "bold");
  doc.text(formatCensoredPrice(), summaryX + summaryWidth - 4, summaryY, { align: "right" });

  summaryY += 7;

  // VAT Amount
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(sanitizeText("Kwota VAT (8%):"), summaryX + 4, summaryY);
  doc.setFont("helvetica", "bold");
  doc.text(formatCensoredPrice(), summaryX + summaryWidth - 4, summaryY, { align: "right" });

  summaryY += 10;

  // ============================================
  // SUMA BRUTTO (Bold, larger, highlighted)
  // ============================================

  doc.setFillColor(37, 99, 235); // Blue background (matching main PDF)
  doc.roundedRect(summaryX + 2, summaryY - 5, summaryWidth - 4, 12, 2, 2, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255); // White text
  doc.text(sanitizeText("Suma BRUTTO:"), summaryX + 4, summaryY);
  doc.text(formatCensoredPrice(), summaryX + summaryWidth - 4, summaryY, { align: "right" });

  const grandTotalY = summaryY;

  // ============================================
  // DEMO MODE NOTICE
  // ============================================
  
  currentY = grandTotalY + 15;
  
  // Demo notice box
  doc.setFillColor(254, 252, 232); // Amber-50
  doc.setDrawColor(251, 191, 36); // Amber-400
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 3, 3, "FD");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(146, 64, 14); // Amber-900
  doc.text(sanitizeText("Wersja demonstracyjna"), margin + 5, currentY + 7);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15); // Amber-800
  const noticeText = sanitizeText(
    "To jest wzorcowy dokument wygenerowany w trybie demo. Wszystkie ceny zostaly ukryte. " +
    "Aby wygenerowac pelny kosztorys z cenami, zaloz darmowe konto na elektrosmart.pro"
  );
  
  const splitText = doc.splitTextToSize(noticeText, pageWidth - 2 * margin - 10);
  doc.text(splitText, margin + 5, currentY + 12);

  // Save and download the PDF
  const fileName = `Demo_Kosztorys_${sanitizeText(companyName).replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
  
  return fileName;
}
