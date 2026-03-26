"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketSentiment, ConfidenceLevel } from "@/lib/types/database";

interface MarketPriceDisplayProps {
  basePrice: number;
  priceMin?: number | null;
  priceMax?: number | null;
  trend?: MarketSentiment;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string | null;
  marketComment?: string | null;
  lastVerifiedAt?: string | null;
  isPro: boolean;
  className?: string;
}

export function MarketPriceDisplay({
  basePrice,
  priceMin,
  priceMax,
  trend = "stable",
  confidenceLevel = "low",
  confidenceReason,
  marketComment,
  lastVerifiedAt,
  isPro,
  className,
}: MarketPriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Trend icon and color
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "down":
        return <TrendingDown className="w-3.5 h-3.5" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      case "down":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
      default:
        return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800";
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "up":
        return "Ceny rosną";
      case "down":
        return "Ceny spadają";
      default:
        return "Stabilne";
    }
  };

  // Confidence icon and color
  const getConfidenceIcon = () => {
    switch (confidenceLevel) {
      case "high":
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case "medium":
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5" />;
    }
  };

  const getConfidenceColor = () => {
    switch (confidenceLevel) {
      case "high":
        return "text-green-600 dark:text-green-400";
      case "medium":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-slate-500 dark:text-slate-500";
    }
  };

  const getConfidenceLabel = () => {
    switch (confidenceLevel) {
      case "high":
        return "Wysoka pewność";
      case "medium":
        return "Średnia pewność";
      default:
        return "Niska pewność";
    }
  };

  // If not PRO, show blurred
  if (!isPro) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-slate-400 dark:text-slate-600 blur-[4px] select-none text-sm">
          **** zł
        </span>
      </div>
    );
  }

  // Show price range if available
  const hasRange = priceMin && priceMax && priceMin !== priceMax;

  return (
    <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
      {/* Price Display */}
      <div className="flex flex-col min-w-0">
        {hasRange ? (
          <>
            {/* Range - Desktop only */}
            <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 hidden sm:block">
              {formatPrice(priceMin!)} - {formatPrice(priceMax!)} zł
            </div>
            {/* Average - Desktop only */}
            <div className="text-xs text-slate-500 dark:text-slate-500 hidden sm:block">
              Śr: {formatPrice(basePrice)} zł
            </div>
            {/* Mobile - Show only average */}
            <div className="font-medium text-xs text-slate-900 dark:text-slate-100 sm:hidden">
              {formatPrice(basePrice)} zł
            </div>
          </>
        ) : (
          // Single price
          <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {formatPrice(basePrice)} zł
          </div>
        )}
      </div>

      {/* Market Intelligence Badges - Simplified on mobile */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* Trend Badge */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-0.5 sm:px-1.5 py-0.5 cursor-help sm:min-w-[20px] min-w-[16px]",
                  getTrendColor()
                )}
              >
                {getTrendIcon()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-xs">{getTrendLabel()}</p>
                {marketComment && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {marketComment}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Confidence Badge - Hidden on mobile */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("cursor-help hidden sm:block", getConfidenceColor())}>
                {getConfidenceIcon()}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-xs">{getConfidenceLabel()}</p>
                {confidenceReason && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {confidenceReason}
                  </p>
                )}
                {lastVerifiedAt && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                    Weryfikacja: {formatDate(lastVerifiedAt)}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
