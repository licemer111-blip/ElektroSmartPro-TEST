"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { LoadCalculatorResult, LoadCalculatorParams, ConductorType, Load } from "../_lib/engine";

interface Props {
  result: LoadCalculatorResult;
  params: LoadCalculatorParams;
  hasResult: boolean;
  onLoadInputs: (inputs: Record<string, string>) => void;
  onReset: () => void;
}

function buildPdfInputs(params: LoadCalculatorParams) {
  const conductorLabel = params.conductor === "copper" ? "Miedź (Cu)" : "Aluminium (Al)";
  return [
    { label: "Napięcie", value: `${params.voltage} V` },
    { label: "Materiał", value: conductorLabel },
    { label: "Metoda instalacji", value: params.installMethod },
    { label: "Temperatura", value: `${params.temperature}°C` },
    { label: "Grupowanie", value: `${params.grouping} obwód(y)` },
    { label: "cos φ", value: params.powerFactor },
    ...params.loads.map((l: Load) => ({
      label: l.name,
      value: `${l.power}W × ${l.quantity} (k=${l.simultaneity})`,
    })),
  ];
}

function buildPdfResults(r: LoadCalculatorResult) {
  return [
    { label: "Moc czynna", value: (r.totalPower / 1000).toFixed(2), unit: "kW", highlight: true },
    { label: "Moc pozorna", value: (r.apparentPower / 1000).toFixed(2), unit: "kVA" },
    { label: "Prąd obciążenia", value: r.current.toFixed(1), unit: "A", highlight: true },
    { label: "Wyłącznik główny", value: r.recommendedBreaker.toString(), unit: "A" },
    { label: "Przekrój kabla", value: r.recommendedSection.toString(), unit: "mm²" },
    { label: "Obciążalność kabla", value: (r.cableCapacity * r.correctionFactor).toFixed(0), unit: "A" },
    { label: "Wykorzystanie", value: r.utilizationPercent.toFixed(0), unit: "%" },
  ];
}

export function LoadCalculatorResults({ result, params, hasResult, onLoadInputs, onReset }: Props) {
  const conductorLabel = params.conductor === "copper" ? "Miedź (Cu)" : "Aluminium (Al)";
  const currentInputsState: Record<string, string> = {
    voltage: params.voltage,
    conductor: params.conductor,
    installMethod: params.installMethod,
    temperature: params.temperature,
    grouping: params.grouping,
    powerFactor: params.powerFactor,
    loads: JSON.stringify(params.loads),
  };

  return (
    <Card className="border-2 shadow-xl">
      <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/20 border-b">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base md:text-xl">Podsumowanie</CardTitle>
            <CardDescription className="text-xs md:text-sm">Parametry tablicy</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-3">
        {/* Total Power */}
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/20 dark:to-purple-950/30 border-2 border-indigo-300 dark:border-indigo-800">
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">Moc czynna (P)</p>
          <p className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {(result.totalPower / 1000).toFixed(2)} kW
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
            Moc pozorna: {(result.apparentPower / 1000).toFixed(2)} kVA (cos φ = {params.powerFactor})
          </p>
        </div>

        {/* Current */}
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/20 dark:to-cyan-950/30 border-2 border-blue-300 dark:border-blue-800">
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">Prąd obciążenia</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {result.current.toFixed(1)} A
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
            Z korektami: {result.correctedCurrent.toFixed(1)} A (k={result.correctionFactor.toFixed(2)})
          </p>
        </div>

        {/* Circuit Breaker */}
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/30 border-2 border-green-300 dark:border-green-800">
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">Wyłącznik główny</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {result.recommendedBreaker} A
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span>Obciążenie</span>
              <span>{result.utilizationPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  result.utilizationPercent > 80 ? "bg-red-500" : result.utilizationPercent > 60 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(result.utilizationPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cable Section */}
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-950/30 border-2 border-orange-300 dark:border-orange-800">
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Przekrój kabla ({params.conductor === "copper" ? "Cu" : "Al"})
          </p>
          <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {result.recommendedSection} mm²
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
            Obciążalność: {result.cableCapacity.toFixed(0)} A × {result.correctionFactor.toFixed(2)} = {(result.cableCapacity * result.correctionFactor).toFixed(0)} A
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500">
            Metoda: {params.installMethod}, Temp: {params.temperature}°C, Grupowanie: {params.grouping} obw.
          </p>
        </div>

        {/* Cable safety warning */}
        {!result.isCableOk && (
          <Alert className="p-3 bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-xs md:text-sm text-red-900 dark:text-red-100 font-semibold">
              Uwaga! Kabel nie chroni wyłącznika
            </AlertTitle>
            <AlertDescription className="text-[10px] md:text-xs text-red-800 dark:text-red-300 mt-1">
              Obciążalność kabla ({(result.cableCapacity * result.correctionFactor).toFixed(0)} A) jest mniejsza niż wyłącznik ({result.recommendedBreaker} A).
              Zwiększ przekrój kabla lub zmniejsz wyłącznik!
            </AlertDescription>
          </Alert>
        )}

        <CalculatorActionBar
          calculatorId="load-calculator"
          title="Kalkulator obciążenia tablicy"
          hasResult={hasResult}
          pdfInputs={buildPdfInputs(params)}
          pdfResults={buildPdfResults(result)}
          standard="PN-HD 60364-5-52"
          notes="Wyniki orientacyjne. Uwzględnia współczynnik jednoczesności i korekcje PN-HD. Weryfikacja przez uprawnionego projektanta wymagana."
          currentInputs={currentInputsState}
          currentLabel={`${(result.totalPower / 1000).toFixed(1)}kW, ${result.current.toFixed(0)}A, ${params.loads.length} obciążeń`}
          onLoadInputs={onLoadInputs}
          onReset={onReset}
        />

        {/* High utilization warning */}
        {result.utilizationPercent > 80 && result.isCableOk && (
          <Alert className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs md:text-sm text-amber-900 dark:text-amber-100 font-semibold">
              Wysokie obciążenie
            </AlertTitle>
            <AlertDescription className="text-[10px] md:text-xs text-amber-800 dark:text-amber-300 mt-1">
              Obciążenie przekracza 80%. Rozważ wyłącznik o większej wartości lub rezerwę mocy.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
