"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { TRIP_CURVES, PROTECTION_TYPES, type CircuitBreakerResult } from "../_lib/circuit-breaker-calc";

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

interface CircuitBreakerFormProps {
  inputs: CircuitBreakerInputs;
  result: CircuitBreakerResult | null;
  onInputChange: (key: keyof CircuitBreakerInputs, value: string) => void;
  onCalculate: () => void;
  onLoadInputs: (inputs: CircuitBreakerInputs) => void;
  onReset: () => void;
}

export function CircuitBreakerForm({
  inputs,
  result,
  onInputChange,
  onCalculate,
  onLoadInputs,
  onReset,
}: CircuitBreakerFormProps) {
  const canCalculate =
    !!inputs.loadCurrent && parseFloat(inputs.loadCurrent) > 0 &&
    !!inputs.cableCapacity && parseFloat(inputs.cableCapacity) > 0;

  const getPdfInputs = () => [
    { label: "Napięcie", value: `${inputs.voltage} V` },
    { label: "Liczba faz", value: inputs.phases === "1" ? "1-fazowe" : "3-fazowe" },
    { label: "Prąd obciążenia Ib", value: `${inputs.loadCurrent} A` },
    { label: "Przekrój kabla", value: `${inputs.cableSection} mm²` },
    { label: "Obciążalność kabla Iz", value: `${inputs.cableCapacity} A` },
    { label: "Charakterystyka", value: `Krzywa ${inputs.tripCurve}` },
    { label: "Prąd zwarcia Ik", value: inputs.shortCircuitCurrent ? `${inputs.shortCircuitCurrent} kA` : "Nie podano" },
    { label: "Typ aplikacji", value: inputs.applicationType === "domestic" ? "Mieszkaniowa" : "Przemysłowa" },
    { label: "Typ ochrony", value: PROTECTION_TYPES[inputs.protectionType].description },
  ];

  const getPdfResults = () =>
    result ? [
      { label: "Prąd znamionowy In", value: `${inputs.tripCurve}${result.recommendedRating}`, unit: "A", highlight: true },
      { label: "Zdolność zwarciowa Icn", value: result.breakingCapacity.toString(), unit: "kA" },
      { label: "Ochrona kabla", value: result.cableOk ? "Spełniona" : "NIESPEŁNIONA" },
      { label: "Sprawdzenie Ik", value: result.ikOk ? "OK" : "NIEWYSTARCZAJĄCE" },
      { label: "Zakres magnetyczny", value: `${result.magneticTripMin}-${result.magneticTripMax}`, unit: "A" },
      { label: "Wykorzystanie", value: result.utilizationPercent.toFixed(0), unit: "%" },
    ] : [];

  return (
    <Card className="border-2 shadow-xl">
      <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-red-50/50 dark:from-slate-900 dark:to-red-950/20 border-b">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base md:text-xl">Parametry obwodu</CardTitle>
            <CardDescription className="text-xs md:text-sm">Wprowadź dane techniczne</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="cb-voltage">Napięcie (V)</Label>
          <Select name="cb-voltage" value={inputs.voltage} onValueChange={(v) => onInputChange("voltage", v)}>
            <SelectTrigger id="cb-voltage"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="230">230 V (1-fazowe)</SelectItem>
              <SelectItem value="400">400 V (3-fazowe)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-phases">Liczba faz</Label>
          <Select name="cb-phases" value={inputs.phases} onValueChange={(v) => onInputChange("phases", v)}>
            <SelectTrigger id="cb-phases"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1-fazowe</SelectItem>
              <SelectItem value="3">3-fazowe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-load-current">Prąd obciążenia Ib (A)</Label>
          <Input id="cb-load-current" name="cb-load-current" type="number" placeholder="np. 16" value={inputs.loadCurrent}
            onChange={(e) => onInputChange("loadCurrent", e.target.value)}
            className="text-base md:text-lg py-5 md:py-6 border-2" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-cable-section">Przekrój kabla (mm²)</Label>
          <Select name="cb-cable-section" value={inputs.cableSection} onValueChange={(v) => onInputChange("cableSection", v)}>
            <SelectTrigger id="cb-cable-section"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300].map((s) => (
                <SelectItem key={s} value={s.toString()}>{s} mm²</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-cable-capacity">Obciążalność kabla Iz (A)</Label>
          <Input id="cb-cable-capacity" name="cb-cable-capacity" type="number" placeholder="np. 24" value={inputs.cableCapacity}
            onChange={(e) => onInputChange("cableCapacity", e.target.value)}
            className="text-xs md:text-sm h-9" />
          <p className="text-[10px] text-slate-500">Z kalkulatora przekroju kabla</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-trip-curve">Charakterystyka wyzwalania</Label>
          <Select name="cb-trip-curve" value={inputs.tripCurve} onValueChange={(v) => onInputChange("tripCurve", v)}>
            <SelectTrigger id="cb-trip-curve" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TRIP_CURVES).map(([key, value]) => (
                <SelectItem key={key} value={key} className="text-xs">Krzywa {key}: {value.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-500">{TRIP_CURVES[inputs.tripCurve].usage}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-sc-current">Prąd zwarcia Ik (kA)</Label>
          <Input id="cb-sc-current" name="cb-sc-current" type="number" placeholder="np. 6" value={inputs.shortCircuitCurrent}
            onChange={(e) => onInputChange("shortCircuitCurrent", e.target.value)}
            className="text-xs md:text-sm h-9" />
          <p className="text-[10px] text-slate-500">Z kalkulatora prądu zwarcia (opcjonalne)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-application-type">Typ aplikacji</Label>
          <Select name="cb-application-type" value={inputs.applicationType} onValueChange={(v) => onInputChange("applicationType", v)}>
            <SelectTrigger id="cb-application-type" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="domestic">Instalacje mieszkaniowe (4.5-10 kA)</SelectItem>
              <SelectItem value="industrial">Instalacje przemysłowe (10-70 kA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cb-protection-type">Typ ochrony</Label>
          <Select name="cb-protection-type" value={inputs.protectionType} onValueChange={(v) => onInputChange("protectionType", v)}>
            <SelectTrigger id="cb-protection-type" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PROTECTION_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key} className="text-xs">{value.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-500">{PROTECTION_TYPES[inputs.protectionType].sensitivity}</p>
        </div>

        <Button onClick={onCalculate} disabled={!canCalculate}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg text-sm md:text-base py-5 md:py-6 disabled:opacity-50 disabled:cursor-not-allowed">
          <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Dobierz wyłącznik
        </Button>

        <CalculatorActionBar
          calculatorId="circuit-breaker"
          title="Dobór zabezpieczeń nadprądowych"
          hasResult={!!result}
          pdfInputs={getPdfInputs()}
          pdfResults={getPdfResults()}
          standard="PN-IEC 60364-4-43"
          notes="Wyniki orientacyjne. Sprawdź selektywność z wyłącznikiem nadrzędnym. Weryfikacja przez uprawnionego projektanta wymagana."
          currentInputs={inputs}
          currentLabel={`Ib=${inputs.loadCurrent}A, ${inputs.tripCurve}${result?.recommendedRating || "?"}A, ${inputs.cableSection}mm²`}
          onLoadInputs={onLoadInputs}
          onReset={onReset}
        />
      </CardContent>
    </Card>
  );
}
