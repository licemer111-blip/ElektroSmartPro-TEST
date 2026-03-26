"use client";

import React, { useCallback, useEffect } from "react";
import { usePanelViewerSync } from "@/hooks/use-panel-viewer-sync";
import { DIN_MODULES } from "@/components/project/rozdzielnica/din-modules-catalog";
import type { PanelSection, Manufacturer } from "@/components/project/panel-configurator-types";

interface UsePanelRealtimeSyncProps {
  projectId: string | undefined;
  sections: PanelSection[];
  customModules: import("@/components/project/panel-configurator-types").DinModule[];
  customCats: Record<string, string>;
  activeSectionIdx: number;
  activeTab: string;
  selectedUid: string | null;
  editingAccessoryUid: string | null;
  showAiPanel: boolean;
  aiDescription: string;
  pricingMode: "none" | "ai" | "manual";
  catalogMode: "default" | "custom";
  collapsedCats: Set<string>;
  collapsedCustomCats: Set<string>;
  panelName: string;
  selectedManufacturer: Manufacturer;
  customCoefficient: number;
  showLoadDialog: boolean;
  showClearConfirm: boolean;
  moduleSearch: string;
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
  // Setters from reducer
  setSections: (updater: React.SetStateAction<PanelSection[]>) => void;
  setActiveTab: (v: string) => void;
  setActiveSectionIdx: (v: number | ((p: number) => number)) => void;
  setSelectedUid: (v: string | null) => void;
  setEditingAccessoryUid: (v: string | null) => void;
  setShowAiPanel: (v: boolean) => void;
  setAiDescription: (v: string) => void;
  setPricingMode: (v: "none" | "ai" | "manual") => void;
  setCatalogMode: (v: "default" | "custom") => void;
  setCollapsedCats: (v: Set<string>) => void;
  setCollapsedCustomCats: (v: Set<string>) => void;
  setPanelName: (v: string) => void;
  setSelectedManufacturer: (v: Manufacturer) => void;
  setCustomCoefficient: (v: number) => void;
  setShowLoadDialog: (v: boolean) => void;
  setShowClearConfirm: (v: boolean) => void;
  setModuleSearch: (v: string) => void;
  setCustomModules: (v: import("@/components/project/panel-configurator-types").DinModule[]) => void;
  setCustomCats: (v: Record<string, string>) => void;
  setCircuitEditCell: (v: { uid: string; field: "cableType" | "label" } | null) => void;
  MANUFACTURERS: Manufacturer[];
}

const LOCAL_PRIORITY_MS = 600;

