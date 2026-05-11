"use client";

import { useState } from "react";
import { Check, Loader2, MapPin, Banknote, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateGlobalHourlyRate } from "@/app/dashboard/settings/knr-calculator/actions";
import { updateUserRegion } from "@/app/dashboard/settings/region-actions";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface InlineRateRegionProps {
  initialRate: number;
  initialRegionId: string | null;
  regions: Region[];
}

export function InlineRateRegion({ initialRate, initialRegionId, regions }: InlineRateRegionProps) {
  const { toast } = useToast();

  // Rate state
  const [rateInput, setRateInput] = useState(initialRate > 0 ? String(initialRate) : "");
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  // Region state
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegionId ?? "");
  const [isSavingRegion, setIsSavingRegion] = useState(false);

  const handleSaveRate = async () => {
    const rate = parseFloat(rateInput);
    if (isNaN(rate) || rate < 1 || rate > 9999) return;
    setIsSavingRate(true);
    const result = await updateGlobalHourlyRate(rate);
    setIsSavingRate(false);
    if (result.success) {
      setRateSaved(true);
      toast({ title: "Stawka zapisana", description: `${rate} PLN/r-g` });
      setTimeout(() => setRateSaved(false), 2000);
    }
  };

  const handleRegionChange = async (regionId: string) => {
    setSelectedRegionId(regionId);
    setIsSavingRegion(true);
    const result = await updateUserRegion(regionId);
    setIsSavingRegion(false);
    if (result.success) {
      const region = regions.find((r) => r.id === regionId);
      toast({ title: "Region zapisany", description: region?.name ?? "Brak korekty" });
    }
  };

  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Rate Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 rounded-lg p-1.5 sm:p-2">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Stawka roboczogodziny (r-g)</CardTitle>
              <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                Podstawa wszystkich wycen kosztorysowych — PLN netto za godzinę
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={9999}
              value={rateInput}
              onChange={(e) => { setRateInput(e.target.value); setRateSaved(false); }}
              placeholder="np. 75"
              className="w-32 text-center text-lg font-bold"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">PLN/r-g</span>
            <Button
              onClick={handleSaveRate}
              disabled={isSavingRate || !rateInput || parseFloat(rateInput) < 1}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
            >
              {isSavingRate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : rateSaved ? (
                <><Check className="w-4 h-4 mr-1" /> Zapisano</>
              ) : (
                "Zapisz"
              )}
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Średnia krajowa: 70–90 PLN/r-g. Zmiana stawki automatycznie przelicza ceny w katalogu i zestawach.
          </p>
        </CardContent>
      </Card>

      {/* Region Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg p-1.5 sm:p-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Województwo</CardTitle>
              <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                Korekta regionalna stawek — ceny różnią się w zależności od lokalizacji
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <select
              value={selectedRegionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={isSavingRegion}
              className="flex-1 h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Brak korekty (×1.00)</option>
              {[...regions]
                .sort((a, b) => b.price_modifier - a.price_modifier)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (×{r.price_modifier.toFixed(2)})
                  </option>
                ))}
            </select>
            {isSavingRegion && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
          {selectedRegion && rateInput && parseFloat(rateInput) > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700 dark:text-blue-300">Efektywna stawka w {selectedRegion.name}:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {(parseFloat(rateInput) * selectedRegion.price_modifier).toFixed(0)} PLN/r-g
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to full KNR page */}
      <Link href="/dashboard/settings/knr-calculator?tab=centrum" className="block">
        <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-900 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Zaawansowane ustawienia wycen</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Upload KNR, Sandbox, Kalibracja silnika, Narzuty materiałowe</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
