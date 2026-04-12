"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGlobalBenchmarks, type GlobalBenchmarks } from "../actions";
import { Settings, DollarSign, Percent, Calculator, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  initialBenchmarks: GlobalBenchmarks;
}

export function SettingsClient({ initialBenchmarks }: Props) {
  const [benchmarks, setBenchmarks] = useState<GlobalBenchmarks>(initialBenchmarks);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    setSaveState("idle");
    startTransition(async () => {
      const result = await updateGlobalBenchmarks(benchmarks);
      if (result.success) {
        setSaveState("success");
        setTimeout(() => setSaveState("idle"), 3000);
      } else {
        setErrorMessage(result.error ?? "Błąd zapisu");
        setSaveState("error");
      }
    });
  };

  const handleInputChange = (field: keyof GlobalBenchmarks, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setBenchmarks((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ustawienia Globalne</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Wskaźniki Kalkulacyjne
          </CardTitle>
          <CardDescription>
            Globalne parametry wpływające na wszystkie wyceny w systemie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KNR 2026 Multiplier */}
          <div className="space-y-3">
            <Label htmlFor="knr-multiplier" className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Współczynnik KNR 2026
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="knr-multiplier"
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={benchmarks.knr_2026_multiplier}
                onChange={(e) => handleInputChange("knr_2026_multiplier", e.target.value)}
                disabled={isPending}
                className="w-32"
              />
              <span className="text-sm text-slate-500">
                Mnożnik norm robocizny KNR (domyślnie: 1.4)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Wartość 1.4 oznacza, że wszystkie normy robocizny są zwiększone o 40% w stosunku do bazowych norm KNR.
              Pozwala to dostosować wyceny do rzeczywistości rynkowej 2026.
            </p>
          </div>

          {/* Base RBH Rate */}
          <div className="space-y-3">
            <Label htmlFor="rbh-rate" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Bazowa Stawka Robocizny
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="rbh-rate"
                type="number"
                step="1"
                min="50"
                max="200"
                value={benchmarks.market_rbh_rate}
                onChange={(e) => handleInputChange("market_rbh_rate", e.target.value)}
                disabled={isPending}
                className="w-32"
              />
              <span className="text-sm text-slate-500">PLN/r-g</span>
            </div>
            <p className="text-xs text-slate-400">
              Podstawowa stawka robocizny dla Polski średniej. Stawka dla konkretnego województwa
              jest mnożona przez współczynnik regionalny.
            </p>
          </div>

          {/* Material Inflation Multiplier */}
          <div className="space-y-3">
            <Label htmlFor="mat-mult" className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-orange-600" />
              Współczynnik Inflacji Materiałów
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="mat-mult"
                type="number"
                step="0.01"
                min="1.0"
                max="2.0"
                value={benchmarks.material_inflation_multiplier}
                onChange={(e) => handleInputChange("material_inflation_multiplier", e.target.value)}
                disabled={isPending}
                className="w-32"
              />
              <span className="text-sm text-slate-500">
                Mnożnik cen materiałów (domyślnie: 1.08 = +8%)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Współczynnik inflacji cen materiałów budowlanych i instalacyjnych.
              Wartość 1.08 oznacza wzrost cen o 8% względem bazowych cen katalogowych.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="min-w-[120px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz zmiany"
              )}
            </Button>

            {saveState === "success" && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Zapisano pomyślnie
              </div>
            )}

            {saveState === "error" && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
            ⚠️ Uwaga
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Zmiana tych parametrów wpływa natychmiast na wszystkie nowe wyceny w systemie.
            Istniejące projekty zachowują swoje indywidualne stawki (ustawione w momencie utworzenia).
            Zalecane jest ostrożne dostosowywanie wartości na podstawie analizy rynku.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
