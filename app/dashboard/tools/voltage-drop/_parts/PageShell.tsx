"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, TrendingDown, Lightbulb, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { VoltageDropParams, ConductorMaterial, CableType, Phases, calculateVoltageDrop, CABLE_SECTIONS } from "../_lib/engine";

const DEFAULT: VoltageDropParams = {
  voltage: "230", current: "", length: "", crossSection: "10",
  phases: "1", conductor: "copper", cableType: "multi",
  powerFactor: "0.9", includeReactance: false,
};

export function VoltageDropCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [p, setP] = useState<VoltageDropParams>(DEFAULT);
  const set = (field: keyof VoltageDropParams, value: string | boolean) =>
    setP((prev) => ({ ...prev, [field]: value }));

  const canCalc = !!p.current && parseFloat(p.current) > 0 && !!p.length && parseFloat(p.length) > 0;
  const result = canCalc ? calculateVoltageDrop(p) : null;

  const pdfInputs = [
    { label: "Napięcie", value: `${p.voltage} V` },
    { label: "Prąd", value: `${p.current} A` },
    { label: "Długość", value: `${p.length} m` },
    { label: "Przekrój", value: `${p.crossSection} mm²` },
    { label: "Materiał", value: p.conductor === "copper" ? "Cu" : "Al" },
    { label: "Fazy", value: p.phases === "1" ? "1-fazowy" : "3-fazowy" },
  ];
  const pdfResults = result ? [
    { label: "Spadek napięcia", value: result.voltageDropPercent.toFixed(2), unit: "%", highlight: true },
    { label: "ΔU", value: result.voltageDrop.toFixed(2), unit: "V" },
    { label: "Napięcie na końcu", value: result.voltageAtEnd.toFixed(1), unit: "V" },
    { label: "Straty mocy", value: result.powerLoss.toFixed(3), unit: "kW" },
    { label: "Status 3%", value: result.isOk3 ? "OK" : "PRZEKROCZONE" },
    { label: "Status 5%", value: result.isOk5 ? "OK" : "PRZEKROCZONE" },
  ] : [];

  const handleReset = () => setP(DEFAULT);

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator spadku napięcia">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-sky-600 to-blue-600 shadow-md">
            <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Kalkulator spadku napięcia
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Oblicz ΔU zgodnie z PN-HD 60364-5-52
            </p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-sky-600 dark:text-sky-400" />
          <AlertTitle className="text-sm md:text-base text-sky-900 dark:text-sky-100 font-semibold">
            Kryterium: ΔU ≤ 3% (zalecane) lub ≤ 5% (max)
          </AlertTitle>
          <AlertDescription className="text-sky-800 dark:text-sky-300 mt-1 text-xs md:text-sm">
            Tryb zaawansowany uwzględnia reaktancję kabla (XL) i kąt fazowy cos φ.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-900 dark:to-sky-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Parametry linii</CardTitle>
              <CardDescription className="text-xs md:text-sm">Dane techniczne obwodu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="space-y-2">
                <Label id="vd-phases-label">Fazy / Napięcie</Label>
                <div role="group" aria-labelledby="vd-phases-label" className="grid grid-cols-2 gap-2">
                  {[["1","230"], ["3","400"]].map(([ph, v]) => (
                    <button key={ph} onClick={() => setP((prev) => ({ ...prev, phases: ph as Phases, voltage: v }))}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        p.phases === ph ? "bg-sky-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                      {ph === "1" ? "1-faza (230V)" : "3-fazy (400V)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vd-current">Prąd (A)</Label>
                  <Input id="vd-current" name="vd-current" type="number" value={p.current} onChange={(e) => set("current", e.target.value)}
                    className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 16" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vd-length">Długość linii (m)</Label>
                  <Input id="vd-length" name="vd-length" type="number" value={p.length} onChange={(e) => set("length", e.target.value)}
                    className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vd-cross-section">Przekrój (mm²)</Label>
                  <Select name="vd-cross-section" value={p.crossSection} onValueChange={(v) => set("crossSection", v)}>
                    <SelectTrigger id="vd-cross-section" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CABLE_SECTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)} className="text-xs">{s} mm²</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vd-conductor">Materiał</Label>
                  <Select name="vd-conductor" value={p.conductor} onValueChange={(v) => set("conductor", v as ConductorMaterial)}>
                    <SelectTrigger id="vd-conductor" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copper" className="text-xs">Miedź (Cu)</SelectItem>
                      <SelectItem value="aluminum" className="text-xs">Aluminium (Al)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <Switch
                  checked={p.includeReactance}
                  onCheckedChange={(v) => set("includeReactance", v)}
                  id="reactance-switch"
                />
                <div>
                  <Label htmlFor="reactance-switch" className="text-xs font-medium cursor-pointer">
                    Uwzględnij reaktancję (XL)
                  </Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tryb zaawansowany — dla długich linii AC
                  </p>
                </div>
              </div>

              {p.includeReactance && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vd-cable-type">Typ kabla</Label>
                    <Select name="vd-cable-type" value={p.cableType} onValueChange={(v) => set("cableType", v as CableType)}>
                      <SelectTrigger id="vd-cable-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multi" className="text-xs">Wielożyłowy (X=0.10 Ω/km)</SelectItem>
                        <SelectItem value="single" className="text-xs">Jednożyłowy (X=0.08 Ω/km)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vd-pf">cos φ</Label>
                    <Input id="vd-pf" name="vd-pf" type="number" step="0.01" min="0.5" max="1" value={p.powerFactor}
                      onChange={(e) => set("powerFactor", e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>
              )}

              <CalculatorActionBar
                calculatorId="voltage-drop"
                title="Kalkulator spadku napięcia"
                hasResult={!!result}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-HD 60364-5-52"
                notes="ΔU = 2ILρ/S (1-faza) lub √3·ILρ/S (3-fazy). Wyniki orientacyjne."
                currentInputs={{ ...p, includeReactance: String(p.includeReactance) }}
                currentLabel={`${p.current}A, ${p.length}m, ${p.crossSection}mm²`}
                onLoadInputs={(inputs) => setP({ ...inputs as unknown as VoltageDropParams, includeReactance: inputs.includeReactance === "true" })}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-900 dark:to-sky-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki obliczeń</CardTitle>
              <CardDescription className="text-xs md:text-sm">Spadek napięcia i weryfikacja normy</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {result ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className={`relative overflow-hidden p-4 md:p-6 rounded-2xl border-2 shadow-lg ${
                      result.isOk3 ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/30 border-green-300 dark:border-green-800"
                      : result.isOk5 ? "bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/20 dark:to-amber-950/30 border-yellow-300 dark:border-yellow-800"
                      : "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/20 dark:to-rose-950/30 border-red-300 dark:border-red-800"
                    }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Spadek napięcia</p>
                      <p className={`text-4xl md:text-5xl font-bold ${
                        result.isOk3 ? "text-green-600 dark:text-green-400"
                        : result.isOk5 ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                      }`}>
                        {result.voltageDropPercent.toFixed(2)}%
                      </p>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2">
                        ΔU = {result.voltageDrop.toFixed(2)} V · Uend = {result.voltageAtEnd.toFixed(1)} V
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border-2 flex items-center gap-2 ${result.isOk3 ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"}`}>
                      {result.isOk3 ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />}
                      <div>
                        <p className="text-[10px] md:text-xs font-semibold">Kryterium 3%</p>
                        <p className="text-[10px] text-slate-500">{result.isOk3 ? "Spełnione ✓" : "Przekroczone ✗"}</p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border-2 flex items-center gap-2 ${result.isOk5 ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"}`}>
                      {result.isOk5 ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />}
                      <div>
                        <p className="text-[10px] md:text-xs font-semibold">Kryterium 5%</p>
                        <p className="text-[10px] text-slate-500">{result.isOk5 ? "Spełnione ✓" : "Przekroczone ✗"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Parametry linii:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div>R: <strong>{result.resistance.toFixed(4)} Ω</strong></div>
                      {result.reactance !== undefined && <div>X: <strong>{result.reactance.toFixed(4)} Ω</strong></div>}
                      {result.impedance !== undefined && <div>Z: <strong>{result.impedance.toFixed(4)} Ω</strong></div>}
                      <div>Straty: <strong>{result.powerLoss.toFixed(3)} kW</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-sky-200 dark:bg-sky-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <TrendingDown className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź parametry linii</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Oblicz spadek napięcia i straty mocy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Wzory obliczeniowe</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2 text-xs md:text-sm">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>1-faza:</strong> ΔU = 2 × I × L × ρ / S</li>
              <li><strong>3-fazy:</strong> ΔU = √3 × I × L × ρ / S</li>
              <li><strong>Z reaktancją:</strong> ΔU = √3 × I × (R·cos φ + X·sin φ)</li>
              <li>ρ Cu = 0,0175 Ω·mm²/m, ρ Al = 0,0283 Ω·mm²/m</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
