"use client";

import { useCallback } from "react";
import { Cog } from "lucide-react";
import type { DinModule, RailModule, PanelSection, SectionFeed, SectionType, Manufacturer } from "@/components/project/panel-configurator-types";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import {
  savePanelConfiguration,
  loadPanelConfigurations,
  deletePanelConfiguration,
  renamePanelConfiguration,
  duplicatePanelConfiguration,
} from "@/app/dashboard/panel-configurator/actions";
import { DIN_MODULES, MANUFACTURERS, ENCLOSURE_OPTIONS } from "@/lib/data/din-modules-catalog";
export interface SavedConfig {
  id: string;
  name: string;
  updated_at: string;
}

export interface UsePanelPersistenceParams {
  panelName: string;
  selectedManufacturer: Manufacturer;
  customCoefficient: number;
  customModules: DinModule[];
  customCats: Record<string, string>;
  sections: PanelSection[];
  projectId: string;
  currentConfigId: string | null;
  savedConfigs: SavedConfig[];
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  setPanelName: (v: string) => void;
  setSelectedManufacturer: (m: Manufacturer) => void;
  setCustomCoefficient: (v: number) => void;
  setCustomModules: (m: DinModule[]) => void;
  setCustomCats: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSections: React.Dispatch<React.SetStateAction<PanelSection[]>>;
  setActiveSectionIdx: (i: number) => void;
  setCurrentConfigId: (id: string | null) => void;
  setSavedConfigs: React.Dispatch<React.SetStateAction<SavedConfig[]>>;
  setShowLoadDialog: (v: boolean) => void;
  setActiveTab: (v: string) => void;
  setIsSaving: (v: boolean) => void;
}

function createDefaultSection(): PanelSection {
  return {
    id: crypto.randomUUID(),
    name: "Sekcja 1",
    feed: "main",
    type: "distribution",
    enclosure: ENCLOSURE_OPTIONS[2],
    modules: [],
    accessories: [],
  };
}

