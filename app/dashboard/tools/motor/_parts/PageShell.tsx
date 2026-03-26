"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Cpu, Lightbulb, Info, Zap } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import {
  MotorParams, StartingMethod, EfficiencyClass,
  calculateMotor, STARTING_METHODS, EFFICIENCY_CLASSES,
} from "../_lib/engine";

const DEFAULT: MotorParams = {
  power: "5.5", voltage: "400", efficiency: "91", powerFactor: "0.85",
  startingMethod: "star-delta", efficiencyClass: "IE2", dutyCycle: "100", phases: "3",
};

export function MotorCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [p, setP] = useState<MotorParams>(DEFAULT);
  const set = (field: keyof MotorParams, value: string) => setP((prev) => ({ ...prev, [field]: value }));

  const canCalc = !!p.power && parseFloat(p.power) > 0;
  const result = canCalc ? calculateMotor(p) : null;

  const pdfInputs = [
    { label: "Moc znamionowa", value: `${p.power} kW` },
    { label: "Napięcie", value: `${p.voltage} V` },
    { label: "Sprawność", value: `${p.efficiency}%` },
    { label: "cos φ", value: p.powerFactor },
    { label: "Rozruch", value: STARTING_METHODS[p.startingMethod].name },
    { label: "Klasa sprawności", value: p.efficiencyClass },
  ];
  const pdfResults = result ? [
    { label: "Prąd znamionowy", value: result.ratedCurrent.toFixed(1), unit: "A", highlight: true },
    { label: "Prąd rozruchu", value: result.startingCurrent.toFixed(1), unit: "A" },
    { label: "Przekrój kabla", value: result.cableSection.toString(), unit: "mm²" },
    { label: "Wyłącznik", value: result.circuitBreaker.toString(), unit: "A" },
    { label: "Kontaktor", value: result.contactor.toString(), unit: "A" },
    { label: "Przekaźnik term.", value: `${result.thermalRelay.min.toFixed(1)}-${result.thermalRelay.max.toFixed(1)}`, unit: "A" },
  ] : [];

  const handleReset = () => setP(DEFAULT);

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator silnika">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 shadow-md">
            <Cpu className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Kalkulator silnika elektrycznego
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Dobór zabezpieczeń i kabla wg PN-EN 60034
            </p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-teal-600 dark:text-teal-400" />
          <AlertTitle className="text-sm md:text-base text-teal-900 dark:text-teal-100 font-semibold">
            Dobór zabezpieczeń silnika wg PN-EN 60034
          </AlertTitle>
          <AlertDescription className="text-teal-800 dark:text-teal-300 mt-1 text-xs md:text-sm">
            Uwzględnia metodę rozruchu, klasę sprawności i cykl pracy. Dobiera kabel, wyłącznik, kontaktor i przekaźnik termiczny.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-teal-50/50 dark:from-slate-900 dark:to-teal-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Dane silnika</CardTitle>
              <CardDescription className="text-xs md:text-sm">Parametry z tabliczki znamionowej</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="space-y-2">
                <Label htmlFor="motor-power">Moc znamionowa (kW)</Label>
                <Input id="motor-power" name="motor-power" type="number" value={p.power} onChange={(e) => set("power", e.target.value)}
                  className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 5.5" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="motor-voltage">Napięcie (V)</Label>
                  <Select name="motor-voltage" value={p.voltage} onValueChange={(v) => set("voltage", v)}>
                    <SelectTrigger id="motor-voltage" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="230">230 V (1-faza)</SelectItem>
                      <SelectItem value="400">400 V (3-fazy)</SelectItem>
                      <SelectItem value="690">690 V (3-fazy, przemysłowe)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motor-efficiency-class">Klasa sprawności</Label>
                  <Select name="motor-efficiency-class" value={p.efficiencyClass} onValueChange={(v) => set("efficiencyClass", v as EfficiencyClass)}>
                    <SelectTrigger id="motor-efficiency-class" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(EFFICIENCY_CLASSES).map(([key, cls]) => (
                        <SelectItem key={key} value={key} className="text-xs">{cls.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="motor-efficiency">Sprawność (%)</Label>
                  <Input id="motor-efficiency" name="motor-efficiency" type="number" step="0.5" value={p.efficiency} onChange={(e) => set("efficiency", e.target.value)}
                    className="h-9 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motor-pf">cos φ</Label>
                  <Input id="motor-pf" name="motor-pf" type="number" step="0.01" value={p.powerFactor} onChange={(e) => set("powerFactor", e.target.value)}
                    className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motor-starting-method">Metoda rozruchu</Label>
                <Select name="motor-starting-method" value={p.startingMethod} onValueChange={(v) => set("startingMethod", v as StartingMethod)}>
                  <SelectTrigger id="motor-starting-method" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STARTING_METHODS).map(([key, m]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {m.name} (Ir = {m.startCurrentFactor}× In)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motor-duty-cycle">Cykl pracy (%)</Label>
                <Select name="motor-duty-cycle" value={p.dutyCycle} onValueChange={(v) => set("dutyCycle", v)}>
                  <SelectTrigger id="motor-duty-cycle" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="40">S3 — 40% (S3/40%)</SelectItem>
                    <SelectItem value="60">S3 — 60% (S3/60%)</SelectItem>
                    <SelectItem value="100">S1 — 100% (ciągły)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <CalculatorActionBar
                calculatorId="motor"
                title="Kalkulator silnika elektrycznego"
                hasResult={!!result}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-EN 60034"
                notes="Wyniki orientacyjne. Dokładny dobór wymaga analizy charakterystyki rozruchowej."
                currentInputs={p as unknown as Record<string, string>}
                currentLabel={`${p.power}kW, ${p.voltage}V, ${STARTING_METHODS[p.startingMethod].name}`}
                onLoadInputs={(inputs) => setP(inputs as unknown as MotorParams)}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-teal-50/50 dark:from-slate-900 dark:to-teal-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki doboru</CardTitle>
              <CardDescription className="text-xs md:text-sm">Prądy i aparatura zabezpieczająca</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {result ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-950/20 dark:to-cyan-950/30 border-2 border-teal-300 dark:border-teal-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Prąd znam. (In)</p>
                      <p className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">{result.ratedCurrent.toFixed(1)} A</p>
                    </div>
                    <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-950/30 border-2 border-orange-300 dark:border-orange-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Prąd rozruchu (Ir)</p>
                      <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{result.startingCurrent.toFixed(1)} A</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">×{STARTING_METHODS[p.startingMethod].startCurrentFactor} In</p>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" /><p className="text-xs md:text-sm font-semibold text-blue-900 dark:text-blue-100">Aparatura zabezpieczająca</p></div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-slate-600 dark:text-slate-400 mb-1">Wyłącznik silnikowy</p>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-base">{result.circuitBreaker} A</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-slate-600 dark:text-slate-400 mb-1">Kontaktor</p>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-base">{result.contactor} A</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800 col-span-2">
                        <p className="text-slate-600 dark:text-slate-400 mb-1">Przekaźnik termiczny</p>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-base">{result.thermalRelay.min.toFixed(1)} – {result.thermalRelay.max.toFixed(1)} A</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border-2 border-indigo-300 dark:border-indigo-800">
                    <p className="text-xs md:text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Kabel zasilający (Cu, B1)</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{result.cableSection} mm²</p>
                        <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Obciążalność: {result.cableCapacity.toFixed(0)} A</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Parametry silnika:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-600 dark:text-slate-400">
                      <div>Moc pozorna: <strong>{result.apparentPower.toFixed(2)} kVA</strong></div>
                      <div>Moc pobrana: <strong>{result.inputPower.toFixed(2)} kW</strong></div>
                      <div>Moment: <strong>{result.torque.toFixed(0)} Nm</strong></div>
                      <div>Sprawność: <strong>{result.efficiencyPct.toFixed(1)}%</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-teal-200 dark:bg-teal-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <Cpu className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź dane silnika</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Dobierz kabel i aparaturę zabezpieczającą</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Zasady doboru zabezpieczeń silnika</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
              <li>Wyłącznik silnikowy: nastawiony na <strong>Ir = In × czynnik rozruchowy</strong></li>
              <li>Przekaźnik termiczny: nastawiany w zakresie <strong>0.9–1.1 × In</strong></li>
              <li>Kabel: dobierany z zapasem <strong>25%</strong> powyżej In</li>
              <li>Dla Y-Δ: kontaktor główny + 2 kontaktory pomocnicze</li>
              <li>Normy: <strong>PN-EN 60034</strong>, <strong>PN-EN 60947-4</strong></li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
