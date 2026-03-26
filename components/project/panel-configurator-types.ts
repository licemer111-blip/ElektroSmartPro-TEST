// =============================================
// PANEL CONFIGURATOR — TYPES & INTERFACES
// =============================================
// Extracted from panel-configurator.tsx for maintainability.
// Import these types in panel-configurator.tsx and sub-components.

import type {
  Zap,
} from "lucide-react";

// ─── Pricing mode ────────────────────────────────────────────────────────────
export type PricingMode = "none" | "manual" | "ai";

// ─── DIN Module catalog entry ───────────────────────────────────────────────
export interface DinModule {
  id: string;
  name: string;
  namePl: string;
  category: "breaker" | "rcd" | "rcbo" | "contactor" | "motor_control" | "timer" | "spd" | "switch" | "enclosure" | "monitoring" | "wiring" | "labor" | "automation" | "compensation" | "terminal" | "consumable";
  modules: number; // DIN module width
  icon: typeof Zap;
  defaultRating?: number;
  defaultPrice: number; // Material price
  defaultLaborPrice: number;
  ratingOptions?: number[];
  description: string;
}

// ─── Placed module on DIN rail ───────────────────────────────────────────────
export interface RailModule {
  uid: string;
  module: DinModule;
  rating?: number;
  label?: string;
  customName?: string;
  circuitNumber?: string;
  cableType?: string;
  parentRcdUid?: string;
  customMaterialPrice?: number;
  customLaborPrice?: number;
  quantity?: number;
  phase?: "L1" | "L2" | "L3";
  isZugBlock?: boolean;
  terminalCount?: number;
  knrCode?: string;
  laborRate?: number;
}

// ─── Visual-only wrapper for rendering ──────────────────────────────────────
export interface VisualModule {
  source: RailModule;
  visualWidth: number;
  isFragment: boolean;
  fragmentIndex?: number;
  fragmentTotal?: number;
  fragmentTerminalCount?: number;
}

// ─── Validation ─────────────────────────────────────────────────────────────
export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  moduleUids: string[];
}

// ─── Section types ───────────────────────────────────────────────────────────
export type SectionFeed = "main" | "reserve" | "ups" | "pv" | "generator";
export type SectionType = "distribution" | "ats" | "metering" | "compensation" | "automation" | "motor";

export interface PanelSection {
  id: string;
  name: string;
  feed: SectionFeed;
  type: SectionType;
  enclosure: {
    modules: number;
    rows: number;
    name: string;
    price: number;
    laborPrice: number;
  };
  modules: RailModule[];
  accessories: RailModule[];
}

// ─── Manufacturer ────────────────────────────────────────────────────────────
export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  coefficient: number;
  description: string;
}

// ─── Template types ──────────────────────────────────────────────────────────
export interface TemplateRailModule {
  moduleId: string;
  rating?: number;
  label?: string;
  circuitNumber?: string;
  cableType?: string;
  phase?: "L1" | "L2" | "L3";
  parentRcdUid?: string;
  isZugBlock?: boolean;
  terminalCount?: number;
  knrCode?: string;
  laborRate?: number;
}

export interface TemplateAccessory {
  moduleId: string;
  quantity: number;
}

export interface PanelTemplateSection {
  name: string;
  feed: SectionFeed;
  type: SectionType;
  enclosureModules: number;
  railModules: TemplateRailModule[];
  accessories: TemplateAccessory[];
}

export interface PanelTemplate {
  id: string;
  name: string;
  icon: typeof Zap;
  description: string;
  enclosureModules: number;
  railModules: TemplateRailModule[];
  accessories: TemplateAccessory[];
  sections?: PanelTemplateSection[];
  isHidden?: boolean;
  isCustom?: boolean;
}

// ─── Main component props ────────────────────────────────────────────────────
export interface PanelConfiguratorProps {
  projectId: string;
  isPro?: boolean;
  projectStatus?: string;
  regionModifier?: number;
  userId?: string;
  userProfile?: {
    full_name?: string;
    company_name?: string;
    nip?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
  };
  asPage?: boolean;
  isReadOnly?: boolean;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

// ─── Ghost module preview data ──────────────────────────────────────────────
export interface GhostModuleData {
  name: string;
  width: number;
}

// ─── Selected slot (for slot-based placement) ────────────────────────────────
export interface SelectedSlot {
  rowIdx: number;
  slotIdx: number;
}

// ─── DinRailRow props ────────────────────────────────────────────────────────
export interface DinRailRowProps {
  rowIndex: number;
  modules: VisualModule[];
  modulesPerRow: number;
  onRemove: (uid: string) => void;
  dragUid: string | null;
  onDragStart: (uid: string) => void;
  onDragEnd: () => void;
  onDrop: (fromUid: string, toUid: string) => void;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  isPro: boolean;
  manufacturerCoeff: number;
  moduleIssues: Map<string, { severity: IssueSeverity; messages: string[] }>;
  zugReserveSlots?: number;
  isLastRow?: boolean;
  activeSlot?: SelectedSlot | null;
  onSlotClick?: (rowIdx: number, slotIdx: number) => void;
  ghostModuleData?: GhostModuleData | null;
}
