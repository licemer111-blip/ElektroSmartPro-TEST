"use client";

import { Brain, PenLine, MapPin, Loader2 } from "lucide-react";
import { getRegionById } from "@/lib/config/regions";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface ProjectPricingModeControlProps {
  liveRegionId: string;
  isRegionPending: boolean;
  isFinal: boolean;
  isReadOnly: boolean;
  useCustomRates: boolean;
  regions: Region[];
  onRegionChange: (regionId: string) => void;
}

const ENGINE_CFG = {
  label: "Expert Engine",
  icon: Brain,
  badge: "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300",
  dot: "bg-orange-500",
  description: "Expert Engine — katalog prywatny + normy KNR 2026 + regionalne stawki robocizny.",
};

const MANUAL_CFG = {
  label: "Własny (P1)",
  icon: PenLine,
  badge: "bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300",
  dot: "bg-purple-500",
  description: "P1 Własny — Twoje stawki i katalog prywatny mają najwyższy priorytet (P1). Normy KNR ES-KNR używane jako uzupełnienie.",
};

export function ProjectPricingModeControl({
  liveRegionId,
  isRegionPending,
  isFinal,
  isReadOnly,
  useCustomRates,
  regions,
  onRegionChange,
}: ProjectPricingModeControlProps) {
  const cfg = useCustomRates ? MANUAL_CFG : ENGINE_CFG;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-2 w-full flex-wrap">
      {/* Mode Badge — read-only indicator */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${cfg.badge}`}
        title={cfg.description}
      >
        <Icon className="h-3 w-3" />
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span>Tryb: {cfg.label}</span>
      </div>

      {/* Description — compact inline */}
      {!isFinal && !isReadOnly && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline truncate flex-1 min-w-0">
          {cfg.description}
        </span>
      )}

      {/* Region selector */}
      <div className="relative flex-shrink-0 ml-auto" title="Region (modyfikator stawki robocizny)">
        <label htmlFor="knr-region-select" className="sr-only">Wybierz województwo</label>
        <select
          id="knr-region-select"
          name="knr_region_select"
          value={liveRegionId || "__none__"}
          onChange={(e) => {
            if (!isReadOnly && !isFinal) {
              onRegionChange(e.target.value === "__none__" ? "" : e.target.value);
            }
          }}
          disabled={isReadOnly || isFinal || isRegionPending}
          className="appearance-none w-full sm:w-auto pl-6 pr-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:max-w-[160px]"
        >
          <option value="__none__">— Brak korekty (1.00)</option>
          {regions.map((r) => {
            const regionCfg = getRegionById(r.slug);
            const mult = r.price_modifier;
            const pct = Math.round((mult - 1) * 100);
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
        <MapPin className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        {isRegionPending && (
          <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-slate-400 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
