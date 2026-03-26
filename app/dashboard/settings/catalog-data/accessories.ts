import type { CatalogItem } from "./catalog-item";

export function getAccessoryItems(): CatalogItem[] {
  const items: CatalogItem[] = [];

  // Puszki podtynkowe fi60
  const box60Types = ["płytka 40mm", "głęboka 60mm", "głęboka 65mm"];
  box60Types.forEach(type => {
    items.push({
      name: `Puszka podtynkowa fi60 (${type})`,
      category: "Osprzęt",
      unit: "szt",
      material_price: type.includes("płytka") ? 1.2 : 1.8,
      labor_price: 5.0,
    });
  });

  // Puszki KG
  const kgSizes = ["KG 80x80", "KG 100x100", "KG 150x110", "KG 190x140"];
  kgSizes.forEach(size => {
    const materialPrice =
      size === "KG 80x80" ? 3.5 :
      size === "KG 100x100" ? 5.0 :
      size === "KG 150x110" ? 8.0 : 12.0;
    items.push({
      name: `Puszka łączeniowa ${size}`,
      category: "Osprzęt",
      unit: "szt",
      material_price: materialPrice,
      labor_price: 8.0,
    });
  });

  // Puszki natynkowe IP55
  const surfaceBoxes = ["1-krotna", "2-krotna", "3-krotna"];
  surfaceBoxes.forEach(type => {
    const count = parseInt(type);
    items.push({
      name: `Puszka natynkowa IP55 (${type})`,
      category: "Osprzęt",
      unit: "szt",
      material_price: 8 + (count * 2),
      labor_price: 6.0,
    });
  });

  // Gniazda pojedyncze
  const socketTypes = ["z/u (z uziemieniem)", "bez uziemienia", "z klapką", "IP44 (bryzgoszczelne)"];
  const socketSeries = ["Basic", "Premium", "Decor"];
  socketSeries.forEach(series => {
    socketTypes.forEach(type => {
      const basePrice = series === "Basic" ? 8 : series === "Premium" ? 15 : 25;
      const typeMultiplier = type.includes("IP44") ? 1.5 : type.includes("klapką") ? 1.3 : 1.0;
      items.push({
        name: `Gniazdo 230V ${type} (${series})`,
        category: "Osprzęt",
        unit: "szt",
        material_price: Math.round(basePrice * typeMultiplier * 100) / 100,
        labor_price: 8.0,
      });
    });
  });

  // Gniazda podwójne
  socketSeries.forEach(series => {
    const basePrice = series === "Basic" ? 12 : series === "Premium" ? 22 : 35;
    items.push({
      name: `Gniazdo podwójne 230V (${series})`,
      category: "Osprzęt",
      unit: "szt",
      material_price: basePrice,
      labor_price: 10.0,
    });
  });

  // Włączniki
  const switchTypes = ["pojedynczy", "podwójny", "schodowy", "krzyżowy", "żaluzjowy"];
  socketSeries.forEach(series => {
    switchTypes.forEach(type => {
      const basePrice = series === "Basic" ? 6 : series === "Premium" ? 12 : 20;
      const typeMultiplier =
        type === "pojedynczy" ? 1.0 :
        type === "podwójny" ? 1.3 :
        type === "schodowy" ? 1.2 :
        type === "krzyżowy" ? 1.5 : 1.4;
      items.push({
        name: `Włącznik ${type} (${series})`,
        category: "Osprzęt",
        unit: "szt",
        material_price: Math.round(basePrice * typeMultiplier * 100) / 100,
        labor_price: 8.0,
      });
    });
  });

  // Gniazda specjalne
  items.push(
    { name: "Gniazdo USB podwójne (ładowarka)", category: "Osprzęt", unit: "szt", material_price: 45, labor_price: 10 },
    { name: "Gniazdo USB-C (Power Delivery)", category: "Osprzęt", unit: "szt", material_price: 65, labor_price: 10 },
    { name: "Gniazdo antenowe TV/SAT", category: "Teletechnika", unit: "szt", material_price: 18, labor_price: 12 },
    { name: "Gniazdo RJ45 Cat.6 (pojedyncze)", category: "Teletechnika", unit: "szt", material_price: 12, labor_price: 15 },
    { name: "Gniazdo RJ45 Cat.6 (podwójne)", category: "Teletechnika", unit: "szt", material_price: 20, labor_price: 18 },
  );

  // Złączki Wago
  const wagoTypes = [
    { poles: 2, series: "221", price: 0.8 },
    { poles: 3, series: "221", price: 1.2 },
    { poles: 5, series: "221", price: 1.8 },
    { poles: 2, series: "222", price: 0.6 },
    { poles: 3, series: "222", price: 0.9 },
    { poles: 5, series: "222", price: 1.4 },
  ];
  wagoTypes.forEach(wago => {
    items.push({
      name: `Złączka Wago ${wago.series}-${wago.poles} (${wago.poles} przewody)`,
      category: "Akcesoria",
      unit: "szt",
      material_price: wago.price,
      labor_price: 0.5,
    });
  });

  // Tulejki izolacyjne
  const tritits = [0.5, 0.75, 1.0, 1.5, 2.5, 4.0, 6.0];
  tritits.forEach(section => {
    items.push({
      name: `Tulejka izolacyjna (tritit) ${section}mm²`,
      category: "Akcesoria",
      unit: "szt",
      material_price: 0.05,
      labor_price: 0.1,
    });
  });

  // Śruby, kołki i drobnica
  items.push(
    { name: "Wkręt do gipsu 3.5x25mm", category: "Akcesoria", unit: "szt", material_price: 0.05, labor_price: 0.1 },
    { name: "Kołek rozporowy 6x40mm", category: "Akcesoria", unit: "szt", material_price: 0.08, labor_price: 0.15 },
    { name: "Kołek chemiczny 10x85mm", category: "Akcesoria", unit: "szt", material_price: 1.2, labor_price: 2.0 },
    { name: "Taśma izolacyjna PVC", category: "Akcesoria", unit: "szt", material_price: 2.5, labor_price: 0 },
    { name: "Opaska zaciskowa 200mm", category: "Akcesoria", unit: "szt", material_price: 0.15, labor_price: 0.2 },
    { name: "Opaska zaciskowa 300mm", category: "Akcesoria", unit: "szt", material_price: 0.25, labor_price: 0.2 },
  );

  // Listwy zaciskowe
  const terminalBlocks = [6, 10, 16, 25, 35];
  terminalBlocks.forEach(amp => {
    items.push({
      name: `Listwa zaciskowa ${amp}A (12-torowa)`,
      category: "Akcesoria",
      unit: "szt",
      material_price: 8 + (amp * 0.3),
      labor_price: 5.0,
    });
  });

  return items;
}
