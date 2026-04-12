"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGlobalBenchmarks } from "../actions";
import { Settings, Calculator, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  initialKnrMultiplier: number;
}

export function SettingsClient({ initialKnrMultiplier }: Props) {
  const [knrMultiplier, setKnrMultiplier] = useState(initialKnrMultiplier);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    setSaveState("idle");
    startTransition(async () => {
      const result = await updateGlobalBenchmarks({ knr_2026_multiplier: knrMultiplier });
      if (result.success) {
        setSaveState("success");
        setTimeout(() => setSaveState("idle"), 3000);
      } else {
        setErrorMessage(result.error ?? "Błąd zapisu");
        setSaveState("error");
      }
    });
  };

  const handleInputChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 1.0) {
      setKnrMultiplier(numValue);
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
            <Calculator className="w-5 h-5 text-emerald-600" />
            Współczynnik KNR 2026
          </CardTitle>
          <CardDescription>
            Globalny mnożnik norm robocizny KNR dla dostosowania do rzeczywistości rynkowej
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
                value={knrMultiplier}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isPending}
                className="w-32"
              />
              <span className="text-sm text-slate-500">
                (domyślnie: 1.4 = +40%)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Wartość 1.4 oznacza, że wszystkie normy robocizny KNR są zwiększone o 40% w stosunku do bazowych norm.
              Pozwala to dostosować wyceny do rzeczywistości rynkowej 2026, ponieważ oryginalne normy KNR są nieaktualne.
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
            Zmiana tego parametru wpływa natychmiast na wszystkie nowe wyceny w systemie.
            Istniejące projekty zachowują swoje indywidualne normy (ustawione w momencie utworzenia).
            Zalecane jest ostrożne dostosowywanie wartości na podstawie analizy rynku.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
