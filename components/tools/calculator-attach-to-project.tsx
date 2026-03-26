"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FolderPlus, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getUserProjectsForAttach,
  uploadCalculatorPdfToProject,
  getProfileForPdfHeader,
} from "@/app/dashboard/projects/[id]/document-actions";
import type { PdfInputRow, PdfResultRow } from "./calculator-pdf-export";

interface CalculatorAttachToProjectProps {
  title: string;
  inputs: PdfInputRow[];
  results: PdfResultRow[];
  notes?: string;
  standard?: string;
  isPro?: boolean;
}

export function CalculatorAttachToProject({
  title,
  inputs,
  results,
  notes,
  standard,
  isPro = true,
}: CalculatorAttachToProjectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch projects when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingProjects(true);
    getUserProjectsForAttach()
      .then((p) => {
        setProjects(p);
        if (p.length === 1) setSelectedProjectId(p[0].id);
      })
      .catch(() => toast.error("Nie udało się pobrać listy projektów"))
      .finally(() => setLoadingProjects(false));
  }, [open]);

  /** Generate PDF as base64 string (reuses the same visual style as calculator-pdf-export) */
  const generatePdfBase64 = async (): Promise<string> => {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

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
    doc.setTextColor(71, 85, 105);
    doc.text(s("Parametry wejściowe"), 14, y);
    y += 2;

    doc.autoTable({
      startY: y,
      head: [[s("Parametr"), s("Wartość")]],
      body: inputs.map((row) => [s(row.label), s(row.value)]),
      theme: "striped",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [51, 65, 85],
      },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
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
      body: results.map((row) => [s(row.label), s(row.value), s(row.unit || "")]),
      theme: "striped",
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [30, 41, 59],
      },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Notes
    if (notes) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const noteLines = doc.splitTextToSize(s(notes), pageW - 28);
      doc.text(noteLines, 14, y);
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

    // Return base64
    return doc.output("datauristring").split(",")[1];
  };

  const handleAttach = async () => {
    if (!selectedProjectId) {
      toast.error("Wybierz projekt");
      return;
    }
    setLoading(true);
    try {
      const pdfBase64 = await generatePdfBase64();
      const safeName = title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `Obliczenia_${safeName}_${date}.pdf`;

      const result = await uploadCalculatorPdfToProject(selectedProjectId, pdfBase64, fileName);

      if (result.success) {
        const projectName = projects.find((p) => p.id === selectedProjectId)?.name || "projekt";
        toast.success(`PDF dołączony do projektu "${projectName}"`);
        setOpen(false);
      } else {
        toast.error(result.error || "Nie udało się dołączyć PDF");
      }
    } catch (error) {
      console.error("Attach to project error:", error);
      toast.error("Błąd podczas dołączania PDF do projektu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <FolderPlus className="h-3.5 w-3.5" />
          Dołącz do projektu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dołącz obliczenia do projektu</DialogTitle>
          <DialogDescription>
            PDF z wynikami kalkulatora zostanie zapisany w dokumentach wybranego projektu i
            automatycznie dołączony przy wysyłce oferty emailem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-select">Wybierz projekt</Label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ładowanie projektów...
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Brak dostępnych projektów. Utwórz projekt, aby dołączyć obliczenia.
              </p>
            ) : (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Wybierz projekt..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedProjectId && (
            <div className="flex items-start gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                PDF z obliczeniami <strong>&quot;{title}&quot;</strong> zostanie zapisany w
                dokumentach projektu i automatycznie dołączony do emaila z ofertą.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button
            onClick={handleAttach}
            disabled={loading || !selectedProjectId}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4" />
                Dołącz PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
