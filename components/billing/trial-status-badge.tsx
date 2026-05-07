"use client";

import { Clock, Sparkles } from "lucide-react";
import {
  type EntitlementProfile,
  formatTrialRemaining,
  getEntitlementReason,
  isTrialActive,
} from "@/lib/auth/entitlements";

interface TrialStatusBadgeProps {
  profile: EntitlementProfile | null | undefined;
  /** Render nothing if reason !== "trial". Default: true. */
  hideIfNotTrial?: boolean;
  className?: string;
}

/**
 * v2.1 — compact read-only badge that shows "Trial: Xd Yh" while the 7-day
 * free trial is active. For PRO (paid) users renders nothing (they don't
 * need the reminder). For pure FREE users also renders nothing.
 *
 * Mount this wherever you currently show subscription status (sidebar,
 * account menu, SummaryExportPanel, dashboard header).
 */
export function TrialStatusBadge({
  profile,
  hideIfNotTrial = true,
  className = "",
}: TrialStatusBadgeProps) {
  if (!profile) return null;
  const reason = getEntitlementReason(profile);

  if (reason === "paid") return null;
  if (reason !== "trial") return hideIfNotTrial ? null : null;

  const active = isTrialActive(profile);
  if (!active) return null;

  const remaining = formatTrialRemaining(profile);
  const urgent = remaining.startsWith("0 godz.") || /^\d+ min$/.test(remaining);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                  ${urgent
                    ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800"
                  } ${className}`}
      title="Trial 1-dniowy — pełny dostęp PRO"
    >
      {urgent ? <Clock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
      <span>Trial: {remaining}</span>
    </div>
  );
}
