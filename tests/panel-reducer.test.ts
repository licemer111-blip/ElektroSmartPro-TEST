/**
 * Panel Reducer Tests — ElektroSmart PRO
 *
 * Tests for panelReducer() and createInitialPanelState()
 * from rozdzielnica/usePanelReducer.ts
 */
import { describe, it, expect } from "vitest";
import { panelReducer, createInitialPanelState, type PanelState } from "@/components/project/rozdzielnica/usePanelReducer";
import type { PanelSection } from "@/components/project/panel-configurator-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mkSection(name = "Sekcja 1"): PanelSection {
  return {
    id: "sec-1",
    name,
    feed: "main",
    type: "distribution",
    modules: [],
    accessories: [],
    enclosure: { modules: 24, rows: 1, name: "24-modułowa", price: 0, laborPrice: 0 },
  };
}

function initialState(asPage = false): PanelState {
  return createInitialPanelState(asPage, [mkSection()]);
}

// ─── createInitialPanelState ──────────────────────────────────────────────────

describe("createInitialPanelState", () => {
  it("sets open=false when asPage=false", () => {
    expect(initialState(false).open).toBe(false);
  });

  it("sets open=true when asPage=true", () => {
    expect(initialState(true).open).toBe(true);
  });

  it("initializes with provided sections", () => {
    const state = createInitialPanelState(false, [mkSection("Główna"), mkSection("Piętrowa")]);
    expect(state.sections).toHaveLength(2);
    expect(state.sections[0].name).toBe("Główna");
  });

  it("starts on build tab", () => {
    expect(initialState().activeTab).toBe("build");
  });

  it("starts with no selection", () => {
    const s = initialState();
    expect(s.selectedUid).toBeNull();
    expect(s.dragUid).toBeNull();
    expect(s.editingAccessoryUid).toBeNull();
  });

  it("starts with all categories collapsed", () => {
    const s = initialState();
    expect(s.collapsedCats.size).toBeGreaterThan(0);
  });

  it("starts with default manufacturer (index 0)", () => {
    const s = initialState();
    expect(s.selectedManufacturer).toBeDefined();
    expect(s.customCoefficient).toBe(1.0);
  });

  it("starts with pricing mode none", () => {
    expect(initialState().pricingMode).toBe("none");
  });

  it("starts with empty manual prices", () => {
    expect(Object.keys(initialState().manualPrices)).toHaveLength(0);
  });
});

// ─── Core actions ─────────────────────────────────────────────────────────────

describe("panelReducer — core actions", () => {
  it("SET_OPEN toggles open state", () => {
    const s = panelReducer(initialState(false), { type: "SET_OPEN", payload: true });
    expect(s.open).toBe(true);
  });

  it("SET_SECTIONS replaces sections", () => {
    const newSections = [mkSection("Nowa"), mkSection("Dodatkowa")];
    const s = panelReducer(initialState(), { type: "SET_SECTIONS", payload: newSections });
    expect(s.sections).toHaveLength(2);
    expect(s.sections[0].name).toBe("Nowa");
  });

  it("SET_ACTIVE_SECTION_IDX changes active section", () => {
    const s = panelReducer(initialState(), { type: "SET_ACTIVE_SECTION_IDX", payload: 2 });
    expect(s.activeSectionIdx).toBe(2);
  });

  it("SET_PANEL_NAME updates name", () => {
    const s = panelReducer(initialState(), { type: "SET_PANEL_NAME", payload: "Rozdzielnica główna" });
    expect(s.panelName).toBe("Rozdzielnica główna");
  });

  it("SET_ACTIVE_TAB switches tab", () => {
    const s = panelReducer(initialState(), { type: "SET_ACTIVE_TAB", payload: "schemat" });
    expect(s.activeTab).toBe("schemat");
  });
});

// ─── UI interaction actions ───────────────────────────────────────────────────

