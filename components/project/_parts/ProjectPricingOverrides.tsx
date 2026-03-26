"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings2, Globe, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateProjectPricingOverrides } from "@/app/dashboard/projects/[id]/_actions/project-meta";
import type { Profile } from "@/lib/types/database";

interface PricingOverridesState {
  coeff_height?:     boolean | null;
  coeff_difficulty?: boolean | null;
  coeff_surface?:    boolean | null;
}

interface ProjectPricingOverridesProps {
  projectId:       string;
  profile?:        Profile | null;
  overrides?:      PricingOverridesState | null;
  isFinal?:        boolean;
  isPro?:          boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveValue(
  override: boolean | null | undefined,
  global: boolean | undefined,
): boolean {
  return override ?? global ?? false;
}

function isProjectOverride(override: boolean | null | undefined): boolean {
  return override != null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectPricingOverrides({
  projectId,
  profile,
  overrides,
  isFinal = false,
  isPro = false,
}: ProjectPricingOverridesProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Effective values: project override ?? global profile default
  const effectiveHeight     = resolveValue(overrides?.coeff_height,     profile?.coeff_height);
  const effectiveDifficulty = resolveValue(overrides?.coeff_difficulty, profile?.coeff_difficulty);
  const effectiveSurface    = resolveValue(overrides?.coeff_surface,    profile?.coeff_surface);

  const anyActive = effectiveHeight || effectiveDifficulty || effectiveSurface;

  const handleToggle = async (
    field: "coeff_height" | "coeff_difficulty" | "coeff_surface",
    newValue: boolean,
  ) => {
    if (isFinal || !isPro) return;
    startTransition(async () => {
      // Merge: preserve all existing override values, only update the toggled field.
      // Without this, each toggle would overwrite the entire JSONB and reset other flags.
      const merged = {
        coeff_height:     field === "coeff_height"     ? newValue : (overrides?.coeff_height     ?? null),
        coeff_difficulty: field === "coeff_difficulty" ? newValue : (overrides?.coeff_difficulty ?? null),
        coeff_surface:    field === "coeff_surface"    ? newValue : (overrides?.coeff_surface    ?? null),
      };
      const result = await updateProjectPricingOverrides(projectId, merged);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors",
            anyActive
              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/10"
              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30",
            !isPro && "opacity-50 cursor-not-allowed",
          )}
          disabled={!isPro}
          type="button"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Settings2 className="w-3.5 h-3.5" />
            Wsp. KNR dla projektu
          </span>
          <span className="flex items-center gap-1.5">
            {anyActive && (
              <Badge className="text-[9px] px-1 py-0 bg-emerald-500 text-white">
                aktywne
              </Badge>
            )}
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1.5 px-2 pb-2 space-y-2 text-xs">
          {/* Height */}
          <Row
            switchId="override-coeff-height"
            label="Na wysokości (>3m)"
            multiplier="×1.25"
            value={effectiveHeight}
            isOverride={isProjectOverride(overrides?.coeff_height)}
            globalValue={profile?.coeff_height ?? false}
            disabled={isFinal || !isPro || isPending}
            onToggle={(v) => handleToggle("coeff_height", v)}
          />
          {/* Difficulty */}
          <Row
            switchId="override-coeff-difficulty"
            label="Utrudnienia"
            multiplier="×1.22"
            value={effectiveDifficulty}
            isOverride={isProjectOverride(overrides?.coeff_difficulty)}
            globalValue={profile?.coeff_difficulty ?? false}
            disabled={isFinal || !isPro || isPending}
            onToggle={(v) => handleToggle("coeff_difficulty", v)}
          />
          {/* Surface */}
          <Row
            switchId="override-coeff-surface"
            label="Trudne podłoże"
            multiplier="+15%"
            value={effectiveSurface}
            isOverride={isProjectOverride(overrides?.coeff_surface)}
            globalValue={profile?.coeff_surface ?? false}
            disabled={isFinal || !isPro || isPending}
            onToggle={(v) => handleToggle("coeff_surface", v)}
          />
          {!isPro && (
            <p className="text-[10px] text-slate-400 pt-1">
              Nadpisanie wymaga planu PRO
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Row subcomponent ─────────────────────────────────────────────────────────

function Row({
  switchId,
  label,
  multiplier,
  value,
  isOverride,
  globalValue,
  disabled,
  onToggle,
}: {
  switchId:    string;
  label:       string;
  multiplier:  string;
  value:       boolean;
  isOverride:  boolean;
  globalValue: boolean;
  disabled:    boolean;
  onToggle:    (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            "flex-shrink-0 w-1.5 h-1.5 rounded-full",
            isOverride ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600",
          )}
          title={isOverride ? "Nadpisano dla projektu" : "Ustawienie globalne"}
        />
        <span className="text-slate-600 dark:text-slate-300 truncate">{label}</span>
        <span className={cn("text-[10px] font-mono font-bold flex-shrink-0", value ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>
          {multiplier}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isOverride ? (
          <FolderKanban className="w-2.5 h-2.5 text-emerald-500" aria-label="Ustawienie projektu" />
        ) : (
          <Globe className="w-2.5 h-2.5 text-slate-400" aria-label="Ustawienie globalne" />
        )}
        <Switch
          id={switchId}
          name={switchId}
          checked={value}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="scale-75 data-[state=checked]:bg-emerald-500"
        />
      </div>
    </div>
  );
}
