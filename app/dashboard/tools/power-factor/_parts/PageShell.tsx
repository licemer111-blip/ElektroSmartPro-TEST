"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Zap, Lightbulb, Info, TrendingUp } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { PowerFactorParams, calculatePowerFactor } from "../_lib/engine";

const DEFAULT: PowerFactorParams = {
  activePower: "", currentPF: "0.70", targetPF: "0.95",
  voltage: "400", tariff: "0.65", penaltyRate: "0.15",
};

export function PowerFactorCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [p, setP] = useState<PowerFactorParams>(DEFAULT);
  const set = (field: keyof PowerFactorParams, value: string) => setP((prev) => ({ ...prev, [field]: value }));

  const canCalc = !!p.activePower && parseFloat(p.activePower) > 0;
  const result = canCalc ? calculatePowerFactor(p) : null;

  const pdfInputs = [
    { label: "Moc czynna", value: `${p.activePower} kW` },
    { label: "Obecny cos φ", value: p.currentPF },
    { label: "Docelowy cos φ", value: p.targetPF },
    { label: "Napięcie", value: `${p.voltage} V` },
  ];
  const pdfResults = result ? [
    { label: "Moc bat. kondensatorów", value: result.recommendedCapacitor.toString(), unit: "kvar", highlight: true },
    { label: "Wymagana moc Qc", value: result.requiredCapacitorPower.toFixed(1), unit: "kvar" },
    { label: "Oszczędności miesięczne", value: result.monthlySavings.toFixed(0), unit: "PLN" },
    { label: "Zwrot inwestycji", value: result.paybackMonths.toFixed(0), unit: "mies." },
  ] : [];

  const handleReset = () => setP(DEFAULT);

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator kompensacji mocy biernej">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shadow-md">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Kompensacja mocy biernej
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Dobór baterii kondensatorów wg PN-EN 61921
            </p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-violet-600 dark:text-violet-400" />
          <AlertTitle className="text-sm md:text-base text-violet-900 dark:text-violet-100 font-semibold">
            Obliczenie Qc = P × (tan φ₁ − tan φ₂)
          </AlertTitle>
          <AlertDescription className="text-violet-800 dark:text-violet-300 mt-1 text-xs md:text-sm">
            Kalkulator dobiera moc baterii kondensatorów i szacuje zwrot inwestycji.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-violet-50/50 dark:from-slate-900 dark:to-violet-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Parametry obiektu</CardTitle>
              <CardDescription className="text-xs md:text-sm">Dane elektryczne instalacji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="space-y-2">
                <Label htmlFor="pf-active-power">Moc czynna (kW)</Label>
                <Input id="pf-active-power" name="pf-active-power" type="number" value={p.activePower} onChange={(e) => set("activePower", e.target.value)}
                  className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 100" />
              </div>

              <div className="space-y-2">
                <Label id="pf-voltage-label">Napięcie zasilania (V)</Label>
                <div role="group" aria-labelledby="pf-voltage-label" className="flex gap-2">
                  {["400", "230"].map((v) => (
                    <button key={v} onClick={() => set("voltage", v)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        p.voltage === v ? "bg-violet-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                      {v}V {v === "400" ? "(3-fazy)" : "(1-faza)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pf-current">Obecny cos φ₁</Label>
                  <Input id="pf-current" name="pf-current" type="number" step="0.01" min="0.3" max="1" value={p.currentPF}
                    onChange={(e) => set("currentPF", e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-target">Docelowy cos φ₂</Label>
                  <Input id="pf-target" name="pf-target" type="number" step="0.01" min="0.5" max="1" value={p.targetPF}
                    onChange={(e) => set("targetPF", e.target.value)} className="h-9 text-xs" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">💰 Analiza ekonomiczna</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pf-tariff" className="text-[10px]">Taryfa (PLN/kWh)</Label>
                    <Input id="pf-tariff" name="pf-tariff" type="number" step="0.05" value={p.tariff}
                      onChange={(e) => set("tariff", e.target.value)} className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="pf-penalty" className="text-[10px]">Kara za cos φ (‰)</Label>
                    <Input id="pf-penalty" name="pf-penalty" type="number" step="0.01" value={p.penaltyRate}
                      onChange={(e) => set("penaltyRate", e.target.value)} className="h-8 text-xs mt-1" />
                  </div>
                </div>
              </div>

              <CalculatorActionBar
                calculatorId="power-factor"
                title="Kompensacja mocy biernej"
                hasResult={!!result}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-EN 61921"
                notes="Obliczenia zgodne z metodą analityczną. Koszt kondensatora ~50 PLN/kvar."
                currentInputs={p as unknown as Record<string, string>}
                currentLabel={`${p.activePower}kW, cos φ ${p.currentPF}→${p.targetPF}`}
                onLoadInputs={(inputs) => setP(inputs as unknown as PowerFactorParams)}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-violet-50/50 dark:from-slate-900 dark:to-violet-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki kompensacji</CardTitle>
              <CardDescription className="text-xs md:text-sm">Moc baterii i analiza zwrotu</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {result ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative overflow-hidden p-4 md:p-6 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/30 border-2 border-violet-300 dark:border-violet-800 shadow-lg">
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Bateria kondensatorów</p>
                    <p className="text-4xl md:text-5xl font-bold text-violet-600 dark:text-violet-400">
                      {result.recommendedCapacitor} <span className="text-xl">kvar</span>
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2">Wymagana Qc = {result.requiredCapacitorPower.toFixed(1)} kvar</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Moc bierna Q₁</p>
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{result.currentReactivePower.toFixed(1)} kvar</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-300 dark:border-green-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Po komp. Q₂</p>
                      <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{result.targetReactivePower.toFixed(1)} kvar</p>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-300 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs md:text-sm font-semibold text-emerald-900 dark:text-emerald-100">Analiza ekonomiczna</p>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Redukcja prądu:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{result.currentReduction.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Oszczędności miesięcznie:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{result.monthlySavings.toFixed(0)} PLN</span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-1.5">
                        <span className="text-slate-600 dark:text-slate-400">Zwrot (~50 PLN/kvar):</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {result.paybackMonths < 999 ? `${result.paybackMonths.toFixed(0)} mies.` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Moc pozorna:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div>Przed S₁: <strong>{result.currentApparentPower.toFixed(1)} kVA</strong></div>
                      <div>Po S₂: <strong>{result.targetApparentPower.toFixed(1)} kVA</strong></div>
                      <div>Prąd przed: <strong>{result.currentBeforeCurrent.toFixed(1)} A</strong></div>
                      <div>Prąd po: <strong>{result.afterCurrent.toFixed(1)} A</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-violet-200 dark:bg-violet-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <Zap className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź moc czynną obiektu</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Oblicz wymaganą moc baterii kondensatorów</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Informacje o kompensacji</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2 text-xs md:text-sm">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Kary za cos φ &lt; 0,92 — standardowy próg w Polsce</li>
              <li>Baterie statyczne (kondensatorowe) lub dynamiczne (STATCOM) dla szybkozmiennych obciążeń</li>
              <li>Uwzględnij harmoniczne — rozważ dławiki odsprzęgające dla nieliniowych obciążeń</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
