"use client";

// ═══════════════════════════════════════════════════════════════════
// KnrRegionSelector.tsx
// Voivodeship picker for Centrum Kalkulacji.
// Saves to profiles.default_region_id via updateUserRegion().
// Instantly reflects regional multiplier in rate preview.
// ═══════════════════════════════════════════════════════════════════

import { useState, useTransition, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, TrendingDown, Minus, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUserRegion } from "@/app/dashboard/settings/region-actions";
import {
  getRegionById,
  formatRegionCorrection,
  type PolishRegion,
} from "@/lib/config/regions";

/** Minimal DB region shape passed from page.tsx */
interface DbRegion {
  id: string;           // UUID
  name: string;
  slug: string;
  price_modifier: number;
}

interface KnrRegionSelectorProps {
  /** UUID from profiles.default_region_id — used as initial state */
  initialRegionUuid: string | null;
  /** DB regions array (id=UUID, slug) for UUID↔slug conversion */
  dbRegions: DbRegion[];
  baseHourlyRate: number;
  onRegionChange?: (region: PolishRegion | undefined) => void;
}

function MultiplierIcon({ multiplier }: { multiplier: number }) {
  if (multiplier > 1.0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (multiplier < 1.0) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

function MultiplierBadge({ multiplier }: { multiplier: number }) {
  const pct = Math.round((multiplier - 1) * 100);
  const sign = pct >= 0 ? "+" : "";
  if (pct > 0) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold">
        {sign}{pct}%
      </Badge>
    );
  }
  if (pct < 0) {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700 text-xs font-bold">
        {pct}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs">
      Baza
    </Badge>
  );
}

