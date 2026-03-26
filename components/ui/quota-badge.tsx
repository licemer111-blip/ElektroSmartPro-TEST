"use client";

import { Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiQuotaInfo } from "@/hooks/use-ai-quota";

interface QuotaBadgeProps {
  info: AiQuotaInfo | null;
  className?: string;
  /** Show upgrade CTA link */
  showUpgrade?: boolean;
}

/**
 * QuotaBadge — displays AI usage counter next to action buttons.
 * - Green when quota available
 * - Orange when 1 remaining (demo users)
 * - Red/disabled when exhausted
 */
export function QuotaBadge({ info, className, showUpgrade = true }: QuotaBadgeProps) {
  if (!info) return null;

  const { used, limit, remaining, isPro, isExhausted, isLow } = info;

  if (isExhausted) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          className
        )}
        title={isPro ? "Limit miesięczny wyczerpany" : "Limit demo wyczerpany — przejdź na PRO"}
      >
        <span>{used}/{limit}</span>
        {!isPro && showUpgrade && (
          <a
            href="/dashboard/subscription"
            className="ml-0.5 underline underline-offset-2 hover:text-red-900 dark:hover:text-red-300"
            onClick={(e) => e.stopPropagation()}
          >
            PRO
          </a>
        )}
      </span>
    );
  }

  if (isLow) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse",
          className
        )}
        title="Ostatnie zapytanie AI w planie Demo — przejdź na PRO"
      >
        <Zap className="w-2.5 h-2.5" />
        <span>{used}/{limit}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
        isPro
          ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        className
      )}
      title={isPro ? `${remaining} zapytań AI pozostało w tym miesiącu` : `${remaining} z ${limit} darmowych zapytań AI`}
    >
      {isPro && <Crown className="w-2.5 h-2.5" />}
      <span>{used}/{limit}</span>
    </span>
  );
}

/**
 * QuotaBlocker — full inline block shown when quota is exhausted.
 * Replaces the action button area.
 */
export function QuotaBlocker({ info, featureName }: { info: AiQuotaInfo | null; featureName: string }) {
  if (!info?.isExhausted) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
      <span className="font-medium">Limit {featureName} wyczerpany ({info.used}/{info.limit})</span>
      {!info.isPro && (
        <a
          href="/dashboard/subscription"
          className="ml-auto flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap"
        >
          <Crown className="w-3 h-3" />
          Zupgraduj do PRO
        </a>
      )}
    </div>
  );
}
