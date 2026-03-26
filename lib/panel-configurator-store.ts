/**
 * Global Zustand store for PanelConfigurator state.
 * Persists to localStorage so state survives tab switches and page navigation.
 *
 * Serialization strategy:
 *   - DinModule has `icon: LucideIcon` (a React component — not JSON-serializable).
 *   - We store only the serializable "snapshot" (PersistedRailModule) and
 *     rehydrate full RailModule objects by looking up module IDs at runtime.
 *   - The store exposes both the persisted snapshot AND a hydration helper.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Serializable snapshot types ──────────────────────────────────────────────

export interface PersistedRailModule {
  uid: string;
  moduleId: string;
  rating?: number;
  label?: string;
  customName?: string;
  circuitNumber?: string;
  cableType?: string;
  parentRcdUid?: string;
  customMaterialPrice?: number;
  customLaborPrice?: number;
  quantity?: number;
  phase?: string; // "L1" | "L2" | "L3" — string for Gemini schema compatibility
  isZugBlock?: boolean;
  terminalCount?: number;
}

export interface PersistedEnclosure {
  modules: number;
  rows: number;
  name: string;
}

export type PersistedSectionFeed = "main" | "reserve" | "ups" | "pv" | "generator";
export type PersistedSectionType = "distribution" | "ats" | "metering" | "compensation" | "automation" | "motor";

export interface PersistedSection {
  id: string;
  name: string;
  feed: PersistedSectionFeed;
  type: PersistedSectionType;
  enclosure: PersistedEnclosure;
  modules: PersistedRailModule[];
  accessories: PersistedRailModule[];
}

// ── Store state & actions ────────────────────────────────────────────────────

interface PanelConfiguratorStoreState {
  sections: PersistedSection[];
  activeSectionIdx: number;
  panelName: string;
  selectedManufacturerId: string;
  customCoefficient: number;
  /** The projectId this configuration belongs to (null = standalone page) */
  boundProjectId: string | null;

  // Actions
  setSections: (sections: PersistedSection[]) => void;
  setActiveSectionIdx: (idx: number) => void;
  setPanelName: (name: string) => void;
  setSelectedManufacturerId: (id: string) => void;
  setCustomCoefficient: (coeff: number) => void;
  setBoundProjectId: (id: string | null) => void;
  reset: () => void;
}

const DEFAULT_ENCLOSURE: PersistedEnclosure = { modules: 36, rows: 3, name: "3×12 (36 mod.) duże mieszkanie" };

const DEFAULT_SECTION: PersistedSection = {
  id: "default-section",
  name: "Sekcja 1",
  feed: "main",
  type: "distribution",
  enclosure: DEFAULT_ENCLOSURE,
  modules: [],
  accessories: [],
};

const INITIAL_STATE = {
  sections: [DEFAULT_SECTION],
  activeSectionIdx: 0,
  panelName: "",
  selectedManufacturerId: "hager",
  customCoefficient: 1.0,
  boundProjectId: null as string | null,
};

export const usePanelConfiguratorStore = create<PanelConfiguratorStoreState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setSections: (sections) => set({ sections }),
      setActiveSectionIdx: (activeSectionIdx) => set({ activeSectionIdx }),
      setPanelName: (panelName) => set({ panelName }),
      setSelectedManufacturerId: (selectedManufacturerId) => set({ selectedManufacturerId }),
      setCustomCoefficient: (customCoefficient) => set({ customCoefficient }),
      setBoundProjectId: (boundProjectId) => set({ boundProjectId }),
      reset: () => set({
        ...INITIAL_STATE,
        sections: [{
          ...DEFAULT_SECTION,
          id: typeof crypto !== "undefined" ? crypto.randomUUID() : "default-section",
        }],
      }),
    }),
    {
      name: "elektrosmart-panel-configurator",
      storage: createJSONStorage(() => localStorage),
      // Only persist the fields that matter — skip transient UI state
      partialize: (state) => ({
        sections: state.sections,
        activeSectionIdx: state.activeSectionIdx,
        panelName: state.panelName,
        selectedManufacturerId: state.selectedManufacturerId,
        customCoefficient: state.customCoefficient,
        boundProjectId: state.boundProjectId,
      }),
    }
  )
);
