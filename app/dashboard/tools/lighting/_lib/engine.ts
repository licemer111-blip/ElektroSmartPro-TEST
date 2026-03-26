export const ROOM_TYPES: Record<string, { lux: number; description: string; category: string }> = {
  living:       { lux: 150, description: "Salon, pokój dzienny",      category: "Mieszkaniowe" },
  bedroom:      { lux: 100, description: "Sypialnia",                  category: "Mieszkaniowe" },
  kitchen:      { lux: 300, description: "Kuchnia - blat roboczy",     category: "Mieszkaniowe" },
  bathroom:     { lux: 200, description: "Łazienka",                   category: "Mieszkaniowe" },
  corridor:     { lux: 100, description: "Korytarz, hol",              category: "Mieszkaniowe" },
  garage:       { lux: 150, description: "Garaż, piwnica",             category: "Mieszkaniowe" },
  office:       { lux: 500, description: "Biuro, miejsce pracy",       category: "Komercyjne" },
  openOffice:   { lux: 500, description: "Biuro open-space",           category: "Komercyjne" },
  meeting:      { lux: 300, description: "Sala konferencyjna",         category: "Komercyjne" },
  reception:    { lux: 300, description: "Recepcja",                   category: "Komercyjne" },
  warehouse:    { lux: 200, description: "Magazyn",                    category: "Przemysłowe" },
  workshop:     { lux: 500, description: "Warsztat, produkcja",        category: "Przemysłowe" },
  precisionWork:{ lux: 750, description: "Prace precyzyjne",           category: "Przemysłowe" },
  classroom:    { lux: 300, description: "Sala lekcyjna",              category: "Edukacyjne" },
  library:      { lux: 500, description: "Biblioteka, czytelnia",      category: "Edukacyjne" },
  retail:       { lux: 500, description: "Sklep, galeria handlowa",    category: "Handel" },
  supermarket:  { lux: 500, description: "Supermarket",                category: "Handel" },
  hospital:     { lux: 300, description: "Szpital - korytarz",         category: "Zdrowie" },
  examRoom:     { lux: 500, description: "Gabinet lekarski",           category: "Zdrowie" },
};

export const LUMINAIRE_TYPES: Record<string, { efficiency: number; description: string; cri: number }> = {
  ledPanel:    { efficiency: 0.85, description: "Panel LED (wysoka sprawność)", cri: 80 },
  ledDownlight:{ efficiency: 0.80, description: "Oprawa LED downlight",          cri: 80 },
  ledTube:     { efficiency: 0.85, description: "Świetlówka LED",                cri: 80 },
  ledHighBay:  { efficiency: 0.90, description: "Oprawa LED highbay (hale)",     cri: 70 },
  fluorescent: { efficiency: 0.65, description: "Świetlówka tradycyjna",         cri: 70 },
  halogen:     { efficiency: 0.30, description: "Halogen (niska sprawność)",     cri: 100 },
  metalHalide: { efficiency: 0.70, description: "Metalohalogenkowa (HQI)",       cri: 70 },
};

export const UTILIZATION_FACTORS: Record<string, number> = {
  "small": 0.40, "medium": 0.55, "large": 0.65, "very-large": 0.70,
};

export const MAINTENANCE_FACTORS: Record<string, number> = {
  "excellent": 0.90, "good": 0.80, "normal": 0.70, "poor": 0.60,
};

export interface LightingParams {
  roomType: string;
  area: string;
  height: string;
  luminaireType: string;
  luminaireOutput: string;
  roomSize: string;
  maintenance: string;
  colorTemp: string;
}

export interface LightingResult {
  requiredLux: number;
  totalLumens: number;
  numberOfLuminaires: number;
  actualLux: number;
  utilizationFactor: number;
  maintenanceFactor: number;
  totalPower: number;
  efficacy: number;
  lightingDensity: number;
  cri: number;
}

export function calculateLighting(p: LightingParams): LightingResult | null {
  const A  = parseFloat(p.area);
  const LO = parseFloat(p.luminaireOutput);
  const E  = ROOM_TYPES[p.roomType]?.lux ?? 300;

  if (!A || !LO || A <= 0) return null;

  const UF  = UTILIZATION_FACTORS[p.roomSize] ?? 0.55;
  const MF  = MAINTENANCE_FACTORS[p.maintenance] ?? 0.80;
  const cri = LUMINAIRE_TYPES[p.luminaireType]?.cri ?? 80;

  const totalLumens       = (E * A) / (UF * MF);
  const numberOfLuminaires = Math.ceil(totalLumens / LO);
  const actualLux          = (numberOfLuminaires * LO * UF * MF) / A;

  let efficacy = 130;
  if (!p.luminaireType.includes("led"))       efficacy = p.luminaireType === "fluorescent" ? 90 : p.luminaireType === "halogen" ? 18 : 85;

  const powerPerLum    = LO / efficacy;
  const totalPower     = powerPerLum * numberOfLuminaires;
  const lightingDensity = totalPower / A;

  return { requiredLux: E, totalLumens, numberOfLuminaires, actualLux, utilizationFactor: UF, maintenanceFactor: MF, totalPower, efficacy, lightingDensity, cri };
}
