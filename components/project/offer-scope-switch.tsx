"use client";

import { cn } from "@/lib/utils";

interface OfferScopeSwitchProps {
  laborOnly: boolean;
  disabled?: boolean;
  onChange: (laborOnly: boolean) => void;
}

const OPTIONS = [
  {
    laborOnly: false,
    label: "Robocizna i materiały",
    caption: "Do sumy wchodzi robocizna i cena materiału z wiersza.",
  },
  {
    laborOnly: true,
    label: "Tylko robocizna",
    caption: "Materiał nie wchodzi do sumy ani do PDF. Klient kupuje go sam. Ceny w wierszach zostają.",
  },
] as const;

export function OfferScopeSwitch({ laborOnly, disabled, onChange }: OfferScopeSwitchProps) {
  const current = OPTIONS.find((option) => option.laborOnly === laborOnly) ?? OPTIONS[0];

  return (
    <div className={cn("space-y-1.5", disabled && "opacity-70")} data-tour="tour-scope">
      <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        {OPTIONS.map((option) => {
          const active = option.laborOnly === laborOnly;
          return (
            <button
              key={option.label}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled && !active) onChange(option.laborOnly);
              }}
              className={cn(
                "min-h-8 px-2 py-1 rounded-md text-[11px] font-medium leading-tight transition-colors disabled:cursor-not-allowed",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700/60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">{current.caption}</p>
    </div>
  );
}