export function usePanelRealtimeSync({
  projectId,
  sections, customModules, customCats,
  activeSectionIdx, activeTab, selectedUid, editingAccessoryUid,
  showAiPanel, aiDescription, pricingMode, catalogMode,
  collapsedCats, collapsedCustomCats, panelName,
  selectedManufacturer, customCoefficient, showLoadDialog, showClearConfirm,
  moduleSearch, circuitEditCell,
  setSections, setActiveTab, setActiveSectionIdx, setSelectedUid,
  setEditingAccessoryUid, setShowAiPanel, setAiDescription,
  setPricingMode, setCatalogMode, setCollapsedCats, setCollapsedCustomCats,
  setPanelName, setSelectedManufacturer, setCustomCoefficient,
  setShowLoadDialog, setShowClearConfirm, setModuleSearch,
  setCustomModules, setCustomCats, setCircuitEditCell,
  MANUFACTURERS,
}: UsePanelRealtimeSyncProps) {
  const {
    broadcastPanelState,
    broadcastSections,
    broadcastCustomCatalog,
    receivedState,
    receivedSections,
    receivedCustomModules,
    receivedCustomCats,
    isViewerMode,
    leaderName,
    onlineUsers: syncOnlineUsers,
    startFollowing,
    stopFollowing,
  } = usePanelViewerSync(projectId ?? null);

  // Rehydrate RailModule.module (DinModule) — broadcast strips icon (React component).
  const rehydrateSections = useCallback((raw: PanelSection[]): PanelSection[] => {
    const allModules = [...DIN_MODULES, ...customModules];
    const byId = new Map(allModules.map(m => [m.id, m]));
    return raw.map(section => ({
      ...section,
      modules: section.modules.map(rm => ({
        ...rm,
        module: byId.get(rm.module.id) ?? rm.module,
      })),
      accessories: section.accessories.map(rm => ({
        ...rm,
        module: byId.get(rm.module.id) ?? rm.module,
      })),
    }));
  }, [customModules]);

  // ── Broadcast state changes ──────────────────────────────────────────────
  useEffect(() => { broadcastPanelState({ activeTab }); }, [activeTab, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ activeSectionIdx }); }, [activeSectionIdx, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ selectedUid }); }, [selectedUid, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ editingAccessoryUid }); }, [editingAccessoryUid, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ showAiPanel }); }, [showAiPanel, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ aiDescription }); }, [aiDescription, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ pricingMode }); }, [pricingMode, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ catalogMode }); }, [catalogMode, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ collapsedCats: Array.from(collapsedCats) }); }, [collapsedCats, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ panelName }); }, [panelName, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ selectedManufacturerId: selectedManufacturer.id }); }, [selectedManufacturer, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ customCoefficient }); }, [customCoefficient, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ showLoadDialog }); }, [showLoadDialog, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ showClearConfirm }); }, [showClearConfirm, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ moduleSearch }); }, [moduleSearch, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ collapsedCustomCats: Array.from(collapsedCustomCats) }); }, [collapsedCustomCats, broadcastPanelState]);
  useEffect(() => { broadcastPanelState({ circuitEditCell }); }, [circuitEditCell, broadcastPanelState]);

  // ── Bidirectional sections sync with LWW ────────────────────────────────
  useEffect(() => { broadcastSections(sections); }, [sections, broadcastSections]);

  const localSectionTsRef = React.useRef<Map<string, number>>(new Map());
  const prevSectionsRef = React.useRef<PanelSection[]>(sections);

  useEffect(() => {
    const now = Date.now();
    sections.forEach((s, idx) => {
      const prev = prevSectionsRef.current[idx];
      if (!prev || prev.id !== s.id || JSON.stringify(prev) !== JSON.stringify(s)) {
        localSectionTsRef.current.set(s.id, now);
      }
    });
    if (sections.length < prevSectionsRef.current.length) {
      localSectionTsRef.current.set("__length__", now);
    }
    prevSectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    if (!receivedSections) return;
    const now = Date.now();
    const hydrated = rehydrateSections(receivedSections);

    setSections(prev => {
      const localById = new Map(prev.map(s => [s.id, s]));
      const lengthEditTs = localSectionTsRef.current.get("__length__") ?? 0;
      if (now - lengthEditTs < LOCAL_PRIORITY_MS) return prev;

      const result = hydrated.map(incoming => {
        const localEditTs = localSectionTsRef.current.get(incoming.id) ?? 0;
        if (now - localEditTs < LOCAL_PRIORITY_MS) {
          return localById.get(incoming.id) ?? incoming;
        }
        return incoming;
      });

      const remoteIds = new Set(hydrated.map(s => s.id));
      prev.forEach(localSection => {
        if (!remoteIds.has(localSection.id)) {
          const localEditTs = localSectionTsRef.current.get(localSection.id) ?? 0;
          if (now - localEditTs < LOCAL_PRIORITY_MS) result.push(localSection);
        }
      });

      return result;
    });
  }, [receivedSections]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bidirectional custom catalog sync ───────────────────────────────────
  useEffect(() => {
    broadcastCustomCatalog(customModules, customCats);
  }, [customModules, customCats, broadcastCustomCatalog]);

  useEffect(() => {
    if (!receivedCustomModules) return;
    setCustomModules(receivedCustomModules);
  }, [receivedCustomModules]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!receivedCustomCats) return;
    setCustomCats(receivedCustomCats);
  }, [receivedCustomCats]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Observer: apply received state from leader ───────────────────────────
  useEffect(() => {
    if (!isViewerMode || !receivedState) return;
    if (receivedState.activeTab !== undefined) setActiveTab(receivedState.activeTab);
    if (receivedState.activeSectionIdx !== undefined) setActiveSectionIdx(receivedState.activeSectionIdx);
    if (receivedState.selectedUid !== undefined) setSelectedUid(receivedState.selectedUid);
    if (receivedState.editingAccessoryUid !== undefined) setEditingAccessoryUid(receivedState.editingAccessoryUid);
    if (receivedState.showAiPanel !== undefined) setShowAiPanel(receivedState.showAiPanel);
    if (receivedState.aiDescription !== undefined) setAiDescription(receivedState.aiDescription);
    if (receivedState.pricingMode !== undefined) setPricingMode(receivedState.pricingMode as "none" | "ai" | "manual");
    if (receivedState.catalogMode !== undefined) setCatalogMode(receivedState.catalogMode as "default" | "custom");
    if (receivedState.collapsedCats !== undefined) setCollapsedCats(new Set(receivedState.collapsedCats));
    if (receivedState.panelName !== undefined) setPanelName(receivedState.panelName);
    if (receivedState.selectedManufacturerId !== undefined) {
      const found = MANUFACTURERS.find(m => m.id === receivedState.selectedManufacturerId);
      if (found) setSelectedManufacturer(found);
    }
    if (receivedState.customCoefficient !== undefined) setCustomCoefficient(receivedState.customCoefficient);
    if (receivedState.showLoadDialog !== undefined) setShowLoadDialog(receivedState.showLoadDialog);
    if (receivedState.showClearConfirm !== undefined) setShowClearConfirm(receivedState.showClearConfirm);
    if (receivedState.moduleSearch !== undefined) setModuleSearch(receivedState.moduleSearch);
    if (receivedState.collapsedCustomCats !== undefined) setCollapsedCustomCats(new Set(receivedState.collapsedCustomCats));
    if (receivedState.circuitEditCell !== undefined) setCircuitEditCell(receivedState.circuitEditCell as { uid: string; field: "cableType" | "label" } | null);
  }, [isViewerMode, receivedState]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isViewerMode, leaderName, syncOnlineUsers, startFollowing, stopFollowing };
}
