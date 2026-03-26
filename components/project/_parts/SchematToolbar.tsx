"use client";
import React, { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Layers, Loader2, Sparkles, XCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PanelSection, PanelTemplate, RailModule, ValidationIssue } from "@/components/project/panel-configurator-types";
import type { SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import { generateSchematWithAI, getAiUsage } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import { SECTION_FEED_LABELS } from "../panel-configurator-helpers";
import type { AiUsageInfo } from "../panel-schemat-tab";
import { BlueprintSelector } from "./BlueprintSelector";

// ─── Categories that participate in readiness checks ───────────────────────────
const CIRCUIT_CATS = new Set(["breaker", "rcbo", "contactor", "motor_control", "timer"]);
const SKIP_CATS    = new Set(["terminal", "consumable", "wiring", "labor", "enclosure", "spd", "monitoring", "automation", "compensation"]);

// ─── Readiness check result ────────────────────────────────────────────────────
interface ReadinessCheck {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

interface SchematReadiness {
  score: number;          // 0–100
  isReady: boolean;
  checks: ReadinessCheck[];
  blockers: string[];     // short messages for tooltip
}

function buildSchematReadiness(
  sections: PanelSection[],
  allCriticalErrors: ValidationIssue[],
): SchematReadiness {
  const checks: ReadinessCheck[] = [];

  // Collect all circuit-type modules across all sections
  const allMods = sections.flatMap(s => s.modules);
  const circuits = allMods.filter(m => CIRCUIT_CATS.has(m.module.category));
  const electricalMods = allMods.filter(m => !SKIP_CATS.has(m.module.category));

  // ── Check 1: Brak błędów konfiguracji ─────────────────────────────────────
  const noErrors = allCriticalErrors.length === 0;
  checks.push({
    id: "no_errors",
    label: "Brak krytycznych błędów konfiguracji",
    ok: noErrors,
    detail: noErrors ? undefined : `${allCriticalErrors.length} błędów — popraw w zakładce Konstruktor`,
  });

  // ── Check 2: Moduły w rozdzielnicy ────────────────────────────────────────
  const hasModules = electricalMods.length > 0;
  checks.push({
    id: "has_modules",
    label: "Rozdzielnica zawiera urządzenia elektryczne",
    ok: hasModules,
    detail: hasModules ? undefined : "Dodaj moduły w zakładce Konstruktor",
  });

  if (circuits.length === 0) {
    // No circuits at all — report as not ready
    checks.push({
      id: "circuit_numbers",
      label: "Numery obwodów przypisane",
      ok: false,
      detail: "Brak obwodów (MCB/RCBO/stycznik) w rozdzielnicy",
    });
    checks.push({
      id: "circuit_labels",
      label: "Opisy obwodów wypełnione",
      ok: false,
      detail: "Brak obwodów do opisania",
    });
    checks.push({
      id: "cable_types",
      label: "Przekroje przewodów przypisane",
      ok: false,
      detail: "Brak obwodów do przypisania przewodów",
    });
    checks.push({
      id: "rcd_coverage",
      label: "Wszystkie RCD mają podłączone MCB",
      ok: true,
    });
  } else {
    // ── Check 3: Numery obwodów ──────────────────────────────────────────────
    const missingNum = circuits.filter(m => !m.circuitNumber);
    const numOk = missingNum.length === 0;
    checks.push({
      id: "circuit_numbers",
      label: `Numery obwodów przypisane (${circuits.length - missingNum.length}/${circuits.length})`,
      ok: numOk,
      detail: numOk ? undefined : `${missingNum.length} obwodów bez numeru`,
    });

    // ── Check 4: Opisy obwodów ───────────────────────────────────────────────
    const missingLabel = circuits.filter(m => !m.label);
    const labelOk = missingLabel.length === 0;
    checks.push({
      id: "circuit_labels",
      label: `Opisy obwodów wypełnione (${circuits.length - missingLabel.length}/${circuits.length})`,
      ok: labelOk,
      detail: labelOk ? undefined : `${missingLabel.length} obwodów bez opisu`,
    });

    // ── Check 5: Przekroje przewodów ─────────────────────────────────────────
    const missingCable = circuits.filter(m => !m.cableType);
    const cableOk = missingCable.length === 0;
    checks.push({
      id: "cable_types",
      label: `Przekroje przewodów przypisane (${circuits.length - missingCable.length}/${circuits.length})`,
      ok: cableOk,
      detail: cableOk ? undefined : `${missingCable.length} obwodów bez przekroju`,
    });

    // ── Check 6: RCD → MCB coverage ──────────────────────────────────────────
    // Only rcd-30 type devices must have direct MCB children.
    // rcd-300/rcd-300-4p (ppoz.) is a top-level blanket device — it sits above
    // rcd-30 groups and intentionally has 0 direct MCB children. Skip it.
    const RCD300_IDS_SET = new Set(["rcd-300", "rcd-300-4p"]);
    let rcdIssues = 0;
    for (const sec of sections) {
      let currentRcd: RailModule | null = null;
      let childCount = 0;
      for (const m of sec.modules) {
        if (m.module.category === "rcd") {
          if (RCD300_IDS_SET.has(m.module.id)) {
            // Close previous rcd-30 group check if open
            if (currentRcd && childCount === 0) rcdIssues++;
            currentRcd = null;
            childCount = 0;
            continue;
          }
          if (currentRcd && childCount === 0) rcdIssues++;
          currentRcd = m;
          childCount = 0;
        } else if (m.module.category === "breaker" && currentRcd) {
          childCount++;
        }
      }
      if (currentRcd && childCount === 0) rcdIssues++;
    }
    const rcdOk = rcdIssues === 0;
    checks.push({
      id: "rcd_coverage",
      label: "Wszystkie RCD mają podłączone MCB",
      ok: rcdOk,
      detail: rcdOk ? undefined : `${rcdIssues} RCD bez podłączonych automatów`,
    });
  }

  const passed   = checks.filter(c => c.ok).length;
  const score    = Math.round((passed / checks.length) * 100);
  const isReady  = checks.every(c => c.ok);
  const blockers = checks.filter(c => !c.ok).map(c => c.detail ?? c.label);

  return { score, isReady, checks, blockers };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SchematToolbarProps {
  sections: PanelSection[];
  allModules: RailModule[];
  allCriticalErrors: ValidationIssue[];
  aiSchematTrees: SectionTree[];
  aiSchematLoading: boolean;
  aiUsageInfo: AiUsageInfo | null;
  completeness: number;
  withNumber: RailModule[];
  withLabel: RailModule[];
  withCable: RailModule[];
  allCircuits: RailModule[];
  setAiSchematTrees: (v: SectionTree[]) => void;
  setAiSchematLoading: (v: boolean) => void;
  setAiUsageInfo: (v: AiUsageInfo | null) => void;
  setAiValidationNotes: (v: string[]) => void;
  applyTemplate: (tpl: PanelTemplate) => void;
  onNavigateToIssue?: (checkId: string) => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SchematToolbar({
  sections, allModules, allCriticalErrors, aiSchematTrees, aiSchematLoading,
  aiUsageInfo, completeness, withNumber, withLabel, withCable, allCircuits,
  setAiSchematTrees, setAiSchematLoading, setAiUsageInfo, setAiValidationNotes, applyTemplate, onNavigateToIssue, toast,
}: SchematToolbarProps) {
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const readiness = buildSchematReadiness(sections, allCriticalErrors);
  const isDisabled = aiSchematLoading || !readiness.isReady;

  const progressColor =
    readiness.score === 100 ? "bg-emerald-500" :
    readiness.score >= 60   ? "bg-amber-400"   :
                              "bg-red-400";

  return (
    <TooltipProvider>
      <>
        <BlueprintSelector
          open={blueprintOpen}
          onOpenChange={setBlueprintOpen}
          onApply={applyTemplate}
        />
        {/* ── Readiness Card ─────────────────────────────────────────────────── */}
        <Card className={`border-2 transition-colors ${readiness.isReady ? "border-emerald-300 dark:border-emerald-700" : "border-blue-200 dark:border-blue-800"}`}>
          <CardContent className="pt-4 pb-3 space-y-3">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Gotowość danych rozdzielnicy</span>
              </div>
              <Badge className={`text-[10px] font-bold ${
                readiness.score === 100
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : readiness.score >= 60
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {readiness.score}%
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${readiness.score}%` }}
              />
            </div>

            {/* Check-list */}
            <div className="grid grid-cols-1 gap-1">
              {readiness.checks.map(check => (
                check.ok ? (
                  <div key={check.id} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{check.label}</span>
                  </div>
                ) : (
                  <button
                    key={check.id}
                    type="button"
                    onClick={() => onNavigateToIssue?.(check.id)}
                    className={`flex items-center gap-2 text-left w-full rounded px-1 py-0.5 -mx-1 transition-colors ${
                      onNavigateToIssue
                        ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 group"
                        : "cursor-default"
                    }`}
                  >
                    <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <span className="text-[11px] leading-tight text-slate-700 dark:text-slate-300 font-medium flex-1">
                      {check.detail ?? check.label}
                    </span>
                    {onNavigateToIssue && (
                      <ArrowRight className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </button>
                )
              ))}
            </div>

            {/* Data counters (collapsed, only when all OK) */}
            {readiness.isReady && allCircuits.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm font-bold text-emerald-600">{withNumber.length}/{allCircuits.length}</p>
                  <p className="text-[9px] text-slate-400">Nr obwodu</p>
                </div>
                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm font-bold text-emerald-600">{withLabel.length}/{allCircuits.length}</p>
                  <p className="text-[9px] text-slate-400">Opis</p>
                </div>
                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm font-bold text-emerald-600">{withCable.length}/{allCircuits.length}</p>
                  <p className="text-[9px] text-slate-400">Przewód</p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* ── Blueprint shortcut button ───────────────────────────────────── */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          onClick={() => setBlueprintOpen(true)}
        >
          <Layers className="w-3.5 h-3.5" />
          Wybierz szablon rozdzielnicy (Blueprint)
        </Button>

        {/* ── AI Generate button row ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span wrapper needed so Tooltip works on disabled button */}
              <span className={isDisabled ? "cursor-not-allowed" : ""}>
                <Button
                  size="sm"
                  className={`gap-1.5 text-white transition-all ${
                    readiness.isReady
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25"
                      : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                  }`}
                  disabled={isDisabled}
                  onClick={async () => {
                    setAiSchematLoading(true);
                    try {
                      const results: SectionTree[] = [];
                      const allNotes: string[] = [];
                      for (const sec of sections) {
                        const mods = sec.modules.map(m => ({
                          uid: m.uid,
                          moduleId: m.module.id,
                          name: m.module.name,
                          namePl: m.module.namePl,
                          category: m.module.category,
                          rating: m.rating || m.module.defaultRating,
                          label: m.label,
                          circuitNumber: m.circuitNumber,
                          cableType: m.cableType,
                          phase: m.phase,
                          modules: m.module.modules,
                        }));
                        const res = await generateSchematWithAI(sec.name, SECTION_FEED_LABELS[sec.feed], mods);
                        if (res.success && res.tree) {
                          results.push(res.tree);
                          if (res.validationNotes?.length) allNotes.push(...res.validationNotes);
                        } else {
                          toast({ title: `Błąd — ${sec.name}`, description: res.error || "Nie udało się wygenerować", variant: "destructive" });
                        }
                      }
                      setAiSchematTrees(results);
                      setAiValidationNotes(allNotes);
                      if (results.length > 0) toast({
                        title: "Schemat wygenerowany z AI",
                        description: `${results.length} sekcji · ${allNotes.length > 0 ? `${allNotes.length} ostrzeżeń` : "brak ostrzeżeń"}`,
                      });
                    } catch {
                      toast({ title: "Błąd AI", description: "Wystąpił błąd podczas generowania", variant: "destructive" });
                    } finally {
                      setAiSchematLoading(false);
                      getAiUsage().then(setAiUsageInfo).catch(() => {});
                    }
                  }}
                >
                  {aiSchematLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analiza obwodów...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Generuj schemat (ES-Engine)</>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {!readiness.isReady && (
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-[11px] font-semibold mb-1">Uzupełnij przed generowaniem:</p>
                <ul className="space-y-0.5">
                  {readiness.blockers.map((b, i) => (
                    <li key={i} className="text-[10px] flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            )}
          </Tooltip>

          {aiSchematTrees.length > 0 && (
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-[10px]">
              ES-Engine · {aiSchematTrees.length} sekcji
            </Badge>
          )}
          {aiUsageInfo && (
            <span className={`ml-auto text-[10px] font-medium ${aiUsageInfo.used >= aiUsageInfo.limit ? "text-red-500" : "text-slate-500"}`}>
              {aiUsageInfo.used}/{aiUsageInfo.limit} zapytań ES-Engine{aiUsageInfo.isPro ? " /mies." : " (demo)"}
            </span>
          )}
        </div>

        {/* ── Validation errors (critical) ──────────────────────────────────── */}
        {allCriticalErrors.length > 0 && (
          <Card className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-red-700 dark:text-red-400">Błędy konfiguracji ({allCriticalErrors.length})</span>
              </div>
              <div className="space-y-1">
                {allCriticalErrors.slice(0, 5).map((err) => (
                  <p key={err.id} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {err.message}
                  </p>
                ))}
                {allCriticalErrors.length > 5 && (
                  <p className="text-xs text-red-500 italic">...i {allCriticalErrors.length - 5} więcej — popraw w zakładce Konstruktor</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    </TooltipProvider>
  );
}
