/**
 * Market Price Data
 * Static data lives in lib/data/json/market-data.json
 * This file re-exports typed constants and utility functions.
 */

import rawData from "./json/market-data.json";

export interface MarketItem {
  id: string;
  name: string;
  category: "material" | "labor" | "equipment";
  basePrice: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendPercent: number;
}

export const REGIONAL_MODIFIERS: Record<string, number> = rawData.REGIONAL_MODIFIERS as Record<string, number>;

export const MARKET_DATA: MarketItem[] = rawData.MARKET_DATA as MarketItem[];

export function getRegionalPrice(basePrice: number, region: string): number {
  const modifier = REGIONAL_MODIFIERS[region] || 1.0;
  return basePrice * modifier;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} zl`;
}

export function getCategoryLabel(category: MarketItem["category"]): string {
  const labels = {
    material: "Material",
    labor: "Robocizna",
    equipment: "Rozdzielnica",
  };
  return labels[category];
}

export function getCategoryColor(category: MarketItem["category"]): string {
  const colors = {
    material: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    labor: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
    equipment: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700",
  };
  return colors[category];
}

export function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

export function getWeeklySummary() {
  const copperCables = MARKET_DATA.filter(item =>
    item.category === "material" &&
    (item.name.includes("YDYp") || item.name.includes("NYM") || item.name.includes("YKY"))
  );
  const avgCopperTrend = copperCables.reduce((sum, item) => sum + item.trendPercent, 0) / copperCables.length;

  const labor = MARKET_DATA.filter(item => item.category === "labor");
  const avgLaborTrend = labor.reduce((sum, item) => sum + item.trendPercent, 0) / labor.length;

  const devices = MARKET_DATA.filter(item =>
    item.category === "material" &&
    (item.name.includes("Gniazdo") || item.name.includes("Lacznik") || item.name.includes("Puszka"))
  );
  const avgDevicesTrend = devices.reduce((sum, item) => sum + item.trendPercent, 0) / devices.length;

  return {
    copper: avgCopperTrend,
    labor: avgLaborTrend,
    devices: avgDevicesTrend,
  };
}
