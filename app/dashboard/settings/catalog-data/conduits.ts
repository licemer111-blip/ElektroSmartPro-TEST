import type { CatalogItem } from "./catalog-item";

export function getConduitItems(): CatalogItem[] {
  const items: CatalogItem[] = [];

  // Peszel karbowany (320N)
  const peszel320Diameters = [16, 20, 25, 32, 40, 50, 63];
  peszel320Diameters.forEach(diameter => {
    const materialPrice = 1.5 + (diameter * 0.08);
    items.push({
      name: `Peszel karbowany 320N fi${diameter}mm`,
      category: "Trasy kablowe",
      unit: "m",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 2.5,
    });
  });

  // Peszel ciężki (750N)
  const peszel750Diameters = [16, 20, 25, 32, 40, 50];
  peszel750Diameters.forEach(diameter => {
    const materialPrice = 2.5 + (diameter * 0.12);
    items.push({
      name: `Peszel ciężki 750N fi${diameter}mm`,
      category: "Trasy kablowe",
      unit: "m",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 3.0,
    });
  });

  // Korytka kablowe
  const trunkingSizes = [
    { w: 20, h: 20 }, { w: 25, h: 25 }, { w: 40, h: 40 },
    { w: 60, h: 40 }, { w: 60, h: 60 }, { w: 80, h: 60 },
    { w: 100, h: 60 }, { w: 100, h: 100 },
  ];
  trunkingSizes.forEach(size => {
    const materialPrice = 8 + (size.w * 0.15) + (size.h * 0.1);
    items.push({
      name: `Korytko kablowe ${size.w}x${size.h}mm (2m)`,
      category: "Trasy kablowe",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 12.0,
    });
  });

  // Drabinki kablowe
  const ladderWidths = [100, 150, 200, 300, 400, 600];
  ladderWidths.forEach(width => {
    const materialPrice = 25 + (width * 0.2);
    items.push({
      name: `Drabinka kablowa ${width}mm (3m)`,
      category: "Trasy kablowe",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 25.0,
    });
  });

  return items;
}
