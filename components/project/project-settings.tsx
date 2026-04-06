"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, SlidersHorizontal, CircleDollarSign, Info } from "lucide-react";
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

      {/* ── SECTION 1: Ceny i narzuty ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CircleDollarSign className="w-4 h-4 text-blue-500" />
            Ceny i narzuty
          </CardTitle>
          <CardDescription className="text-[11px]">
            Jak wyświetlać ceny w kosztorysie i PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Price mode selection — two clear cards */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPriceInputMode("base")}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                priceInputMode === "base"
                  ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${priceInputMode === "base" ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                Cena bazowa
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Narzuty Kp, Z, Kz <strong>nie są wliczone</strong> w cenę pozycji — widoczne osobno
              </p>
            </button>
            <button
              onClick={() => setPriceInputMode("with_narzuty")}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                priceInputMode === "with_narzuty"
                  ? "border-violet-500 bg-violet-50/70 dark:bg-violet-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${priceInputMode === "with_narzuty" ? "text-violet-700 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>
                Z narzutami
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Kp, Z, Kz <strong>wliczone</strong> w cenę — widoczna jedna kwota końcowa
              </p>
            </button>
          </div>

          {/* KNR coefficients toggle */}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="min-w-0">
              <Label htmlFor="knr-coeff-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                Współczynniki KNR w PDF
              </Label>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Na wysokości ×1.25, Utrudnienia, Trudne podłoże
              </p>
            </div>
            <Switch
              id="knr-coeff-toggle"
              checked={showKnrCoeffsInPdf}
              onCheckedChange={setShowKnrCoeffsInPdf}
            />
          </div>

          <div className="flex items-start gap-1.5 px-1">
            <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Ustawienia lokalne (przeglądarka) — dotyczą tylko eksportowanych plików PDF i Excel.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 2: Szablon PDF ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-blue-500" />
            Szablon dokumentu PDF
          </CardTitle>
          <CardDescription className="text-[11px]">
            Styl kolorystyczny generowanego kosztorysu — zmień w dowolnym momencie
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <PDFTemplateInline />
        </CardContent>
      </Card>

      {/* ── SECTION 3: Info o projekcie ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            Informacje o projekcie
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <div className="text-right">
              <Badge
                variant={isFinal ? "default" : isArchived ? "secondary" : "outline"}
                className={isFinal ? "bg-green-500" : ""}
              >
                {isFinal ? "Sfinalizowany" : isArchived ? "Zarchiwizowany" : "Szkic"}
              </Badge>
            </div>
            <span className="text-slate-500 dark:text-slate-400">Utworzono</span>
            <span className="text-right text-slate-800 dark:text-slate-200">{formatDate(project.created_at)}</span>
            <span className="text-slate-500 dark:text-slate-400">Aktualizacja</span>
            <span className="text-right text-slate-800 dark:text-slate-200">{formatDate(project.updated_at)}</span>
            <span className="text-slate-500 dark:text-slate-400">ID</span>
            <div className="text-right">
              <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {project.id.slice(0, 8)}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
