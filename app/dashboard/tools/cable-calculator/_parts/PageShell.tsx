"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Cable, Lightbulb, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import {
  CableParams, ConductorMaterial, InstallMethod, InsulationType,
  calculateCable, INSTALL_METHOD_LABELS, CABLE_SECTIONS,
} from "../_lib/engine";

const DEFAULT: CableParams = {
  current: "", voltage: "400", phases: "3", length: "",
  conductor: "copper", insulation: "PVC", installMethod: "B1",
  temperature: "30", grouping: "1", powerFactor: "0.9",
};

export function CableCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [p, setP] = useState<CableParams>(DEFAULT);
  const set = (field: keyof CableParams, value: string) => setP((prev) => ({ ...prev, [field]: value }));

  const canCalc = !!p.current && parseFloat(p.current) > 0 && !!p.length && parseFloat(p.length) > 0;
  const result = canCalc ? calculateCable(p) : null;

  const pdfInputs = [
    { label: "Prąd obliczeniowy", value: `${p.current} A` },
    { label: "Napięcie", value: `${p.voltage} V` },
    { label: "Fazy", value: p.phases === "1" ? "1-fazowe" : "3-fazowe" },
    { label: "Materiał", value: p.conductor === "copper" ? "Miedź (Cu)" : "Aluminium (Al)" },
    { label: "Izolacja", value: p.insulation },
    { label: "Metoda instalacji", value: INSTALL_METHOD_LABELS[p.installMethod] },
    { label: "Temperatura", value: `${p.temperature}°C` },
    { label: "Długość", value: `${p.length} m` },
  ];
  const pdfResults = result ? [
    { label: "Przekrój kabla", value: result.recommendedSection.toString(), unit: "mm²", highlight: true },
    { label: "Obciążalność", value: result.cableCapacity.toFixed(0), unit: "A" },
    { label: "Wyłącznik", value: result.recommendedBreaker.toString(), unit: "A" },
    { label: "Spadek napięcia", value: result.voltageDropPercent.toFixed(2), unit: "%" },
  ] : [];

  const handleReset = () => setP(DEFAULT);

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator kabli">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
            <Cable className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Dobór przekroju kabla
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Oblicz przekrój kabla zgodnie z PN-HD 60364-5-52
            </p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-sm md:text-base text-blue-900 dark:text-blue-100 font-semibold">
            Dobór kabla wg PN-HD 60364-5-52
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-300 mt-1 text-xs md:text-sm">
            Uwzględnia współczynniki korekcyjne temperatury i grupowania. Sprawdza kryterium obciążalności i spadku napięcia.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Parametry obwodu</CardTitle>
              <CardDescription className="text-xs md:text-sm">Wprowadź dane techniczne</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cc-current">Prąd obliczeniowy (A)</Label>
                  <Input id="cc-current" name="cc-current" type="number" value={p.current} onChange={(e) => set("current", e.target.value)}
                    className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 16" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-length">Długość linii (m)</Label>
                  <Input id="cc-length" name="cc-length" type="number" value={p.length} onChange={(e) => set("length", e.target.value)}
                    className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 25" />
                </div>
              </div>

              <div className="space-y-2">
                <Label id="cc-voltage-label">Napięcie / Fazy</Label>
                <div role="group" aria-labelledby="cc-voltage-label" className="flex gap-2">
                  {[["230","1"],["400","3"]].map(([v, ph]) => (
                    <button key={v} onClick={() => { set("voltage", v); setP((prev) => ({ ...prev, voltage: v, phases: ph as "1"|"3" })); }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        p.voltage === v ? "bg-blue-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                      {v}V {ph === "1" ? "(1-faza)" : "(3-fazy)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cc-conductor">Materiał</Label>
                  <Select name="cc-conductor" value={p.conductor} onValueChange={(v) => set("conductor", v as ConductorMaterial)}>
                    <SelectTrigger id="cc-conductor" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copper">Miedź (Cu)</SelectItem>
                      <SelectItem value="aluminum">Aluminium (Al, min. 10mm²)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-insulation">Izolacja</Label>
                  <Select name="cc-insulation" value={p.insulation} onValueChange={(v) => set("insulation", v as InsulationType)}>
                    <SelectTrigger id="cc-insulation" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PVC">PVC (70°C)</SelectItem>
                      <SelectItem value="XLPE">XLPE/EPR (90°C)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cc-install-method">Metoda instalacji</Label>
                <Select name="cc-install-method" value={p.installMethod} onValueChange={(v) => set("installMethod", v as InstallMethod)}>
                  <SelectTrigger id="cc-install-method" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSTALL_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cc-temperature">Temperatura (°C)</Label>
                  <Select name="cc-temperature" value={p.temperature} onValueChange={(v) => set("temperature", v)}>
                    <SelectTrigger id="cc-temperature" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["10","15","20","25","30","35","40","45","50"].map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">{t}°C</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-grouping">Grupowanie</Label>
                  <Select name="cc-grouping" value={p.grouping} onValueChange={(v) => set("grouping", v)}>
                    <SelectTrigger id="cc-grouping" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["1","1 obwód"],["2","2 obwody"],["3","3 obwody"],["4","4 obwody"],["5","5 obwodów"],["6","6 obwodów"]].map(([k, l]) => (
                        <SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CalculatorActionBar
                calculatorId="cable-calculator"
                title="Dobór przekroju kabla"
                hasResult={!!result}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-HD 60364-5-52"
                notes="Wyniki orientacyjne. Weryfikacja przez uprawnionego projektanta wymagana."
                currentInputs={p as unknown as Record<string, string>}
                currentLabel={`${p.current}A, ${p.conductor === "copper" ? "Cu" : "Al"}, ${p.length}m`}
                onLoadInputs={(inputs) => setP(inputs as unknown as CableParams)}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki doboru</CardTitle>
              <CardDescription className="text-xs md:text-sm">Przekrój i weryfikacja</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {result ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative overflow-hidden p-4 md:p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/30 border-2 border-blue-300 dark:border-blue-800 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Zalecany przekrój kabla</p>
                      <p className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">
                        {result.recommendedSection} <span className="text-xl">mm²</span>
                      </p>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {p.conductor === "copper" ? "Cu" : "Al"}/{p.insulation}, Metoda {p.installMethod}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-300 dark:border-green-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Obciążalność (Iz)</p>
                      <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{result.cableCapacity.toFixed(0)} A</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border-2 border-orange-300 dark:border-orange-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Wyłącznik</p>
                      <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">{result.recommendedBreaker} A</p>
                    </div>
                  </div>

                  <div className={`p-3 md:p-4 rounded-xl border-2 flex items-center gap-3 ${
                    result.isVoltageDropOk ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                  }`}>
                    {result.isVoltageDropOk ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
                    <div>
                      <p className="text-xs md:text-sm font-semibold">Spadek napięcia: {result.voltageDropPercent.toFixed(2)}% ({result.voltageDrop.toFixed(2)} V)</p>
                      <p className="text-[10px] md:text-xs mt-0.5">{result.isVoltageDropOk ? "Spełnia normę ≤5%" : "Przekracza normę 5%! Zwiększ przekrój."}</p>
                    </div>
                  </div>

                  {result.warning && (
                    <Alert className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-xs md:text-sm text-amber-800 dark:text-amber-300">{result.warning}</AlertDescription>
                    </Alert>
                  )}

                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Współczynniki korekcyjne:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div>Temp. k<sub>T</sub>: <strong>{result.tempFactor.toFixed(2)}</strong></div>
                      <div>Grupowanie k<sub>g</sub>: <strong>{result.groupFactor.toFixed(2)}</strong></div>
                      <div>Prąd z korektą: <strong>{result.correctedCurrent.toFixed(1)} A</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-200 dark:bg-blue-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <Cable className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź parametry obwodu</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Dobierz przekrój kabla wg normy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Zasady doboru kabla</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
              <li>Kryterium <strong>obciążalności termicznej</strong>: Iz × k ≥ In (wyłącznik)</li>
              <li>Kryterium <strong>spadku napięcia</strong>: ΔU ≤ 3% (5% max) wg PN-IEC 60364-5-52</li>
              <li>Kryterium <strong>zwarciowe</strong>: kabel musi wytrzymać energię zwarcia</li>
              <li>Dla Al: minimalny przekrój 10 mm², min. klasa przewodności AA-XBS</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
