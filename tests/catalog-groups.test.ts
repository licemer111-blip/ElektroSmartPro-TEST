import { describe, expect, it } from "vitest";
import { categoryGroupKey, itemGroupKey, pickCategoryId, regroupCatalogItems } from "@/lib/catalog/catalog-groups";

describe("catalog groups", () => {
  const categories = [
    { id: "cab", name: "Okablowanie" },
    { id: "acc", name: "Osprzęt elektryczny" },
    { id: "light", name: "Oświetlenie" },
    { id: "lan", name: "Okablowanie strukturalne" },
  ];

  it("keeps a power cable in cabling and a socket in accessories", () => {
    expect(itemGroupKey("Montaż YDYp 3x2,5 w bruździe")).toBe("okablowanie");
    expect(itemGroupKey("Montaż gniazda pojedynczego")).toBe("osprzet");
    expect(itemGroupKey("Montaż łącznika schodowego")).toBe("osprzet");
    expect(itemGroupKey("Kabel gniazdkowy YDY 3x2,5")).toBe("okablowanie");
    expect(itemGroupKey("Wyłącznik nadprądowy B16")).toBe("rozdzielnice");
    expect(itemGroupKey("Pomiar rezystancji izolacji")).toBe("pomiary");
    expect(itemGroupKey("Uziom szpilkowy")).toBe("uziemienie");
    expect(itemGroupKey("Oprawa awaryjna LED")).toBe("awaryjne");
    expect(categoryGroupKey("Okablowanie strukturalne")).toBe("teletechnika");
    expect(pickCategoryId(categories, "okablowanie")).toBe("cab");
  });

  it("moves a socket out of the cable folder", () => {
    const result = regroupCatalogItems(categories, [
      { id: "1", user_id: null, category_id: "cab", name: "Montaż gniazda podwójnego" },
      { id: "2", user_id: null, category_id: "cab", name: "Montaż YDYp 3x1,5" },
      { id: "3", user_id: "user", category_id: "cab", name: "Moje gniazdo specjalne" },
    ]);
    const byId = Object.fromEntries(result.items.map((item) => [item.id, item.category_id]));
    expect(byId["1"]).toBe("acc");
    expect(byId["2"]).toBe("cab");
    expect(byId["3"]).toBe("cab");
  });
});
