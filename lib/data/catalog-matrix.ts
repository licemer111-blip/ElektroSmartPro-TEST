// ============================================================================
// CATALOG MATRIX DATA — thin wrapper around catalog-matrix.json
// Data extracted to JSON for maintainability. Source: lib/data/json/catalog-matrix.json
// ============================================================================

import matrixData from "./json/catalog-matrix.json";

export interface CatalogMatrixItem {
  name: string;
  category: string;
  unit: string;
  material_price: number;
  labor_price: number;
}

// ── Re-export all constants from JSON ────────────────────────────────────────

export const CABLE_SECTIONS = matrixData.CABLE_SECTIONS as number[];
export const CABLE_CORES = matrixData.CABLE_CORES as number[];
export const CABLE_TYPES = matrixData.CABLE_TYPES as { name: string; desc: string; basePricePerMm2: number }[];

export const ICT_CABLES = matrixData.ICT_CABLES as { name: string; price: number; labor: number }[];

export const TRAY_WIDTHS = matrixData.TRAY_WIDTHS as number[];
export const TRAY_TYPES = matrixData.TRAY_TYPES as { name: string; pricePerMm: number; labor: number }[];
export const TRAY_ACCESSORIES = matrixData.TRAY_ACCESSORIES as { name: string; price: number; labor: number }[];

export const FLOORBOX_MODULES = matrixData.FLOORBOX_MODULES as number[];
export const FLOORBOX_TYPES = matrixData.FLOORBOX_TYPES as { name: string; basePrice: number }[];
export const DADO_SIZES = matrixData.DADO_SIZES as { size: string; price: number; labor: number }[];

export const MCCB_RATINGS = matrixData.MCCB_RATINGS as number[];
export const MCCB_POLES = matrixData.MCCB_POLES as number[];
export const MCCB_CURVES = matrixData.MCCB_CURVES as string[];
export const DISCONNECTOR_RATINGS = matrixData.DISCONNECTOR_RATINGS as number[];
export const CONTACTOR_RATINGS = matrixData.CONTACTOR_RATINGS as number[];
export const THERMAL_RANGES = matrixData.THERMAL_RANGES as { range: string; price: number }[];

export const ENCLOSURE_SIZES = matrixData.ENCLOSURE_SIZES as { size: string; price: number; labor: number }[];
export const ENCLOSURE_TYPES = matrixData.ENCLOSURE_TYPES as { name: string; multiplier: number }[];

export const BUSBAR_RATINGS = matrixData.BUSBAR_RATINGS as number[];

export const DALI_DEVICES = matrixData.DALI_DEVICES as { name: string; price: number; labor: number }[];
export const DMX_DEVICES = matrixData.DMX_DEVICES as { name: string; price: number; labor: number }[];

export const FIRE_DEVICES = matrixData.FIRE_DEVICES as { name: string; price: number; labor: number }[];

export const UPS_RATINGS = matrixData.UPS_RATINGS as number[];
export const BATTERY_CAPACITIES = matrixData.BATTERY_CAPACITIES as number[];

export const GROUNDING_ITEMS = matrixData.GROUNDING_ITEMS as { name: string; price: number; labor: number; unit: string }[];
export const HVAC_ITEMS = matrixData.HVAC_ITEMS as { name: string; price: number; labor: number }[];
export const MEASUREMENT_ITEMS = matrixData.MEASUREMENT_ITEMS as { name: string; price: number; labor: number }[];
export const EMERGENCY_ITEMS = matrixData.EMERGENCY_ITEMS as { name: string; price: number; labor: number }[];
export const OFFICE_SPECIALIZED_ITEMS = matrixData.OFFICE_SPECIALIZED_ITEMS as { name: string; price: number; labor: number }[];
export const ADDITIONAL_MEASUREMENT_ITEMS = matrixData.ADDITIONAL_MEASUREMENT_ITEMS as { name: string; price: number; labor: number }[];
export const SECURITY_ITEMS = matrixData.SECURITY_ITEMS as { name: string; price: number; labor: number }[];

export const DEMOLITION_ACCESSORIES = matrixData.DEMOLITION_ACCESSORIES as { name: string; labor: number }[];
export const DEMOLITION_LIGHTING = matrixData.DEMOLITION_LIGHTING as { name: string; labor: number }[];
export const DEMOLITION_CABLES = matrixData.DEMOLITION_CABLES as { name: string; labor: number }[];
export const DEMOLITION_TRAYS = matrixData.DEMOLITION_TRAYS as { name: string; labor: number }[];
export const DEMOLITION_SWITCHGEAR = matrixData.DEMOLITION_SWITCHGEAR as { name: string; labor: number }[];
export const DEMOLITION_CHASING = matrixData.DEMOLITION_CHASING as { name: string; labor: number }[];

export const MONITORING_CAMERAS = matrixData.MONITORING_CAMERAS as { name: string; price: number; labor: number }[];
export const MONITORING_RECORDERS = matrixData.MONITORING_RECORDERS as { name: string; price: number; labor: number }[];
export const MONITORING_STORAGE = matrixData.MONITORING_STORAGE as { name: string; price: number; labor: number }[];
export const MONITORING_NETWORK = matrixData.MONITORING_NETWORK as { name: string; price: number; labor: number }[];
export const MONITORING_POWER = matrixData.MONITORING_POWER as { name: string; price: number; labor: number }[];
export const MONITORING_ACCESSORIES = matrixData.MONITORING_ACCESSORIES as { name: string; price: number; labor: number }[];
export const MONITORING_SERVICES = matrixData.MONITORING_SERVICES as { name: string; price: number; labor: number }[];

export const EARTHWORKS_CABLING = matrixData.EARTHWORKS_CABLING as { name: string; price: number; labor: number }[];
export const EARTHWORKS_PROTECTION = matrixData.EARTHWORKS_PROTECTION as { name: string; price: number; labor: number }[];
export const EARTHWORKS_GROUNDING = matrixData.EARTHWORKS_GROUNDING as { name: string; price: number; labor: number }[];
export const EARTHWORKS_JOINTS = matrixData.EARTHWORKS_JOINTS as { name: string; price: number; labor: number }[];
export const EARTHWORKS_SOIL = matrixData.EARTHWORKS_SOIL as { name: string; price: number; labor: number; unitOverride?: string }[];

export const FIRE_MANUAL_DEVICES = matrixData.FIRE_MANUAL_DEVICES as { name: string; price: number; labor: number }[];
export const FIRE_DETECTORS = matrixData.FIRE_DETECTORS as { name: string; price: number; labor: number }[];
export const FIRE_SOUNDERS = matrixData.FIRE_SOUNDERS as { name: string; price: number; labor: number }[];
export const FIRE_CENTRALS = matrixData.FIRE_CENTRALS as { name: string; price: number; labor: number; unitOverride?: string }[];
export const SMOKE_VENTING = matrixData.SMOKE_VENTING as { name: string; price: number; labor: number; unitOverride?: string }[];

export const ACCESS_LOCKS = matrixData.ACCESS_LOCKS as { name: string; price: number; labor: number }[];
export const ACCESS_POINTS = matrixData.ACCESS_POINTS as { name: string; price: number; labor: number }[];
export const ACCESS_CONTROLLERS = matrixData.ACCESS_CONTROLLERS as { name: string; price: number; labor: number; unitOverride?: string }[];

export const ENGINEERING_SERVICES = matrixData.ENGINEERING_SERVICES as { name: string; price: number; labor: number }[];
