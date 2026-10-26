"use client";

import { useState, useTransition, useEffect } from "react";
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
  /** Zestaw Engine v2 (2026-05-04): per-project opt-in for Smart Mapping auto-expansion. */
  autoDetectZestawy: boolean;
  isFinal?: boolean;
  isReadOnly?: boolean;
  // live state callbacks (optimistic UI)
  onColorModeChange?: (enabled: boolean) => void;
  onBruttoModeChange?: (enabled: boolean) => void;
  onLaborHoursChange?: (enabled: boolean) => void;
  onKnrChange?: (enabled: boolean) => void;
  onVatRateChange?: (rate: number) => void;
  onAutoDetectZestawyChange?: (enabled: boolean) => void;
}

export function ProjectControlPanel({
  projectId,
  vatRate,
  showKnr,
  bruttoMode,
  expertColoring,
  showLaborHours,
  autoDetectZestawy,
  isFinal = false,
  isReadOnly = false,
  onColorModeChange,
  onBruttoModeChange,
  onLaborHoursChange,
  onKnrChange,
  onVatRateChange,
  onAutoDetectZestawyChange,
}: ProjectControlPanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const brainCtx = useMaterialBrainCtx();

  // ─── Local optimistic state ───────────────────────────────────────────────
  const [localVat, setLocalVat] = useState(vatRate);

  const [localShowKnr, setLocalShowKnr] = useState(showKnr);
  const [localBrutto, setLocalBrutto] = useState(bruttoMode);
  const [localColoring, setLocalColoring] = useState(expertColoring);
  const [localShowRg, setLocalShowRg] = useState(showLaborHours);
  const [localAutoZestawy, setLocalAutoZestawy] = useState(autoDetectZestawy);

  // Sync with external live state (observer/co-pilot mode)
  useEffect(() => { setLocalVat(vatRate); }, [vatRate]);
  useEffect(() => { setLocalShowKnr(showKnr); }, [showKnr]);
  useEffect(() => { setLocalBrutto(bruttoMode); }, [bruttoMode]);
  useEffect(() => { setLocalColoring(expertColoring); }, [expertColoring]);
  useEffect(() => { setLocalShowRg(showLaborHours); }, [showLaborHours]);
  useEffect(() => { setLocalAutoZestawy(autoDetectZestawy); }, [autoDetectZestawy]);

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

  const handleDocSetting = (
    key: "show_knr" | "brutto_mode" | "expert_coloring" | "show_labor_hours_in_pdf" | "auto_detect_zestawy",
    value: boolean
  ) => {
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
    if (key === "auto_detect_zestawy") {
      setLocalAutoZestawy(value);
      onAutoDetectZestawyChange?.(value);
    }
    startTransition(async () => {
      const result = await updateProjectDocSettings(projectId, { [key]: value });
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
        if (key === "show_knr") { setLocalShowKnr(!value); onKnrChange?.(!value); }
        if (key === "brutto_mode") { setLocalBrutto(!value); onBruttoModeChange?.(!value); }
        if (key === "show_labor_hours_in_pdf") { setLocalShowRg(!value); onLaborHoursChange?.(!value); }
        if (key === "expert_coloring") { setLocalColoring(!value); onColorModeChange?.(!value); }
        if (key === "auto_detect_zestawy") { setLocalAutoZestawy(!value); onAutoDetectZestawyChange?.(!value); }
      }
    });
  };

  const seg = (active: boolean) =>
    `h-7 px-2.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${
      active
        ? "bg-blue-600 text-white"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">VAT</span>
        <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
          <button type="button" onClick={() => handleVatToggle(8)} disabled={disabled} className={seg(localVat === 8)} title="8% — mieszkanie">
            8%
          </button>
          <button type="button" onClick={() => handleVatToggle(23)} disabled={disabled} className={seg(localVat === 23)} title="23% — firma, biuro, lokal">
            23%
          </button>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {localVat === 8 ? "mieszkanie" : "firma"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ceny</span>
        <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
          <button type="button" onClick={() => handleDocSetting("brutto_mode", false)} disabled={disabled} className={seg(!localBrutto)} title="Kwoty w tabeli i na PDF bez VAT">
            Netto
          </button>
          <button type="button" onClick={() => handleDocSetting("brutto_mode", true)} disabled={disabled} className={seg(localBrutto)} title="Kwoty w tabeli i na PDF z VAT">
            Brutto
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400">Pokaż</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDocSetting("show_knr", !localShowKnr)}
          title="Kolumna z kodem normy w tabeli i na PDF"
          className={seg(localShowKnr)}
        >
          Norma
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDocSetting("show_labor_hours_in_pdf", !localShowRg)}
          title="Kolumna z godzinami w tabeli i na PDF"
          className={seg(localShowRg)}
        >
          rbh
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDocSetting("expert_coloring", !localColoring)}
          title="Zielony to robocizna, pomarańczowy to materiał"
          className={seg(localColoring)}
        >
          Kolory
        </button>
      </div>

      {isPending && <span className="text-xs text-slate-400">zapisuję...</span>}
    </div>
  );
}
