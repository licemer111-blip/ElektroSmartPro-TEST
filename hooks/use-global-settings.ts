"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VatMode = 8 | 23;
export type PriceDisplay = "netto" | "brutto";
export type PriceInputMode = "base" | "with_narzuty";

export interface PdfStructureOptions {
  showCoverPage: boolean;      // Pierwsza strona tytułowa
  showCompanyHeader: boolean;  // Nagłówek z danymi firmy
  showProjectMeta: boolean;    // Blok metadanych projektu
  showSectionGroups: boolean;  // Grupowanie po sekcjach
  showSummaryBlock: boolean;   // Blok podsumowania na końcu
  showLegend: boolean;         // Legenda kolorów
}

interface GlobalSettingsState {
  vatMode: VatMode;
  priceDisplay: PriceDisplay;
  demoMode: boolean;
  priceInputMode: PriceInputMode;
  showHints: boolean;
  pdfStructure: PdfStructureOptions;
  setVatMode: (mode: VatMode) => void;
  setPriceDisplay: (display: PriceDisplay) => void;
  setDemoMode: (enabled: boolean) => void;
  setPriceInputMode: (mode: PriceInputMode) => void;
  setShowHints: (enabled: boolean) => void;
  setPdfStructure: (options: Partial<PdfStructureOptions>) => void;
}

export const useGlobalSettings = create<GlobalSettingsState>()(
  persist(
    (set) => ({
      vatMode: 23,
      priceDisplay: "netto",
      demoMode: false,
      priceInputMode: "base",
      showHints: true,
      pdfStructure: {
        showCoverPage: false,
        showCompanyHeader: true,
        showProjectMeta: true,
        showSectionGroups: true,
        showSummaryBlock: true,
        showLegend: true,
      },
      setVatMode: (mode) => set({ vatMode: mode }),
      setPriceDisplay: (display) => set({ priceDisplay: display }),
      setDemoMode: (enabled) => set({ demoMode: enabled }),
      setPriceInputMode: (mode) => set({ priceInputMode: mode }),
      setShowHints: (enabled) => set({ showHints: enabled }),
      setPdfStructure: (options) => set((state) => ({
        pdfStructure: { ...state.pdfStructure, ...options },
      })),
    }),
    {
      name: "elektrosmart-global-settings",
    }
  )
);

/**
 * Deterministic rounding to 2 decimal places.
 * Uses integer arithmetic to avoid IEEE-754 drift (e.g. 1.005 → 1.01 correctly).
 * This is the SINGLE source of truth used by both client tables and PDF server.
 */
export function roundPrice(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Helper: apply VAT multiplier to a netto price, rounded to 2 decimals.
 */
export function applyVat(nettoPrice: number, vatMode: VatMode): number {
  return roundPrice(nettoPrice * (1 + vatMode / 100));
}

/**
 * Helper: format price according to current display mode.
 * Returns netto or brutto value (rounded to 2 decimals) depending on priceDisplay setting.
 */
export function formatDisplayPrice(
  nettoPrice: number,
  vatMode: VatMode,
  priceDisplay: PriceDisplay
): number {
  if (priceDisplay === "brutto") {
    return applyVat(nettoPrice, vatMode);
  }
  return roundPrice(nettoPrice);
}
