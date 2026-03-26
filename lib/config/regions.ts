// ═══════════════════════════════════════════════════════════════════
// lib/config/regions.ts
// Polska: 16 województw z współczynnikami cen (Korekta regionalna).
// Baza 1.0 = średnia ogólnopolska (wzorzec: Łódzkie).
// Coefficients cross-referenced with: GUS, SEKOCENBUD, ORGBUD 2024.
// ═══════════════════════════════════════════════════════════════════

export interface PolishRegion {
  id: string;           // slug — used as identifier
  name: string;         // official voivodeship name
  capital: string;      // provincial capital city
  multiplier: number;   // price modifier (1.0 = national average)
  flag: string;         // emoji flag for UI
}

export const POLISH_REGIONS: PolishRegion[] = [
  { id: "mazowieckie",          name: "Mazowieckie",          capital: "Warszawa",      multiplier: 1.20, flag: "🏙️" },
  { id: "dolnoslaskie",         name: "Dolnośląskie",         capital: "Wrocław",       multiplier: 1.12, flag: "⛰️" },
  { id: "malopolskie",          name: "Małopolskie",          capital: "Kraków",        multiplier: 1.10, flag: "🏰" },
  { id: "pomorskie",            name: "Pomorskie",            capital: "Gdańsk",        multiplier: 1.10, flag: "⚓" },
  { id: "slaskie",              name: "Śląskie",              capital: "Katowice",      multiplier: 1.08, flag: "⚙️" },
  { id: "wielkopolskie",        name: "Wielkopolskie",        capital: "Poznań",        multiplier: 1.06, flag: "🌾" },
  { id: "zachodniopomorskie",   name: "Zachodniopomorskie",   capital: "Szczecin",      multiplier: 1.02, flag: "🌊" },
  { id: "lodzkie",              name: "Łódzkie",              capital: "Łódź",          multiplier: 1.00, flag: "🏭" },
  { id: "lubuskie",             name: "Lubuskie",             capital: "Zielona Góra",  multiplier: 0.96, flag: "🌲" },
  { id: "kujawsko-pomorskie",   name: "Kujawsko-Pomorskie",   capital: "Bydgoszcz",     multiplier: 0.96, flag: "🌻" },
  { id: "warminsko-mazurskie",  name: "Warmińsko-Mazurskie",  capital: "Olsztyn",       multiplier: 0.92, flag: "🦅" },
  { id: "opolskie",             name: "Opolskie",             capital: "Opole",         multiplier: 0.94, flag: "🌷" },
  { id: "swietokrzyskie",       name: "Świętokrzyskie",       capital: "Kielce",        multiplier: 0.90, flag: "⛪" },
  { id: "lubelskie",            name: "Lubelskie",            capital: "Lublin",        multiplier: 0.92, flag: "🌿" },
  { id: "podkarpackie",         name: "Podkarpackie",         capital: "Rzeszów",       multiplier: 0.88, flag: "🏔️" },
  { id: "podlaskie",            name: "Podlaskie",            capital: "Białystok",     multiplier: 0.88, flag: "🌾" },
];

// Sorted for dropdown (highest multiplier first, then alphabetical)
export const POLISH_REGIONS_SORTED: PolishRegion[] = [...POLISH_REGIONS].sort(
  (a, b) => b.multiplier - a.multiplier || a.name.localeCompare(b.name, "pl")
);

/** Get region by slug id */
export function getRegionById(id: string | null | undefined): PolishRegion | undefined {
  if (!id) return undefined;
  return POLISH_REGIONS.find((r) => r.id === id);
}

/** Get region by name (case-insensitive) */
export function getRegionByName(name: string | null | undefined): PolishRegion | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return POLISH_REGIONS.find((r) => r.name.toLowerCase() === lower);
}

/** Get multiplier by region slug id. Returns 1.0 if not found. */
export function getRegionMultiplier(regionId: string | null | undefined): number {
  return getRegionById(regionId)?.multiplier ?? 1.0;
}

/**
 * Format the regional correction as a human-readable label.
 * e.g. "+20% (Mazowieckie)" or "-12% (Podkarpackie)" or "Brak korekty"
 */
export function formatRegionCorrection(regionId: string | null | undefined): string {
  const region = getRegionById(regionId);
  if (!region) return "Brak korekty regionalnej";
  const pct = Math.round((region.multiplier - 1) * 100);
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}% (${region.name})`;
}

/**
 * Get CSS color class for the badge based on multiplier.
 * >1.10 = orange (expensive), 0.95–1.10 = neutral, <0.95 = green (cheaper)
 */
export function getRegionBadgeVariant(multiplier: number): "expensive" | "average" | "cheap" {
  if (multiplier >= 1.10) return "expensive";
  if (multiplier <= 0.95) return "cheap";
  return "average";
}
