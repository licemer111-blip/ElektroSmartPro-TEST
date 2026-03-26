"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Sun, Lightbulb, Info, Leaf, TrendingUp } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import {
  PvParams, Orientation, ModuleType,
  calculatePv, IRRADIATION_BY_REGION, MODULE_TYPES, ORIENTATION_FACTORS,
} from "../_lib/engine";

const DEFAULT_PARAMS: PvParams = {
  region: "mazowieckie", moduleType: "monocrystalline", peakPower: "10",
  tilt: "35", orientation: "south", systemLoss: "14",
  electricityPrice: "0.85", installCostPerKwp: "4500",
};

export function PvCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [params, setParams] = useState<PvParams>(DEFAULT_PARAMS);

  const set = (field: keyof PvParams, value: string) =>
    setParams((prev) => ({ ...prev, [field]: value }));

  const result = calculatePv(params);
  const hasResult = parseFloat(params.peakPower) > 0;

  const pdfInputs = [
    { label: "Region", value: IRRADIATION_BY_REGION[params.region]?.name ?? params.region },
    { label: "Moc szczytowa", value: `${params.peakPower} kWp` },
    { label: "Typ modułów", value: MODULE_TYPES[params.moduleType].name },
    { label: "Kąt nachylenia", value: `${params.tilt}°` },
    { label: "Orientacja", value: params.orientation },
    { label: "Straty systemu", value: `${params.systemLoss}%` },
  ];

  const pdfResults = hasResult ? [
    { label: "Produkcja roczna", value: result.annualProduction.toFixed(0), unit: "kWh/rok", highlight: true },
    { label: "Uzysk spec.", value: result.specificYield.toFixed(0), unit: "kWh/kWp" },
    { label: "Oszczędności roczne", value: result.annualSavings.toFixed(0), unit: "PLN" },
    { label: "Zwrot inwestycji", value: result.paybackYears.toFixed(1), unit: "lat" },
    { label: "Redukcja CO₂", value: result.co2Reduction.toFixed(0), unit: "kg/rok" },
  ] : [];

  const handleReset = () => setParams(DEFAULT_PARAMS);

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator PV">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md">
            <Sun className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Kalkulator fotowoltaiczny
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Oblicz produkcję energii i zwrot inwestycji
            </p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-sm md:text-base text-yellow-900 dark:text-yellow-100 font-semibold">
            Kalkulator PV z danymi nasłonecznienia dla Polski
          </AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-300 mt-1 text-xs md:text-sm">
            Dane oparte na pomiarach PVGIS dla 16 województw. Uwzględnia straty systemu, kąt nachylenia i orientację.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-yellow-50/50 dark:from-slate-900 dark:to-yellow-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Parametry instalacji</CardTitle>
              <CardDescription className="text-xs md:text-sm">Dane systemu PV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
              <div className="space-y-2">
                <Label htmlFor="pv-region">Województwo</Label>
                <Select name="pv-region" value={params.region} onValueChange={(v) => set("region", v)}>
                  <SelectTrigger id="pv-region" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(IRRADIATION_BY_REGION).map(([key, r]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {r.name} ({r.annual} kWh/m²/rok)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pv-peak-power">Moc szczytowa (kWp)</Label>
                <Input id="pv-peak-power" name="pv-peak-power" type="number" value={params.peakPower} onChange={(e) => set("peakPower", e.target.value)}
                  className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 10" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pv-module-type">Typ modułów</Label>
                <Select name="pv-module-type" value={params.moduleType} onValueChange={(v) => set("moduleType", v as ModuleType)}>
                  <SelectTrigger id="pv-module-type" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODULE_TYPES).map(([key, m]) => (
                      <SelectItem key={key} value={key} className="text-xs">{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pv-tilt">Kąt nachylenia (°)</Label>
                  <Select name="pv-tilt" value={params.tilt} onValueChange={(v) => set("tilt", v)}>
                    <SelectTrigger id="pv-tilt" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["10","20","30","35","40","45","60","90"].map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">{t}°</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pv-orientation">Orientacja</Label>
                  <Select name="pv-orientation" value={params.orientation} onValueChange={(v) => set("orientation", v as Orientation)}>
                    <SelectTrigger id="pv-orientation" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ORIENTATION_FACTORS).map(([key, factor]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {key === "south" ? "Południe" : key === "south-east" ? "Połud.-Wschód" :
                           key === "south-west" ? "Połud.-Zachód" : key === "east" ? "Wschód" : "Zachód"} ({Math.round(factor*100)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pv-system-loss">Straty systemu (%)</Label>
                <Input id="pv-system-loss" name="pv-system-loss" type="number" value={params.systemLoss} onChange={(e) => set("systemLoss", e.target.value)}
                  className="h-9 text-xs" placeholder="14" />
                <p className="text-[10px] text-slate-500">Falownik + okablowanie + temp. (typowo 12-18%)</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">💰 Analiza ekonomiczna</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pv-elec-price" className="text-[10px]">Cena energii (PLN/kWh)</Label>
                    <Input id="pv-elec-price" name="pv-elec-price" type="number" step="0.05" value={params.electricityPrice}
                      onChange={(e) => set("electricityPrice", e.target.value)} className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="pv-install-cost" className="text-[10px]">Koszt instalacji (PLN/kWp)</Label>
                    <Input id="pv-install-cost" name="pv-install-cost" type="number" value={params.installCostPerKwp}
                      onChange={(e) => set("installCostPerKwp", e.target.value)} className="h-8 text-xs mt-1" />
                  </div>
                </div>
              </div>

              <CalculatorActionBar
                calculatorId="pv"
                title="Kalkulator PV"
                hasResult={hasResult}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-EN 62446"
                notes="Obliczenia orientacyjne oparte na danych PVGIS. Rzeczywista produkcja zależy od lokalnego zacienienia i warunków atmosferycznych."
                currentInputs={params as unknown as Record<string, string>}
                currentLabel={`${params.peakPower}kWp, ${IRRADIATION_BY_REGION[params.region]?.name}`}
                onLoadInputs={(inputs) => setParams(inputs as unknown as PvParams)}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-yellow-50/50 dark:from-slate-900 dark:to-yellow-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki obliczeń</CardTitle>
              <CardDescription className="text-xs md:text-sm">Produkcja energii i analiza ekonomiczna</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              {hasResult ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative overflow-hidden p-4 md:p-6 rounded-2xl bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100 dark:from-yellow-950/20 dark:via-orange-950/20 dark:to-amber-950/30 border-2 border-yellow-300 dark:border-yellow-800 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Produkcja roczna</p>
                      <p className="text-4xl md:text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                        {result.annualProduction.toFixed(0)} <span className="text-xl">kWh</span>
                      </p>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Uzysk: {result.specificYield.toFixed(0)} kWh/kWp · Nasłonecznienie: {result.irradiation} kWh/m²
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Produkcja dzienna (śr.)</p>
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{result.dailyProduction.toFixed(1)} kWh</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-300 dark:border-green-800">
                      <div className="flex items-center gap-1 mb-1">
                        <Leaf className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">Redukcja CO₂</p>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{result.co2Reduction.toFixed(0)} kg</p>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-300 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs md:text-sm font-semibold text-emerald-900 dark:text-emerald-100">Analiza ekonomiczna</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Oszczędności roczne:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{result.annualSavings.toFixed(0)} PLN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Koszt instalacji:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{result.installCost.toFixed(0)} PLN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Zwrot inwestycji:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {result.paybackYears < 50 ? `${result.paybackYears.toFixed(1)} lat` : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-2">
                        <span className="text-slate-600 dark:text-slate-400">Zysk netto 25 lat:</span>
                        <span className={`font-bold ${result.roi25Years > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {result.roi25Years.toFixed(0)} PLN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-yellow-200 dark:bg-yellow-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <Sun className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź parametry instalacji</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Oblicz produkcję i zwrot inwestycji</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Dodatkowe informacje</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
              <li>Optymalne nachylenie dla Polski: <strong>30-40°</strong></li>
              <li>Zacienienie redukuje produkcję — uwzględnij drzewa i budynki</li>
              <li>Temperatura modułów wpływa na sprawność: wysoka temp. = mniejsza produkcja</li>
              <li>Norma: <strong>PN-EN 62446</strong> (dokumentacja i odbiór instalacji PV)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