export function KnrRegionSelector({ initialRegionUuid, dbRegions, baseHourlyRate, onRegionChange }: KnrRegionSelectorProps) {
  const { toast } = useToast();
  const [isSaving, startSave] = useTransition();
  // State stores UUID (matches profiles.default_region_id and projects.region_id)
  const [regionUuid, setRegionUuid] = useState<string | null>(initialRegionUuid);
  const regionUuidRef = useRef(regionUuid);
  const [saved, setSaved] = useState(false);

  regionUuidRef.current = regionUuid;
  // Derive region data from DB (using price_modifier directly — same as Kreator)
  const currentDbRegion = dbRegions.find(r => r.id === regionUuid);
  const regionSlug = currentDbRegion?.slug ?? null;
  const currentRegion = getRegionById(regionSlug ?? undefined);
  const multiplier = currentDbRegion?.price_modifier ?? currentRegion?.multiplier ?? 1.0;
  const adjustedRate = Math.round(baseHourlyRate * multiplier);

  // Sync with Kreator — when region changes in project toolbar, reflect here instantly
  useEffect(() => {
    const handler = (e: Event) => {
      const { regionUuid: incomingUuid, source } = (e as CustomEvent<{ regionUuid?: string; regionSlug?: string; source?: string }>).detail;
      // Ignore events we dispatched ourselves to avoid feedback loop
      if (source === "knr") return;
      // Use ref to always read current value — avoids stale closure bug
      // Allow "" (Brak korekty from Kreator) — normalize to null; skip only when field is undefined
      if (incomingUuid === undefined) return;
      const resolved = incomingUuid || null; // "" → null, UUID stays UUID
      if (resolved !== regionUuidRef.current) {
        setRegionUuid(resolved);
        setSaved(false);
        const slug = resolved ? (dbRegions.find(r => r.id === resolved)?.slug ?? null) : null;
        onRegionChange?.(getRegionById(slug ?? undefined));
      }
    };
    window.addEventListener("region-changed-global", handler);

    // Cross-tab sync: Kreator in another tab sends via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("es-region-sync");
      bc.onmessage = (e: MessageEvent<{ regionUuid?: string; source?: string }>) => {
        const { regionUuid: incomingUuid, source } = e.data;
        if (source === "knr") return;
        if (incomingUuid === undefined) return;
        const resolved = incomingUuid || null;
        if (resolved !== regionUuidRef.current) {
          setRegionUuid(resolved);
          setSaved(false);
          const slug = resolved ? (dbRegions.find(r => r.id === resolved)?.slug ?? null) : null;
          onRegionChange?.(getRegionById(slug ?? undefined));
        }
      };
    } catch { /* BroadcastChannel unavailable */ }

    return () => {
      window.removeEventListener("region-changed-global", handler);
      bc?.close();
    };
  // Stable deps only — regionUuid read via ref to avoid re-registering on every change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbRegions]);

  const handleChange = (value: string) => {
    const newUuid = value === "__none__" ? null : value;
    const newSlug = newUuid ? (dbRegions.find(r => r.id === newUuid)?.slug ?? null) : null;
    setRegionUuid(newUuid);
    setSaved(false);
    onRegionChange?.(getRegionById(newSlug ?? undefined));

    // Set optimistically BEFORE async save — so navigation-based sync works even if
    // the user navigates to Kreator before the server action finishes
    if (newUuid) {
      try {
        localStorage.setItem("es-pending-region-uuid", newUuid);
        localStorage.setItem("es-pending-region-slug", newSlug ?? "");
      } catch { /* localStorage unavailable */ }
    }

    startSave(async () => {
      const dispatchRegionEvent = (uuid: string | null, slug: string | null) => {
        const detail = { regionUuid: uuid, regionSlug: slug ?? "", source: "knr" };
        window.dispatchEvent(new CustomEvent("region-changed-global", { detail }));
        try {
          const bc = new BroadcastChannel("es-region-sync");
          bc.postMessage(detail);
          bc.close();
        } catch { /* BroadcastChannel unavailable */ }
      };

      // updateUserRegion saves UUID to profiles.default_region_id
      // Empty string = Brak korekty → clears default_region_id to null in DB
      const result = await updateUserRegion(newUuid ?? "");
      if (result.success) {
        setSaved(true);
        toast({
          title: "Region zapisany",
          description: `Korekta regionalna: ${formatRegionCorrection(newSlug)}`,
          duration: 3000,
        });
        dispatchRegionEvent(newUuid, newSlug);
      } else {
        // Rollback optimistic localStorage if save failed
        try {
          localStorage.removeItem("es-pending-region-uuid");
          localStorage.removeItem("es-pending-region-slug");
        } catch { /* localStorage unavailable */ }
        toast({
          title: "Błąd zapisu regionu",
          description: result.error ?? "Spróbuj ponownie",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="border-2 border-blue-100 dark:border-blue-900/40 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              Korekta Regionalna
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Wybierz województwo — stawka R-G zostanie automatycznie skorygowana o lokalny współczynnik rynkowy
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saved && !isSaving && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            {currentRegion && (
              <MultiplierBadge multiplier={multiplier} />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Native select — same pattern as working Kreator (ProjectPricingModeControl) */}
        <div className="relative">
          <label htmlFor="knr-region-native" className="sr-only">Wybierz województwo</label>
          <select
            id="knr-region-native"
            name="knr-region"
            value={regionUuid ?? "__none__"}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isSaving}
            className="appearance-none w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="__none__">— Brak korekty (1.00)</option>
            {dbRegions
              .slice()
              .sort((a, b) => b.price_modifier - a.price_modifier)
              .map((r) => {
                const regionCfg = getRegionById(r.slug);
                const pct = Math.round((r.price_modifier - 1) * 100);
                const sign = pct > 0 ? "+" : "";
                const flag = regionCfg?.flag ?? "";
                const label = pct === 0 ? "baza" : `${sign}${pct}%`;
                return (
                  <option key={r.id} value={r.id}>
                    {flag} {r.name} ({label})
                  </option>
                );
              })}
          </select>
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          {isSaving && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400 pointer-events-none" />
          )}
        </div>

        {/* Live preview */}
        {currentRegion && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
              {/* Województwo */}
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Województwo</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentRegion.flag} {currentRegion.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{currentRegion.capital}</p>
              </div>
              {/* Współczynnik */}
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Współczynnik</p>
                <div className="flex items-center justify-center gap-1">
                  <MultiplierIcon multiplier={multiplier} />
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ×{multiplier.toFixed(2)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{formatRegionCorrection(regionSlug)}</p>
              </div>
              {/* Stawka po korekcie */}
              <div className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/10">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Stawka R-G</p>
                <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                  {adjustedRate} <span className="text-xs font-normal">PLN</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">po korekcie</p>
              </div>
            </div>
          </div>
        )}

        {/* Scale reference */}
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>Drogie: ≥+10% (Mazowieckie, Małopolskie)</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 justify-center">
            <Minus className="w-3 h-3" />
            <span>Baza: Łódzkie (×1.00)</span>
          </div>
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 justify-end">
            <TrendingDown className="w-3 h-3" />
            <span>Tanie: ≤−5% (Podkarpackie, Podlaskie)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
