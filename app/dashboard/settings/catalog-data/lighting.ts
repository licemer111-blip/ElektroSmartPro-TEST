import type { CatalogItem } from "./catalog-item";

export function getLightingItems(): CatalogItem[] {
  const items: CatalogItem[] = [];

  // Panele LED
  const panelSizes = ["60x60cm 40W", "120x30cm 40W", "120x60cm 60W"];
  panelSizes.forEach(size => {
    const wattage = parseInt(size.match(/\d+W/)?.[0] || "40");
    const materialPrice = 80 + (wattage * 1.2);
    items.push({
      name: `Panel LED ${size} (natynkowy)`,
      category: "Oświetlenie",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 25.0,
    });
    items.push({
      name: `Panel LED ${size} (wpuszczany)`,
      category: "Oświetlenie",
      unit: "szt",
      material_price: Math.round((materialPrice - 10) * 100) / 100,
      labor_price: 30.0,
    });
  });

  // Downlighty LED
  const downlightPowers = [5, 7, 10, 15, 20, 30];
  downlightPowers.forEach(power => {
    const materialPrice = 15 + (power * 2);
    items.push({
      name: `Downlight LED ${power}W (okrągły)`,
      category: "Oświetlenie",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 18.0,
    });
    items.push({
      name: `Downlight LED ${power}W (kwadratowy)`,
      category: "Oświetlenie",
      unit: "szt",
      material_price: Math.round((materialPrice + 5) * 100) / 100,
      labor_price: 18.0,
    });
  });

  // Oprawy przemysłowe
  const industrialPowers = [50, 100, 150, 200];
  industrialPowers.forEach(power => {
    const materialPrice = 120 + (power * 1.5);
    items.push({
      name: `Oprawa przemysłowa LED ${power}W (High Bay)`,
      category: "Oświetlenie",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 40.0,
    });
  });

  // Taśmy LED
  const ledStripTypes = ["SMD2835 60LED/m", "SMD5050 60LED/m", "SMD5050 120LED/m"];
  ledStripTypes.forEach(type => {
    const materialPrice = type.includes("120LED") ? 25 : type.includes("5050") ? 18 : 12;
    items.push({
      name: `Taśma LED ${type} (IP20)`,
      category: "Oświetlenie",
      unit: "m",
      material_price: materialPrice,
      labor_price: 8.0,
    });
    items.push({
      name: `Taśma LED ${type} (IP65)`,
      category: "Oświetlenie",
      unit: "m",
      material_price: materialPrice + 8,
      labor_price: 10.0,
    });
  });

  // Zasilacze LED
  const psuPowers = [30, 60, 100, 150, 200, 300];
  psuPowers.forEach(power => {
    const materialPrice = 40 + (power * 0.4);
    items.push({
      name: `Zasilacz LED 12V ${power}W`,
      category: "Oświetlenie",
      unit: "szt",
      material_price: Math.round(materialPrice * 100) / 100,
      labor_price: 15.0,
    });
  });

  // Moduły Smart Home (Shelly style)
  const shellyModules = [
    { name: "1PM (pomiar mocy)", price: 65 },
    { name: "2.5 (podwójny)", price: 75 },
    { name: "Dimmer 2", price: 85 },
    { name: "RGBW2", price: 95 },
    { name: "Plus 1PM", price: 80 },
    { name: "Pro 4PM", price: 180 },
  ];
  shellyModules.forEach(module => {
    items.push({
      name: `Moduł WiFi ${module.name}`,
      category: "Smart Home",
      unit: "szt",
      material_price: module.price,
      labor_price: 20.0,
    });
  });

  // Czujniki Smart Home
  const sensors = [
    { name: "Czujnik ruchu PIR (sufitowy)", price: 35 },
    { name: "Czujnik ruchu PIR (ścienny)", price: 30 },
    { name: "Czujnik zmierzchu", price: 25 },
    { name: "Czujnik temperatury WiFi", price: 45 },
    { name: "Czujnik wilgotności WiFi", price: 50 },
    { name: "Czujnik otwarcia drzwi/okna", price: 20 },
  ];
  sensors.forEach(sensor => {
    items.push({
      name: sensor.name,
      category: "Smart Home",
      unit: "szt",
      material_price: sensor.price,
      labor_price: 15.0,
    });
  });

  // Sterowniki rolet
  items.push(
    { name: "Sterownik rolet WiFi (1-kanałowy)", category: "Smart Home", unit: "szt", material_price: 120, labor_price: 25 },
    { name: "Sterownik rolet WiFi (2-kanałowy)", category: "Smart Home", unit: "szt", material_price: 180, labor_price: 30 },
    { name: "Silnik do rolet 20Nm", category: "Smart Home", unit: "szt", material_price: 250, labor_price: 80 },
    { name: "Silnik do rolet 40Nm", category: "Smart Home", unit: "szt", material_price: 350, labor_price: 80 },
  );

  // Panele dotykowe
  const touchPanels = [1, 2, 3, 4];
  touchPanels.forEach(channels => {
    items.push({
      name: `Panel dotykowy ${channels}-kanałowy (WiFi)`,
      category: "Smart Home",
      unit: "szt",
      material_price: 80 + (channels * 20),
      labor_price: 20.0,
    });
  });

  return items;
}
