"use client";

// ============================================================
// usePanelReducer.ts — PanelConfigurator state management
// ============================================================
// Replaces 31 individual useState calls with a single useReducer.
// Grouped into 5 logical slices:
//   1. Core panel state (sections, name, tab, open)
//   2. UI interaction (drag, select, search, collapsed cats)
//   3. AI state (description, generating, schemat, usage)
//   4. Custom catalog (modules, cats, forms)
//   5. Save/pricing/circuit state
// ============================================================

import { useReducer, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { MODULE_CATEGORIES } from "../panel-configurator-helpers";
import { MANUFACTURERS } from "@/lib/data/din-modules-catalog";
import type { PanelSection, DinModule, Manufacturer } from "../panel-configurator-types";
import type { SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";

// ─── SetStateAction helper ────────────────────────────────────────────────────
// Resolves value-or-function pattern (drop-in for useState setters)
function resolve<T>(action: SetStateAction<T>, current: T): T {
  return typeof action === "function" ? (action as (prev: T) => T)(current) : action;
}

interface CustomFormState {
  namePl: string;
  category: string;
  newCategory: string;
  producer: string;
  modules: number;
  defaultRating: number;
  defaultPrice: number;
  defaultLaborPrice: number;
  description: string;
}

export interface PanelState {
  // ── 1. Core panel ──────────────────────────────────────────
  open: boolean;
  sections: PanelSection[];
  activeSectionIdx: number;
  panelName: string;
  activeTab: string;

  // ── 2. UI interaction ──────────────────────────────────────
  moduleSearch: string;
  isAdding: boolean;
  isExporting: boolean;
  isDownloading: boolean;
  collapsedCats: Set<string>;
  dragUid: string | null;
  selectedUid: string | null;
  editingAccessoryUid: string | null;

  // ── 3. AI state ────────────────────────────────────────────
  showAiPanel: boolean;
  aiDescription: string;
  aiGenerating: boolean;
  aiSchematTrees: SectionTree[];
  aiSchematLoading: boolean;
  aiValidationNotes: string[];
  aiUsageInfo: { used: number; limit: number; isPro: boolean } | null;
  selectedManufacturer: Manufacturer;
  customCoefficient: number;

  // ── 4. Custom catalog ──────────────────────────────────────
  catalogMode: "default" | "custom";
  customModules: DinModule[];
  customCats: Record<string, string>;
  collapsedCustomCats: Set<string>;
  showCustomForm: boolean;
  showNewCatForm: boolean;
  newCatName: string;
  customForm: CustomFormState;

  // ── 5. Save / pricing / circuit ────────────────────────────
  savedConfigs: { id: string; name: string; updated_at: string }[];
  currentConfigId: string | null;
  isSaving: boolean;
  showLoadDialog: boolean;
  showClearConfirm: boolean;
  pricingResult: PricingResult | null;
  isWycenLoading: boolean;
  manualPrices: Record<string, { mat: number; lab: number }>;
  pricingMode: "none" | "ai" | "manual";
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
  circuitSelectedUids: Set<string>;
  fillDownCable: string;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type PanelAction =
  // Core
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "SET_SECTIONS"; payload: PanelSection[] }
  | { type: "UPDATE_SECTION_MODULES"; sectionIdx: number; updater: (prev: import("../panel-configurator-types").RailModule[]) => import("../panel-configurator-types").RailModule[] }
  | { type: "UPDATE_SECTION_ACCESSORIES"; sectionIdx: number; updater: (prev: import("../panel-configurator-types").RailModule[]) => import("../panel-configurator-types").RailModule[] }
  | { type: "SET_ACTIVE_SECTION_IDX"; payload: number }
  | { type: "SET_PANEL_NAME"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  // UI interaction
  | { type: "SET_MODULE_SEARCH"; payload: string }
  | { type: "SET_IS_ADDING"; payload: boolean }
  | { type: "SET_IS_EXPORTING"; payload: boolean }
  | { type: "SET_IS_DOWNLOADING"; payload: boolean }
  | { type: "TOGGLE_CAT"; payload: string }
  | { type: "SET_COLLAPSED_CATS"; payload: Set<string> }
  | { type: "SET_DRAG_UID"; payload: string | null }
  | { type: "SET_SELECTED_UID"; payload: string | null }
  | { type: "SET_EDITING_ACCESSORY_UID"; payload: string | null }
  // AI
  | { type: "SET_SHOW_AI_PANEL"; payload: boolean }
  | { type: "SET_AI_DESCRIPTION"; payload: string }
  | { type: "SET_AI_GENERATING"; payload: boolean }
  | { type: "SET_AI_SCHEMAT_TREES"; payload: SectionTree[] }
  | { type: "SET_AI_SCHEMAT_LOADING"; payload: boolean }
  | { type: "SET_AI_VALIDATION_NOTES"; payload: string[] }
  | { type: "SET_AI_USAGE_INFO"; payload: { used: number; limit: number; isPro: boolean } | null }
  | { type: "SET_SELECTED_MANUFACTURER"; payload: Manufacturer }
  | { type: "SET_CUSTOM_COEFFICIENT"; payload: number }
  // Custom catalog
  | { type: "SET_CATALOG_MODE"; payload: "default" | "custom" }
  | { type: "SET_CUSTOM_MODULES"; payload: DinModule[] }
  | { type: "SET_CUSTOM_CATS"; payload: Record<string, string> }
  | { type: "TOGGLE_CUSTOM_CAT"; payload: string }
  | { type: "SET_COLLAPSED_CUSTOM_CATS"; payload: Set<string> }
  | { type: "SET_SHOW_CUSTOM_FORM"; payload: boolean }
  | { type: "SET_SHOW_NEW_CAT_FORM"; payload: boolean }
  | { type: "SET_NEW_CAT_NAME"; payload: string }
  | { type: "SET_CUSTOM_FORM"; payload: Partial<CustomFormState> }
  | { type: "RESET_CUSTOM_FORM" }
  // Save / pricing / circuit
  | { type: "SET_SAVED_CONFIGS"; payload: { id: string; name: string; updated_at: string }[] }
  | { type: "SET_CURRENT_CONFIG_ID"; payload: string | null }
  | { type: "SET_IS_SAVING"; payload: boolean }
  | { type: "SET_SHOW_LOAD_DIALOG"; payload: boolean }
  | { type: "SET_SHOW_CLEAR_CONFIRM"; payload: boolean }
  | { type: "SET_PRICING_RESULT"; payload: PricingResult | null }
  | { type: "SET_IS_WYCEN_LOADING"; payload: boolean }
  | { type: "SET_MANUAL_PRICES"; payload: Record<string, { mat: number; lab: number }> }
  | { type: "SET_PRICING_MODE"; payload: "none" | "ai" | "manual" }
  | { type: "SET_CIRCUIT_EDIT_CELL"; payload: { uid: string; field: "cableType" | "label" } | null }
  | { type: "SET_CIRCUIT_SELECTED_UIDS"; payload: Set<string> }
  | { type: "SET_FILL_DOWN_CABLE"; payload: string };

// ─── Initial state factory ────────────────────────────────────────────────────

const DEFAULT_CUSTOM_FORM: CustomFormState = {
  namePl: "", category: "", newCategory: "", producer: "",
  modules: 1, defaultRating: 0, defaultPrice: 0, defaultLaborPrice: 0, description: "",
};

export function createInitialPanelState(asPage: boolean, initialSections: PanelSection[]): PanelState {
  return {
    // Core
    open: asPage,
    sections: initialSections,
    activeSectionIdx: 0,
    panelName: "",
    activeTab: "build",
    // UI
    moduleSearch: "",
    isAdding: false,
    isExporting: false,
    isDownloading: false,
    collapsedCats: new Set(Object.keys(MODULE_CATEGORIES)),
    dragUid: null,
    selectedUid: null,
    editingAccessoryUid: null,
    // AI
    showAiPanel: false,
    aiDescription: "",
    aiGenerating: false,
    aiSchematTrees: [],
    aiSchematLoading: false,
    aiValidationNotes: [],
    aiUsageInfo: null,
    selectedManufacturer: MANUFACTURERS[0],
    customCoefficient: 1.0,
    // Custom catalog
    catalogMode: "default",
    customModules: [],
    customCats: {},
    collapsedCustomCats: new Set(),
    showCustomForm: false,
    showNewCatForm: false,
    newCatName: "",
    customForm: DEFAULT_CUSTOM_FORM,
    // Save / pricing / circuit
    savedConfigs: [],
    currentConfigId: null,
    isSaving: false,
    showLoadDialog: false,
    showClearConfirm: false,
    pricingResult: null,
    isWycenLoading: false,
    manualPrices: {},
    pricingMode: "none",
    circuitEditCell: null,
    circuitSelectedUids: new Set(),
    fillDownCable: "",
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    // ── Core ──────────────────────────────────────────────────
    case "SET_OPEN": return { ...state, open: action.payload };
    case "SET_SECTIONS": return { ...state, sections: action.payload };
    case "UPDATE_SECTION_MODULES": {
      const idx = Math.min(action.sectionIdx, state.sections.length - 1);
      const next = [...state.sections];
      next[idx] = { ...next[idx], modules: action.updater(next[idx].modules) };
      return { ...state, sections: next };
    }
    case "UPDATE_SECTION_ACCESSORIES": {
      const idx = Math.min(action.sectionIdx, state.sections.length - 1);
      const next = [...state.sections];
      next[idx] = { ...next[idx], accessories: action.updater(next[idx].accessories) };
      return { ...state, sections: next };
    }
    case "SET_ACTIVE_SECTION_IDX": return { ...state, activeSectionIdx: action.payload };
    case "SET_PANEL_NAME": return { ...state, panelName: action.payload };
    case "SET_ACTIVE_TAB": return { ...state, activeTab: action.payload };

    // ── UI interaction ─────────────────────────────────────────
    case "SET_MODULE_SEARCH": return { ...state, moduleSearch: action.payload };
    case "SET_IS_ADDING": return { ...state, isAdding: action.payload };
    case "SET_IS_EXPORTING": return { ...state, isExporting: action.payload };
    case "SET_IS_DOWNLOADING": return { ...state, isDownloading: action.payload };
    case "TOGGLE_CAT": {
      const next = new Set(state.collapsedCats);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, collapsedCats: next };
    }
    case "SET_COLLAPSED_CATS": return { ...state, collapsedCats: action.payload };
    case "SET_DRAG_UID": return { ...state, dragUid: action.payload };
    case "SET_SELECTED_UID": return { ...state, selectedUid: action.payload };
    case "SET_EDITING_ACCESSORY_UID": return { ...state, editingAccessoryUid: action.payload };

    // ── AI ────────────────────────────────────────────────────
    case "SET_SHOW_AI_PANEL": return { ...state, showAiPanel: action.payload };
    case "SET_AI_DESCRIPTION": return { ...state, aiDescription: action.payload };
    case "SET_AI_GENERATING": return { ...state, aiGenerating: action.payload };
    case "SET_AI_SCHEMAT_TREES": return { ...state, aiSchematTrees: action.payload };
    case "SET_AI_SCHEMAT_LOADING": return { ...state, aiSchematLoading: action.payload };
    case "SET_AI_VALIDATION_NOTES": return { ...state, aiValidationNotes: action.payload };
    case "SET_AI_USAGE_INFO": return { ...state, aiUsageInfo: action.payload };
    case "SET_SELECTED_MANUFACTURER": return { ...state, selectedManufacturer: action.payload };
    case "SET_CUSTOM_COEFFICIENT": return { ...state, customCoefficient: action.payload };

    // ── Custom catalog ─────────────────────────────────────────
    case "SET_CATALOG_MODE": return { ...state, catalogMode: action.payload };
    case "SET_CUSTOM_MODULES": return { ...state, customModules: action.payload };
    case "SET_CUSTOM_CATS": return { ...state, customCats: action.payload };
    case "TOGGLE_CUSTOM_CAT": {
      const next = new Set(state.collapsedCustomCats);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, collapsedCustomCats: next };
    }
    case "SET_COLLAPSED_CUSTOM_CATS": return { ...state, collapsedCustomCats: action.payload };
    case "SET_SHOW_CUSTOM_FORM": return { ...state, showCustomForm: action.payload };
    case "SET_SHOW_NEW_CAT_FORM": return { ...state, showNewCatForm: action.payload };
    case "SET_NEW_CAT_NAME": return { ...state, newCatName: action.payload };
    case "SET_CUSTOM_FORM": return { ...state, customForm: { ...state.customForm, ...action.payload } };
    case "RESET_CUSTOM_FORM": return { ...state, customForm: DEFAULT_CUSTOM_FORM };

    // ── Save / pricing / circuit ───────────────────────────────
    case "SET_SAVED_CONFIGS": return { ...state, savedConfigs: action.payload };
    case "SET_CURRENT_CONFIG_ID": return { ...state, currentConfigId: action.payload };
    case "SET_IS_SAVING": return { ...state, isSaving: action.payload };
    case "SET_SHOW_LOAD_DIALOG": return { ...state, showLoadDialog: action.payload };
    case "SET_SHOW_CLEAR_CONFIRM": return { ...state, showClearConfirm: action.payload };
    case "SET_PRICING_RESULT": return { ...state, pricingResult: action.payload };
    case "SET_IS_WYCEN_LOADING": return { ...state, isWycenLoading: action.payload };
    case "SET_MANUAL_PRICES": return { ...state, manualPrices: action.payload };
    case "SET_PRICING_MODE": return { ...state, pricingMode: action.payload };
    case "SET_CIRCUIT_EDIT_CELL": return { ...state, circuitEditCell: action.payload };
    case "SET_CIRCUIT_SELECTED_UIDS": return { ...state, circuitSelectedUids: action.payload };
    case "SET_FILL_DOWN_CABLE": return { ...state, fillDownCable: action.payload };

    default: return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * usePanelReducer — drop-in replacement for 31 useState calls in PanelConfigurator.
 *
 * Returns `state` and stable `dispatch` + convenience setter aliases
 * that match the original useState setter signatures for easy migration.
 */
export function usePanelReducer(asPage: boolean, initialSections: PanelSection[]) {
  const [state, dispatch] = useReducer(
    panelReducer,
    undefined,
    () => createInitialPanelState(asPage, initialSections)
  );

  // ── Convenience setters — accept value OR (prev => next) function ────────────
  // This matches the React useState setter signature: Dispatch<SetStateAction<T>>

  const setOpen: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_OPEN", payload: resolve(a, state.open) }), [state.open]);

  const setSections: Dispatch<SetStateAction<PanelSection[]>> = useCallback(
    (a) => dispatch({ type: "SET_SECTIONS", payload: resolve(a, state.sections) }), [state.sections]);

  const setActiveSectionIdx: Dispatch<SetStateAction<number>> = useCallback(
    (a) => dispatch({ type: "SET_ACTIVE_SECTION_IDX", payload: resolve(a, state.activeSectionIdx) }), [state.activeSectionIdx]);

  const setPanelName: Dispatch<SetStateAction<string>> = useCallback(
    (a) => dispatch({ type: "SET_PANEL_NAME", payload: resolve(a, state.panelName) }), [state.panelName]);

  const setActiveTab: Dispatch<SetStateAction<string>> = useCallback(
    (a) => dispatch({ type: "SET_ACTIVE_TAB", payload: resolve(a, state.activeTab) }), [state.activeTab]);

  const setModuleSearch: Dispatch<SetStateAction<string>> = useCallback(
    (a) => dispatch({ type: "SET_MODULE_SEARCH", payload: resolve(a, state.moduleSearch) }), [state.moduleSearch]);

  const setIsAdding: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_IS_ADDING", payload: resolve(a, state.isAdding) }), [state.isAdding]);

  const setIsExporting: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_IS_EXPORTING", payload: resolve(a, state.isExporting) }), [state.isExporting]);

  const setIsDownloading: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_IS_DOWNLOADING", payload: resolve(a, state.isDownloading) }), [state.isDownloading]);

  const setCollapsedCats: Dispatch<SetStateAction<Set<string>>> = useCallback(
    (a) => dispatch({ type: "SET_COLLAPSED_CATS", payload: resolve(a, state.collapsedCats) }), [state.collapsedCats]);

  const toggleCat = useCallback(
    (cat: string) => dispatch({ type: "TOGGLE_CAT", payload: cat }), []);

  const setDragUid: Dispatch<SetStateAction<string | null>> = useCallback(
    (a) => dispatch({ type: "SET_DRAG_UID", payload: resolve(a, state.dragUid) }), [state.dragUid]);

  const setSelectedUid: Dispatch<SetStateAction<string | null>> = useCallback(
    (a) => dispatch({ type: "SET_SELECTED_UID", payload: resolve(a, state.selectedUid) }), [state.selectedUid]);

  const setEditingAccessoryUid: Dispatch<SetStateAction<string | null>> = useCallback(
    (a) => dispatch({ type: "SET_EDITING_ACCESSORY_UID", payload: resolve(a, state.editingAccessoryUid) }), [state.editingAccessoryUid]);

  const setShowAiPanel: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_SHOW_AI_PANEL", payload: resolve(a, state.showAiPanel) }), [state.showAiPanel]);

  const setAiDescription: Dispatch<SetStateAction<string>> = useCallback(
    (a) => dispatch({ type: "SET_AI_DESCRIPTION", payload: resolve(a, state.aiDescription) }), [state.aiDescription]);

  const setAiGenerating: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_AI_GENERATING", payload: resolve(a, state.aiGenerating) }), [state.aiGenerating]);

  const setAiSchematTrees: Dispatch<SetStateAction<SectionTree[]>> = useCallback(
    (a) => dispatch({ type: "SET_AI_SCHEMAT_TREES", payload: resolve(a, state.aiSchematTrees) }), [state.aiSchematTrees]);

  const setAiSchematLoading: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_AI_SCHEMAT_LOADING", payload: resolve(a, state.aiSchematLoading) }), [state.aiSchematLoading]);

  const setAiValidationNotes: Dispatch<SetStateAction<string[]>> = useCallback(
    (a) => dispatch({ type: "SET_AI_VALIDATION_NOTES", payload: resolve(a, state.aiValidationNotes) }), [state.aiValidationNotes]);

  const setAiUsageInfo: Dispatch<SetStateAction<{ used: number; limit: number; isPro: boolean } | null>> = useCallback(
    (a) => dispatch({ type: "SET_AI_USAGE_INFO", payload: resolve(a, state.aiUsageInfo) }), [state.aiUsageInfo]);

  const setSelectedManufacturer: Dispatch<SetStateAction<Manufacturer>> = useCallback(
    (a) => dispatch({ type: "SET_SELECTED_MANUFACTURER", payload: resolve(a, state.selectedManufacturer) }), [state.selectedManufacturer]);

  const setCustomCoefficient: Dispatch<SetStateAction<number>> = useCallback(
    (a) => dispatch({ type: "SET_CUSTOM_COEFFICIENT", payload: resolve(a, state.customCoefficient) }), [state.customCoefficient]);

  const setCatalogMode: Dispatch<SetStateAction<"default" | "custom">> = useCallback(
    (a) => dispatch({ type: "SET_CATALOG_MODE", payload: resolve(a, state.catalogMode) }), [state.catalogMode]);

  const setCustomModules: Dispatch<SetStateAction<DinModule[]>> = useCallback(
    (a) => dispatch({ type: "SET_CUSTOM_MODULES", payload: resolve(a, state.customModules) }), [state.customModules]);

  const setCustomCats: Dispatch<SetStateAction<Record<string, string>>> = useCallback(
    (a) => dispatch({ type: "SET_CUSTOM_CATS", payload: resolve(a, state.customCats) }), [state.customCats]);

  const setCollapsedCustomCats: Dispatch<SetStateAction<Set<string>>> = useCallback(
    (a) => dispatch({ type: "SET_COLLAPSED_CUSTOM_CATS", payload: resolve(a, state.collapsedCustomCats) }), [state.collapsedCustomCats]);

  const toggleCustomCat = useCallback(
    (cat: string) => dispatch({ type: "TOGGLE_CUSTOM_CAT", payload: cat }), []);

  const setShowCustomForm: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_SHOW_CUSTOM_FORM", payload: resolve(a, state.showCustomForm) }), [state.showCustomForm]);

  const setShowNewCatForm: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_SHOW_NEW_CAT_FORM", payload: resolve(a, state.showNewCatForm) }), [state.showNewCatForm]);

  const setNewCatName: Dispatch<SetStateAction<string>> = useCallback(
    (a) => dispatch({ type: "SET_NEW_CAT_NAME", payload: resolve(a, state.newCatName) }), [state.newCatName]);

  const setCustomForm: Dispatch<SetStateAction<CustomFormState>> = useCallback(
    (a) => dispatch({ type: "SET_CUSTOM_FORM", payload: resolve(a, state.customForm) }), [state.customForm]);

  const resetCustomForm = useCallback(() => dispatch({ type: "RESET_CUSTOM_FORM" }), []);

  const setSavedConfigs: Dispatch<SetStateAction<{ id: string; name: string; updated_at: string }[]>> = useCallback(
    (a) => dispatch({ type: "SET_SAVED_CONFIGS", payload: resolve(a, state.savedConfigs) }), [state.savedConfigs]);

  const setCurrentConfigId: Dispatch<SetStateAction<string | null>> = useCallback(
    (a) => dispatch({ type: "SET_CURRENT_CONFIG_ID", payload: resolve(a, state.currentConfigId) }), [state.currentConfigId]);

  const setIsSaving: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_IS_SAVING", payload: resolve(a, state.isSaving) }), [state.isSaving]);

  const setShowLoadDialog: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_SHOW_LOAD_DIALOG", payload: resolve(a, state.showLoadDialog) }), [state.showLoadDialog]);

  const setShowClearConfirm: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_SHOW_CLEAR_CONFIRM", payload: resolve(a, state.showClearConfirm) }), [state.showClearConfirm]);

  const setPricingResult: Dispatch<SetStateAction<PricingResult | null>> = useCallback(
    (a) => dispatch({ type: "SET_PRICING_RESULT", payload: resolve(a, state.pricingResult) }), [state.pricingResult]);

  const setIsWycenLoading: Dispatch<SetStateAction<boolean>> = useCallback(
    (a) => dispatch({ type: "SET_IS_WYCEN_LOADING", payload: resolve(a, state.isWycenLoading) }), [state.isWycenLoading]);

  const setManualPrices: Dispatch<SetStateAction<Record<string, { mat: number; lab: number }>>> = useCallback(
    (a) => dispatch({ type: "SET_MANUAL_PRICES", payload: resolve(a, state.manualPrices) }), [state.manualPrices]);

  const setPricingMode: Dispatch<SetStateAction<"none" | "ai" | "manual">> = useCallback(
    (a) => dispatch({ type: "SET_PRICING_MODE", payload: resolve(a, state.pricingMode) }), [state.pricingMode]);

  const setCircuitEditCell: Dispatch<SetStateAction<{ uid: string; field: "cableType" | "label" } | null>> = useCallback(
    (a) => dispatch({ type: "SET_CIRCUIT_EDIT_CELL", payload: resolve(a, state.circuitEditCell) }), [state.circuitEditCell]);

  const setCircuitSelectedUids: Dispatch<SetStateAction<Set<string>>> = useCallback(
    (a) => dispatch({ type: "SET_CIRCUIT_SELECTED_UIDS", payload: resolve(a, state.circuitSelectedUids) }), [state.circuitSelectedUids]);

  const setFillDownCable: Dispatch<SetStateAction<string>> = useCallback(
    (a) => dispatch({ type: "SET_FILL_DOWN_CABLE", payload: resolve(a, state.fillDownCable) }), [state.fillDownCable]);

  return {
    state,
    dispatch,
    // Core
    setOpen, setSections, setActiveSectionIdx, setPanelName, setActiveTab,
    // UI
    setModuleSearch, setIsAdding, setIsExporting, setIsDownloading,
    setCollapsedCats, toggleCat,
    setDragUid, setSelectedUid, setEditingAccessoryUid,
    // AI
    setShowAiPanel, setAiDescription, setAiGenerating,
    setAiSchematTrees, setAiSchematLoading, setAiValidationNotes, setAiUsageInfo,
    setSelectedManufacturer, setCustomCoefficient,
    // Custom catalog
    setCatalogMode, setCustomModules, setCustomCats,
    setCollapsedCustomCats, toggleCustomCat,
    setShowCustomForm, setShowNewCatForm, setNewCatName,
    setCustomForm, resetCustomForm,
    // Save / pricing / circuit
    setSavedConfigs, setCurrentConfigId, setIsSaving,
    setShowLoadDialog, setShowClearConfirm,
    setPricingResult, setIsWycenLoading,
    setManualPrices, setPricingMode,
    setCircuitEditCell, setCircuitSelectedUids, setFillDownCable,
  };
}
