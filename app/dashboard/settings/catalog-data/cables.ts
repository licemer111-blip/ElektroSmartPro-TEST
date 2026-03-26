import type { CatalogItem } from "./catalog-item";

export function getCableItems(): CatalogItem[] {
  const items: CatalogItem[] = [];

  // YDYp (Instalacyjny)
  const ydypCores = [2, 3, 4, 5];
  const ydypSections = [1.0, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];
  ydypCores.forEach(cores => {
    ydypSections.forEach(section => {
      const baseMaterialPrice = 2.5 + (section * 0.8) + (cores * 0.5);
      const baseLaborPrice = 1.5 + (section * 0.2);
      items.push({
        name: `Przewód YDYp ${cores}x${section}mm²`,
        category: "Okablowanie",
        unit: "m",
        material_price: Math.round(baseMaterialPrice * 100) / 100,
        labor_price: Math.round(baseLaborPrice * 100) / 100,
      });
    });
  });

  // YKY (Ziemny)
  const ykySections = [4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
  ykySections.forEach(section => {
    const materialPrice = 8 + (section * 1.2);
    items.push({
      name: `Przewód YKY 4x${section}mm² (ziemny)`,
      category: "Okablowanie",
      unit: "m",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 3.5,
    });
  });

  // OMY (Jednożyłowy)
  const omySections = [1.5, 2.5, 4, 6, 10, 16, 25, 35];
  const omyColors = ["żółto-zielony", "niebieski", "brązowy", "czarny"];
  omySections.forEach(section => {
    omyColors.forEach(color => {
      const materialPrice = 1.2 + (section * 0.4);
      items.push({
        name: `Przewód OMY ${section}mm² (${color})`,
        category: "Okablowanie",
        unit: "m",
        material_price: Math.round(materialPrice * 100) / 100,
        labor_price: 0.8,
      });
    });
  });

  // LiYCY (Sterowniczy)
  const liycyCores = [2, 4, 6, 8, 12, 16, 20];
  liycyCores.forEach(cores => {
    const materialPrice = 5 + (cores * 0.8);
    items.push({
      name: `Przewód LiYCY ${cores}x0.5mm² (sterowniczy)`,
      category: "Teletechnika",
      unit: "m",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 2.5,
    });
  });

  return items;
}