describe("panelReducer — UI interaction", () => {
  it("SET_MODULE_SEARCH updates search query", () => {
    const s = panelReducer(initialState(), { type: "SET_MODULE_SEARCH", payload: "wyłącznik" });
    expect(s.moduleSearch).toBe("wyłącznik");
  });

  it("SET_IS_ADDING sets loading flag", () => {
    const s = panelReducer(initialState(), { type: "SET_IS_ADDING", payload: true });
    expect(s.isAdding).toBe(true);
  });

  it("SET_DRAG_UID sets dragged module uid", () => {
    const s = panelReducer(initialState(), { type: "SET_DRAG_UID", payload: "uid-abc" });
    expect(s.dragUid).toBe("uid-abc");
  });

  it("SET_DRAG_UID null clears drag", () => {
    let s = panelReducer(initialState(), { type: "SET_DRAG_UID", payload: "uid-abc" });
    s = panelReducer(s, { type: "SET_DRAG_UID", payload: null });
    expect(s.dragUid).toBeNull();
  });

  it("SET_SELECTED_UID selects a module", () => {
    const s = panelReducer(initialState(), { type: "SET_SELECTED_UID", payload: "uid-xyz" });
    expect(s.selectedUid).toBe("uid-xyz");
  });

  it("SET_EDITING_ACCESSORY_UID sets editing uid", () => {
    const s = panelReducer(initialState(), { type: "SET_EDITING_ACCESSORY_UID", payload: "acc-1" });
    expect(s.editingAccessoryUid).toBe("acc-1");
  });

  it("TOGGLE_CAT adds category to collapsed set", () => {
    const s0 = { ...initialState(), collapsedCats: new Set<string>() };
    const s = panelReducer(s0, { type: "TOGGLE_CAT", payload: "breaker" });
    expect(s.collapsedCats.has("breaker")).toBe(true);
  });

  it("TOGGLE_CAT removes already-collapsed category", () => {
    const s0 = { ...initialState(), collapsedCats: new Set(["breaker", "rcd"]) };
    const s = panelReducer(s0, { type: "TOGGLE_CAT", payload: "breaker" });
    expect(s.collapsedCats.has("breaker")).toBe(false);
    expect(s.collapsedCats.has("rcd")).toBe(true);
  });

  it("TOGGLE_CAT is idempotent on double-toggle", () => {
    const s0 = { ...initialState(), collapsedCats: new Set<string>() };
    let s = panelReducer(s0, { type: "TOGGLE_CAT", payload: "breaker" });
    s = panelReducer(s, { type: "TOGGLE_CAT", payload: "breaker" });
    expect(s.collapsedCats.has("breaker")).toBe(false);
  });
});

// ─── AI actions ───────────────────────────────────────────────────────────────

describe("panelReducer — AI state", () => {
  it("SET_SHOW_AI_PANEL opens AI panel", () => {
    const s = panelReducer(initialState(), { type: "SET_SHOW_AI_PANEL", payload: true });
    expect(s.showAiPanel).toBe(true);
  });

  it("SET_AI_DESCRIPTION updates description", () => {
    const s = panelReducer(initialState(), { type: "SET_AI_DESCRIPTION", payload: "Mieszkanie 3 pokoje" });
    expect(s.aiDescription).toBe("Mieszkanie 3 pokoje");
  });

  it("SET_AI_GENERATING sets loading flag", () => {
    const s = panelReducer(initialState(), { type: "SET_AI_GENERATING", payload: true });
    expect(s.aiGenerating).toBe(true);
  });

  it("SET_AI_USAGE_INFO stores usage data", () => {
    const info = { used: 2, limit: 3, isPro: false };
    const s = panelReducer(initialState(), { type: "SET_AI_USAGE_INFO", payload: info });
    expect(s.aiUsageInfo).toEqual(info);
  });

  it("SET_AI_USAGE_INFO null clears usage", () => {
    let s = panelReducer(initialState(), { type: "SET_AI_USAGE_INFO", payload: { used: 1, limit: 3, isPro: false } });
    s = panelReducer(s, { type: "SET_AI_USAGE_INFO", payload: null });
    expect(s.aiUsageInfo).toBeNull();
  });

  it("SET_CUSTOM_COEFFICIENT updates manufacturer coefficient", () => {
    const s = panelReducer(initialState(), { type: "SET_CUSTOM_COEFFICIENT", payload: 1.15 });
    expect(s.customCoefficient).toBe(1.15);
  });
});

// ─── Custom catalog actions ───────────────────────────────────────────────────

describe("panelReducer — custom catalog", () => {
  it("SET_CATALOG_MODE switches to custom", () => {
    const s = panelReducer(initialState(), { type: "SET_CATALOG_MODE", payload: "custom" });
    expect(s.catalogMode).toBe("custom");
  });

  it("SET_SHOW_CUSTOM_FORM opens form", () => {
    const s = panelReducer(initialState(), { type: "SET_SHOW_CUSTOM_FORM", payload: true });
    expect(s.showCustomForm).toBe(true);
  });

  it("SET_CUSTOM_FORM merges partial update", () => {
    const s = panelReducer(initialState(), { type: "SET_CUSTOM_FORM", payload: { namePl: "Mój moduł", defaultPrice: 99 } });
    expect(s.customForm.namePl).toBe("Mój moduł");
    expect(s.customForm.defaultPrice).toBe(99);
    expect(s.customForm.modules).toBe(1); // unchanged
  });

  it("RESET_CUSTOM_FORM clears all fields", () => {
    let s = panelReducer(initialState(), { type: "SET_CUSTOM_FORM", payload: { namePl: "Test", defaultPrice: 50 } });
    s = panelReducer(s, { type: "RESET_CUSTOM_FORM" });
    expect(s.customForm.namePl).toBe("");
    expect(s.customForm.defaultPrice).toBe(0);
  });

  it("TOGGLE_CUSTOM_CAT adds to collapsed set", () => {
    const s = panelReducer(initialState(), { type: "TOGGLE_CUSTOM_CAT", payload: "moja-kategoria" });
    expect(s.collapsedCustomCats.has("moja-kategoria")).toBe(true);
  });

  it("TOGGLE_CUSTOM_CAT removes from collapsed set", () => {
    const s0 = { ...initialState(), collapsedCustomCats: new Set(["moja-kategoria"]) };
    const s = panelReducer(s0, { type: "TOGGLE_CUSTOM_CAT", payload: "moja-kategoria" });
    expect(s.collapsedCustomCats.has("moja-kategoria")).toBe(false);
  });
});

