"use client";

import { useCallback } from "react";
import type { PanelSection, Manufacturer } from "@/components/project/panel-configurator-types";
import { svgToDxf } from "@/lib/panel-svg-generator";
import { generatePanelPdf } from "@/lib/panel-pdf-generator";
import { cleanupPanelDocuments, uploadSinglePanelFile, getProfileForPdfHeader } from "@/app/dashboard/projects/[id]/document-actions";

export interface UsePanelExportParams {
  isPro: boolean;
  panelName: string;
  projectId: string;
  sections: PanelSection[];
  selectedManufacturer: Manufacturer;
  manufacturerCoeff: number;
  selectedEnclosure: { modules: number; rows: number; name: string; price: number; laborPrice: number };
  totalModules: number;
  grandTotalMaterial: number;
  grandTotalLabor: number;
  railModulesLength: number;
  allModulesLength: number;
  schematSvgRef: React.MutableRefObject<string>;
  handleExportSvg: (opts?: { skipDownload?: boolean }) => Promise<string | undefined>;
  setIsDownloading: (v: boolean) => void;
  setIsExporting: (v: boolean) => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function usePanelExport(p: UsePanelExportParams) {
  const generatePdfDoc = async () => {
    const userProfile = await getProfileForPdfHeader();
    return generatePanelPdf({
      sections: p.sections,
      panelName: p.panelName,
      selectedManufacturer: p.selectedManufacturer,
      manufacturerCoeff: p.manufacturerCoeff,
      selectedEnclosure: p.selectedEnclosure,
      totalModules: p.totalModules,
      grandTotalMaterial: p.grandTotalMaterial,
      grandTotalLabor: p.grandTotalLabor,
      isPro: p.isPro,
      userProfile,
    });
  };

  const handleDownloadDxf = useCallback(async () => {
    if (!p.isPro) {
      p.toast({ title: "Funkcja PRO", description: "Eksport do formatu CAD (DXF) jest dostępny tylko w planie PRO.", variant: "destructive" });
      return;
    }
    if (!p.panelName.trim()) {
      p.toast({ title: "Podaj nazwę rozdzielnicy", description: "Nazwa jest wymagana do wygenerowania DXF", variant: "destructive" });
      return;
    }
    if (p.allModulesLength === 0) return;
    try {
      const svgSource = p.schematSvgRef.current && p.schematSvgRef.current.length > 100
        ? p.schematSvgRef.current
        : await p.handleExportSvg({ skipDownload: true }) ?? "";
      if (!svgSource || svgSource.length < 100) {
        p.toast({ title: "Brak schematu", description: "Wygeneruj schemat przed eksportem DXF", variant: "destructive" });
        return;
      }
      const dxfContent = svgToDxf(svgSource);
      const safeName = p.panelName.trim().replace(/[^a-zA-Z0-9 ._-]/g, "_");
      const blob = new Blob([dxfContent], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rozdzielnica_${safeName}_schemat.dxf`;
      a.click();
      URL.revokeObjectURL(url);
      p.toast({ title: "Pobrano DXF", description: "Schemat CAD zapisany jako DXF" });
    } catch (err) {
      p.toast({ title: "Błąd generowania DXF", description: err instanceof Error ? err.message : "Nieznany błąd", variant: "destructive" });
    }
  }, [p]);

  const handleDownloadPdf = useCallback(async () => {
    if (p.railModulesLength === 0) return;
    if (!p.panelName.trim()) {
      p.toast({ title: "Podaj nazwę rozdzielnicy", description: "Nazwa jest wymagana do wygenerowania PDF", variant: "destructive" });
      return;
    }
    p.setIsDownloading(true);
    try {
      const doc = await generatePdfDoc();
      const safeName = p.panelName.trim().replace(/[^a-zA-Z0-9 ._-]/g, "_");
      doc.save(`Rozdzielnica_${safeName}.pdf`);
      p.toast({ title: "PDF pobrany!", description: "Plik został zapisany na dysku" });
    } catch (err) {
      p.toast({ title: "Błąd generowania PDF", description: err instanceof Error ? err.message : "Nieznany błąd", variant: "destructive" });
    } finally {
      p.setIsDownloading(false);
    }
  }, [p]);

  const handleExportPdf = useCallback(async () => {
    if (p.railModulesLength === 0) return;
    if (!p.panelName.trim()) {
      p.toast({ title: "Podaj nazwę rozdzielnicy", description: "Nazwa jest wymagana do wygenerowania PDF", variant: "destructive" });
      return;
    }
    p.setIsExporting(true);
    try {
      const safeName = p.panelName.trim().replace(/[^a-zA-Z0-9 ._-]/g, "_");
      const uploaded: string[] = [];
      const failed: string[] = [];
      await cleanupPanelDocuments(p.projectId);
      try {
        const doc = await generatePdfDoc();
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const r = await uploadSinglePanelFile(p.projectId, pdfBase64, `Rozdzielnica_${safeName}.pdf`, "application/pdf");
        if (r.success) uploaded.push("PDF"); else failed.push(`PDF: ${r.error}`);
      } catch { failed.push("PDF: generowanie nie powiodło się"); }
      try {
        const svgContent = await p.handleExportSvg({ skipDownload: true });
        if (svgContent && svgContent.length > 100) {
          const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
          const r = await uploadSinglePanelFile(p.projectId, svgBase64, `Rozdzielnica_${safeName}.svg`, "image/svg+xml");
          if (r.success) uploaded.push("SVG"); else failed.push(`SVG: ${r.error}`);
        } else { failed.push("SVG: brak danych wizualizacji"); }
      } catch (e) { failed.push(`SVG: ${e instanceof Error ? e.message : "błąd generowania"}`); }
      if (p.schematSvgRef.current && p.schematSvgRef.current.length > 100) {
        try {
          const schematBase64 = btoa(unescape(encodeURIComponent(p.schematSvgRef.current)));
          const r = await uploadSinglePanelFile(p.projectId, schematBase64, `Rozdzielnica_${safeName}_schemat.svg`, "image/svg+xml");
          if (r.success) uploaded.push("Schemat"); else failed.push(`Schemat: ${r.error}`);
        } catch { failed.push("Schemat: błąd kodowania"); }
      }
      if (p.isPro && p.schematSvgRef.current && p.schematSvgRef.current.length > 100) {
        try {
          const dxfContent = svgToDxf(p.schematSvgRef.current);
          const dxfBase64 = btoa(unescape(encodeURIComponent(dxfContent)));
          const r = await uploadSinglePanelFile(p.projectId, dxfBase64, `Rozdzielnica_${safeName}_schemat.dxf`, "application/dxf");
          if (r.success) uploaded.push("DXF"); else failed.push(`DXF: ${r.error}`);
        } catch { failed.push("DXF: błąd generowania"); }
      }
      if (uploaded.length === 0) {
        p.toast({ title: "Błąd zapisu dokumentów", description: failed.join("; "), variant: "destructive" });
      } else {
        const desc = `${uploaded.join(" + ")} dodane do dokumentów projektu`;
        p.toast({ title: "Dokumenty zapisane!", description: failed.length > 0 ? `${desc} (błędy: ${failed.join("; ")})` : desc });
      }
    } catch (err) {
      p.toast({ title: "Błąd generowania dokumentów", description: err instanceof Error ? err.message : "Nieznany błąd", variant: "destructive" });
    } finally {
      p.setIsExporting(false);
    }
  }, [p]);

  const handleCsvExport = useCallback(() => {
    if (p.allModulesLength === 0) return;
    const catLabels: Record<string, string> = {
      breaker: "Zabezpieczenia nadprądowe", rcd: "Ochrona różnicowa", rcbo: "RCBO",
      switch: "Rozłączniki / SZR", spd: "Ochrona przepięciowa", contactor: "Styczniki / Przekaźniki",
      motor_control: "Napędy / Rozruch", timer: "Sterowanie / Programatory", monitoring: "Pomiar / Monitoring",
      automation: "Automatyka / KNX / BMS", compensation: "Kompensacja mocy biernej",
      terminal: "Złączki / Końcówki", enclosure: "Obudowy / Akcesoria",
      wiring: "Przewody / Okablowanie", consumable: "Materiały montażowe", labor: "Robocizna / Usługi",
    };
    const csvEscape = (s: string) => `"=${JSON.stringify(s)}"`;
    const allMods = p.sections.flatMap((s) => s.modules);
    const rows = allMods.map((m) => [
      csvEscape(m.module.id),
      csvEscape(m.module.namePl),
      csvEscape(catLabels[m.module.category] || m.module.category),
      m.rating ? String(m.rating) : "",
      m.label || "",
      m.circuitNumber ? String(m.circuitNumber) : "",
    ]);
    const header = ["ID modułu", "Nazwa", "Kategoria", "Prąd [A]", "Etykieta", "Nr obwodu"];
    const csvContent = "\uFEFF" + [header.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rozdzielnica_${p.panelName.trim() || "konfiguracja"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    p.toast({ title: "Wyeksportowano CSV", description: `${allMods.length} urządzeń` });
  }, [p]);

  return {
    handleDownloadDxf,
    handleDownloadPdf,
    handleExportPdf,
    handleCsvExport,
  };
}
