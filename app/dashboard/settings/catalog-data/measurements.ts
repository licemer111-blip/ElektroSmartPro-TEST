import type { CatalogItem } from "./catalog-item";

export function getMeasurementItems(): CatalogItem[] {
  return [
    { name: "Pomiar rezystancji izolacji (obwód 1-faz)", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 18 },
    { name: "Pomiar rezystancji izolacji (obwód 3-faz)", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 28 },
    { name: "Pomiar impedancji pętli zwarcia", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 18 },
    { name: "Badanie wyłączników RCD (czas/prąd)", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 28 },
    { name: "Pomiar natężenia oświetlenia", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 25 },
    { name: "Pomiar uziemienia (rezystancja)", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 35 },
    { name: "Termowizja rozdzielnicy", category: "Pomiary", unit: "szt", material_price: 0, labor_price: 150 },
    { name: "Protokół pomiarowy (komplet)", category: "Pomiary", unit: "kpl", material_price: 0, labor_price: 200 },
    { name: "Dokumentacja powykonawcza", category: "Pomiary", unit: "kpl", material_price: 0, labor_price: 600 },
  ];
}
