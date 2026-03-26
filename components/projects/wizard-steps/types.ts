"use client";

import type {
  ObjectTypeKey,
  QualityStandard,
  EstimateItem,
  ZakresPrac,
  ConditionalFields,
} from "@/lib/quick-estimate-config";

export type { ObjectTypeKey, QualityStandard, EstimateItem, ZakresPrac, ConditionalFields };

export interface WizardState {
  step: number;
  selectedType: ObjectTypeKey | null;
  area: number;
  areaInput: string;
  rooms: number;
  roomsInput: string;
  defaultsApplied: ObjectTypeKey | null;
  projectName: string;
  regionId: string;
  standard: QualityStandard;
  items: EstimateItem[];
  creating: boolean;
  generating: boolean;
  aiUsed: number | null;
  aiLimit: number | null;
  wasFallback: boolean;
  viewMode: "all" | "material" | "labor";
  zakres: ZakresPrac[];
  conditionalFields: ConditionalFields;
  openAccordion: string | null;
  manualVatRate: number | null;
}

export interface WizardActions {
  setStep: (step: number) => void;
  setSelectedType: (type: ObjectTypeKey | null) => void;
  setArea: (area: number) => void;
  setAreaInput: (val: string) => void;
  setRooms: (rooms: number) => void;
  setRoomsInput: (val: string) => void;
  setDefaultsApplied: (type: ObjectTypeKey | null) => void;
  setProjectName: (name: string) => void;
  setRegionId: (id: string) => void;
  setStandard: (std: QualityStandard) => void;
  setItems: React.Dispatch<React.SetStateAction<EstimateItem[]>>;
  setCreating: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setAiUsed: (n: number | null) => void;
  setAiLimit: (n: number | null) => void;
  setWasFallback: (v: boolean) => void;
  setViewMode: (mode: "all" | "material" | "labor") => void;
  setZakres: React.Dispatch<React.SetStateAction<ZakresPrac[]>>;
  setConditionalFields: React.Dispatch<React.SetStateAction<ConditionalFields>>;
  setOpenAccordion: (id: string | null) => void;
  setManualVatRate: (rate: number | null) => void;
  handleReset: () => void;
  handleGenerateItems: () => Promise<void>;
  handleCreate: () => Promise<void>;
  updateItemQuantity: (index: number, newQty: number) => void;
  removeItem: (index: number) => void;
}

export interface WizardProps {
  regions: { id: string; name: string }[];
  objectTypes: { id: string; name: string; default_vat_rate: number }[];
  isPro?: boolean;
}
