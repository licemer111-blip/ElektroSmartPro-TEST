/**
 * Quick Estimate Wizard configuration
 * Defines standard electrical installation items and quantities
 * based on object type, area, and quality standard.
 *
 * Prices are base prices (PLN) without regional modifier.
 * Data loaded from: lib/data/json/quick-estimate-rules.json
 */

import rulesData from "./data/json/quick-estimate-rules.json";

export type ObjectTypeKey = "mieszkanie" | "dom" | "biuro" | "przemysl" | "sklep" | "parking" | "hotel" | "szkola";
export type QualityStandard = "ekonomiczny" | "standard" | "premium";
export type ZakresPrac = "electrical" | "teletechnical" | "alarm" | "smarthome" | "ppoz";

export const ZAKRES_OPTIONS = rulesData.zakres_options as { key: ZakresPrac; label: string; icon: string; color: string }[];

export interface ConditionalFields {
  // mieszkanie / dom
  floors?: number;
  installationType?: "flush" | "surface"; // podtynkowa / natynkowa
  finishStandard?: "basic" | "standard" | "luxury";

  // biuro / sklep
  floorboxCount?: number;
  lanCategory?: "cat5e" | "cat6" | "cat6a"; // kategoria kabla LAN
  accessControl?: boolean; // RACS - kontrola dostępu

  // przemysl / hala
  ceilingHeight?: "low" | "medium" | "high"; // <3m | 3-6m | >6m
  cableTrayType?: "ladder" | "mesh" | "perforated"; // drabinka / siatka / perforowana
  connectedPowerKw?: number;

  // parking
  evChargers?: number;
  coDetection?: boolean; // detekcja CO/LPG
  emergencyLighting?: boolean; // oświetlenie awaryjne

  // hotel / szkola
  roomManagement?: boolean; // system zarządzania pokojami / salami
  paSystem?: boolean; // radiowęzeł / nagłośnienie
  sspComplexity?: "basic" | "addressable"; // SSP konwencjonalny / adresowalny

  serverRooms?: number;
}

export interface EstimateItem {
  name: string;
  unit: string;
  quantity: number;
  base_material_price: number;
  base_labor_price: number;
  knr_code?: string | null;
}

interface ItemRule {
  name: string;
  unit: string;
  base_material: number;
  base_labor: number;
  calc: "per_room" | "per_area" | "per_circuit" | "fixed" | "per_point";
  factor: number;
  /** Which zakres this rule belongs to (undefined = always included) */
  zakres?: ZakresPrac;
}

/** Quality standard price multipliers — loaded from JSON */
const STANDARD_MULTIPLIERS = rulesData.standard_multipliers as Record<QualityStandard, { material: number; labor: number }>;

/** Standard item templates for each object type — loaded from JSON */
const ITEM_RULES = rulesData.item_rules as Record<ObjectTypeKey, ItemRule[]>;

/** Teletechnical extra rules — loaded from JSON */
const TELETECHNICAL_RULES = rulesData.teletechnical_rules as Partial<Record<ObjectTypeKey, ItemRule[]>>;

/** Alarm extra rules — loaded from JSON */
const ALARM_RULES = rulesData.alarm_rules as Partial<Record<ObjectTypeKey, ItemRule[]>>;

/** Smart Home extra rules — loaded from JSON */
const SMARTHOME_RULES = rulesData.smarthome_rules as Partial<Record<ObjectTypeKey, ItemRule[]>>;

/** P-POZ extra rules — loaded from JSON */
const PPOZ_RULES = rulesData.ppoz_rules as Partial<Record<ObjectTypeKey, ItemRule[]>>;

function ruleToItem(rule: ItemRule, areaM2: number, roomCount: number, circuitCount: number, mult: { material: number; labor: number }): EstimateItem {
  let quantity: number;
  switch (rule.calc) {
    case "per_room": quantity = roomCount * rule.factor; break;
    case "per_area": quantity = areaM2 * rule.factor; break;
    case "per_circuit": quantity = circuitCount * rule.factor; break;
    case "per_point": quantity = areaM2 * 0.25 * rule.factor; break;
    case "fixed": default: quantity = rule.factor; break;
  }
  return {
    name: rule.name,
    unit: rule.unit,
    quantity: Math.max(1, Math.round(quantity)),
    base_material_price: Math.round(rule.base_material * mult.material * 100) / 100,
    base_labor_price: Math.round(rule.base_labor * mult.labor * 100) / 100,
  };
}

