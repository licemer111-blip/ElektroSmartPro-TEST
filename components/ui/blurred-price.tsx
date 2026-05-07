"use client";

/**
 * BlurredPrice / BlurredSection — v2.1 (Iron Rule enforcement)
 *
 * Iron Rule #1: Free users MUST see BLURRED prices in summaries.
 * CTA: "Zupgraduj, aby zobaczyć ceny"
 *
 * BLUR logic:
 *   - `showBadge=true` → marks a KEY summary number (SUMA NETTO, KWOTA KOŃCOWA).
 *     Free users see blur + lock icon on these.
 *   - `showBadge=false` (default) → line-item prices stay visible for all users
 *     so they can evaluate the calculator before upgrading.
 *   - `isPro=true` or `hardGate=false` → always shows the price.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface BlurredPriceProps {
  value: number;
  /** True = PRO or trial active — always show price. False = FREE user. */
  isPro?: boolean;
  className?: string;
  /**
   * When true AND isPro=false: blurs this price (it's a key summary total).
   * When false (default): price visible to all users (line-item prices).
   */
  showBadge?: boolean;
  unit?: string;
  showTeaser?: boolean;
  voivodeship?: string;
  projectId?: string;
}

/**
 * v2.1: Blurs KEY summary totals (showBadge=true) for FREE users.
 * Line-item prices (showBadge=false, default) remain visible to all.
 */
export function BlurredPrice({
  value,
  isPro = true,
  className,
  unit = "zł",
  showBadge = false,
}: BlurredPriceProps) {
  if (!isPro && showBadge) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="filter blur-sm select-none pointer-events-none text-slate-400 dark:text-slate-500 font-bold">
          {value.toFixed(2).replace(".", ",")} {unit}
        </span>
        <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
      </span>
    );
  }
  return (
    <span className={className}>
      {value.toFixed(2).replace(".", ",")} {unit}
    </span>
  );
}

interface BlurredSectionProps {
  isPro: boolean;
  children: React.ReactNode;
  upgradeMessage?: string;
  /**
   * v2.0 default: free users SEE the content (no blur).
   * Set `hardGate=true` to keep the legacy lock behaviour for PRO-only UI
   * (e.g. client portal preview, team features).
   */
  hardGate?: boolean;
}

export function BlurredSection({
  isPro,
  children,
  upgradeMessage = "Funkcja dostępna w PRO",
  hardGate = false,
}: BlurredSectionProps) {
  if (isPro || !hardGate) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className={cn("filter blur-md pointer-events-none select-none opacity-60")}>
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
