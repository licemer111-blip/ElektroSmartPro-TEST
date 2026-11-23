"use client";

import { useState, useTransition, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateProjectVatRate,
  updateProjectDocSettings,
} from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
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
  regions?: { id: string; name: string; price_modifier: number }[];
  liveRegionId?: string;
  isRegionPending?: boolean;
  onRegionChange?: (regionId: string) => void;
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
  regions = [],
  liveRegionId = "",
  isRegionPending = false,
  onRegionChange,
}: ProjectControlPanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
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
    <div data-tour="tour-doc" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">VAT</span>
        <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
          <button type="button" onClick={() => handleVatToggle(8)} disabled={disabled} className={seg(localVat === 8)} title="8% na całym dokumencie">
            8%
          </button>
          <button type="button" onClick={() => handleVatToggle(23)} disabled={disabled} className={seg(localVat === 23)} title="23% na całym dokumencie">
            23%
          </button>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          niezależnie od typu obiektu
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

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pokaż</span>
        <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
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
      </div>

      {onRegionChange && (
        <div className="relative ml-auto flex-shrink-0" title="Województwo koryguje tylko robociznę">
          <label htmlFor="knr-region-select" className="sr-only">Wybierz województwo</label>
          <select
            id="knr-region-select"
            name="knr_region_select"
            value={liveRegionId || "__none__"}
            onChange={(e) => {
              if (!disabled) onRegionChange(e.target.value === "__none__" ? "" : e.target.value);
            }}
            disabled={disabled || isRegionPending}
            className="appearance-none h-7 pl-6 pr-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[220px]"
          >
            <option value="__none__">Województwo — stawka bazowa</option>
            {regions.map((region) => {
              const pct = Math.round((region.price_modifier - 1) * 100);
              const sign = pct > 0 ? "+" : "";
              const label = pct === 0 ? "baza" : `${sign}${pct}%`;
              return (
                <option key={region.id} value={region.id}>
                  {region.name} ({label})
                </option>
              );
            })}
          </select>
          <MapPin className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          {isRegionPending && (
            <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-slate-400 pointer-events-none" />
          )}
        </div>
      )}

      {isPending && <span className="text-xs text-slate-400">zapisuję...</span>}
    </div>
  );
}
