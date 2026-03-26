"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Info, CheckCircle2, Lightbulb, Zap } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { ShortCircuitParams, ConductorMaterial, CableType, calculateShortCircuit, CABLE_SECTIONS } from "../_lib/engine";

const DEFAULT: ShortCircuitParams = {
  voltage: "400", cableLength: "", cableSection: "10",
  conductor: "copper", cableType: "multi", systemType: "TN-S",
  transformerPower: "630", transformerVoltage: "10",
};

export function ShortCircuitCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [p, setP] = useState<ShortCircuitParams>(DEFAULT);
  const set = (field: keyof ShortCircuitParams, value: string) => setP((prev) => ({ ...prev, [field]: value }));

  const canCalc = !!p.cableLength && parseFloat(p.cableLength) > 0;
  const result = canCalc ? calculateShortCircuit(p) : null;

  const pdfInputs = [
    { label: "Napięcie", value: `${p.voltage} V` },
    { label: "Długość kabla", value: `${p.cableLength} m` },
    { label: "Przekrój", value: `${p.cableSection} mm²` },
    { label: "Materiał", value: p.conductor === "copper" ? "Cu" : "Al" },
    { label: "Trafo", value: `${p.transformerPower} kVA` },
  ];
  const pdfResults = result ? [
    { label: "Ik3 (trójfazowy)", value: result.ik3.toFixed(2), unit: "kA", highlight: true },
    { label: "Ik1 (jednofazowy)", value: result.ik1.toFixed(2), unit: "kA" },
    { label: "Zdolność łączeniowa", value: result.breakingCapacity.toString(), unit: "kA" },
    { label: "Status", value: result.isOk ? "OK" : "UWAGA" },
  ] : [];

  const handleReset = () => setP(DEFAULT);

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator prądu zwarcia">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 shadow-md">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              Kalkulator prądu zwarcia
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
              Oblicz Ik3 i Ik1 zgodnie z PN-EN 60909
            </p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-sm md:text-base text-red-900 dark:text-red-100 font-semibold">PN-EN 60909 — Metoda impedancji</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300 mt-1 text-xs md:text-sm">
            Uwzględnia impedancję transformatora i kabla. Ik3 = c·Un / (√3·Z)
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-red-50/50 dark:from-slate-900 dark:to-red-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Dane obwodu</CardTitle>
              <CardDescription className="text-xs md:text-sm">Parametry układu zasilania</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                <div className="space-y-1.5">
                  <Label htmlFor="sc-transformer-power" className="text-[10px]">Moc transformatora (kVA)</Label>
                  <Select name="sc-transformer-power" value={p.transformerPower} onValueChange={(v) => set("transformerPower", v)}>
                    <SelectTrigger id="sc-transformer-power" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["100","160","250","400","630","1000","1600","2500"].map((kva) => (
                        <SelectItem key={kva} value={kva} className="text-xs">{kva} kVA</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sc-transformer-voltage" className="text-[10px]">Napięcie pierwotne (kV)</Label>
                  <Select name="sc-transformer-voltage" value={p.transformerVoltage} onValueChange={(v) => set("transformerVoltage", v)}>
                    <SelectTrigger id="sc-transformer-voltage" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6" className="text-xs">6 kV</SelectItem>
                      <SelectItem value="10" className="text-xs">10 kV</SelectItem>
                      <SelectItem value="15" className="text-xs">15 kV</SelectItem>
                      <SelectItem value="20" className="text-xs">20 kV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label id="sc-voltage-label">Napięcie (V)</Label>
                  <div role="group" aria-labelledby="sc-voltage-label" className="flex gap-2">
                    {["230","400"].map((v) => (
                      <button key={v} onClick={() => set("voltage", v)}
                        className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-medium transition-all ${
                          p.voltage === v ? "bg-red-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>{v}V</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sc-system-type">System</Label>
                  <Select name="sc-system-type" value={p.systemType} onValueChange={(v) => set("systemType", v)}>
                    <SelectTrigger id="sc-system-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TN-S">TN-S</SelectItem>
                      <SelectItem value="TN-C">TN-C</SelectItem>
                      <SelectItem value="TN-C-S">TN-C-S</SelectItem>
                      <SelectItem value="TT">TT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sc-cable-length">Długość kabla (m)</Label>
                <Input id="sc-cable-length" name="sc-cable-length" type="number" value={p.cableLength} onChange={(e) => set("cableLength", e.target.value)}
                  className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 50" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sc-cable-section" className="text-xs">Przekrój (mm²)</Label>
                  <Select name="sc-cable-section" value={p.cableSection} onValueChange={(v) => set("cableSection", v)}>
                    <SelectTrigger id="sc-cable-section" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CABLE_SECTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sc-conductor" className="text-xs">Materiał</Label>
                  <Select name="sc-conductor" value={p.conductor} onValueChange={(v) => set("conductor", v as ConductorMaterial)}>
                    <SelectTrigger id="sc-conductor" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copper" className="text-xs">Cu</SelectItem>
                      <SelectItem value="aluminum" className="text-xs">Al</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sc-cable-type" className="text-xs">Typ kabla</Label>
                  <Select name="sc-cable-type" value={p.cableType} onValueChange={(v) => set("cableType", v as CableType)}>
                    <SelectTrigger id="sc-cable-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multi" className="text-xs">Wielożył.</SelectItem>
                      <SelectItem value="single" className="text-xs">Jednożył.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CalculatorActionBar
                calculatorId="short-circuit"
                title="Kalkulator prądu zwarcia"
                hasResult={!!result}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-EN 60909"
                notes="Obliczenia uproszczone. Wymagana weryfikacja przez uprawnionego projektanta."
                currentInputs={p as unknown as Record<string, string>}
                currentLabel={`${p.cableLength}m, ${p.cableSection}mm², ${p.transformerPower}kVA`}
                onLoadInputs={(inputs) => setP(inputs as unknown as ShortCircuitParams)}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-red-50/50 dark:from-slate-900 dark:to-red-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki obliczeń</CardTitle>
              <CardDescription className="text-xs md:text-sm">Prądy zwarciowe i dobór wyłącznika</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {result ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950/20 dark:to-orange-950/30 border-2 border-red-300 dark:border-red-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Ik3 (trójfaz.)</p>
                      <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{result.ik3.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">kA</p>
                    </div>
                    <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-950/30 border-2 border-orange-300 dark:border-orange-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Ik1 (jednofaz.)</p>
                      <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{result.ik1.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">kA</p>
                    </div>
                  </div>

                  <div className={`p-3 md:p-4 rounded-xl border-2 flex items-start gap-3 ${
                    result.isOk ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                  }`}>
                    {result.isOk ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-xs md:text-sm font-semibold">{result.recommendation}</p>
                      <p className="text-[10px] md:text-xs mt-1 opacity-80">{result.details}</p>
                      <p className="text-[10px] md:text-xs mt-1 font-medium">Zdolność łączeniowa: <strong>{result.breakingCapacity} kA</strong></p>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Parametry impedancji:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div>R kabla: <strong>{result.resistance.toFixed(4)} Ω</strong></div>
                      <div>X totalne: <strong>{result.reactance.toFixed(4)} Ω</strong></div>
                      <div>Z totalne: <strong>{result.impedance.toFixed(4)} Ω</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-200 dark:bg-red-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <Zap className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź dane obwodu</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">Oblicz prądy zwarciowe i dobierz wyłącznik</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Zasady obliczeń zwarciowych (PN-EN 60909)</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2 text-xs md:text-sm">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Czynnik napięciowy c = 1,1 (400V) / 1,05 (230V)</li>
              <li>uk% transformatora: typowo 4-6% dla SN/nN</li>
              <li>Wyłącznik: Icn ≥ Ik3 z zapasem 20%</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