// ─── Save / pricing / circuit actions ────────────────────────────────────────

describe("panelReducer — save / pricing / circuit", () => {
  it("SET_IS_SAVING sets saving flag", () => {
    const s = panelReducer(initialState(), { type: "SET_IS_SAVING", payload: true });
    expect(s.isSaving).toBe(true);
  });

  it("SET_CURRENT_CONFIG_ID stores config id", () => {
    const s = panelReducer(initialState(), { type: "SET_CURRENT_CONFIG_ID", payload: "cfg-123" });
    expect(s.currentConfigId).toBe("cfg-123");
  });

  it("SET_PRICING_MODE switches to ai", () => {
    const s = panelReducer(initialState(), { type: "SET_PRICING_MODE", payload: "ai" });
    expect(s.pricingMode).toBe("ai");
  });

  it("SET_PRICING_MODE switches to manual", () => {
    const s = panelReducer(initialState(), { type: "SET_PRICING_MODE", payload: "manual" });
    expect(s.pricingMode).toBe("manual");
  });

  it("SET_MANUAL_PRICES stores price overrides", () => {
    const prices = { "0-uid-abc": { mat: 50, lab: 25 } };
    const s = panelReducer(initialState(), { type: "SET_MANUAL_PRICES", payload: prices });
    expect(s.manualPrices["0-uid-abc"]).toEqual({ mat: 50, lab: 25 });
  });

  it("SET_CIRCUIT_EDIT_CELL sets editing cell", () => {
    const cell = { uid: "uid-1", field: "cableType" as const };
    const s = panelReducer(initialState(), { type: "SET_CIRCUIT_EDIT_CELL", payload: cell });
    expect(s.circuitEditCell).toEqual(cell);
  });

  it("SET_CIRCUIT_EDIT_CELL null clears editing", () => {
    let s = panelReducer(initialState(), { type: "SET_CIRCUIT_EDIT_CELL", payload: { uid: "uid-1", field: "label" } });
    s = panelReducer(s, { type: "SET_CIRCUIT_EDIT_CELL", payload: null });
    expect(s.circuitEditCell).toBeNull();
  });

  it("SET_SHOW_CLEAR_CONFIRM opens confirm dialog", () => {
    const s = panelReducer(initialState(), { type: "SET_SHOW_CLEAR_CONFIRM", payload: true });
    expect(s.showClearConfirm).toBe(true);
  });

  it("SET_FILL_DOWN_CABLE stores cable type", () => {
    const s = panelReducer(initialState(), { type: "SET_FILL_DOWN_CABLE", payload: "YDYp 3×2.5" });
    expect(s.fillDownCable).toBe("YDYp 3×2.5");
  });

  it("SET_SAVED_CONFIGS stores config list", () => {
    const configs = [{ id: "c1", name: "Konfiguracja 1", updated_at: "2026-01-01" }];
    const s = panelReducer(initialState(), { type: "SET_SAVED_CONFIGS", payload: configs });
    expect(s.savedConfigs).toHaveLength(1);
    expect(s.savedConfigs[0].name).toBe("Konfiguracja 1");
  });
});

// ─── Immutability ─────────────────────────────────────────────────────────────

describe("panelReducer — immutability", () => {
  it("does not mutate original state", () => {
    const original = initialState();
    const originalSections = original.sections;
    panelReducer(original, { type: "SET_PANEL_NAME", payload: "Nowa nazwa" });
    expect(original.panelName).toBe("");
    expect(original.sections).toBe(originalSections);
  });

  it("returns same reference for unknown action (no-op)", () => {
    const s = initialState();
    // @ts-expect-error — testing unknown action
    const result = panelReducer(s, { type: "UNKNOWN_ACTION" });
    expect(result).toBe(s);
  });

  it("TOGGLE_CAT creates new Set (does not mutate)", () => {
    const s = initialState();
    const originalSet = s.collapsedCats;
    const next = panelReducer(s, { type: "TOGGLE_CAT", payload: "breaker" });
    expect(next.collapsedCats).not.toBe(originalSet);
  });
});
