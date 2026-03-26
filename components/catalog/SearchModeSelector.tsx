"use client";

import { cn } from "@/lib/utils";
import type { DataSourceMode } from "@/hooks/use-search-mode";
import { User, Brain, Zap } from "lucide-react";

interface ModeConfig {
  id: DataSourceMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  active: string;
  inactive: string;
}

const MODES: ModeConfig[] = [
  {
    id: "own",
    icon: User,
    label: "Własna",
    description: "Tylko Twój katalog osobisty",
    active:   "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 shadow-sm",
    inactive: "text-slate-500 hover:text-violet-600 hover:bg-violet-50/80 dark:hover:bg-violet-950/20",
  },
  {
    id: "engine",
    icon: Brain,
    label: "ES-Engine",
    description: "Globalny katalog ES (8500+ pozycji KNR)",
    active:   "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 shadow-sm",
    inactive: "text-slate-500 hover:text-orange-600 hover:bg-orange-50/80 dark:hover:bg-orange-950/20",
  },
  {
    id: "hybrid",
    icon: Zap,
    label: "Hybrydowy",
    description: "Własne + ES-Engine (własne pozycje pierwsze)",
    active:   "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm",
    inactive: "text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-950/20",
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
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0 overflow-hidden",
        className,
      )}
    >
      {MODES.map(({ id, icon: Icon, label, description, active, inactive }) => (
        <button
          key={id}
          type="button"
          title={description}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 px-1.5 py-1 rounded-md text-xs font-medium transition-all duration-150 select-none min-w-0 overflow-hidden",
            mode === id ? active : inactive,
          )}
        >
          <Icon className="w-3 h-3 flex-shrink-0" />
          {!compact && <span className="truncate">{label}</span>}
        </button>
      ))}
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
        title="ES-Engine — globalny katalog"
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
