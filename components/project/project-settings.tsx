"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, FileText, Calculator, SlidersHorizontal } from "lucide-react";
import type { ProjectWithRelations } from "@/lib/types/database";
import { PDFTemplateInline } from "@/components/project/pdf-template-dialog";
import { useGlobalSettings } from "@/hooks/use-global-settings";

interface ProjectSettingsProps {
  project: ProjectWithRelations;
  isPro: boolean;
}

export function ProjectSettings({ project, isPro }: ProjectSettingsProps) {
  const { priceInputMode, setPriceInputMode, showKnrCoeffsInPdf, setShowKnrCoeffsInPdf } = useGlobalSettings();

  const isFinal = project.status === "final";
  const isArchived = project.status === "archived";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Price Input Mode */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calculator className="w-3.5 h-3.5" />
            Tryb wprowadzania cen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {priceInputMode === "base" ? "Cena bazowa" : "Cena z narzutami"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                📄 Wpływa na widoczność narzutów Kp/Z/Kz w PDF i Excel
              </p>
            </div>
            <Switch
              id="project-price-mode"
              name="project-price-mode"
              aria-label="Tryb wprowadzania cen"
              checked={priceInputMode === "with_narzuty"}
              onCheckedChange={(v) => setPriceInputMode(v ? "with_narzuty" : "base")}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setPriceInputMode("base")}
              className={`p-2 rounded-lg border-2 text-left transition-all ${
                priceInputMode === "base"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="font-semibold mb-0.5">📊 Cena bazowa</div>
              <div className="opacity-75">Bez narzutów (Kp, Z, Kz)</div>
            </button>
            <button
              onClick={() => setPriceInputMode("with_narzuty")}
              className={`p-2 rounded-lg border-2 text-left transition-all ${
                priceInputMode === "with_narzuty"
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="font-semibold mb-0.5">💼 Cena z narzutami</div>
              <div className="opacity-75">Już z Kp, Z, Kz wliczonymi</div>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            ℹ️ Ustawienie lokalne (przeglądarka) — wpływa na podpowiedzi przy edycji cen.
          </p>
        </CardContent>
      </Card>

      {/* PDF Template — inline picker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-3.5 h-3.5" />
            Szablon dokumentu PDF
          </CardTitle>
          <CardDescription className="text-[11px]">Wybierz styl wygenerowanego kosztorysu</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <PDFTemplateInline />
        </CardContent>
      </Card>

      {/* PDF Content Options */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Zawartość PDF
          </CardTitle>
          <CardDescription className="text-[11px]">Co pojawi się w podsumowaniu eksportowanego pliku</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {/* KNR coefficients toggle */}
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Współczynniki KNR
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Pokaż Na wysokości ×1.25, Utrudnienia, Trudne podłoże w PDF
              </p>
            </div>
            <Switch
              id="project-knr-coeff-pdf"
              name="project-knr-coeff-pdf"
              aria-label="Pokaż współczynniki KNR w PDF"
              checked={showKnrCoeffsInPdf}
              onCheckedChange={setShowKnrCoeffsInPdf}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
            ℹ️ Ustawienie lokalne (przeglądarka). Narzuty Kp/Z/Kz sterowane przez tryb cen powyżej.
          </p>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-3.5 h-3.5" />
            Informacje o projekcie
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant={isFinal ? "default" : isArchived ? "secondary" : "outline"}
              className={isFinal ? "bg-green-500" : ""}
            >
              {isFinal ? "Sfinalizowany" : isArchived ? "Zarchiwizowany" : "Szkic"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Utworzono:</span>
            <span>{formatDate(project.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ostatnia aktualizacja:</span>
            <span>{formatDate(project.updated_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID projektu:</span>
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {project.id.slice(0, 8)}...
            </code>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
