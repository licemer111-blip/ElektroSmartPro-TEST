"use client";

import { useState, useTransition, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, Eye, BookOpen,
  Palette, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/hints/hint-content";
import { useToast } from "@/hooks/use-toast";
import {
  updateProjectVatRate,
  updateProjectDocSettings,
} from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useMaterialBrainCtx } from "@/components/project/_parts/MaterialBrainContext";

interface ProjectControlPanelProps {
  projectId: string;
  vatRate: number;
  showKnr: boolean;
  bruttoMode: boolean;
  expertColoring: boolean;
  showLaborHours: boolean;
  isFinal?: boolean;
  isReadOnly?: boolean;
  // live state callbacks (optimistic UI)
  onColorModeChange?: (enabled: boolean) => void;
  onBruttoModeChange?: (enabled: boolean) => void;
  onLaborHoursChange?: (enabled: boolean) => void;
  onKnrChange?: (enabled: boolean) => void;
  onVatRateChange?: (rate: number) => void;
}

export function ProjectControlPanel({
  projectId,
  vatRate,
  showKnr,
  bruttoMode,
  expertColoring,
  showLaborHours,
  isFinal = false,
  isReadOnly = false,
  onColorModeChange,
  onBruttoModeChange,
  onLaborHoursChange,
  onKnrChange,
  onVatRateChange,
}: ProjectControlPanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const brainCtx = useMaterialBrainCtx();

  // ─── Local optimistic state ───────────────────────────────────────────────
  const [localVat, setLocalVat] = useState(vatRate);

  const [localShowKnr, setLocalShowKnr] = useState(showKnr);
  const [localBrutto, setLocalBrutto] = useState(bruttoMode);
  const [localColoring, setLocalColoring] = useState(expertColoring);
  const [localShowRg, setLocalShowRg] = useState(showLaborHours);

  // Sync with external live state (observer/co-pilot mode)
  useEffect(() => { setLocalVat(vatRate); }, [vatRate]);
  useEffect(() => { setLocalShowKnr(showKnr); }, [showKnr]);
  useEffect(() => { setLocalBrutto(bruttoMode); }, [bruttoMode]);
  useEffect(() => { setLocalColoring(expertColoring); }, [expertColoring]);
  useEffect(() => { setLocalShowRg(showLaborHours); }, [showLaborHours]);

  const disabled = isFinal || isReadOnly || isPending;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleVatToggle = (newVat: number) => {
    if (disabled || newVat === localVat) return;
    setLocalVat(newVat);
    onVatRateChange?.(newVat);
    startTransition(async () => {
      const result = await updateProjectVatRate(projectId, newVat);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
        setLocalVat(localVat);
        onVatRateChange?.(localVat);
      } else {
        notifyDataChanged("vat-changed");
        brainCtx?.refreshBrain();
        toast({ title: `✅ VAT zmieniony na ${newVat}%`, description: newVat === 8 ? "Stawka mieszkaniowa 8%" : "Stawka komercyjna 23%" });
      }
    });
  };

  const handleDocSetting = (key: "show_knr" | "brutto_mode" | "expert_coloring" | "show_labor_hours_in_pdf", value: boolean) => {
    if (disabled) return;
    if (key === "show_knr") {
      setLocalShowKnr(value);
      onKnrChange?.(value);
    }
    if (key === "brutto_mode") {
      setLocalBrutto(value);
      onBruttoModeChange?.(value);
    }
    if (key === "show_labor_hours_in_pdf") {
      setLocalShowRg(value);
      onLaborHoursChange?.(value);
    }
    if (key === "expert_coloring") {
      setLocalColoring(value);
      onColorModeChange?.(value);
    }
    startTransition(async () => {
      const result = await updateProjectDocSettings(projectId, { [key]: value });
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
        if (key === "show_knr") { setLocalShowKnr(!value); onKnrChange?.(!value); }
        if (key === "brutto_mode") { setLocalBrutto(!value); onBruttoModeChange?.(!value); }
        if (key === "show_labor_hours_in_pdf") { setLocalShowRg(!value); onLaborHoursChange?.(!value); }
        if (key === "expert_coloring") { setLocalColoring(!value); onColorModeChange?.(!value); }
      }
    });
  };

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 dark:from-indigo-950/30 dark:to-violet-950/20 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-indigo-100/40 dark:hover:bg-indigo-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white flex-shrink-0">
            <Receipt className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200 tracking-wide uppercase">
            Konfiguracja Projektu i Dokumentacji
          </span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400 hidden sm:flex">
            Pult 5-w-1
          </Badge>
          {isPending && <span className="text-[9px] text-indigo-500 animate-pulse">zapisuję...</span>}
        </div>
        {collapsed
          ? <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
          : <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />}
      </button>

      {!collapsed && (
        <div className="border-t border-indigo-200/60 dark:border-indigo-800/40">
        <div className="px-2 pb-2 grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2">

          {/* 1 — VAT */}
          <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-blue-200 dark:border-blue-800/40">
            <div className="flex items-center gap-1">
              <Receipt className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 truncate">VAT</span>
              <HintTooltip content={HINTS.vatSelector} side="top" iconOnly iconClassName="!w-4 !h-4" />
            </div>
            <div className="grid grid-cols-2 gap-0.5 mt-0.5">
              <button
                onClick={() => handleVatToggle(8)}
                disabled={disabled}
                className={`text-[10px] py-0.5 rounded font-semibold transition-colors ${
                  localVat === 8
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                } disabled:opacity-50`}
              >
                8%
              </button>
              <button
                onClick={() => handleVatToggle(23)}
                disabled={disabled}
                className={`text-[10px] py-0.5 rounded font-semibold transition-colors ${
                  localVat === 23
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                } disabled:opacity-50`}
              >
                23%
              </button>
            </div>
            <p className="text-[8px] text-blue-600/70 leading-tight truncate">
              {localVat === 8 ? "Mieszkaniowy" : "Komercyjny"}
            </p>
          </div>

          {/* 2 — Netto / Brutto */}
          <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-blue-200 dark:border-blue-800/40">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 truncate">Tryb Cen</span>
            </div>
            <div className="grid grid-cols-2 gap-0.5 mt-0.5">
              <button
                onClick={() => handleDocSetting("brutto_mode", false)}
                disabled={disabled}
                className={`text-[10px] py-0.5 rounded font-semibold transition-colors ${
                  !localBrutto
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                } disabled:opacity-50`}
              >
                Netto
              </button>
              <button
                onClick={() => handleDocSetting("brutto_mode", true)}
                disabled={disabled}
                className={`text-[10px] py-0.5 rounded font-semibold transition-colors ${
                  localBrutto
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                } disabled:opacity-50`}
              >
                Brutto
              </button>
            </div>
            <p className="text-[8px] text-blue-600/70 leading-tight truncate">
              Tabela / PDF
            </p>
          </div>

          {/* 3 — Kody KNR */}
          <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-violet-200 dark:border-violet-800/40">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-violet-600 dark:text-violet-400 flex-shrink-0" />
              <span className="text-[9px] font-semibold text-violet-700 dark:text-violet-300 truncate">Kody KNR</span>
              <HintTooltip content={HINTS.columnKnr} side="top" iconOnly iconClassName="!w-4 !h-4" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <Label htmlFor={`knr-toggle-${projectId}`} className="text-[8px] text-violet-600 dark:text-violet-400 cursor-pointer leading-tight">
                {localShowKnr ? "Widoczna" : "Ukryta"}
              </Label>
              <Switch
                id={`knr-toggle-${projectId}`}
                name={`knr-toggle-${projectId}`}
                checked={localShowKnr}
                onCheckedChange={(v) => handleDocSetting("show_knr", v)}
                disabled={disabled}
                className="scale-[0.65] origin-right data-[state=checked]:bg-violet-600"
              />
            </div>
            <p className="text-[8px] text-muted-foreground leading-tight truncate">
              KNR / SEKOCENBUD
            </p>
          </div>

          {/* 4 — Czas pracy (r-g) */}
          <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 truncate">Czas (r-g)</span>
              <HintTooltip content={HINTS.columnTime} side="top" iconOnly iconClassName="!w-4 !h-4" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <Label htmlFor={`rg-toggle-${projectId}`} className="text-[8px] text-emerald-600 dark:text-emerald-400 cursor-pointer leading-tight">
                {localShowRg ? "Widoczny" : "Ukryty"}
              </Label>
              <Switch
                id={`rg-toggle-${projectId}`}
                name={`rg-toggle-${projectId}`}
                checked={localShowRg}
                onCheckedChange={(v) => handleDocSetting("show_labor_hours_in_pdf", v)}
                disabled={disabled}
                className="scale-[0.65] origin-right data-[state=checked]:bg-emerald-600"
              />
            </div>
            <p className="text-[8px] text-muted-foreground leading-tight truncate">
              rbh wg KNR
            </p>
          </div>

          {/* 5 — Expert Coloring */}
          <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-800/40 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-[9px] font-semibold text-indigo-700 dark:text-indigo-300 truncate">Kolory</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <Label htmlFor={`coloring-toggle-${projectId}`} className="text-[8px] text-indigo-600 dark:text-indigo-400 cursor-pointer leading-tight">
                {localColoring ? "Włączone" : "Mono"}
              </Label>
              <Switch
                id={`coloring-toggle-${projectId}`}
                name={`coloring-toggle-${projectId}`}
                checked={localColoring}
                onCheckedChange={(v) => handleDocSetting("expert_coloring", v)}
                disabled={disabled}
                className="scale-[0.65] origin-right data-[state=checked]:bg-indigo-600"
              />
            </div>
            <p className="text-[8px] text-indigo-500/70 leading-tight truncate">
              {localColoring ? "R=ziel · M=pom" : "PDF mono"}
            </p>
          </div>

        </div>
      </div>
      )}
    </div>
  );
}
