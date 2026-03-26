"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Activity, CheckCircle2, Lightbulb, Info } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { useToolsAccess } from "@/components/tools/tools-provider";
import {
  Load, ConductorType, InstallMethod, LoadCalculatorParams, LoadCalculatorResult,
  calculateLoad, LOAD_TEMPLATES,
} from "../_lib/engine";
import { LoadCalculatorForm } from "./CalculatorForm";
import { LoadCalculatorResults } from "./CalculatorResults";

const DEFAULT_LOADS: Load[] = [
  { id: "1", name: "Oświetlenie", power: 100, quantity: 10, simultaneity: 0.8 },
  { id: "2", name: "Gniazdka",    power: 500, quantity: 5,  simultaneity: 0.5 },
];

export function LoadCalculatorShell() {
  const { isPro } = useToolsAccess();

  const [loads, setLoads]                 = useState<Load[]>(DEFAULT_LOADS);
  const [voltage, setVoltage]             = useState("400");
  const [conductor, setConductor]         = useState<ConductorType>("copper");
  const [installMethod, setInstallMethod] = useState<InstallMethod>("B1");
  const [temperature, setTemperature]     = useState("30");
  const [grouping, setGrouping]           = useState("1");
  const [powerFactor, setPowerFactor]     = useState("0.9");

  const params: LoadCalculatorParams = { loads, voltage, conductor, installMethod, temperature, grouping, powerFactor };
  const result: LoadCalculatorResult = calculateLoad(params);
  const hasResult = loads.length > 0 && result.totalPower > 0;

  const addLoad = () =>
    setLoads((prev) => [...prev, { id: Date.now().toString(), name: "Nowe obciążenie", power: 1000, quantity: 1, simultaneity: 1.0 }]);

  const removeLoad = (id: string) => setLoads((prev) => prev.filter((l) => l.id !== id));

  const updateLoad = (id: string, field: keyof Load, value: string | number) =>
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const addPredefined = (type: string) => {
    const t = LOAD_TEMPLATES[type];
    if (t) setLoads((prev) => [...prev, { id: Date.now().toString(), ...t, quantity: 1 }]);
  };

  const handleLoadInputs = (inputs: Record<string, string>) => {
    setVoltage(inputs.voltage);
    setConductor(inputs.conductor as ConductorType);
    setInstallMethod(inputs.installMethod as InstallMethod);
    setTemperature(inputs.temperature);
    setGrouping(inputs.grouping);
    setPowerFactor(inputs.powerFactor);
    try { setLoads(JSON.parse(inputs.loads)); } catch { /* ignore */ }
  };

  const handleReset = () => {
    setVoltage("400"); setConductor("copper"); setInstallMethod("B1");
    setTemperature("30"); setGrouping("1"); setPowerFactor("0.9");
    setLoads([{ id: "1", name: "Oświetlenie", power: 100, quantity: 10, simultaneity: 0.8 }]);
  };

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator obciążenia tablicy">
      <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Kalkulator obciążenia tablicy
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Sumowanie obciążeń zgodnie z PN-HD 60364
            </p>
          </div>
        </div>

        <Alert className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400" />
          <AlertTitle className="text-sm md:text-base text-indigo-900 dark:text-indigo-100 font-semibold">
            Profesjonalny kalkulator zgodny z PN-HD 60364-5-52
          </AlertTitle>
          <AlertDescription className="text-indigo-800 dark:text-indigo-300 mt-2">
            <div className="space-y-2 text-xs md:text-sm">
              <p>Kalkulator uwzględnia <strong>współczynnik jednoczesności</strong>, <strong>współczynnik mocy</strong>, oraz <strong>współczynniki korekcyjne</strong> (temperatura, grupowanie kabli).</p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>Metody prокładки: <strong>B1</strong> (w rurach w ścianach), <strong>C</strong> (na powietrzu)</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>Przewodniki: <strong>Cu</strong> (miedź) i <strong>Al</strong> (aluminium) do 300 mm²</span>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          <LoadCalculatorForm
            loads={loads} voltage={voltage} conductor={conductor}
            installMethod={installMethod} temperature={temperature}
            grouping={grouping} powerFactor={powerFactor}
            onAddLoad={addLoad} onRemoveLoad={removeLoad} onUpdateLoad={updateLoad}
            onAddPredefined={addPredefined}
            onVoltageChange={setVoltage} onConductorChange={setConductor}
            onInstallMethodChange={setInstallMethod} onTemperatureChange={setTemperature}
            onGroupingChange={setGrouping} onPowerFactorChange={setPowerFactor}
          />
          <LoadCalculatorResults
            result={result} params={params} hasResult={hasResult}
            onLoadInputs={handleLoadInputs} onReset={handleReset}
          />
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Dodatkowe uwagi</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
              <li>Wyniki uwzględniają cos φ i współczynnik jednoczesności</li>
              <li>Sprawdź czy wyłącznik <strong>In ≤ Iz</strong> (prąd znamionowy ≤ obciążalność kabla)</li>
              <li>Dla kabli aluminiowych przekrój min. 10 mm²</li>
              <li>Rezerwę mocy 10-20% na przyszłe rozbudowy</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
