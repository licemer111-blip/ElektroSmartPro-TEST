"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Lightbulb, Info, CheckCircle2 } from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";
import { useToolsAccess } from "@/components/tools/tools-provider";
import {
  LightingParams, calculateLighting,
  ROOM_TYPES, LUMINAIRE_TYPES, UTILIZATION_FACTORS, MAINTENANCE_FACTORS,
} from "../_lib/engine";

const DEFAULT: LightingParams = {
  roomType: "office", area: "", height: "2.8", luminaireType: "ledPanel",
  luminaireOutput: "3000", roomSize: "medium", maintenance: "good", colorTemp: "4000",
};

export function LightingCalculatorShell() {
  const { isPro } = useToolsAccess();
  const [p, setP] = useState<LightingParams>(DEFAULT);
  const set = (field: keyof LightingParams, value: string) => setP((prev) => ({ ...prev, [field]: value }));

  const result = calculateLighting(p);
  const hasResult = !!result;

  const pdfInputs = [
    { label: "Typ pomieszczenia", value: ROOM_TYPES[p.roomType]?.description ?? p.roomType },
    { label: "Powierzchnia", value: `${p.area} m²` },
    { label: "Typ oprawy", value: LUMINAIRE_TYPES[p.luminaireType]?.description ?? p.luminaireType },
    { label: "Strumień", value: `${p.luminaireOutput} lm` },
    { label: "UF", value: String(UTILIZATION_FACTORS[p.roomSize] ?? 0.55) },
    { label: "MF", value: String(MAINTENANCE_FACTORS[p.maintenance] ?? 0.80) },
  ];
  const pdfResults = result ? [
    { label: "Liczba opraw", value: result.numberOfLuminaires.toString(), unit: "szt.", highlight: true },
    { label: "Wymagane", value: result.requiredLux.toString(), unit: "lx" },
    { label: "Rzeczywiste", value: result.actualLux.toFixed(0), unit: "lx" },
    { label: "Całkowita moc", value: result.totalPower.toFixed(0), unit: "W" },
    { label: "Gęstość mocy", value: result.lightingDensity.toFixed(1), unit: "W/m²" },
  ] : [];

  const handleReset = () => setP(DEFAULT);
  const categories = [...new Set(Object.values(ROOM_TYPES).map((r) => r.category))];

  return (
    <CalculatorWrapper isPro={isPro} calculatorName="Kalkulator oświetlenia">
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 md:px-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Link href="/dashboard/tools">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" aria-label="Wróć do narzędzi">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </Link>
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 shadow-md">
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">Kalkulator oświetlenia</h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">Oblicz ilość opraw zgodnie z PN-EN 12464-1</p>
          </div>
        </div>

        <Alert className="p-3 md:p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
          <AlertTitle className="text-sm md:text-base text-purple-900 dark:text-purple-100 font-semibold">Metoda strumienia świetlnego - PN-EN 12464-1</AlertTitle>
          <AlertDescription className="text-purple-800 dark:text-purple-300 mt-1 text-xs md:text-sm">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-purple-600 inline" /> <strong>UF</strong> — współczynnik wykorzystania · <strong>MF</strong> — współczynnik konserwacji</span>
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-purple-50/50 dark:from-slate-900 dark:to-purple-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Parametry pomieszczenia</CardTitle>
              <CardDescription className="text-xs md:text-sm">Wprowadź dane techniczne</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="space-y-2">
                <Label htmlFor="light-room-type">Typ pomieszczenia</Label>
                <Select name="light-room-type" value={p.roomType} onValueChange={(v) => set("roomType", v)}>
                  <SelectTrigger id="light-room-type" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <>
                        <SelectItem key={`h-${cat}`} value={`h-${cat}`} disabled className="font-bold text-xs">{cat}</SelectItem>
                        {Object.entries(ROOM_TYPES).filter(([, v]) => v.category === cat).map(([key, val]) => (
                          <SelectItem key={key} value={key} className="text-xs">{val.description} ({val.lux} lx)</SelectItem>
                        ))}
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="light-area">Powierzchnia (m²)</Label>
                <Input id="light-area" name="light-area" type="number" value={p.area} onChange={(e) => set("area", e.target.value)}
                  className="text-base md:text-lg py-5 md:py-6 border-2" placeholder="np. 30" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="light-room-size">Wielkość pom. (UF)</Label>
                  <Select name="light-room-size" value={p.roomSize} onValueChange={(v) => set("roomSize", v)}>
                    <SelectTrigger id="light-room-size" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small" className="text-xs">Małe (&lt;20m², UF=0.40)</SelectItem>
                      <SelectItem value="medium" className="text-xs">Średnie (20-50m², UF=0.55)</SelectItem>
                      <SelectItem value="large" className="text-xs">Duże (50-200m², UF=0.65)</SelectItem>
                      <SelectItem value="very-large" className="text-xs">B. duże (&gt;200m², UF=0.70)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-maintenance">Konserwacja (MF)</Label>
                  <Select name="light-maintenance" value={p.maintenance} onValueChange={(v) => set("maintenance", v)}>
                    <SelectTrigger id="light-maintenance" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent" className="text-xs">Doskonała (MF=0.90)</SelectItem>
                      <SelectItem value="good" className="text-xs">Dobra (MF=0.80)</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normalna (MF=0.70)</SelectItem>
                      <SelectItem value="poor" className="text-xs">Słaba (MF=0.60)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="light-luminaire-type">Typ oprawy</Label>
                <Select name="light-luminaire-type" value={p.luminaireType} onValueChange={(v) => set("luminaireType", v)}>
                  <SelectTrigger id="light-luminaire-type" className="text-xs md:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LUMINAIRE_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="text-xs">{val.description} (CRI={val.cri})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="light-luminaire-output">Strumień (lm)</Label>
                  <Select name="light-luminaire-output" value={p.luminaireOutput} onValueChange={(v) => set("luminaireOutput", v)}>
                    <SelectTrigger id="light-luminaire-output" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["800","1200","1600","2000","3000","4000","6000","10000","15000"].map((lm) => (
                        <SelectItem key={lm} value={lm} className="text-xs">{lm} lm</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="light-color-temp">Temperatura (K)</Label>
                  <Select name="light-color-temp" value={p.colorTemp} onValueChange={(v) => set("colorTemp", v)}>
                    <SelectTrigger id="light-color-temp" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2700" className="text-xs">2700K (ciepła)</SelectItem>
                      <SelectItem value="3000" className="text-xs">3000K (ciepła)</SelectItem>
                      <SelectItem value="4000" className="text-xs">4000K (neutralna)</SelectItem>
                      <SelectItem value="5000" className="text-xs">5000K (zimna)</SelectItem>
                      <SelectItem value="6500" className="text-xs">6500K (dzienna)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CalculatorActionBar
                calculatorId="lighting"
                title="Kalkulator oświetlenia"
                hasResult={hasResult}
                pdfInputs={pdfInputs}
                pdfResults={pdfResults}
                standard="PN-EN 12464-1"
                notes="Metoda strumienia świetlnego z UF i MF. Wyniki orientacyjne."
                currentInputs={p as unknown as Record<string, string>}
                currentLabel={`${ROOM_TYPES[p.roomType]?.description}, ${p.area}m²`}
                onLoadInputs={(inputs) => setP(inputs as unknown as LightingParams)}
                onReset={handleReset}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-purple-50/50 dark:from-slate-900 dark:to-purple-950/20 border-b">
              <CardTitle className="text-base md:text-xl">Wyniki obliczeń</CardTitle>
              <CardDescription className="text-xs md:text-sm">Zapotrzebowanie na oświetlenie</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {result ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative overflow-hidden p-4 md:p-6 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-rose-950/30 border-2 border-purple-300 dark:border-purple-800 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Liczba opraw</p>
                      <p className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400">{result.numberOfLuminaires}</p>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2">{LUMINAIRE_TYPES[p.luminaireType]?.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-300 dark:border-blue-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Wymagane</p>
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{result.requiredLux} lx</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-300 dark:border-green-800">
                      <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1">Rzeczywiste</p>
                      <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{result.actualLux.toFixed(0)} lx</p>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border-2 border-orange-300 dark:border-orange-800">
                    <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Całkowita moc</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{result.totalPower.toFixed(0)} W</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-1">Gęstość: {result.lightingDensity.toFixed(1)} W/m²</p>
                  </div>

                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div>UF: <strong>{result.utilizationFactor.toFixed(2)}</strong></div>
                      <div>MF: <strong>{result.maintenanceFactor.toFixed(2)}</strong></div>
                      <div>Sprawność: <strong>{result.efficacy} lm/W</strong></div>
                      <div>CRI: <strong>{result.cri}</strong>, {p.colorTemp}K</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-purple-200 dark:bg-purple-800 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <Lightbulb className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Wprowadź parametry pomieszczenia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm md:text-base text-amber-900 dark:text-amber-100 font-semibold">Wzór: N = (E × A) / (LO × UF × MF)</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2 text-xs md:text-sm">
            Dla projektów komercyjnych zalecamy symulację <strong>DIALux</strong> lub <strong>Relux</strong>. CRI ≥ 80 dla biur, ≥ 90 dla sklepów.
          </AlertDescription>
        </Alert>
      </div>
    </CalculatorWrapper>
  );
}
