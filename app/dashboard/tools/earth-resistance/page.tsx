"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Anchor, AlertCircle, CheckCircle2, Lightbulb, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";

// Soil resistivity (Ω·m)
const SOIL_RESISTIVITY: Record<string, { value: number; description: string }> = {
  wet_organic: { value: 10, description: "Grunt organiczny mokry" },
  clay_wet: { value: 40, description: "Glina wilgotna" },
  clay_dry: { value: 100, description: "Glina sucha" },
  sand_wet: { value: 200, description: "Piasek wilgotny" },
  sand_dry: { value: 1000, description: "Piasek suchy" },
  gravel: { value: 3000, description: "Żwir" },
  rock: { value: 10000, description: "Skała" },
};

// Installation types
const INSTALLATION_TYPES: Record<string, { maxResistance: number; description: string }> = {
  tt_domestic: { maxResistance: 100, description: "TT mieszkalne (PN-IEC 60364)" },
  tt_industrial: { maxResistance: 30, description: "TT przemysłowe" },
  tn: { maxResistance: 1, description: "TN (bardzo niskie)" },
  lightning: { maxResistance: 10, description: "Odgromowe" },
  telecom: { maxResistance: 4, description: "Telekomunikacja" },
};

export default function EarthResistancePage() {
  const { isPro } = useToolsAccess();
  const [installationType, setInstallationType] = useState("tt_domestic");
  const [soilType, setSoilType] = useState("clay_wet");
  const [customResistivity, setCustomResistivity] = useState("");
  const [electrodeType, setElectrodeType] = useState("rod");
  const [electrodeLength, setElectrodeLength] = useState("1.5");
  const [electrodeDiameter, setElectrodeDiameter] = useState("16");
  const [numberOfElectrodes, setNumberOfElectrodes] = useState("1");
  const [spacing, setSpacing] = useState("3");
  
  const [result, setResult] = useState<{
    singleElectrodeResistance: number;
    totalResistance: number;
    requirementMet: boolean;
    maxAllowedResistance: number;
    recommendedElectrodes: number;
    resistanceWithRecommended: number;
    utilizationFactor: number;
  } | null>(null);

  const calculate = () => {
    const rho = customResistivity ? parseFloat(customResistivity) : SOIL_RESISTIVITY[soilType].value;
    const L = parseFloat(electrodeLength);
    const d = parseFloat(electrodeDiameter) / 1000; // Convert mm to m
    const n = parseInt(numberOfElectrodes);
    const s = parseFloat(spacing);
    const maxR = INSTALLATION_TYPES[installationType].maxResistance;

    if (!rho || !L || !d || !n) return;

    // 1. Calculate single electrode resistance
    let R1: number;
    
    if (electrodeType === "rod") {
      // Vertical rod: R = ρ / (2πL) × ln(4L/d)
      R1 = (rho / (2 * Math.PI * L)) * Math.log(4 * L / d);
    } else if (electrodeType === "plate") {
      // Horizontal plate (approximation): R = ρ / (4 × √A)
      // Assume square plate with side = L
      const A = L * L; // Area in m²
      R1 = rho / (4 * Math.sqrt(A));
    } else {
      // Horizontal strip: R = ρ / (πL) × ln(L²/d×L)
      R1 = (rho / (Math.PI * L)) * Math.log((L * L) / (d * L));
    }

    // 2. Calculate total resistance for multiple electrodes
    // Utilization factor η (efficiency) depends on spacing
    // η ≈ 1 / (1 + (L/s) × (n-1)/n)
    let eta = 1.0;
    if (n > 1) {
      eta = 1 / (1 + (L / s) * ((n - 1) / n));
    }
    
    const Rtotal = (R1 / n) / eta;

    // 3. Check if requirement is met
    const requirementMet = Rtotal <= maxR;

    // 4. Calculate recommended number of electrodes if requirement not met
    let recommendedElectrodes = n;
    let resistanceWithRecommended = Rtotal;
    
    if (!requirementMet) {
      // Iterate to find minimum number of electrodes needed
      for (let testN = n + 1; testN <= 50; testN++) {
        const testEta = 1 / (1 + (L / s) * ((testN - 1) / testN));
        const testR = (R1 / testN) / testEta;
        if (testR <= maxR) {
          recommendedElectrodes = testN;
          resistanceWithRecommended = testR;
          break;
        }
      }
    }

    // 5. Utilization factor (how close to limit)
    const utilizationFactor = (Rtotal / maxR) * 100;

    setResult({
      singleElectrodeResistance: R1,
      totalResistance: Rtotal,
      requirementMet,
      maxAllowedResistance: maxR,
      recommendedElectrodes,
      resistanceWithRecommended,
      utilizationFactor,
    });
  };

  const canCalculate = !!numberOfElectrodes && parseInt(numberOfElectrodes) > 0;

  const getPdfInputs = () => [
    { label: "Typ instalacji", value: INSTALLATION_TYPES[installationType].description },
    { label: "Typ gruntu", value: customResistivity ? `Własna (${customResistivity} Ω·m)` : SOIL_RESISTIVITY[soilType].description },
    { label: "Rezystywność ρ", value: `${customResistivity || SOIL_RESISTIVITY[soilType].value} Ω·m` },
    { label: "Typ elektrody", value: electrodeType === "rod" ? "Pręt pionowy" : electrodeType === "plate" ? "Płyta pozioma" : "Taśma pozioma" },
    { label: "Długość elektrody", value: `${electrodeLength} m` },
    { label: "Średnica elektrody", value: `${electrodeDiameter} mm` },
    { label: "Liczba elektrod", value: numberOfElectrodes },
    { label: "Rozstaw", value: `${spacing} m` },
  ];

  const getPdfResults = () =>
    result
      ? [
          { label: "Opór pojedynczej elektrody", value: result.singleElectrodeResistance.toFixed(2), unit: "Ω" },
          { label: "Opór uziemienia (całkowity)", value: result.totalResistance.toFixed(2), unit: "Ω", highlight: true },
          { label: "Wymagany max.", value: result.maxAllowedResistance.toFixed(0), unit: "Ω" },
          { label: "Spełnia wymagania", value: result.requirementMet ? "TAK ✓" : "NIE ✗" },
          { label: "Wykorzystanie limitu", value: result.utilizationFactor.toFixed(0), unit: "%" },
          ...(!result.requirementMet && result.recommendedElectrodes > parseInt(numberOfElectrodes)
            ? [{ label: "Zalecana liczba elektrod", value: result.recommendedElectrodes.toString() }]
            : []),
        ]
      : [];

  const currentInputs = { installationType, soilType, customResistivity, electrodeType, electrodeLength, electrodeDiameter, numberOfElectrodes, spacing };

  const handleLoadInputs = (inputs: typeof currentInputs) => {
    setInstallationType(inputs.installationType); setSoilType(inputs.soilType);
    setCustomResistivity(inputs.customResistivity); setElectrodeType(inputs.electrodeType);
    setElectrodeLength(inputs.electrodeLength); setElectrodeDiameter(inputs.electrodeDiameter);
    setNumberOfElectrodes(inputs.numberOfElectrodes); setSpacing(inputs.spacing);
    setResult(null);
  };

  const handleReset = () => {
    setInstallationType("tt_domestic"); setSoilType("clay_wet");
    setCustomResistivity(""); setElectrodeType("rod");
    setElectrodeLength("1.5"); setElectrodeDiameter("16");
    setNumberOfElectrodes("1"); setSpacing("3");
    setResult(null);
  };

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator uziemienia">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Link href="/dashboard/tools">
          <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </Link>
        <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 shadow-md">
          <Anchor className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
            Kalkulator uziemienia
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
            Oblicz opór uziemienia zgodnie z PN-IEC 61936-1
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">
          Wymagania dotyczące uziemienia
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
          <div className="space-y-2 text-xs md:text-sm">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>TT mieszkalne:</strong> R ≤ 100Ω (z RCD 30mA: 30mA × 100Ω = 3V &lt; 50V)
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>TT przemysłowe:</strong> R ≤ 30Ω (niższe napięcia dotykowe)
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Odgromowe:</strong> R ≤ 10Ω (skuteczne odprowadzenie ładunku)
              </span>
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="border-2 shadow-xl">
          <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-amber-50/50 dark:from-slate-900 dark:to-amber-950/20 border-b">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base md:text-xl">Parametry uziemienia</CardTitle>
                <CardDescription className="text-xs md:text-sm">Wprowadź dane techniczne</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
            <div className="space-y-2">
              <Label htmlFor="er-installation-type">Typ instalacji</Label>
              <Select value={installationType} onValueChange={setInstallationType}>
                <SelectTrigger id="er-installation-type" className="text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSTALLATION_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.description} (R ≤ {value.maxResistance}Ω)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-soil-type">Typ gruntu</Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger id="er-soil-type" className="text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOIL_RESISTIVITY).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.description} (ρ = {value.value} Ω·m)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-resistivity">Rezystywność gruntu ρ (Ω·m) - opcjonalnie</Label>
              <Input
                id="er-resistivity"
                name="er-resistivity"
                type="number"
                placeholder="Zostaw puste dla wybranego typu gruntu"
                value={customResistivity}
                onChange={(e) => setCustomResistivity(e.target.value)}
                className="text-xs md:text-sm h-9"
              />
              <p className="text-[10px] text-slate-500">Z pomiarów geodezyjnych (metoda Wennera)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-electrode-type">Typ elektrody</Label>
              <Select value={electrodeType} onValueChange={setElectrodeType}>
                <SelectTrigger id="er-electrode-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rod">Pręt pionowy (najczęstszy)</SelectItem>
                  <SelectItem value="strip">Taśma pozioma</SelectItem>
                  <SelectItem value="plate">Płyta pozioma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-electrode-length">Długość elektrody L (m)</Label>
              <Select value={electrodeLength} onValueChange={setElectrodeLength}>
                <SelectTrigger id="er-electrode-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.5">1.5 m (standard mieszkalne)</SelectItem>
                  <SelectItem value="2.0">2.0 m</SelectItem>
                  <SelectItem value="2.5">2.5 m (zalecane)</SelectItem>
                  <SelectItem value="3.0">3.0 m (przemysłowe)</SelectItem>
                  <SelectItem value="4.0">4.0 m</SelectItem>
                  <SelectItem value="5.0">5.0 m (trudny grunt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-electrode-diameter">Średnica/szerokość elektrody (mm)</Label>
              <Select value={electrodeDiameter} onValueChange={setElectrodeDiameter}>
                <SelectTrigger id="er-electrode-diameter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 mm (minimum)</SelectItem>
                  <SelectItem value="16">16 mm (standard)</SelectItem>
                  <SelectItem value="20">20 mm (przemysłowe)</SelectItem>
                  <SelectItem value="25">25 mm (ciężkie)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-num-electrodes">Liczba elektrod</Label>
              <Input
                id="er-num-electrodes"
                name="er-num-electrodes"
                type="number"
                min="1"
                max="50"
                value={numberOfElectrodes}
                onChange={(e) => setNumberOfElectrodes(e.target.value)}
                className="text-base md:text-lg py-5 md:py-6 border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="er-spacing">Rozstaw elektrod (m)</Label>
              <Input
                id="er-spacing"
                name="er-spacing"
                type="number"
                step="0.5"
                min="1"
                value={spacing}
                onChange={(e) => setSpacing(e.target.value)}
                className="text-xs md:text-sm h-9"
              />
              <p className="text-[10px] text-slate-500">Zalecane: s ≥ 2×L (minimum 3m)</p>
            </div>

            <Button 
              onClick={calculate}
              disabled={!canCalculate}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg text-sm md:text-base py-5 md:py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Anchor className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Oblicz opór uziemienia
            </Button>

            <CalculatorActionBar
              calculatorId="earth-resistance"
              title="Kalkulator uziemienia"
              hasResult={!!result}
              pdfInputs={getPdfInputs()}
              pdfResults={getPdfResults()}
              standard="PN-IEC 61936-1"
              notes="Wyniki orientacyjne. Rzeczywisty opór uziemienia zależy od warunków gruntowych i powinien być zweryfikowany pomiarami."
              currentInputs={currentInputs}
              currentLabel={`${numberOfElectrodes}× ${electrodeType === "rod" ? "pręt" : electrodeType === "plate" ? "płyta" : "taśma"} ${electrodeLength}m, ${SOIL_RESISTIVITY[soilType]?.description || "własna ρ"}`}
              onLoadInputs={handleLoadInputs}
              onReset={handleReset}
            />
          </CardContent>
        </Card>

        <Card className="border-2 shadow-xl">
          <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-amber-50/50 dark:from-slate-900 dark:to-amber-950/20 border-b">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base md:text-xl">Wyniki obliczeń</CardTitle>
                <CardDescription className="text-xs md:text-sm">Opór uziemienia</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {result ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Total Resistance - BIG */}
                <div className={`relative overflow-hidden p-4 md:p-6 rounded-2xl border-2 shadow-lg ${
                  result.requirementMet
                    ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/30 border-green-300 dark:border-green-800'
                    : 'bg-gradient-to-br from-red-50 via-orange-50 to-pink-100 dark:from-red-950/20 dark:via-orange-950/20 dark:to-pink-950/30 border-red-300 dark:border-red-800'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      {result.requirementMet ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      )}
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Opór uziemienia
                      </p>
                    </div>
                    <p className={`text-4xl md:text-5xl font-bold ${
                      result.requirementMet ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.totalResistance.toFixed(2)} Ω
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-3">
                      Wymagane: ≤ {result.maxAllowedResistance} Ω
                    </p>
                    <p className={`text-xs md:text-sm font-semibold mt-2 ${
                      result.requirementMet ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {result.requirementMet ? '✓ Spełnia wymagania' : '✗ Nie spełnia wymagań'}
                    </p>
                  </div>
                </div>

                {/* Single Electrode */}
                <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                    Opór pojedynczej elektrody
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {result.singleElectrodeResistance.toFixed(2)} Ω
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {electrodeType === 'rod' ? 'Pręt pionowy' : electrodeType === 'plate' ? 'Płyta pozioma' : 'Taśma pozioma'}
                    , L={electrodeLength}m, d={electrodeDiameter}mm
                  </p>
                </div>

                {/* Utilization */}
                <div className={`p-3 md:p-4 rounded-xl border-2 ${
                  result.utilizationFactor <= 80 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                    : result.utilizationFactor <= 100
                    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                }`}>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                    Wykorzystanie limitu
                  </p>
                  <p className={`text-2xl md:text-3xl font-bold ${
                    result.utilizationFactor <= 80 ? 'text-green-600 dark:text-green-400' :
                    result.utilizationFactor <= 100 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {result.utilizationFactor.toFixed(0)}%
                  </p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full transition-all ${
                        result.utilizationFactor <= 80 ? 'bg-green-500' :
                        result.utilizationFactor <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(result.utilizationFactor, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recommendation if not met */}
                {!result.requirementMet && result.recommendedElectrodes > parseInt(numberOfElectrodes) && (
                  <div className="p-3 md:p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border-2 border-orange-300 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <p className="text-xs md:text-sm text-orange-900 dark:text-orange-100 font-semibold">
                        Zalecana konfiguracja
                      </p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                      {result.recommendedElectrodes} elektrod
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Opór: {result.resistanceWithRecommended.toFixed(2)} Ω
                    </p>
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Dodatkowe elektrody: {result.recommendedElectrodes - parseInt(numberOfElectrodes)}
                    </p>
                  </div>
                )}

                {/* Soil Info */}
                <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-300 dark:border-purple-800">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                    Parametry gruntu
                  </p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ρ = {customResistivity || SOIL_RESISTIVITY[soilType].value} Ω·m
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {SOIL_RESISTIVITY[soilType]?.description || "Wartość własna"}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700">
                  <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">
                    💡 Rekomendacje:
                  </p>
                  <ul className="space-y-1 text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
                    {!result.requirementMet && (
                      <li className="text-red-600 dark:text-red-400 font-semibold">
                        • Zwiększ liczbę elektrod lub długość elektrod!
                      </li>
                    )}
                    {parseFloat(spacing) < parseFloat(electrodeLength) * 2 && (
                      <li className="text-yellow-600 dark:text-yellow-400">
                        • Rozstaw elektrod powinien być ≥ 2×L dla optymalnej efektywności
                      </li>
                    )}
                    <li>• Zainstaluj elektrody w miejscach wilgotnych (lepszy kontakt)</li>
                    <li>• Użyj złączy miedzianych ocynkowanych (korozja!)</li>
                    <li>• Wypełnij wykopy bentonitem lub specjalną mieszanką (obniża ρ)</li>
                    <li>• Wykonaj pomiar oporu miernikiem uziemień (metoda 3-punktowa)</li>
                    <li>• Dokumentuj układ elektrod na planie (przyszłe rozbudowy)</li>
                    {result.totalResistance < result.maxAllowedResistance * 0.5 && (
                      <li className="text-green-600 dark:text-green-400">
                        • Duża rezerwa - uziemienie odporne na zmiany wilgotności gruntu
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 md:py-16">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-amber-200 dark:bg-amber-800 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <Anchor className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">
                  Wprowadź parametry uziemienia
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mt-2">
                  Sprawdź opór uziemienia
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Alert */}
      <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">
          Ważne informacje o uziemieniach
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
          <div className="space-y-2 text-xs md:text-sm">
            <p>
              Prawidłowe uziemienie to <strong>podstawa bezpieczeństwa</strong> instalacji elektrycznych:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
              <li><strong>Pomiar:</strong> wykonuj co 5 lat (metoda spadku potencjału - 3 punkty)</li>
              <li><strong>Rozstaw:</strong> minimum 2×L (lepiej 3×L) dla uniknięcia wzajemnego wpływu</li>
              <li><strong>Głębokość:</strong> minimum 0.8m (poniżej strefy przemarzania)</li>
              <li><strong>Materiał:</strong> miedź ≥14mm, stal ocynkowana ≥16mm (korozja!)</li>
              <li><strong>Bentonit:</strong> obniża opór o 30-50% (szczególnie w suchym gruncie)</li>
              <li><strong>Sezonowość:</strong> opór rośnie zimą (zmarznięty grunt) i latem (suchy grunt)</li>
            </ul>
            <p className="mt-2 font-medium">
              Normy: <strong>PN-IEC 61936-1, PN-HD 60364-5-54, IEEE 80</strong>
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
    </CalculatorWrapper>
  );
}
