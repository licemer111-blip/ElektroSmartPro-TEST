"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Shield, Lightbulb, CheckCircle2, Info } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { calculateCircuitBreaker, type CircuitBreakerResult } from "./_lib/circuit-breaker-calc";
import { CircuitBreakerForm } from "./_parts/CircuitBreakerForm";
import { CircuitBreakerResultPanel } from "./_parts/CircuitBreakerResult";

interface CircuitBreakerInputs {
  loadCurrent: string;
  cableSection: string;
  cableCapacity: string;
  tripCurve: string;
  shortCircuitCurrent: string;
  applicationType: string;
  protectionType: string;
  voltage: string;
  phases: "1" | "3";
}

const DEFAULT_INPUTS: CircuitBreakerInputs = {
  loadCurrent: "", cableSection: "2.5", cableCapacity: "24",
  tripCurve: "C", shortCircuitCurrent: "", applicationType: "domestic",
  protectionType: "standard", voltage: "230", phases: "1",
};

export default function CircuitBreakerPage() {
  const { isPro } = useToolsAccess();
  const [inputs, setInputs] = useState<CircuitBreakerInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<CircuitBreakerResult | null>(null);

  const handleInputChange = (key: keyof CircuitBreakerInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    const r = calculateCircuitBreaker(inputs);
    setResult(r);
  };

  const handleLoadInputs = (loaded: CircuitBreakerInputs) => {
    setInputs(loaded);
    setResult(null);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setResult(null);
  };

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator zabezpieczeń">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 shadow-md">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Dobór zabezpieczeń nadprądowych
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Wybierz odpowiedni wyłącznik zgodnie z PN-IEC 60364-4-43
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-sm md:text-base text-red-900 dark:text-red-100 font-semibold">
            Zasady doboru wyłączników nadprądowych
          </AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300 mt-2">
            <div className="space-y-2 text-xs md:text-sm">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span><strong>Ib ≤ In ≤ Iz:</strong> prąd obciążenia ≤ prąd znamionowy ≤ obciążalność kabla</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span><strong>Icn ≥ Ik:</strong> zdolność zwarciowa ≥ prąd zwarcia w miejscu instalacji</span>
              </p>
              <p className="text-[10px] md:text-xs mt-2 text-red-700 dark:text-red-400">
                Charakterystyka B dla obwodów oświetleniowych, C dla ogólnych, D dla silników
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <CircuitBreakerForm
            inputs={inputs}
            result={result}
            onInputChange={handleInputChange}
            onCalculate={handleCalculate}
            onLoadInputs={handleLoadInputs}
            onReset={handleReset}
          />
          <CircuitBreakerResultPanel
            result={result}
            tripCurve={inputs.tripCurve}
            cableCapacity={inputs.cableCapacity}
            shortCircuitCurrent={inputs.shortCircuitCurrent}
            protectionType={inputs.protectionType}
            applicationType={inputs.applicationType}
          />
        </div>

        {/* Footer Alert */}
        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">
            Ważne informacje o doborze zabezpieczeń
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
            <div className="space-y-2 text-xs md:text-sm">
              <p>Dobór wyłącznika musi spełniać <strong>3 podstawowe warunki</strong>:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
                <li><strong>Ib ≤ In ≤ Iz:</strong> wyłącznik nie może być większy niż obciążalność kabla</li>
                <li><strong>Icn ≥ Ik:</strong> zdolność łączenia ≥ prąd zwarcia w punkcie instalacji</li>
                <li><strong>Selektywność:</strong> koordynacja z wyłącznikiem nadrzędnym (backup protection)</li>
                <li><strong>Krzywa B:</strong> oświetlenie (3-5×In), <strong>C:</strong> gniazdka (5-10×In), <strong>D:</strong> silniki (10-20×In)</li>
              </ul>
              <p className="mt-2 font-medium">Normy: <strong>PN-IEC 60364-4-43, PN-EN 60898, PN-HD 60364-5-52</strong></p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}