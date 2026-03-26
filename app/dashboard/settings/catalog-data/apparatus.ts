import type { CatalogItem } from "./catalog-item";

export function getApparatusItems(): CatalogItem[] {
  const items: CatalogItem[] = [];

  // Wyłączniki nadprądowe MCB S301 (1P)
  const mcbCurves = ["B", "C", "D"];
  const mcbAmps = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
  mcbCurves.forEach(curve => {
    mcbAmps.forEach(amp => {
      const materialPrice = 12 + (amp * 0.3);
      items.push({
        name: `Wyłącznik S301 ${curve}${amp} (1P)`,
        category: "Rozdzielnice",
        unit: "szt",
        material_price: Math.round(materialPrice * 100) / 100,
        labor_price: 8.0,
      });
    });
  });

  // Wyłączniki 3-fazowe S303
  mcbCurves.forEach(curve => {
    mcbAmps.forEach(amp => {
      const materialPrice = 35 + (amp * 0.8);
      items.push({
        name: `Wyłącznik S303 ${curve}${amp} (3P)`,
        category: "Rozdzielnice",
        unit: "szt",
        material_price: Math.round(materialPrice * 100) / 100,
        labor_price: 12.0,
      });
    });
  });

  // Różnicówki (RCD)
  const rcdPoles = ["2P", "4P"];
  const rcdAmps = [25, 40, 63];
  const rcdSensitivity = [30, 100, 300];
  rcdPoles.forEach(poles => {
    rcdAmps.forEach(amp => {
      rcdSensitivity.forEach(sens => {
        const materialPrice = poles === "2P" ? 80 + (amp * 0.5) : 150 + (amp * 0.8);
        items.push({
          name: `Różnicówka ${poles} ${amp}A ${sens}mA`,
          category: "Rozdzielnice",
          unit: "szt",
          material_price: Math.round(materialPrice * 100) / 100,
          labor_price: 15.0,
        });
      });
    });
  });

  // Rozłączniki izolacyjne
  const isolatorAmps = [25, 40, 63, 80, 100];
  isolatorAmps.forEach(amp => {
    items.push({
      name: `Rozłącznik izolacyjny 3P ${amp}A`,
      category: "Rozdzielnice",
      unit: "szt",
      material_price: 45 + (amp * 0.6),
      labor_price: 10.0,
    });
  });

  // Ograniczniki przepięć (SPD)
  const spdTypes = ["Typ 1+2", "Typ 2", "Typ 3"];
  spdTypes.forEach(type => {
    items.push({
      name: `Ogranicznik przepięć ${type} (1P+N)`,
      category: "Rozdzielnice",
      unit: "szt",
      material_price: type === "Typ 1+2" ? 180 : type === "Typ 2" ? 120 : 60,
      labor_price: 12.0,
    });
  });

  // Rozdzielnice natynkowe
  const surfaceBoards = [12, 18, 24, 36, 48];
  surfaceBoards.forEach(modules => {
    const materialPrice = 80 + (modules * 3);
    items.push({
      name: `Rozdzielnica natynkowa ${modules} modułów (IP40)`,
      category: "Rozdzielnice",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 60.0,
    });
    items.push({
      name: `Rozdzielnica natynkowa ${modules} modułów (IP65)`,
      category: "Rozdzielnice",
      unit: "szt",
      material_price: Math.round((materialPrice + 40) * 100) / 100,
      labor_price: 70.0,
    });
  });

  // Rozdzielnice podtynkowe
  const flushBoards = [12, 18, 24, 36];
  flushBoards.forEach(modules => {
    const materialPrice = 60 + (modules * 2.5);
    items.push({
      name: `Rozdzielnica podtynkowa ${modules} modułów`,
      category: "Rozdzielnice",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 80.0,
    });
  });

  // Szafy rozdzielcze
  const cabinetSizes = [
    { h: 400, w: 300, d: 200 },
    { h: 600, w: 400, d: 200 },
    { h: 800, w: 600, d: 300 },
    { h: 1200, w: 800, d: 400 },
  ];
  cabinetSizes.forEach(size => {
    const materialPrice = 300 + (size.h * 0.5) + (size.w * 0.3);
    items.push({
      name: `Szafa rozdzielcza ${size.h}x${size.w}x${size.d}mm (IP54)`,
      category: "Rozdzielnice",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 150.0,
    });
  });

  return items;
}
