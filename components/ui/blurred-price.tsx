"use client";

import { useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { logAnalyticsEvent } from "@/app/admin/actions";

interface BlurredPriceProps {
  value: number;
  isPro: boolean;
  className?: string;
  showBadge?: boolean;
  unit?: string;
  showTeaser?: boolean;
  voivodeship?: string;
  projectId?: string;
}

export function BlurredPrice({ 
  value, 
  isPro, 
  className, 
  showBadge = false,
  unit = "zł",
  showTeaser = false,
  voivodeship,
  projectId,
}: BlurredPriceProps) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!isPro && value > 0 && showTeaser) {
      startTransition(() => {
        logAnalyticsEvent("blur_view", { voivodeship, projectId });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isPro) {
    // Pro users see clear prices
    return (
      <span className={className}>
        {value.toFixed(2).replace('.', ',')} {unit}
      </span>
    );
  }

  // Price Range Teaser: -15% for Min, +10% for Max
  const rangeMin = Math.round(value * 0.85);
  const rangeMax = Math.round(value * 1.10);
  const fmtRange = (v: number) =>
    v.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Free users see HARD BLURRED prices with tooltip + optional teaser
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex flex-col items-start gap-0.5">
            <div className="inline-flex items-center gap-2">
              <span className={cn("blur-sm select-none opacity-50 pointer-events-none", className)}>
                {value.toFixed(2).replace('.', ',')} {unit}
              </span>
              {showBadge && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
            {showTeaser && value > 0 && (
              <span className="text-[10px] text-muted-foreground leading-tight">
                ~{fmtRange(rangeMin)}–{fmtRange(rangeMax)} {unit}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-semibold">🔒 Zupgraduj do PRO</p>
          {showTeaser && value > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Szacunek: ~{fmtRange(rangeMin)}–{fmtRange(rangeMax)} {unit}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface BlurredSectionProps {
  isPro: boolean;
  children: React.ReactNode;
  upgradeMessage?: string;
}

export function BlurredSection({ 
  isPro, 
  children, 
  upgradeMessage = "Zupgraduj, aby zobaczyć ceny" 
}: BlurredSectionProps) {
  if (isPro) {
    return <>{children}</>;
  }

  // Free users see blurred content
  return (
    <div className="relative">
      <div className="filter blur-md pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-2 bg-white/30 dark:bg-slate-950/30 rounded">
        <Badge variant="secondary" className="shadow-md text-center whitespace-normal max-w-[95%] gap-1.5 py-1">
          <Lock className="w-3 h-3 flex-shrink-0" />
          {upgradeMessage}
        </Badge>
      </div>
    </div>
  );
}
