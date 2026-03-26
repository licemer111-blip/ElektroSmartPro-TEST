"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-calculator/_parts/KnrCoefficients.tsx
// KNR difficulty multipliers — compact grid-cols-3 layout
// ═══════════════════════════════════════════════════════════════════

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HardHat, Wrench, Home, Star, Info } from "lucide-react";

interface Coefficient {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  value: number;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  activeBorder: string;
  badgeCls: string;
}

const COEFFICIENTS: Coefficient[] = [
  {
    id: "height",
    label: "Praca na wysokości (>3m)",
    shortLabel: "Na wysokości",
    description: "KNR 5-08 r. 1.3 — nakłady r-g × 1.25",
    value: 1.25,
    icon: HardHat,
    color: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-50 dark:bg-amber-950/20",
    activeBorder: "border-amber-300 dark:border-amber-700",
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    id: "ground",
    label: "Trudne podłoże",
    shortLabel: "Trudne podłoże",
    description: "Beton, kamień, stropy — nakłady r-g × 1.15",
    value: 1.15,
    icon: Wrench,
    color: "text-orange-600 dark:text-orange-400",
    activeBg: "bg-orange-50 dark:bg-orange-950/20",
    activeBorder: "border-orange-300 dark:border-orange-700",
    badgeCls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "occupied",
    label: "Zamieszkały lokal",
    shortLabel: "Utrudnienia",
    description: "Ochrona mienia, dostęp — nakłady r-g × 1.20",
    value: 1.20,
    icon: Home,
    color: "text-rose-600 dark:text-rose-400",
    activeBg: "bg-rose-50 dark:bg-rose-950/20",
    activeBorder: "border-rose-300 dark:border-rose-700",
    badgeCls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

interface KnrCoefficientsProps {
  activeCoeffs: Record<string, boolean>;
  setActiveCoeffs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  totalCoeff: number;
}

export function KnrCoefficients({ activeCoeffs, setActiveCoeffs, totalCoeff }: KnrCoefficientsProps) {
  return (
    <Card className="border-2 border-rose-100 dark:border-rose-900/40 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">Mnożniki i Dodatki (Współczynniki KNR)</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Aktywne współczynniki mnożą nakłady rbh w Sandboxie · KNR 5-08 rozdz. 1.3
              </CardDescription>
            </div>
          </div>
          {totalCoeff > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white flex-shrink-0">
              <Star className="w-3.5 h-3.5" />
              <span className="text-sm font-black">×{totalCoeff.toFixed(3)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COEFFICIENTS.map((coeff) => {
            const Icon = coeff.icon;
            const isActive = !!activeCoeffs[coeff.id];
            return (
              <div
                key={coeff.id}
                className={`flex items-center justify-between gap-2 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? `${coeff.activeBorder} ${coeff.activeBg}`
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30"
                }`}
                onClick={() => setActiveCoeffs((prev) => ({ ...prev, [coeff.id]: !prev[coeff.id] }))}
              >
                {/* Left: icon + label + info */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? coeff.color : "text-slate-400"}`} />
                  <p className={`text-sm font-semibold leading-tight truncate ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                    {coeff.shortLabel}
                  </p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0 hover:text-slate-500 transition-colors" onClick={(e) => e.stopPropagation()} />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                        {coeff.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Right: badge + switch */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive ? (
                    <Badge className={`text-[10px] font-bold px-1.5 py-0 ${coeff.badgeCls}`}>
                      ×{coeff.value.toFixed(2)}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">×{coeff.value.toFixed(2)}</span>
                  )}
                  <Switch
                    id={`knr-coeff-${coeff.id}`}
                    name={`knr-coeff-${coeff.id}`}
                    aria-label={coeff.label}
                    checked={isActive}
                    onCheckedChange={(v) => setActiveCoeffs((prev) => ({ ...prev, [coeff.id]: v }))}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { COEFFICIENTS };
export type { Coefficient };
