"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-calculator/_parts/KnrRateCalculator.tsx
// Expert Engine pipeline: P1 (custom rate) → P2 (ES-KNR) → AI Expert (on-demand)
// ═══════════════════════════════════════════════════════════════════

import { useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Loader2, BrainCircuit, User, Pencil, Package, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { updateGlobalHourlyRate, updateExpertMode, updateMaterialMultiplier, updateMaterialMargin } from "../actions";
import { useSearchMode } from "@/hooks/use-search-mode";
import type { DataSourceMode } from "@/hooks/use-search-mode";

interface KnrRateCalculatorProps {
  initialRate: number;
  hourlyRate: number;
  setHourlyRate: (v: number) => void;
  hourlyInput: string;
  setHourlyInput: (v: string) => void;
  rateSaved: boolean;
  setRateSaved: (v: boolean) => void;
  useCustomRates: boolean;
  setUseCustomRates: (v: boolean) => void;
  customLaborRate: number | null;
  setCustomLaborRate: (v: number | null) => void;
  materialMultiplier: number;
  setMaterialMultiplier: (v: number) => void;
  materialMargin: number;
  setMaterialMargin: (v: number) => void;
}

export function KnrRateCalculator({
  initialRate, hourlyRate, setHourlyRate, hourlyInput, setHourlyInput,
  rateSaved, setRateSaved, useCustomRates, setUseCustomRates, customLaborRate, setCustomLaborRate,
  materialMultiplier, setMaterialMultiplier, materialMargin, setMaterialMargin,
}: KnrRateCalculatorProps) {
  const { toast } = useToast();
  const [isSaving, startSave] = useTransition();
  const [isSwitching, startSwitch] = useTransition();
  const [isSavingMat, startSaveMat] = useTransition();
  const [isSavingMargin, startSaveMargin] = useTransition();
  const { mode: searchMode, setMode: setSearchMode } = useSearchMode();

  // Sync localStorage searchMode from DB state on first mount
  // (for existing users who had useCustomRates=true before hybrid existed)
  useEffect(() => {
    if (searchMode === "hybrid" && useCustomRates) {
      setSearchMode("own");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive active mode: localStorage searchMode is the single source of truth
  const activeMode: DataSourceMode = searchMode;

  const handleSelectEngine = () => {
    if (activeMode === "engine") return;
    startSwitch(async () => {
      const result = await updateExpertMode(false, null);
      if (result.success) {
        setUseCustomRates(false);
        setCustomLaborRate(null);
        setRateSaved(false);
        setSearchMode("engine");
        window.dispatchEvent(new CustomEvent("custom-mode-changed", { detail: { useCustomRates: false } }));
        toast({ title: "ES-Engine aktywny", description: "Wyceny — normy KNR + Twoja stawka R-G" });
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleSelectOwn = () => {
    if (activeMode === "own") return;
    startSwitch(async () => {
      const val = parseFloat(hourlyInput);
      const rateToUse = isNaN(val) || val < 1 ? hourlyRate : val;
      const result = await updateExpertMode(true, rateToUse);
      if (result.success) {
        setUseCustomRates(true);
        setCustomLaborRate(rateToUse);
        setSearchMode("own");
        window.dispatchEvent(new CustomEvent("custom-mode-changed", { detail: { useCustomRates: true } }));
        toast({ title: "Stawka własna aktywna", description: `${rateToUse} PLN/rbh — Twój katalog ma priorytet nad bazą ES-KNR` });
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleSelectHybrid = () => {
    if (activeMode === "hybrid") return;
    startSwitch(async () => {
      const result = await updateExpertMode(false, null);
      if (result.success) {
        setUseCustomRates(false);
        setCustomLaborRate(null);
        setSearchMode("hybrid");
        window.dispatchEvent(new CustomEvent("custom-mode-changed", { detail: { useCustomRates: false } }));
        toast({ title: "Tryb Hybrydowy aktywny", description: "Priorytet Twoich cen + KNR fallback dla brakujących pozycji" });
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleSaveRate = () => {
    const val = parseFloat(hourlyInput);
    if (isNaN(val) || val < 1) {
      toast({ title: "Nieprawidłowa stawka", description: "Stawka musi być liczbą > 0", variant: "destructive" });
      return;
    }
    startSave(async () => {
      const rateResult = await updateGlobalHourlyRate(val);
      if (!rateResult.success) {
        toast({ title: "Błąd", description: rateResult.error, variant: "destructive" });
        return;
      }
      setHourlyRate(val);
      setRateSaved(true);
      if (useCustomRates) {
        const modeResult = await updateExpertMode(true, val);
        if (modeResult.success) setCustomLaborRate(val);
      }
      const recalc = rateResult.recalculated;
      const recalcDesc = recalc && (recalc.catalog > 0 || recalc.assemblies > 0)
        ? `${val} PLN/rbh · Przeliczono: ${recalc.catalog} pozycji katalogu, ${recalc.assemblies} poz. zestawów`
        : `${val} PLN/rbh`;
      toast({ title: "✅ Stawka zapisana", description: recalcDesc });
    });
  };

  const borderColor =
    activeMode === "own" ? "border-violet-300 dark:border-violet-700" :
    activeMode === "hybrid" ? "border-blue-300 dark:border-blue-700" :
    "border-orange-200 dark:border-orange-800/50";

  const badgeStyle =
    activeMode === "own"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-300"
      : activeMode === "hybrid"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300"
      : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300";

  const badgeLabel =
    activeMode === "own" ? "Własna Baza" :
    activeMode === "hybrid" ? "Tryb Hybrydowy" :
    "ES-Engine";

  const iconBg =
    activeMode === "own" ? "bg-gradient-to-br from-violet-500 to-purple-600" :
    activeMode === "hybrid" ? "bg-gradient-to-br from-blue-500 to-cyan-600" :
    "bg-gradient-to-br from-orange-400 to-amber-500";

  return (
    <Card className={`border-2 shadow-md transition-all ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Clock className="w-4 h-4 text-white" />
            </div>
            Stawka Robocizny R-G
          </CardTitle>
          <Badge className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${badgeStyle}`}>
            {badgeLabel}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Wybierz źródło stawki robocizny używanej do kalkulacji kosztorysów
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ══ Mode toggle ─ 3 cards ═══════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">

          {/* ES-Engine */}
          <button
            onClick={handleSelectEngine}
            disabled={isSwitching || activeMode === "engine"}
            className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeMode === "engine"
                ? "bg-white dark:bg-slate-900 shadow-sm text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            {isSwitching && activeMode !== "engine" && <Loader2 className="w-3.5 h-3.5 animate-spin absolute top-1.5 right-1.5 text-slate-400" />}
            <BrainCircuit className={`w-5 h-5 ${activeMode === "engine" ? "text-orange-500" : "text-slate-400"}`} />
            <span className="text-[11px] font-semibold leading-tight text-center">ES-Engine 2026</span>
            <span className="text-[9px] text-slate-400 leading-tight text-center">Stawka KNR</span>
            {activeMode === "engine" && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />}
          </button>

          {/* Tryb Hybrydowy */}
          <button
            onClick={handleSelectHybrid}
            disabled={isSwitching || activeMode === "hybrid"}
            className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeMode === "hybrid"
                ? "bg-white dark:bg-slate-900 shadow-sm text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            {isSwitching && activeMode !== "hybrid" && <Loader2 className="w-3.5 h-3.5 animate-spin absolute top-1.5 right-1.5 text-slate-400" />}
            <Zap className={`w-5 h-5 ${activeMode === "hybrid" ? "text-blue-500" : "text-slate-400"}`} />
            <span className="text-[11px] font-semibold leading-tight text-center">Hybrydowy</span>
            <span className="text-[9px] text-slate-400 leading-tight text-center">Twój + KNR</span>
            {activeMode === "hybrid" && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>

          {/* Własna Baza */}
          <button
            onClick={handleSelectOwn}
            disabled={isSwitching || activeMode === "own"}
            className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeMode === "own"
                ? "bg-white dark:bg-slate-900 shadow-sm text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            {isSwitching && activeMode !== "own" && <Loader2 className="w-3.5 h-3.5 animate-spin absolute top-1.5 right-1.5 text-slate-400" />}
            <User className={`w-5 h-5 ${activeMode === "own" ? "text-violet-500" : "text-slate-400"}`} />
            <span className="text-[11px] font-semibold leading-tight text-center">Własna Baza</span>
            <span className="text-[9px] text-slate-400 leading-tight text-center">Priorytet cen</span>
            {activeMode === "own" && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />}
          </button>

        </div>

        {/* ══ Mode description ════════════════════════════════════════════ */}
        {activeMode === "engine" && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <BrainCircuit className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
            <span className="text-orange-700 dark:text-orange-300">
              <strong>ES-Engine 2026</strong> — wyceny oparte wyłącznie na normach KNR i Twojej stawce R-G. Wyniki z bazy ES.
            </span>
          </div>
        )}
        {activeMode === "hybrid" && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <Zap className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <span className="text-blue-700 dark:text-blue-300">
              <strong>Tryb Hybrydowy</strong> — Twój katalog ma priorytet (ściśle Twoje ceny), reszta wyceniana przez KNR + stawke R-G. Wyszukiwanie pokazuje oba źródła.
            </span>
          </div>
        )}
        {activeMode === "own" && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
            <User className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
            <span className="text-violet-700 dark:text-violet-300">
              <strong>Własna Baza</strong> — Twoja stawka R-G ma priorytet. Wyszukiwanie pokazuje tylko Twój katalog osobisty.
            </span>
          </div>
        )}

        {/* ══ Rate input — Engine + Hybrid modes ═════════════════════════════ */}
        {(activeMode === "engine" || activeMode === "hybrid") && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="p2-hourly-rate"
                  name="p2-hourly-rate"
                  aria-label="Stawka bazowa R-G (PLN/rbh)"
                  type="number" min={1} max={9999}
                  value={hourlyInput}
                  onChange={(e) => setHourlyInput(e.target.value)}
                  className="pr-16 text-lg font-bold h-11"
                  placeholder={String(hourlyRate)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">PLN/rbh</span>
              </div>
              <Button
                onClick={handleSaveRate}
                disabled={isSaving || hourlyInput === String(hourlyRate)}
                className={`h-11 gap-2 text-white ${
                  activeMode === "hybrid" ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Zapisz
              </Button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Szybkie presety:</p>
              <div className="flex flex-wrap gap-1.5">
                {[70, 85, 100, 120, 150, 180].map((preset) => (
                  <button key={preset}
                    onClick={() => setHourlyInput(String(preset))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      hourlyRate === preset
                        ? activeMode === "hybrid" ? "bg-blue-500 text-white border-blue-500" : "bg-orange-500 text-white border-orange-500"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-400"
                    }`}
                  >{preset} zł</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ Custom rate input — Own mode only ════════════════════════ */}
        {activeMode === "own" && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="p1-hourly-rate"
                  name="p1-hourly-rate"
                  aria-label="Własna stawka R-G (PLN/rbh)"
                  type="number" min={1} max={9999}
                  value={hourlyInput}
                  onChange={(e) => setHourlyInput(e.target.value)}
                  className="pr-16 text-lg font-bold h-11"
                  placeholder="100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">PLN/rbh</span>
              </div>
              <Button
                onClick={handleSaveRate}
                disabled={isSaving || hourlyInput === String(hourlyRate)}
                className="h-11 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Zapisz
              </Button>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Aktualna stawka:</span>
              <span className="text-sm font-bold text-violet-700 dark:text-violet-400">{hourlyRate} PLN/rbh</span>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Szybkie presety:</p>
              <div className="flex flex-wrap gap-1.5">
                {[70, 85, 100, 120, 150, 180].map((preset) => (
                  <button key={preset}
                    onClick={() => setHourlyInput(String(preset))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      hourlyRate === preset
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400"
                    }`}
                  >{preset} zł</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ Material margin (marża) ═══════════════════ */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Marża materiałów</span>
            <span className="text-[10px] text-slate-400 ml-1">(zysk na materiałach)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-32">
              <Input
                id="knr-material-margin"
                name="knr-material-margin"
                aria-label="Marża materiałów %"
                type="number" min={0} max={100} step={1}
                defaultValue={materialMargin}
                key={materialMargin}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setMaterialMargin(v);
                }}
                className="pr-8 text-sm font-mono h-9"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
            </div>
            <Button
              size="sm"
              onClick={() => {
                startSaveMargin(async () => {
                  const result = await updateMaterialMargin(materialMargin);
                  if (result.success) {
                    toast({ title: "✅ Marża zapisana", description: `${materialMargin}% — narzut na materiały zaktualizowany` });
                  } else {
                    toast({ title: "Błąd", description: result.error, variant: "destructive" });
                  }
                });
              }}
              disabled={isSavingMargin}
              className={`h-9 text-xs gap-1.5 text-white ${
                activeMode === "own" ? "bg-violet-600 hover:bg-violet-700" :
                activeMode === "hybrid" ? "bg-blue-500 hover:bg-blue-600" :
                "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isSavingMargin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              Zapisz
            </Button>
            <div className="flex gap-1">
              {[0, 5, 10, 15, 20, 25].map((p) => {
                const isActive = materialMargin === p;
                const activeClass =
                  activeMode === "own" ? "bg-violet-600 text-white border-violet-600" :
                  activeMode === "hybrid" ? "bg-blue-500 text-white border-blue-500" :
                  "bg-orange-500 text-white border-orange-500";
                return (
                  <button key={p}
                    onClick={() => setMaterialMargin(p)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      isActive
                        ? activeClass
                        : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-400`
                    }`}
                  >{p}%</button>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            0% = cena zakupu · 15% = standardowy narzut elektryka · 20–25% = podwyższony
          </p>
        </div>

        {/* ══ Material multiplier ════════════════════════ */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2 mb-2">
            <Package className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Korekta Rynkowa (Inflacja)</span>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-slate-400 hover:text-blue-500 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs">
                      Zmienia “cenę zakupu” w bazie. Użyj 1.08, jeśli ceny w hurtowniach wzrosły o 8% względem norm 2026.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Koryguje ceny bazowe w katalogach KNR (np. wzrost cen miedzi). 1.0 = cena z bazy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-32">
              <Input
                id="knr-material-multiplier"
                name="knr-material-multiplier"
                aria-label="Mnożnik materiałów"
                type="number" min={0.5} max={3.0} step={0.01}
                defaultValue={materialMultiplier}
                key={materialMultiplier}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setMaterialMultiplier(v);
                }}
                className="pr-8 text-sm font-mono h-9"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">×</span>
            </div>
            <Button
              size="sm"
              onClick={() => {
                startSaveMat(async () => {
                  const result = await updateMaterialMultiplier(materialMultiplier);
                  if (result.success) {
                    toast({ title: "✅ Mnożnik zapisany", description: `×${materialMultiplier.toFixed(2)} — ceny materiałów zostaną przeskalowane` });
                  } else {
                    toast({ title: "Błąd", description: result.error, variant: "destructive" });
                  }
                });
              }}
              disabled={isSavingMat}
              className={`h-9 text-xs gap-1.5 text-white ${
                activeMode === "own" ? "bg-violet-600 hover:bg-violet-700" :
                activeMode === "hybrid" ? "bg-blue-500 hover:bg-blue-600" :
                "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isSavingMat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              Zapisz
            </Button>
            <div className="flex gap-1">
              {[1.0, 1.05, 1.08, 1.1, 1.15, 1.2].map((p) => {
                const isActive = Math.abs(materialMultiplier - p) < 0.005;
                const activeClass =
                  activeMode === "own" ? "bg-violet-600 text-white border-violet-600" :
                  activeMode === "hybrid" ? "bg-blue-500 text-white border-blue-500" :
                  "bg-orange-500 text-white border-orange-500";
                const hoverClass =
                  activeMode === "own" ? "hover:border-violet-400" :
                  activeMode === "hybrid" ? "hover:border-blue-400" :
                  "hover:border-orange-400";
                return (
                  <button key={p}
                    onClick={() => setMaterialMultiplier(p)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      isActive
                        ? activeClass
                        : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 ${hoverClass}`
                    }`}
                  >×{p.toFixed(2)}</button>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            ×1.0 = ceny katalogowe bez zmian · ×1.08 = +8% (uwzględnia inflację 2026)
          </p>
        </div>

        {/* ══ Live Formula Preview ════════════════════════ */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Wzór kalkulacji ceny materiału
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              <span className="text-slate-400">[Cena KNR]</span>
              {" × "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">[Mnożnik]</span>
              {" × (1 + "}
              <span className="text-amber-600 dark:text-amber-400 font-semibold">[Marża %]</span>
              {") = "}
              <span className="text-green-700 dark:text-green-400 font-semibold">Cena dla klienta</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Przykład: 
              <span className="text-slate-600 dark:text-slate-300">100 zł</span>
              {" × "}
              <span className="text-blue-600 dark:text-blue-400">{materialMultiplier.toFixed(2)}</span>
              {" × (1 + "}
              <span className="text-amber-600 dark:text-amber-400">{materialMargin}%</span>
              {") = "}
              <span className="text-green-700 dark:text-green-400 font-semibold">
                {(100 * materialMultiplier * (1 + materialMargin / 100)).toFixed(2)} zł
              </span>
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
