"use client";

/**
 * BlurredPrice / BlurredSection — v2.0 (Business Model Refresh)
 *
 * HISTORICAL:
 *   v1.x: FREE users saw HARD-BLURRED prices → zero value pre-subscription.
 *         Result: users couldn't evaluate the calculator → poor conversion.
 *
 * v2.0 (Freemium z zablokowaną monetyzacją):
 *   FREE users see FULL prices (no blur). The block is moved to the EXPORT step
 *   (PDF watermark, client portal lock, team, branding). See `lib/config/tier-limits.ts`.
 *
 *   This component is kept for backward compatibility — all call sites now render
 *   the price cleanly for both FREE and PRO. `BlurredSection` still supports a
 *   hard gate for PRO-only UI (e.g. client portal preview) where needed.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface BlurredPriceProps {
  value: number;
  /** Kept for compatibility; no longer blurs the price when false. */
  isPro?: boolean;
  className?: string;
  /** Ignored in v2.0 — prices always visible. */
  showBadge?: boolean;
  unit?: string;
  /** Ignored in v2.0 — prices always visible. */
  showTeaser?: boolean;
  voivodeship?: string;
  projectId?: string;
}

/**
 * v2.0: Always renders the exact price. `isPro` and gating props are ignored.
 * Kept as a drop-in replacement so we do not have to touch every call site.
 */
export function BlurredPrice({
  value,
  className,
  unit = "zł",
}: BlurredPriceProps) {
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
