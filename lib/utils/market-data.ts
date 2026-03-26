/**
 * Dynamic Market Data Generator
 * 
 * Generates pseudo-live market data based on current date.
 * Uses deterministic fluctuations so data is consistent within the same day
 * but changes over time to simulate a living market.
 */

// Base anchor values (our "ground truth")
const BASE_REGIONAL_RATES = [
  { region: "Mazowieckie", basePrice: 160 },
  { region: "Małopolskie", basePrice: 145 },
  { region: "Śląskie", basePrice: 142 },
  { region: "Dolnośląskie", basePrice: 138 },
  { region: "Wielkopolskie", basePrice: 135 },
];

const BASE_MATERIAL_PRICES = [
  { name: "Miedź (kabel)", basePrice: 100, volatility: "high" }, // High volatility
  { name: "Kabel YKY 3x2,5mm", basePrice: 4.5, volatility: "high" },
  { name: "Gniazda / Wyłączniki", basePrice: 15, volatility: "medium" },
  { name: "Puszki podtynkowe", basePrice: 2.5, volatility: "low" },
];

const BASE_TRENDING_SERVICES = [
  { name: "Instalacje Fotowoltaiczne", baseGrowth: 15 },
  { name: "Smart Home / Automatyka", baseGrowth: 10 },
  { name: "Pompy Ciepła (instalacja elektryczna)", baseGrowth: 8 },
  { name: "Ładowarki EV (wallbox)", baseGrowth: 12 },
  { name: "Modernizacja tablic rozdzielczych", baseGrowth: 5 },
];

/**
 * Get day of year (1-365)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get week number (1-52)
 */
function getWeekNumber(date: Date): number {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
}

/**
 * Calculate fluctuation using sine wave for smooth, cyclical changes
 * @param seed - Unique seed for this data point (e.g., day of year + item index)
 * @param amplitude - Max fluctuation percentage (e.g., 0.05 for ±5%)
 * @returns Multiplier (e.g., 0.97 to 1.03 for ±3%)
 */
function calculateFluctuation(seed: number, amplitude: number): number {
  // Use sine wave for smooth cyclical fluctuation
  const fluctuation = Math.sin(seed * 0.1) * amplitude;
  return 1 + fluctuation;
}

/**
 * Determine trend direction and change percentage
 */
function getTrendData(currentPrice: number, basePrice: number): {
  trend: "up" | "down" | "stable";
  change: string;
} {
  const diff = currentPrice - basePrice;
  const percentChange = (diff / basePrice) * 100;

  if (Math.abs(percentChange) < 0.5) {
    return { trend: "stable", change: "0%" };
  } else if (percentChange > 0) {
    return { trend: "up", change: `+${percentChange.toFixed(1)}%` };
  } else {
    return { trend: "down", change: `${percentChange.toFixed(1)}%` };
  }
}

/**
 * Get live regional labor rates with weekly fluctuations (low volatility)
 */
export function getLiveRegionalRates() {
  const now = new Date();
  const weekNumber = getWeekNumber(now);

  return BASE_REGIONAL_RATES.map((region, index) => {
    // Labor rates change weekly with ±3% volatility
    const seed = weekNumber + index * 7; // Unique seed per region
    const fluctuation = calculateFluctuation(seed, 0.03); // ±3%
    const currentPrice = Math.round(region.basePrice * fluctuation);

    const trendData = getTrendData(currentPrice, region.basePrice);

    return {
      region: region.region,
      avgPrice: currentPrice,
      basePrice: region.basePrice,
      change: trendData.change,
      trend: trendData.trend,
    };
  });
}

/**
 * Get live material prices with daily fluctuations (high volatility for copper/cable)
 */
export function getLiveMaterialPrices() {
  const now = new Date();
  const dayOfYear = getDayOfYear(now);

  return BASE_MATERIAL_PRICES.map((material, index) => {
    // Different volatility based on material type
    let amplitude = 0.03; // Default ±3%
    if (material.volatility === "high") {
      amplitude = 0.05; // ±5% for copper/cable
    } else if (material.volatility === "low") {
      amplitude = 0.01; // ±1% for stable items
    }

    const seed = dayOfYear + index * 13; // Unique seed per material
    const fluctuation = calculateFluctuation(seed, amplitude);
    const currentPrice = material.basePrice * fluctuation;

    const trendData = getTrendData(currentPrice, material.basePrice);

    // Determine status text
    let status = "Stabilnie";
    let color = "text-slate-600";
    if (trendData.trend === "up") {
      status = "Wzrost";
      color = "text-red-600";
    } else if (trendData.trend === "down") {
      status = "Spadek";
      color = "text-green-600";
    }

    return {
      name: material.name,
      status,
      change: trendData.change,
      trend: trendData.trend,
      color,
      currentPrice: currentPrice.toFixed(2),
      basePrice: material.basePrice.toFixed(2),
    };
  });
}

/**
 * Get live trending services with monthly fluctuations
 */
export function getLiveTrendingServices() {
  const now = new Date();
  const monthNumber = now.getMonth() + 1; // 1-12

  return BASE_TRENDING_SERVICES.map((service, index) => {
    // Services trend changes monthly with ±2% volatility
    const seed = monthNumber + index * 5;
    const fluctuation = calculateFluctuation(seed, 0.02); // ±2%
    const currentGrowth = service.baseGrowth * fluctuation;

    // Determine if "hot" (growth > 10%)
    const hot = currentGrowth >= 10;

    return {
      name: service.name,
      growth: `+${currentGrowth.toFixed(0)}%`,
      hot,
      currentGrowth: currentGrowth.toFixed(1),
      baseGrowth: service.baseGrowth,
    };
  });
}

/**
 * Get complete live market data
 */
export function getLiveMarketData() {
  return {
    regionalRates: getLiveRegionalRates(),
    materialPrices: getLiveMaterialPrices(),
    trendingServices: getLiveTrendingServices(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Format date for display (e.g., "11 stycznia 2026")
 */
export function getMarketDataDate(): string {
  const now = new Date();
  const months = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
  ];
  
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
