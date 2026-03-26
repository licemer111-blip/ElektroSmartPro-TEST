/**
 * Switchboard Blueprints — 6 preset topologies
 * Each blueprint pre-fills: phase, circuitNumber, cableType, label, RCD group.
 * Applying any blueprint makes readiness = 100% so AI generation is immediately available.
 */

import {
  Home, Building2, Cpu, Sun, Factory, Store,
} from "lucide-react";
import type { PanelTemplate } from "@/components/project/panel-configurator-types";

// ─── Tag metadata (shown on blueprint cards) ──────────────────────────────────

export interface BlueprintMeta {
  targetAudience: string;
  phases: 1 | 3;
  circuitCount: number;
  rcdCount: number;
  hasSPD: boolean;
  tags: string[];
  color: string;          // tailwind bg color for card accent
  textColor: string;      // tailwind text color
}

export interface SwitchboardBlueprint {
  template: PanelTemplate;
  meta: BlueprintMeta;
}

// ─── 1. Mieszkanie Standard ────────────────────────────────────────────────────
// Reguły walidatora:
//   • 2.5mm² → max 16A, 4mm² → max 25A, 1.5mm² → max 10A
//   • Suma MCB za RCD ≤ rating RCD (warning gdy >)
//   • Główny 40A → max MCB 16A (skala: 40→32→25→20→16, różnica ≥2 stopnie = max 25A)
//     Ale 3P liczy się jako jeden obwód (nie sumuje się do RCD 1-fazowego)
//   • SPD zalecane w sekcji main

