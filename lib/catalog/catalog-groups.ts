import { foldCatalogText } from "@/lib/catalog/catalog-search";

/** Where a catalog row belongs, judged from the name an electrician would use. */
export type CatalogGroupKey =
  | "demontaz"
  | "osprzet"
  | "oswietlenie"
  | "rozdzielnice"
  | "trasy"
  | "przygotowanie"
  | "teletechnika"
  | "okablowanie";

export function itemGroupKey(name: string): CatalogGroupKey | null {
  const text = foldCatalogText(name);
  if (/^demont/.test(text)) return "demontaz";
  if (/\b(utp|ftp|skretk|swiatlowod|kamera|wideodomofon)\b/.test(text)) return "teletechnika";
  if (/\b(koryt|drabink|peszel|kanal kabl)/.test(text)) return "trasy";
  if (/\b(opraw|downlight|plafon|kinkiet|naswietlacz)/.test(text)) return "oswietlenie";
  if (/\b(rozdzielnic|szafa sterownic|wylacznik nadprad|ogranicznik przepiec)/.test(text)) return "rozdzielnice";
  // "kabel gniazdkowy" is a cable. A socket is not.
  if (/\b(gniazd|lacznik|wlacznik|puszk|ramk|sciemniacz)/.test(text) && !/\bgniazdkow/.test(text)) {
    return "osprzet";
  }
  if (/\b(ydyp?|yky|nhxh|lgy|przewod|kabel|kable)/.test(text)) return "okablowanie";
  if (/\b(bruzd|wiercen|kucie otwor)/.test(text)) return "przygotowanie";
  return null;
}

export function categoryGroupKey(name: string): CatalogGroupKey | null {
  const text = foldCatalogText(name);
  if (text.includes("demont")) return "demontaz";
  if (text.includes("osprzet") || text.includes("gniazd") || text.includes("lacznik")) return "osprzet";
  if (text.includes("oswietl")) return "oswietlenie";
  if (text.includes("rozdziel")) return "rozdzielnice";
  if (text.includes("tras")) return "trasy";
  if (text.includes("przygot") || text.includes("bruzd")) return "przygotowanie";
  if (text.includes("teletech") || text.includes("struktural")) return "teletechnika";
  if (text.includes("okablow") || text.includes("kable") || text.includes("przewod")) return "okablowanie";
  return null;
}

const VIRTUAL_NAMES: Record<CatalogGroupKey, string> = {
  demontaz: "Demontaże",
  osprzet: "Osprzęt instalacyjny",
  oswietlenie: "Oświetlenie",
  rozdzielnice: "Rozdzielnice",
  trasy: "Trasy kablowe",
  przygotowanie: "Przygotowanie",
  teletechnika: "Teletechnika",
  okablowanie: "Okablowanie",
};

export function pickCategoryId(
  categories: { id: string; name: string }[],
  key: CatalogGroupKey,
): string | null {
  const matches = categories.filter((category) => categoryGroupKey(category.name) === key);
  if (matches.length === 0) return null;
  if (key === "okablowanie") {
    const power = matches.find((category) => !foldCatalogText(category.name).includes("struktural"));
    const named = matches.find((category) => /kable|przewod/.test(foldCatalogText(category.name)) && !foldCatalogText(category.name).includes("struktural"));
    return (named ?? power ?? matches[0]).id;
  }
  if (key === "teletechnika") {
    const structural = matches.find((category) => foldCatalogText(category.name).includes("struktural"));
    return (structural ?? matches[0]).id;
  }
  return matches[0].id;
}

export interface RegroupedCatalog<TCategory extends { id: string; name: string }, TItem extends { id: string; user_id: string | null; category_id: string; name: string }> {
  categories: TCategory[];
  items: TItem[];
}

/** Shared rows follow the name. A row the electrician filed himself stays put. */
export function regroupCatalogItems<
  TCategory extends { id: string; name: string; object_type_id?: string; icon_name?: string | null; sort_order?: number; created_at?: string },
  TItem extends { id: string; user_id: string | null; category_id: string; name: string },
>(categories: TCategory[], items: TItem[]): RegroupedCatalog<TCategory, TItem> {
  const nextCategories = [...categories];
  const byKey = new Map<CatalogGroupKey, string>();

  const destinationFor = (key: CatalogGroupKey): string => {
    const known = byKey.get(key);
    if (known) return known;
    const existing = pickCategoryId(nextCategories, key);
    if (existing) {
      byKey.set(key, existing);
      return existing;
    }
    const objectTypeId = nextCategories[0]?.object_type_id ?? "regroup";
    const created: TCategory = {
      ...nextCategories[0],
      id: `es-group:${key}`,
      object_type_id: objectTypeId,
      name: VIRTUAL_NAMES[key],
      icon_name: null,
      sort_order: 50,
      created_at: new Date(0).toISOString(),
    } as TCategory;
    nextCategories.push(created);
    byKey.set(key, created.id);
    return created.id;
  };

  const nextItems = items.map((item) => {
    if (item.user_id) return item;
    const key = itemGroupKey(item.name);
    if (!key) return item;
    const current = nextCategories.find((category) => category.id === item.category_id);
    if (current && categoryGroupKey(current.name) === key) return item;
    const destination = destinationFor(key);
    if (destination === item.category_id) return item;
    return { ...item, category_id: destination };
  });

  return { categories: nextCategories, items: nextItems };
}
