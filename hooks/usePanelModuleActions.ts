"use client";
import { useCallback } from "react";
import type { DinModule, RailModule } from "@/components/project/panel-configurator-types";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import { isNonModularItem } from "@/components/project/panel-configurator-helpers";
import type { SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";

interface UsePanelModuleActionsParams {
  setRailModules: (updater: React.SetStateAction<RailModule[]>) => void;
  setAccessoryItems: (updater: React.SetStateAction<RailModule[]>) => void;
  setAiSchematTrees: React.Dispatch<React.SetStateAction<SectionTree[]>>;
  setDragUid: (uid: string | null) => void;
}

export function usePanelModuleActions({
  setRailModules, setAccessoryItems, setAiSchematTrees, setDragUid,
}: UsePanelModuleActionsParams) {
  const addModule = useCallback((module: DinModule, rating?: number, insertAtIndex?: number) => {
    const knrMeta = getKnrMetadata(module.id, module.category, module.namePl, module.modules);
    const newItem: RailModule = {
      uid: crypto.randomUUID(),
      module,
      rating: rating ?? module.defaultRating,
      knrCode: knrMeta.knrCode,
      laborRate: knrMeta.laborRate,
      ...(module.id === "zug-block" ? { isZugBlock: true, terminalCount: 15 } : {}),
    };
    if (isNonModularItem(module)) {
      setAccessoryItems((prev) => [...prev, newItem]);
    } else {
      setRailModules((prev) => {
        if (insertAtIndex !== undefined && insertAtIndex >= 0 && insertAtIndex <= prev.length) {
          const arr = [...prev];
          arr.splice(insertAtIndex, 0, newItem);
          return arr;
        }
        return [...prev, newItem];
      });
    }
    setAiSchematTrees([]);
  }, [setRailModules, setAccessoryItems, setAiSchematTrees]);

  const removeModule = useCallback((uid: string) => {
    setRailModules((prev) => {
      const exists = prev.some(m => m.uid === uid);
      if (exists) return prev.filter((m) => m.uid !== uid);
      return prev;
    });
    setAccessoryItems((prev) => prev.filter((m) => m.uid !== uid));
    setAiSchematTrees([]);
  }, [setRailModules, setAccessoryItems, setAiSchematTrees]);

  const duplicateModule = useCallback((uid: string) => {
    setRailModules((prev) => {
      const source = prev.find((m) => m.uid === uid);
      if (!source) return prev;
      const idx = prev.indexOf(source);
      const clone: RailModule = {
        uid: crypto.randomUUID(), module: source.module, rating: source.rating,
        label: source.label, customMaterialPrice: source.customMaterialPrice,
        customLaborPrice: source.customLaborPrice,
      };
      const arr = [...prev];
      arr.splice(idx + 1, 0, clone);
      return arr;
    });
    setAccessoryItems((prev) => {
      const source = prev.find((m) => m.uid === uid);
      if (!source) return prev;
      const idx = prev.indexOf(source);
      const clone: RailModule = {
        uid: crypto.randomUUID(), module: source.module, rating: source.rating,
        label: source.label, customMaterialPrice: source.customMaterialPrice,
        customLaborPrice: source.customLaborPrice,
      };
      const arr = [...prev];
      arr.splice(idx + 1, 0, clone);
      return arr;
    });
  }, [setRailModules, setAccessoryItems]);

  const handleDragDrop = useCallback((fromUid: string, toUid: string) => {
    if (fromUid === toUid) return;
    setRailModules((prev) => {
      const fromIdx = prev.findIndex((m) => m.uid === fromUid);
      const toIdx = prev.findIndex((m) => m.uid === toUid);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    setDragUid(null);
  }, [setRailModules, setDragUid]);

  return { addModule, removeModule, duplicateModule, handleDragDrop };
}
