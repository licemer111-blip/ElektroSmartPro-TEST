/**
 * Market Trends Utility
 * Generates deterministic weekly trends based on item ID and current week
 */

import { getCurrentWeek } from "@/lib/data/market-data";

export type TrendDirection = "up" | "down" | "stable";

export interface WeeklyTrend {
  value: number; // Percentage change (-10 to +10)
  direction: TrendDirection;
}

/**
 * Simple hash function for deterministic randomness
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator (0-1)
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Get weekly trend for an item
 * Uses item ID + week number as seed for deterministic results
 * 
 * @param itemId - Unique item identifier
 * @returns WeeklyTrend object with value and direction
 */
export function getWeeklyTrend(itemId: string): WeeklyTrend {
  const currentWeek = getCurrentWeek();
  
  // Create seed from item ID + week number
  const seed = hashString(`${itemId}-${currentWeek}`);
  
  // Generate random value between -10 and +10
  const random = seededRandom(seed);
  const value = (random * 20) - 10; // Range: -10 to +10
  
  // Determine direction
  let direction: TrendDirection;
  if (value > 1) {
    direction = "up";
  } else if (value < -1) {
    direction = "down";
  } else {
    direction = "stable";
  }
  
  return {
    value: Number(value.toFixed(1)),
    direction,
  };
}

/**
 * Format trend value for display
 */
export function formatTrendValue(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get trend color class
 */
export function getTrendColorClass(direction: TrendDirection): string {
  switch (direction) {
    case "up":
      return "text-green-600 dark:text-green-400";
    case "down":
      return "text-red-600 dark:text-red-400";
    case "stable":
      return "text-slate-500 dark:text-slate-400";
  }
}

/**
 * Get trend background color class
 */
export function getTrendBgClass(direction: TrendDirection): string {
  switch (direction) {
    case "up":
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    case "down":
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    case "stable":
      return "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800";
  }
}

export interface VoivodeshipWeeklyData {
  id: string;
  weeklyDelta: number;      // weekly change in % points, e.g. +1.2
  weeklyDirection: TrendDirection;
}

/**
 * Get weekly delta for a voivodeship (small realistic change each week)
 * Range: -2.5% to +2.5% per week, deterministic by voivodeship+week
 */
export function getVoivodeshipWeeklyDelta(voivodeshipId: string): VoivodeshipWeeklyData {
  const week = getCurrentWeek();
  const seed = hashString(`voiv-${voivodeshipId}-w${week}`);
  const rand = seededRandom(seed);
  // Bias slightly positive (realistic market: more up than down)
  const raw = rand * 5 - 2;    // -2.0 to +3.0
  const delta = Number(raw.toFixed(1));
  const direction: TrendDirection = delta > 0.3 ? "up" : delta < -0.3 ? "down" : "stable";
  return { id: voivodeshipId, weeklyDelta: delta, weeklyDirection: direction };
}

export interface MarketPageTrends {
  laborTrend: number;         // e.g. +2.8
  materialTrend: number;      // e.g. +4.2
  stablePct: number;          // e.g. 68
  upPct: number;              // e.g. 24
  downPct: number;            // e.g. 8
  lastUpdateDay: string;      // e.g. "Poniedziałek"
}

const DAY_NAMES_PL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

/**
 * Generate deterministic market page KPI trends for the current week
 */
export function getMarketPageTrends(): MarketPageTrends {
  const week = getCurrentWeek();

  const laborRand = seededRandom(hashString(`labor-trend-w${week}`));
  const materialRand = seededRandom(hashString(`material-trend-w${week}`));
  const activityRand = seededRandom(hashString(`activity-w${week}`));

  // Labor: realistic range +0.5% to +4.5% (always slightly positive for Polish market)
  const laborTrend = Number((laborRand * 4 + 0.5).toFixed(1));
  // Materials: range -1% to +6% (can go negative — miedź/cables volatile)
  const materialTrend = Number((materialRand * 7 - 1).toFixed(1));

  // Activity distribution: stable 55-75%, up 15-30%, down remainder
  const stablePct = Math.round(55 + activityRand * 20);
  const upRand = seededRandom(hashString(`up-pct-w${week}`));
  const upPct = Math.round(15 + upRand * 15);
  const downPct = 100 - stablePct - upPct;

  // Update day: always Monday of current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const lastUpdateDay = DAY_NAMES_PL[monday.getDay()];

  return { laborTrend, materialTrend, stablePct, upPct, downPct, lastUpdateDay };
}
