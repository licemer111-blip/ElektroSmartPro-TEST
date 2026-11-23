"use client";

import { cn } from "@/lib/utils";
import type { DataSourceMode } from "@/hooks/use-search-mode";
import { User, Brain, Zap } from "lucide-react";

interface ModeConfig {
  id: DataSourceMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const MODES: ModeConfig[] = [
  {
    id: "own",
    icon: User,
    label: "Moje",
    description: "W kolumnie zostają tylko Twoje pozycje. Ich cena materiału wchodzi do kosztorysu.",
  },
  {
    id: "engine",
    icon: Brain,
    label: "Baza",
    description: "W kolumnie zostaje baza. Jest godzina pracy, ceny materiału nie ma.",
  },
  {
    id: "hybrid",
    icon: Zap,
    label: "Razem",
    description: "W kolumnie są Twoje pozycje i baza. Twoja cena jest pierwsza.",
  },
];

interface SearchModeSelectorProps {
  mode: DataSourceMode;
  onChange: (mode: DataSourceMode) => void;
  compact?: boolean;
  className?: string;
}

export function SearchModeSelector({
  mode,
  onChange,
  compact = false,
  className,
}: SearchModeSelectorProps) {
  const current = MODES.find((item) => item.id === mode) ?? MODES[2];

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0 overflow-hidden">
        {MODES.map(({ id, icon: Icon, label, description }) => (
          <button
            key={id}
            type="button"
            title={description}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 px-1.5 py-1 rounded-md text-xs font-medium transition-all duration-150 select-none min-w-0 overflow-hidden",
              mode === id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/70 dark:hover:bg-slate-700/60 dark:hover:text-slate-100",
            )}
          >
            <Icon className="w-3 h-3 flex-shrink-0" />
            {!compact && <span className="truncate">{label}</span>}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="mt-1 px-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
          {current.description}
        </p>
      )}
    </div>
  );
}

export function OriginBadge({
  isGlobal,
  className,
}: {
  isGlobal: boolean;
  className?: string;
}) {
  if (isGlobal) {
    return (
      <span
        title="Wspólna baza programu"
        className={cn(
          "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold",
          "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
          className,
        )}
      >
        🧠
      </span>
    );
  }
  return (
    <span
      title="Twój katalog osobisty"
      className={cn(
        "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold",
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        className,
      )}
    >
      👤
    </span>
  );
}
