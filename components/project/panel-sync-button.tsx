"use client";

import { useState } from "react";
import { RefreshCw, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncPanelToEstimate } from "@/app/dashboard/projects/[id]/panel-sync-actions";
import type { PanelSyncModule } from "@/app/dashboard/projects/[id]/panel-sync-actions";
import type { RailModule } from "@/components/project/panel-configurator-types";

interface PanelSyncButtonProps {
  projectId: string;
  railModules: RailModule[];
  regionModifier: number;
  manufacturerCoeff: number;
  sectionName?: string;
  onSynced?: () => void;
}

function getModulePrice(mod: RailModule, coeff: number) {
  const mat = mod.customMaterialPrice ?? mod.module.defaultPrice * coeff;
  const lab = mod.customLaborPrice ?? mod.module.defaultLaborPrice;
  return { material: mat, labor: lab };
}

export function PanelSyncButton({
  projectId,
  railModules,
  regionModifier,
  manufacturerCoeff,
  sectionName,
  onSynced,
}: PanelSyncButtonProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const handleSync = async () => {
    if (pending) return;
    setPending(true);

    // Build payload from railModules — skip pure spacer/ZUG items with no price
    const modules: PanelSyncModule[] = railModules
      .filter(m => m.module.category !== "labor")
      .map(m => {
        const prices = getModulePrice(m, manufacturerCoeff);
        return {
          uid: m.uid,
          namePl: m.module.namePl,
          customName: m.customName,
          category: m.module.category,
          poles: m.module.modules ?? 1,
          rating: m.rating ?? m.module.defaultRating,
          quantity: m.quantity ?? 1,
          materialPrice: prices.material,
          laborPrice: prices.labor,
          laborNorm: m.laborRate ?? undefined,
          section: sectionName,
        };
      });

    const result = await syncPanelToEstimate({
      projectId,
      modules,
      regionModifier,
      sectionName: sectionName ?? "Rozdzielnica",
    });

    setPending(false);

    if (!result.success) {
      toast({
        title: "Błąd synchronizacji",
        description: result.error ?? "Nieoczekiwany błąd",
        variant: "destructive",
      });
      return;
    }

    const parts: string[] = [];
    if (result.inserted > 0) parts.push(`+${result.inserted} nowych`);
    if (result.updated > 0) parts.push(`${result.updated} zaktualizowanych`);
    if (result.zestawInserted > 0) parts.push(`+${result.zestawInserted} akcesoriów`);
    if (result.orphaned > 0) parts.push(`${result.orphaned} nieaktywnych`);

    toast({
      title: "Synchronizacja zakończona ✓",
      description: parts.length > 0 ? parts.join(" • ") : "Brak zmian — kosztorys aktualny",
    });

    onSynced?.();
  };

  return (
    <Button
      onClick={handleSync}
      disabled={pending}
      size="sm"
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Shield className="w-3.5 h-3.5" />
      )}
      {pending ? "Synchronizuję..." : "Synchronizuj z Kosztorysem"}
    </Button>
  );
}

// ─── Sync Banner — shown in project view when panel has unsynced changes ──────

interface PanelSyncBannerProps {
  projectId: string;
  railModules: RailModule[];
  regionModifier: number;
  manufacturerCoeff: number;
  onDismiss: () => void;
  onSynced: () => void;
}

export function PanelSyncBanner({
  projectId,
  railModules,
  regionModifier,
  manufacturerCoeff,
  onDismiss,
  onSynced,
}: PanelSyncBannerProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const handleSync = async () => {
    if (pending) return;
    setPending(true);

    const modules: PanelSyncModule[] = railModules
      .filter(m => m.module.category !== "labor")
      .map(m => {
        const prices = getModulePrice(m, manufacturerCoeff);
        return {
          uid: m.uid,
          namePl: m.module.namePl,
          customName: m.customName,
          category: m.module.category,
          poles: m.module.modules ?? 1,
          rating: m.rating ?? m.module.defaultRating,
          quantity: m.quantity ?? 1,
          materialPrice: prices.material,
          laborPrice: prices.labor,
          laborNorm: m.laborRate ?? undefined,
        };
      });

    const result = await syncPanelToEstimate({
      projectId,
      modules,
      regionModifier,
      sectionName: "Rozdzielnica",
    });

    setPending(false);

    if (!result.success) {
      toast({ title: "Błąd synchronizacji", description: result.error, variant: "destructive" });
      return;
    }

    const bannerParts: string[] = [];
    if (result.inserted > 0) bannerParts.push(`+${result.inserted} nowych`);
    if (result.updated > 0) bannerParts.push(`${result.updated} zaktualizowanych`);
    if (result.zestawInserted > 0) bannerParts.push(`+${result.zestawInserted} akcesoriów`);
    toast({
      title: "Synchronizacja zakończona ✓",
      description: bannerParts.length > 0 ? bannerParts.join(" • ") : "Brak zmian",
    });
    onSynced();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm">
      <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
      <span className="flex-1 text-indigo-800 dark:text-indigo-300 font-medium">
        Konfiguracja rozdzielnicy zmieniła się. Zsynchronizować ze specyfikacją?
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          onClick={handleSync}
          disabled={pending}
          className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          {pending ? "Synchronizuję..." : "Aktualizuj"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          disabled={pending}
          className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400"
        >
          Ignoruj
        </Button>
      </div>
    </div>
  );
}
