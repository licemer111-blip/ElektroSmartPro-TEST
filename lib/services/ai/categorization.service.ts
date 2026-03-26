/**
 * categorization.service.ts
 *
 * Logika dystrybucji pozycji kosztorysu po 23 kategoriach branżowych.
 * Wyodrębniona z app/dashboard/projects/[id]/ai-actions.ts.
 *
 * Zawiera:
 *  - CATEGORY_TREE — kompletna hierarchia 23 kategorii elektroinstalacyjnych
 *  - buildCategoryPrompt() — buduje kontekst kategoryzacji dla AI
 *  - normalizeCategoryName() — normalizuje i waliduje nazwę kategorii
 *  - guessCategoryFromName() — heurystyczne przypisanie bez AI (fallback)
 */

// ─── Category definitions ──────────────────────────────────────────────────────

export interface CategoryNode {
  id: string;
  name: string;
  subcategories: string[];
  keywords: string[];
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    id: "cables",
    name: "Przewody i kable",
    subcategories: ["Instalacyjne", "Energetyczne", "Sterownicze", "Teleinformatyczne"],
    keywords: ["przewód", "kabel", "ydy", "yky", "utp", "ftp", "lgy", "nhxmh", "hdgs", "omy", "światłowód"],
  },
  {
    id: "sockets",
    name: "Osprzęt instalacyjny",
    subcategories: ["Gniazda", "Łączniki", "Puszki", "Akcesoria"],
    keywords: ["gniazdo", "łącznik", "wyłącznik", "puszka", "ramka", "klawisz", "adapter", "data"],
  },
  {
    id: "panels",
    name: "Rozdzielnice i obudowy",
    subcategories: ["Rozdzielnice mieszkaniowe", "Rozdzielnice przemysłowe", "Szafy sterownicze"],
    keywords: ["rozdzielnica", "tablica", "szafa", "obudowa", "natynkowa", "podtynkowa", "ip65"],
  },
  {
    id: "breakers",
    name: "Aparatura modułowa",
    subcategories: ["Wyłączniki nadprądowe", "RCD", "RCBO", "Rozłączniki", "Ograniczniki przepięć", "Przekaźniki"],
    keywords: ["mcb", "rcd", "rcbo", "wyłącznik", "spd", "przekaźnik", "stycznik", "bezpiecznik", "rozłącznik"],
  },
  {
    id: "lighting",
    name: "Oświetlenie",
    subcategories: ["LED wewnętrzne", "LED zewnętrzne", "Awaryjne", "Źródła światła"],
    keywords: ["oprawa", "led", "downlight", "naświetlacz", "świetlówka", "żarówka", "ewakuacyjna", "awaryjna"],
  },
  {
    id: "automation",
    name: "Automatyka i sterowanie",
    subcategories: ["Czujniki", "Sterowniki", "Programatory", "Smart Home"],
    keywords: ["czujnik", "sterownik", "programator", "timer", "knx", "zigbee", "wifi", "dali", "rolety"],
  },
  {
    id: "labor",
    name: "Robocizna",
    subcategories: ["Montaż osprzętu", "Prace kablowe", "Prace budowlane", "Rozdzielnice", "Pomiary"],
    keywords: ["montaż", "układanie", "kucie", "bruzda", "pomiar", "podłączenie", "uruchomienie", "demontaż"],
  },
  {
    id: "assemblies",
    name: "Zestawy",
    subcategories: ["Punkty elektryczne", "Komplety montażowe"],
    keywords: ["zestaw", "punkt", "komplet", "pkt.", "kpl."],
  },
  {
    id: "teletechnics",
    name: "Instalacje teletechniczne",
    subcategories: ["LAN/IT", "CCTV", "Kontrola dostępu", "Alarm SSWiN", "SSP", "Domofon", "TV-SAT"],
    keywords: ["lan", "cctv", "kamera", "nvr", "alarm", "ssp", "pożar", "domofon", "wideodomofon", "antena", "sat"],
  },
  {
    id: "lightning_protection",
    name: "Instalacja odgromowa",
    subcategories: ["Zwody", "Uziemienie", "Połączenia wyrównawcze"],
    keywords: ["odgromowa", "zwód", "uziom", "piorunochron", "wyrównawcze", "fezn"],
  },
  {
    id: "pv",
    name: "Fotowoltaika (PV)",
    subcategories: ["Panele", "Falowniki", "Okablowanie DC", "Montaż"],
    keywords: ["panel", "fotowoltaika", "pv", "solar", "falownik", "mc4", "dc", "inverter"],
  },
  {
    id: "ev",
    name: "Ładowarki EV",
    subcategories: ["AC 7.4kW", "AC 11kW", "AC 22kW"],
    keywords: ["ev", "ładowarka", "wallbox", "elektryczny", "pojazd"],
  },
  {
    id: "cable_management",
    name: "Trasy kablowe",
    subcategories: ["Korytka", "Drabinki", "Rury", "Mocowania"],
    keywords: ["koryto", "drabinka", "rura", "uchwyt", "osprzęt trasy", "karbowana"],
  },
  {
    id: "other",
    name: "Inne",
    subcategories: ["Materiały pomocnicze", "Narzędzia"],
    keywords: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Buduje kontekst kategorii dla promptu AI (zwięzła lista z keywords).
 */
export function buildCategoryPrompt(): string {
  return CATEGORY_TREE.map((cat) =>
    `${cat.id}: "${cat.name}" → [${cat.subcategories.join(", ")}]`
  ).join("\n");
}

/**
 * Normalizuje kategorię — zwraca id z CATEGORY_TREE lub "other".
 */
export function normalizeCategoryId(rawCategory: string | null | undefined): string {
  if (!rawCategory) return "other";
  const lower = rawCategory.toLowerCase().trim();
  const found = CATEGORY_TREE.find(
    (cat) =>
      cat.id === lower ||
      cat.name.toLowerCase() === lower ||
      cat.subcategories.some((sub) => sub.toLowerCase() === lower)
  );
  return found?.id ?? "other";
}

/**
 * Heurystyczne przypisanie kategorii na podstawie nazwy pozycji (bez AI).
 * Fallback gdy AI jest niedostępne lub limit wyczerpany.
 */
export function guessCategoryFromName(itemName: string): { id: string; name: string; subcategory?: string } {
  const lower = itemName.toLowerCase();

  for (const cat of CATEGORY_TREE) {
    const matchesKeyword = cat.keywords.some((kw) => lower.includes(kw));
    if (matchesKeyword) {
      const matchedSub = cat.subcategories.find((sub) =>
        lower.includes(sub.toLowerCase())
      );
      return {
        id: cat.id,
        name: cat.name,
        subcategory: matchedSub,
      };
    }
  }

  return { id: "other", name: "Inne" };
}

/**
 * Grupuje listę pozycji kosztorysu po kategoriach.
 * Zwraca Map<categoryId, items[]>.
 */
export function groupItemsByCategory<T extends { category?: string | null; name: string }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const catId = item.category
      ? normalizeCategoryId(item.category)
      : guessCategoryFromName(item.name).id;

    const existing = groups.get(catId) ?? [];
    existing.push(item);
    groups.set(catId, existing);
  }

  return groups;
}