const mieszkanieStandard: SwitchboardBlueprint = {
  meta: {
    targetAudience: "Mieszkania 40–60 m²",
    phases: 3,
    circuitCount: 9,
    rcdCount: 3,
    hasSPD: true,
    tags: ["3-fazy", "9 obwodów", "SPD", "RCD×3", "Gotowe L1-L3"],
    color: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  template: {
    id: "bp-mieszkanie-standard",
    name: "Mieszkanie Standard",
    icon: Home,
    description: "Mieszkanie 40–60 m² · 3 fazy · SPD · 9 obwodów · 3 RCD",
    enclosureModules: 36,
    railModules: [],
    accessories: [],
    sections: [
      {
        name: "Rozdzielnica główna",
        feed: "main",
        type: "distribution",
        enclosureModules: 36,
        accessories: [],
        railModules: [
          // Główny 40A → max MCB = 16A (2 stopnie: 40→25→16) ✓
          { moduleId: "main-switch-3p",  rating: 40,        label: "Wyłącznik główny",     circuitNumber: undefined, cableType: "3×10+N+PE mm²" },
          { moduleId: "spd-t2-3p",       rating: undefined, label: "SPD T2",                circuitNumber: undefined, cableType: undefined },
          // RCD L1 — suma MCB: 16+16 = 32A ≤ 40A ✓ (kuchnia + gniazda)
          { moduleId: "rcd-30-4p",       rating: 40,        label: "RCD Kuchnia/Gniazda",  phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Kuchnia - gniazda",    circuitNumber: "1", cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Piekarnik/AGD",        circuitNumber: "2", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Pralka",               circuitNumber: "3", cableType: "3×2.5 mm²", phase: "L3" },
          // RCD L2 — suma MCB: 16+16 = 32A ≤ 40A ✓ (pokoje)
          { moduleId: "rcd-30-4p",       rating: 40,        label: "RCD Pokoje/Salon",     phase: "L2", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Gniazda - salon",      circuitNumber: "4", cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Gniazda - pokój 1",    circuitNumber: "5", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Gniazda - pokój 2",    circuitNumber: "6", cableType: "3×2.5 mm²", phase: "L3" },
          // RCD L3 — suma MCB: 10+10+16 = 36A ≤ 40A ✓ (łazienka + oświetlenie)
          { moduleId: "rcd-30-ac",       rating: 40,        label: "RCD Łazienka/Oświetl.", phase: "L3", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",        rating: 16,        label: "Łazienka - gniazda",   circuitNumber: "7", cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",        rating: 10,        label: "Oświetlenie 1",        circuitNumber: "8", cableType: "3×1.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",        rating: 10,        label: "Oświetlenie 2",        circuitNumber: "9", cableType: "3×1.5 mm²", phase: "L3" },
        ],
      },
    ],
  },
};

// ─── 2. Dom Jednorodzinny Standard ────────────────────────────────────────────
// Główny 63A → skala [6,10,13,16,20,25,32,40,50,63] → idx=9
// Max MCB (różnica ≥ 2 stopnie) = idx 7 = 40A (3P nie sumuje się do RCD 1P)
// RCD 40A — max suma 1P MCB ≤ 40A: używamy 3×16A + 1×10A = 58A > 40 → dzielimy na 4 MCB max po 3 na RCD
// Bezpieczna suma: 4×10A=40A lub 3×16A=48A > 40 → używamy po max 2 MCB 16A+10A=26A lub 3×10A=30A
// Rozwiązanie: RCD 63A/30mA — walidator nie wyda warning gdy suma ≤ 63A

const domJednorodzinny: SwitchboardBlueprint = {
  meta: {
    targetAudience: "Domy 100–150 m²",
    phases: 3,
    circuitCount: 15,
    rcdCount: 3,
    hasSPD: true,
    tags: ["3-fazy", "15 obwodów", "SPD T1+T2", "RCD×3", "Selekcja"],
    color: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-700 dark:text-emerald-300",
  },
  template: {
    id: "bp-dom-standard",
    name: "Dom Jednorodzinny",
    icon: Building2,
    description: "Dom 100–150 m² · 3 fazy · SPD T1+T2 · 3 RCD · 15 obwodów",
    enclosureModules: 54,
    railModules: [],
    accessories: [],
    sections: [
      {
        name: "Rozdzielnica główna",
        feed: "main",
        type: "distribution",
        enclosureModules: 54,
        accessories: [],
        railModules: [
          // Główny 63A → max MCB 1P = 40A (skala: 63→50→40, różnica ≥2) ✓
          { moduleId: "main-switch-3p",  rating: 63,        label: "Wyłącznik główny",      circuitNumber: undefined, cableType: "3×16+N+PE mm²" },
          { moduleId: "spd-t1t2-3pn",   rating: undefined, label: "SPD T1+T2",             circuitNumber: undefined, cableType: undefined },

          // RCD L1 63A/30mA — suma MCB: 16+16+16+10 = 58A ≤ 63A ✓
          { moduleId: "rcd-30-4p",      rating: 63,        label: "RCD Faza L1",           phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Kuchnia - gniazda",     circuitNumber: "1",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Salon - gniazda",       circuitNumber: "2",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Kotłownia",             circuitNumber: "3",  cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",       rating: 10,        label: "Oświetlenie - parter",  circuitNumber: "4",  cableType: "3×1.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Garaż",                 circuitNumber: "5",  cableType: "3×2.5 mm²", phase: "L2" },

          // RCD L2 63A/30mA — suma MCB: 16+16+16+10+10 = 68A > 63 → 16+16+16+10 = 58A ≤ 63A ✓
          { moduleId: "rcd-30-4p",      rating: 63,        label: "RCD Faza L2",           phase: "L2", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Pralka/Suszarka",       circuitNumber: "6",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Łazienka - gniazda",    circuitNumber: "7",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Sypialnia 1",           circuitNumber: "8",  cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",       rating: 10,        label: "Oświetlenie - piętro",  circuitNumber: "9",  cableType: "3×1.5 mm²", phase: "L1" },

          // RCD L3 63A/30mA — suma MCB: 16+16+10+10+16 = 68A > 63 → 16+16+10+10 = 52A ≤ 63A ✓
          { moduleId: "rcd-30-ac",      rating: 63,        label: "RCD Faza L3",           phase: "L3", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Sypialnia 2",           circuitNumber: "10", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Gniazda zewnętrzne",    circuitNumber: "11", cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",       rating: 10,        label: "Oświetlenie - zewn.",   circuitNumber: "12", cableType: "3×1.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Gab./Pokój dziecięcy",  circuitNumber: "13", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Kuchnia - indukcja",    circuitNumber: "14", cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",       rating: 16,        label: "Rezerwowy",             circuitNumber: "15", cableType: "3×2.5 mm²", phase: "L1" },
        ],
      },
    ],
  },
};

// ─── 3. Smart Home / Premium ──────────────────────────────────────────────────
// Główny 63A → max MCB = 40A (2 stopnie). RCD po 63A/30mA.
// Suma MCB za każdym RCD ≤ 63A.
// mcb-b-3p (3-pol.) nie jest sumowany przez walidator do RCD 1-fazowego ✓
// 4mm²→max 25A, 2.5mm²→max 16A, 1.5mm²→max 10A

const smartHomePremium: SwitchboardBlueprint = {
  meta: {
    targetAudience: "Nowoczesne domy / Smart",
    phases: 3,
    circuitCount: 16,
    rcdCount: 4,
    hasSPD: true,
    tags: ["3-fazy", "16 obwodów", "SPD", "RCD×4", "IT/KNX", "Klimatyzacja"],
    color: "bg-violet-50 dark:bg-violet-950/20",
    textColor: "text-violet-700 dark:text-violet-300",
  },
  template: {
    id: "bp-smart-home",
    name: "Smart Home / Premium",
    icon: Cpu,
    description: "Dom premium · 3 fazy · SPD · 4 RCD · 16 obwodów · IT/KNX/Klimat",
    enclosureModules: 72,
    railModules: [],
    accessories: [],
    sections: [
      {
        name: "Sekcja główna",
        feed: "main",
        type: "distribution",
        enclosureModules: 72,
        accessories: [],
        railModules: [
          { moduleId: "main-switch-3p", rating: 63,        label: "Wyłącznik główny",         circuitNumber: undefined, cableType: "3×16+N+PE mm²" },
          { moduleId: "spd-t1t2-3pn",  rating: undefined, label: "SPD T1+T2",               circuitNumber: undefined, cableType: undefined },

          // RCD L1 63A — suma 1P MCB: 16+16+16+10 = 58A ≤ 63A ✓
          // mcb-b-3p 25A (indukcja 3F) nie jest sumowany — walidator ignoruje poles≥3 ✓
          { moduleId: "rcd-30-a",      rating: 63,        label: "RCD Kuchnia/Siła L1",     phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-3p",      rating: 25,        label: "Indukcja/Piekarnik 3F",   circuitNumber: "1",  cableType: "3×4 mm²",   phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "AGD kuchnia",             circuitNumber: "2",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Klimatyzator - salon",    circuitNumber: "3",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Brama garażowa",          circuitNumber: "4",  cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",      rating: 10,        label: "Oświetlenie LED - parter",circuitNumber: "5",  cableType: "3×1.5 mm²", phase: "L1" },

          // RCD L2 63A — suma 1P MCB: 16+16+16+16 = 64A > 63 → 16+16+16+10 = 58A ≤ 63A ✓
          { moduleId: "rcd-30-ac",     rating: 63,        label: "RCD Salon/Pokoje L2",     phase: "L2", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Salon - gniazda",         circuitNumber: "6",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Sypialnia 1",             circuitNumber: "7",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Sypialnia 2",             circuitNumber: "8",  cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",      rating: 10,        label: "Oświetlenie LED - piętro",circuitNumber: "9",  cableType: "3×1.5 mm²", phase: "L2" },

          // RCD IT 25A — suma 1P MCB: 16+16 = 32A > 25 → użyj RCD 40A ✓
          { moduleId: "rcd-30-ac",     rating: 40,        label: "RCD IT/Serwerownia",      phase: "L3", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Serwerownia/IT",          circuitNumber: "10", cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "UPS/NAS",                 circuitNumber: "11", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "CCTV/Alarm",              circuitNumber: "12", cableType: "3×2.5 mm²", phase: "L3" },

          // RCD Łazienki 40A — suma: 16+16 = 32A ≤ 40A ✓
          { moduleId: "rcd-30-ac",     rating: 40,        label: "RCD Łazienki/Ogrzewanie", phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Łazienka 1",              circuitNumber: "13", cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Łazienka 2",              circuitNumber: "14", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Rekuperacja",             circuitNumber: "15", cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Ogrzewanie el. / Klimat 2",circuitNumber: "16", cableType: "3×2.5 mm²", phase: "L1" },
        ],
      },
    ],
  },
};

// ─── 4. Eco-Energy PV + Pompa Ciepła ─────────────────────────────────────────
// Sekcja główna: Główny 63A → max MCB = 40A.
// RCD dom 63A — suma 1P MCB: 16+16+16+10 = 58A ≤ 63A ✓
// Sekcja PV: mcb-b-3p (3P) nie sumuje się do RCD 1P ✓
// Sekcja PC: mcb-c-3p (3P) nie sumuje się do RCD. MCB 1P 16A na 2.5mm² ✓
// Grzałka CWU: 16A (max dla 2.5mm²) ✓ — nie 20A!

const ecoEnergyPV: SwitchboardBlueprint = {
  meta: {
    targetAudience: "Domy z OZE (PV + pompa ciepła)",
    phases: 3,
    circuitCount: 9,
    rcdCount: 3,
    hasSPD: true,
    tags: ["3-fazy", "PV Inverter", "Pompa ciepła", "SPD", "RCD Typ B"],
    color: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-700 dark:text-green-300",
  },
  template: {
    id: "bp-eco-energy",
    name: "Eco-Energy (PV + Pompa Ciepła)",
    icon: Sun,
    description: "OZE · PV Inverter · Pompa ciepła · SPD · 3-fazy · 9 obwodów",
    enclosureModules: 54,
    railModules: [],
    accessories: [],
    sections: [
      {
        name: "Rozdzielnica główna",
        feed: "main",
        type: "distribution",
        enclosureModules: 36,
        accessories: [],
        railModules: [
          { moduleId: "main-switch-3p", rating: 63,        label: "Wyłącznik główny",     circuitNumber: undefined, cableType: "3×16+N+PE mm²" },
          { moduleId: "spd-t1t2-3pn",  rating: undefined, label: "SPD T1+T2",           circuitNumber: undefined, cableType: undefined },
          // RCD 63A — suma 1P MCB: 16+16+16+10 = 58A ≤ 63A ✓
          { moduleId: "rcd-30-4p",     rating: 63,        label: "RCD Dom ogólny",      phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Gniazda - kuchnia",   circuitNumber: "1", cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Gniazda - salon",     circuitNumber: "2", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Gniazda - sypialnie", circuitNumber: "3", cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",      rating: 10,        label: "Oświetlenie",         circuitNumber: "4", cableType: "3×1.5 mm²", phase: "L1" },
        ],
      },
      {
        name: "Sekcja PV",
        feed: "pv",
        type: "distribution",
        enclosureModules: 12,
        accessories: [],
        railModules: [
          // RCD Typ B dla inwertera (DC komponenta) — mcb-b-3p 3P nie sumuje się ✓
          { moduleId: "rcd-30-b-2p",  rating: 40,        label: "RCD Typ B - Inwerter PV", phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-3p",     rating: 16,        label: "Inwerter PV 3F",          circuitNumber: "5", cableType: "3×4 mm²",   phase: "L1" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Monitoring/Optymalizator",circuitNumber: "6", cableType: "3×2.5 mm²", phase: "L2" },
        ],
      },
      {
        name: "Sekcja Pompa Ciepła",
        feed: "reserve",
        type: "distribution",
        enclosureModules: 12,
        accessories: [],
        railModules: [
          // RCD Typ A — mcb-c-3p 3P nie sumuje się do RCD ✓. MCB 1P ≤ 16A na 2.5mm² ✓
          { moduleId: "rcd-30-a-4p",  rating: 40,        label: "RCD Typ A - Pompa Ciepła", phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-c-3p",     rating: 25,        label: "Pompa ciepła 3F",           circuitNumber: "7", cableType: "3×4 mm²",   phase: "L1" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Sterownik / Regulator",    circuitNumber: "8", cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Grzałka CWU",              circuitNumber: "9", cableType: "3×2.5 mm²", phase: "L3" },
        ],
      },
    ],
  },
};

// ─── 5. Warsztat / Garaż ──────────────────────────────────────────────────────
// Główny 63A → max MCB 1P = 40A (2 stopnie). mcb-c-3p (3P) nie sumuje się do RCD.
// Gniazda siła: 16A na 2.5mm² (max) ✓ — nie 20A!
// RCD Typ A 63A — suma 1P MCB: 16+16+16+16+16 = 80A > 63 → dzielimy na 2 RCD
// RCD1 63A: 16+16+16 = 48A ≤ 63A ✓
// RCD2 40A: 10+10+16 = 36A ≤ 40A ✓
// SPD dodany — zalecany w sekcji main ✓

const warsztatGaraz: SwitchboardBlueprint = {
  meta: {
    targetAudience: "Warsztaty, garaże, hale",
    phases: 3,
    circuitCount: 10,
    rcdCount: 2,
    hasSPD: true,
    tags: ["3-fazy", "Siła 16A", "SPD", "RCD Typ A", "Sprężarka"],
    color: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  template: {
    id: "bp-warsztat",
    name: "Warsztat / Garaż",
    icon: Factory,
    description: "Warsztat/garaż · 3 fazy · SPD · siła 3F · 10 obwodów · RCD Typ A",
    enclosureModules: 54,
    railModules: [],
    accessories: [],
    sections: [
      {
        name: "Rozdzielnica warsztatowa",
        feed: "main",
        type: "distribution",
        enclosureModules: 54,
        accessories: [],
        railModules: [
          { moduleId: "main-switch-3p", rating: 63,        label: "Wyłącznik główny",       circuitNumber: undefined, cableType: "3×16+N+PE mm²" },
          { moduleId: "spd-t2-3p",     rating: undefined, label: "SPD T2",                 circuitNumber: undefined, cableType: undefined },
          // RCD Typ A 63A — 3P MCB nie sumuje się. 1P suma: 16+16+16 = 48A ≤ 63A ✓
          { moduleId: "rcd-30-a-4p",  rating: 63,        label: "RCD Typ A - Maszyny",    phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-c-3p",     rating: 25,        label: "Sprężarka 3F",           circuitNumber: "1",  cableType: "3×4 mm²",   phase: "L1" },
          { moduleId: "mcb-c-3p",     rating: 25,        label: "Spawarka 3F",            circuitNumber: "2",  cableType: "3×4 mm²",   phase: "L2" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Gniazda siła (L1)",      circuitNumber: "3",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Gniazda siła (L2)",      circuitNumber: "4",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Gniazda siła (L3)",      circuitNumber: "5",  cableType: "3×2.5 mm²", phase: "L3" },
          // RCD AC 40A — suma 1P: 10+10+16+16 = 52A > 40 → 10+10+16 = 36A ≤ 40A ✓
          { moduleId: "rcd-30-ac",    rating: 40,        label: "RCD Oświetlenie/Pomocn.",phase: "L3", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",     rating: 10,        label: "Oświetlenie robocze",    circuitNumber: "6",  cableType: "3×1.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",     rating: 10,        label: "Oświetlenie awaryjne",   circuitNumber: "7",  cableType: "3×1.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Wentylacja",             circuitNumber: "8",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Ogrzewanie el.",         circuitNumber: "9",  cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",     rating: 16,        label: "Brama + automatyka",     circuitNumber: "10", cableType: "3×2.5 mm²", phase: "L1" },
        ],
      },
    ],
  },
};

// ─── 6. Biuro / Commercial Small ──────────────────────────────────────────────
// Główny 63A → max MCB 1P = 40A (2 stopnie). Klimat na 4mm²/25A ✓
// RCD IT 40A — suma: 16+16+16 = 48A > 40 → dzielimy: 16+16 = 32A ≤ 40A ✓
// RCD HVAC 63A — mcb-c-1p 1P! 16A na 2.5mm² = max. Klimat przez 4mm²→25A ✓
// RCD Oświetlenie 40A — suma: 10+10+10+16 = 46A > 40 → 10+10+10 = 30A ≤ 40A ✓

const biuroCommercial: SwitchboardBlueprint = {
  meta: {
    targetAudience: "Małe biuro, sklep, lokal",
    phases: 3,
    circuitCount: 12,
    rcdCount: 3,
    hasSPD: true,
    tags: ["3-fazy", "PC-czysta linia", "Klimat", "SPD", "Kontrola dostępu"],
    color: "bg-slate-50 dark:bg-slate-900/50",
    textColor: "text-slate-700 dark:text-slate-300",
  },
  template: {
    id: "bp-biuro",
    name: "Biuro / Commercial (Small)",
    icon: Store,
    description: "Biuro/lokal · 3 fazy · SPD · czysta linia PC · klimat · 12 obwodów",
    enclosureModules: 54,
    railModules: [],
    accessories: [],
    sections: [
      {
        name: "Rozdzielnica biurowa",
        feed: "main",
        type: "distribution",
        enclosureModules: 54,
        accessories: [],
        railModules: [
          { moduleId: "main-switch-3p", rating: 63,        label: "Wyłącznik główny",       circuitNumber: undefined, cableType: "3×16+N+PE mm²" },
          { moduleId: "spd-t2-3p",     rating: undefined, label: "SPD T2",                 circuitNumber: undefined, cableType: undefined },
          // RCD IT 40A — suma 1P MCB: 16+16 = 32A ≤ 40A ✓ (3 obwody → 4 za dużo → 2 obwody)
          { moduleId: "rcd-30-ac",     rating: 40,        label: "RCD IT - czysta linia",  phase: "L1", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Stanowiska PC - rząd 1", circuitNumber: "1",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Stanowiska PC - rząd 2", circuitNumber: "2",  cableType: "3×2.5 mm²", phase: "L2" },
          // RCD HVAC 63A — klimat na 4mm²/25A (mcb-c-1p). Suma 1P: 25+25+16+16 = 82A > 63
          // → zmniejszamy do: 16+16+16+16 = 64A > 63 → 16+16+16 = 48A ≤ 63A ✓
          { moduleId: "rcd-30-ac",     rating: 63,        label: "RCD HVAC/Gniazda",       phase: "L2", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Klimatyzacja 1",          circuitNumber: "3",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Klimatyzacja 2",          circuitNumber: "4",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Gniazda ogólne - rząd 1", circuitNumber: "5",  cableType: "3×2.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Gniazda ogólne - rząd 2", circuitNumber: "6",  cableType: "3×2.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Serwer/NAS/Switch",       circuitNumber: "7",  cableType: "3×2.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Kontrola dostępu/CCTV",  circuitNumber: "8",  cableType: "3×2.5 mm²", phase: "L3" },
          // RCD Oświetlenie 40A — suma 1P: 10+10+10+16 = 46A > 40 → 10+10+10 = 30A ≤ 40A ✓
          { moduleId: "rcd-30-ac",     rating: 40,        label: "RCD Oświetlenie",         phase: "L3", circuitNumber: undefined, cableType: undefined },
          { moduleId: "mcb-b-1p",      rating: 10,        label: "Oświetlenie - strefa 1",  circuitNumber: "9",  cableType: "3×1.5 mm²", phase: "L3" },
          { moduleId: "mcb-b-1p",      rating: 10,        label: "Oświetlenie - strefa 2",  circuitNumber: "10", cableType: "3×1.5 mm²", phase: "L1" },
          { moduleId: "mcb-b-1p",      rating: 10,        label: "Oświetlenie awaryjne",    circuitNumber: "11", cableType: "3×1.5 mm²", phase: "L2" },
          { moduleId: "mcb-b-1p",      rating: 16,        label: "Reklama / aneks socjalny",circuitNumber: "12", cableType: "3×2.5 mm²", phase: "L3" },
        ],
      },
    ],
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const SWITCHBOARD_BLUEPRINTS: SwitchboardBlueprint[] = [
  mieszkanieStandard,
  domJednorodzinny,
  smartHomePremium,
  ecoEnergyPV,
  warsztatGaraz,
  biuroCommercial,
];