export function usePanelPersistence(p: UsePanelPersistenceParams) {
  const handleSaveConfig = useCallback(async () => {
    const name = p.panelName.trim() || "Moja rozdzielnica";
    p.setIsSaving(true);
    try {
      const configData = {
        panelName: name,
        manufacturerId: p.selectedManufacturer.id,
        customCoefficient: p.customCoefficient,
        customCatalog: {
          categories: p.customCats,
          modules: p.customModules.map((m) => ({
            id: m.id, name: m.name, namePl: m.namePl, category: m.category,
            modules: m.modules, defaultRating: m.defaultRating, defaultPrice: m.defaultPrice,
            defaultLaborPrice: m.defaultLaborPrice, description: m.description,
          })),
        },
        sections: p.sections.map((s) => ({
          id: s.id, name: s.name, feed: s.feed, type: s.type,
          enclosureModules: s.enclosure.modules,
          modules: s.modules.map((m) => ({
            moduleId: m.module.id, rating: m.rating, label: m.label,
            circuitNumber: m.circuitNumber, cableType: m.cableType,
            customMaterialPrice: m.customMaterialPrice, customLaborPrice: m.customLaborPrice,
            quantity: m.quantity, knrCode: m.knrCode, laborRate: m.laborRate,
          })),
          accessories: s.accessories.map((m) => ({
            moduleId: m.module.id, rating: m.rating, label: m.label,
            circuitNumber: m.circuitNumber, cableType: m.cableType,
            customMaterialPrice: m.customMaterialPrice, customLaborPrice: m.customLaborPrice,
            quantity: m.quantity, knrCode: m.knrCode, laborRate: m.laborRate,
          })),
        })),
      };
      const result = await savePanelConfiguration(name, configData, p.projectId, p.currentConfigId || undefined);
      if (result.success) {
        p.setCurrentConfigId(result.id || null);
        p.toast({ title: "Zapisano konfigurację", description: name });
      } else {
        p.toast({ title: "Błąd zapisu", description: result.error, variant: "destructive" });
      }
    } catch {
      p.toast({ title: "Błąd", description: "Nieoczekiwany błąd zapisu", variant: "destructive" });
    } finally {
      p.setIsSaving(false);
    }
  }, [p]);

  const handleLoadConfigsList = useCallback(async () => {
    const result = await loadPanelConfigurations();
    if (result.success && result.data) {
      p.setSavedConfigs(result.data.map((c) => ({ id: c.id, name: c.name, updated_at: c.updated_at })));
      p.setShowLoadDialog(true);
    } else {
      p.toast({ title: "Błąd", description: result.error || "Nie udało się pobrać listy", variant: "destructive" });
    }
  }, [p]);

  const handleLoadConfig = useCallback(async (configId: string) => {
    const result = await loadPanelConfigurations();
    if (!result.success || !result.data) return;
    const cfg = result.data.find((c) => c.id === configId);
    if (!cfg) return;
    const data = cfg.config_json;
    p.setPanelName(data.panelName || "");
    const mfr = MANUFACTURERS.find((m) => m.id === data.manufacturerId);
    if (mfr) p.setSelectedManufacturer(mfr);
    if (data.customCoefficient) p.setCustomCoefficient(data.customCoefficient);

    const loadedCustomModules: DinModule[] = [];
    if (data.customCatalog) {
      if (data.customCatalog.categories) p.setCustomCats(data.customCatalog.categories);
      if (data.customCatalog.modules) {
        for (const cm of data.customCatalog.modules) {
          loadedCustomModules.push({
            id: cm.id, name: cm.name, namePl: cm.namePl,
            category: cm.category as DinModule["category"],
            modules: cm.modules, icon: Cog,
            defaultRating: cm.defaultRating ?? 0, defaultPrice: cm.defaultPrice ?? 0,
            defaultLaborPrice: cm.defaultLaborPrice ?? 0, description: cm.description || "",
          });
        }
        p.setCustomModules(loadedCustomModules);
      }
    }

    const findModule = (moduleId: string): DinModule | undefined =>
      DIN_MODULES.find((d) => d.id === moduleId) || loadedCustomModules.find((d) => d.id === moduleId);

    interface RawModuleData {
      moduleId: string; rating?: number; label?: string; circuitNumber?: string;
      cableType?: string; customMaterialPrice?: number; customLaborPrice?: number;
      quantity?: number; knrCode?: string; laborRate?: number;
    }
    interface RawSectionData {
      id?: string; name?: string; enclosureModules?: number;
      feed?: string; type?: string;
      modules?: RawModuleData[]; accessories?: RawModuleData[];
    }
    const newSections: PanelSection[] = (data.sections || []).map((sd: RawSectionData) => {
      const enc = ENCLOSURE_OPTIONS.find((e) => e.modules === sd.enclosureModules) || ENCLOSURE_OPTIONS[2];
      const mods: RailModule[] = (sd.modules || []).map((md: RawModuleData) => {
        const dinMod = findModule(md.moduleId);
        if (!dinMod) return null;
        const knrMeta = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
        return {
          uid: crypto.randomUUID(), module: dinMod, rating: md.rating, label: md.label,
          circuitNumber: md.circuitNumber, cableType: md.cableType,
          customMaterialPrice: md.customMaterialPrice, customLaborPrice: md.customLaborPrice,
          quantity: md.quantity, knrCode: md.knrCode ?? knrMeta.knrCode, laborRate: md.laborRate ?? knrMeta.laborRate,
        } as RailModule;
      }).filter((m: RailModule | null): m is RailModule => m !== null);
      const accs: RailModule[] = (sd.accessories || []).map((md: RawModuleData) => {
        const dinMod = findModule(md.moduleId);
        if (!dinMod) return null;
        const knrMetaAcc = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
        return {
          uid: crypto.randomUUID(), module: dinMod, rating: md.rating, label: md.label,
          circuitNumber: md.circuitNumber, cableType: md.cableType,
          customMaterialPrice: md.customMaterialPrice, customLaborPrice: md.customLaborPrice,
          quantity: md.quantity, knrCode: md.knrCode ?? knrMetaAcc.knrCode, laborRate: md.laborRate ?? knrMetaAcc.laborRate,
        } as RailModule;
      }).filter((m: RailModule | null): m is RailModule => m !== null);
      return {
        id: sd.id || crypto.randomUUID(), name: sd.name ?? "",
        feed: sd.feed as SectionFeed, type: sd.type as SectionType,
        enclosure: enc, modules: mods, accessories: accs,
      };
    });

    if (newSections.length > 0) p.setSections(newSections);
    else p.setSections([createDefaultSection()]);
    p.setActiveSectionIdx(0);
    p.setCurrentConfigId(configId);
    p.setShowLoadDialog(false);
    p.setActiveTab("build");
    p.toast({ title: "Załadowano konfigurację", description: cfg.name });
  }, [p]);

  const handleDeleteConfig = useCallback(async (configId: string) => {
    const result = await deletePanelConfiguration(configId);
    if (result.success) {
      p.setSavedConfigs((prev) => prev.filter((c) => c.id !== configId));
      if (p.currentConfigId === configId) p.setCurrentConfigId(null);
      p.toast({ title: "Usunięto konfigurację" });
    }
  }, [p]);

  const handleRenameConfig = useCallback(async (configId: string, newName: string) => {
    const result = await renamePanelConfiguration(configId, newName);
    if (result.success) {
      p.setSavedConfigs((prev) => prev.map((c) => (c.id === configId ? { ...c, name: newName } : c)));
      p.toast({ title: "Zmieniono nazwę" });
    }
  }, [p]);

  const handleDuplicateConfig = useCallback(async (configId: string) => {
    const original = p.savedConfigs.find((c) => c.id === configId);
    const result = await duplicatePanelConfiguration(configId, `${original?.name || "Kopia"} (kopia)`);
    if (result.success && result.id) {
      p.setSavedConfigs((prev) => [
        { id: result.id!, name: `${original?.name || "Kopia"} (kopia)`, updated_at: new Date().toISOString() },
        ...prev,
      ]);
      p.toast({ title: "Zduplikowano konfigurację" });
    }
  }, [p]);

  const refreshSavedConfigs = useCallback(async () => {
    const result = await loadPanelConfigurations();
    if (result.success && result.data) {
      p.setSavedConfigs(result.data.map((c) => ({ id: c.id, name: c.name, updated_at: c.updated_at })));
    }
  }, [p]);

  return {
    handleSaveConfig,
    handleLoadConfigsList,
    handleLoadConfig,
    handleDeleteConfig,
    handleRenameConfig,
    handleDuplicateConfig,
    refreshSavedConfigs,
  };
}
