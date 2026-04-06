"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-calculator/_parts/KnrEngineCalibration.tsx
// Etaż 2: Kalibracja ES-Engine — montaż + autouczenie + czułość
// UI-only, stany lokalne (bez zapisu do DB na tym etapie)
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrainCog, BookMarked, SlidersHorizontal } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MontageMode =
  | "bez_wyboru"
  | "pod_tynkiem"
  | "w_tynku"
  | "w_rurach"
  | "na_wierzchu"
  | "w_korytku"
  | "na_drabince"
  | "ziemny"
  | "sufitowo";
export type MatchSensitivity = "restrykcyjna" | "optymalna" | "elastyczna";

export interface EngineCalibration {
  defaultMontage: MontageMode;
  autoLearning: boolean;
  sensitivity: MatchSensitivity;
}

export const DEFAULT_CALIBRATION: EngineCalibration = {
  defaultMontage: "bez_wyboru",
  autoLearning: true,
  sensitivity: "optymalna",
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const MONTAGE_LABELS: Record<MontageMode, string> = {
  bez_wyboru:  "— Bez wyboru (auto)",
  pod_tynkiem: "Pod tynkiem (p/t)",
  w_tynku:     "W tynku (bruzda)",
  w_rurach:    "W rurach (peszel)",
  na_wierzchu: "Na wierzchu (n/t)",
  w_korytku:   "W korytku kablowym",
  na_drabince: "Na drabince kablowej",
  ziemny:      "Kabel ziemny (wykop)",
  sufitowo:    "Prowadzenie sufitowe",
};

const SENSITIVITY_META: Record<MatchSensitivity, { label: string; hint: string; badgeCls: string }> = {
  restrykcyjna: {
    label: "Restrykcyjna",
    hint: "Tylko dokładne dopasowania — minimum błędów, max precyzja",
    badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  optymalna: {
    label: "Optymalna",
    hint: "Balans — dopasowania ±10% rozmycia (zalecane)",
    badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  elastyczna: {
    label: "Elastyczna",
    hint: "Agresywne wyszukiwanie rozmyte — więcej sugestii, możliwe nadmiarowe wyniki",
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface KnrEngineCalibrationProps {
  calibration: EngineCalibration;
  onChange: (updated: EngineCalibration) => void;
}

export function KnrEngineCalibration({ calibration, onChange }: KnrEngineCalibrationProps) {
  const sensInfo = SENSITIVITY_META[calibration.sensitivity];

  const set = <K extends keyof EngineCalibration>(key: K, value: EngineCalibration[K]) =>
    onChange({ ...calibration, [key]: value });

  return (
    <Card className="border-2 border-violet-100 dark:border-violet-900/40 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <BrainCog className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base leading-tight">Kalibracja Silnika ES-Engine</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Jak dokładnie AI dopasowuje normy KNR do Twoich pozycji — sposób montażu, pamięć i czułość
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* ── Kolumna 1: Domyślny montaż ── */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <Label
                htmlFor="knr-default-montage"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-default"
              >
                Domyślny sposób montażu
              </Label>
            </div>
            <Select
              name="knr-default-montage"
              value={calibration.defaultMontage}
              onValueChange={(v) => set("defaultMontage", v as MontageMode)}
            >
              <SelectTrigger id="knr-default-montage" className="h-9 text-sm bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(MONTAGE_LABELS) as [MontageMode, string][]).map(([val, lbl]) => (
                  <SelectItem key={val} value={val} className="text-sm">
                    {lbl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
              Gdy przedmiar nie podaje sposobu montażu, system użyje tego domyślnego
            </p>
          </div>

          {/* ── Kolumna 2: Autouczenie (Switch) ── */}
          <div className="flex flex-col gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30"
            style={calibration.autoLearning ? {
              borderColor: "rgb(139 92 246 / 0.5)",
              backgroundColor: "rgb(139 92 246 / 0.05)",
            } : {}}
            onClick={() => set("autoLearning", !calibration.autoLearning)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookMarked className={`w-4 h-4 flex-shrink-0 ${calibration.autoLearning ? "text-violet-500" : "text-slate-400"}`} />
                <Label
                  htmlFor="knr-auto-learning"
                  className={`text-xs font-semibold cursor-pointer ${calibration.autoLearning ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                >
                  Pamięć ES-Engine
                </Label>
              </div>
              <Switch
                id="knr-auto-learning"
                name="knr-auto-learning"
                checked={calibration.autoLearning}
                onCheckedChange={(v) => set("autoLearning", v)}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
              System zapamięta Twoje ręczne korekty KNR i zastosuje je automatycznie w przyszłych projektach
            </p>
            <div className="mt-auto">
              {calibration.autoLearning ? (
                <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  Aktywna
                </Badge>
              ) : (
                <span className="text-[10px] text-slate-300 dark:text-slate-600">Wyłączona</span>
              )}
            </div>
          </div>

          {/* ── Kolumna 3: Czułość dopasowania ── */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <Label
                htmlFor="knr-sensitivity"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-default"
              >
                Czułość dopasowania ES-Engine
              </Label>
            </div>
            <Select
              name="knr-sensitivity"
              value={calibration.sensitivity}
              onValueChange={(v) => set("sensitivity", v as MatchSensitivity)}
            >
              <SelectTrigger id="knr-sensitivity" className="h-9 text-sm bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SENSITIVITY_META) as MatchSensitivity[]).map((val) => (
                  <SelectItem key={val} value={val} className="text-sm">
                    {SENSITIVITY_META[val].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
              {sensInfo.hint}
            </p>
            <div className="mt-auto">
              <Badge className={`text-[10px] ${sensInfo.badgeCls}`}>
                {sensInfo.label}
              </Badge>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

// Eksportowany hook-helper do tworzenia stanu z rodzica
export function useEngineCalibration(initial?: Partial<EngineCalibration>) {
  return useState<EngineCalibration>({ ...DEFAULT_CALIBRATION, ...initial });
}
