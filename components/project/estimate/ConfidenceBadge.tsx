"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = "verified" | "analog" | "estimated" | "uncertain" | "manual" | "unmatched";

export type KnrSource =
  | "user_knr" | "system_knr" | "ai_estimation" | "catalog" | "es_synthetic"
  | null | undefined;

// ─── Data Source Mapping ────────────────────────────────────────────────────────
//
// Priority:
//   1. manual confidence_level (user explicitly set) → keep as-is
//   2. knr_source → derive level from data source
//   3. knr_code present (any) → at least "analog" (formula-based)
//   4. fallback to stored confidence_level
//
export function deriveConfidenceFromSource(
  storedLevel: ConfidenceLevel | null | undefined,
  knrSource: KnrSource,
  knrCode: string | null | undefined,
): ConfidenceLevel {
  // Manual prices are always slate — never override
  if (storedLevel === "manual") return "manual";
  // Unmatched — engine ran but no L1/L2 hit, waiting for on-demand L3
  if (storedLevel === "unmatched") return "unmatched";

  // Map knr_source → ConfidenceLevel
  if (knrSource) {
    switch (knrSource) {
      // L1 — user's private catalog (violet, but ConfidenceLevel has no "l1" — treat as verified)
      case "user_knr":
        return "verified";
      // L2 KNR kat. A — official/exact ES-Dictionary match (green verified)
      case "system_knr":
      case "catalog":
        return "verified";
      // L2 KNR kat. B — analog/fuzzy match (green analog)
      case "es_synthetic":
        return "analog";
      // L3 — AI estimated, no KNR norm (amber/yellow)
      case "ai_estimation":
        return "estimated";
    }
  }

  // knr_code present without known source → analog (yellow, formula-based)
  if (knrCode && knrCode.trim().length > 0) {
    return "analog";
  }

  // Fall back to stored level
  return storedLevel ?? "uncertain";
}

interface ConfidenceConfig {
  dot: string;
  label: string;
  tooltip: string;
  bar: string;
}

// ─── Config map ───────────────────────────────────────────────────────────────

const CONFIG: Record<ConfidenceLevel, ConfidenceConfig> = {
  // L2 KNR kat. A — exact ES-Dictionary match (green)
  verified: {
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    label: "L2 · KNR kat. A",
    tooltip: "L2 · KNR kat. A — norma zweryfikowana (Exact Match ES-KNR 2026)",
  },
  // L2 KNR kat. B — analog/fuzzy match (green, same color as A)
  analog: {
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
    label: "L2 · KNR kat. B",
    tooltip: "L2 · KNR kat. B — dopasowanie analogowe (podobna norma KNR)",
  },
  // L3 — AI estimated, no KNR found (amber/yellow)
  estimated: {
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    label: "L3 · Szacunek AI",
    tooltip: "L3 · Szacunek AI — brak normy KNR w słowniku ES-Dictionary. Cena to oszacowanie rynkowe bez gwarantowanej normy rbh. Aby uzyskać normę KNR, naciśnij 'Szukaj w KNR/AI' w kolumnie KNR.",
  },
  uncertain: {
    dot: "bg-red-500",
    bar: "bg-red-500",
    label: "Brak wyceny",
    tooltip: "ES-Engine nie znalazł danych KNR — wprowadź cenę ręcznie lub naciśnij 'Wyceń z ES-Engine' w pasku narzędzi",
  },
  manual: {
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    label: "Ręczna",
    tooltip: "Cena wprowadzona ręcznie — norma chroniona (engine jej nie zmieni)",
  },
  unmatched: {
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    label: "⚡ Wyceń teraz",
    tooltip: "Pozycja poza słownikiem ES-KNR — naciśnij przycisk 'Wyceń z ES-Engine' lub użyj lupki 🔍 w kolumnie KNR aby uruchomić wycenę",
  },
};

// ─── Dot indicator (compact, for table rows) ──────────────────────────────────────────────

const KNR_SOURCE_TOOLTIP: Partial<Record<NonNullable<KnrSource>, string>> = {
  system_knr:    "L2 · KNR kat. A — norma zweryfikowana ES-KNR 2026 (Exact Match)",
  user_knr:      "L1 · Twój Katalog — dopasowanie z katalogu prywatnego elektryka",
  catalog:       "L2 · KNR kat. A — dane ze słownika ES-Dictionary",
  ai_estimation: "L3 · Szacunek — brak dokładnej normy KNR (ES-Engine oszacował)",
  es_synthetic:  "L2 · KNR kat. B — dopasowanie analogowe (podobna pozycja w bazie KNR)",
};

interface ConfidenceDotProps {
  level: ConfidenceLevel;
  note?: string | null;
  className?: string;
  // Data source props — when provided, level is derived automatically
  knrSource?: KnrSource;
  knrCode?: string | null;
}

export function ConfidenceDot({ level: storedLevel, note, className, knrSource, knrCode }: ConfidenceDotProps) {
  // Derive effective level from data source (overrides stored level)
  const level = deriveConfidenceFromSource(storedLevel, knrSource, knrCode);
  const cfg = CONFIG[level];

  const sourceTooltip = knrSource ? KNR_SOURCE_TOOLTIP[knrSource] : undefined;
  const tooltipText = sourceTooltip
    ? knrCode ? `${sourceTooltip}\nKNR: ${knrCode}` : sourceTooltip
    : level === "analog" && note
    ? `Cena na podstawie analogu: ${note.replace("Analog: ", "")}`
    : level === "uncertain"
    ? "ES-Engine nie znalazł danych KNR — wprowadź cenę ręcznie"
    : cfg.tooltip;

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full flex-shrink-0 cursor-help",
        cfg.dot,
        className,
      )}
      title={tooltipText}
      aria-label={tooltipText}
    />
  );
}

// ─── Left border stripe (for table cells) ─────────────────────────────────────

interface ConfidenceStripeProps {
  level: ConfidenceLevel;
}

export function ConfidenceStripe({ level }: ConfidenceStripeProps) {
  const cfg = CONFIG[level];
  return (
    <span
      className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-sm", cfg.bar)}
      aria-hidden="true"
    />
  );
}

// ─── Inline badge (for summary views) ────────────────────────────────────────

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  note?: string | null;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBadge({ level, note, showLabel = true, className }: ConfidenceBadgeProps) {
  const cfg = CONFIG[level];
  const tooltipText = level === "analog" && note
    ? `Cena na podstawie analogu: ${note.replace("Analog: ", "")}`
    : cfg.tooltip;

  const badgeColors: Record<ConfidenceLevel, string> = {
    // L2 KNR kat. A — green
    verified:   "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    // L2 KNR kat. B — green (same palette, slightly lighter dot only)
    analog:     "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    // L3 Szacunek — amber/yellow
    estimated:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    uncertain:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    manual:     "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    // L1 user catalog — violet
    unmatched:  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium",
        badgeColors[level],
        className,
      )}
      title={tooltipText}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {showLabel && cfg.label}
    </span>
  );
}

// ─── Uncertain warning block ──────────────────────────────────────────────────

export function UncertainPriceWarning({ note }: { note?: string | null }) {
  return (
    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400" title="ES-Engine nie znalazł danych KNR — wprowadź cenę ręcznie">
      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
      <span className="text-[10px] font-medium">Wymaga wyceny</span>
    </div>
  );
}
