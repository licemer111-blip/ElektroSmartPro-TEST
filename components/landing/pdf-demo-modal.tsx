"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateDemoPDF } from "@/lib/utils/pdf-demo-generator";

interface PDFDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFDemoModal({ open, onOpenChange }: PDFDemoModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    clientName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.companyName.trim()) {
      toast.error("Podaj nazwę swojej firmy");
      return;
    }

    if (!formData.clientName.trim()) {
      toast.error("Podaj imię i nazwisko klienta");
      return;
    }

    setIsGenerating(true);

    try {
      // Generate demo PDF
      await generateDemoPDF({
        companyName: formData.companyName,
        clientName: formData.clientName,
      });

      toast.success("PDF wygenerowany!", {
        description: "Sprawdź zakładkę z pobranymi plikami",
      });

      // Reset form and close modal
      setFormData({ companyName: "", clientName: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating demo PDF:", error);
      toast.error("Nie udało się wygenerować PDF", {
        description: "Spróbuj ponownie za chwilę",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Generuj Wzór PDF</DialogTitle>
              <DialogDescription className="mt-1">
                Zobacz, jak będzie wyglądać Twoja oferta
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Demo Mode Badge */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Tryb Demo
                </p>
                <p className="text-xs text-amber-700">
                  Wszystkie ceny będą ukryte (****). Aby wygenerować pełny PDF z cenami, załóż darmowe konto.
                </p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Nazwa Twojej Firmy <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="np. Elektryk Kowalski SP. Z O.O."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              disabled={isGenerating}
              className="h-11"
            />
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">
              Imię i Nazwisko Klienta <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientName"
              placeholder="np. Jan Nowak"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              disabled={isGenerating}
              className="h-11"
            />
            <p className="text-xs text-slate-500">
              Nazwa klienta, dla którego przygotowujesz ofertę
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">Co otrzymasz?</strong> Profesjonalny kosztorys PDF z Twoim logo (jeśli podasz), 
              przykładowymi pozycjami (kable, gniazda, rozdzielnice) oraz ukrytymi cenami. 
              Plik będzie zawierał watermark "WERSJA DEMO".
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generuję...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generuj PDF
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
