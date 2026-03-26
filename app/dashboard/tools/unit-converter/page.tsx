"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRightLeft, Lightbulb, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";

export default function UnitConverterPage() {
  const { isPro } = useToolsAccess();
  // Cable cross-section converter (mm² ↔ AWG)
  const [mmSquared, setMmSquared] = useState("");
  const [awg, setAwg] = useState("");

  // Power converter (kW ↔ HP)
  const [kW, setKW] = useState("");
  const [hp, setHP] = useState("");

  // Current converter (A ↔ kVA)
  const [amperes, setAmperes] = useState("");
  const [kva, setKva] = useState("");
  const [voltage, setVoltage] = useState("400");

  const convertMmToAwg = (mm: number): string => {
    const awgTable: Record<number, number> = {
      0.75: 18,
      1: 17,
      1.5: 16,
      2.5: 14,
      4: 12,
      6: 10,
      10: 8,
      16: 6,
      25: 4,
      35: 2,
      50: 1,
      70: 1/0,
      95: 2/0,
      120: 3/0,
      150: 4/0,
    };
    
    const closest = Object.keys(awgTable).reduce((prev, curr) => 
      Math.abs(parseFloat(curr) - mm) < Math.abs(parseFloat(prev) - mm) ? curr : prev
    );
    
    return `AWG ${awgTable[parseFloat(closest)]}`;
  };

  const handleMmChange = (value: string) => {
    setMmSquared(value);
    const mm = parseFloat(value);
    if (mm) {
      setAwg(convertMmToAwg(mm));
    }
  };

  const handleKWChange = (value: string) => {
    setKW(value);
    const kw = parseFloat(value);
    if (kw) {
      setHP((kw * 1.341).toFixed(2));
    }
  };

  const handleHPChange = (value: string) => {
    setHP(value);
    const hpValue = parseFloat(value);
    if (hpValue) {
      setKW((hpValue * 0.7457).toFixed(2));
    }
  };

  const handleAmperesChange = (value: string) => {
    setAmperes(value);
    const a = parseFloat(value);
    const v = parseFloat(voltage);
    if (a && v) {
      setKva(((a * v * Math.sqrt(3)) / 1000).toFixed(2));
    }
  };

  const handleKvaChange = (value: string) => {
    setKva(value);
    const kvaValue = parseFloat(value);
    const v = parseFloat(voltage);
    if (kvaValue && v) {
      setAmperes(((kvaValue * 1000) / (v * Math.sqrt(3))).toFixed(2));
    }
  };

  const hasResult = !!(mmSquared && awg) || !!(kW && hp) || !!(amperes && kva);

  const getPdfInputs = () => {
    const inputs: { label: string; value: string }[] = [];
    if (mmSquared) inputs.push({ label: "Przekrój (mm²)", value: mmSquared });
    if (kW) inputs.push({ label: "Moc (kW)", value: kW });
    if (hp) inputs.push({ label: "Moc (HP)", value: hp });
    if (amperes) inputs.push({ label: "Prąd (A)", value: amperes });
    if (kva) inputs.push({ label: "Moc pozorna (kVA)", value: kva });
    if (amperes || kva) inputs.push({ label: "Napięcie (V)", value: voltage });
    return inputs;
  };

  const getPdfResults = () => {
    const results: { label: string; value: string; unit?: string }[] = [];
    if (mmSquared && awg) {
      results.push({ label: "Przekrój mm²", value: mmSquared, unit: "mm²" });
      results.push({ label: "Odpowiednik AWG", value: awg });
    }
    if (kW && hp) {
      results.push({ label: "Moc kW", value: kW, unit: "kW" });
      results.push({ label: "Moc HP", value: hp, unit: "HP" });
    }
    if (amperes && kva) {
      results.push({ label: "Prąd", value: amperes, unit: "A" });
      results.push({ label: "Moc pozorna", value: kva, unit: "kVA" });
    }
    return results;
  };

  const currentInputs = { mmSquared, awg, kW, hp, amperes, kva, voltage };

  const handleLoadInputs = (inputs: typeof currentInputs) => {
    setMmSquared(inputs.mmSquared); setAwg(inputs.awg);
    setKW(inputs.kW); setHP(inputs.hp);
    setAmperes(inputs.amperes); setKva(inputs.kva);
    setVoltage(inputs.voltage);
  };

  const handleReset = () => {
    setMmSquared(""); setAwg("");
    setKW(""); setHP("");
    setAmperes(""); setKva("");
    setVoltage("400");
  };

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Konwerter jednostek">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Link href="/dashboard/tools">
          <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </Link>
        <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
          <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
            Konwerter jednostek
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
            Szybka konwersja jednostek elektrycznych
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-sm md:text-base text-green-900 dark:text-green-100 font-semibold">
          Szybka konwersja bez tabliczek
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-300 mt-2">
          <div className="space-y-2 text-xs md:text-sm">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>mm² ↔ AWG:</strong> Konwersja przekrojów kabli między systemem metrycznym a amerykańskim
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>kW ↔ HP:</strong> Przeliczanie mocy silników (1 HP = 0.7457 kW)
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>A ↔ kVA:</strong> Szybkie obliczenie mocy pozornej dla instalacji 3-fazowych
              </span>
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="cable" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-lg">
          <TabsTrigger value="cable" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-3 rounded-lg font-semibold transition-all">
            mm² ↔ AWG
          </TabsTrigger>
          <TabsTrigger value="power" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-3 rounded-lg font-semibold transition-all">
            kW ↔ HP
          </TabsTrigger>
          <TabsTrigger value="current" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-3 rounded-lg font-semibold transition-all">
            A ↔ kVA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cable" className="space-y-4 mt-6">
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl">Przekrój kabla</CardTitle>
                  <CardDescription>Konwersja mm² na AWG i odwrotnie</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="uc-mm2" className="text-base font-semibold">mm² (metryczne)</Label>
                <Input
                  id="uc-mm2"
                  name="uc-mm2"
                  type="number"
                  placeholder="np. 2.5"
                  value={mmSquared}
                  onChange={(e) => handleMmChange(e.target.value)}
                  className="text-lg py-6 border-2"
                />
              </div>
              <div className="flex items-center justify-center py-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">AWG (amerykańskie)</Label>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 text-2xl font-bold text-blue-900 dark:text-blue-100 shadow-inner">
                  {awg || "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="power" className="space-y-4 mt-6">
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-600 text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl">Moc</CardTitle>
                  <CardDescription>Konwersja kiloWatów na konie mechaniczne</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="uc-kw" className="text-base font-semibold">kW (kiloWaty)</Label>
                <Input
                  id="uc-kw"
                  name="uc-kw"
                  type="number"
                  placeholder="np. 10"
                  value={kW}
                  onChange={(e) => handleKWChange(e.target.value)}
                  className="text-lg py-6 border-2"
                />
              </div>
              <div className="flex items-center justify-center py-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uc-hp" className="text-base font-semibold">HP (Horse Power)</Label>
                <Input
                  id="uc-hp"
                  name="uc-hp"
                  type="number"
                  placeholder="np. 13.41"
                  value={hp}
                  onChange={(e) => handleHPChange(e.target.value)}
                  className="text-lg py-6 border-2"
                />
              </div>
              <div className="relative overflow-hidden p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/30 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-2xl"></div>
                <div className="relative text-center">
                  <div className="font-bold text-green-900 dark:text-green-100 mb-2">Współczynniki konwersji</div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>1 kW = 1.341 HP</strong> | <strong>1 HP = 0.7457 kW</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="space-y-4 mt-6">
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600 text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl">Prąd i moc pozorna</CardTitle>
                  <CardDescription>Konwersja Amperów na kVA (dla 3-fazowego)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="uc-voltage" className="text-base font-semibold">Napięcie (V)</Label>
                <Input
                  id="uc-voltage"
                  name="uc-voltage"
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                  placeholder="np. 400"
                  className="text-lg py-6 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uc-amperes" className="text-base font-semibold">Ampery (A)</Label>
                <Input
                  id="uc-amperes"
                  name="uc-amperes"
                  type="number"
                  placeholder="np. 100"
                  value={amperes}
                  onChange={(e) => handleAmperesChange(e.target.value)}
                  className="text-lg py-6 border-2"
                />
              </div>
              <div className="flex items-center justify-center py-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uc-kva" className="text-base font-semibold">kVA (kiloVolt-Ampery)</Label>
                <Input
                  id="uc-kva"
                  name="uc-kva"
                  type="number"
                  placeholder="np. 69.28"
                  value={kva}
                  onChange={(e) => handleKvaChange(e.target.value)}
                  className="text-lg py-6 border-2"
                />
              </div>
              <div className="relative overflow-hidden p-4 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/30 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-2xl"></div>
                <div className="relative text-center">
                  <div className="font-bold text-purple-900 dark:text-purple-100 mb-2">Wzór (3-fazowe)</div>
                  <p className="text-sm text-purple-800 dark:text-purple-200 font-mono">
                    <strong>kVA = (A × V × √3) / 1000</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CalculatorActionBar
        calculatorId="unit-converter"
        title="Konwerter jednostek"
        hasResult={hasResult}
        pdfInputs={getPdfInputs()}
        pdfResults={getPdfResults()}
        notes="Konwersje oparte na standardowych współczynnikach. AWG ↔ mm² — przybliżenie do najbliższego standardowego przekroju."
        currentInputs={currentInputs}
        currentLabel={[
          mmSquared ? `${mmSquared}mm² → ${awg}` : "",
          kW ? `${kW}kW → ${hp}HP` : "",
          amperes ? `${amperes}A → ${kva}kVA` : "",
        ].filter(Boolean).join(", ") || "Konwersja"}
        onLoadInputs={handleLoadInputs}
        onReset={handleReset}
      />

      {/* Footer Alert */}
      <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">
          O standardach i wzorach
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
          <div className="space-y-2 text-xs md:text-sm">
            <p>
              <strong>AWG (American Wire Gauge)</strong> - system używany głównie w USA. Uwaga: większy numer AWG = mniejszy przekrój!
            </p>
            <p>
              <strong>HP (Horse Power)</strong> - jednostka mocy mechanicznej. Dla silników elektrycznych zawsze sprawdzaj moc nominalną na tabliczce znamionowej.
            </p>
            <p>
              <strong>kVA vs kW:</strong> kVA to moc pozorna, kW to moc czynna. Różnią się współczynnikiem mocy (cos φ).
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
    </CalculatorWrapper>
  );
}
