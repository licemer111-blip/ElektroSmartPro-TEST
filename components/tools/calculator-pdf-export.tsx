"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getProfileForPdfHeader } from "@/app/dashboard/projects/[id]/document-actions";

export interface PdfInputRow {
  label: string;
  value: string;
}

export interface PdfResultRow {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}

interface CalculatorPdfExportProps {
  title: string;
  inputs: PdfInputRow[];
  results: PdfResultRow[];
  notes?: string;
  standard?: string;
  isPro?: boolean;
}

export function CalculatorPdfExport({
  title,
  inputs,
  results,
  notes,
  standard,
  isPro = true,
}: CalculatorPdfExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Dynamic import to avoid SSR issues and reduce bundle
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Try loading Roboto for Polish chars
      let hasFont = false;
      try {
        const fontUrl =
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
        const res = await fetch(fontUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
          doc.addFileToVFS("Roboto-Regular.ttf", base64);
          doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
          doc.setFont("Roboto");
          hasFont = true;
        }
      } catch {
        doc.setFont("helvetica");
      }

      const s = (text: string) => {
        if (hasFont) return text;
        const map: Record<string, string> = {
          ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
          Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
        };
        return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => map[ch] || ch);
      };

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 15;

      // Fetch user profile for header branding
      const profile = await getProfileForPdfHeader();

      // Header bar (tall, matching panel configurator style)
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageW, 40, "F");

      // Left: Calculator title
      const fontFn = () => { if (hasFont) doc.setFont("Roboto"); else doc.setFont("helvetica"); };
      fontFn();
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text(s(title).toUpperCase(), margin, 13);

      // Left: Standard
      if (standard) {
        doc.setFontSize(9);
        doc.setTextColor(200, 215, 255);
        doc.text(s(standard), margin, 20);
      }

      // Left: Date
      doc.setFontSize(8);
      doc.setTextColor(180, 200, 255);
      doc.text(new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }), margin, 27);

      // Right: Company branding (matching panel configurator PDF)
      fontFn();
      let rightY = 10;
      const companyName = s(profile?.companyName || "");
      const personName = s(profile?.fullName || "");

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
      } else {
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text("ElektroSmart PRO", pageW - margin, rightY, { align: "right" });
        rightY += 5;
      }

      doc.setFontSize(7.5);
      doc.setTextColor(200, 215, 255);
      if (profile?.nip) { doc.text(s(`NIP: ${profile.nip}`), pageW - margin, rightY, { align: "right" }); rightY += 4; }
      const calcAddr = [profile?.street, profile?.postal_code && profile?.city ? `${profile.postal_code} ${profile.city}` : (profile?.city || profile?.postal_code)].filter(Boolean).join(", ") || profile?.address || "";
      if (calcAddr) { doc.text(s(calcAddr), pageW - margin, rightY, { align: "right" }); rightY += 4; }
      if (profile?.phone) { doc.text(s(`Tel: ${profile.phone}`), pageW - margin, rightY, { align: "right" }); rightY += 4; }
      if (profile?.email) { doc.text(profile.email, pageW - margin, rightY, { align: "right" }); rightY += 4; }

      if (!isPro) {
        doc.setFontSize(10);
        doc.setTextColor(255, 180, 180);
        doc.text("WERSJA DEMO", pageW - margin, 36, { align: "right" });
      }

      y = 46;

      // Inputs table
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text(s("Parametry wejściowe"), 14, y);
      y += 2;

      doc.autoTable({
        startY: y,
        head: [[s("Parametr"), s("Wartość")]],
        body: inputs.map((row) => [s(row.label), s(row.value)]),
        theme: "striped",
        headStyles: {
          fillColor: [241, 245, 249], // slate-100
          textColor: [30, 41, 59],
          fontStyle: "bold",
          font: hasFont ? "Roboto" : "helvetica",
        },
        bodyStyles: {
          textColor: [51, 65, 85],
          font: hasFont ? "Roboto" : "helvetica",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      y = doc.lastAutoTable.finalY + 8;

      // Results table
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(s("Wyniki obliczeń"), 14, y);
      y += 2;

      doc.autoTable({
        startY: y,
        head: [[s("Parametr"), s("Wartość"), s("Jednostka")]],
        body: results.map((row) => [s(row.label), isPro ? s(row.value) : '***', s(row.unit || "")]),
        theme: "striped",
        headStyles: {
          fillColor: [30, 64, 175], // blue-800
          textColor: [255, 255, 255],
          fontStyle: "bold",
          font: hasFont ? "Roboto" : "helvetica",
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          font: hasFont ? "Roboto" : "helvetica",
        },
        alternateRowStyles: { fillColor: [239, 246, 255] }, // blue-50
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: (data) => {
          // Highlight important results
          if (data.section === "body") {
            const rowResult = results[data.row.index];
            if (rowResult?.highlight) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [30, 64, 175];
            }
          }
        },
      });

      y = doc.lastAutoTable.finalY + 8;

      // Notes
      if (notes) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        const noteLines = doc.splitTextToSize(s(notes), pageW - 28);
        doc.text(noteLines, 14, y);
        y += noteLines.length * 4 + 4;
      }

      // Footer (matching panel configurator PDF style)
      const footerY = doc.internal.pageSize.getHeight() - 12;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageW - margin, footerY);
      fontFn();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      // Left: company info
      if (companyName) {
        const nipStr = profile?.nip ? `  |  NIP: ${s(profile.nip)}` : "";
        doc.text(s(companyName) + nipStr, margin, footerY + 4);
        const contactParts = [profile?.phone ? s(`Tel: ${profile.phone}`) : "", profile?.email || ""].filter(Boolean);
        if (contactParts.length > 0) doc.text(contactParts.join("  |  "), margin, footerY + 8);
      }
      // Right: app branding
      doc.text(s("Wygenerowano w ElektroSmart PRO"), pageW - margin, footerY + 4, { align: "right" });
      doc.text(`Data: ${new Date().toLocaleString("pl-PL")}`, pageW - margin, footerY + 8, { align: "right" });

      // Demo watermark
      if (!isPro) {
        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
          doc.setPage(i);
          doc.setFontSize(50);
          doc.setTextColor(200, 200, 200);
          doc.text('WERSJA DEMO', pageW / 2, doc.internal.pageSize.getHeight() / 2, { align: 'center', angle: 45 });
        }
      }

      // Save
      const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      toast.success("PDF został wygenerowany");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Błąd podczas generowania PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-1.5 h-8 px-3 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      {loading ? "PDF..." : "Eksportuj PDF"}
    </Button>
  );
}
