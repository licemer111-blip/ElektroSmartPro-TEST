"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateUserRegion } from "@/app/dashboard/settings/region-actions";
import { getProfile } from "@/app/dashboard/settings/actions";
import { cn } from "@/lib/utils";

interface RegionGridSelectorProps {
  currentRegion?: string;
  currentRegionName?: string;
}

// 16 Polish Voivodeships
const VOIVODESHIPS = [
  { id: "dolnoslaskie", name: "Dolnośląskie" },
  { id: "kujawsko-pomorskie", name: "Kujawsko-Pomorskie" },
  { id: "lubelskie", name: "Lubelskie" },
  { id: "lubuskie", name: "Lubuskie" },
  { id: "lodzkie", name: "Łódzkie" },
  { id: "malopolskie", name: "Małopolskie" },
  { id: "mazowieckie", name: "Mazowieckie" },
  { id: "opolskie", name: "Opolskie" },
  { id: "podkarpackie", name: "Podkarpackie" },
  { id: "podlaskie", name: "Podlaskie" },
  { id: "pomorskie", name: "Pomorskie" },
  { id: "slaskie", name: "Śląskie" },
  { id: "swietokrzyskie", name: "Świętokrzyskie" },
  { id: "warminsko-mazurskie", name: "Warmińsko-Mazurskie" },
  { id: "wielkopolskie", name: "Wielkopolskie" },
  { id: "zachodniopomorskie", name: "Zachodniopomorskie" },
];

/**
 * Regional Grid Selector
 * 
 * Clean, professional grid of 16 voivodeship cards
 * No more maps - just simple, elegant tiles
 */
export function RegionGridSelector({
  currentRegion,
  currentRegionName,
}: RegionGridSelectorProps) {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined);
  const [selectedRegionName, setSelectedRegionName] = useState<string | undefined>(undefined);
  const [savedRegion, setSavedRegion] = useState<string | undefined>(undefined); // Track DB value
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  // CRITICAL FIX: Load saved region from DB on component mount
  useEffect(() => {
    async function loadSavedRegion() {
      try {
        const { data: profile, error } = await getProfile();
        
        if (error) {
          console.error("❌ [RegionGridSelector] Failed to load profile:", error);
          setIsLoading(false);
          return;
        }

        if (profile?.default_region_id) {
          const savedRegionId = profile.default_region_id.trim();
          
          // Find the region name from VOIVODESHIPS
          const region = VOIVODESHIPS.find(v => v.id === savedRegionId);
          
          if (region) {
            setSavedRegion(savedRegionId);
            setSelectedRegion(savedRegionId);
            setSelectedRegionName(region.name);
          } else {
            console.error("[RegionGridSelector] Region ID not found in VOIVODESHIPS:", savedRegionId);
          }
        }
      } catch (error) {
        console.error("💥 [RegionGridSelector] Exception loading region:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedRegion();
  }, []); // Run only once on mount

  const hasChanges = selectedRegion !== savedRegion;

  const handleRegionSelect = (regionId: string, regionName: string) => {
    setSelectedRegion(regionId);
    setSelectedRegionName(regionName);
  };

  const handleSave = () => {
    if (!selectedRegion) {
      toast.error("Wybierz województwo");
      return;
    }

    startTransition(async () => {
      const result = await updateUserRegion(selectedRegion);

      if (result.success) {
        toast.success(`Zmieniono region na: ${selectedRegionName}`);
        // Update saved region to match selected
        setSavedRegion(selectedRegion);
        // Force refresh to get updated data from server
        router.refresh();
      } else {
        console.error("❌ [RegionGridSelector] Failed to save:", result.error);
        toast.error(result.error || "Nie udało się zaktualizować regionu");
      }
    });
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md">
      <CardContent className="p-4 sm:p-8">
        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg sm:rounded-xl p-1.5 sm:p-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Wybierz Województwo</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Kliknij na region, aby wybrać. Wpłynie to na modyfikatory cen.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-6 sm:py-8 mb-6 sm:mb-8">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Ładowanie zapisanego regionu...
            </span>
          </div>
        )}

        {/* Regional Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
            {VOIVODESHIPS.map((voivodeship) => {
              const isSelected = selectedRegion === voivodeship.id;
            
            return (
              <Card
                key={voivodeship.id}
                onClick={() => handleRegionSelect(voivodeship.id, voivodeship.name)}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  "border",
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30"
                    : "bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"
                )}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <MapPin className={cn(
                        "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0",
                        isSelected ? "text-white" : "text-slate-500 dark:text-slate-500"
                      )} />
                      <span className={cn(
                        "text-xs sm:text-sm font-medium truncate",
                        isSelected ? "text-white" : "text-slate-700 dark:text-slate-200"
                      )}>
                        {voivodeship.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-1.5 sm:p-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Nowe województwo: {selectedRegionName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                    Kliknij &quot;Zapisz&quot;, aby zastosować zmiany
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md rounded-xl transition-all duration-200 w-full sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Zapisz Region
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 sm:mt-6 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">💡 Wskazówka:</strong> Wybór województwa wpłynie na modyfikatory cen regionalnych 
            w Twoich kosztorysach. Różne regiony mają różne współczynniki kosztów robocizny i materiałów.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
