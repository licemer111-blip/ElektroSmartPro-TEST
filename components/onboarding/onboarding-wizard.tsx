"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Zap, ChevronRight, Check, Loader2, Banknote, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { completeOnboardingSetup } from "@/app/dashboard/onboarding-actions";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface OnboardingWizardProps {
  regions: Region[];
  userName?: string | null;
}

const RATE_PRESETS = [
  { label: "Początkujący", value: 55, desc: "Start kariery" },
  { label: "Standardowa", value: 75, desc: "Średnia krajowa" },
  { label: "Doświadczony", value: 95, desc: "5+ lat doświadczenia" },
  { label: "Ekspert", value: 120, desc: "Specjalista / SEP" },
];

// Group regions by price level for better UX
function getRegionGroup(modifier: number): "high" | "mid" | "low" {
  if (modifier >= 1.08) return "high";
  if (modifier >= 0.96) return "mid";
  return "low";
}

const GROUP_COLORS = {
  high: "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20",
  mid: "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20",
  low: "border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30",
} as const;

export function OnboardingWizard({ regions, userName }: OnboardingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [rateInput, setRateInput] = useState("75");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;
  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  const handleRatePreset = (value: number) => {
    setHourlyRate(value);
    setRateInput(String(value));
  };

  const handleRateInput = (val: string) => {
    setRateInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 1 && num <= 9999) {
      setHourlyRate(num);
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingSetup({
        hourlyRate,
        regionId: selectedRegionId,
        companyName: companyName.trim() || undefined,
      });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Wystąpił błąd");
      }
    });
  };

  // Computed preview
  const effectiveRate = selectedRegion
    ? Math.round(hourlyRate * selectedRegion.price_modifier * 100) / 100
    : hourlyRate;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8 animate-in fade-in duration-700">
      <div className="w-full max-w-xl">
        {/* Logo + Welcome */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {userName ? `Witaj, ${userName.split(" ")[0]}!` : "Witaj w ElektroSmart!"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Skonfiguruj podstawowe parametry — zajmie to 30 sekund.
            Dzięki temu kosztorysy będą od razu dokładne.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6 px-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < step
                    ? "bg-blue-600"
                    : i === step
                      ? "bg-blue-400 dark:bg-blue-500"
                      : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            </div>
          ))}
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums ml-1">
            {step + 1}/{totalSteps}
          </span>
        </div>

        {/* Step Content */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-900">
          <CardContent className="p-6 sm:p-8">

            {/* ═══ STEP 0: STAWKA R-G ═══ */}
            {step === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Twoja stawka roboczogodziny</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Podstawa wszystkich wycen kosztorysowych (PLN/r-g netto)
                    </p>
                  </div>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-2">
                  {RATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleRatePreset(preset.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        hourlyRate === preset.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{preset.label}</span>
                        <span className={`text-lg font-bold ${
                          hourlyRate === preset.value ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                        }`}>
                          {preset.value} zł
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{preset.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Własna stawka:</span>
                  <Input
                    type="number"
                    min={1}
                    max={9999}
                    value={rateInput}
                    onChange={(e) => handleRateInput(e.target.value)}
                    className="w-24 text-center font-bold text-lg"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">PLN/r-g</span>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                  Możesz zmienić tę stawkę w dowolnym momencie w Ustawieniach.
                </p>
              </div>
            )}

            {/* ═══ STEP 1: WOJEWÓDZTWO ═══ */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                    <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Twoje województwo</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Stawki różnią się regionalnie — wybierz gdzie pracujesz
                    </p>
                  </div>
                </div>

                {/* Region grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {[...regions]
                    .sort((a, b) => b.price_modifier - a.price_modifier)
                    .map((region) => {
                      const group = getRegionGroup(region.price_modifier);
                      const isSelected = selectedRegionId === region.id;
                      const pctDiff = Math.round((region.price_modifier - 1) * 100);
                      return (
                        <button
                          key={region.id}
                          onClick={() => setSelectedRegionId(isSelected ? null : region.id)}
                          className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md ring-1 ring-blue-400/50"
                              : GROUP_COLORS[group] + " hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"
                            }`}>
                              {region.name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                          <span className={`text-xs ${
                            pctDiff > 0 ? "text-green-600 dark:text-green-400" : pctDiff < 0 ? "text-red-500 dark:text-red-400" : "text-slate-500"
                          }`}>
                            {pctDiff > 0 ? "+" : ""}{pctDiff}% vs średnia
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Preview */}
                {selectedRegion && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 dark:text-blue-300">Twoja efektywna stawka w {selectedRegion.name}:</span>
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400">{effectiveRate} PLN/r-g</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedRegionId(null)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Pomiń — ustaw później
                </button>
              </div>
            )}

            {/* ═══ STEP 2: PODSUMOWANIE + FIRMA (opcja) ═══ */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Prawie gotowe!</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Opcjonalnie podaj nazwę firmy — pojawi się na dokumentach PDF
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Stawka r-g</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{hourlyRate} PLN/r-g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Województwo</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedRegion ? `${selectedRegion.name} (×${selectedRegion.price_modifier})` : "Nie wybrano"}
                    </span>
                  </div>
                  {selectedRegion && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Efektywna stawka</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{effectiveRate} PLN/r-g</span>
                    </div>
                  )}
                </div>

                {/* Company name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nazwa firmy <span className="text-slate-400 font-normal">(opcjonalnie)</span>
                  </label>
                  <Input
                    placeholder="np. EL-MONT Jan Kowalski"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Dane firmy możesz uzupełnić później w Ustawieniach → Profil Firmy.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 0 ? (
                <Button variant="ghost" onClick={handleBack} disabled={isPending} className="text-sm">
                  Wstecz
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  Dalej
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 shadow-lg shadow-blue-500/25 min-w-[160px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Zapisuję...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Rozpocznij pracę
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
