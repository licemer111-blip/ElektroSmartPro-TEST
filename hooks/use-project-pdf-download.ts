"use client";

import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSettings } from "@/hooks/use-global-settings";
import { joinOfferNotes, splitOfferNotes, type OfferTerms } from "@/lib/offer-terms";

interface UseProjectPdfDownloadOptions {
  projectId: string;
  projectName: string;
  adjustmentPercentage: number;
  colorMode: boolean;
  vatRate: number;
  bruttoMode: boolean;
  initialPdfNotes?: string | null;
}

export function useProjectPdfDownload({
  projectId,
  projectName,
  adjustmentPercentage,
  colorMode,
  vatRate,
  bruttoMode,
  initialPdfNotes,
}: UseProjectPdfDownloadOptions) {
  const { toast } = useToast();
  const { pdfStructure } = useGlobalSettings();
  const initial = splitOfferNotes(initialPdfNotes);

  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfNotes, setPdfNotes] = useState(initial.notes);
  const [offerTerms, setOfferTerms] = useState<OfferTerms>(initial.terms);
  const notesForPdf = useMemo(() => joinOfferNotes(offerTerms, pdfNotes), [offerTerms, pdfNotes]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewName, setPdfPreviewName] = useState("");
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIosSafari(/iPad|iPhone|iPod/.test(ua));
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          priceModifier: adjustmentPercentage,
          showColors: colorMode,
          notes: notesForPdf,
          template:
            typeof window !== "undefined"
              ? localStorage.getItem("elektrosmart-pdf-template") || "klasyczny"
              : "klasyczny",
          vatMode: vatRate,
          bruttoMode,
          pdfStructure,
        }),
      });

      if (!response.ok) {
        let errMsg = "Błąd generowania PDF";
        try { const j = await response.json(); if (j?.error) errMsg = j.error; } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = `Kosztorys_${projectName}_${new Date().getTime()}.pdf`;
      setPdfPreviewUrl(url);
      setPdfPreviewName(fileName);
    } catch (err) {
      const desc = err instanceof Error ? err.message : "Nie udało się pobrać PDF";
      toast({ title: "Błąd", description: desc, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleConfirmPdfDownload = () => {
    if (!pdfPreviewUrl || !pdfPreviewName) return;
    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    a.download = pdfPreviewName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "PDF pobrany!", description: pdfPreviewName });
    handleClosePdfPreview();
  };

  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
    setPdfPreviewName("");
  };

  return {
    isDownloading,
    pdfNotes,
    setPdfNotes,
    offerTerms,
    setOfferTerms,
    notesForPdf,
    pdfPreviewUrl,
    pdfPreviewName,
    isIosSafari,
    handleDownloadPDF,
    handleConfirmPdfDownload,
    handleClosePdfPreview,
  };
}
