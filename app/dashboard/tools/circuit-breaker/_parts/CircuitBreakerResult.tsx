"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { PROTECTION_TYPES, type CircuitBreakerResult } from "../_lib/circuit-breaker-calc";

interface CircuitBreakerResultPanelProps {
  result: CircuitBreakerResult | null;
  tripCurve: string;
  cableCapacity: string;
  shortCircuitCurrent: string;
  protectionType: string;
  applicationType: string;
}

export function CircuitBreakerResultPanel({
  result,
  tripCurve,
  cableCapacity,
  shortCircuitCurrent,
  protectionType,
  applicationType,
}: CircuitBreakerResultPanelProps) {
  return (
    <Card className="border-2 shadow-xl">
      <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-red-50/50 dark:from-slate-900 dark:to-red-950/20 border-b">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base md:text-xl">Zalecany wyłącznik</CardTitle>
            <CardDescription className="text-xs md:text-sm">Wyniki doboru</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {result ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative overflow-hidden p-4 md:p-6 rounded-2xl bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 dark:from-red-950/20 dark:via-rose-950/20 dark:to-pink-950/30 border-2 border-red-300 dark:border-red-800 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
              <div className="relative">
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Zalecany prąd znamionowy</p>
                <p className="text-4xl md:text-5xl font-bold text-red-600 dark:text-red-400">{tripCurve}{result.recommendedRating}A</p>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-3">Icn = {result.breakingCapacity} kA</p>
              </div>
            </div>

            <div className={`p-3 md:p-4 rounded-xl border-2 ${result.cableOk ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.cableOk
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                <p className={`text-xs md:text-sm font-semibold ${result.cableOk ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}>
                  Ochrona kabla
                </p>
              </div>
              <p className={`text-sm font-medium ${result.cableOk ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                {result.cableOk
                  ? `✓ In (${result.recommendedRating}A) ≤ Iz (${cableCapacity}A)`
                  : `✗ In (${result.recommendedRating}A) > Iz (${cableCapacity}A) - ZWIĘKSZ PRZEKRÓJ!`}
              </p>
            </div>

            <div className={`p-3 md:p-4 rounded-xl border-2 ${result.ikOk ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.ikOk
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                <p className={`text-xs md:text-sm font-semibold ${result.ikOk ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}>
                  Zdolność zwarciowa
                </p>
              </div>
              <p className={`text-sm font-medium ${result.ikOk ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                {result.ikOk
                  ? `✓ Icn (${result.breakingCapacity}kA) ≥ Ik (${shortCircuitCurrent || 10}kA)`
                  : `✗ Icn (${result.breakingCapacity}kA) < Ik - WYBIERZ WYŻSZĄ KLASĘ!`}
              </p>
            </div>

            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Zakres wyzwalania magnetycznego</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{result.magneticTripMin} - {result.magneticTripMax} A</p>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">Krzywa {tripCurve}: {result.tripRange}</p>
            </div>

            <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border-2 border-purple-300 dark:border-purple-800">
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Wykorzystanie wyłącznika</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{result.utilizationPercent.toFixed(0)}%</p>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all ${result.utilizationPercent > 90 ? "bg-red-500" : result.utilizationPercent > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(result.utilizationPercent, 100)}%` }}
                />
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
                {result.utilizationPercent > 80 ? "Wysoka - rozważ większy In" : "Optymalna"}
              </p>
            </div>

            {protectionType !== "standard" && (
              <div className="p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-300 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs md:text-sm text-amber-900 dark:text-amber-100 font-semibold">{PROTECTION_TYPES[protectionType].description}</p>
                </div>
                <p className="text-[10px] md:text-xs text-amber-800 dark:text-amber-300">Czułość: {PROTECTION_TYPES[protectionType].sensitivity}</p>
              </div>
            )}

            <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700">
              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">💡 Rekomendacje:</p>
              <ul className="space-y-1 text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
                {!result.cableOk && <li className="text-red-600 dark:text-red-400 font-semibold">• Zwiększ przekrój kabla lub zmniejsz obciążenie!</li>}
                {!result.ikOk && <li className="text-red-600 dark:text-red-400 font-semibold">• Wybierz wyłącznik o wyższej zdolności zwarciowej!</li>}
                {result.utilizationPercent > 85 && <li className="text-yellow-600 dark:text-yellow-400">• Rozważ większy prąd znamionowy dla rezerwy mocy</li>}
                <li>• Sprawdź selektywność z wyłącznikiem nadrzędnym</li>
                <li>• Dla obwodów gniazdkowych zalecane RCD 30mA</li>
                {applicationType === "domestic" && <li>• Dla łazienek wymagany RCBO 30mA (PN-IEC 60364)</li>}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-200 dark:bg-red-800 rounded-full blur-2xl opacity-30 animate-pulse" />
              <Shield className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź parametry obwodu</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Dobierz optymalny wyłącznik nadprądowy</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
