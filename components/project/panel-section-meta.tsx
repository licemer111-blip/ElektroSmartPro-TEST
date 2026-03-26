"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, RotateCcw, FileDown, FolderPlus, Loader2 } from "lucide-react";
import { DataExchangeManager } from "@/components/project/data-exchange-manager";
import { DIN_MODULES } from "./rozdzielnica/din-modules-catalog";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import { SECTION_FEED_LABELS, SECTION_TYPE_LABELS } from "./panel-configurator-helpers";
import type { PanelSection, RailModule, SectionFeed, SectionType } from "./panel-configurator-types";
import type { SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";

interface PanelSectionMetaProps {
  activeSection: PanelSection;
  activeSectionIdx: number;
  updateSectionMeta: (idx: number, updates: Partial<PanelSection>) => void;
  overflow: boolean;
  occupancyPercent: number;
  totalModules: number;
  selectedEnclosureModules: number;
  railModules: RailModule[];
  allModulesLength: number;
  isSaving: boolean;
  panelName: string;
  setShowClearConfirm: (v: boolean) => void;
  handleSaveConfig: () => void;
  handleLoadConfigsList: () => void;
  setRailModules: (updater: React.SetStateAction<RailModule[]>) => void;
  setAiSchematTrees: React.Dispatch<React.SetStateAction<SectionTree[]>>;
}

export function PanelSectionMeta({
  activeSection, activeSectionIdx, updateSectionMeta,
  overflow, occupancyPercent, totalModules, selectedEnclosureModules,
  railModules, allModulesLength, isSaving, panelName,
  setShowClearConfirm, handleSaveConfig, handleLoadConfigsList,
  setRailModules, setAiSchematTrees,
}: PanelSectionMetaProps) {
  const rcdWarnings: string[] = [];
  railModules.forEach(m => {
    if (m.module.category === "rcd") {
      const rcdIdx = railModules.indexOf(m);
      let mcbCount = 0;
      for (let i = rcdIdx + 1; i < railModules.length; i++) {
        const next = railModules[i];
        if (next.module.category === "rcd") break;
        if (next.module.category === "breaker") mcbCount++;
      }
      if (mcbCount > 6) rcdWarnings.push(`RCD ${m.rating || 40}A ma ${mcbCount} MCB (zalecane max 6)`);
    }
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label htmlFor={`panel-section-name-${activeSectionIdx}`} className="sr-only">Nazwa sekcji</label>
      <Input id={`panel-section-name-${activeSectionIdx}`} name={`panel-section-name-${activeSectionIdx}`} aria-label="Nazwa sekcji" value={activeSection.name} onChange={(e) => updateSectionMeta(activeSectionIdx, { name: e.target.value })}
        className="h-7 text-[11px] w-[160px] font-semibold" placeholder="Nazwa sekcji..." />
      <Select name={`section-feed-${activeSectionIdx}`} value={activeSection.feed} onValueChange={(v) => updateSectionMeta(activeSectionIdx, { feed: v as SectionFeed })}>
        <SelectTrigger id={`section-feed-${activeSectionIdx}`} aria-label="Zasilanie sekcji" className="h-7 text-[10px] w-[170px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.entries(SECTION_FEED_LABELS) as [SectionFeed, string][]).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select name={`section-type-${activeSectionIdx}`} value={activeSection.type} onValueChange={(v) => updateSectionMeta(activeSectionIdx, { type: v as SectionType })}>
        <SelectTrigger id={`section-type-${activeSectionIdx}`} aria-label="Typ sekcji" className="h-7 text-[10px] w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.entries(SECTION_TYPE_LABELS) as [SectionType, string][]).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge variant={overflow ? "destructive" : occupancyPercent > 80 ? "default" : "secondary"} className="text-[10px]"
        title={overflow ? "Przekroczono pojemność obudowy! Wybierz większą obudowę." : occupancyPercent > 80 ? "Obudowa prawie pełna (>80%)" : "Zajętość obudowy"}>
        {totalModules}/{selectedEnclosureModules} mod. ({occupancyPercent}%)
      </Badge>
      {rcdWarnings.length > 0 && (
        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400" title={rcdWarnings.join("; ")}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          {rcdWarnings.length} ostrzeżeń
        </Badge>
      )}
      <div className="flex-1" />
      {allModulesLength > 0 && (
        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => setShowClearConfirm(true)} title="Usuń wszystkie moduły i zresetuj konfigurację">
          <RotateCcw className="w-3 h-3" />Wyczyść
        </Button>
      )}
      <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
        onClick={handleSaveConfig} disabled={isSaving || allModulesLength === 0}>
        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
        Zapisz
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-blue-600" onClick={handleLoadConfigsList}>
        <FolderPlus className="w-3 h-3" />Wczytaj
      </Button>
      <DataExchangeManager
        dinModules={DIN_MODULES}
        railModules={railModules.map(m => ({ ...m, knrCode: undefined }))}
        panelName={panelName}
        onImport={(rows) => {
          for (const row of rows) {
            if (!row.resolvedModuleId) continue;
            const mod = DIN_MODULES.find(m => m.id === row.resolvedModuleId);
            if (!mod) continue;
            const qty = row.resolvedQty ?? 1;
            for (let i = 0; i < qty; i++) {
              const phase = (row.resolvedPhase === "L1" || row.resolvedPhase === "L2" || row.resolvedPhase === "L3") ? row.resolvedPhase : undefined;
              const demKnrMeta = getKnrMetadata(mod.id, mod.category, mod.namePl, mod.modules);
              setRailModules(prev => [...prev, { uid: crypto.randomUUID(), module: mod, rating: row.resolvedRating ?? mod.defaultRating, phase, knrCode: demKnrMeta.knrCode, laborRate: demKnrMeta.laborRate } as RailModule]);
            }
          }
          setAiSchematTrees([]);
        }}
      />
    </div>
  );
}