/** Calculate estimate items for the given parameters */
export function generateEstimateItems(params: {
  objectType: ObjectTypeKey;
  areaM2: number;
  roomCount: number;
  standard: QualityStandard;
  zakres?: ZakresPrac[];
  conditionalFields?: ConditionalFields;
}): EstimateItem[] {
  const { objectType, areaM2, roomCount, standard, zakres, conditionalFields } = params;
  const mult = STANDARD_MULTIPLIERS[standard];
  // Q1 fix: modern electrical standard — 1 dedicated circuit per 12m², minimum 6 circuits
  const circuitCount = Math.max(6, Math.ceil(areaM2 / 12));
  const activeZakres = zakres && zakres.length > 0 ? zakres : (["electrical"] as ZakresPrac[]);

  const allRules: ItemRule[] = [...ITEM_RULES[objectType]];

  if (activeZakres.includes("teletechnical")) {
    allRules.push(...(TELETECHNICAL_RULES[objectType] ?? []));
  }
  if (activeZakres.includes("alarm")) {
    allRules.push(...(ALARM_RULES[objectType] ?? []));
  }
  if (activeZakres.includes("smarthome")) {
    allRules.push(...(SMARTHOME_RULES[objectType] ?? []));
  }
  if (activeZakres.includes("ppoz")) {
    allRules.push(...(PPOZ_RULES[objectType] ?? []));
  }

  const cf = conditionalFields ?? {};

  // Ceiling height labor multiplier (przemysl only)
  const heightLaborMult =
    objectType === "przemysl" && cf.ceilingHeight === "high" ? 1.4 :
    objectType === "przemysl" && cf.ceilingHeight === "medium" ? 1.2 : 1.0;

  const heightMult = { material: mult.material, labor: mult.labor * heightLaborMult };

  const items: EstimateItem[] = allRules.map((rule) =>
    ruleToItem(rule, areaM2, roomCount, circuitCount, objectType === "przemysl" ? heightMult : mult)
  );

  // Conditional extras

  if ((objectType === "mieszkanie" || objectType === "dom") && cf.floors && cf.floors > 1) {
    items.push({
      name: "Instalacja elektryczna (dodatkowa kondygnacja)",
      unit: "kpl",
      quantity: cf.floors - 1,
      base_material_price: Math.round(800 * mult.material * 100) / 100,
      base_labor_price: Math.round(600 * mult.labor * 100) / 100,
    });
  }

  if (objectType === "mieszkanie" && cf.finishStandard === "luxury") {
    items.push({
      name: "Oświetlenie dekoracyjne (taśmy LED, ściemnianie)",
      unit: "kpl",
      quantity: 1,
      base_material_price: Math.round(1200 * mult.material * 100) / 100,
      base_labor_price: Math.round(400 * mult.labor * 100) / 100,
    });
  }

  if (objectType === "przemysl" && cf.ceilingHeight === "high") {
    items.push({
      name: "Oprawa LED wysokiego zawieszenia (>6m)",
      unit: "szt",
      quantity: Math.max(1, Math.ceil(areaM2 / 80)),
      base_material_price: Math.round(650 * mult.material * 100) / 100,
      base_labor_price: Math.round(180 * mult.labor * 100) / 100,
    });
  }

  if (objectType === "biuro" && cf.floorboxCount && cf.floorboxCount > 0) {
    items.push({
      name: "Floorbox podłogowy (gniazdo podłogowe 230V+RJ45)",
      unit: "szt",
      quantity: cf.floorboxCount,
      base_material_price: Math.round(280 * mult.material * 100) / 100,
      base_labor_price: Math.round(120 * mult.labor * 100) / 100,
    });
  }

  if (objectType === "przemysl" && cf.connectedPowerKw && cf.connectedPowerKw > 100) {
    items.push({
      name: "Rozdzielnica główna RG (duża moc przyłączeniowa)",
      unit: "szt",
      quantity: 1,
      base_material_price: Math.round(2800 * mult.material * 100) / 100,
      base_labor_price: Math.round(1200 * mult.labor * 100) / 100,
    });
  }

  if ((objectType === "parking" || objectType === "biuro") && cf.evChargers && cf.evChargers > 0) {
    items.push({
      name: "Ładowarka EV 7,4kW (wallbox) — dodatkowe",
      unit: "szt",
      quantity: cf.evChargers,
      base_material_price: Math.round(1800 * mult.material * 100) / 100,
      base_labor_price: Math.round(350 * mult.labor * 100) / 100,
    });
  }

  // Kontrola dostępu (RACS) dla biuro/sklep
  if ((objectType === "biuro" || objectType === "sklep") && cf.accessControl) {
    items.push(
      { name: "Czytnik RFID (kontrola dostępu)", unit: "szt", quantity: Math.max(2, Math.ceil(roomCount * 0.3)), base_material_price: Math.round(380 * mult.material * 100) / 100, base_labor_price: Math.round(120 * mult.labor * 100) / 100 },
      { name: "Elektrozaczep / zamek elektromagnetyczny", unit: "szt", quantity: Math.max(1, Math.ceil(roomCount * 0.2)), base_material_price: Math.round(280 * mult.material * 100) / 100, base_labor_price: Math.round(150 * mult.labor * 100) / 100 },
    );
  }

  // Floorbox dla sklep (biuro już obsłużone wyżej)
  if (objectType === "sklep" && cf.floorboxCount && cf.floorboxCount > 0) {
    items.push({ name: "Floorbox podłogowy (gniazdo podłogowe 230V+RJ45)", unit: "szt", quantity: cf.floorboxCount, base_material_price: Math.round(280 * mult.material * 100) / 100, base_labor_price: Math.round(120 * mult.labor * 100) / 100 });
  }

  // Detekcja CO/LPG dla parking
  if (objectType === "parking" && cf.coDetection) {
    items.push({ name: "Czujnik CO/LPG (detekcja gazu)", unit: "szt", quantity: Math.max(2, Math.ceil(areaM2 / 200)), base_material_price: Math.round(180 * mult.material * 100) / 100, base_labor_price: Math.round(50 * mult.labor * 100) / 100 });
  }

  // Oświetlenie awaryjne dla parking
  if (objectType === "parking" && cf.emergencyLighting) {
    items.push({ name: "Oprawa awaryjna IP65 (ewakuacyjna)", unit: "szt", quantity: Math.max(4, Math.ceil(areaM2 / 50)), base_material_price: Math.round(160 * mult.material * 100) / 100, base_labor_price: Math.round(55 * mult.labor * 100) / 100 });
  }

  // Expert systems: SSP/RCU/PA require specialist technicians → rbh ×1.35
  const expertMult = { material: mult.material, labor: mult.labor * 1.35 };

  // SSP adresowalny — pełna lista komponentów z mnożnikiem specjalisty
  if ((objectType === "hotel" || objectType === "szkola" || objectType === "biuro") && cf.sspComplexity === "addressable") {
    items.push(
      { name: "Centrala SSP adresowalna (ES-KNR-SSP-ADDR-01)", unit: "szt", quantity: 1, base_material_price: Math.round(5500 * expertMult.material * 100) / 100, base_labor_price: Math.round(900 * expertMult.labor * 100) / 100 },
      { name: "Czujka dymu adresowalna (ES-KNR-SSP-ADDR-02)", unit: "szt", quantity: Math.max(4, Math.ceil(areaM2 / 60)), base_material_price: Math.round(180 * expertMult.material * 100) / 100, base_labor_price: Math.round(55 * expertMult.labor * 100) / 100 },
      { name: "ROP adresowalny (ręczny ostrzegacz pożaru) (ES-KNR-SSP-ADDR-03)", unit: "szt", quantity: Math.max(2, Math.ceil(roomCount * 0.15)), base_material_price: Math.round(220 * expertMult.material * 100) / 100, base_labor_price: Math.round(60 * expertMult.labor * 100) / 100 },
      { name: "Sygnalizator optyczno-akustyczny (ES-KNR-SSP-ADDR-04)", unit: "szt", quantity: Math.max(2, Math.ceil(areaM2 / 200)), base_material_price: Math.round(160 * expertMult.material * 100) / 100, base_labor_price: Math.round(45 * expertMult.labor * 100) / 100 },
      { name: "Kabel HDGs 2x1.0mm2 p.poż. (ES-KNR-SSP-ADDR-05)", unit: "mb", quantity: Math.max(50, Math.ceil(areaM2 * 0.8)), base_material_price: Math.round(4.5 * expertMult.material * 100) / 100, base_labor_price: Math.round(2.2 * expertMult.labor * 100) / 100 },
      { name: "Zasilacz buforowy 24V/3A SSP (ES-KNR-SSP-ADDR-06)", unit: "szt", quantity: 1, base_material_price: Math.round(480 * expertMult.material * 100) / 100, base_labor_price: Math.round(80 * expertMult.labor * 100) / 100 },
    );
  }

  // SSP konwencjonalny
  if ((objectType === "hotel" || objectType === "szkola" || objectType === "biuro") && cf.sspComplexity === "basic") {
    items.push(
      { name: "Centrala SSP konwencjonalna strefowa (ES-KNR-5-08-SSP-01)", unit: "szt", quantity: 1, base_material_price: Math.round(1800 * mult.material * 100) / 100, base_labor_price: Math.round(400 * mult.labor * 100) / 100 },
      { name: "Czujka dymu konwencjonalna (ES-KNR-5-08-SSP-02)", unit: "szt", quantity: Math.max(4, Math.ceil(areaM2 / 80)), base_material_price: Math.round(65 * mult.material * 100) / 100, base_labor_price: Math.round(30 * mult.labor * 100) / 100 },
      { name: "ROP konwencjonalny (ES-KNR-5-08-SSP-03)", unit: "szt", quantity: Math.max(2, Math.ceil(roomCount * 0.1)), base_material_price: Math.round(85 * mult.material * 100) / 100, base_labor_price: Math.round(25 * mult.labor * 100) / 100 },
      { name: "Kabel YnTKSY 2x0.8mm2 (ES-KNR-5-08-SSP-04)", unit: "mb", quantity: Math.max(30, Math.ceil(areaM2 * 0.6)), base_material_price: Math.round(2.8 * mult.material * 100) / 100, base_labor_price: Math.round(1.5 * mult.labor * 100) / 100 },
    );
  }

  // PA system — mnożnik specjalisty AV ×1.35
  if ((objectType === "hotel" || objectType === "szkola") && cf.paSystem) {
    items.push(
      { name: "Wzmacniacz PA (nagłośnienie) (ES-KNR-MANUAL)", unit: "szt", quantity: Math.max(1, Math.ceil(areaM2 / 500)), base_material_price: Math.round(1200 * expertMult.material * 100) / 100, base_labor_price: Math.round(300 * expertMult.labor * 100) / 100 },
      { name: "Głośnik sufitowy 6W (radiowęzeł) (ES-KNR-MANUAL)", unit: "szt", quantity: Math.max(4, Math.ceil(areaM2 / 20)), base_material_price: Math.round(85 * expertMult.material * 100) / 100, base_labor_price: Math.round(35 * expertMult.labor * 100) / 100 },
      { name: "Kabel głośnikowy 2x1.5mm2 (ES-KNR-MANUAL)", unit: "mb", quantity: Math.max(20, Math.ceil(areaM2 * 0.5)), base_material_price: Math.round(3.2 * expertMult.material * 100) / 100, base_labor_price: Math.round(1.8 * expertMult.labor * 100) / 100 },
    );
  }

  // System zarządzania pokojami RCU/KNX — mnożnik programisty ×1.35
  if ((objectType === "hotel" || objectType === "szkola") && cf.roomManagement) {
    items.push(
      { name: "Sterownik pokojowy KNX (RCU) (ES-KNR-MANUAL)", unit: "szt", quantity: roomCount, base_material_price: Math.round(1200 * expertMult.material * 100) / 100, base_labor_price: Math.round(180 * expertMult.labor * 100) / 100 },
      { name: "Magistrala KNX TP (ES-KNR-MANUAL)", unit: "mb", quantity: Math.max(20, Math.ceil(areaM2 * 0.3)), base_material_price: Math.round(5.5 * expertMult.material * 100) / 100, base_labor_price: Math.round(2.5 * expertMult.labor * 100) / 100 },
      { name: "Zasilacz KNX 640mA (ES-KNR-MANUAL)", unit: "szt", quantity: Math.max(1, Math.ceil(roomCount / 30)), base_material_price: Math.round(680 * expertMult.material * 100) / 100, base_labor_price: Math.round(90 * expertMult.labor * 100) / 100 },
    );
  }

  // Typ trasy kablowej dla przemysl
  if (objectType === "przemysl" && cf.cableTrayType === "ladder") {
    items.push({ name: "Drabinka kablowa stalowa 200mm", unit: "mb", quantity: Math.max(10, Math.ceil(areaM2 * 0.15)), base_material_price: Math.round(55 * mult.material * 100) / 100, base_labor_price: Math.round(30 * mult.labor * 100) / 100 });
  } else if (objectType === "przemysl" && cf.cableTrayType === "mesh") {
    items.push({ name: "Koryto siatkowe 200mm (lekkie/IT)", unit: "mb", quantity: Math.max(10, Math.ceil(areaM2 * 0.12)), base_material_price: Math.round(38 * mult.material * 100) / 100, base_labor_price: Math.round(22 * mult.labor * 100) / 100 });
  }

  return items;
}

/** Object type labels for the wizard — loaded from JSON */
export const OBJECT_TYPE_OPTIONS = rulesData.object_type_options as { key: ObjectTypeKey; label: string; description: string; icon: string }[];

/** Quality standard labels — loaded from JSON */
export const QUALITY_OPTIONS = rulesData.quality_options as { key: QualityStandard; label: string; description: string; priceNote: string }[];
